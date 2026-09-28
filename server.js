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

async function fetchTwitch(channelLogin) {
  if (!channelLogin) return { isLive: false, viewers: 0 };
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
    if (!res.ok) return { isLive: false, viewers: 0 };
    const { data } = await res.json();
    const stream = data?.user?.stream;
    if (!stream) return { isLive: false, viewers: 0 };
    return { isLive: true, viewers: stream.viewersCount || 0, title: stream.title || '', category: stream.game?.name || 'Twitch' };
  } catch {
    return { isLive: false, viewers: 0 };
  }
}

async function fetchKick(channelSlug) {
  if (!channelSlug) return { isLive: false, viewers: 0 };
  try {
    const res = await fetch('https://kick.com/api/v2/channels/' + channelSlug.toLowerCase(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) return { isLive: false, viewers: 0 };
    const data = await res.json();
    const stream = data?.livestream;
    if (!stream || !stream.is_live) return { isLive: false, viewers: 0 };
    return { isLive: true, viewers: stream.viewer_count || 0, title: stream.session_title || '', category: stream.categories?.[0]?.name || 'Kick' };
  } catch {
    return { isLive: false, viewers: 0 };
  }
}

async function fetchYouTube(handle) {
  if (!handle) return { isLive: false, viewers: 0 };
  try {
    const clean = handle.replace('@', '');
    const res = await fetch('https://www.youtube.com/@' + clean + '/live', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) return { isLive: false, viewers: 0 };
    const html = await res.text();
    const isLive = html.includes('"isLive":true') || html.includes('{"text":" mirando"}') || html.includes('{"text":" watching"}');
    if (!isLive) return { isLive: false, viewers: 0 };
    let viewers = 0;
    const match = html.match(/"viewCount":\s*\{\s*"videoViewCountRenderer":\s*\{\s*"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
    if (match && match[1]) {
      viewers = parseInt(match[1].replace(/[^0-9]/g, ''), 10) || 0;
    }
    return { isLive: true, viewers, title: 'En Vivo', category: 'YouTube' };
  } catch {
    return { isLive: false, viewers: 0 };
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
        return {
          id: c.id,
          name: c.name,
          avatar: c.avatar,
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
    console.log('[StreamRank] Telemetria OK - En vivo: ' + latestRanks.filter(x => x.isLive).length);
  } catch (e) {
    console.error('[StreamRank] Loop err:', e.message);
  }
}

runLoop();
setInterval(runLoop, 20000);

app.get('/api/ranks', (req, res) => {
  res.json({ status: 'ok', data: latestRanks });
});

const UI_BASE64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVzIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+U3RyZWFtUmFuayBBcmdlbnRpbmE8L3RpdGxlPgogIDxzY3JpcHQgc3JjPSJodHRwczovL2Nkbi50YWlsd2luZGNzcy5jb20iPjwvc2NyaXB0PgogIDxzdHlsZT4KICAgIGJvZHkgeyBiYWNrZ3JvdW5kLWNvbG9yOiAjMGIwZjE5OyBmb250LWZhbWlseTogc3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCBzYW5zLXNlcmlmOyB9CiAgICAucHVsc2UgeyBhbmltYXRpb246IHAgMnMgaW5maW5pdGU7IH0KICAgIEBrZXlmcmFtZXMgcCB7IDAlLCAxMDAlIHsgb3BhY2l0eTogMTsgfSA1MCUgeyBvcGFjaXR5OiAuMzsgfSB9CiAgPC9zdHlsZT4KPC9oZWFkPgo8Ym9keSBjbGFzcz0idGV4dC1zbGF0ZS0xMDAgbWluLWgtc2NyZWVuIGZsZXggZmxleC1jb2wiPgogIDxoZWFkZXIgY2xhc3M9ImJvcmRlci1iIGJvcmRlci1zbGF0ZS04MDAgYmctc2xhdGUtOTAwLzgwIHN0aWNreSB0b3AtMCB6LTUwIj4KICAgIDxkaXYgY2xhc3M9Im1heC13LTV4bCBteC1hdXRvIHB4LTQgaC0xNiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPgogICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyI+CiAgICAgICAgPGRpdiBjbGFzcz0idy0zIGgtMyByb3VuZGVkLWZ1bGwgYmctZW1lcmFsZC01MDAgcHVsc2UiPjwvZGl2PgogICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIj5TdHJlYW1SYW5rIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGJnLWluZGlnby05MDAgdGV4dC1pbmRpZ28tMzAwIHB4LTIgcHktMC41IHJvdW5kZWQiPkFSRzwvc3Bhbj48L3NwYW4+CiAgICAgIDwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtNCB0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIj4KICAgICAgICA8c3BhbiBpZD0iY250IiBjbGFzcz0iYmctc2xhdGUtODAwIHB4LTMgcHktMSByb3VuZGVkLWZ1bGwiPjAgZW4gdml2bzwvc3Bhbj4KICAgICAgICA8c3BhbiBpZD0ic3luYyI+U2luY3Jvbml6YW5kby4uLjwvc3Bhbj4KICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KICA8L2hlYWRlcj4KICA8bWFpbiBjbGFzcz0ibWF4LXctNXhsIG14LWF1dG8gcHgtNCBweS04IGZsZXgtMSB3LWZ1bGwiPgogICAgPGRpdiBjbGFzcz0ibWItNiI+CiAgICAgIDxoMSBjbGFzcz0idGV4dC0yeGwgZm9udC1ib2xkIHRleHQtd2hpdGUiPlJhbmtpbmcgZGUgU3RyZWFtaW5nIGVuIFZpdm88L2gxPgogICAgICA8cCBjbGFzcz0idGV4dC1zbSB0ZXh0LXNsYXRlLTQwMCI+VGVsZW1ldHLDrWEgZW4gdGllbXBvIHJlYWwgZGUgVHdpdGNoLCBLaWNrIHkgWW91VHViZS48L3A+CiAgICA8L2Rpdj4KICAgIDxkaXYgaWQ9ImdyaWQiIGNsYXNzPSJmbGV4IGZsZXgtY29sIGdhcC0zIj4KICAgICAgPGRpdiBjbGFzcz0icC02IHRleHQtY2VudGVyIHRleHQtc2xhdGUtNTAwIj5DYXJnYW5kbyBjYW5hbGVzLi4uPC9kaXY+CiAgICA8L2Rpdj4KICA8L21haW4+CiAgPHNjcmlwdD4KICAgIGNvbnN0IGdyZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdncmlkJyk7CiAgICBjb25zdCBjbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY250Jyk7CiAgICBjb25zdCBzeW5jID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N5bmMnKTsKICAgIGNvbnN0IGZtdCA9IChuKSA9PiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ2VzLUFSJykuZm9ybWF0KG4pOwoKICAgIGFzeW5jIGZ1bmN0aW9uIHJ1bigpIHsKICAgICAgdHJ5IHsKICAgICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goJy9hcGkvcmFua3MnKTsKICAgICAgICBjb25zdCBpID0gYXdhaXQgci5qc29uKCk7CiAgICAgICAgY29uc3QgbCA9IGkuZGF0YSB8fCBbXTsKICAgICAgICBjb25zdCBsaXZlQ291bnQgPSBsLmZpbHRlcih4ID0+IHguaXNMaXZlKS5sZW5ndGg7CiAgICAgICAgY250LnRleHRDb250ZW50ID0gbGl2ZUNvdW50ICsgJyBlbiB2aXZvJzsKICAgICAgICBzeW5jLnRleHRDb250ZW50ID0gJ0FjdHVhbGl6YWRvICcgKyBuZXcgRGF0ZSgpLnRvTG9jYWxlVGltZVN0cmluZygpOwoKICAgICAgICBpZiAoIWwubGVuZ3RoKSB7CiAgICAgICAgICBncmQuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9InAtNiB0ZXh0LWNlbnRlciB0ZXh0LXNsYXRlLTUwMCI+SW5pY2lhbmRvIHRlbGVtZXRyw61hLi4uPC9kaXY+JzsKICAgICAgICAgIHJldHVybjsKICAgICAgICB9CgogICAgICAgIGdyZC5pbm5lckhUTUwgPSBsLm1hcCgocywgaWR4KSA9PiB7CiAgICAgICAgICBsZXQgYiA9ICcnOwogICAgICAgICAgaWYgKHMucGxhdGZvcm1zICYmIHMucGxhdGZvcm1zLnR3aXRjaCAmJiBzLnBsYXRmb3Jtcy50d2l0Y2guYWN0aXZlKSB7CiAgICAgICAgICAgIGIgKz0gJzxzcGFuIGNsYXNzPSJweC0yIHB5LTAuNSByb3VuZGVkIHRleHQteHMgYmctcHVycGxlLTk1MCB0ZXh0LXB1cnBsZS0zMDAgYm9yZGVyIGJvcmRlci1wdXJwbGUtNzAwIj5Ud2l0Y2g6ICcgKyBmbXQocy5wbGF0Zm9ybXMudHdpdGNoLnZpZXdlcnMpICsgJzwvc3Bhbj4gJzsKICAgICAgICAgIH0KICAgICAgICAgIGlmIChzLnBsYXRmb3JtcyAmJiBzLnBsYXRmb3Jtcy5raWNrICYmIHMucGxhdGZvcm1zLmtpY2suYWN0aXZlKSB7CiAgICAgICAgICAgIGIgKz0gJzxzcGFuIGNsYXNzPSJweC0yIHB5LTAuNSByb3VuZGVkIHRleHQteHMgYmctZW1lcmFsZC05NTAgdGV4dC1lbWVyYWxkLTMwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtNzAwIj5LaWNrOiAnICsgZm10KHMucGxhdGZvcm1zLmtpY2sudmlld2VycykgKyAnPC9zcGFuPiAnOwogICAgICAgICAgfQogICAgICAgICAgaWYgKHMucGxhdGZvcm1zICYmIHMucGxhdGZvcm1zLnlvdXR1YmUgJiYgcy5wbGF0Zm9ybXMueW91dHViZS5hY3RpdmUpIHsKICAgICAgICAgICAgYiArPSAnPHNwYW4gY2xhc3M9InB4LTIgcHktMC41IHJvdW5kZWQgdGV4dC14cyBiZy1yZWQtOTUwIHRleHQtcmVkLTMwMCBib3JkZXIgYm9yZGVyLXJlZC03MDAiPllvdVR1YmU6ICcgKyBmbXQocy5wbGF0Zm9ybXMueW91dHViZS52aWV3ZXJzKSArICc8L3NwYW4+ICc7CiAgICAgICAgICB9CgogICAgICAgICAgY29uc3QgYW4gPSAocy5hbm9tYWx5ICYmIHMuYW5vbWFseS5hbm9tYWx5KSA/ICc8c3BhbiBjbGFzcz0icHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMXB4XSBmb250LWJvbGQgYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIj7imqDvuI8gUElDTyBBTsOTTUFMTyAoKycgKyBmbXQocy5hbm9tYWx5LmRlbHRhKSArICcpPC9zcGFuPicgOiAnJzsKICAgICAgICAgIGNvbnN0IGlzTGl2ZSA9IHMuaXNMaXZlOwogICAgICAgICAgY29uc3QgY2FyZFN0eWxlID0gaXNMaXZlID8gJ2JvcmRlci1zbGF0ZS04MDAgYmctc2xhdGUtOTAwLzYwJyA6ICdib3JkZXItc2xhdGUtOTAwIGJnLXNsYXRlLTk1MC80MCBvcGFjaXR5LTQwJzsKICAgICAgICAgIGNvbnN0IHBvc0NvbG9yID0gKGlkeCA8IDMgJiYgaXNMaXZlKSA/ICd0ZXh0LWFtYmVyLTQwMCcgOiAndGV4dC1zbGF0ZS01MDAnOwoKICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHAtNCByb3VuZGVkLXhsIGJvcmRlciAnICsgY2FyZFN0eWxlICsgJyBnYXAtNCI+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyI+JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJ3LTYgZm9udC1ib2xkIHRleHQtd2hpdGUgdGV4dC1zbSAnICsgcG9zQ29sb3IgKyAnIj4jJyArIChpZHggKyAxKSArICc8L3NwYW4+JyArCiAgICAgICAgICAgICAgJzxhIGhyZWY9Imh0dHBzOi8vdWktYXZhdGFycy5jb20iIHRhcmdldD0iX2JsYW5rIj48aW1nIHNyYz0iJyArIHMuYXZhdGFyICsgJyIgY2xhc3M9InctMTEgaC0xMSByb3VuZGVkLWZ1bGwgb2JqZWN0LWNvdmVyIGJvcmRlciBib3JkZXItc2xhdGUtNzAwIGJnLXNsYXRlLTgwMCIgb25lcnJvcj0idGhpcy5zcmM9XCdodHRwczovL3VpLWF2YXRhcnMuY29tL2FwaS8/bmFtZT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHMubmFtZSkgKyAnXCcjZGF0YSI+PC9hPicgKwogICAgICAgICAgICAgICc8ZGl2PicgKwogICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj48aDMgY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXdoaXRlIHRleHQtc20iPicgKyBzLm5hbWUgKyAnPC9oMz4nICsgYW4gKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0iZmxleCBnYXAtMS41IG10LTEiPicgKyAoaXNMaXZlID8gYiA6ICc8c3BhbiBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+T2ZmbGluZTwvc3Bhbj4nKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgICAnPC9kaXY+JyArCiAgICAgICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9InRleHQtcmlnaHQiPicgKwogICAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJ0ZXh0LXhsIGZvbnQtZXh0cmFib2xkICcrIChpc0xpdmUgPyAndGV4dC13aGl0ZScgOiAndGV4dC1zbGF0ZS02MDAnKSArICciPicgKyAoaXNMaXZlID8gZm10KHMudG90YWxWaWV3ZXJzKSA6ICcwJykgKyAnPC9kaXY+JyArCiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9InRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdGV4dC1zbGF0ZS01MDAiPicgKyAoaXNMaXZlID8gJ1ZpZXdlcnMnIDogJ09mZmxpbmUnKSArICc8L2Rpdj4nICsKICAgICAgICAgICAgJzwvZGl2PicgKwogICAgICAgICAgJzwvZGl2Pic7CiAgICAgICAgfSkuam9pbignJyk7CiAgICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZW5kZXI6JywgZSk7CiAgICAgIH0KICAgIH0KICAgIHJ1bigpOwogICAgc2V0SW50ZXJ2YWwocnVuLCAxNTAwMCk7CiAgPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo=";

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(Buffer.from(UI_BASE64, 'base64').toString('utf-8'));
});

app.listen(PORT, () => {
  console.log('StreamRank online en puerto ' + PORT);
});
