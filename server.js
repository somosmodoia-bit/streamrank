import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Sanitización de la API Key oficial de Google
const RAW_YT_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_API_KEY = RAW_YT_KEY.trim().replace(/['"\r\n\s]/g, '');

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).send('OK'));

const CATEGORIAS_CONFIG = {
  entretenimiento: {
    id: 'entretenimiento',
    nombre: 'Entretenimiento',
    banner: 'ESPACIO PUBLICITARIO DISPONIBLE • ENTRETENIMIENTO',
    bannerColor: 'from-purple-950/80 via-slate-900 to-indigo-950/80',
    borderColor: 'border-purple-500/30'
  },
  deportes: {
    id: 'deportes',
    nombre: 'Deportes',
    banner: 'ESPACIO PUBLICITARIO DISPONIBLE • DEPORTES',
    bannerColor: 'from-emerald-950/80 via-slate-900 to-green-950/80',
    borderColor: 'border-emerald-500/30'
  },
  streamers: {
    id: 'streamers',
    nombre: 'Streamers',
    banner: 'ESPACIO PUBLICITARIO DISPONIBLE • STREAMERS',
    bannerColor: 'from-cyan-950/80 via-slate-900 to-blue-950/80',
    borderColor: 'border-cyan-500/30'
  },
  finanzas: {
    id: 'finanzas',
    nombre: 'Economía & Finanzas',
    banner: 'ESPACIO PUBLICITARIO DISPONIBLE • FINANZAS',
    bannerColor: 'from-amber-950/80 via-slate-900 to-yellow-950/80',
    borderColor: 'border-amber-500/30'
  },
  noticias: {
    id: 'noticias',
    nombre: 'Noticias & Actualidad',
    banner: 'ESPACIO PUBLICITARIO DISPONIBLE • AUDITORÍA DE MEDIOS',
    bannerColor: 'from-rose-950/80 via-slate-900 to-red-950/80',
    borderColor: 'border-rose-500/30'
  }
};

const CATEGORIAS_ORDEN = ['entretenimiento', 'deportes', 'streamers', 'finanzas', 'noticias'];

