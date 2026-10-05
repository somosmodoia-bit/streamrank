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

// Frecuencia optimizada: medición cada 30 segundos
const YT_POLL_MS = Number(process.env.YT_POLL_MS) || 30 * 1000;          // viewers cada 30s
const YT_RSS_MS = Number(process.env.YT_RSS_MS) || 3 * 60 * 1000;        // detector rápido vía RSS
const YT_DEEP_MS = Number(process.env.YT_DEEP_MS) || 45 * 60 * 1000;     // descubrimiento profundo

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
  { id: 'luzutv', nombre: 'LUZU TV', categoria: 'entretenimiento', ytChannelId: 'UC42bFp_6oP2r0nsqcI8sHqQ', twitchUser: 'luzutv' },
  { id: 'olga', nombre: 'OLGA', categoria: 'entretenimiento', ytChannelId: 'UCW0mN66k8E_K7vV62f9sKMA', twitchUser: 'olgaenvivo' },
  { id: 'blender', nombre: 'Blender', categoria: 'entretenimiento', ytChannelId: 'UCgBqYd47mYf4sY4U1zM_lYg', twitchUser: 'somosblender' },
  { id: 'gelatina', nombre: 'Gelatina', categoria: 'entretenimiento', ytChannelId: 'UC37e4m0z6s3V6EaT3G4R8fQ', twitchUser: 'somosgelatina' },
  { id: 'vorterix', nombre: 'Vorterix', categoria: 'entretenimiento', ytChannelId: 'UC7fS5E3iV7f7K_e7y3Lz5rA', twitchUser: 'vorterixoficial' },
  { id: 'bondilive', nombre: 'Bondi Live', categoria: 'entretenimiento', ytHandle: 'bondi_liveok' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', categoria: 'entretenimiento', ytHandle: 'somoslacasa' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', categoria: 'entretenimiento', ytHandle: 'unpocoderuido' },
  { id: 'republicaz', nombre: 'República Z', categoria: 'entretenimiento', ytHandle: 'republicaz' },
  { id: 'posdata', nombre: 'Posdata', categoria: 'entretenimiento', ytChannelId: 'UCk_V5-Z9d9B6u6Xj7Y_4w-A' },
  { id: 'dgo', nombre: 'DGO en Vivo', categoria: 'entretenimiento', ytChannelId: 'UCe1kpNidffw8QO0hF-k9Zpg' },
  { id: 'telefe', nombre: 'Telefe Streams', categoria: 'entretenimiento', ytHandle: 'telefe' },
  { id: 'eltrece', nombre: 'eltrece', categoria: 'entretenimiento', ytHandle: 'eltrece' },
  { id: 'americatv', nombre: 'América TV', categoria: 'entretenimiento', ytChannelId: 'UCxL28WpQkL6gNq9lq1Y7Fvw' },
  { id: 'urbanaplay', nombre: 'Urbana Play', categoria: 'entretenimiento', ytHandle: 'UrbanaPlayFM', twitchUser: 'urbanaplayfm' },

  // 2. Deportes
  { id: 'programa412', nombre: '412 Fútbol (Davoo & Cobra)', categoria: 'deportes', ytHandle: 'elprograma412' },
  { id: 'azzstream', nombre: 'AZZ Stream (Azzaro)', categoria: 'deportes', ytChannelId: 'UC1w7-zK_z8W8V1v8n1_4zGA' },
  { id: 'picadotv', nombre: 'Picado TV', categoria: 'deportes', ytHandle: 'picadotv' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', categoria: 'deportes', ytChannelId: 'UC5JbF7rY4k8Z9zX9Y7v_2wQ' },
  { id: 'tycsports', nombre: 'TyC Sports', categoria: 'deportes', ytHandle: 'tycsports' },
  { id: 'dsports', nombre: 'DSports', categoria: 'deportes', ytChannelId: 'UC7K3B8Wv6pX0Q8L_3zY1xqw' },
  { id: 'espnarg', nombre: 'ESPN Argentina', categoria: 'deportes', ytChannelId: 'UCYq_8L7B9V7-5z9V_4w_z9Q' },
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
  { id: 'bullmarket', nombre: 'Bull Market Brokers', categoria: 'finanzas', ytChannelId: 'UCu6M1iR1sV9kP1kF6_zQ4pA' },
  { id: 'joveninversor', nombre: 'Joven Inversor', categoria: 'finanzas', ytHandle: 'JovenInversor' },
  { id: 'elcronista', nombre: 'El Cronista TV', categoria: 'finanzas', ytChannelId: 'UCe5jUGh5l_H_g_wzYvNqNkB' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', categoria: 'finanzas', ytChannelId: 'UC6Id-7plehPeuR0M0BHRJgA' },
  { id: 'canale', nombre: 'Canal E', categoria: 'finanzas', ytChannelId: 'UCJ_7vV8w-3l8B8L_6k_zQ4A' },

  // 5. Noticias & Actualidad
  { id: 'tn', nombre: 'TN (Todo Noticias)', categoria: 'noticias', ytChannelId: 'UCj6PcyLvpnIRT_2W_mwa9Aw' },
  { id: 'c5n', nombre: 'C5N', categoria: 'noticias', ytChannelId: 'UCFgk2Q2mVO1BklRQhSv6p0w' },
  { id: 'lanacionmas', nombre: 'La Nación +', categoria: 'noticias', ytChannelId: 'UCba3hst5UmF3CYJnbyW82Tw' },
  { id: 'telefenoticias', nombre: 'Telefe Noticias', categoria: 'noticias', ytHandle: 'telefenoticias' },
  { id: 'telenueve', nombre: 'Telenueve / El Nueve', categoria: 'noticias', ytHandle: 'elnueveargentina' },
  { id: 'neura', nombre: 'Neura Media / Troncal', categoria: 'noticias', ytChannelId: 'UCe8M0h_F33W0H3Yj7qj-71w', twitchUser: 'neuramedia' },
  { id: 'carajostream', nombre: 'Carajo Stream', categoria: 'noticias', ytChannelId: 'UCRvP8dG3zZ1Xn_Wl1a1Gf1w' },
  { id: 'eldestape', nombre: 'El Destape', categoria: 'noticias', ytChannelId: 'UCe_4vL_7jX7_5z8V9kP1kFA' },
  { id: 'a24', nombre: 'A24', categoria: 'noticias', ytHandle: 'A24com' },
  { id: 'infobae', nombre: 'Infobae en Vivo', categoria: 'noticias', ytHandle: 'infobae' },
  { id: 'elobservador', nombre: 'El Observador 107.9', categoria: 'noticias', ytChannelId: 'UC30InH1wO8z4-G-m09A6n5Q' }
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

// ───────────────────────── 3. YouTube (API oficial, barata) ─────────────────────────
const YT_API = 'https://www.googleapis.com/youtube/v3';

const ytRuntime = new Map();
for (const c of CANALES) {
  if (!c.ytHandle && !c.ytChannelId) continue;
  ytRuntime.set(c.id, {
    canalId: c.id,
    handle: c.ytHandle || null,
    channelId: c.ytChannelId || null,
    resueltoDesdeHandle: false,
    resolveError: null,
    fixedVideoId: c.ytVideoId || null,
    uulv: undefined,
    videoId: c.ytVideoId || null,
    title: '',
    live: false,
    viewers: 0,
    updatedAt: 0,
    ultimoDescubrimiento: null
  });
}

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

  const url = new URL(YT_API + '/' + endpoint);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('key', YOUTUBE_API_KEY);

  sumarUnidades(costo);
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const texto = await r.text();
  let json = null;
  try { json = JSON.parse(texto); } catch (e) {}

  if (!r.ok) {
    const reason = (json && json.error && json.error.errors && json.error.errors[0] && json.error.errors[0].reason) || (json && json.error && json.error.status) || '';
    const err = new Error([endpoint, 'HTTP', r.status, reason, (json && json.error && json.error.message) || ''].join(' ').trim());
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

async function resolverTodos() {
  const pendientes = [...ytRuntime.values()].filter((rt) => rt.handle && !rt.resueltoDesdeHandle);
  await enLotes(pendientes, 5, async (rt) => {
    try {
      const h = rt.handle.startsWith('@') ? rt.handle : '@' + rt.handle;
      const data = await ytFetch('channels', { part: 'id', forHandle: h });
      const id = data && data.items && data.items[0] && data.items[0].id;
      if (id) {
        rt.channelId = id;
        rt.resueltoDesdeHandle = true;
        rt.resolveError = null;
      } else {
        rt.resolveError = 'Handle ' + h + ' no encontrado en YouTube (revisá el nombre)';
      }
    } catch (e) {
      rt.resolveError = e.message;
    }
  });
}

// RESTAURADA: Expresión regular correcta para capturar videoId
async function idsDesdeRSS(channelId, max) {
  try {
    const r = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId, {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36' },
      signal: AbortSignal.timeout(6000)
    });
    if (!r.ok) return { ids: [], status: r.status };
    const xml = await r.text();
    const ids = [...xml.matchAll(/([^<]+)<\/yt:videoId>/g)].map((m) => m[1]).slice(0, max);
    return { ids, status: r.status };
  } catch (e) {
    return { ids: [], status: 'ERR ' + e.message };
  }
}

async function idsDesdePlaylist(rt) {
  const base = rt.channelId.slice(2);
  const leer = async (prefijo, max) => {
    const d = await ytFetch('playlistItems', {
      part: 'contentDetails',
      playlistId: prefijo + base,
      maxResults: String(max)
    });
    return (d && d.items ? d.items : []).map((i) => i.contentDetails && i.contentDetails.videoId).filter(Boolean);
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

async function verificarVideos(ids) {
  const out = new Map();
  const unicos = [...new Set(ids)];
  for (let i = 0; i < unicos.length; i += 50) {
    const d = await ytFetch('videos', {
      part: 'snippet,liveStreamingDetails',
      id: unicos.slice(i, i + 50).join(',')
    });
    for (const it of (d && d.items ? d.items : [])) {
      const l = it.liveStreamingDetails;
      const live = Boolean(l && l.actualStartTime && !l.actualEndTime);
      out.set(it.id, {
        live,
        viewers: live ? Number(l.concurrentViewers || 0) : 0,
        title: (it.snippet && it.snippet.title) || 'En vivo'
      });
    }
  }
  return out;
}

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
      if (!rt.fixedVideoId) {
        rt.videoId = null;
      }
      rt.live = false;
      rt.viewers = 0;
      rt.title = '';
    }
    rt.updatedAt = Date.now();
  }
}

const enCurso = {};
async function correr(nombre, fn) {
  if (enCurso[nombre]) return;
  enCurso[nombre] = true;
  try {
    await fn();
  } catch (e) {
    console.error('[yt:' + nombre + ']', e.message);
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
    const r = await idsDesdeRSS(tn && tn.channelId ? tn.channelId : '', 5);
    salida.rssTest = { channelId: tn && tn.channelId, ...r };
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

app.use(express.static(publicPath));

app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('[StreamRank ARG] Servidor activo en puerto ' + PORT);
});
