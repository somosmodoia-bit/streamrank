import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Cargar la lista inicial de canales
let channels = [];
try {
  channels = JSON.parse(fs.readFileSync('./channels.json', 'utf-8'));
} catch (err) {
  console.error('Error cargando channels.json:', err.message);
}

// Estado en memoria
let latestRanks = [];
const telemetryHistory = new Map(); // id -> [ { timestamp, viewers } ]

// --- 1. Conector Twitch (vía GQL sin autenticación) ---
async function fetchTwitch(channelLogin) {
  if (!channelLogin) return { isLive: false, viewers: 0 };
  const query = `
    query GetStreamInfo($login: String!) {
      user(login: $login) {
        stream {
          viewersCount
          title
          game { name }
        }
      }
    }
  `;

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

    return {
      isLive: true,
      viewers: stream.viewersCount || 0,
      title: stream.title || '',
      category: stream.game?.name || 'Twitch Stream'
    };
  } catch {
    return { isLive: false, viewers: 0 };
  }
}

// --- 2. Conector Kick ---
async function fetchKick(channelSlug) {
  if (!channelSlug) return { isLive: false, viewers: 0 };
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${channelSlug.toLowerCase()}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) return { isLive: false, viewers: 0 };
    const data = await res.json();
    const stream = data?.livestream;
    if (!stream || !stream.is_live) return { isLive: false, viewers: 0 };

    return {
      isLive: true,
      viewers: stream.viewer_count || 0,
      title: stream.session_title || '',
      category: stream.categories?.[0]?.name || 'Kick Stream'
    };
  } catch {
    return { isLive: false, viewers: 0 };
  }
}

// --- 3. Conector YouTube (Scraping directo del live stream) ---
async function fetchYouTube(handle) {
  if (!handle) return { isLive: false, viewers: 0 };
  try {
    const cleanHandle = handle.replace('@', '');
    const url = `https://www.youtube.com/@${cleanHandle}/live`;
    const res = await fetch(url, {
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

    return {
      isLive: true,
      viewers,
      title: 'Transmisión en vivo',
      category: 'YouTube Live'
    };
  } catch {
    return { isLive: false, viewers: 0 };
  }
}

// --- Motor de Anomalías y Detección de Viewbotting ---
function detectBotAnomaly(streamerId, currentTotalViewers) {
  const now = Date.now();
  if (!telemetryHistory.has(streamerId)) {
    telemetryHistory.set(streamerId, [{ timestamp: now, viewers: currentTotalViewers }]);
    return { anomaly: false, flag: null };
  }

  const history = telemetryHistory.get(streamerId);
  const previous = history[history.length - 1];
  const deltaViewers = currentTotalViewers - previous.viewers;
  const deltaTimeSec = (now - previous.timestamp) / 1000;

  history.push({ timestamp: now, viewers: currentTotalViewers });
  if (history.length > 30) history.shift(); // Conservamos ventana reciente

  // Pico anómalo: salto vertical de más de 3.500 viewers en menos de 45 segundos
  if (deltaViewers > 3500 && deltaTimeSec <= 45) {
    return {
      anomaly: true,
      flag: 'PICO_SOSPECHOSO',
      delta: deltaViewers
    };
  }

  return { anomaly: false, flag: null };
}

// --- Bucle principal de Telemetría (Polling cada 20 segundos) ---
async function runTelemetryLoop() {
  try {
    const results = await Promise.all(
      channels.map(async (creator) => {
        const [twitchData, kickData, ytData] = await Promise.all([
          fetchTwitch(creator.channels.twitch),
          fetchKick(creator.channels.kick),
          fetchYouTube(creator.channels.youtube)
        ]);

        const totalViewers =
          (twitchData.isLive ? twitchData.viewers : 0) +
          (kickData.isLive ? kickData.viewers : 0) +
          (ytData.isLive ? ytData.viewers : 0);

        const isAnyLive = twitchData.isLive || kickData.isLive || ytData.isLive;
        const anomalyCheck = isAnyLive ? detectBotAnomaly(creator.id, totalViewers) : { anomaly: false, flag: null };

        return {
          id: creator.id,
          name: creator.name,
          avatar: creator.avatar,
          isLive: isAnyLive,
          totalViewers,
          anomaly: anomalyCheck,
          platforms: {
            twitch: { active: twitchData.isLive, viewers: twitchData.viewers },
            kick: { active: kickData.isLive, viewers: kickData.viewers },
            youtube: { active: ytData.isLive, viewers: ytData.viewers }
          },
          lastUpdated: new Date().toISOString()
        };
      })
    );

    // Ordenar ranking: primero los que están en vivo con más viewers
    latestRanks = results.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return b.totalViewers - a.totalViewers;
    });

    console.log(`[StreamRank] Telemetría actualizada: \({new Date().toLocaleTimeString()} | En vivo:\){latestRanks.filter(r => r.isLive).length}`);
  } catch (err) {
    console.error('[StreamRank] Error en el loop de telemetría:', err.message);
  }
}

// Iniciar loop cada 20s
runTelemetryLoop();
setInterval(runTelemetryLoop, 20000);

// Endpoint público para el frontend
app.get('/api/ranks', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    data: latestRanks
  });
});

app.listen(PORT, () => {
  console.log(`StreamRank Server corriendo en el puerto ${PORT}`);
});
