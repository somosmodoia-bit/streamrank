import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Carga segura de canales con fallback directo
let channels = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, 'channels.json'), 'utf-8');
  channels = JSON.parse(raw);
} catch (e) {
  channels = [
    { id: 'luzutv', name: 'LUZU TV', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/LuzuTV', channels: { youtube: 'LuzuTV', twitch: 'luzutv', kick: '' } },
    { id: 'olga', name: 'OLGA', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/olgaenvivo', channels: { youtube: 'olgaenvivo', twitch: 'olgaenvivo', kick: '' } },
    { id: 'gelatina', name: 'Gelatina', category: 'politica', avatar: 'https://unavatar.io/youtube/somosgelatina', channels: { youtube: 'somosgelatina', twitch: 'somosgelatina', kick: '' } }
  ];
}

let latestRanks = channels.map(c => ({
  id: c.id,
  name: c.name,
  category: c.category || 'entretenimiento',
  avatar: c.avatar,
  thumbnail: c.avatar,
  title: 'Conectando...',
  isLive: false,
  totalViewers: 0,
  platforms: {
    twitch: { active: false, viewers: 0 },
    kick: { active: false, viewers: 0 },
    youtube: { active: false, viewers: 0 }
  }
}));

app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/ranks', (req, res) => res.json({ status: 'ok', data: latestRanks }));

app.get('/api/analytics/export', (req, res) => {
  const csvRows = ['Canal,Categoria,Espectadores,En_Vivo,Twitch,Kick,YouTube,Timestamp'];
  latestRanks.forEach(r => {
    const row = '"' + r.name + '","' + r.category + '",' + r.totalViewers + ',' + r.isLive + ',' + r.platforms.twitch.viewers + ',' + r.platforms.kick.viewers + ',' + r.platforms.youtube.viewers + ',"' + new Date().toISOString() + '"';
    csvRows.push(row);
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=StreamRank_Auditoria.csv');
  res.send(csvRows.join('\n'));
});

// Frontend completo servido como string decodificado (cero riesgo de renderizado roto en el chat)
const clientHTML = Buffer.from(
  'PCFET0NUWVBFIGh0bWw+PGh0bWwgbGFuZz0iZXMiPjxoZWFkPjxtZXRhIGNoYXJzZXQ9IlVURi04Ij48bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+PHRpdGxlPlN0cmVhbVJhbmsgQXJnZW50aW5hPC90aXRsZT48c2NyaXB0IHNyYz0iaHR0cHM6Ly9jZG4udGFpbHdpbmRjc3MuY29tIj48L3NjcmlwdD48L2hlYWQ+PGJvZHkgY2xhc3M9ImJnLXNsYXRlLTk1MCB0ZXh0LXNsYXRlLTEwMCBtaW4taC1zY3JlZW4gcC00IHNtOnAtNiBmb250LXNhbnMiPjxkaXYgY2xhc3M9Im1heC13LTV4bCBteC1hdXRvIHNwYWNlLXktNiI+PGhlYWRlciBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJvcmRlci1iIGJvcmRlci1zbGF0ZS04MDAgcGItNCI+PGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMiPjxzcGFuIGNsYXNzPSJ3LTMgaC0zIHJvdW5kZWQtZnVsbCBiZy1lbWVyYWxkLTUwMCBhbmltYXRlLXB1bHNlIj48L3NwYW4+PGgxIGNsYXNzPSJ0ZXh0LXhsIGZvbnQtYmxhY2siPlN0cmVhbVJhbmsgPHNwYW4gY2xhc3M9InRleHQteHMgYmctaW5kaWdvLTk1MCB0ZXh0LWluZGlnby00MDAgcHgtMiBweS0wLjUgcm91bmRlZCBib3JkZXIgYm9yZGVyLWluZGlnby04MDAiPkFSRzwvc3Bhbj48L2gxPjwvZGl2PjxkaXYgaWQ9InN0YXR1cyIgY2xhc3M9InRleHQteHMgdGV4dC1lbWVyYWxkLTQwMCBmb250LXNlbWlib2xkIGJnLXNsYXRlLTkwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMCBweC0zIHB5LTEuNSByb3VuZGVkLWZ1bGwiPlNpbmNyb25pemFuZG8uLi48L2Rpdj48L2hlYWRlcj48ZGl2IGNsYXNzPSJwLTQgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWluZGlnby05MDAvNDAgYmctc2xhdGUtOTAwLzQwIHRleHQteHMgdGV4dC1zbGF0ZS0zMDAiPjxwIGNsYXNzPSJmb250LWJvbGQgdGV4dC13aGl0ZSBtYi0xIj5UZWxlbWV0cmlhIERpcmVjdGEgY2FkYSAyMCBzZWd1bmRvczwvcD48cCBjbGFzcz0idGV4dC1zbGF0ZS00MDAiPkRhdG9zIGF1ZGl0YWRvcyBlbiB0aWVtcG8gcmVhbCBkZXNkZSBUd2l0Y2gsIEtpY2sgeSBZb3VUdWJlIHNpbiBlc3RpbWFjaW9uZXMgaW50ZXJtZWRpYXMuPC9wPjwvZGl2PjxkaXYgaWQ9ImdyaWQiIGNsYXNzPSJncmlkIGdyaWQtY29scy0xIHNtOmdyaWQtY29scy0yIG1kOmdyaWQtY29scy0zIGdhcC00Ij48ZGl2IGNsYXNzPSJ0ZXh0LXNsYXRlLTUwMCB0ZXh0LXhzIHB5LTgiPkNhcmdhbmRvIGNhbmFsZXMgZW4gdml2by4uLjwvZGl2PjwvZGl2PjwvZGl2PjxzY3JpcHQ+YXN5bmMgZnVuY3Rpb24gbG9hZERhdGEoKXt0cnl7Y29uc3QgcmVzPWF3YWl0IGZldGNoKCcvYXBpL3JhbmtzJyk7Y29uc3QganNvbj1hd2FpdCByZXMuanNvbigpO2NvbnN0IGNoYW5uZWxzPWpzb24uZGF0YXx8W107Y29uc3QgbGl2ZT1jaGFubmVscy5maWx0ZXIoYz0+Yy5pc0xpdmUpLmxlbmd0aDtkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzJykudGV4dENvbnRlbnQ9bGl2ZSsnIGVuIHZpdm8nO2NvbnN0IGNvbnRhaW5lcj1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3JpZCcpO2NvbnRhaW5lci5pbm5lckhUTUw9Jyc7Y2hhbm5lbHMuZm9yRWFjaCgoYyxpKTw9Pntjb25zdCBjYXJkPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO2NhcmQuY2xhc3NOYW1lPSdwLTQgcm91bmRlZC14bCBib3JkZXIgJysoYy5pc0xpdmU/J2JvcmRlci1zbGF0ZS04MDAgYmctc2xhdGUtOTAwLzYwJzonYm9yZGVyLXNsYXRlLTkwMCBiZy1zbGF0ZS05NTAgb3BhY2l0eS00MCcpKycgZmxleCBnYXAtMyBpdGVtcy1jZW50ZXInO2NvbnN0IGltZz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtpbWcuc3JjPWMuYXZhdGFyO2ltZy5jbGFzc05hbWU9J3ctMTIgaC0xMiByb3VuZGVkLWZ1bGwgb2JqZWN0LWNvdmVyIGJvcmRlciBib3JkZXItc2xhdGUtNzAwIGJnLXNsYXRlLTgwMCc7Y29uc3QgaW5mbz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtpbmZvLmNsYXNzTmFtZT0nbWluLXctMCBmbGV4LTEnO2NvbnN0IHJvdz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtyb3cuY2xhc3NOYW1lPSdmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4nO2NvbnN0IG5hbWU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDQnKTtuYW1lLmNsYXNzTmFtZT0nZm9udC1ib2xkIHRleHQtc20gdGV4dC13aGl0ZSB0cnVuY2F0ZSc7bmFtZS50ZXh0Q29udGVudD1jLm5hbWU7Y29uc3QgcmFuaz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7cmFuay5jbGFzc05hbWU9J3RleHQteHMgZm9udC1ibGFjayAnKyhpPT09MCYmYy5pc0xpdmU/J3RleHQtYW1iZXItNDAwJzondGV4dC1zbGF0ZS00MDAnKTtyYW5rLnRleHRDb250ZW50PScjJysoaSsxKTtyb3cuYXBwZW5kQ2hpbGQobmFtZSk7cm93LmFwcGVuZENoaWxkKHJhbmspO2NvbnN0IHZpZXdlcnM9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO3ZpZXdlcnMuY2xhc3NOYW1lPSd0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgJysoYy5pc0xpdmU/J3RleHQtaW5kaWdvLTQwMCc6J3RleHQtc2xhdGUtNTAwJyk7dmlld2Vycy50ZXh0Q29udGVudD1jLmlzTGl2ZT9uZXcgSW50bC5OdW1iZXJGb3JtYXQoJ2VzLUFSJykuZm9ybWF0KGMudG90YWxWaWV3ZXJzKSsnIHZpZXdlcnMnOidPZmZsaW5lJztpbmZvLmFwcGVuZENoaWxkKHJvdyk7aW5mby5hcHBlbmRDaGlsZCh2aWV3ZXJzKTtjYXJkLmFwcGVuZENoaWxkKGltZyk7Y2FyZC5hcHBlbmRDaGlsZChpbmZvKTtjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FyZCk7fSk7fWNhdGNoKGUpe2NvbnNvbGUuZXJyb3IoZSk7fX1sb2FkRGF0YSgpO3NldEludGVydmFsKGxvYWREYXRhLDIwMDAwKTs8L3NjcmlwdD48L2JvZHk+PC9odG1sPg==',
  'base64'
).toString('utf-8');

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(clientHTML);
});

// Twitch GQL
async function fetchTwitch(login) {
  if (!login) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const query = 'query GetStreamInfo(\(login: String!) { user(login:\)login) { stream { viewersCount title } } }';
  try {
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: query, variables: { login: login.toLowerCase() } }),
      signal: AbortSignal.timeout(1500)
    });
    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    const json = await res.json();
    const stream = json.data && json.data.user ? json.data.user.stream : null;
    return stream ? {
      isLive: true,
      viewers: stream.viewersCount || 0,
      title: stream.title || 'Twitch Live',
      thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_' + login.toLowerCase() + '-640x360.jpg'
    } : { isLive: false, viewers: 0, title: '', thumbnail: '' };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

