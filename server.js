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

// Servir la carpeta pública
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

let channels = [];
try {
  channels = JSON.parse(fs.readFileSync('./channels.json', 'utf-8'));
} catch (e) {
  channels = [];
}

let latestRanks = channels.map(c => ({
  id: c.id,
  name: c.name,
  avatar: c.avatar,
  isLive: false,
  totalViewers: 0,
  platforms: {
    twitch: { active: false, viewers: 0 },
    kick: { active: false, viewers: 0 },
    youtube: { active: false, viewers: 0 }
  }
}));

async function fetchTwitch(login) {
  if (!login) return { isLive: false, viewers: 0 };
  const query = 'query GetStreamInfo(\(login: String!) { user(login:\)login) { stream { viewersCount } } }';
  try {
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables: { login: login.toLowerCase() } })
    });
    if (!res.ok) return { isLive: false, viewers: 0 };
    const { data } = await res.json();
    const stream = data?.user?.stream;
    return stream ? { isLive: true, viewers: stream.viewersCount || 0 } : { isLive: false, viewers: 0 };
  } catch {
    return { isLive: false, viewers: 0 };
  }
}

async function fetchKick(slug) {
  if (!slug) return { isLive: false, viewers: 0 };
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${slug.toLowerCase()}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return { isLive: false, viewers: 0 };
    const data = await res.json();
    const s = data?.livestream;
    return (s && s.is_live) ? { isLive: true, viewers: s.viewer_count || 0 } : { isLive: false, viewers: 0 };
  } catch {
    return { isLive: false, viewers: 0 };
  }
}

async function fetchYouTube(handle) {
  if (!handle) return { isLive: false, viewers: 0 };
  try {
    const clean = handle.replace('@', '');
    const res = await fetch(`https://www.youtube.com/@${clean}/live`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) return { isLive: false, viewers: 0 };
    const html = await res.text();
    if (html.includes('"status":"UPCOMING"') || html.includes('upcomingEventData')) {
      return { isLive: false, viewers: 0 };
    }
    const isLive = html.includes('"isLive":true') || html.includes('mirando') || html.includes('watching');
    if (!isLive) return { isLive: false, viewers: 0 };

    let viewers = 0;
    const m = html.match(/"viewCount":\s*\{\s*"videoViewCountRenderer":\s*\{\s*"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
    if (m && m[1]) viewers = parseInt(m[1].replace(/[^0-9]/g, ''), 10) || 0;
    if (viewers < 15) return { isLive: false, viewers: 0 };

    return { isLive: true, viewers };
  } catch {
    return { isLive: false, viewers: 0 };
  }
}

async function runLoop() {
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
        avatar: c.avatar,
        isLive: live,
        totalViewers: total,
        platforms: {
          twitch: { active: tw.isLive, viewers: tw.viewers },
          kick: { active: ki.isLive, viewers: ki.viewers },
          youtube: { active: yt.isLive, viewers: yt.viewers }
        }
      });
    }
    latestRanks = list.sort((a, b) => (b.isLive - a.isLive) || (b.totalViewers - a.totalViewers));
    console.log(`[StreamRank] OK - En vivo: ${latestRanks.filter(x => x.isLive).length}`);
  } catch (err) {
    console.error('[StreamRank] Error:', err.message);
  }
}

app.get('/api/ranks', (req, res) => {
  res.json({ status: 'ok', data: latestRanks });
});

app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
  runLoop();
  setInterval(runLoop, 25000);
});
