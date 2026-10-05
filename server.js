import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// API Key de Google (sanitizada: sin comillas, espacios ni saltos de línea)
const YOUTUBE_API_KEY = (process.env.YOUTUBE_API_KEY || '').trim().replace(/['"\r\n\s]/g, '');

// Intervalos de YouTube (ajustables por variables de entorno en Render)
const YT_POLL_MS = Number(process.env.YT_POLL_MS) || 60 * 1000;          // viewers (1 unidad por 50 videos)
const YT_RSS_MS = Number(process.env.YT_RSS_MS) || 3 * 60 * 1000;        // detector rápido vía RSS (casi gratis)
const YT_DEEP_MS = Number(process.env.YT_DEEP_MS) || 45 * 60 * 1000;     // descubrimiento profundo vía playlists

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

// NOTA: ytChannelId es solo un "plan B". El server resuelve el ID real a partir de ytHandle.
// OPCIONAL: ytVideoId = ID de un directo 24/7 (lo sacás de la URL youtube.com/watch?v=XXXX cuando
// abrís el directo del canal). Es la forma más segura para TN, C5N, LN+, etc.
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
    avatar: `/logos/${c.id}.jpg`,
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

// ───────────────────────── 2. Twitch GQL ─────────────────────────
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

// ───────────────────────── 3. YouTube (API oficial, barata) ─────────────────────────
const YT_API = 'https://www.googleapis.com/youtube/v3';

// Estado en memoria por canal de YouTube
const ytRuntime = new Map();
for (const c of CANALES) {
  if (!c.ytHandle && !c.ytChannelId) continue;
  ytRuntime.set(c.id, {
    canalId: c.id,
    handle: c.ytHandle || null,
    channelId: c.ytChannelId || null,   // se pisa con el ID real resuelto desde el handle
    resueltoDesdeHandle: false,
    resolveError: null,
    fixedVideoId: c.ytVideoId || null,
    uulv: undefined,                    // undefined = sin probar, true/false = soportado o no
    videoId: null,
    title: '',
    live: false,
    viewers: 0,
    updatedAt: 0,
    ultimoDescubrimiento: null
  });
}

// Contador estimado de cuota (se resetea a medianoche hora del Pacífico, como Google)
const ytStats = { unidades: 0, dia: '', ultimoError: null, bloqueadoHasta: 0 };
function diaPT() {
  return new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
}
function sumarUnidades(n) {
  const hoy = diaPT();
  if (ytStats.dia !== hoy) { ytStats.dia = hoy; ytStats.unidades = 0; }
  ytStats.unidades += n;
}

async function ytFetch(endpoint, params, costo = 1) {
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY no está configurada');
  if (Date.now() < ytStats.bloqueadoHasta) throw new Error('Cuota agotada: YouTube en pausa');

  const url = new URL(`${YT_API}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('key', YOUTUBE_API_KEY);

  sumarUnidades(costo);
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const texto = await r.text();
  let json = null;
  try { json = JSON.parse(texto); } catch (e) {}

  if (!r.ok) {
    const reason = json?.error?.errors?.[0]?.reason || json?.error?.status || '';
    const err = new Error(`${endpoint} HTTP ${r.status} ${reason} ${json?.error?.message || ''}`.trim());
    err.status = r.status;
    err.reason = reason;
    if (r.status !== 404) ytStats.ultimoError = { cuando: new Date().toISOString(), mensaje: err.message };
    if (r.status === 403 && /quota/i.test(reason)) {
      ytStats.bloqueadoHasta = Date.now() + 30 * 60 * 1000;
    }
    throw err;
  }
  return json;
}

async function enLotes(items, n, fn) {
  for (let i = 0; i < items.length; i += n) {
    await Promise.all(items.slice(i, i + n).map(fn));
  }
}

// handle -> channelId (1 unidad, una sola vez por canal)
async function resolverTodos() {
  const pendientes = [...ytRuntime.values()].filter((rt) => rt.handle && !rt.resueltoDesdeHandle);
  await enLotes(pendientes, 5, async (rt) => {
    try {
      const h = rt.handle.startsWith('@') ? rt.handle : `@${rt.handle}`;
      const data = await ytFetch('channels', { part: 'id', forHandle: h });
      const id = data?.items?.[0]?.id;
      if (id) {
        rt.channelId = id;
        rt.resueltoDesdeHandle = true;
        rt.resolveError = null;
      } else {
        rt.resolveError = `Handle ${h} no encontrado en YouTube (revisá el nombre)`;
      }
    } catch (e) {
      rt.resolveError = e.message;
    }
  });
}

// RSS: 0 unidades. Devuelve los videoIds más recientes del canal
async function idsDesdeRSS(channelId, max) {
  try {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36' },
      signal: AbortSignal.timeout(6000)
    });
    if (!r.ok) return { ids: [], status: r.status };
    const xml = await r.text();
    const ids = [...xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map((m) => m[1]).slice(0, max);
    return { ids, status: r.status };
  } catch (e) {
    return { ids: [], status: `ERR ${e.message}` };
  }
}

// Playlist de directos (UULV) y, si no existe, uploads (UU): 1 unidad por llamada
async function idsDesdePlaylist(rt) {
  const base = rt.channelId.slice(2);
  const leer = async (prefijo, max) => {
    const d = await ytFetch('playlistItems', {
      part: 'contentDetails',
      playlistId: prefijo + base,
      maxResults: String(max)
    });
    return (d.items || []).map((i) => i.contentDetails?.videoId).filter(Boolean);
  };

  if (rt.uulv !== false) {
    try {
      const ids = await leer('UULV', 50);
      rt.uulv = true;
      if (ids.length) return { ids, fuente: 'UULV' };
    } catch (e) {
      if (e.status === 404 || e.status === 400) rt.uulv = false;
      else throw e;
    }
  }
  const ids = await leer('UU', 15);
  return { ids, fuente: 'UU' };
}

// Verifica videoIds en lotes de 50 (1 unidad por lote)
async function verificarVideos(ids) {
  const out = new Map();
  const unicos = [...new Set(ids)];
  for (let i = 0; i < unicos.length; i += 50) {
    const d = await ytFetch('videos', {
      part: 'snippet,liveStreamingDetails',
      id: unicos.slice(i, i + 50).join(',')
    });
    for (const it of d.items || []) {
      const l = it.liveStreamingDetails;
      const live = Boolean(l?.actualStartTime && !l?.actualEndTime);
      out.set(it.id, {
        live,
        viewers: live ? Number(l.concurrentViewers || 0) : 0,
        title: it.snippet?.title || 'En vivo'
      });
    }
  }
  return out;
}

// Busca directos en canales que hoy no tienen uno cacheado
async function descubrir({ playlist }) {
  const candidatos = [...ytRuntime.values()].filter((rt) => rt.channelId && !rt.videoId);
  const porCanal = new Map();

  await enLotes(candidatos, 5, async (rt) => {
    const info = { cuando: new Date().toISOString() };
    const ids = [];
    if (rt.fixedVideoId) ids.push(rt.fixedVideoId);

    const rss = await idsDesdeRSS(rt.channelId, playlist ? 15 : 5);
    info.rssStatus = rss.status;
    info.rssIds = rss.ids.length;
    ids.push(...rss.ids);

    if (playlist) {
      try {
        const pl = await idsDesdePlaylist(rt);
        info.playlist = pl.fuente;
        info.playlistIds = pl.ids.length;
        ids.push(...pl.ids);
      } catch (e) {
        info.playlistError = e.message;
      }
    }
    info.candidatos = [...new Set(ids)].length;
    rt.ultimoDescubrimiento = info;
    porCanal.set(rt.canalId, [...new Set(ids)]);
  });

  const todos = [...porCanal.values()].flat();
  if (!todos.length) return;

  const resultados = await verificarVideos(todos);
  for (const [canalId, ids] of porCanal) {
    const rt = ytRuntime.get(canalId);
    const vivos = ids
      .map((id) => ({ id, ...resultados.get(id) }))
      .filter((v) => v.live)
      .sort((a, b) => b.viewers - a.viewers);
    if (vivos.length) {
      rt.videoId = vivos[0].id;
      rt.title = vivos[0].title;
      rt.live = true;
      rt.viewers = vivos[0].viewers;
      rt.updatedAt = Date.now();
    }
  }
}

// Mide viewers de todos los directos cacheados con UNA llamada (por cada 50)
async function pollYouTube() {
  const activos = [...ytRuntime.values()].filter((rt) => rt.videoId);
  if (!activos.length) return;

  const res = await verificarVideos(activos.map((rt) => rt.videoId));
  for (const rt of activos) {
    const m = res.get(rt.videoId);
    if (m && m.live) {
      rt.live = true;
      rt.viewers = m.viewers;
      rt.title = m.title;
    } else {
      // terminó (o fue borrado): liberar para que se redescubra
      rt.videoId = null;
      rt.live = false;
      rt.viewers = 0;
      rt.title = '';
    }
    rt.updatedAt = Date.now();
  }
}

// Ejecuta tareas sin solaparse y SIN tragarse los errores
const enCurso = {};
async function correr(nombre, fn) {
  if (enCurso[nombre]) return;
  enCurso[nombre] = true;
  try {
    await fn();
  } catch (e) {
    console.error(`[yt:${nombre}]`, e.message);
  } finally {
    enCurso[nombre] = false;
  }
}

async function iniciarYouTube() {
  if (!YOUTUBE_API_KEY) {
    console.error('[yt] FALTA la variable YOUTUBE_API_KEY en Render');
    return;
  }
  await correr('resolver', resolverTodos);
  await correr('deep', () => descubrir({ playlist: true }));
  await correr('poll', pollYouTube);

  setInterval(() => correr('poll', pollYouTube), YT_POLL_MS);
  setInterval(() => correr('rss', () => descubrir({ playlist: false })), YT_RSS_MS);
  setInterval(() => correr('deep', () => descubrir({ playlist: true })), YT_DEEP_MS);
  setInterval(() => correr('resolver', resolverTodos), 6 * 60 * 60 * 1000);
}

// ───────────────────────── Pipeline Twitch / Kick + cruce con YouTube ─────────────────────────
let ejecutandoSync = false;
async function sincronizarPipeline() {
  if (ejecutandoSync) return;
  ejecutandoSync = true;

  const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  try {
    for (const canal of telemetriaState) {
      const [tw, ki] = await Promise.all([
        canal.twitchUser ? consultarTwitch(canal.twitchUser) : Promise.resolve({ isLive: false, viewers: 0 }),
        canal.kickUser ? consultarKick(canal.kickUser) : Promise.resolve({ isLive: false, viewers: 0 })
      ]);

      let ytViewers = 0;
      let ytLive = false;
      let ytTitle = '';

      const rt = ytRuntime.get(canal.id);
      if (rt) {
        if (rt.channelId) canal.ytChannelId = rt.channelId;
        // Si el último dato de YouTube es muy viejo (API caída), no mostramos números inventados
        const fresco = rt.live && Date.now() - rt.updatedAt < 5 * 60 * 1000;
        if (fresco) {
          ytLive = true;
          ytViewers = rt.viewers;
          ytTitle = rt.title;
        }
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
setInterval(sincronizarPipeline, 30000);
iniciarYouTube();

// ───────────────────────── Diagnóstico ─────────────────────────
// /api/debug-yt            -> estado de todos los canales de YouTube
// /api/debug-yt?test=1     -> prueba real contra la API (muestra el error exacto de Google)
// /api/debug-yt?rss=1      -> prueba si el RSS de YouTube responde desde Render
app.get('/api/debug-yt', async (req, res) => {
  const salida = {
    apiKeyConfigurada: Boolean(YOUTUBE_API_KEY),
    apiKeyLargo: YOUTUBE_API_KEY.length,
    cuota: { ...ytStats, pausadoHasta: ytStats.bloqueadoHasta ? new Date(ytStats.bloqueadoHasta).toISOString() : null },
    canales: [...ytRuntime.values()].map((rt) => ({
      id: rt.canalId,
      handle: rt.handle,
      channelId: rt.channelId,
      resueltoDesdeHandle: rt.resueltoDesdeHandle,
      resolveError: rt.resolveError,
      videoIdCacheado: rt.videoId,
      live: rt.live,
      viewers: rt.viewers,
      actualizado: rt.updatedAt ? new Date(rt.updatedAt).toISOString() : null,
      uulvSoportado: rt.uulv,
      ultimoDescubrimiento: rt.ultimoDescubrimiento
    }))
  };

  if (req.query.test) {
    try {
      const d = await ytFetch('channels', { part: 'id', forHandle: '@todonoticias' });
      salida.test = { ok: true, respuesta: d };
    } catch (e) {
      salida.test = { ok: false, error: e.message };
    }
  }

  if (req.query.rss) {
    const tn = ytRuntime.get('tn');
    const r = await idsDesdeRSS(tn?.channelId || '', 5);
    salida.rssTest = { channelId: tn?.channelId, ...r };
  }

  res.json(salida);
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

const csvCampo = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

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
    res.setHeader('Content-Disposition', `attachment; filename="streamrank_${canalId}_${periodo}.csv"`);
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
  res.setHeader('Content-Disposition', `attachment; filename="streamrank_${canalId}_${periodo}.json"`);
  return res.json(exportPayload);
});

app.get('/modoia', (req, res) => {
  res.redirect(301, 'https://modoia.online');
});

app.use(express.static(publicPath));

// Fallback SPA (funciona igual en Express 4 y 5)
app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[StreamRank ARG] Servidor activo en puerto ${PORT}`);
});
