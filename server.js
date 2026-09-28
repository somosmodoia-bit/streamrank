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

// Carga segura de canales con fallback de emergencia
let channels = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, 'channels.json'), 'utf-8');
  channels = JSON.parse(raw);
} catch (e) {
  console.error('[StreamRank] Error leyendo channels.json:', e.message);
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

// Servir archivos estáticos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de healthcheck para el balanceador de Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint de telemetría en tiempo real
app.get('/api/ranks', (req, res) => {
  res.json({ status: 'ok', data: latestRanks });
});

// Endpoint de exportación analítica para agencias (CSV)
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

// Fallback universal: garantiza responder siempre con index.html para evitar el 502
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('<!DOCTYPE html><html><body style="background:#080b11;color:#fff;font-family:sans-serif;padding:2rem;"><h2>StreamRank ARG en línea</h2><p>El backend está operativo. Verificando interfaz pública...</p></body></html>');
  }
});

// Twitch GQL
async function fetchTwitch(login) {
  if (!login) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const query = 'query GetStreamInfo($login: String!) { user(login: $login) { stream { viewersCount title } } }';
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

// YouTube con timeout estricto anti-cuelgues
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
    const matchTitle = html.match(/<title>(.*?)<\/title>/);
    if (matchTitle && matchTitle[1]) {
      title = matchTitle[1].replace(' - YouTube', '').trim();
    }

    return { isLive: true, viewers: viewers, title: title, thumbnail: thumbnail };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

// Bucle en segundo plano secuencial y liviano
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

      // Pausa secuencial de 150ms para evitar sobrecarga en Render
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

// Escucha en 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log('StreamRank online en puerto ' + PORT);
  setTimeout(runLoop, 4000);
  setInterval(runLoop, 25000);
});
