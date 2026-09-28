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

let channels = [
  { id: 'luzutv', name: 'LUZU TV', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/LuzuTV', channels: { youtube: 'LuzuTV', twitch: 'luzutv', kick: '' } },
  { id: 'olga', name: 'OLGA', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/olgaenvivo', channels: { youtube: 'olgaenvivo', twitch: 'olgaenvivo', kick: '' } },
  { id: 'gelatina', name: 'Gelatina', category: 'politica', avatar: 'https://unavatar.io/youtube/somosgelatina', channels: { youtube: 'somosgelatina', twitch: 'somosgelatina', kick: '' } }
];

try {
  const filePath = path.join(__dirname, 'channels.json');
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    channels = JSON.parse(raw);
  }
} catch (e) {
  console.log('[StreamRank] Usando canales fallback por defecto');
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

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/ranks', (req, res) => {
  res.json({ status: 'ok', data: latestRanks });
});

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

const clientHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StreamRank Argentina</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-6 font-sans">
  <div class="max-w-5xl mx-auto space-y-6">
    <header class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
        <h1 class="text-xl font-black">StreamRank <span class="text-xs bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800">ARG</span></h1>
      </div>
      <div id="status" class="text-xs text-emerald-400 font-semibold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">Conectando...</div>
    </header>
    <div id="grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div class="text-slate-500 text-xs py-8">Cargando canales...</div>
    </div>
  </div>
  <script>
    async function loadData() {
      try {
        const res = await fetch('/api/ranks');
        const json = await res.json();
        const list = json.data || [];
        const live = list.filter(c => c.isLive).length;
        document.getElementById('status').textContent = live + ' en vivo';
        document.getElementById('grid').innerHTML = list.map((c, i) => \`
          <div class="p-4 rounded-xl border \${c.isLive ? 'border-slate-800 bg-slate-900/60' : 'border-slate-900 bg-slate-950 opacity-40'} flex gap-3 items-center">
            <img src="\${c.avatar}" class="w-12 h-12 rounded-full object-cover border border-slate-700 bg-slate-800">
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-sm text-white truncate"\>\${c.name}</h4>
                <span class="text-xs font-black \${i === 0 && c.isLive ? 'text-amber-400' : 'text-slate-400'}">#\${i + 1}</span>
              </div>
              <p class="text-xs font-semibold \${c.isLive ? 'text-indigo-400' : 'text-slate-500'}">
                \${c.isLive ? new Intl.NumberFormat('es-AR').format(c.totalViewers) + ' viewers' : 'Offline'}
              </p>
            </div>
          </div>
        \`).join('');
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
    setInterval(loadData, 20000);
  </script>
</body>
</html>`;

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(clientHTML);
});

async function safeFetch(url, options = {}, timeoutMs = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}

async function fetchTwitch(login) {
  if (!login) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const query = 'query GetStreamInfo(\(login: String!) { user(login:\)login) { stream { viewersCount title } } }';
  const res = await safeFetch('https://gql.twitch.tv/gql', {
    method: 'POST',
    headers: {
      'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables: { login: login.toLowerCase() } })
  }, 1200);

  if (!res || !res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const json = await res.json();
    const stream = json?.data?.user?.stream;
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

async function fetchKick(slug) {
  if (!slug) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const res = await safeFetch('https://kick.com/api/v2/channels/' + slug.toLowerCase(), {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }, 1200);

  if (!res || !res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const data = await res.json();
    const s = data?.livestream;
    return (s && s.is_live) ? {
      isLive: true,
      viewers: s.viewer_count || 0,
      title: s.session_title || 'Kick Live',
      thumbnail: s.thumbnail?.url || ''
    } : { isLive: false, viewers: 0, title: '', thumbnail: '' };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

async function fetchYouTube(handle) {
  if (!handle) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const clean = handle.replace('@', '');
  const res = await safeFetch('https://www.youtube.com/@' + clean + '/live', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  }, 1500);

  if (!res || !res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const text = await res.text();
    if (text.includes('"status":"UPCOMING"') || text.includes('upcomingEventData')) {
      return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    }
    const isLive = text.includes('"isLive":true') || text.includes('watching') || text.includes('mirando');
    if (!isLive) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    let viewers = 0;
    const m = text.match(/"viewCount":\s*\{\s*"videoViewCountRenderer":\s*\{\s*"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
    if (m && m[1]) viewers = parseInt(m[1].replace(/[^0-9]/g, ''), 10) || 0;
    if (viewers < 15) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    return { isLive: true, viewers: viewers, title: 'Transmisión en Vivo', thumbnail: '' };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

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

      list.push({
        id: c.id,
        name: c.name,
        category: c.category || 'entretenimiento',
        avatar: c.avatar,
        thumbnail: yt.thumbnail || tw.thumbnail || ki.thumbnail || c.avatar,
        title: yt.title || tw.title || ki.title || (live ? 'En Vivo' : 'Desconectado'),
        isLive: live,
        totalViewers: total,
        platforms: {
          twitch: { active: tw.isLive, viewers: tw.viewers },
          kick: { active: ki.isLive, viewers: ki.viewers },
          youtube: { active: yt.isLive, viewers: yt.viewers }
        }
      });

      await new Promise(r => setTimeout(r, 200));
    }
    latestRanks = list.sort((a, b) => (b.isLive - a.isLive) || (b.totalViewers - a.totalViewers));
  } catch (err) {
    console.error('[StreamRank] Error en ciclo:', err.message);
  } finally {
    isPolling = false;
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('StreamRank online en puerto ' + PORT);
  setTimeout(runLoop, 2000);
  setInterval(runLoop, 25000);
});
