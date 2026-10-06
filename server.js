import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

const YOUTUBE_API_KEY = (process.env.YOUTUBE_API_KEY || '').trim().replace(/['"\r\n\s]/g, '');

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
  { id: 'luzutv', nombre: 'LUZU TV', categoria: 'entretenimiento', ytHandle: 'luzutv', ytChannelId: 'UCTHaNTsP7hsVgBxARZTuajw', twitchUser: 'luzutv' },
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
  { id: 'telefe', nombre: 'Telefe Streams', categoria: 'entretenimiento', ytHandle: 'telefe', ytChannelId: 'UCtr5xY_4s6D5m_V8Q8o3p0w' },
  { id: 'eltrece', nombre: 'eltrece', categoria: 'entretenimiento', ytHandle: 'eltrece', ytChannelId: 'UCnhXpUj5e_Z_m4qQk8p4kzw' },
  { id: 'americatv', nombre: 'América TV', categoria: 'entretenimiento', ytHandle: 'americatvoficial', ytChannelId: 'UCHAgps_pNYnQHkB9FGCSozQ' },
  { id: 'urbanaplay', nombre: 'Urbana Play', categoria: 'entretenimiento', ytHandle: 'UrbanaPlayFM', ytChannelId: 'UCC1kfsMJko54AqxtcFECt-A', twitchUser: 'urbanaplayfm' },

  // 2. Deportes
  { id: 'programa412', nombre: '412 Fútbol (Davoo & Cobra)', categoria: 'deportes', ytHandle: 'programa412', ytChannelId: 'UCD2w1rGcJc99akNKluz_FDw' },
  { id: 'azzstream', nombre: 'AZZ Stream (Azzaro)', categoria: 'deportes', ytHandle: 'somosazz', ytChannelId: 'UCgLBmUFPO8JtZ1nPIBQGMlQ' },
  { id: 'picadotv', nombre: 'Picado TV', categoria: 'deportes', ytHandle: 'picadotvok', ytChannelId: 'UC9ghrLcpy0FxDFssie-siwQ' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', categoria: 'deportes', ytHandle: 'carrozzaoficial', ytChannelId: 'UCkJ9KX7nw-4rpyuVCRy2R-g' },
  { id: 'tycsports', nombre: 'TyC Sports', categoria: 'deportes', ytHandle: 'tycsports', ytChannelId: 'UCde8a1Bv3hK8x_xK1w8GZ6Q' },
  { id: 'dsports', nombre: 'DSports', categoria: 'deportes', ytHandle: 'dsportsok', ytChannelId: 'UCWSsHdxrwVLlOSdPJ44y9sw' },
  { id: 'espnarg', nombre: 'ESPN Argentina', categoria: 'deportes', ytHandle: 'espn', ytChannelId: 'UCqE_Wz-qHqK2N5qJ6g14m5Q' },
  { id: 'tntsportsarg', nombre: 'TNT Sports Argentina', categoria: 'deportes', ytHandle: 'TNTSportsAR', ytChannelId: 'UC8v5a4eZf6sV1QjGvD2R25w' },

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
  { id: 'canale', nombre: 'Canal E', categoria: 'finanzas', ytHandle: 'canaldeeconomia', ytChannelId: 'UCW53kA_WXKWVxJbpHrTOBfw' },

  // 5. Noticias & Actualidad
  { id: 'tn', nombre: 'TN (Todo Noticias)', categoria: 'noticias', ytHandle: 'todonoticias', ytChannelId: 'UCj6PcyLvpnIRT_2W_mwa9Aw' },
  { id: 'c5n', nombre: 'C5N', categoria: 'noticias', ytHandle: 'c5n', ytChannelId: 'UCFgk2Q2mVO1BklRQhSv6p0w' },
  { id: 'lanacionmas', nombre: 'La Nación +', categoria: 'noticias', ytHandle: 'lanacion', ytChannelId: 'UCba3hpU7EFBSk817y9qZkiA' },
  { id: 'telefenoticias', nombre: 'Telefe Noticias', categoria: 'noticias', ytHandle: 'telefenoticias', ytChannelId: 'UCz_0Xgq_Q8kO5lR_n8Nf_wQ' },
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
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

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

// ───────────────────────── 1. Kick (Liviano con timeout estricto) ─────────────────────────
async function consultarKick(user) {
  if (!user) return { isLive: false, viewers: 0 };
  try {
    const res = await fetch('https://kick.com/api/v1/channels/' + user, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(2000)
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
      signal: AbortSignal.timeout(2000)
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

// ───────────────────────── 3. YouTube (Optimizado) ─────────────────────────
const ytRuntime = new Map();
for (const c of CANALES) {
  if (!c.ytHandle && !c.ytChannelId) continue;
  ytRuntime.set(c.id, {
    canalId: c.id,
    handle: c.ytHandle || null,
    channelId: c.ytChannelId || null,
    videoId: null,
    title: '',
    live: false,
    viewers: 0
  });
}

async function idsDesdeRSS(channelId) {
  try {
    const r = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(2500)
    });
    if (!r.ok) return [];
    const xml = await r.text();
    return [...xml.matchAll(/([^<]+)<\/yt:videoId>/g)].map((m) => m[1]).slice(0, 3);
  } catch (e) {
    return [];
  }
}

async function scrapearLiveDirecto(handle) {
  try {
    const cleanHandle = handle.replace('@', '');
    const res = await fetch(`https://www.youtube.com/@${cleanHandle}/live`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(3000),
      redirect: 'follow'
    });
    if (!res.ok) return null;
    const html = await res.text();
    const isLive = html.includes('"isLive":true') || html.includes('"isLiveStream":true');
    if (!isLive) return null;

    let viewers = 0;
    const vcMatch = html.match(/"viewCount":\{"runs":\[\{"text":"([^"]+)"\}/) || html.match(/"videoViewCountRenderer":\{"viewCount":\{"simpleText":"([^"]+)"\}/);
    if (vcMatch && vcMatch[1]) {
      viewers = parseInt(vcMatch[1].replace(/[^0-9]/g, ''), 10) || 0;
    }

    let title = '';
    const tMatch = html.match(/(.*?)<\/title>/);
    if (tMatch && tMatch[1]) {
      title = tMatch[1].replace('- YouTube', '').trim();
    }
    return { isLive: true, viewers, title };
  } catch (err) {
    return null;
  }
}

async function verificarVideosApi(ids) {
  const out = new Map();
  if (!YOUTUBE_API_KEY || !ids.length) return out;
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=\({ids.join(',')}&key=\){YOUTUBE_API_KEY}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return out;
    const d = await r.json();
    for (const it of (d?.items || [])) {
      const l = it.liveStreamingDetails;
      const live = Boolean(l && l.actualStartTime && !l.actualEndTime);
      out.set(it.id, {
        live,
        viewers: live ? Number(l.concurrentViewers || 0) : 0,
        title: it.snippet?.title || 'En vivo'
      });
    }
  } catch (e) {}
  return out;
}

let escaneoEnCurso = false;
async function escanearYouTubeEnSegundoPlano() {
  if (escaneoEnCurso) return;
  escaneoEnCurso = true;

  try {
    // 1. Recolectar IDs vía RSS de a 5 canales a la vez
    const canalesConChannelId = [...ytRuntime.values()].filter(rt => rt.channelId);
    for (let i = 0; i < canalesConChannelId.length; i += 6) {
      const lote = canalesConChannelId.slice(i, i + 6);
      await Promise.all(lote.map(async (rt) => {
        const ids = await idsDesdeRSS(rt.channelId);
        if (ids.length && YOUTUBE_API_KEY) {
          const res = await verificarVideosApi(ids);
          const vivo = ids.map(id => ({ id, ...res.get(id) })).find(v => v.live);
          if (vivo) {
            rt.live = true;
            rt.viewers = vivo.viewers;
            rt.title = vivo.title;
            return;
          }
        }
        // Si no dio por RSS/API, chequeamos por /live directo
        if (rt.handle) {
          const scraped = await scrapearLiveDirecto(rt.handle);
          if (scraped && scraped.isLive) {
            rt.live = true;
            rt.viewers = scraped.viewers > 0 ? scraped.viewers : rt.viewers;
            rt.title = scraped.title || rt.title;
            return;
          }
        }
        rt.live = false;
        rt.viewers = 0;
      }));
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (err) {
    console.warn('[YT Scan Error]:', err.message);
  } finally {
    escaneoEnCurso = false;
  }
}

// ───────────────────────── Sincronizador Maestro ─────────────────────────
let syncEnCurso = false;
async function sincronizarPipeline() {
  if (syncEnCurso) return;
  syncEnCurso = true;
  const horaActual = obtenerHoraArg();

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
    syncEnCurso = false;
  }
}

// ───────────────────────── Timers Asíncronos ─────────────────────────
// Ejecutan en segundo plano, NUNCA traban la respuesta HTTP
setInterval(escanearYouTubeEnSegundoPlano,