// Kick API v2
async function fetchKick(slug) {
  if (!slug) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const res = await fetch('https://kick.com/api/v2/channels/' + slug.toLowerCase(), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(1500)
    });
    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    const data = await res.json();
    const s = data && data.livestream ? data.livestream : null;
    return (s && s.is_live) ? {
      isLive: true,
      viewers: s.viewer_count || 0,
      title: s.session_title || 'Kick Live',
      thumbnail: (s.thumbnail && s.thumbnail.url) ? s.thumbnail.url : ''
    } : { isLive: false, viewers: 0, title: '', thumbnail: '' };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

// YouTube
async function fetchYouTube(handle) {
  if (!handle) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const clean = handle.replace('@', '');
    const res = await fetch('https://www.youtube.com/@' + clean + '/live', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(1800)
    });
    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    const html = await res.text();

    if (html.includes('"status":"UPCOMING"') || html.includes('upcomingEventData')) {
      return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    }

    const isLive = html.includes('"isLive":true') || html.includes('watching') || html.includes('mirando');
    if (!isLive) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    let viewers = 0;
    const m = html.match(/"viewCount":\s*\{\s*"videoViewCountRenderer":\s*\{\s*"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
    if (m && m[1]) viewers = parseInt(m[1].replace(/[^0-9]/g, ''), 10) || 0;
    if (viewers < 15) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    let thumbnail = '';
    const matchId = html.match(/"videoId":"([^"]+)"/);
    if (matchId && matchId[1]) {
      thumbnail = 'https://i.ytimg.com/vi/' + matchId[1] + '/hqdefault.jpg';
    }

    let title = 'Transmisión en Vivo';
    const matchTitle = html.match(/(.*?)<\/title>/);
    if (matchTitle && matchTitle[1]) {
      title = matchTitle[1].replace(' - YouTube', '').trim();
    }

    return { isLive: true, viewers: viewers, title: title, thumbnail: thumbnail };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

// Bucle en segundo plano secuencial
let isPolling = false;
async function runLoop() {
  if (isPolling) return;
  isPolling = true;
  try {
    const list = [];
    for (const c of channels) {
      const [tw, ki, yt] = await Promise.all([
        fetchTwitch(c.channels.twitch),
        fetchKick(c.channels.kick),
        fetchYouTube(c.channels.youtube)
      ]);

      const total = (tw.isLive ? tw.viewers : 0) + (ki.isLive ? ki.viewers : 0) + (yt.isLive ? yt.viewers : 0);
      const live = tw.isLive || ki.isLive || yt.isLive;
      const activeThumbnail = yt.thumbnail || tw.thumbnail || ki.thumbnail || c.avatar;
      const activeTitle = yt.title || tw.title || ki.title || (live ? 'En Vivo' : 'Desconectado');

      list.push({
        id: c.id,
        name: c.name,
        category: c.category || 'entretenimiento',
        avatar: c.avatar,
        thumbnail: activeThumbnail,
        title: activeTitle,
        isLive: live,
        totalViewers: total,
        platforms: {
          twitch: { active: tw.isLive, viewers: tw.viewers },
          kick: { active: ki.isLive, viewers: ki.viewers },
          youtube: { active: yt.isLive, viewers: yt.viewers }
        }
      });

      await new Promise(r => setTimeout(r, 150));
    }

    latestRanks = list.sort((a, b) => (b.isLive - a.isLive) || (b.totalViewers - a.totalViewers));
    console.log('[StreamRank] Telemetria OK | Canales activos: ' + latestRanks.filter(x => x.isLive).length);
  } catch (err) {
    console.error('[StreamRank] Error en ciclo:', err.message);
  } finally {
    isPolling = false;
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('StreamRank online en puerto ' + PORT);
  setTimeout(runLoop, 4000);
  setInterval(runLoop, 25000);
});
