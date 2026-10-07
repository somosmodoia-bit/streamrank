import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// API Key de Google (opcional/secundaria)
const YOUTUBE_API_KEY = (process.env.YOUTUBE_API_KEY || '').trim().replace(/['"\r\n\s]/g, '');

// Frecuencias de sondeo
const SCRAPE_INTERVAL_MS = 25 * 1000; // Sondeo cada 25 segundos

// Funciones auxiliares para hora oficial de Argentina (GMT-3)
const TZ_ARG = 'America/Argentina/Buenos_Aires';
function obtenerHoraArg() {
  return new Date().toLocaleTimeString('es-AR', {
    timeZone: TZ_ARG,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
function obtenerFechaArg() {
  return new Date().toLocaleDateString('es-AR', {
    timeZone: TZ_ARG,
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

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
  { id: 'luzutv', nombre: 'LUZU TV', categoria: 'entretenimiento', ytHandle: 'luzutv', ytChannelId: 'UCTHaNTsP7hsVgBxARZTuajw', twitchUser: 'luzu_tv' },
  { id: 'olga', nombre: 'OLGA', categoria: 'entretenimiento', ytHandle: 'olgaenvivo_', ytChannelId: 'UC7mJ2EDXFomeDIRFu5FtEbA', twitchUser: 'olgaenvivo' },
  { id: 'blender', nombre: 'Blender', categoria: 'entretenimiento', ytHandle: 'estoesblender', ytChannelId: 'UC6pJGaMdx5Ter_8zYbLoRgA', twitchUser: 'somosblender' },
  { id: 'gelatina', nombre: 'Gelatina', categoria: 'entretenimiento', ytHandle: 'somosgelatina', ytChannelId: 'UCWSfXECGo1qK_H7SXRaUSMg', twitchUser: 'somosgelatina' },
  { id: 'vorterix', nombre: 'Vorterix', categoria: 'entretenimiento', ytHandle: 'vorterixoficial', ytChannelId: 'UCvCTWHCbBC0b9UIeLeNs8ug', twitchUser: 'vorterixoficial' },
  { id: 'bondilive', nombre: 'Bondi Live', categoria: 'entretenimiento', ytHandle: 'bondi_liveok' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', categoria: 'entretenimiento', ytHandle: 'somoslacasa' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', categoria: 'entretenimiento', ytHandle: 'unpocoderuido' },
  { id: 'republicaz', nombre: 'República Z', categoria: 'entretenimiento', ytHandle: 'republicaz' },
  { id: 'posdata', nombre: 'Posdata', categoria: 'entretenimiento', ytHandle: 'posdata_ar', ytChannelId: 'UC7Hx4xBMuw_PvVUliihHEcQ' },
  { id: 'dgo', nombre: 'DGO en Vivo', categoria: 'entretenimiento', ytHandle: 'DGO_Latam' },
  { id: 'telefe', nombre: 'Telefe Streams', categoria: 'entretenimiento', ytHandle: 'telefe' },
  { id: 'eltrece', nombre: 'eltrece', categoria: 'entretenimiento', ytHandle: 'eltrece' },
  { id: 'americatv', nombre: 'América TV', categoria: 'entretenimiento', ytHandle: 'americatvoficial', ytChannelId: 'UCHAgps_pNYnQHkB9FGCSozQ' },
  { id: 'urbanaplay', nombre: 'Urbana Play', categoria: 'entretenimiento', ytHandle: 'UrbanaPlayFM', ytChannelId: 'UCC1kfsMJko54AqxtcFECt-A', twitchUser: 'urbanaplayfm' },

  // 2. Deportes
  { id: 'vestuario', nombre: 'Vestuario Stream', categoria: 'deportes', ytHandle: 'VestuarioStream' },
  { id: 'programa412', nombre: '412 Fútbol (Davoo & Cobra)', categoria: 'deportes', ytHandle: 'programa412', ytChannelId: 'UCD2w1rGcJc99akNKluz_FDw' },
  { id: 'azzstream', nombre: 'AZZ Stream (Azzaro)', categoria: 'deportes', ytHandle: 'somosazz', ytChannelId: 'UCgLBmUFPO8JtZ1nPIBQGMlQ' },
  { id: 'picadotv', nombre: 'Picado TV', categoria: 'deportes', ytHandle: 'picadotvok', ytChannelId: 'UC9ghrLcpy0FxDFssie-siwQ' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', categoria: 'deportes', ytHandle: 'carrozzaoficial', ytChannelId: 'UCkJ9KX7nw-4rpyuVCRy2R-g' },
  { id: 'tycsports', nombre: 'TyC Sports', categoria: 'deportes', ytHandle: 'tycsports' },
  { id: 'dsports', nombre: 'DSports', categoria: 'deportes', ytHandle: 'dsportsok', ytChannelId: 'UCWSsHdxrwVLlOSdPJ44y9sw' },
  { id: 'espnarg', nombre: 'ESPN Argentina', categoria: 'deportes', ytHandle: 'espn' },
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
  { id: 'bullmarket', nombre: 'Bull Market Brokers', categoria: 'finanzas', ytHandle: 'somosbullmarket', ytChannelId: 'UCXgsCoIhEUIwWvGK_JDY21w' },
  { id: 'joveninversor', nombre: 'Joven Inversor', categoria: 'finanzas', ytHandle: 'JovenInversor', ytChannelId: 'UCnOWLhk15P-gUV7RdehAI2Q' },
  { id: 'elcronista', nombre: 'El Cronista TV', categoria: 'finanzas', ytHandle: 'Cronista_ar', ytChannelId: 'UCZi6C9-a4fYKiBoIuEJ80ZA' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', categoria: 'finanzas', ytHandle: 'ambito_financiero', ytChannelId: 'UCXKphgduQN0dXiz_ioRTfeA' },
  { id: 'canale', nombre: 'Canal E', categoria: 'finanzas', ytHandle: 'canaldeeconomia', ytChannelId: 'UCW53kA_WXKWVxJbpHrTOBfw', ytVideoId: 'svekeJWi27o' },

  // 5. Noticias & Actualidad
  { id: 'tn', nombre: 'TN (Todo Noticias)', categoria: 'noticias', ytHandle: 'todonoticias', ytChannelId: 'UCj6PcyLvpnIRT_2W_mwa9Aw' },
  { id: 'c5n', nombre: 'C5N', categoria: 'noticias', ytHandle: 'c5n', ytChannelId: 'UCFgk2Q2mVO1BklRQhSv6p0w' },
  { id: 'lanacionmas', nombre: 'La Nación +', categoria: 'noticias', ytHandle: 'lanacion', ytChannelId: 'UCba3hpU7EFBSk817y9qZkiA', ytVideoId: 'FEWZjXJ7M0c' },
  { id: 'telefenoticias', nombre: 'Telefe Noticias', categoria: 'noticias', ytHandle: 'telefenoticias' },
  { id: 'telenueve', nombre: 'Telenueve / El Nueve', categoria: 'noticias', ytHandle: 'TelenueveC9', ytChannelId: 'UC2Q91pxDF0BPf0eK44pgYMw' },
  { id: 'neura', nombre: 'Neura Media / Troncal', categoria: 'noticias', ytHandle: 'NeuraMedia', ytChannelId: 'UC-40U87JsevMIMn7PMw4jPw', twitchUser: 'neuramedia' },
  { id: 'carajostream', nombre: 'Carajo Stream', categoria: 'noticias', ytHandle: 'carajostream', ytChannelId: 'UC4mdhKZXjrKoq5aVG6juHEg' },
  { id: 'eldestape', nombre: 'El Destape', categoria: 'noticias', ytHandle: 'ElDestapeTV', ytChannelId: 'UC5wAqJ9NF0fpGH9dVf3h6HA' },
  { id: 'a24', nombre: 'A24', categoria: 'noticias', ytHandle: 'A24com' },
  { id: 'infobae', nombre: 'Infobae en Vivo', categoria: 'noticias', ytHandle: 'infobae' },
  { id: 'elobservador', nombre: 'El Observador 107.9', categoria: 'noticias', ytHandle: 'ElObservador107.9', ytChannelId: 'UC-rI_XNppHJO-Ga4RW_CDKw' }
];

const publicPath = path.resolve(__dirname, 'public');
const logosDir = path.join(publicPath, 'logos');

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const horaBase = obtenerHoraArg();

const telemetriaState = CANALES.map((c) => {
  const handle = '@' + (c.ytHandle || c.twitchUser || c.kickUser || c.id);
  return {
    id: c.id,
    nombre: c.nombre,
    categoria: c.categoria,
    ytHandle: c.ytHandle || null,
    ytChannelId: c.ytChannelId || null,
    twitchUser: c.twitchUser || null,
    kickUser: c.kickUser || null,
    handle,
    avatar: '/logos/' + c.id + '.jpg',
    viewers: 0,
    is_live: false,
    title: 'Señal en espera',
    hora_actualizacion: horaBase,
    plataformas_live: { yt: false, tw: false, ki: false },
    viewers_breakdown: { yt: 0, tw: 0, ki: 0 }
  };
});

// ───────────────────────── 1. Kick ─────────────────────────
async function consultarKick(user) {
  if (!user) return { isLive: false, viewers: 0 };
  try {
    const res = await fetch('https://kick.com/api/v1/channels/' + user, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return { isLive: false, viewers: 0 };
    const data = await res.json();
    if (data && data.livestream && data.livestream.is_live) {
      return {
        isLive: true,
        viewers: parseInt(data.livestream.viewer_count || 0, 10),
        title: data.livestream.session_title || ''
      };
    }
  } catch (e) {}
  return { isLive: false, viewers: 0 };
}

// ───────────────────────── 2. Twitch GQL ─────────────────────────
async function consultarTwitch(user) {
  if (!user) return { isLive: false, viewers: 0 };
  try {
    const query = JSON.stringify({
      query: 'query { user(login: "' + user + '") { stream { viewersCount title } } }'
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
    const stream = data && data.data && data.data.user && data.data.user.stream;
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

// ───────────────────────── 3. YouTube (Scraper Directo Sin Cuota) ─────────────────────────
const ytRuntime = new Map();
for (const c of CANALES) {
  if (!c.ytHandle && !c.ytChannelId) continue;
  ytRuntime.set(c.id, {
    canalId: c.id,
    handle: c.ytHandle || null,
    channelId: c.ytChannelId || null,
    fixedVideoId: c.ytVideoId || null,
    videoId: c.ytVideoId || null,
    title: '',
    live: false,
    viewers: 0,
    consecutiveFails: 0
  });
}

function parsearViewersYoutube(html) {
  const runMatch = html.match(/"viewCount":\{"runs":\[\{"text":"([0-9.,\s]+)"/);
  if (runMatch && runMatch[1]) {
    const n = parseInt(runMatch[1].replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n)) return n;
  }
  const simpleMatch = html.match(/"viewCount":\{"simpleText":"([0-9.,\s]+)/);
  if (simpleMatch && simpleMatch[1]) {
    const n = parseInt(simpleMatch[1].replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n)) return n;
  }
  const shortMatch = html.match(/"shortViewCount":\{"runs":\[\{"text":"([0-9.,\s]+)"/);
  if (shortMatch && shortMatch[1]) {
    const n = parseInt(shortMatch[1].replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n)) return n;
  }
  return 0;
}

function parsearTituloYoutube(html) {
  const videoTitleMatch = html.match(/"videoDetails":\{[^}]*"title":"([^"]+)"/);
  if (videoTitleMatch && videoTitleMatch[1]) {
    return videoTitleMatch[1]
      .replace(/\\u0026/g, '&')
      .replace(/\\"/g, '"')
      .trim();
  }

  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
  if (ogTitleMatch && ogTitleMatch[1]) {
    return ogTitleMatch[1].replace(' - YouTube', '').trim();
  }

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].replace(' - YouTube', '').trim();
  }
  return 'En vivo';
}

async function consultarYoutubeDirecto(rt) {
  try {
    let url = null;
    if (rt.fixedVideoId) {
      url = 'https://www.youtube.com/watch?v=' + rt.fixedVideoId;
    } else if (rt.handle) {
      const h = rt.handle.startsWith('@') ? rt.handle : '@' + rt.handle;
      url = 'https://www.youtube.com/' + h + '/live';
    } else if (rt.channelId) {
      url = 'https://www.youtube.com/channel/' + rt.channelId + '/live';
    }
    if (!url) return null;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      rt.consecutiveFails++;
      return null;
    }

    const html = await res.text();
    const esEnVivo = html.includes('"isLive":true') || 
                     html.includes('"isLiveStream":true') || 
                     html.includes('{"text":" mirando"}') || 
                     html.includes('watching now') ||
                     html.includes('directo');

    if (!esEnVivo) {
      rt.consecutiveFails++;
      if (rt.consecutiveFails >= 2) {
        rt.live = false;
        rt.viewers = 0;
        rt.videoId = null;
      }
      return null;
    }

    let vid = rt.fixedVideoId;
    if (!vid) {
      const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)"/);
      if (canonicalMatch && canonicalMatch[1] && canonicalMatch[1] !== 'live') {
        vid = canonicalMatch[1];
      }
    }

    const viewers = parsearViewersYoutube(html);
    const title = parsearTituloYoutube(html);

    rt.live = true;
    rt.viewers = viewers > 0 ? viewers : (rt.viewers > 0 ? rt.viewers : 1);
    rt.title = title;
    rt.videoId = vid;
    rt.consecutiveFails = 0;
  } catch (e) {
    rt.consecutiveFails++;
  }
}

async function sincronizarYoutube() {
  const canalesYT = [...ytRuntime.values()];
  for (let i = 0; i < canalesYT.length; i += 6) {
    await Promise.all(canalesYT.slice(i, i + 6).map(consultarYoutubeDirecto));
  }
}

// ───────────────────────── Pipeline Twitch / Kick + cruce con YouTube ─────────────────────────
let ejecutandoSync = false;
async function sincronizarPipeline() {
  if (ejecutandoSync) return;
  ejecutandoSync = true;

  const horaActual = obtenerHoraArg();

  try {
    await sincronizarYoutube();

    for (const canal of telemetriaState) {
      const [tw, ki] = await Promise.all([
        canal.twitchUser ? consultarTwitch(canal.twitchUser) : Promise.resolve({ isLive: false, viewers: 0 }),
        canal.kickUser ? consultarKick(canal.kickUser) : Promise.resolve({ isLive: false, viewers: 0 })
      ]);

      let ytViewers = 0;
      let ytLive = false;
      let ytTitle = '';

      const rt = ytRuntime.get(canal.id);
      if (rt && rt.live) {
        ytLive = true;
        ytViewers = rt.viewers;
        ytTitle = rt.title;
      }

      canal.viewers_breakdown = { yt: ytViewers, tw: tw.viewers, ki: ki.viewers };
      canal.plataformas_live = { yt: ytLive, tw: tw.isLive, ki: ki.isLive };
      canal.viewers = ytViewers + tw.viewers + ki.viewers;
      canal.is_live = ytLive || tw.isLive || ki.isLive;
      canal.title = canal.is_live ? (ytTitle || tw.title || ki.title || 'En vivo') : 'Señal en espera';
      canal.hora_actualizacion = horaActual;
    }
  } catch (err) {
    console.error('Error sincronizando pipeline:', err);
  } finally {
    ejecutandoSync = false;
  }
}

setTimeout(sincronizarPipeline, 1000);
setInterval(sincronizarPipeline, SCRAPE_INTERVAL_MS);

// ───────────────────────── Diagnóstico ─────────────────────────
app.get('/api/debug-yt', async (req, res) => {
  res.json({
    motor: 'Extractor directo sin cuota de Google',
    canales: [...ytRuntime.values()].map((rt) => ({
      id: rt.canalId,
      handle: rt.handle,
      live: rt.live,
      viewers: rt.viewers,
      videoId: rt.videoId,
      title: rt.title
    }))
  });
});

// ───────────────────────── Auth y endpoints principales ─────────────────────────
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
      timestamp: obtenerHoraArg(),
      fecha: obtenerFechaArg(),
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

const csvCampo = (v) => '"' + String(v != null ? v : '').replace(/"/g, '""') + '"';

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
    res.setHeader('Content-Disposition', 'attachment; filename="streamrank_' + canalId + '_' + periodo + '.csv"');
    let csv = 'Canal,Categoria,Handle,Viewers_Total,YouTube,Twitch,Kick,Estado,Titulo,Ultima_Actualizacion\n';
    datosFiltrados.forEach((c) => {
      csv += [
        csvCampo(c.nombre),
        csvCampo(c.categoria),
        csvCampo(c.handle),
        c.viewers,
        c.viewers_breakdown.yt,
        c.viewers_breakdown.tw,
        c.viewers_breakdown.ki,
        csvCampo(c.is_live ? 'EN VIVO' : 'OFFLINE'),
        csvCampo(c.title),
        csvCampo(c.hora_actualizacion)
      ].join(',') + '\n';
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
  res.setHeader('Content-Disposition', 'attachment; filename="streamrank_' + canalId + '_' + periodo + '.json"');
  return res.json(exportPayload);
});

app.get('/modoia', (req, res) => {
  res.redirect(301, 'https://modoia.online');
});

// Archivos estáticos generales (logos, css, etc.)
app.use(express.static(publicPath, { index: false }));

// ─────────────────────────────────────────────────────────────────────────────
// PROXY SEMÁNTICO / INTERCEPTOR EN EL EDGE PARA CRAWLERS DE IA Y USUARIOS
// ─────────────────────────────────────────────────────────────────────────────
const AI_BOTS_REGEX = /GPTBot|OAI-SearchBot|ClaudeBot|PerplexityBot|Google-Extended|Applebot-Extended|bingbot|Googlebot/i;

let indexTemplateCache = null;
function obtenerIndexTemplate() {
  if (!indexTemplateCache) {
    try {
      indexTemplateCache = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf-8');
    } catch (e) {
      indexTemplateCache = '';
    }
  }
  return indexTemplateCache;
}

app.use((req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const indexPath = path.join(publicPath, 'index.html');

  // Si es un usuario humano común, entrega el archivo estático estándar sin demora
  if (!AI_BOTS_REGEX.test(userAgent)) {
    return res.sendFile(indexPath);
  }

  // SI ES UN BOT O CRAWLER DE IA: Inyecta la telemetría viva de ese minuto
  try {
    const rawHtml = obtenerIndexTemplate();
    if (!rawHtml) return res.sendFile(indexPath);

    const hora = obtenerHoraArg();
    const fecha = obtenerFechaArg();

    // Obtener los canales en vivo ordenados por audiencia real en memoria
    const canalesVivos = telemetriaState
      .filter((c) => c.is_live && c.viewers > 0)
      .sort((a, b) => b.viewers - a.viewers);

    const top1 = canalesVivos[0] || null;
    const top2 = canalesVivos[1] || null;

    let snapshotSemantico = `<!-- SNAPSHOT EN TIEMPO REAL STREAMRANK ARG (${fecha} ${hora} hs) -->\n`;
    snapshotSemantico += `<div id="telemetria-en-vivo-ia" style="display:block; padding:15px; margin-bottom:20px; background:#0b1120; border:1px solid #00ff88; border-radius:12px; font-family:monospace; color:#f8fafc;">\n`;
    snapshotSemantico += `  <p><strong>[TELEMETRÍA EN VIVO OFICIAL STREAMRANK ARG - CORTE: ${fecha} ${hora} hs]</strong></p>\n`;
    
    if (top1) {
      snapshotSemantico += `  <p>👑 <strong>#1 LÍDER DE AUDIENCIA ACTUAL:</strong> ${top1.nombre} con <strong>${top1.viewers.toLocaleString('es-AR')} espectadores concurrentes</strong> ("${top1.title}").</p>\n`;
    }
    if (top2) {
      snapshotSemantico += `  <p>🥈 <strong>#2 SEGUNDO PUESTO ACTUAL:</strong> ${top2.nombre} con <strong>${top2.viewers.toLocaleString('es-AR')} espectadores concurrentes</strong>.</p>\n`;
    }
    if (!top1 && !top2) {
      snapshotSemantico += `  <p>ℹ️ Canales en señal de espera / corte de programación diurna.</p>\n`;
    }

    snapshotSemantico += `  <p>📊 <strong>RANKING EN DIRECTO DE CANALES MONITOREADOS:</strong></p>\n  <ul>\n`;
    telemetriaState.slice(0, 10).forEach((c, idx) => {
      snapshotSemantico += `    <li>#${idx + 1} <strong>${c.nombre}</strong> (@${c.id}): ${c.is_live ? `${c.viewers.toLocaleString('es-AR')} viewers (EN VIVO: YouTube${c.viewers_breakdown.yt.toLocaleString('es-AR')} | Twitch ${c.viewers_breakdown.tw.toLocaleString('es-AR')} \vert{} Kick${c.viewers_breakdown.ki.toLocaleString('es-AR')})` : 'OFFLINE / EN ESPERA'}</li>\n`;
    });
    snapshotSemantico += `  </ul>\n</div>\n`;

    // Inyecta el snapshot justo antes de cerrar el main del HTML
    const htmlInyectado = rawHtml.replace('<main id="catalogContainer"', `${snapshotSemantico}\n    <main id="catalogContainer"`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-StreamRank-Proxy', 'AI-Realtime-Interception-Active');
    return res.send(htmlInyectado);
  } catch (err) {
    return res.sendFile(indexPath);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('[StreamRank ARG] Servidor activo en puerto ' + PORT);
});
