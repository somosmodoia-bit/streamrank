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
  { id: 'luzutv', nombre: 'LUZU TV', categoria: 'entretenimiento', ytHandle: 'luzutv', ytChannelId: 'UC42bFp_6oP2r0nsqcI8sHqQ', twitchUser: 'luzutv' },
  { id: 'olga', nombre: 'OLGA', categoria: 'entretenimiento', ytHandle: 'olgaenvivo_', ytChannelId: 'UCW0mN66k8E_K7vV62f9sKMA', twitchUser: 'olgaenvivo' },
  { id: 'blender', nombre: 'Blender', categoria: 'entretenimiento', ytChannelId: 'UCgLBmUFPO8JtZ1nPIBQGMlQ', twitchUser: 'somosblender' },
  { id: 'gelatina', nombre: 'Gelatina', categoria: 'entretenimiento', ytHandle: 'somosgelatina', ytChannelId: 'UC37e4m0z6s3V6EaT3G4R8fQ', twitchUser: 'somosgelatina' },
  { id: 'vorterix', nombre: 'Vorterix', categoria: 'entretenimiento', ytHandle: 'vorterixoficial', ytChannelId: 'UC7fS5E3iV7f7K_e7y3Lz5rA', twitchUser: 'vorterixoficial' },
  { id: 'bondilive', nombre: 'Bondi Live', categoria: 'entretenimiento', ytHandle: 'bondi_liveok' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', categoria: 'entretenimiento', ytHandle: 'somoslacasa' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', categoria: 'entretenimiento', ytHandle: 'unpocoderuido' },
  { id: 'republicaz', nombre: 'República Z', categoria: 'entretenimiento', ytHandle: 'republicaz' },
  { id: 'posdata', nombre: 'Posdata', categoria: 'entretenimiento', ytChannelId: 'UC5wAqJ9NF0fpGH9dVf3h6HA' },
  { id: 'dgo', nombre: 'DGO en Vivo', categoria: 'entretenimiento', ytHandle: 'DGO_Latam' },
  { id: 'telefe', nombre: 'Telefe Streams', categoria: 'entretenimiento', ytHandle: 'telefe' },
  { id: 'eltrece', nombre: 'eltrece', categoria: 'entretenimiento', ytHandle: 'eltrece' },
  { id: 'americatv', nombre: 'América TV', categoria: 'entretenimiento', ytHandle: 'americatv' },
  { id: 'urbanaplay', nombre: 'Urbana Play', categoria: 'entretenimiento', ytHandle: 'UrbanaPlayFM', twitchUser: 'urbanaplayfm' },

  // 2. Deportes
  { id: 'programa412', nombre: '412 Fútbol (Davoo & Cobra)', categoria: 'deportes', ytHandle: 'elprograma412' },
  { id: 'azzstream', nombre: 'AZZ Stream (Azzaro)', categoria: 'deportes', ytChannelId: 'UCUT4NmGqjrVpKf2JyiS_bbA' },
  { id: 'picadotv', nombre: 'Picado TV', categoria: 'deportes', ytHandle: 'picadotv' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', categoria: 'deportes', ytChannelId: 'UCkJ9KX7nw-4rpyuVCRy2R-g' },
  { id: 'tycsports', nombre: 'TyC Sports', categoria: 'deportes', ytHandle: 'tycsports' },
  { id: 'dsports', nombre: 'DSports', categoria: 'deportes', ytHandle: 'dsports' },
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
  { id: 'bullmarket', nombre: 'Bull Market Brokers', categoria: 'finanzas', ytChannelId: 'UC7Hx4xBMuw_PvVUliihHEcQ' },
  { id: 'joveninversor', nombre: 'Joven Inversor', categoria: 'finanzas', ytHandle: 'JovenInversor' },
  { id: 'elcronista', nombre: 'El Cronista TV', categoria: 'finanzas', ytChannelId: 'UCXgsCoIhEUIwWvGK_JDY21w' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', categoria: 'finanzas', ytHandle: 'AmbitoCom' },
  { id: 'canale', nombre: 'Canal E', categoria: 'finanzas', ytChannelId: 'UCW53kA_WXKWVxJbpHrTOBfw' },

  // 5. Noticias & Actualidad
  { id: 'tn', nombre: 'TN (Todo Noticias)', categoria: 'noticias', ytHandle: 'todonoticias', ytChannelId: 'UCj6PcyLvpnIRT_2W_mwa9Aw' },
  { id: 'c5n', nombre: 'C5N', categoria: 'noticias', ytHandle: 'c5n', ytChannelId: 'UCFgk2Q2mVO1BklRQhSv6p0w' },
  { id: 'lanacionmas', nombre: 'La Nación +', categoria: 'noticias', ytChannelId: 'UCba3hpU7EFBSk817y9qZkiA' },
  { id: 'telefenoticias', nombre: 'Telefe Noticias', categoria: 'noticias', ytHandle: 'telefenoticias' },
  { id: 'telenueve', nombre: 'Telenueve / El Nueve', categoria: 'noticias', ytChannelId: 'UC6pJGaMdx5Ter_8zYbLoRgA' },
  { id: 'neura', nombre: 'Neura Media / Troncal', categoria: 'noticias', ytChannelId: 'UC-rI_XNppHJO-Ga4RW_CDKw', twitchUser: 'neuramedia' },
  { id: 'carajostream', nombre: 'Carajo Stream', categoria: 'noticias', ytChannelId: 'UCZi6C9-a4fYKiBoIuEJ80ZA' },
  { id: 'eldestape', nombre: 'El Destape', categoria: 'noticias', ytChannelId: 'UC4mdhKZXjrKoq5aVG6juHEg' },
  { id: 'a24', nombre: 'A24', categoria: 'noticias', ytHandle: 'A24com' },
  { id: 'infobae', nombre: 'Infobae en Vivo', categoria: 'noticias', ytHandle: 'infobae' },
  { id: 'elobservador', nombre: 'El Observador 107.9', categoria: 'noticias', ytChannelId: 'UC-40U87JsevMIMn7PMw4jPw' }
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

async function idsDesdeRSS(channelId, max) {
  try {
    const r = await fetch('
