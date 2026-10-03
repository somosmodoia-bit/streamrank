import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.all('/health', (req, res) => res.status(200).send('OK'));

let db = null;
const tursoUrl = process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.trim() : null;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN ? process.env.TURSO_AUTH_TOKEN.trim() : null;

try {
  if (tursoUrl && tursoAuthToken) {
    db = createClient({
      url: tursoUrl.startsWith('http') ? tursoUrl.replace(/^http:\/\//, 'https://') : tursoUrl,
      authToken: tursoAuthToken,
    });
  } else {
    db = createClient({ url: 'file:streamrank_local.db' });
  }
} catch (err) {
  console.error('[DB Error]:', err.message);
}

async function initDB() {
  if (!db) return;
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS telemetria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL,
        channel_name TEXT NOT NULL,
        category TEXT NOT NULL,
        platform TEXT NOT NULL,
        viewers INTEGER DEFAULT 0,
        is_live INTEGER DEFAULT 0,
        title TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {}
}
initDB();

const CANALES = [
  // 1. ENTRETENIMIENTO
  { id: 'luzutv', nombre: 'LUZU TV', yt: 'luzutv', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'olga', nombre: 'OLGA', yt: 'olgaenvivo_', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'blender', nombre: 'Blender', yt: 'somosblender', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'gelatina', nombre: 'Gelatina', yt: 'somosgelatina', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'vorterix', nombre: 'Vorterix', yt: 'VorterixOficial', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'bondilive', nombre: 'Bondi Live', yt: 'bondi_liveok', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', yt: 'somoslacasa', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', yt: 'unpocoderuido', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'loftstream', nombre: 'Loft Stream', yt: 'loftstream', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'republicaz', nombre: 'República Z', yt: 'RepublicaZ', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'posdata', nombre: 'Posdata', yt: 'posdatastream', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'telefe', nombre: 'Telefe Streams (Oficial)', yt: 'telefe', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'eltrece', nombre: 'eltrece', yt: 'eltrece', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'americatv', nombre: 'América TV', yt: 'americaenvivo', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },

  // 2. DEPORTES
  { id: 'programa412', nombre: '412 Fútbol (Davoo & La Cobra)', yt: 'programa412', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'azzstream', nombre: 'AZZ Stream (Flavio Azzaro)', yt: 'FlavioAzzaroOK', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'picadotv', nombre: 'Picado TV', yt: 'picadotv', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'tycsports', nombre: 'TyC Sports', yt: 'TyCSportsOficial', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'espnarg', nombre: 'ESPN Argentina', yt: 'espnargentina', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'foxsportsarg', nombre: 'Fox Sports Argentina', yt: 'FoxSportsArg', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'tntsportsarg', nombre: 'TNT Sports Argentina', yt: 'TNTSportsAR', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'dsports', nombre: 'DSports / DGO', yt: 'DIRECTVSports', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', yt: 'PabloCarrozza', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },

  // 3. STREAMERS
  { id: 'martincirio', nombre: 'Martín Cirio (La Faraona)', yt: 'MartinCirio', tw: null, ki: null, categoria: 'streamers', plataforma: 'youtube' },
  { id: 'davoo', nombre: 'Davoo Xeneize', yt: null, tw: null, ki: 'davoo_xeneize', categoria: 'streamers', plataforma: 'kick' },
  { id: 'lacobra', nombre: 'La Cobra', yt: null, tw: null, ki: 'lacobra', categoria: 'streamers', plataforma: 'kick' },
  { id: 'spreen', nombre: 'Spreen', yt: null, tw: null, ki: 'spreen', categoria: 'streamers', plataforma: 'kick' },
  { id: 'luquitas', nombre: 'Luquitas Rodríguez', yt: null, tw: 'luquitasrodriguez', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'coscu', nombre: 'Coscu', yt: null, tw: null, ki: 'coscu', categoria: 'streamers', plataforma: 'kick' },
  { id: 'kunaguero', nombre: 'Sergio Kun Agüero', yt: null, tw: 'slakun10', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'momo', nombre: 'Momo (Gerónimo Benavides)', yt: null, tw: null, ki: 'momoladinastia', categoria: 'streamers', plataforma: 'kick' },
  { id: 'brunenger', nombre: 'Brunenger', yt: null, tw: null, ki: 'brunenger', categoria: 'streamers', plataforma: 'kick' },
  { id: 'goncho', nombre: 'Goncho Banzas', yt: null, tw: 'goncho', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'robergalati', nombre: 'Rober Galati', yt: null, tw: 'robergalati', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'santutu', nombre: 'Santutu', yt: null, tw: 'santutu', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'bananirou', nombre: 'Bananirou', yt: null, tw: 'bananirou', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'boffegp', nombre: 'Boffe GP', yt: 'BoffeGP', tw: null, ki: null, categoria: 'streamers', plataforma: 'youtube' },
  { id: 'litkillah', nombre: 'Lit Killah', yt: null, tw: 'litkillah', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'frankkaster', nombre: 'Frankkaster', yt: null, tw: 'frankkaster', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'markitonavaja', nombre: 'Markito Navaja', yt: null, tw: 'markitonavaja', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'joacolopez', nombre: 'Joaco López', yt: null, tw: 'joacolopez', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'pimpeano', nombre: 'Pimpeano', yt: null, tw: 'pimpeano', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'teodelia', nombre: "Teo D'Elía", yt: null, tw: 'teodelia', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'benitosdr', nombre: 'Benito SDR', yt: null, tw: null, ki: 'benitosdr', categoria: 'streamers', plataforma: 'kick' },
  { id: 'laagusneta', nombre: 'LaAgusneta', yt: null, tw: null, ki: 'laagusneta', categoria: 'streamers', plataforma: 'kick' },

  // 4. FINANZAS
  { id: 'neura', nombre: 'Neura Media / Troncal', yt: 'neuramedia', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },
  { id: 'canale', nombre: 'Canal E (Económico)', yt: 'canaleperfil', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },
  { id: 'elcronista', nombre: 'El Cronista TV', yt: 'CronistaComercial', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', yt: 'AmbitoFinanciero', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },
  { id: 'bullmarket', nombre: 'Bull Market Brokers', yt: 'bullmarketbrokers', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },
  { id: 'joveninversor', nombre: 'Joven Inversor', yt: 'JovenInversor', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },

  // 5. NOTICIAS
  { id: 'tn', nombre: 'TN (Todo Noticias)', yt: 'todonoticias', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'c5n', nombre: 'C5N', yt: 'c5n', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'lanacionmas', nombre: 'La Nación +', yt: 'lanacionmas', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'carajostream', nombre: 'Carajo Stream', yt: 'carajostream', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'eldestape', nombre: 'El Destape', yt: 'eldestapeweb', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'a24', nombre: 'A24', yt: 'A24com', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'infobae', nombre: 'Infobae en Vivo', yt: 'infobae', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'elobservador', nombre: 'El Observador 107.9', yt: 'elobservador1079', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'radiomitre', nombre: 'Radio Mitre', yt: 'radiomitre', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'urbanaplay', nombre: 'Urbana Play 104.3', yt: 'UrbanaPlayFM', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'la100', nombre: 'La 100', yt: 'La100FM', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'futurock', nombre: 'Futurock', yt: 'futurockfm', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' }
];

const CATEGORIAS_CONFIG = {
  entretenimiento: { nombre: 'Entretenimiento & Canales', icono: '🎭', banner: 'PAUTA PREMIUM ENTRETENIMIENTO: Audiencias jóvenes masivas en directo • info@modoia.online', bannerColor: 'from-purple-950/80 via-slate-900 to-indigo-950/80', borderColor: 'border-purple-500/30' },
  deportes: { nombre: 'Deportes & Charlas', icono: '⚽', banner: 'ESPACIO PUBLICITARIO DEPORTES: La pasión futbolera en vivo minuto a minuto • info@modoia.online', bannerColor: 'from-emerald-950/80 via-slate-900 to-green-950/80', borderColor: 'border-emerald-500/30' },
  streamers: { nombre: 'Streamers & Creadores', icono: '🎮', banner: 'SPONSOR CREATIVO: Conectá con las comunidades líderes de Twitch, Kick y YouTube • info@modoia.online', bannerColor: 'from-cyan-950/80 via-slate-900 to-blue-950/80', borderColor: 'border-cyan-500/30' },
  finanzas: { nombre: 'Economía & Finanzas', icono: '📈', banner: 'PAUTA FINANCIERA & BROKERS: El segmento ABC1 y decisiones de inversión en directo • info@modoia.online', bannerColor: 'from-amber-950/80 via-slate-900 to-yellow-950/80', borderColor: 'border-amber-500/30' },
  noticias: { nombre: 'Noticias & Actualidad', icono: '🏛️', banner: 'MEDIOS & NOTICIAS: Cobertura de la coyuntura política y social argentina • info@modoia.online', bannerColor: 'from-rose-950/80 via-slate-900 to-red-950/80', borderColor: 'border-rose-500/30' }
};

const CATEGORIAS_ORDEN = ['entretenimiento', 'deportes', 'streamers', 'finanzas', 'noticias'];

let telemetriaState = CANALES.map((c) => ({
  ...c,
  handle: c.yt || c.tw || c.ki,
  viewers: 0,
  is_live: false,
  title: 'Señal en espera',
  hora_actualizacion: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  plataformas_live: { yt: false, tw: false, ki: false },
  viewers_breakdown: { yt: 0, tw: 0, ki: 0 }
}));

async function scrapeYouTubeLive(handle) {
  if (!handle) return { is_live: false, viewers: 0, title: 'Señal en espera' };
  try {
    const url = `https://www.youtube.com/@${handle}/live`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
      },
      timeout: 7000
    });

    const html = res.data;
    if (html.includes('"status":"UPCOMING"') || html.includes('"upcomingEventData"')) {
      return { is_live: false, viewers: 0, title: 'Transmisión programada' };
    }

    let viewers = 0;
    const concurrentMatch = html.match(/"concurrentViewers":\s*"(\d+)"/) || html.match(/\\"concurrentViewers\\":\s*\\"(\d+)\\"/);
    const originalViewMatch = html.match(/"originalViewCount":\s*"(\d+)"/) || html.match(/\\"originalViewCount\\":\s*\\"(\d+)\\"/);
    const viewRunsMatch = html.match(/"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);

    if (concurrentMatch) viewers = parseInt(concurrentMatch[1], 10) || 0;
    else if (originalViewMatch) viewers = parseInt(originalViewMatch[1], 10) || 0;
    else if (viewRunsMatch && viewRunsMatch[1]) viewers = parseInt(viewRunsMatch[1].replace(/[^0-9]/g, ''), 10) || 0;

    const hasLiveSignal = viewers > 20 || html.includes('"isLive":true') || html.includes('"isLiveBroadcast":true');
    if (!hasLiveSignal || viewers <= 5) {
      return { is_live: false, viewers: 0, title: 'Señal en espera' };
    }

    let title = '';
    const metaTitle = html.match(/([^<]*)<\/title>/);

    if (metaTitle && metaTitle[1]) {
      title = metaTitle[1].trim();
    } else if (runsTitle && runsTitle[1]) {
      title = runsTitle[1].trim();
    } else if (titleTagMatch && titleTagMatch[1]) {
      title = titleTagMatch[1].replace(' - YouTube', '').trim();
    }

    if (!title || title.toLowerCase().includes('canal fuera de l') || title === handle) {
      title = 'Transmisión en directo';
    }

    return { is_live: true, viewers, title };
  } catch (err) {
    return { is_live: false, viewers: 0, title: 'Señal en espera' };
  }
}

async function scrapeTwitchLive(login) {
  if (!login) return { is_live: false, viewers: 0, title: 'Señal en espera' };
  try {
    const res = await axios.post(
      'https://gql.twitch.tv/gql',
      {
        query: `query GetStreamInfo(\(login: String!) { user(login:\)login) { stream { viewersCount title } } }`,
        variables: { login }
      },
      {
        headers: { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' },
        timeout: 6000
      }
    );
    const stream = res.data?.data?.user?.stream;
    if (stream && (stream.viewersCount || 0) > 3) {
      return { is_live: true, viewers: stream.viewersCount || 0, title: stream.title || 'En vivo en Twitch' };
    }
    return { is_live: false, viewers: 0, title: 'Señal en espera' };
  } catch (err) {
    return { is_live: false, viewers: 0, title: 'Señal en espera' };
  }
}

async function scrapeKickLive(slug) {
  if (!slug) return { is_live: false, viewers: 0, title: 'Señal en espera' };
  try {
    const res = await axios.get(`https://kick.com/api/v2/channels/${slug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json'
      },
      timeout: 6000
    });
    const isLive = res.data?.livestream?.is_live === true;
    const viewers = res.data?.livestream?.viewer_count || 0;
    if (isLive && viewers > 3) {
      return { is_live: true, viewers, title: res.data.livestream.session_title || 'En vivo en Kick' };
    }
    return { is_live: false, viewers: 0, title: 'Señal en espera' };
  } catch (err) {
    return { is_live: false, viewers: 0, title: 'Señal en espera' };
  }
}

async function procesarCanal(c) {
  let ytRes = { is_live: false, viewers: 0, title: '' };
  let twRes = { is_live: false, viewers: 0, title: '' };
  let kiRes = { is_live: false, viewers: 0, title: '' };

  if (c.yt) ytRes = await scrapeYouTubeLive(c.yt);
  if (c.tw) twRes = await scrapeTwitchLive(c.tw);
  if (c.ki) kiRes = await scrapeKickLive(c.ki);

  const totalViewers = (ytRes.viewers || 0) + (twRes.viewers || 0) + (kiRes.viewers || 0);
  const isLive = ytRes.is_live || twRes.is_live || kiRes.is_live;
  const activeTitle = (ytRes.is_live && ytRes.title) || (twRes.is_live && twRes.title) || (kiRes.is_live && kiRes.title) || 'Señal en espera';
  const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const idx = telemetriaState.findIndex((item) => item.id === c.id);
  if (idx !== -1) {
    telemetriaState[idx] = {
      ...telemetriaState[idx],
      viewers: totalViewers,
      is_live: isLive,
      title: activeTitle,
      hora_actualizacion: horaActual,
      plataformas_live: { yt: ytRes.is_live, tw: twRes.is_live, ki: kiRes.is_live },
      viewers_breakdown: { yt: ytRes.viewers, tw: twRes.viewers, ki: kiRes.viewers }
    };
  }

  if (isLive && totalViewers > 0 && db) {
    db.execute({
      sql: `INSERT INTO telemetria (channel_id, channel_name, category, platform, viewers, is_live, title) 
            VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [c.id, c.nombre, c.categoria, c.plataforma, totalViewers, 1, activeTitle]
    }).catch(() => {});
  }
}

async function cicloTelemetria() {
  const BATCH_SIZE = 6;
  for (let i = 0; i < CANALES.length; i += BATCH_SIZE) {
    const lote = CANALES.slice(i, i + BATCH_SIZE);
    await Promise.all(lote.map(procesarCanal));
    if (i + BATCH_SIZE < CANALES.length) await new Promise((r) => setTimeout(r, 150));
  }
}

setInterval(cicloTelemetria, 30000);
setTimeout(cicloTelemetria, 1000);

app.get('/api/ranking-categorias', (req, res) => {
  const categorias = CATEGORIAS_ORDEN.map((catKey) => {
    const meta = CATEGORIAS_CONFIG[catKey];
    const canales = telemetriaState
      .filter((c) => c.categoria === catKey)
      .sort((a, b) => b.viewers - a.viewers);

    const lider = canales.length > 0 && canales[0].viewers > 0 ? canales[0] : null;

    return {
      id: catKey,
      nombre: meta.nombre,
      icono: meta.icono,
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
});

app.get('/api/dataset-ai', (req, res) => {
  const totalViewers = telemetriaState.reduce((acc, c) => acc + (c.viewers || 0), 0);
  const liveCount = telemetriaState.filter((c) => c.is_live).length;

  res.json({
    _streamrank_ai_core: {
      version: '3.1.0-ARG',
      jurisdiction: 'Argentina',
      metric: 'CCV Real-Time Multiplatform (YT/TW/KI)'
    },
    meta: {
      timestamp: new Date().toISOString(),
      live_channels: liveCount,
      total_viewers: totalViewers
    },
    categories: CATEGORIAS_ORDEN.map((catKey) => ({
      categoria: catKey,
      nombre: CATEGORIAS_CONFIG[catKey].nombre,
      canales: telemetriaState.filter((c) => c.categoria === catKey).sort((a, b) => b.viewers - a.viewers)
    }))
  });
});

app.get('/api/descargar-analytics', (req, res) => {
  const headers = ['Canal', 'Categoria', 'Audiencia_Total', 'Estado', 'YouTube', 'Twitch', 'Kick', 'Ultimo_Titulo', 'Hora'];
  const rows = telemetriaState.map(c => [
    `"${c.nombre}"`,
    `"${c.categoria}"`,
    c.viewers,
    c.is_live ? 'EN VIVO' : 'OFFLINE',
    c.viewers_breakdown.yt,
    c.viewers_breakdown.tw,
    c.viewers_breakdown.ki,
    `"${(c.title || '').replace(/"/g, '""')}"`,
    `"${c.hora_actualizacion}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="streamrank_analytics.csv"');
  res.send(csvContent);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[StreamRank ARG] Servidor activo en puerto ${PORT}`);
});
