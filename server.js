import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

let channels = [];
try {
  channels = JSON.parse(fs.readFileSync('./channels.json', 'utf-8'));
} catch (err) {
  console.error('Error channels.json:', err.message);
}

// Inicializar lista en memoria para servir de inmediato sin esperar scraping
let latestRanks = channels.map((c, i) => ({
  id: c.id,
  name: c.name,
  avatar: c.avatar,
  thumbnail: c.avatar,
  title: 'Cargando estado...',
  isLive: false,
  totalViewers: 0,
  anomaly: { anomaly: false, delta: 0 },
  platforms: {
    twitch: { active: false, viewers: 0 },
    kick: { active: false, viewers: 0 },
    youtube: { active: false, viewers: 0 }
  }
}));

const telemetryHistory = new Map();

async function fetchTwitch(login) {
  if (!login) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const query = 'query GetStreamInfo(\(login: String!) { user(login:\)login) { stream { viewersCount title game { name } } } }';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables: { login: login.toLowerCase() } })
    });
    clearTimeout(timeout);
    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    const { data } = await res.json();
    const stream = data?.user?.stream;
    if (!stream) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    return {
      isLive: true,
      viewers: stream.viewersCount || 0,
      title: stream.title || 'Twitch Stream',
      thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login.toLowerCase()}-640x360.jpg`
    };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

async function fetchKick(slug) {
  if (!slug) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://kick.com/api/v2/channels/${slug.toLowerCase()}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    clearTimeout(timeout);
    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    const data = await res.json();
    const stream = data?.livestream;
    if (!stream || !stream.is_live) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    return {
      isLive: true,
      viewers: stream.viewer_count || 0,
      title: stream.session_title || 'Kick Stream',
      thumbnail: stream.thumbnail?.url || ''
    };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

async function fetchYouTube(handle) {
  if (!handle) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const clean = handle.replace('@', '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`https://www.youtube.com/@${clean}/live`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
      }
    });
    clearTimeout(timeout);
    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    const html = await res.text();

    if (html.includes('"status":"UPCOMING"') || html.includes('"upcomingEventData"')) {
      return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    }

    const isLive = html.includes('"isLive":true') || html.includes('{"text":" mirando"}') || html.includes('{"text":" watching"}');
    if (!isLive) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    let viewers = 0;
    const matchViewers = html.match(/"viewCount":\s*\{\s*"videoViewCountRenderer":\s*\{\s*"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
    if (matchViewers && matchViewers[1]) {
      viewers = parseInt(matchViewers[1].replace(/[^0-9]/g, ''), 10) || 0;
    }
    if (viewers < 15) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    let thumbnail = '';
    const matchId = html.match(/"videoId":"([^"]+)"/);
    if (matchId && matchId[1]) {
      thumbnail = `https://i.ytimg.com/vi/${matchId[1]}/hqdefault.jpg`;
    }

    let title = 'Transmisión en Vivo';
    const matchTitle = html.match(/(.*?)<\/title>/);
    if (matchTitle && matchTitle[1]) {
      title = matchTitle[1].replace(' - YouTube', '').trim();
    }

    return { isLive: true, viewers, title, thumbnail };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

function detectAnomaly(id, current) {
  const now = Date.now();
  if (!telemetryHistory.has(id)) {
    telemetryHistory.set(id, [{ t: now, v: current }]);
    return { anomaly: false, delta: 0 };
  }
  const hist = telemetryHistory.get(id);
  const prev = hist[hist.length - 1];
  const delta = current - prev.v;
  const dt = (now - prev.t) / 1000;
  hist.push({ t: now, v: current });
  if (hist.length > 30) hist.shift();
  if (delta > 3500 && dt <= 45) {
    return { anomaly: true, delta };
  }
  return { anomaly: false, delta: 0 };
}

let isPolling = false;
async function runLoop() {
  if (isPolling) return;
  isPolling = true;
  try {
    const list = await Promise.all(
      channels.map(async (c) => {
        const [tw, ki, yt] = await Promise.all([
          fetchTwitch(c.channels.twitch),
          fetchKick(c.channels.kick),
          fetchYouTube(c.channels.youtube)
        ]);

        const total = (tw.isLive ? tw.viewers : 0) + (ki.isLive ? ki.viewers : 0) + (yt.isLive ? yt.viewers : 0);
        const live = tw.isLive || ki.isLive || yt.isLive;
        const activeThumbnail = yt.thumbnail || tw.thumbnail || ki.thumbnail || c.avatar;
        const activeTitle = yt.title || tw.title || ki.title || (live ? 'En Vivo' : 'Offline');

        return {
          id: c.id,
          name: c.name,
          avatar: c.avatar,
          thumbnail: activeThumbnail,
          title: activeTitle,
          isLive: live,
          totalViewers: total,
          anomaly: live ? detectAnomaly(c.id, total) : { anomaly: false, delta: 0 },
          platforms: {
            twitch: { active: tw.isLive, viewers: tw.viewers },
            kick: { active: ki.isLive, viewers: ki.viewers },
            youtube: { active: yt.isLive, viewers: yt.viewers }
          }
        };
      })
    );

    latestRanks = list.sort((a, b) => (b.isLive - a.isLive) || (b.totalViewers - a.totalViewers));
    console.log(`[StreamRank] Telemetría OK | En vivo: ${latestRanks.filter(x => x.isLive).length}`);
  } catch (e) {
    console.error('[StreamRank] Loop error:', e.message);
  } finally {
    isPolling = false;
  }
}

// Iniciar servidor de inmediato
app.listen(PORT, () => {
  console.log(`StreamRank listo en puerto ${PORT}`);
  // El bucle corre en background sin bloquear peticiones entrantes
  runLoop();
  setInterval(runLoop, 20000);
});

app.get('/api/ranks', (req, res) => {
  res.json({ status: 'ok', data: latestRanks });
});

const UI_BASE64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVzIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+U3RyZWFtUmFuayBBcmdlbnRpbmE8L3RpdGxlPgogIDxzY3JpcHQgc3JjPSJodHRwczovL2Nkbi50YWlsd2luZGNzcy5jb20iPjwvc2NyaXB0PgogIDxzdHlsZT4KICAgIGJvZHkgeyBiYWNrZ3JvdW5kLWNvbG9yOiAjMGIwZjE5OyBmb250LWZhbWlseTogc3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCBzYW5zLXNlcmlmOyB9CiAgICAubGl2ZS1wdWxzZSB7IGFuaW1hdGlvbjogcCAxLjVzIGluZmluaXRlOyB9CiAgICBAa2V5ZnJhbWVzIHAgeyAwJSwgMTAwJSB7IG9wYWNpdHk6IDE7IH0gNTAlIHsgb3BhY2l0eTogMC40OyB9IH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5IGNsYXNzPSJ0ZXh0LXNsYXRlLTEwMCBtaW4taC1zY3JlZW4gZmxleCBmbGV4LWNvbCI+CiAgPGhlYWRlciBjbGFzcz0iYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTgwMCBiZy1zbGF0ZS05MDAvODAgc3RpY2t5IHRvcC0wIHotNTAiPgogICAgPGRpdiBjbGFzcz0ibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTtweC02IGgtMTYgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIj4KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMiPgogICAgICAgIDxkaXYgY2xhc3M9InctMy41IGgtMy41IHJvdW5kZWQtZnVsbCBiZy1lbWVyYWxkLTUwMCBsaXZlLXB1bHNlIj48L2Rpdj4KICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14bCBzbTp0ZXh0LTJ4bCBmb250LWV4dHJhYm9sZCB0ZXh0LXdoaXRlIj5TdHJlYW1SYW5rIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGJnLWluZGlnby05MDAgdGV4dC1pbmRpZ28tMzAwIHB4LTIgcHktMC41IHJvdW5kZWQgbWwtMSI+QVJHPC9zcGFuPjwvc3Bhbj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC00IHRleHQteHMiPgogICAgICAgIDxkaXYgaWQ9ImNudCIgY2xhc3M9ImJnLXNsYXRlLTgwMCBweC0zLjUgcHktMS41IHJvdW5kZWQtZnVsbCBmb250LXNlbWlib2xkIHRleHQtZW1lcmFsZC00MDAiPjAgZW4gdml2bzwvZGl2PgogICAgICA8L2Rpdj4KICAgIDwvZGl2PgogIDwvaGVhZGVyPgoKICA8ZGl2IGNsYXNzPSJiZy1zbGF0ZS05MDAvNDAgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTgwMC81MCBweS0yLjUiPgogICAgPGRpdiBjbGFzcz0ibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTtweC02IGZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtc3RhcnQgc206aXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIj4KICAgICAgPGRpdj5NZXRyaWNhcyBkZSBhdWRpZW5jaWEgZW4gdGllbXBvIHJlYWwgZGUgVHdpdGNoLCBLaWNrIHkgWW91VHViZTwvZGl2PgogICAgICA8ZGl2IGlkPSJmdWxsRGF0ZSIgY2xhc3M9InRleHQtaW5kaWdvLTMwMCI+U2luY3Jvbml6YW5kbyBmZWNoYSB5IGhvcmEuLi48L2Rpdj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8bWFpbiBjbGFzcz0ibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTtweC02IHB5LTggZmxleC0xIHctZnVsbCI+CiAgICA8ZGl2IGNsYXNzPSJtYi04IHctZnVsbCBoLTI0IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1kYXNoZWQgYm9yZGVyLXNsYXRlLTgwMCBiZy1zbGF0ZS05MDAvMjAgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1zbGF0ZS01MDAiPgogICAgICA8c3BhbiBjbGFzcz0idGV4dC14cyB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVzdCI+RXNwYWNpbyBQdWJsaWNpdGFyaW88L3NwYW4+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJtYi02IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiI+CiAgICAgIDxoMiBjbGFzcz0idGV4dC14bCBzbTp0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC13aGl0ZSI+VHJhbnNtaXNpb25lcyBkZWwgTW9tZW50bzwvaDI+CiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIj5TZSBhY3R1YWxpemEgY2FkYSAyMHMgYXV0b23DoXRpY2FtZW50ZTwvc3Bhbj4KICAgIDwvZGl2PgoKICAgIDxkaXYgaWQ9ImdyaWQiIGNsYXNzPSJncmlkIGdyaWQtY29scy0xIHNtOmdyaWQtY29scy0yIGxnOmdyaWQtY29scy0zIGdhcC02Ij4KICAgIDwvZGl2PgogIDwvbWFpbj4KCiAgPHNjcmlwdD4KICAgIGNvbnN0IGdyZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdncmlkJyk7CiAgICBjb25zdCBjbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY250Jyk7CiAgICBjb25zdCBmdWxsRGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmdWxsRGF0ZScpOwogICAgY29uc3QgZm10ID0gKG4pID0+IG5ldyBJbnRsLk51bWJlckZvcm1hdCgnZXMtQVInKS5mb3JtYXQobik7CgogICAgZnVuY3Rpb24gdXBkYXRlQ2xvY2soKSB7CiAgICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7CiAgICAgIGZ1bGxEYXRlLnRleHRDb250ZW50ID0gbm93LnRvTG9jYWxlRGF0ZVN0cmluZygnZXMtQVInLCB7IHdlZWtkYXk6ICdsb25nJywgeWVhcjogJ251bWVyaWMnLCBtb250aDogJ2xvbmcnLCBkYXk6ICdudW1lcmljJyB9KSArICcgwrcgJyArIG5vdy50b0xvY2FsZVRpbWVTdHJpbmcoJ2VzLUFSJyk7CiAgICB9CgogICAgYXN5bmMgZnVuY3Rpb24gcnVuKCkgewogICAgICB0cnkgewogICAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCgnL2FwaS9yYW5rcycpOwogICAgICAgIGNvbnN0IGkgPSBhd2FpdCByLmpzb24oKTsKICAgICAgICBjb25zdCBsID0gaS5kYXRhIHx8IFtdOwogICAgICAgIGNvbnN0IGxpdmVzID0gbC5maWx0ZXIoeCA9PiB4LmlzTGl2ZSk7CgogICAgICAgIGNudC50ZXh0Q29udGVudCA9IGxpdmVzLmxlbmd0aCArICcgZW4gdml2byc7CiAgICAgICAgdXBkYXRlQ2xvY2soKTsKCiAgICAgICAgaWYgKCFsLmxlbmd0aCkgcmV0dXJuOwoKICAgICAgICBncmQuaW5uZXJIVE1MID0gbC5tYXAoKHMsIGlkeCkgPT4gewogICAgICAgICAgY29uc3QgaXNMaXZlID0gcy5pc0xpdmU7CiAgICAgICAgICBjb25zdCByYW5rTnVtID0gaWR4ICsgMTsKICAgICAgICAgIGNvbnN0IGFuID0gKHMubm9tYWx5ICYmIHMuYW5vbWFseS5hbm9tYWx5KSA/ICc8ZGl2IGNsYXNzPSJtdC0yIGlucGxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgcHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIj7imqDvuI8gUElDTyBBTsOTTUFMTyAoKycgKyBmbXQocy5hbm9tYWx5LmRlbHRhKSArICcpPC9kaXY+JyA6ICcnOwoKICAgICAgICAgIGxldCBwbGF0cyA9ICcnOwogICAgICAgICAgaWYgKHMucGxhdGZvcm1zLnR3aXRjaC5hY3RpdmUpIHBsYXRzICs9ICc8c3BhbiBjbGFzcz0icHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMXB4XSBiZy1wdXJwbGUtOTUwIHRleHQtcHVycGxlLTMwMCBib3JkZXIgYm9yZGVyLXB1cnBsZS03MDAiPlR3aXRjaDwvc3Bhbj4gJzsKICAgICAgICAgIGlmIChzLnBsYXRmb3Jtcy5raWNrLmFjdGl2ZSkgcGxhdHMgKz0gJzxzcGFuIGNsYXNzPSJweC0yIHB5LTAuNSByb3VuZGVkIHRleHQteHMgYmctZW1lcmFsZC05NTAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNzAwIj5LaWNrPC9zcGFuPiAnOwogICAgICAgICAgaWYgKHMucGxhdGZvcm1zLnlvdXR1YmUuYWN0aXZlKSBwbGF0cyArPSAnPHNwYW4gY2xhc3M9InB4LTIgcHktMC41IHJvdW5kZWQgdGV4dC1bMTFweF0gYmctcmVkLTk1MCB0ZXh0LXJlZC0zMDAgYm9yZGVyIGJvcmRlci1yZWQtNzAwIj5Zb3VUdWJlPC9zcGFuPiAnOwoKICAgICAgICAgIGNvbnN0IGNhcmRTdHlsZSA9IGlzTGl2ZSA/ICdib3JkZXItc2xhdGUtODAwIGJnLXNsYXRlLTkwMC82MCcgOiAnYm9yZGVyLXNsYXRlLTkwMCBiZy1zbGF0ZS05NTAvNDAgb3BhY2l0eS01MCc7CiAgICAgICAgICBjb25zdCBwb3NDb2xvciA9IHJhbmtOdW0gPD0gM3tpc0xpdmU/J3RleHQtYW1iZXItNDAwJzondGV4dC1zbGF0ZS00MDAnfSA6ICd0ZXh0LXNsYXRlLTQwMCc7CgogICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPSJmbGV4IGZsZXgtY29sIHJvdW5kZWQteGwgYm9yZGVyICcgKyBjYXJkU3R5bGUgKyAnIG92ZXJmbG93LWhpZGRlbiI+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJyZWxhdGl2ZSBhc3BlY3QtdmlkZW8gdy1mdWxsIGJnLXNsYXRlLTk1MCI+JyArCiAgICAgICAgICAgICAgJzxpbWcgc3JjPSInICsgcy50aHVtYm5haWwgKyAnIiBjbGFzcz0idy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIiIG9uZXJyb3I9InRoaXMuc3JjPVwnJyArIHMuYXZhdGFyICsgJ1wnIj4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iYWJzb2x1dGUgdG9wLTMgbGVmdC0zIHB4LTIuNSBweS0xIHJvdW5kZWQtbWQgYmctYmxhY2svNzAgYmFja2Ryb3AtYmx1ciBmb250LWV4dHJhYm9sZCB0ZXh0LXhzICcgKyBwb3NDb2xvciArICcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCI+IycgKyByYW5rTnVtICsgJzwvZGl2PicgKwogICAgICAgICAgICAgIChpc0xpdmUgPyAnPGRpdiBjbGFzcz0iYWJzb2x1dGUgdG9wLTMgcmlnaHQtMyBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHB4LTIuNSBweS0xIHJvdW5kZWQtbWQgYmctcmVkLTYwMCB0ZXh0LXdoaXRlIGZvbnQtYm9sZCB0ZXh0LXhzIj48c3BhbiBjbGFzcz0idy0yIGgtMiByb3VuZGVkLWZ1bGwgYmctd2hpdGUgbGl2ZS1wdWxzZSI+PC9zcGFuPiBFTiBWSVZPPC9kaXY+JyA6ICc8ZGl2IGNsYXNzPSJhYnNvbHV0ZSB0b3AtMyByaWdodC0zIHB4LTIgcHktMC41IHJvdW5kZWQtbWQgYmctc2xhdGUtODAwIHRleHQtc2xhdGUtNDAwIHRleHQteHMiPk9GRkxJTkU8L2Rpdj4nKSArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImFic29sdXRlIGJvdHRvbS0wIHctZnVsbCBweC0zIHB5LTIgYmctZ3JhZGllbnQtdG8tdCBmcm9tLWJsYWNrLzkwIHZpYS1ibGFjay81MCB0by10cmFuc3BhcmVudCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPicgKwogICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJ0ZXh0LXNtIGZvbnQtYm9sZCAnICsgKGlzTGl2ZSA/ICd0ZXh0LXdoaXRlJyA6ICd0ZXh0LXNsYXRlLTQwMCcpICsgJyI+JyArIChpc0xpdmUgPyBmbXQocy50b3RhbFZpZXdlcnMpICsgJyBlc3BlY3RhZG9yZXMnIDogJ0Rlc2NvbmVjdGFkbycpICsgJzwvc3Bhbj4nICsKICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJmbGV4IGdhcC0xIj4nICsgKGlzTGl2ZSA/IHBsYXRzIDogJycpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgICAgJzwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0icC00IGZsZXggZ2FwLTMgaXRlbXMtc3RhcnQiPicgKwogICAgICAgICAgICAgICc8aW1nIHNyYz0iJyArIHMuYXZhdGFyICsgJyIgY2xhc3M9InctMTEgaC0xMSByb3VuZGVkLWZ1bGwgb2JqZWN0LWNvdmVyIGJnLXNsYXRlLTgwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCBmbGV4LXNocmluay0wIiBvbmVycm9yPSJ0aGlzLnNyYz1cImh0dHBzOi8vdWktYXZhdGFycy5jb20vYXBpLz9uYW1lPScgKyBlbmNvZGVVUklDb21wb25lbnQocy5uYW1lKSArICdcIiI+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9Im1pbi13LTAgZmxleC0xIj4nICsKICAgICAgICAgICAgICAgICc8aDMgY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXNtIHNtOnRleHQtYmFzZSB0ZXh0LXdoaXRlIHRydW5jYXRlIj4nICsgcy5uYW1lICsgJzwvaDM+JyArCiAgICAgICAgICAgICAgICAnPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS00MDAgbGluZS1jbGFtcC0yIG10LTAuNSIgdGl0bGU9IicgKyBzLnRpdGxlICsgJyI+JyArIHMudGl0bGUgKyAnPC9wPicgKwogICAgICAgICAgICAgICAgYW4gKwogICAgICAgICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgICAgJzwvZGl2PicgKwogICAgICAgICAgJzwvZGl2Pic7CiAgICAgICAgfSkuam9pbignJyk7CiAgICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgICBjb25zb2xlLmVycm9yKGUpOwogICAgICB9CiAgICB9CgogICAgdXBkYXRlQ2xvY2soKTsKICAgIHNldEludGVydmFsKHVwZGF0ZUNsb2NrLCAxMDAwKTsKICAgIHJ1bigpOwogICAgc2V0SW50ZXJ2YWwocnVuLCAxNTAwMCk7CiAgPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPg==";

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(Buffer.from(UI_BASE64, 'base64').toString('utf-8'));
});
