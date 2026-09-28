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

async function fetchTwitch(login) {
  if (!login) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const query = 'query GetStreamInfo(\(login: String!) { user(login:\)login) { stream { viewersCount title game { name } } } }';
  try {
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables: { login: login.toLowerCase() } })
    });
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
    const res = await fetch(`https://kick.com/api/v2/channels/${slug.toLowerCase()}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
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
    const res = await fetch(`https://www.youtube.com/@${clean}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
      }
    });
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
    console.log(`[StreamRank] Telemetría OK | En vivo: ${latestRanks.filter(x => x.isLive).length}`);
  } catch (e) {
    console.error('[StreamRank] Loop error:', e.message);
  }
}

runLoop();
setInterval(runLoop, 20000);

app.get('/api/ranks', (req, res) => {
  res.json({ status: 'ok', data: latestRanks });
});

const UI_BASE64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVzIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+U3RyZWFtUmFuayBBcmdlbnRpbmE8L3RpdGxlPgogIDxzY3JpcHQgc3JjPSJodHRwczovL2Nkbi50YWlsd2luZGNzcy5jb20iPjwvc2NyaXB0PgogIDxzdHlsZT4KICAgIGJvZHkgeyBiYWNrZ3JvdW5kLWNvbG9yOiAjMGIwZjE5OyBmb250LWZhbWlseTogc3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCBzYW5zLXNlcmlmOyB9CiAgICAubGl2ZS1wdWxzZSB7IGFuaW1hdGlvbjogcCAxLjVzIGluZmluaXRlOyB9CiAgICBAa2V5ZnJhbWVzIHAgeyAwJSwgMTAwJSB7IG9wYWNpdHk6IDE7IH0gNTAlIHsgb3BhY2l0eTogMC40OyB9IH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5IGNsYXNzPSJ0ZXh0LXNsYXRlLTEwMCBtaW4taC1zY3JlZW4gZmxleCBmbGV4LWNvbCI+CiAgPGhlYWRlciBjbGFzcz0iYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTgwMCBiZy1zbGF0ZS05MDAvODAgc3RpY2t5IHRvcC0wIHotNTAiPgogICAgPGRpdiBjbGFzcz0ibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTtweC02IGgtMTYgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIj4KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMiPgogICAgICAgIDxkaXYgY2xhc3M9InctMy41IGgtMy41IHJvdW5kZWQtZnVsbCBiZy1lbWVyYWxkLTUwMCBsaXZlLXB1bHNlIj48L2Rpdj4KICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14bCBzbTp0ZXh0LTJ4bCBmb250LWV4dHJhYm9sZCB0ZXh0LXdoaXRlIj5TdHJlYW1SYW5rIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGJnLWluZGlnby05MDAgdGV4dC1pbmRpZ28tMzAwIHB4LTIgcHktMC41IHJvdW5kZWQgbWwtMSI+QVJHPC9zcGFuPjwvc3Bhbj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC00IHRleHQteHMiPgogICAgICAgIDxkaXYgaWQ9ImNudCIgY2xhc3M9ImJnLXNsYXRlLTgwMCBweC0zLjUgcHktMS41IHJvdW5kZWQtZnVsbCBmb250LXNlbWlib2xkIHRleHQtZW1lcmFsZC00MDAiPjAgZW4gdml2bzwvZGl2PgogICAgICA8L2Rpdj4KICAgIDwvZGl2PgogIDwvaGVhZGVyPgoKICA8ZGl2IGNsYXNzPSJiZy1zbGF0ZS05MDAvNDAgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTgwMC81MCBweS0yLjUiPgogICAgPGRpdiBjbGFzcz0ibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTtweC02IGZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgaXRlbXMtc3RhcnQgc206aXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIj4KICAgICAgPGRpdj5NZXRyaWNhcyBkZSBhdWRpZW5jaWEgZW4gdGllbXBvIHJlYWwgZGUgVHdpdGNoLCBLaWNrIHkgWW91VHViZTwvZGl2PgogICAgICA8ZGl2IGlkPSJmdWxsRGF0ZSIgY2xhc3M9InRleHQtaW5kaWdvLTMwMCI+U2luY3Jvbml6YW5kbyBmZWNoYSB5IGhvcmEuLi48L2Rpdj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8bWFpbiBjbGFzcz0ibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTtweC02IHB5LTggZmxleC0xIHctZnVsbCI+CiAgICA8ZGl2IGNsYXNzPSJtYi04IHctZnVsbCBoLTI0IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1kYXNoZWQgYm9yZGVyLXNsYXRlLTgwMCBiZy1zbGF0ZS05MDAvMjAgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1zbGF0ZS01MDAiPgogICAgICA8c3BhbiBjbGFzcz0idGV4dC14cyB1cHBlcmNhc2UgZm9udC1ib2xkIHRyYWNraW5nLXdpZGVzdCI+RXNwYWNpbyBQdWJsaWNpdGFyaW88L3NwYW4+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJtYi02IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiI+CiAgICAgIDxoMiBjbGFzcz0idGV4dC14bCBzbTp0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC13aGl0ZSI+VHJhbnNtaXNpb25lcyBkZWwgTW9tZW50bzwvaDI+CiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIj5TZSBhY3R1YWxpemEgY2FkYSAyMHMgYXV0b23DoXRpY2FtZW50ZTwvc3Bhbj4KICAgIDwvZGl2PgoKICAgIDxkaXYgaWQ9ImdyaWQiIGNsYXNzPSJncmlkIGdyaWQtY29scy0xIHNtOmdyaWQtY29scy0yIGxnOmdyaWQtY29scy0zIGdhcC02Ij4KICAgICAgPGRpdiBjbGFzcz0iY29sLXNwYW4tZnVsbCBwLTEyIHRleHQtY2VudGVyIHRleHQtc2xhdGUtNTAwIj5DYXJnYW5kbyBjYW5hbGVzLi4uPC9kaXY+CiAgICA8L2Rpdj4KICA8L21haW4+CgogIDxzY3JpcHQ+CiAgICBjb25zdCBncmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3JpZCcpOwogICAgY29uc3QgY250ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NudCcpOwogICAgY29uc3QgZnVsbERhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZnVsbERhdGUnKTsKICAgIGNvbnN0IGZtdCA9IChuKSA9PiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ2VzLUFSJykuZm9ybWF0KG4pOwoKICAgIGZ1bmN0aW9uIHVwZGF0ZUNsb2NrKCkgewogICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpOwogICAgICBmdWxsRGF0ZS50ZXh0Q29udGVudCA9IG5vdy50b0xvY2FsZURhdGVTdHJpbmcoJ2VzLUFSJywgeyB3ZWVrZGF5OiAnbG9uZycsIHllYXI6ICdudW1lcmljJywgbW9udGg6ICdsb25nJywgZGF5OiAnbnVtZXJpYycgfSkgKyAnIMK3ICcgKyBub3cudG9Mb2NhbGVUaW1lU3RyaW5nKCdlcy1BUicpOwogICAgfQoKICAgIGFzeW5jIGZ1bmN0aW9uIHJ1bigpIHsKICAgICAgdHJ5IHsKICAgICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goJy9hcGkvcmFua3MnKTsKICAgICAgICBjb25zdCBpID0gYXdhaXQgci5qc29uKCk7CiAgICAgICAgY29uc3QgbCA9IGkuZGF0YSB8fCBbXTsKICAgICAgICBjb25zdCBsaXZlcyA9IGwuZmlsdGVyKHggPT4geC5pc0xpdmUpOwoKICAgICAgICBjbnQudGV4dENvbnRlbnQgPSBsaXZlcy5sZW5ndGggKyAnIGVuIHZpdm8nOwogICAgICAgIHVwZGF0ZUNsb2NrKCk7CgogICAgICAgIGlmICghbC5sZW5ndGgpIHJldHVybjsKCiAgICAgICAgZ3JkLmlubmVySFRNTCA9IGwubWFwKChzLCBpZHgpID0+IHsKICAgICAgICAgIGNvbnN0IGlzTGl2ZSA9IHMuaXNMaXZlOwogICAgICAgICAgY29uc3QgcmFua051bSA9IGlkeCArIDE7CiAgICAgICAgICBjb25zdCBhbiA9IChzLmFub21hbHkgJiYgcy5hbm9tYWx5LmFub21hbHkpID8gJzxkaXYgY2xhc3M9Im10LTIgaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHB4LTIgcHktMC41IHJvdW5kZWQgdGV4dC1bMTFweF0gZm9udC1ib2xkIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCI+4pqg77iPIFBJQ08gQU7Dk01BTE8gKCsnICsgZm10KHMuYW5vbWFseS5kZWx0YSkgKyAnKTwvZGl2PicgOiAnJzsKCiAgICAgICAgICBsZXQgcGxhdHMgPSAnJzsKICAgICAgICAgIGlmIChzLnBsYXRmb3Jtcy50d2l0Y2guYWN0aXZlKSBwbGF0cyArPSAnPHNwYW4gY2xhc3M9InB4LTIgcHktMC41IHJvdW5kZWQgdGV4dC1bMTFweF0gYmctcHVycGxlLTk1MCB0ZXh0LXB1cnBsZS0zMDAgYm9yZGVyIGJvcmRlci1wdXJwbGUtNzAwIj5Ud2l0Y2g8L3NwYW4+ICc7CiAgICAgICAgICBpZiAocy5wbGF0Zm9ybXMua2ljay5hY3RpdmUpIHBsYXRzICs9ICc8c3BhbiBjbGFzcz0icHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMXB4XSBiZy1lbWVyYWxkLTk1MCB0ZXh0LWVtZXJhbGQtMzAwIGJvcmRlciBib3JkZXItZW1lcmFsZC03MDAiPktpY2s8L3NwYW4+ICc7CiAgICAgICAgICBpZiAocy5wbGF0Zm9ybXMueW91dHViZS5hY3RpdmUpIHBsYXRzICs9ICc8c3BhbiBjbGFzcz0icHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMXB4XSBiZy1yZWQtOTUwIHRleHQtcmVkLTMwMCBib3JkZXIgYm9yZGVyLXJlZC03MDAiPllvdVR1YmU8L3NwYW4+ICc7CgogICAgICAgICAgY29uc3QgY2FyZFN0eWxlID0gaXNMaXZlID8gJ2JvcmRlci1zbGF0ZS04MDAgYmctc2xhdGUtOTAwLzYwJyA6ICdib3JkZXItc2xhdGUtOTAwIGJnLXNsYXRlLTk1MC80MCBvcGFjaXR5LTUwJzsKICAgICAgICAgIGNvbnN0IHBvc0NvbG9yID0gcmFua051bSA8PSAze2lzTGl2ZT8ndGV4dC1hbWJlci00MDAnOid0ZXh0LXNsYXRlLTQwMCd9IDogJ3RleHQtc2xhdGUtNDAwJzsKCiAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9ImZsZXggZmxleC1jb2wgcm91bmRlZC14bCBib3JkZXIgJyArIGNhcmRTdHlsZSArICcgb3ZlcmZsb3ctaGlkZGVuIj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9InJlbGF0aXZlIGFzcGVjdC12aWRlbyB3LWZ1bGwgYmctc2xhdGUtOTUwIj4nICsKICAgICAgICAgICAgICAnPGltZyBzcmM9IicgKyBzLnRodW1ibmFpbCArICciIGNsYXNzPSJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciIgb25lcnJvcj0idGhpcy5zcmM9XCcnICsgcy5hdmF0YXIgKyAnXCciPicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJhYnNvbHV0ZSB0b3AtMyBsZWZ0LTMgcHgtMi41IHB5LTEgcm91bmRlZC1tZCBiZy1ibGFjay83MCBiYWNrZHJvcC1ibHVyIGZvbnQtZXh0cmFib2xkIHRleHQteHMgJyArIHBvc0NvbG9yICsgJyBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIj4jJyArIHJhbmtOdW0gKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgKGlzTGl2ZSA/ICc8ZGl2IGNsYXNzPSJhYnNvbHV0ZSB0b3AtMyByaWdodC0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgcHgtMi41IHB5LTEgcm91bmRlZC1tZCBiZy1yZWQtNjAwIHRleHQtd2hpdGUgZm9udC1ib2xkIHRleHQteHMiPjxzcGFuIGNsYXNzPSJ3LTIgaC0yIHJvdW5kZWQtZnVsbCBiZy13aGl0ZSBsaXZlLXB1bHNlIj48L3NwYW4+IEVOIFZJVk88L2Rpdj4nIDogJzxkaXYgY2xhc3M9ImFic29sdXRlIHRvcC0zIHJpZ2h0LTMgcHgtMiBweS0wLjUgcm91bmRlZC1tZCBiZy1zbGF0ZS04MDAgdGV4dC1zbGF0ZS00MDAgdGV4dC14cyI+T0ZGTElORTwvZGl2PicpICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iYWJzb2x1dGUgYm90dG9tLTAgdy1mdWxsIHB4LTMgcHktMiBiZy1ncmFkaWVudC10by10IGZyb20tYmxhY2svOTAgdmlhLWJsYWNrLzUwIHRvLXRyYW5zcGFyZW50IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiI+JyArCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1zbSBmb250LWJvbGQgJyArIChpc0xpdmUgPyAndGV4dC13aGl0ZScgOiAndGV4dC1zbGF0ZS00MDAnKSArICciPicgKyAoaXNMaXZlID8gZm10KHMudG90YWxWaWV3ZXJzKSArICcgZXNwZWN0YWRvcmVzJyA6ICdEZXNjb25lY3RhZG8nKSArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGdhcC0xIj4nICsgKGlzTGl2ZSA/IHBsYXRzIDogJycpICsgJzwvZGl2PicgKwogICAgICAgICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgICAgJzwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0icC00IGZsZXggZ2FwLTMgaXRlbXMtc3RhcnQiPicgKwogICAgICAgICAgICAgICc8aW1nIHNyYz0iJyArIHMuYXZhdGFyICsgJyIgY2xhc3M9InctMTEgaC0xMSByb3VuZGVkLWZ1bGwgb2JqZWN0LWNvdmVyIGJnLXNsYXRlLTgwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCBmbGV4LXNocmluay0wIiBvbmVycm9yPSJ0aGlzLnNyYz1cImh0dHBzOi8vdWktYXZhdGFycy5jb20vYXBpLz9uYW1lPScgKyBlbmNvZGVVUklDb21wb25lbnQocy5uYW1lKSArICdcIiI+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9Im1pbi13LTAgZmxleC0xIj4nICsKICAgICAgICAgICAgICAgICc8aDMgY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXNtIHNtOnRleHQtYmFzZSB0ZXh0LXdoaXRlIHRydW5jYXRlIj4nICsgcy5uYW1lICsgJzwvaDM+JyArCiAgICAgICAgICAgICAgICAnPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS00MDAgbGluZS1jbGFtcC0yIG10LTAuNSIgdGl0bGU9IicgKyBzLnRpdGxlICsgJyI+JyArIHMudGl0bGUgKyAnPC9wPicgKwogICAgICAgICAgICAgICAgYW4gKwogICAgICAgICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgICAgJzwvZGl2PicgKwogICAgICAgICAgJzwvZGl2Pic7CiAgICAgICAgfSkuam9pbignJyk7CiAgICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgICBjb25zb2xlLmVycm9yKGUpOwogICAgICB9CiAgICB9CgogICAgdXBkYXRlQ2xvY2soKTsKICAgIHNldEludGVydmFsKHVwZGF0ZUNsb2NrLCAxMDAwKTsKICAgIHJ1bigpOwogICAgc2V0SW50ZXJ2YWwocnVuLCAxNTAwMCk7CiAgPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPg==";

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(Buffer.from(UI_BASE64, 'base64').toString('utf-8'));
});

app.listen(PORT, () => {
  console.log(`StreamRank listo en puerto ${PORT}`);
});