const CANALES = [
  // 1. Entretenimiento
  { id: 'luzutv', nombre: 'LUZU TV', categoria: 'entretenimiento', ytHandle: 'luzutv', ytChannelId: 'UC42bFp_6oP2r0nsqcI8sHqQ', twitchUser: 'luzutv' },
  { id: 'olga', nombre: 'OLGA', categoria: 'entretenimiento', ytHandle: 'olgaenvivo_', ytChannelId: 'UCW0mN66k8E_K7vV62f9sKMA', twitchUser: 'olgaenvivo' },
  { id: 'blender', nombre: 'Blender', categoria: 'entretenimiento', ytHandle: 'somosblender', ytChannelId: 'UCgBqYd47mYf4sY4U1zM_lYg', twitchUser: 'somosblender' },
  { id: 'gelatina', nombre: 'Gelatina', categoria: 'entretenimiento', ytHandle: 'somosgelatina', ytChannelId: 'UC37e4m0z6s3V6EaT3G4R8fQ', twitchUser: 'somosgelatina' },
  { id: 'vorterix', nombre: 'Vorterix', categoria: 'entretenimiento', ytHandle: 'vorterixoficial', ytChannelId: 'UC7fS5E3iV7f7K_e7y3Lz5rA', twitchUser: 'vorterixoficial' },
  { id: 'bondilive', nombre: 'Bondi Live', categoria: 'entretenimiento', ytHandle: 'bondi_liveok' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', categoria: 'entretenimiento', ytHandle: 'lacasastreaming' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', categoria: 'entretenimiento', ytHandle: 'unpocoderuido_' },
  { id: 'republicaz', nombre: 'República Z', categoria: 'entretenimiento', ytHandle: 'republicaz' },
  { id: 'posdata', nombre: 'Posdata', categoria: 'entretenimiento', ytHandle: 'posdatastream' },
  { id: 'dgo', nombre: 'DGO en Vivo', categoria: 'entretenimiento', ytHandle: 'DGO_Latam' },
  { id: 'telefe', nombre: 'Telefe Streams', categoria: 'entretenimiento', ytHandle: 'telefe' },
  { id: 'eltrece', nombre: 'eltrece', categoria: 'entretenimiento', ytHandle: 'eltrece' },
  { id: 'americatv', nombre: 'América TV', categoria: 'entretenimiento', ytHandle: 'americatv' },
  { id: 'urbanaplay', nombre: 'Urbana Play', categoria: 'entretenimiento', ytHandle: 'UrbanaPlayFM', twitchUser: 'urbanaplayfm' },

  // 2. Deportes
  { id: 'programa412', nombre: '412 Fútbol (Davoo & Cobra)', categoria: 'deportes', ytHandle: '412futbol' },
  { id: 'azzstream', nombre: 'AZZ Stream (Azzaro)', categoria: 'deportes', ytHandle: 'azzstream' },
  { id: 'picadotv', nombre: 'Picado TV', categoria: 'deportes', ytHandle: 'picadotv' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', categoria: 'deportes', ytHandle: 'pablocarrozza' },
  { id: 'tycsports', nombre: 'TyC Sports', categoria: 'deportes', ytHandle: 'TyCSportsOficial' },
  { id: 'dsports', nombre: 'DSports', categoria: 'deportes', ytHandle: 'DSports' },
  { id: 'espnarg', nombre: 'ESPN Argentina', categoria: 'deportes', ytHandle: 'espnargentina' },
  { id: 'tntsportsarg', nombre: 'TNT Sports Argentina', categoria: 'deportes', ytHandle: 'TNTSportsAR' },

  // 3. Streamers
  { id: 'davoo', nombre: 'Davoo Xeneize', categoria: 'streamers', twitchUser: 'davooxeneize', kickUser: 'davooxeneize' },
  { id: 'lacobra', nombre: 'La Cobra', categoria: 'streamers', twitchUser: 'lacobraaa', kickUser: 'lacobraaa' },
  { id: 'spreen', nombre: 'Spreen', categoria: 'streamers', twitchUser: 'spreen', kickUser: 'spreen' },
  { id: 'luquitas', nombre: 'Luquitas Rodríguez', categoria: 'streamers', twitchUser: 'luquitasrodriguez' },
  { id: 'martincirio', nombre: 'Martín Cirio', categoria: 'streamers', twitchUser: 'martincirio' },
  { id: 'coscu', nombre: 'Coscu', categoria: 'streamers', kickUser: 'coscu' },
  { id: 'kunaguero', nombre: 'Kun Agüero', categoria: 'streamers', twitchUser: 'slakun10' },
  { id: 'momo', nombre: 'Momo Benavides', categoria: 'streamers', kickUser: 'momo' },
  { id: 'brunenger', nombre: 'Brunenger', categoria: 'streamers', kickUser: 'brunenger' },
  { id: 'goncho', nombre: 'Goncho Banzas', categoria: 'streamers', twitchUser: 'goncho' },
  { id: 'gregorossello', nombre: 'Grego Rossello', categoria: 'streamers', ytHandle: 'GregoRossello1' },

  // 4. Economía & Finanzas
  { id: 'bullmarket', nombre: 'Bull Market Brokers', categoria: 'finanzas', ytHandle: 'BullMarketBrokers' },
  { id: 'joveninversor', nombre: 'Joven Inversor', categoria: 'finanzas', ytHandle: 'JovenInversor' },
  { id: 'elcronista', nombre: 'El Cronista TV', categoria: 'finanzas', ytHandle: 'ElCronistaTV' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', categoria: 'finanzas', ytHandle: 'ambitofinanciero' },
  { id: 'canale', nombre: 'Canal E', categoria: 'finanzas', ytHandle: 'canaleoficial' },

  // 5. Noticias & Actualidad
  { id: 'tn', nombre: 'TN (Todo Noticias)', categoria: 'noticias', ytHandle: 'todonoticias', ytChannelId: 'UCj6PcyLvpnIRT_2W_EGly9g' },
  { id: 'c5n', nombre: 'C5N', categoria: 'noticias', ytHandle: 'c5n', ytChannelId: 'UCFgk2Q2mVO1BklRQhSv6p0w' },
  { id: 'lanacionmas', nombre: 'La Nación +', categoria: 'noticias', ytHandle: 'lanacionmas', ytChannelId: 'UCba3hst5UmF3CYJnbyW82Tw' },
  { id: 'neura', nombre: 'Neura Media / Troncal', categoria: 'noticias', ytHandle: 'neuramedia', twitchUser: 'neuramedia' },
  { id: 'carajostream', nombre: 'Carajo Stream', categoria: 'noticias', ytHandle: 'carajostream' },
  { id: 'eldestape', nombre: 'El Destape', categoria: 'noticias', ytHandle: 'ElDestapeRadio' },
  { id: 'a24', nombre: 'A24', categoria: 'noticias', ytHandle: 'A24com' },
  { id: 'infobae', nombre: 'Infobae en Vivo', categoria: 'noticias', ytHandle: 'infobae' },
  { id: 'elobservador', nombre: 'El Observador 107.9', categoria: 'noticias', ytHandle: 'ElObservador1079' }
];

const publicPath = path.resolve(__dirname, 'public');
const logosDir = path.join(publicPath, 'logos');

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const horaBase = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const telemetriaState = CANALES.map((c) => {
  const handle = (c.ytHandle ? `@\({c.ytHandle}` : '') || (c.twitchUser ? `@\){c.twitchUser}` : '') || (c.kickUser ? `@\({c.kickUser}` : `@\){c.id}`);
  return {
    id: c.id,
    nombre: c.nombre,
    categoria: c.categoria,
    ytHandle: c.ytHandle || null,
    ytChannelId: c.ytChannelId || null,
    twitchUser: c.twitchUser || null,
    kickUser: c.kickUser || null,
    handle,
    avatar: `/logos/${c.id}.jpg`,
    viewers: 0,
    is_live: false,
    title: 'Señal en espera',
    hora_actualizacion: horaBase,
    plataformas_live: { yt: false, tw: false, ki: false },
    viewers_breakdown: { yt: 0, tw: 0, ki: 0 }
  };
});

// 1. Kick API
async function consultarKick(user) {
  if (!user) return { isLive: false, viewers: 0 };
  try {
    const res = await fetch(`https://kick.com/api/v1/channels/${user}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return { isLive: false, viewers: 0 };
    const data = await res.json();
    if (data?.livestream?.is_live) {
      return {
        isLive: true,
        viewers: parseInt(data.livestream.viewer_count || 0, 10),
        title: data.livestream.session_title || ''
      };
    }
  } catch (e) {}
  return { isLive: false, viewers: 0 };
}

// 2. Twitch GQL
async function consultarTwitch(user) {
  if (!user) return { isLive: false, viewers: 0 };
  try {
    const query = JSON.stringify({
      query: `query { user(login: "${user}") { stream { viewersCount title } } }`
    });
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json'
      },
      body: query,
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return { isLive: false, viewers: 0 };
    const data = await res.json();
    const stream = data?.data?.user?.stream;
    if (stream) {
      return {
        isLive: true,
        viewers: parseInt(stream.viewersCount || 0, 10),
        title: stream.title || ''
      };
    }
  } catch (e) {}
  return { isLive: false, viewers: 0 };
}

// --- ARQUITECTURA OFICIAL YOUTUBE (3 CAPAS) ---
const YT_API = 'https://www.googleapis.com/youtube/v3';
const channelIdCache = new Map();
// liveCache: channelId -> { videoId, lastDiscovery }
const liveCache = new Map();

// Helper: Resolver handle a Channel ID (1 unidad, cacheado para siempre)
async function resolverChannelId(handle) {
  if (channelIdCache.has(handle)) return channelIdCache.get(handle);
  if (!YOUTUBE_API_KEY) return null;

  try {
    const r = await fetch(`\({YT_API}/channels?part=id&forHandle=\){encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`, {
      signal: AbortSignal.timeout(4500)
    });
    if (!r.ok) return null;
    const data = await r.json();
    const id = data?.items?.[0]?.id;
    if (id) {
      channelIdCache.set(handle, id);
      return id;
    }
  } catch (e) {}
  return null;
}

// CAPA 1: Descubrimiento inteligente vía Playlist de uploads (UU) - 1 unidad solo cuando hace falta
async function discoverLiveVideoId(channelId) {
  if (!channelId || !YOUTUBE_API_KEY) return null;
  const uploadsId = 'UU' + channelId.slice(2);

  const r = await fetch(`\({YT_API}/playlistItems?part=contentDetails&playlistId=\){uploadsId}&maxResults=10&key=${YOUTUBE_API_KEY}`, {
    signal: AbortSignal.timeout(4500)
  });

  if (!r.ok) {
    if (r.status === 403) {
      const errBody = await r.json().catch(() => ({}));
      console.error('[YT Quota / Auth Error]', errBody);
    }
    return null;
  }

  const data = await r.json();
  const ids = (data.items || []).map(i => i.contentDetails?.videoId).filter(Boolean);
  if (!ids.length) return null;

  // Comprobar con videos.list cuál de los videos recientes está efectivamente en vivo
  const v = await fetch(`\({YT_API}/videos?part=snippet,liveStreamingDetails&id=\){ids.join(',')}&key=${YOUTUBE_API_KEY}`, {
    signal: AbortSignal.timeout(5000)
  });

  if (!v.ok) return null;
  const vd = await v.json();
  const live = (vd.items || []).find(x => 
    x.liveStreamingDetails?.actualStartTime && !x.liveStreamingDetails?.actualEndTime
  );

  return live ? { videoId: live.id, title: live.snippet?.title || 'En vivo' } : null;
}

// CAPA 3: Polling de viewers por BATCH (1 sola llamada para hasta 50 canales juntos = 1 unidad de cuota)
async function pollYouTubeViewers(canalesList) {
  if (!YOUTUBE_API_KEY) return {};

  // 1. Asegurar videoId cacheado (descubrimiento con backoff de 5 minutos si no había video)
  for (const ch of canalesList) {
    const cId = ch.ytChannelId;
    if (!cId) continue;

    const cached = liveCache.get(cId);
    const stale = !cached || (!cached.videoId && Date.now() - cached.lastDiscovery > 5 * 60 * 1000);

    if (stale) {
      try {
        const info = await discoverLiveVideoId(cId);
        liveCache.set(cId, { 
          videoId: info?.videoId || null, 
          title: info?.title || '', 
          lastDiscovery: Date.now() 
        });
      } catch (e) {
        console.error(`[yt] Error discovery canal ${cId}:`, e.message);
      }
    }
  }

  // 2. Extraer todos los videoIds activos
  const videoIds = canalesList
    .map(ch => ch.ytChannelId && liveCache.get(ch.ytChannelId)?.videoId)
    .filter(Boolean);

  if (!videoIds.length) return {};

  // 3. Batch oficial a Google (hasta 50 IDs en 1 URL)
  const idsUnique = [...new Set(videoIds)].slice(0, 50);
  const r = await fetch(`\({YT_API}/videos?part=snippet,liveStreamingDetails&id=\){idsUnique.join(',')}&key=${YOUTUBE_API_KEY}`, {
    signal: AbortSignal.timeout(5000)
  });

  if (!r.ok) {
    console.error('[yt] Error batch videos.list:', r.status, await r.text());
    return null;
  }

  const data = await r.json();
  const result = {};

  for (const item of data.items || []) {
    const d = item.liveStreamingDetails;
    const isLive = Boolean(d?.actualStartTime && !d?.actualEndTime);
    result[item.id] = {
      is_live: isLive,
      viewers: isLive ? Number(d.concurrentViewers || 0) : 0,
      title: item.snippet?.title || 'En vivo'
    };
  }

  // 4. Invalidar del caché los que terminaron la transmisión
  for (const [chId, c] of liveCache.entries()) {
    if (c.videoId && result[c.videoId] && !result[c.videoId].is_live) {
      liveCache.set(chId, { videoId: null, title: '', lastDiscovery: 0 });
    }
  }

  return result;
}

// PIPELINE GENERAL SINCRONIZADO
let ejecutandoSync = false;
async function sincronizarPipeline() {
  if (ejecutandoSync) return;
  ejecutandoSync = true;

  const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  try {
    // Resolver Channel IDs faltantes
    const canalesYT = telemetriaState.filter(c => c.ytHandle);
    for (const c of canalesYT) {
      if (!c.ytChannelId && c.ytHandle) {
        c.ytChannelId = await resolverChannelId(c.ytHandle);
      }
    }

    // Polling masivo de YouTube (consume solo 1 unidad por ciclo para todos los canales)
    const ytMetricas = await pollYouTubeViewers(canalesYT);

    // Cruzar con Kick y Twitch
    for (const canal of telemetriaState) {
      const [tw, ki] = await Promise.all([
        canal.twitchUser ? consultarTwitch(canal.twitchUser) : Promise.resolve({ isLive: false, viewers: 0 }),
        canal.kickUser ? consultarKick(canal.kickUser) : Promise.resolve({ isLive: false, viewers: 0 })
      ]);

      let ytViewers = 0;
      let ytLive = false;
      let ytTitle = '';

      if (canal.ytChannelId && liveCache.has(canal.ytChannelId) && ytMetricas) {
        const vId = liveCache.get(canal.ytChannelId)?.videoId;
        if (vId && ytMetricas[vId]) {
          ytViewers = ytMetricas[vId].viewers;
          ytLive = ytMetricas[vId].is_live;
          ytTitle = ytMetricas[vId].title;
        }
      }

      canal.viewers_breakdown.yt = ytViewers;
      canal.viewers_breakdown.tw = tw.viewers;
      canal.viewers_breakdown.ki = ki.viewers;

      canal.plataformas_live.yt = ytLive;
      canal.plataformas_live.tw = tw.isLive;
      canal.plataformas_live.ki = ki.isLive;

      canal.viewers = ytViewers + tw.viewers + ki.viewers;
      canal.is_live = canal.viewers > 0;

      if (canal.is_live) {
        canal.title = ytTitle || tw.title || ki.title || 'En vivo';
      } else {
        canal.title = 'Señal en espera';
      }

      canal.hora_actualizacion = horaActual;
    }
  } catch (err) {
    console.error('Error sincronizando pipeline:', err);
  }

  ejecutandoSync = false;
}

// Intervalo a 30 segundos (consume ~3.000 unidades diarias, sobradísimo sobre las 10.000 de cuota)
setTimeout(sincronizarPipeline, 1000);
setInterval(sincronizarPipeline, 30000);

// Endpoint de diagnóstico en tiempo real
app.get('/api/debug-yt', async (req, res) => {
  const canalesYT = telemetriaState.filter(c => c.ytHandle);
  const cacheObj = {};
  for (const [k, v] of liveCache.entries()) {
    cacheObj[k] = v;
  }

  res.json({
    apiKeyConfigurada: Boolean(YOUTUBE_API_KEY),
    totalCanalesYouTube: canalesYT.length,
    cacheDeVideosVivos: cacheObj,
    tnChannelId: telemetriaState.find(c => c.id === 'tn')?.ytChannelId || null,
    tnCache: liveCache.get('UCj6PcyLvpnIRT_2W_EGly9g') || null
  });
});

// Helper de autenticación institucional
function validarToken(req) {
  const envTokens = (process.env.VALID_TOKENS || '').split(',').map((t) => t.trim()).filter(Boolean);
  if (envTokens.length === 0) return true;

  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token) {
    token = String(req.query.token).trim();
  }

  return token ? envTokens.includes(token) : false;
}

// Endpoints principales
app.get('/api/ranking-categorias', (req, res) => {
  try {
    const categorias = CATEGORIAS_ORDEN.map((catKey) => {
      const meta = CATEGORIAS_CONFIG[catKey];

      const canales = telemetriaState
        .filter((c) => c.categoria === catKey)
        .sort((a, b) => b.viewers - a.viewers);

      const lider = canales.find((c) => c.is_live && c.viewers > 0) || null;

      return {
        id: catKey,
        nombre: meta.nombre,
        banner: meta.banner,
        bannerColor: meta.bannerColor,
        borderColor: meta.borderColor,
        lider,
        total_canales: canales.length,
        canales
      };
    });

    res.json({
      status: 'success',
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      fecha: new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }),
      categorias
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno en telemetría' });
  }
});

app.get('/api/dataset-ai', (req, res) => {
  res.json({
    status: 'ok',
    total_canales: telemetriaState.length,
    timestamp: new Date().toISOString(),
    canales: telemetriaState
  });
});

app.get('/api/descargar-analytics', (req, res) => {
  if (!validarToken(req)) {
    return res.status(401).json({ error: 'Clave institucional inválida o no provista' });
  }

  const canalId = req.query.canal || 'todos';
  const periodo = req.query.periodo || 'hoy';
  const formato = req.query.formato || 'json';

  let datosFiltrados = telemetriaState;
  if (canalId !== 'todos') {
    datosFiltrados = telemetriaState.filter((c) => c.id === canalId);
  }

  if (formato === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="streamrank_\({canalId}_\){periodo}.csv"`);
    let csv = 'Canal,Categoria,Handle,Viewers_Total,YouTube,Twitch,Kick,Estado,Titulo,Ultima_Actualizacion\n';
    datosFiltrados.forEach((c) => {
      csv += `"\({c.nombre}","\){c.categoria}","\({c.handle}",\){c.viewers},\({c.viewers_breakdown.yt},\){c.viewers_breakdown.tw},\({c.viewers_breakdown.ki},"\){c.is_live ? 'EN VIVO' : 'OFFLINE'}","\({(c.title || '').replace(/"/g, '""')}","\){c.hora_actualizacion}"\n`;
    });
    return res.send(csv);
  }

  const exportPayload = {
    metadata: {
      fuente: 'StreamRank Argentina',
      alcance: canalId,
      periodo: periodo,
      timestamp: new Date().toISOString(),
      formato: 'AI_Semantic_Dataset'
    },
    instrucciones_ia: {
      rol: 'Sos un auditor senior de medios y métricas de streaming en Argentina.',
      tarea: 'Respondé las dudas del usuario basándote exclusivamente en la telemetría adjunta.'
    },
    canales: datosFiltrados
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="streamrank_\({canalId}_\){periodo}.json"`);
  return res.json(exportPayload);
});

app.get('/modoia', (req, res) => {
  res.redirect(301, 'https://modoia.online');
});

app.use(express.static(publicPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[StreamRank ARG] Servidor activo en puerto ${PORT}`);
});
