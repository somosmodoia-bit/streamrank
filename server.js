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

let latestRanks = [];
const telemetryHistory = new Map();

// --- Twitch Connector ---
async function fetchTwitch(channelLogin) {
  if (!channelLogin) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const query = 'query GetStreamInfo(\(login: String!) { user(login:\)login) { stream { viewersCount title game { name } } } }';
  try {
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables: { login: channelLogin.toLowerCase() } })
    });
    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    const { data } = await res.json();
    const stream = data?.user?.stream;
    if (!stream) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    return {
      isLive: true,
      viewers: stream.viewersCount || 0,
      title: stream.title || 'Transmisión en Twitch',
      thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_\({channelLogin.toLowerCase()}-640x360.jpg?t=\){Date.now()}`
    };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

// --- Kick Connector ---
async function fetchKick(channelSlug) {
  if (!channelSlug) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const res = await fetch('https://kick.com/api/v2/channels/' + channelSlug.toLowerCase(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    const data = await res.json();
    const stream = data?.livestream;
    if (!stream || !stream.is_live) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    return {
      isLive: true,
      viewers: stream.viewer_count || 0,
      title: stream.session_title || 'Transmisión en Kick',
      thumbnail: stream.thumbnail?.url || ''
    };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

// --- YouTube Connector (Con filtro estricto anti-salas de espera) ---
async function fetchYouTube(handle) {
  if (!handle) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const clean = handle.replace('@', '');
    const res = await fetch(`https://www.youtube.com/@${clean}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    const html = await res.text();

    // Filtro estricto: rechazar si es sala de espera / estreno futuro
    const isUpcoming = html.includes('"status":"UPCOMING"') || html.includes('"upcomingEventData"');
    if (isUpcoming) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    const isLive = html.includes('"isLive":true') || html.includes('{"text":" mirando"}') || html.includes('{"text":" watching"}');
    if (!isLive) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    let viewers = 0;
    const matchViewers = html.match(/"viewCount":\s*\{\s*"videoViewCountRenderer":\s*\{\s*"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
    if (matchViewers && matchViewers[1]) {
      viewers = parseInt(matchViewers[1].replace(/[^0-9]/g, ''), 10) || 0;
    }

    // Descartar streams fantasma con menos de 15 personas
    if (viewers < 15) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    // Extraer Video ID para el Thumbnail exacto
    let thumbnail = '';
    const matchVideoId = html.match(/"videoId":"([^"]+)"/);
    if (matchVideoId && matchVideoId[1]) {
      thumbnail = `https://i.ytimg.com/vi/${matchVideoId[1]}/hqdefault.jpg`;
    }

    // Extraer Título
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

// --- Detección de Anomalías ---
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

// --- Bucle de Telemetría cada 20 segundos ---
async function runLoop() {
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

        // Selección del thumbnail prioritario (YouTube > Twitch > Kick > Avatar de respaldo)
        const activeThumbnail = yt.thumbnail || tw.thumbnail || ki.thumbnail || c.avatar;
        const activeTitle = yt.title || tw.title || ki.title || 'Canal sin transmisión activa';

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
    console.log(`[StreamRank] \({new Date().toLocaleTimeString()} - En vivo:\){latestRanks.filter(x => x.isLive).length}`);
  } catch (e) {
    console.error('[StreamRank] Error Loop:', e.message);
  }
}

runLoop();
setInterval(runLoop, 20000);

app.get('/api/ranks', (req, res) => {
  res.json({ status: 'ok', data: latestRanks, serverTime: new Date().toISOString() });
});

// UI Tipo YouTube en Base64 con soporte publicitario y diseño adaptado
const UI_BASE64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVzIiBjbGFzcz0iZGFyayI+CjxoZWFkPgogIDxtZXRhIGNoYXJzZXQ9IlVURi04Ij4KICA8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+CiAgPHRpdGxlPlN0cmVhbVJhbmsgQXJnZW50aW5hIHwgUmFua2luZyBkZSBTdHJlYW1pbmc8L3RpdGxlPgogIDxzY3JpcHQgc3JjPSJodHRwczovL2Nkbi50YWlsd2luZGNzcy5jb20iPjwvc2NyaXB0PgogIDxsaW5rIHJlbD0icHJlY29ubmVjdCIgaHJlZj0iaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbSI+CiAgPGxpbmsgcmVsPSJwcmVjb25uZWN0IiBocmVmPSJodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tIiBjcm9zc29yaWdpbj4KICA8bGluayBocmVmPSJodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2NzczI/ZmFtaWx5PUludGVyOndnaHRAMzAwOzQwMDs1MDA7NjAwOzcwMDs4MDA7OTAwJmRpc3BsYXk9c3dhcCIgcmVsPSJzdHlsZXNoZWV0Ij4KICA8c3R5bGU+CiAgICBib2R5IHsgZm9udC1mYW1pbHk6ICdJbnRlcicsIHNhbnMtc2VyaWY7IGJhY2tncm91bmQtY29sb3I6ICMwOTA4MGY7IH0KICAgIC5saXZlLXB1bHNlIHsgYW5pbWF0aW9uOiBsaXZlQmxpbmsgMS41cyBlYXNlLWluLW91dCBpbmZpbml0ZTsgfQogICAgQGtleWZyYW1lcyBsaXZlQmxpbmsgeyAwJSwgMTAwJSB7IG9wYWNpdHk6IDE7IH0gNTAlIHsgb3BhY2l0eTogMC40OyB9IH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5IGNsYXNzPSJ0ZXh0LXNsYXRlLTEwMCBtaW4taC1zY3JlZW4gZmxleCBmbGV4LWNvbCBhbnRpYWxpYXNlZCI+CgogIDwhLS0gTkFWQkFSIC0tPgogIDxoZWFkZXIgY2xhc3M9ImJvcmRlci1iIGJvcmRlci1zbGF0ZS04MDAvODAgYmcgWyMwZjEyMWVdLzkwIGJhY2tkcm9wLWJsdXItbWQgc3RpY2t5IHRvcC0wIHotNTAiPgogICAgPGRpdiBjbGFzcz0ibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTtweC02IGgtMTYgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIj4KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMiPgogICAgICAgIDxkaXYgY2xhc3M9InctMy41IGgtMy41IHJvdW5kZWQtZnVsbCBiZy1lbWVyYWxkLTUwMCBzaGFkb3ctWzBfMF8xMnB4X3JnYmEoMTYsMTg1LDEyOSwwLjkpXSBsaXZlLXB1bHNlIj48L2Rpdj4KICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14bCBzbTp0ZXh0LTJ4bCBmb250LWV4dHJhYm9sZCB0cmFja2luZy10aWdodCB0ZXh0LXdoaXRlIj5TdHJlYW1SYW5rIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB1cHBlcmNhc2UgYmctaW5kaWdvLTkwMC85MCB0ZXh0LWluZGlnby0zMDAgcHgtMi41IHB5LTEgcm91bmRlZC1tZCBib3JkZXIgYm9yZGVyLWluZGlnby01MDAvMzAgbWwtMSI+QVJHPC9zcGFuPjwvc3Bhbj4KICAgICAgPC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtNCB0ZXh0LXhzIj4KICAgICAgICA8ZGl2IGlkPSJjbnQiIGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBiZy1zbGF0ZS04MDAvODAgcHgtMy41IHB5LTEuNSByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAvNTAgZm9udC1zZW1pYm9sZCB0ZXh0LWVtZXJhbGQtNDAwIj4KICAgICAgICAgIDxzcGFuIGNsYXNzPSJ3LTIgaC0yIHJvdW5kZWQtZnVsbCBiZy1lbWVyYWxkLTUwMCI+PC9zcGFuPjAgZW4gdml2bwogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KICAgIDwvZGl2PgogIDwvaGVhZGVyPgoKICA8IS0tIFNVQkhFQURFUiBGSUpPIENPTiBGRUNIQSBZIEhPUkEgLS0+CiAgPGRpdiBjbGFzcz0iYmctc2xhdGUtOTAwLzQwIGJvcmRlci1iIGJvcmRlci1zbGF0ZS04MDAvNDAgcHktMi41Ij4KICAgIDxkaXYgY2xhc3M9Im1heC13LTd4bCBteC1hdXRvIHB4LTQgc206cHgtNiBmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGl0ZW1zLXN0YXJ0IHNtOml0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgdGV4dC14cyB0ZXh0LXNsYXRlLTQwMCI+CiAgICAgIDxkaXY+TWV0cmljYXMgZGUgYXVkaWVuY2lhIGNvbnNvbGlkYWRhcyBkZSBUd2l0Y2gsIEtpY2sgeSBZb3VUdWJlPC9kaXY+CiAgICAgIDxkaXYgaWQ9ImZ1bGxEYXRlIiBjbGFzcz0iZm9udC1tZWRpdW0gdGV4dC1pbmRpZ28tMzAwLzg1IGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUiPgogICAgICAgIDxzc3c+U2luY3Jvbml6YW5kbyBmZWNoYSB5IGhvcmEuLi48L3N3PgogICAgICA8L2Rpdj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8IS0tIENPTlRFTklETyAtLT4KICA8bWFpbiBjbGFzcz0ibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTtweC02IHB5LTggZmxleC0xIHctZnVsbCI+CgogICAgPCEtLSBTTE9UIFBVQkxJQ0lEQUQgU1VQRVJJT1IgLS0+CiAgICA8ZGl2IGNsYXNzPSJtYi04IHctZnVsbCBoLTI0IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1kYXNoZWQgYm9yZGVyLXNsYXRlLTgwMCBiZy1zbGF0ZS05MDAvMjAgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1zbGF0ZS01MDAgZ3JvdXAgaG92ZXI6Ym9yZGVyLWluZGlnby01MDAvNTAgdHJhbnNpdGlvbiI+CiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXN0IHRleHQtc2xhdGUtNjAwIGdyb3VwLWhvdmVyOnRleHQtaW5kaWdvLTQwMCI+RXNwYWNpbyBQdWJsaWNpdGFyaW8gKFBsYWNlaG9sZGVyIDcyOHg5MCk8L3NwYW4+CiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVswLjY1cmVtXSB0ZXh0LXNsYXRlLTcwMCI+Q29udGFjdG8gY29tZXJjaWFsOiBhZHNAc3RyZWFtcmFuay5hcmc8L3NwYW4+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJtYi02IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiI+CiAgICAgIDxoMiBjbGFzcz0idGV4dC14bCBzbTp0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC13aGl0ZSB0cmFja2luZy10aWdodCI+VHJhbnNtaXNpb25lcyBkZWwgTW9tZW50bzwvaDI+CiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIj5TZSBhY3R1YWxpemEgY2FkYSAyMHMgYXV0b23DoXRpY2FtZW50ZTwvc3Bhbj4KICAgIDwvZGl2PgoKICAgIDwhLS0gR1JJTExBIFRJUE8gWU9VVFVCRSAoMSBjb2wgbW9iaWxlLCAyIGNvbCB0YWJsZXQsIDMgY29sIGRlc2t0b3ApIC0tPgogICAgPGRpdiBpZD0iZ3JpZCIgY2xhc3M9ImdyaWQgZ3JpZC1jb2xzLTEgc206Z3JpZC1jb2xzLTIgbGc6Z3JpZC1jb2xzLTMgZ2FwLTYiPgogICAgICA8ZGl2IGNsYXNzPSJjb2wtc3Bhbi1mdWxsIHAtMTIgdGV4dC1jZW50ZXIgdGV4dC1zbGF0ZS01MDAgYW5pbWF0ZS1wdWxzZSI+Q29uZWN0YW5kbyBjb24gbGFzIHBsYXRhZm9ybWFzLi4uPC9kaXY+CiAgICA8L2Rpdj4KCiAgPC9tYWluPgoKICA8Zm9vdGVyIGNsYXNzPSJib3JkZXItdCBib3JkZXItc2xhdGUtODAwLzgwIHB5LTggYmcgWyMwZjEyMWVdLzQwIHRleHQtY2VudGVyIHRleHQteHMgdGV4dC1zbGF0ZS01MDAiPgogICAgPGRpdiBjbGFzcz0ibWF4LXctN3hsIG14LWF1dG8gcHgtNCI+CiAgICAgIFN0cmVhbVJhbmsgQXJnZW50aW5hICZidWxsOyBNw6l0cmljYXMgZW4gVGllbXBvIFJlYWwgc2luIGludGVybWVkaWFyaW9zLgogICAgPC9kaXY+CiAgPC9mb290ZXI+CgogIDxzY3JpcHQ+CiAgICBjb25zdCBncmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3JpZCcpOwogICAgY29uc3QgY250ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NudCcpOwogICAgY29uc3QgZnVsbERhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZnVsbERhdGUnKTsKICAgIGNvbnN0IGZtdCA9IChuKSA9PiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ2VzLUFSJykuZm9ybWF0KG4pOwoKICAgIGZ1bmN0aW9uIHVwZGF0ZUNsb2NrKCkgewogICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpOwogICAgICBjb25zdCBvcHRzID0geyB3ZWVrZGF5OiAnbG9uZycsIHllYXI6ICdudW1lcmljJywgbW9udGg6ICdsb25nJywgZGF5OiAnbnVtZXJpYycgfTsKICAgICAgY29uc3QgZGF0ZVN0ciA9IG5vdy50b0xvY2FsZURhdGVTdHJpbmcoJ2VzLUFSJywgb3B0cyk7CiAgICAgIGNvbnN0IHRpbWVTdHIgPSBub3cudG9Mb2NhbGVUaW1lU3RyaW5nKCdlcy1BUicpOwogICAgICBmdWxsRGF0ZS50ZXh0Q29udGVudCA9IGRhdGVTdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBkYXRlU3RyLnNsaWNlKDEpICsgJyDCtyAnICsgdGltZVN0cjsKICAgIH0KCiAgICBhc3luYyBmdW5jdGlvbiBydW4oKSB7CiAgICAgIHRyeSB7CiAgICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKCcvYXBpL3JhbmtzJyk7CiAgICAgICAgY29uc3QgaSA9IGF3YWl0IHIuanNvbigpOwogICAgICAgIGNvbnN0IGwgPSBpLmRhdGEgfHwgW107CiAgICAgICAgY29uc3QgbGl2ZXMgPSBsLmZpbHRlcih4ID0+IHguaXNMaXZlKTsKCiAgICAgICAgY250LmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz0idy0yIGgtMiByb3VuZGVkLWZ1bGwgYmctZW1lcmFsZC01MDAgbGl2ZS1wdWxzZSc+PC9zcGFuPicgKyBsaXZlcy5sZW5ndGggKyAnIGVuIHZpdm8nOwogICAgICAgIHVwZGF0ZUNsb2NrKCk7CgogICAgICAgIGlmICghbC5sZW5ndGgpIHsKICAgICAgICAgIGdyZC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0iY29sLXNwYW4tZnVsbCBwLTEyIHRleHQtY2VudGVyIHRleHQtc2xhdGUtNTAwIj5TaW4gZGF0b3MgZGlzcG9uaWJsZXMuPC9kaXY+JzsKICAgICAgICAgIHJldHVybjsKICAgICAgICB9CgogICAgICAgIGdyZC5pbm5lckhUTUwgPSBsLm1hcCgocywgaWR4KSA9PiB7CiAgICAgICAgICBjb25zdCBpc0xpdmUgPSBzLmlzTGl2ZTsKICAgICAgICAgIGNvbnN0IHJhbmtOdW0gPSBpZHggKyAxOwogICAgICAgICAgY29uc3QgYW4gPSAocy5hbm9tYWx5ICYmIHMuYW5vbWFseS5hbm9tYWx5KSA/ICc8ZGl2IGNsYXNzPSJtdC0yIGlucGxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgcHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIj7imqDvuI8gUElDTyBBTsOTTUFMTyAoKycgKyBmbXQocy5hbm9tYWx5LmRlbHRhKSArICcpPC9kaXY+JyA6ICcnOwoKICAgICAgICAgIC8vIFBsYXRmb3JtIEJhZGdlcwogICAgICAgICAgbGV0IHBsYXRzID0gJyc7CiAgICAgICAgICBpZiAocy5wbGF0Zm9ybXMudHdpdGNoLmFjdGl2ZSkgcGxhdHMgKz0gJzxzcGFuIGNsYXNzPSJweC0yIHB5LTAuNSByb3VuZGVkIHRleHQtWzExcHhdIGZvbnQtc2VtaWJvbGQgYmctW3JnYmEoMTQ1LDcwLDI1NSwwLjE1KV0gdGV4dC1bI2JmOTRmZl0gYm9yZGVyIGJvcmRlci1bcmdiYSgxNDUsNzAsMjU1LDAuNCldIj5Ud2l0Y2g8L3NwYW4+ICc7CiAgICAgICAgICBpZiAocy5wbGF0Zm9ybXMua2ljay5hY3RpdmUpIHBsYXRzICs9ICc8c3BhbiBjbGFzcz0icHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMXB4XSBmb250LXNlbWlib2xkIGJnLVtyZ2JhKDgzLDI1Miw4NCwwLjEpXSB0ZXh0LVteNTNGQzE4XSBib3JkZXIgYm9yZGVyLVtyZ2JhKDgzLDI1Miw4NCwwLjMpXSI+S2ljazwvc3Bhbj4gJzsKICAgICAgICAgIGlmIChzLnBsYXRmb3Jtcy55b3V0dWJlLmFjdGl2ZSkgcGxhdHMgKz0gJzxzcGFuIGNsYXNzPSJweC0yIHB5LTAuNSByb3VuZGVkIHRleHQtWzExcHhdIGZvbnQtc2VtaWJvbGQgYmctW3JnYmEoMjU1LDAsMCwwLjE1KV0gdGV4dC1bI2ZmNjY2Nl0gYm9yZGVyIGJvcmRlci1bcmdiYSgyNTUsMCwwLDAuNCldIj5Zb3VUdWJlPC9zcGFuPiAnOwoKICAgICAgICAgIHJldHVybmsgYAogICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGZsZXgtY29sIHJvdW5kZWQteGwgYm9yZGVyICR7aXNMaXZlID8gJ2JvcmRlci1zbGF0ZS04MDAgYmctc2xhdGUtOTAwLzYwIGhvdmVyOmJvcmRlci1pbmRpZ28tNTAwLzUwJyA6ICdib3JkZXItc2xhdGUtOTAwLzcwIGJnLXNsYXRlLTk1MC80MCBvcGFjaXR5LTUwJ30gb3ZlcmZsb3ctaGlkZGVuIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTIwMCI+CiAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgPCEtLSBUT1AgVEhVTUJOQUlMIDoxNi85IC0tPgogICAgICAgICAgICAgIDxkaXYgY2xhc3M9InJlbGF0aXZlIGFzcGVjdC12aWRlbyB3LWZ1bGwgYmctc2xhdGUtOTUwIG92ZXJmbG93LWhpZGRlbiI+CiAgICAgICAgICAgICAgICA8aW1nIHNyYz0iJHtzLnRodW1ibmFpbH0iIGFsdD0iJHtzLm5hbWV9IiBjbGFzcz0idy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIiIG9uZXJyb3I9InRoaXMuc3JjPSdodHRwczovL2ltYWdlcy51bnNwbGFzaC5jb20vcGhvdG8tMTYxODA2MDkzMDM1My00NzQ0ZTgwZmJkYWNmY3dnPTgwMCc7Ij4KICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgPCEtLSBCYWRnZSBQb3NpY2nDs24gLS0+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJtLWxvY2F0aW9uIGFic29sdXRlIHRvcC0zIGxlZnQtMyBweC0yLjUgcHktMSByb3VuZGVkLW1kIGJnYmxhY2svNzAgYmFja2Ryb3AtYmx1ciBmb250LWV4dHJhYm9sZCB0ZXh0LXhzICR7cmFua051bSA8PSAze3RleHQtYW1iZXItNDAwJzp0ZXh0LXNsYXRlLTQwMH0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCI+CiAgICAgICAgICAgICAgICAgICMke3JhbmtOdW19CiAgICAgICAgICAgICAgICA8L2Rpdj4KCiAgICAgICAgICAgICAgICA8IS0tIEJhZGdlIEVzdGFkbyBvIFZpZXdlcnMgLS0+CiAgICAgICAgICAgICAgICAke2lzTGl2ZSA/IGA8ZGl2IGNsYXNzPSJhYnNvbHV0ZSB0b3AtMyByaWdodC0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgcHgtMi41IHB5LTEgcm91bmRlZC1tZCBiZy1yZWQtNjAwLzk1IHRleHQtd2hpdGUgZm9udC1ib2xkIHRleHQteHMgdHJhY2tpbmctd2lkZXIiPgogICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ3LTIgaC0yIHJvdW5kZWQtZnVsbCBiZy13aGl0ZSBsaXZlLXB1bHNlIj48L3NwYW4+IEVOIFZJVk8KICAgICAgICAgICAgICAgICAgPC9kaXY+YCA6IGA8ZGl2IGNsYXNzPSJhYnNvbHV0ZSB0b3AtMyByaWdodC0zIHB4LTIgcHktMC41IHJvdW5kZWQtbWQgYmctc2xhdGUtODAwLzgwIHRleHQtc2xhdGUtNDAwIGZvbnQtbWVkaXVtIHRleHQteHMiPk9GRkxJTkU8L2Rpdj5gIH0KCiAgICAgICAgICAgICAgICA8IS0tIFZpZXdlcnMgQmFubmVyIEluZmVyaW9yIGVuIFRodW1ibmFpbCAtLT4KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImFic29sdXRlIGJvdHRvbS0wIGluZXZldC14LTAgbC0wIHIwIHctZnVsbCBweC0zIHB5LTIgYmctZ3JhZGllbnQtdG8tdCBmcm9tLWJsYWNrLzkwIHZpYS1ibGFjay81MCB0by10cmFuc3BhcmVudCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPgogICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1zbCBmb250LWJvbGQgJHtpTGl2ZT8ndGV4dC13aGl0ZSc6J3RleHQtc2xhdGUtNDAwJ30iPgogICAgICAgICAgICAgICAgICAgICR7aXNMaXZlID8gZm10KHMudG90YWxWaWV3ZXJzKSArICcgZXNwZWN0YWRvcmVzJyA6ICdEZXNjb25lY3RhZG8nfQogICAgICAgICAgICAgICAgICA8L3NwYW4+CiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggZ2FwLTEiPiR7aXNMaXZlID8gcGxhdHMgOiAnJ308L2Rpdj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgIDwvZGl2PgoKICAgICAgICAgICAgICA8IS0tIElORk8gREVMIENBTkFMIC0tPgogICAgICAgICAgICAgIDxkaXYgY2xhc3M9InAtNCBmbGV4IGdhcC0zIGl0ZW1zLXN0YXJ0Ij4KICAgICAgICAgICAgICAgIDxpbWcgc3JjPSIke3MuYXZhdGFyfSIgYWx0PSIke3MubmFtZX0iIGNsYXNzPSJ3LTExIGgtMTEgcm91bmRlZC1mdWxsIG9iamVjdC1jb3ZlciBiZy1zbGF0ZS04MDAgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAvODAgZmxleC1zaHJpbmstMCIgb25lcnJvcj0idGhpcy5zcmM9J2h0dHBzOi8vdWktYXZhdGFycy5jb20vYXBpLz9uYW1lPScrZW5jb2RlVVJJQ29tcG9uZW50KHMubmFtZSkrJyc7Ij4KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9Im1pbi13LTAgZmxleC0xIj4KICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbWFsbCBzbTp0ZXh0LWJhc2UgdGV4dC13aGl0ZSB0cnVuY2F0ZSI+JHtzLm5hbWV9PC9oMz4KICAgICAgICAgICAgICAgICAgPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS00MDAgbGluZS1jbGFtcC0yIG10LTAuNSIgdGl0bGU9IiR7cy50aXRsZX0iPiR7cy50aXRsZX08L3A+CiAgICAgICAgICAgICAgICAgICR7YW59CiAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICA8L2Rpdj4KCisgICAgICAgICAgPC9kaXY+CiAgICAgICAgICBgOwogICAgICAgIH0pLmpvaW4oJycpOwogICAgICB9IGNhdGNoIChlKSB7CiAgICAgICAgY29uc29sZS5lcnJvcihlKTsKICAgICAgfQogICAgfQoKICAgIHVwZGF0ZUNsb2NrKCk7CiAgICBzZXRJbnRlcnZhbCh1cGRhdGVDbG9jaywgMTAwMCk7CiAgICBydW4oKTsKICAgIHNldEludGVydmFsKHJ1biwgMTUwMDApOwogIDwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4=";

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(Buffer.from(UI_BASE64, 'base64').toString('utf-8'));
});

app.listen(PORT, () => {
  console.log(`StreamRank listo en puerto ${PORT}`);
});
