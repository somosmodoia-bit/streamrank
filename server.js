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

// UI moderna embebida en Base64 sin etiquetas directas en el archivo
const UI_BASE64 = "PCFET0NUWVBFIGh0bWw+PGh0bWwgbGFuZz0iZXMiPjxoZWFkPjxtZXRhIGNoYXJzZXQ9IlVURi04Ij48bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+PHRpdGxlPlN0cmVhbVJhbmsgQXJnZW50aW5hPC90aXRsZT48c2NyaXB0IHNyYz0iaHR0cHM6Ly9jZG4udGFpbHdpbmRjc3MuY29tIj48L3NjcmlwdD48c3R5bGU+Ym9keXtiYWNrZ3JvdW5kLWNvbG9yOiMwYjBmMTk7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLC1hcHBsZS1zeXN0ZW0sc2Fucy1zZXJpZjt9LnB1bHNle2FuaW1hdGlvbjpwIDJzIGluZmluaXRlfUBrZXlmcmFtZXMgcHswJSwxMDAle29wYWNpdHk6MTt9NTBTe29wYWNpdHk6LjM7fX08L3N0eWxlPjwvaGVhZD48Ym9keSBjbGFzcz0idGV4dC1zbGF0ZS0xMDAgbWluLWgtc2NyZWVuIGZsZXggZmxleC1jb2wiPjxoZWFkZXIgY2xhc3M9ImJvcmRlci1iIGJvcmRlci1zbGF0ZS04MDAgYmcoc2xhdGUtOTAwLzgwKSBzdGlja3kgdG9wLTAgei01MCI+PGRpdiBjbGFzcz0ibWF4LXctNWwgbXgtYXV0byBweC00IGgtMTYgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIj48ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyI+PGRpdiBjbGFzcz0idy0zIGgtMyByb3VuZGVkLWZ1bGwgYmctZW1lcmFsZC01MDAgcHVsc2UiPjwvZGl2PjxzcGFuIGNsYXNzPSJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIj5TdHJlYW1SYW5rIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGJnLWluZGlnby05MDAgdGV4dC1pbmRpZ28tMzAwIHB4LTIgcHktMC41IHJvdW5kZWQiPkFSRzwvc3Bhbj48L3NwYW4+PC9kaXY+PGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTQgdGV4dC14cyB0ZXh0LXNsYXRlLTQwMCI+PHNwYW4gaWQ9ImNudCIgY2xhc3M9ImJnLXNsYXRlLTgwMCBweC0zIHB5LTEgcm91bmRlZC1mdWxsIj4wIGVuIHZpdm88L3NwYW4+PHNwYW4gaWQ9InN5bmMiPlNpbmNyb25pemFuZG8uLi48L3NwYW4+PC9kaXY+PC9kaXY+PC9oZWFkZXI+PG1haW4gY2xhc3M9Im1heC13LTVsIG14LWF1dG8gcHgtNCBweS04IGZsZXgtMSB3LWZ1bGwiPjxkaXYgY2xhc3M9Im1iLTYiPjxoMSBjbGFzcz0idGV4dC0yeGwgZm9udC1ib2xkIHRleHQtd2hpdGUiPlJhbmtpbmcgZGUgU3RyZWFtaW5nIGVuIFZpdm88L2gxPjxwIGNsYXNzPSJ0ZXh0LXNtIHRleHQtc2xhdGUtNDAwIj5UZWxlbWV0csOtYSBlbiB0aWVtcG8gcmVhbCBkZSBUd2l0Y2gsIEtpY2sgeSBZb3VUdWJlIGRldGVjdGFuZG8gYW5vbWFsw6Fhcy48L3A+PC9kaXY+PGRpdiBpZD0iZ3JpZCIgY2xhc3M9ImZsZXggZmxleC1jb2wgZ2FwLTMiPjwvZGl2PjwvbWFpbj48c2NyaXB0PmNvbnN0IGdyZD1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3JpZCcpLGNudD1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY250Jyksc3luYz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3luYycpLGZtdD0obik9Pm5ldyBJbnRsLk51bWJlckZvcm1hdCgnZXMtQVInKS5mb3JtYXQobik7YXN5bmMgZnVuY3Rpb24gcnVuKCl7dHJ5e2NvbnN0IHI9YXdhaXQgZmV0Y2goJy9hcGkvcmFua3MnKSxpPWF3YWl0IHIuanNvbigpLGw9aS5kYXRhfHxbXTtjbnQudGV4dENvbnRlbnQ9bC5maWx0ZXIoeD0+eC5pc0xpdmUpLmxlbmd0aCsnIGVuIHZpdm8nO3N5bmMudGV4dENvbnRlbnQ9J0FjdHVhbGl6YWRvICcrbmV3IERhdGUoKS50b0xvY2FsZVRpbWVTdHJpbmcoKTtpZighbC5sZW5ndGgpe2dyZC5pbm5lckhUTUw9JzxkaXYgY2xhc3M9InAtNiB0ZXh0LWNlbnRlciB0ZXh0LXNsYXRlLTUwMCI+SW5pY2lhbmRvIHNvbmRlbyBkZSBjYW5hbGVzLi4uPC9kaXY+JztyZXR1cm47fWdyZC5pbm5lckhUTUw9bC5tYXAoKHMseCk9PntsZXQgYj0nJztpZihzLnBsYXRmb3Jtcy50d2l0Y2guYWN0aXZlKWIKICs9JzxzcGFuIGNsYXNzPSJweC0yIHB5LTAuNSByb3VuZGVkIHRleHQteHMgYmctcHVycGxlLTk1MC84MCB0ZXh0LXB1cnBsZS0zMDAgYm9yZGVyIGJvcmRlci1wdXJwbGUtNzAwLzUwIj5Ud2l0Y2g6ICcrZm10KHMucGxhdGZvcm1zLnR3aXRjaC52aWV3ZXJzKSsnPC9zcGFuPiAnO2lmKHMucGxhdGZvcm1zLmtpY2suYWN0aXZlKWIrPSc8c3BhbiBjbGFzcz0icHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LXhzIGJnLWVtZXJhbGQtOTUwLzgwIHRleHQtZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTcwMC81MCI+S2ljazogJytmbXQocy5wbGF0Zm9ybXMua2ljay52aWV3ZXJzKSsnPC9zcGFuPiAnO2lmKHMucGxhdGZvcm1zLnlvdXR1YmUuYWN0aXZlKWIrPSc8c3BhbiBjbGFzcz0icHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LXhzIGJnLXJlZC05NTAvODAgdGV4dC1yZWQtMzAwIGJvcmRlciBib3JkZXItcmVkLTcwMC81MCI+WW91VHViZTogJytmbXQocy5wbGF0Zm9ybXMueW91dHViZS52aWV3ZXJzKSsnPC9zcGFuPiAnO2NvbnN0IGFuPXMubm9tYWx5JiZzLmFub21hbHkuYW5vbWFseT8nPHNwYW4gY2xhc3M9InB4LTIgcHktMC41IHJvdW5kZWQgdGV4dC1bMTFweF0gZm9udC1ib2xkIGJnLWFtYmVyLTUwMC8yMCB0ZXh0LWFtYmVyLTMwMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC80MCI+4pqg77iPIFBJQ08gQU7Dk01BTE8gKCsnK2ZtdChzLmFub21hbHkuZGVsdGEpKScpPC9zcGFuPic6Jyc7cmV0dXJuJzxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwLTQgcm91bmRlZC14bCBib3JkZXIgJysocy5pc0xpdmU/J2JvcmRlci1zbGF0ZS04MDAgYmctc2xhdGUtOTAwLzYwJzonYm9yZGVyLXNsYXRlLTkwMCBiZy1zbGF0ZS05NTAvNDAgb3BhY2l0eS00MCcpKycgZ2FwLTQ+PGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMiPjxzcGFuIGNsYXNzPSJ3LTYgZm9udC1ib2xkIHRleHQtc20gJysoeDwwJiZzLmlzTGl2ZT8ndGV4dC1hbWJlci00MDAnOid0ZXh0LXNsYXRlLTUwMCcpKyc+IycrKHgrMSkrJzwvc3Bhbj48aW1nIHNyYz0iJytzLmF2YXRhcisnIiBjbGFzcz0idy0xMSBoLTExIHJvdW5kZWQtZnVsbCBvYmplY3QtY292ZXIgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAgYmctc2xhdGUtODAwIiBvbmVycm9yPSJ0aGlzLnNyYz1cImh0dHBzOi8vdWktYXZhdGFycy5jb20vYXBpLz9uYW1lPScrZW5jb2RlVVJJQ29tcG9uZW50KHMubmFtZSkrJ1wiIj48ZGl2PjxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj48aDMgY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXdoaXRlIHRleHQtc20iPicrcy5uYW1lKyc8L2gzPicrYW4rJzwvZGl2PjxkaXYgY2xhc3M9ImZsZXggZ2FwLTEuNSBtdC0xIj4nKyhzLmlzTGl2ZT9iOic8c3BhbiBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+T2ZmbGluZTwvc3Bhbj4nKSsnPC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz0idGV4dC1yaWdodCI+PGRpdiBjbGFzcz0idGV4dC14bCBmb250LWV4dHJhYm9sZCAnKyhzLmlzTGl2ZT8ndGV4dC13aGl0ZSc6J3RleHQtc2xhdGUtNjAwJykrJyI+Jysocy5pc0xpdmU/Zm10KHMudG90YWxWaWV3ZXJzKTonMCcpKyc8L2Rpdj48ZGl2IGNsYXNzPSJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwIj4nKyhzLmlzTGl2ZT8nVmlld2Vycyc6J09mZmxpbmUnKSsnPC9kaXY+PC9kaXY+PC9kaXY+Jzt9KS5qb2luKCcnKTt9Y2F0Y2goZSl7Y29uc29sZS5lcnJvcihlKTt9fXJ1bigpO3NldEludGVydmFsKHJ1biwxNTAwMCk7PC9zY3JpcHQ+PC9ib2R5PjwvaHRtbD4=";

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(Buffer.from(UI_BASE64, 'base64').toString('utf-8'));
});

app.listen(PORT, () => {
  console.log('StreamRank online en puerto ' + PORT);
});
