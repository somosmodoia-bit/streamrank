const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

// Token institucional para descarga de telemetría B2B / Agencias
const ACCESS_TOKEN_SECRET = (process.env.STREAMRANK_ACCESS_TOKEN || 'STREAMRANK2026').trim();

// ============================================================================
// CONEXIÓN DIRECTA VIA HTTP PIPELINE (CERO LIBRERÍAS EXTERNAS, CERO MIGRACIONES)
// ============================================================================
const rawTursoUrl = (process.env.TURSO_DATABASE_URL || '').trim();
const tursoHttpUrl = rawTursoUrl
  .replace(/^libsql:\/\//, 'https://')
  .replace(/^http:\/\//, 'https://')
  .replace(/\/$/, '');
const tursoToken = (process.env.TURSO_AUTH_TOKEN || '').trim();

async function executeTursoQuery(sql, args = []) {
  if (!tursoHttpUrl || !tursoToken) return null;

  const namedArgs = args.map((arg) => {
    if (arg === null || arg === undefined) return { type: 'null' };
    if (typeof arg === 'number') {
      return Number.isInteger(arg)
        ? { type: 'integer', value: String(arg) }
        : { type: 'float', value: arg };
    }
    return { type: 'text', value: String(arg) };
  });

  try {
    const res = await fetch(`${tursoHttpUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tursoToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql, args: namedArgs } },
          { type: 'close' }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Turso HTTP Error ${res.status}]`, errText);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('[Turso Fetch Error]', err.message);
    return null;
  }
}

// Inicializar tabla mediante SQL puro
async function initTurso() {
  await executeTursoQuery(`
    CREATE TABLE IF NOT EXISTS metrics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT,
      channel_name TEXT,
      viewers INTEGER,
      program_name TEXT,
      is_live INTEGER,
      bot_alert INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('[Turso DB] Inicialización completada.');
}

// Inserción de métrica sin gestores de esquemas
async function saveMetricToTurso(channelId, channelName, viewers, programName, isLive, botAlert = 0) {
  await executeTursoQuery(
    'INSERT INTO metrics_history (channel_id, channel_name, viewers, program_name, is_live, bot_alert) VALUES (?, ?, ?, ?, ?, ?)',
    [channelId, channelName, viewers || 0, programName || 'Transmisión en vivo', isLive ? 1 : 0, botAlert ? 1 : 0]
  );
}

// Depuración automática de registros mayores a 2 años
async function cleanupOldMetrics() {
  await executeTursoQuery("DELETE FROM metrics_history WHERE timestamp < datetime('now', '-2 years')");
}

initTurso();
setInterval(cleanupOldMetrics, 24 * 60 * 60 * 1000);

// Helper para desempaquetar filas de respuestas de Turso Pipeline
function extractTursoRows(pipelineJson) {
  if (!pipelineJson || !pipelineJson.results || !pipelineJson.results[0]) return [];
  const res = pipelineJson.results[0];
  if (res.type !== 'ok' || !res.response || !res.response.result) return [];
  const { cols, rows } = res.response.result;
  return rows.map((row) => {
    const obj = {};
    row.forEach((valObj, idx) => {
      const colName = cols[idx].name;
      obj[colName] = valObj.value !== undefined ? valObj.value : null;
    });
    return obj;
  });
}

// ============================================================================
// DICCIONARIO OFICIAL DE CANALES (SIN POSDATA STREAM)
// ============================================================================
const CHANNELS = [
  // Entretenimiento / Medios
  {
    id: 'luzutv',
    name: 'LUZU TV',
    category: 'Entretenimiento',
    subtheme: 'Streaming General / Magazine',
    avatar: 'https://unavatar.io/youtube/LuzuTV',
    platforms: { yt: 'LuzuTV', tw: 'luzutv' },
    programas: ['Nadie Dice Nada', 'Antes Que Nadie', 'Patria y Familia', 'Algo de Música', 'Tarde Para Nada', 'Stream Master'],
    baselineMax: 130000,
    isEmerging: false
  },
  {
    id: 'olga',
    name: 'OLGA',
    category: 'Entretenimiento',
    subtheme: 'Streaming General / Humor',
    avatar: 'https://unavatar.io/youtube/olgaenvivo_',
    platforms: { yt: 'olgaenvivo_', tw: 'olgaenvivo' },
    programas: ['Soñé que Volaba', 'Sería Increíble', 'Paraíso Fiscal', 'Generación Dorada', 'Mi Primo es Así', 'Tapados'],
    baselineMax: 150000,
    isEmerging: false
  },
  {
    id: 'somoslacasaok',
    name: 'La Casa Streaming',
    category: 'Entretenimiento',
    subtheme: 'Streaming General',
    avatar: 'https://yt3.googleusercontent.com/A6Z42adUjC5VGszImuvuTYyAeAy4S7WuW64ZnPMl8FhVT_QDViEGo11EtP_BiYszAFcq0pih0wQ=s900-c-k-c0x00ffffff-no-rj',
    platforms: { yt: 'somoslacasaok' },
    programas: ['Rumis', 'Circus', 'Somos La Casa', 'Tardes de Mate'],
    baselineMax: 45000,
    isEmerging: false
  },
  {
    id: 'estoesblender',
    name: 'Blender',
    category: 'Entretenimiento',
    subtheme: 'Cultura & Actualidad',
    avatar: 'https://unavatar.io/youtube/estoesblender',
    platforms: { yt: 'estoesblender' },
    programas: ['Hay Algo Ahí', 'Escucho Ofertas', 'Dinastía', 'Generación F'],
    baselineMax: 40000,
    isEmerging: false
  },
  {
    id: 'vorterix',
    name: 'Vorterix',
    category: 'Entretenimiento',
    subtheme: 'Radio & Rock',
    avatar: 'https://unavatar.io/youtube/vorterixoficial',
    platforms: { yt: 'vorterixoficial', tw: 'vorterixoficial' },
    programas: ['Paren la Mano', 'Maldición Va a Ser un Día Hermoso', 'El Loco y el Cuerdo', 'Decímetro'],
    baselineMax: 35000,
    isEmerging: false
  },
  {
    id: 'parenlamanotv',
    name: 'Paren La Mano',
    category: 'Entretenimiento',
    subtheme: 'Comedia & Charlas',
    avatar: 'https://unavatar.io/youtube/parenlamanoclips',
    platforms: { yt: 'parenlamanoclips' },
    programas: ['Paren la Mano', 'PLM Highlights', 'Paren el Fútbol'],
    baselineMax: 40000,
    isEmerging: false
  },
  {
    id: 'urbanaplay',
    name: 'Urbana Play 104.3',
    category: 'Entretenimiento',
    subtheme: 'Radio Multimedia',
    avatar: 'https://unavatar.io/youtube/urbanaplayfm',
    platforms: { yt: 'urbanaplayfm' },
    programas: ['Perros de la Calle', 'Todo Pasa', 'Vuelta y Media', 'Urbana Play Club'],
    baselineMax: 25000,
    isEmerging: false
  },
  {
    id: 'bondi_liveok',
    name: 'Bondi Live',
    category: 'Entretenimiento',
    subtheme: 'Farándula / Magazine',
    avatar: 'https://unavatar.io/youtube/bondi_liveok',
    platforms: { yt: 'bondi_liveok' },
    programas: ['Ángel Responde', 'Yanina 107.9', 'El Ejército de LAM', 'No Pasa Nada'],
    baselineMax: 30000,
    isEmerging: false
  },
  {
    id: 'telefe',
    name: 'Telefe',
    category: 'Entretenimiento',
    subtheme: 'Televisión de Aire',
    avatar: 'https://unavatar.io/youtube/telefe',
    platforms: { yt: 'telefe', tw: 'telefe' },
    programas: ['Gran Hermano En Vivo', 'Ariel en su Salsa', 'Cortá por Lozano', 'Telefe Noticias'],
    baselineMax: 90000,
    isEmerging: false
  },
  {
    id: 'eltrece',
    name: 'El Trece',
    category: 'Entretenimiento',
    subtheme: 'Televisión de Aire',
    avatar: 'https://unavatar.io/youtube/eltrece',
    platforms: { yt: 'eltrece' },
    programas: ['Mediodía Noticias', 'Telenoche', 'Los 8 Escalones', 'El Trece en Vivo'],
    baselineMax: 60000,
    isEmerging: false
  },

  // Política / Noticias
  {
    id: 'todonoticias',
    name: 'TN (Todo Noticias)',
    category: 'Política',
    subtheme: 'Noticias 24 Horas',
    avatar: 'https://unavatar.io/youtube/todonoticias',
    platforms: { yt: 'todonoticias' },
    programas: ['Tempraneros', 'TN Central', 'Desde el Llano', 'TN de Noche', 'Todo Noticias 24hs'],
    baselineMax: 95000,
    isEmerging: false
  },
  {
    id: 'lanacionmas',
    name: 'La Nación+',
    category: 'Política',
    subtheme: 'Análisis Político',
    avatar: 'https://yt3.googleusercontent.com/k9aRM8272xuCmMRcrXKVpoa1lmDIIFFx2OUc6X7l_SoAnfdChpW6v5ypj6xQsp_GaKK5tiWlbw=s900-c-k-c0x00ffffff-no-rj',
    platforms: { yt: 'lanacionmas' },
    programas: ['+Mañana', '+Realidad', '+Voces', '+Nación', 'El Noticiero'],
    baselineMax: 85000,
    isEmerging: false
  },
  {
    id: 'c5n',
    name: 'C5N',
    category: 'Política',
    subtheme: 'Noticias & Debate',
    avatar: 'https://unavatar.io/youtube/c5n',
    platforms: { yt: 'c5n' },
    programas: ['Mañanas Argentinas', 'Argenzuela', 'Minuto Uno', 'Duro de Domar'],
    baselineMax: 85000,
    isEmerging: false
  },
  {
    id: 'cronicatv',
    name: 'Crónica TV',
    category: 'Política',
    subtheme: 'Noticias Populares',
    avatar: 'https://unavatar.io/youtube/cronicatv',
    platforms: { yt: 'cronicatv' },
    programas: ['La Primera', 'Firme Junto al Pueblo', 'Las Tragedias de los Famosos', 'Crónica Central'],
    baselineMax: 45000,
    isEmerging: false
  },
  {
    id: 'cenital',
    name: 'Cenital',
    category: 'Política',
    subtheme: 'Periodismo & Análisis',
    avatar: 'https://unavatar.io/youtube/Cenitalcom',
    platforms: { yt: 'Cenitalcom' },
    programas: ['540°', 'Off The Record', 'Mundo Propio'],
    baselineMax: 20000,
    isEmerging: false
  },
  {
    id: 'somosgelatina',
    name: 'Gelatina',
    category: 'Política',
    subtheme: 'Humor Político / Streaming',
    avatar: 'https://unavatar.io/youtube/somosgelatina',
    platforms: { yt: 'somosgelatina', tw: 'somosgelatina' },
    programas: ['Tres Estrellas', 'TUGO', 'Compañeros de Viaje', 'Gelatina Radio'],
    baselineMax: 55000,
    isEmerging: false
  },
  {
    id: 'carajostream',
    name: 'Carajo Stream',
    category: 'Política',
    subtheme: 'Opinión & Debate Digital',
    avatar: 'https://unavatar.io/youtube/carajostream',
    platforms: { yt: 'carajostream' },
    programas: ['La Misa de Dan', 'Toda', 'Carajo Central', 'Libre y Salvaje'],
    baselineMax: 50000,
    isEmerging: false
  },
  {
    id: 'neuramedia',
    name: 'Neura Media',
    category: 'Política',
    subtheme: 'Debate & Actualidad',
    avatar: 'https://unavatar.io/youtube/neuramedia',
    platforms: { yt: 'neuramedia', tw: 'neuramedia' },
    programas: ['Multiverso Fantino', 'Neura Flash', 'Troncal', 'Pillados'],
    baselineMax: 45000,
    isEmerging: false
  },

  // Deportes
  {
    id: 'flavioazzaro',
    name: 'Flavio Azzaro / AZZ',
    category: 'Deportes',
    subtheme: 'Debate Futbolero',
    avatar: 'https://yt3.googleusercontent.com/ISC3Kd6jDr8DOIzS_R1T5I8W_knmL9BJKbZRydIkfbqgTqiQOnrrg7xC60qulkVZH7qdej7E=s900-c-k-c0x00ffffff-no-rj',
    platforms: { yt: 'somosazz' },
    programas: ['El Show del Fútbol', 'Azzaro al Horno', 'AZZ Transmisiones', 'Fútbol Total'],
    baselineMax: 65000,
    isEmerging: false
  },
  {
    id: 'dsportsradio',
    name: 'DSPORTS Radio',
    category: 'Deportes',
    subtheme: 'Radio Deportiva',
    avatar: 'https://unavatar.io/youtube/dsportsradio',
    platforms: { yt: 'dsportsradio' },
    programas: ['De Zurda', 'No Veo la Hora', 'Cómo Te Va', 'Puede Pasar'],
    baselineMax: 30000,
    isEmerging: false
  },
  {
    id: 'tycsports',
    name: 'TyC Sports',
    category: 'Deportes',
    subtheme: 'Noticias Deportivas',
    avatar: 'https://unavatar.io/youtube/tycsports',
    platforms: { yt: 'tycsports' },
    programas: ['Sportia', 'Líbero', 'Superfútbol', 'Presión Alta'],
    baselineMax: 70000,
    isEmerging: false
  },

  // Streamers
  {
    id: 'coscu',
    name: 'Coscu',
    category: 'Streamers',
    subtheme: 'Variedad & Reacciones',
    avatar: 'https://unavatar.io/twitch/coscu',
    platforms: { tw: 'coscu', ki: 'coscu', yt: 'Coscu' },
    programas: ['Coscu Army Stream', 'Just Chatting', 'Reaccionando', 'Gaming IRL'],
    baselineMax: 50000,
    isEmerging: false
  },
  {
    id: 'spreen',
    name: 'Spreen',
    category: 'Streamers',
    subtheme: 'Gaming & Entretenimiento',
    avatar: 'https://unavatar.io/twitch/elspreen',
    platforms: { tw: 'elspreen', ki: 'spreen', yt: 'SpreenDMC' },
    programas: ['Spreen Directo', 'Minecraft Hardcore', 'Eventos Especiales', 'Just Chatting'],
    baselineMax: 120000,
    isEmerging: false
  },
  {
    id: 'davooxeneize',
    name: 'Davoo Xeneize',
    category: 'Streamers',
    subtheme: 'Fútbol & Boca Juniors',
    avatar: 'https://unavatar.io/twitch/davooxeneize',
    platforms: { tw: 'davooxeneize', ki: 'davooxeneize' },
    programas: ['Post-Partido Boca', 'Debate Xeneize', 'Modo Carrera', 'Charla Futbolera'],
    baselineMax: 60000,
    isEmerging: false
  },
  {
    id: 'lacobraaa',
    name: 'La Cobra',
    category: 'Streamers',
    subtheme: 'Fútbol & Reacciones',
    avatar: 'https://unavatar.io/twitch/lacobraaa',
    platforms: { tw: 'lacobraaa', ki: 'lacobraaa' },
    programas: ['El Show de La Cobra', 'Debate Redondo', 'Fútbol y Risa', 'Reacciones Champions'],
    baselineMax: 50000,
    isEmerging: false
  },
  {
    id: 'luquitasrodriguez',
    name: 'Luquitas Rodríguez',
    category: 'Streamers',
    subtheme: 'Charlas & Humor',
    avatar: 'https://unavatar.io/twitch/luquitasrodriguez',
    platforms: { tw: 'luquitasrodriguez' },
    programas: ['Paren la Mano', 'Charla de Madrugada', 'Fútbol y Anécdotas'],
    baselineMax: 45000,
    isEmerging: false
  }
];

// ============================================================================
// MEMORIA EN TIEMPO REAL
// ============================================================================
const historicalSnapshots = [];
const MAX_HISTORICAL_RECORDS = 50000;

let telemetriaCache = CHANNELS.map((canal) => ({
  id: canal.id,
  name: canal.name,
  category: canal.category,
  subtheme: canal.subtheme,
  avatar: canal.avatar,
  programas: canal.programas || [],
  isEmerging: canal.isEmerging,
  isLive: false,
  totalViewers: 0,
  title: 'Sincronizando señal en vivo...',
  thumbnail: null,
  bot_shield: false,
  bot_alert: 0,
  botReason: null,
  decoupled: false,
  platforms: {
    youtube: { active: Boolean(canal.platforms.yt), handle: canal.platforms.yt || null, isLive: false, viewers: 0 },
    twitch: { active: Boolean(canal.platforms.tw), handle: canal.platforms.tw || null, isLive: false, viewers: 0 },
    kick: { active: Boolean(canal.platforms.ki), handle: canal.platforms.ki || null, isLive: false, viewers: 0 }
  },
  timestamp: new Date().toISOString()
}));

let ultimaActualizacion = null;
let estaScrapeando = false;
const historialLecturas = new Map();
const lastThumbnails = new Map();

const getBuenosAiresTime = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').reverse().join('-');

  const timeStr = now.toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour12: false
  });

  return {
    date: dateStr,
    time: timeStr,
    timestamp: `${dateStr} ${timeStr}`
  };
};

const fetchConTimeout = async (url, opciones = {}, ms = 6000) => {
  const controlador = new AbortController();
  const id = setTimeout(() => controlador.abort(), ms);
  try {
    const respuesta = await fetch(url, { ...opciones, signal: controlador.signal });
    clearTimeout(id);
    return respuesta;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// ============================================================================
// SCRAPERS (YOUTUBE CANÓNICO, TWITCH GQL, KICK API)
// ============================================================================
const scrapeYouTube = async (handle) => {
  if (!handle) return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: null };
  try {
    const url = `https://www.youtube.com/@${handle}/live`;
    const res = await fetchConTimeout(
      url,
      {
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
          Cookie: 'SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+'
        }
      },
      6000
    );

    if (!res.ok) return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: null };

    let videoId = '';
    const finalUrl = res.url || '';
    if (finalUrl.includes('watch?v=')) {
      const urlMatch = finalUrl.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (urlMatch) videoId = urlMatch[1];
    }

    const html = await res.text();

    if (!videoId) {
      const currentEndpointMatch =
        html.match(/"currentVideoEndpoint":\s*\{\s*"watchEndpoint":\s*\{\s*"videoId":\s*"([a-zA-Z0-9_-]{11})"/i) ||
        html.match(/\\"currentVideoEndpoint\\":\s*\{\s*\\"watchEndpoint\\":\s*\{\s*\\"videoId\\":\s*\\"([a-zA-Z0-9_-]{11})\\"/i);
      const canonicalBaseMatch =
        html.match(/"canonicalBaseUrl":\s*"\/watch\?v=([a-zA-Z0-9_-]{11})"/i) ||
        html.match(/\\"canonicalBaseUrl\\":\s*"\/watch\?v=([a-zA-Z0-9_-]{11})\\"/i);
      const vDetailsMatch =
        html.match(/"videoDetails":\s*\{[^}]*"videoId":\s*"([a-zA-Z0-9_-]{11})"/i) ||
        html.match(/\\"videoDetails\\":\s*\{[^}]*\\"videoId\\":\s*\\"([a-zA-Z0-9_-]{11})\\"/i);
      const liveStreamMatch =
        html.match(/"liveStreamabilityRenderer":\s*\{\s*"videoId":\s*"([a-zA-Z0-9_-]{11})"/i) ||
        html.match(/\\"liveStreamabilityRenderer\\":\s*\{\s*\\"videoId\\":\s*\\"([a-zA-Z0-9_-]{11})\\"/i);
      const canMatch =
        html.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/i) ||
        html.match(/<meta\s+property="og:url"\s+content="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/i) ||
        html.match(/<meta\s+itemprop="videoId"\s+content="([a-zA-Z0-9_-]{11})"/i);

      if (currentEndpointMatch && currentEndpointMatch[1]) videoId = currentEndpointMatch[1];
      else if (canonicalBaseMatch && canonicalBaseMatch[1]) videoId = canonicalBaseMatch[1];
      else if (vDetailsMatch && vDetailsMatch[1]) videoId = vDetailsMatch[1];
      else if (liveStreamMatch && liveStreamMatch[1]) videoId = liveStreamMatch[1];
      else if (canMatch && canMatch[1]) videoId = canMatch[1];
    }

    const isUpcoming =
      /"status":\s*"UPCOMING"/i.test(html) ||
      /\\"status\\":\s*\\"UPCOMING\\"/i.test(html) ||
      html.includes('"upcomingEventData"');
    if (isUpcoming) {
      lastThumbnails.delete(handle);
      return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: null };
    }

    const concurrentMatch =
      html.match(/"concurrentViewers":\s*"(\d+)"/) ||
      html.match(/\\"concurrentViewers\\":\s*\\"(\d+)\\"/);
    const originalViewMatch =
      html.match(/"originalViewCount":\s*"(\d+)"/) ||
      html.match(/\\"originalViewCount\\":\s*\\"(\d+)\\"/);
    const viewRunsMatch =
      html.match(/"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/) ||
      html.match(/\\"viewCount\\":\s*\{\s*\\"runs\\":\s*\[\s*\{\s*\\"text\\":\s*\\"([^"\\]+)\\"/);

    let viewers = 0;
    if (concurrentMatch) viewers = parseInt(concurrentMatch[1], 10);
    else if (originalViewMatch) viewers = parseInt(originalViewMatch[1], 10);
    else if (viewRunsMatch) viewers = parseInt(viewRunsMatch[1].replace(/[^0-9]/g, ''), 10) || 0;

    const hasLiveSignal =
      viewers > 20 ||
      /"isLive":\s*true/i.test(html) ||
      /\\"isLive\\":\s*true/i.test(html) ||
      /"isLiveBroadcast":\s*true/i.test(html) ||
      /\\"isLiveBroadcast\\":\s*true/i.test(html) ||
      /"isLiveNow":\s*true/i.test(html);

    if (!hasLiveSignal || viewers <= 5) {
      lastThumbnails.delete(handle);
      return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: null };
    }

    let title = '';
    const metaTitle =
      html.match(/<meta\s+name="title"\s+content="([^"]*)"/i) ||
      html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
    if (metaTitle && metaTitle[1]) {
      title = metaTitle[1];
    } else {
      const runsTitle = html.match(/"title":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
      if (runsTitle && runsTitle[1]) title = runsTitle[1];
    }

    const blacklistRegex = /(hasta ma[nñ]ana|pr[oó]ximamente|en espera|directo finalizado)/i;
    if (title && blacklistRegex.test(title)) {
      lastThumbnails.delete(handle);
      return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: null };
    }

    let thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;

    if (!thumbnail && lastThumbnails.has(handle)) {
      thumbnail = lastThumbnails.get(handle);
    } else if (thumbnail) {
      lastThumbnails.set(handle, thumbnail);
    }

    console.log(`[YouTube OK] ${handle}: ${viewers} viewers (ID: ${videoId || 'N/A'})`);
    return {
      isLive: true,
      viewers,
      title: title || 'Transmisión en directo',
      thumbnail: thumbnail || null
    };
  } catch (err) {
    lastThumbnails.delete(handle);
    console.error(`[YouTube Error] ${handle}:`, err.message);
    return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: null };
  }
};

const scrapeTwitch = async (login) => {
  if (!login) return { isLive: false, viewers: 0, title: '', thumbnail: null };
  try {
    const res = await fetchConTimeout(
      'https://gql.twitch.tv/gql',
      {
        method: 'POST',
        headers: {
          'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query GetStreamInfo($login: String!) {
            user(login: $login) {
              stream {
                viewersCount
                title
              }
            }
          }`,
          variables: { login }
        })
      },
      6000
    );

    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: null };

    const data = await res.json();
    const stream = data?.data?.user?.stream;

    if (stream && (stream.viewersCount || 0) > 3) {
      return {
        isLive: true,
        viewers: stream.viewersCount || 0,
        title: stream.title || 'Transmisión en Twitch',
        thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login.toLowerCase()}-640x360.jpg`
      };
    }
    return { isLive: false, viewers: 0, title: '', thumbnail: null };
  } catch (err) {
    return { isLive: false, viewers: 0, title: '', thumbnail: null };
  }
};

const scrapeKick = async (slug) => {
  if (!slug) return { isLive: false, viewers: 0, title: '', thumbnail: null };
  try {
    const res = await fetchConTimeout(
      `https://kick.com/api/v2/channels/${slug}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'application/json'
        }
      },
      6000
    );

    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: null };

    const data = await res.json();
    const isLive = data?.livestream?.is_live === true;
    const viewers = data?.livestream?.viewer_count || 0;

    if (isLive && viewers > 3) {
      return {
        isLive: true,
        viewers,
        title: data.livestream.session_title || 'En vivo en Kick',
        thumbnail: data.livestream.thumbnail?.url || null
      };
    }
    return { isLive: false, viewers: 0, title: '', thumbnail: null };
  } catch (err) {
    return { isLive: false, viewers: 0, title: '', thumbnail: null };
  }
};

// ============================================================================
// ESCUDO ANTI-BOTS (ANÁLISIS DE ACELERACIÓN EN < 3 MINUTOS)
// ============================================================================
const evaluarAnomaliaTrafico = (canal, totalViewers) => {
  const ahora = Date.now();
  const historial = historialLecturas.get(canal.id) || [];

  historial.push({ viewers: totalViewers, time: ahora });
  if (historial.length > 3) historial.shift();
  historialLecturas.set(canal.id, historial);

  if (!totalViewers || totalViewers < 2000) {
    return { bot_shield: false, bot_alert: 0, reason: null, decoupled: false };
  }

  if (historial.length >= 2) {
    const anterior = historial[historial.length - 2];
    const deltaViewers = totalViewers - anterior.viewers;
    const porcentajeSalto = anterior.viewers > 0 ? deltaViewers / anterior.viewers : 0;
    const tiempoDiff = ahora - anterior.time;

    if (tiempoDiff <= 180000) {
      const saltoDesmedido = (porcentajeSalto > 1.6 && deltaViewers > 3500) || deltaViewers >= 18000;
      if (saltoDesmedido) {
        return {
          bot_shield: true,
          bot_alert: 1,
          reason: 'Inyección externa acelerada (>160% o +18k en <3 min)',
          decoupled: true
        };
      }
    }
  }

  if (canal.baselineMax && totalViewers > canal.baselineMax * 2.8) {
    return {
      bot_shield: true,
      bot_alert: 1,
      reason: `Pico atípico desproporcionado (+${Math.round((totalViewers / canal.baselineMax) * 100)}% de baseline)`,
      decoupled: true
    };
  }

  return { bot_shield: false, bot_alert: 0, reason: null, decoupled: false };
};

// ============================================================================
// CICLO DE SCRAPEO CONCURRENTE EN LOTES
// ============================================================================
const procesarCanalIndividual = async (canal) => {
  try {
    const [ytRes, twRes, kiRes] = await Promise.all([
      canal.platforms.yt
        ? scrapeYouTube(canal.platforms.yt)
        : Promise.resolve({ isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: null }),
      canal.platforms.tw
        ? scrapeTwitch(canal.platforms.tw)
        : Promise.resolve({ isLive: false, viewers: 0, title: '', thumbnail: null }),
      canal.platforms.ki
        ? scrapeKick(canal.platforms.ki)
        : Promise.resolve({ isLive: false, viewers: 0, title: '', thumbnail: null })
    ]);

    const isLive = ytRes.isLive || twRes.isLive || kiRes.isLive;
    const totalViewers = (ytRes.viewers || 0) + (twRes.viewers || 0) + (kiRes.viewers || 0);

    let thumbnail = isLive ? ytRes.thumbnail || twRes.thumbnail || kiRes.thumbnail || null : null;
    let title = isLive
      ? ytRes.title || twRes.title || kiRes.title || 'Transmitiendo en directo'
      : 'Transmisión finalizada';

    const anomalia = isLive
      ? evaluarAnomaliaTrafico(canal, totalViewers)
      : { bot_shield: false, bot_alert: 0, reason: null, decoupled: false };

    const itemTelemetria = {
      id: canal.id,
      name: canal.name,
      category: canal.category,
      subtheme: canal.subtheme,
      avatar: canal.avatar,
      programas: canal.programas || [],
      isEmerging: canal.isEmerging,
      isLive,
      totalViewers,
      title,
      thumbnail,
      bot_shield: anomalia.bot_shield,
      bot_alert: anomalia.bot_alert,
      botReason: anomalia.reason,
      decoupled: anomalia.decoupled,
      platforms: {
        youtube: {
          active: Boolean(canal.platforms.yt),
          handle: canal.platforms.yt || null,
          isLive: ytRes.isLive,
          viewers: ytRes.viewers || 0
        },
        twitch: {
          active: Boolean(canal.platforms.tw),
          handle: canal.platforms.tw || null,
          isLive: twRes.isLive,
          viewers: twRes.viewers || 0
        },
        kick: {
          active: Boolean(canal.platforms.ki),
          handle: canal.platforms.ki || null,
          isLive: kiRes.isLive,
          viewers: kiRes.viewers || 0
        }
      },
      timestamp: new Date().toISOString()
    };

    if (isLive && totalViewers > 0) {
      const bsAsTime = getBuenosAiresTime();
      historicalSnapshots.push({
        canal_id: canal.id,
        nombre: canal.name,
        categoria: canal.category,
        subtema: canal.subtheme,
        titulo_programa: title,
        viewers_total: totalViewers,
        viewers_yt: ytRes.viewers || 0,
        viewers_tw: twRes.viewers || 0,
        viewers_ki: kiRes.viewers || 0,
        bot_alert: anomalia.bot_alert,
        fecha: bsAsTime.date,
        hora: bsAsTime.time,
        timestamp_buenos_aires: bsAsTime.timestamp
      });

      if (historicalSnapshots.length > MAX_HISTORICAL_RECORDS) {
        historicalSnapshots.splice(0, historicalSnapshots.length - (MAX_HISTORICAL_RECORDS - 5000));
      }

      saveMetricToTurso(canal.id, canal.name, totalViewers, title, isLive, anomalia.bot_alert);
    }

    return itemTelemetria;
  } catch (canalError) {
    console.error(`Error procesando telemetría de ${canal.name}:`, canalError);
    return null;
  }
};

const actualizarTelemetria = async () => {
  if (estaScrapeando) return;
  estaScrapeando = true;

  try {
    const listaActualizada = [];
    const BATCH_SIZE = 6;

    for (let i = 0; i < CHANNELS.length; i += BATCH_SIZE) {
      const lote = CHANNELS.slice(i, i + BATCH_SIZE);
      const resultadosLote = await Promise.all(lote.map(procesarCanalIndividual));

      for (const res of resultadosLote) {
        if (res) listaActualizada.push(res);
      }

      if (i + BATCH_SIZE < CHANNELS.length) {
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    }

    listaActualizada.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      if (a.isLive && b.isLive) {
        if (a.decoupled && !b.decoupled) return 1;
        if (!a.decoupled && b.decoupled) return -1;
        return b.totalViewers - a.totalViewers;
      }
      return a.name.localeCompare(b.name);
    });

    telemetriaCache = listaActualizada;
    ultimaActualizacion = new Date().toISOString();
  } catch (error) {
    console.error('Error durante la actualización de telemetría:', error);
  } finally {
    estaScrapeando = false;
  }
};

actualizarTelemetria();
setInterval(actualizarTelemetria, 25000);

// ============================================================================
// ENDPOINTS DE API & EXPORTACIÓN B2B
// ============================================================================
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/ranks', (req, res) => {
  const liveCount = telemetriaCache.filter((c) => c.isLive).length;
  const organicAudience = telemetriaCache.filter((c) => !c.decoupled).reduce((acc, c) => acc + c.totalViewers, 0);

  res.json({
    updatedAt: ultimaActualizacion,
    totalChannels: telemetriaCache.length,
    liveChannels: liveCount,
    totalAudience: organicAudience,
    data: telemetriaCache
  });
});

app.get('/api/validate-token', (req, res) => {
  const token = (req.query.token || '').trim();
  if (token === ACCESS_TOKEN_SECRET) {
    return res.json({ valid: true });
  }
  return res.status(403).json({ valid: false, error: 'Token de acceso no válido.' });
});

// Endpoint oficial de exportación CSV (Data Room B2B con validación de token)
app.get('/api/export-csv', async (req, res) => {
  const token = (req.query.token || '').trim();
  if (token !== ACCESS_TOKEN_SECRET) {
    return res.status(403).send('Acceso restringido. Token de telemetría inválido.');
  }

  const { canal, programa, from, to } = req.query;
  const bsAsTime = getBuenosAiresTime();

  let rows = [];

  if (tursoHttpUrl && tursoToken) {
    try {
      let query = 'SELECT * FROM metrics_history WHERE 1=1';
      const params = [];

      if (canal && canal !== 'todos') {
        query += ' AND channel_id = ?';
        params.push(canal.toLowerCase());
      }
      if (programa && programa !== 'todos') {
        query += ' AND program_name LIKE ?';
        params.push(`%${programa}%`);
      }
      if (from) {
        query += ' AND timestamp >= ?';
        params.push(`${from} 00:00:00`);
      }
      if (to) {
        query += ' AND timestamp <= ?';
        params.push(`${to} 23:59:59`);
      }

      query += ' ORDER BY timestamp DESC LIMIT 10000';
      const dbResult = await executeTursoQuery(query, params);
      const parsedRows = extractTursoRows(dbResult);

      rows = parsedRows.map((r) => [
        `"${r.channel_id}"`,
        `"${(r.channel_name || '').replace(/"/g, '""')}"`,
        r.viewers,
        `"${(r.program_name || '').replace(/"/g, '""')}"`,
        r.is_live ? 'SI' : 'NO',
        r.bot_alert ? 'DETECTADO' : 'NORMAL',
        `"${r.timestamp}"`
      ]);
    } catch (e) {
      console.error('[Export CSV Turso Error]:', e.message);
    }
  }

  if (rows.length === 0) {
    let filtrados = historicalSnapshots;
    if (canal && canal !== 'todos') {
      filtrados = filtrados.filter((s) => s.canal_id === canal.toLowerCase());
    }
    if (programa && programa !== 'todos') {
      const progLower = programa.toLowerCase();
      filtrados = filtrados.filter(
        (s) =>
          (s.titulo_programa && s.titulo_programa.toLowerCase().includes(progLower)) ||
          (s.subtema && s.subtema.toLowerCase().includes(progLower))
      );
    }
    if (from) filtrados = filtrados.filter((s) => s.fecha >= from);
    if (to) filtrados = filtrados.filter((s) => s.fecha <= to);

    rows = filtrados.map((s) => [
      `"${s.canal_id}"`,
      `"${s.nombre.replace(/"/g, '""')}"`,
      s.viewers_total,
      `"${s.titulo_programa.replace(/"/g, '""')}"`,
      'SI',
      s.bot_alert ? 'DETECTADO' : 'NORMAL',
      `"${s.timestamp_buenos_aires}"`
    ]);
  }

  const fileHeaders = [
    '# STREAMRANK TELEMETRY REPORT - AUDITORÍA OFICIAL',
    '# Motor: Modo IA | Contacto: info@modoia.online',
    '# Historial acumulativo iniciado en Septiembre 2026 (Retención 24 meses).',
    `# Fecha de Exportación: ${bsAsTime.timestamp} (Hora Oficial Argentina)`,
    '',
    ['Canal_ID', 'Canal_Nombre', 'Espectadores_Concurrentes', 'Programa_Emitido', 'En_Vivo', 'Alerta_Bots_Shield', 'Timestamp'].join(',')
  ];

  const csvContent = [...fileHeaders, ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="streamrank_telemetria_oficial_${Date.now()}.csv"`);
  return res.status(200).send(csvContent);
});

// ============================================================================
// FRONTEND SERVIDO EN GET /
// ============================================================================
const HTML_APP = `<!DOCTYPE html>
<html lang="es-AR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>StreamRank ARG | Monitor Oficial de Audiencia y Streaming en Vivo</title>

  <!-- METADATOS GEO / SEO -->
  <meta name="description" content="StreamRank ARG: Monitor oficial en tiempo real de telemetría, audiencia simultánea y métricas de streaming en Argentina (YouTube Live, Twitch, Kick).">
  <meta name="keywords" content="StreamRank, streaming argentina, luzu tv en vivo, olga en vivo, rating streaming argentina, métricas de streamers, telemetría streaming, blender, vorterix, tn en vivo">
  <meta name="author" content="Modo IA">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://streamrank.ar">

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            bgDeep: '#050811',
            cardBg: '#0b1120',
            cardBorder: '#162238',
            matrix: '#00ff66',
            gold: '#FFD700',
            yt: '#FF0000',
            tw: '#9146FF',
            ki: '#53FC18'
          },
          boxShadow: {
            matrix: '0 0 20px rgba(0, 255, 102, 0.45)',
            matrixSoft: '0 0 10px rgba(0, 255, 102, 0.25)',
            goldGlow: '0 0 20px rgba(255, 215, 0, 0.35)',
            glow: '0 0 35px rgba(0, 255, 102, 0.3)'
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #050811;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, sans-serif;
      overflow-x: hidden;
    }
    .matrix-glow {
      text-shadow: 0 0 10px rgba(0, 255, 102, 0.7), 0 0 22px rgba(0, 255, 102, 0.35);
    }
    .gold-glow {
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.4);
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-[#050811] text-slate-100 antialiased selection:bg-[#00ff66] selection:text-black">

  <!-- HEADER COMPACTO RESPONSIVE -->
  <header class="sticky top-0 z-40 bg-[#050811]/95 backdrop-blur-md border-b border-[#162238]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
      
      <div class="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        <div class="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black border border-matrix/50 shadow-matrixSoft flex-shrink-0">
          <span class="absolute w-3.5 h-3.5 rounded-full bg-matrix animate-ping opacity-75"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-matrix"></span>
        </div>
        <div class="min-w-0">
          <div class="flex items-center space-x-1.5 sm:space-x-2">
            <span class="text-base sm:text-xl font-black tracking-wider text-white">STREAMRANK</span>
            <span class="text-[9px] sm:text-xs px-1.5 py-0.5 rounded font-black tracking-widest bg-matrix/20 text-matrix border border-matrix/40 shrink-0">ARG</span>
            <span class="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black tracking-widest uppercase rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/40 shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.25)]">BETA</span>
          </div>
          <p class="text-[9px] sm:text-[11px] text-slate-400 truncate hidden xs:block">Telemetría de Streaming en Vivo</p>
        </div>
      </div>

      <div class="flex items-center space-x-2 flex-shrink-0">
        <div class="flex items-center bg-[#0b1120] border border-[#162238] rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 space-x-2 sm:space-x-4">
          <div class="flex items-center space-x-1.5">
            <span class="inline-block w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-matrix shadow-matrix"></span>
            <span class="text-[11px] sm:text-xs font-semibold text-slate-300"><span id="stat-live-count" class="text-matrix font-bold">0</span> <span class="hidden sm:inline">En Vivo</span></span>
          </div>
          <div class="w-px h-3 sm:h-4 bg-slate-700"></div>
          <div class="text-[11px] sm:text-xs text-slate-400">
            <span class="hidden md:inline">Audiencia: </span><span id="stat-total-viewers" class="text-white font-mono font-bold">0</span>
          </div>
          <div class="hidden lg:block w-px h-4 bg-slate-700"></div>
          <div class="hidden lg:block text-[11px] font-mono text-slate-400" id="sync-clock">Sinc: --:--:--</div>
        </div>
      </div>

    </div>
  </header>

  <!-- CONTENIDO PRINCIPAL -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
    
    <!-- TITULO PRINCIPAL & BAJADA CLARA -->
    <section class="text-center sm:text-left space-y-1.5 pt-2">
      <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-matrix/10 border border-matrix/40 text-matrix text-[11px] font-mono font-bold tracking-wider">
        <span class="w-2 h-2 rounded-full bg-matrix animate-ping"></span>
        <span>DATOS OFICIALES EN TIEMPO REAL</span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
        StreamRank <span class="text-matrix font-light">|</span> Monitor de Audiencia en Vivo
      </h1>
      <p class="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
        Telemetría y métricas oficiales de streaming en Argentina en tiempo real. Auditado minuto a minuto.
      </p>
    </section>

    <!-- BARRA CON BUSCADOR Y ACCIÓN DE DESCARGA CSV -->
    <section class="w-full flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
      <div class="relative flex-1 w-full">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg class="w-4 h-4 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input 
          type="text" 
          id="channel-search-input" 
          oninput="filtrarPorBusqueda(this.value)" 
          placeholder="Buscar canal por nombre (ej: Olga, Luzu, TN, Azzaro, Davoo)..." 
          class="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#0b1120] border-2 border-slate-600 hover:border-slate-400 focus:border-matrix focus:shadow-matrixSoft rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 transition-all shadow-md"
        >
      </div>

      <button 
        onclick="solicitarDescargaCSV()" 
        class="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#0b1120] border border-matrix/50 text-matrix hover:bg-matrix hover:text-black transition-all shadow-matrixSoft text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 flex-shrink-0"
      >
        <span>📊</span>
        <span>Descargar Reporte CSV / Picos de Audiencia</span>
      </button>
    </section>

    <!-- NAVEGACIÓN Y FILTROS -->
    <section class="space-y-3">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#162238] pb-3">
        
        <div class="overflow-x-auto whitespace-nowrap no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div class="inline-flex gap-2" id="tab-buttons">
            <button onclick="cambiarSolapa('Todos')" class="tab-btn px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all bg-matrix text-black shadow-matrix">
              🔥 General
            </button>
            <button onclick="cambiarSolapa('Entretenimiento')" class="tab-btn px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50">
              🎭 Entretenimiento
            </button>
            <button onclick="cambiarSolapa('Política')" class="tab-btn px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50">
              🏛️ Política
            </button>
            <button onclick="cambiarSolapa('Deportes')" class="tab-btn px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50">
              ⚽ Deportes
            </button>
            <button onclick="cambiarSolapa('Streamers')" class="tab-btn px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50">
              🎮 Streamers
            </button>
            <button onclick="cambiarSolapa('Emergentes')" class="tab-btn px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50">
              🚀 Emergentes
            </button>
          </div>
        </div>

        <div class="flex flex-row items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div class="relative flex-1 sm:flex-initial">
            <select id="subtheme-dropdown" onchange="cambiarSubtema(this.value)" class="w-full sm:w-auto bg-[#0b1120] border border-[#162238] hover:border-matrix/40 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-matrix">
              <option value="TODOS">Todos los subtemas</option>
            </select>
          </div>

          <div class="relative flex-1 sm:flex-initial">
            <select id="status-dropdown" onchange="cambiarFiltroEstado(this.value)" class="w-full sm:w-auto bg-[#0b1120] border border-[#162238] hover:border-matrix/40 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-matrix">
              <option value="TODOS">Todos los estados</option>
              <option value="SOLO_VIVO">🔴 Solo En Vivo</option>
              <option value="SOLO_OFFLINE">⚫ Solo Offline</option>
            </select>
          </div>
        </div>

      </div>
    </section>

    <!-- GRILLA RESPONSIVE -->
    <section>
      <div id="channels-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      </div>
    </section>

    <!-- BANNER SPONSOR -->
    <section class="w-full">
      <div class="relative w-full rounded-2xl bg-gradient-to-r from-emerald-950/20 via-[#0b1120] to-blue-950/20 border border-matrix/30 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div class="space-y-1">
          <span class="text-[10px] font-mono tracking-widest text-matrix uppercase bg-matrix/10 px-2 py-0.5 rounded border border-matrix/20">ESPACIO PUBLICITARIO</span>
          <h3 class="text-base sm:text-lg font-black text-white">Conecta con la industria del streaming argentino</h3>
          <p class="text-xs text-slate-400">Presencia directa ante agencias, marcas y creadores de contenido.</p>
        </div>
        <a href="mailto:info@modoia.online" class="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#0b1120] hover:bg-matrix hover:text-black border border-matrix/40 text-matrix text-xs font-black transition-all shadow-matrixSoft flex-shrink-0 text-center">
          CONTACTAR PUBLICIDAD
        </a>
      </div>
    </section>

    <!-- SECCIÓN INTERACTIVA DE FAQS -->
    <section class="bg-[#0b1120] rounded-2xl border border-slate-700/60 sm:border-[#162238] p-4 sm:p-6 space-y-4 text-xs text-slate-300 leading-relaxed shadow-lg">
      <div class="flex items-center space-x-2 text-white font-bold text-sm">
        <svg class="w-5 h-5 text-matrix flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-base font-black">Centro de Transparencia & Preguntas Frecuentes (FAQs)</span>
      </div>

      <div class="space-y-3">
        <div class="p-4 rounded-xl bg-[#050811] border border-slate-700/60 sm:border-[#162238] space-y-1.5">
          <h4 class="font-bold text-white text-sm flex items-center text-matrix">
            <span class="mr-2">🛡️</span> ¿Cómo detectamos los ataques de bots externos?
          </h4>
          <p class="text-slate-400 text-xs">
            StreamRank ARG analiza la aceleración en tiempo real de la audiencia. Si se detecta un salto atípico repentino de más del <strong>160% de incremento o más de +18.000 espectadores en menos de 3 minutos</strong> fuera de un pase de programa verificado, se activa automáticamente una alerta preventiva (<strong>Bot Shield</strong>) para proteger la reputación del canal.
          </p>
        </div>

        <div class="p-4 rounded-xl bg-[#050811] border border-slate-700/60 sm:border-[#162238] space-y-1.5">
          <h4 class="font-bold text-white text-sm flex items-center text-matrix">
            <span class="mr-2">⏳</span> ¿Cuál es la política de retención y almacenamiento de métricas?
          </h4>
          <p class="text-slate-400 text-xs">
            StreamRank conserva el historial analítico completo durante <strong>2 años</strong> mediante Turso DB. La captura oficial de datos comenzó en <strong>Septiembre de 2026</strong>.
          </p>
        </div>

        <div class="p-4 rounded-xl bg-[#050811] border border-slate-700/60 sm:border-[#162238] space-y-1.5">
          <h4 class="font-bold text-white text-sm flex items-center text-matrix">
            <span class="mr-2">⚡</span> ¿Cómo se calcula la audiencia en vivo multiplataforma?
          </h4>
          <p class="text-slate-400 text-xs">
            Cada 25 segundos, el backend consulta directamente YouTube Live, Twitch GQL y Kick API de forma simultánea, contabilizando usuarios concurrentes (CCV).
          </p>
        </div>
      </div>
    </section>

  </main>

  <!-- MODAL B2B: ACCESO A TELEMETRÍA (CSV / XLSX) -->
  <div id="modal-token" class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md hidden p-4">
    <div class="bg-[#0b1120] border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
      
      <!-- Encabezado alineado con Badge BETA -->
      <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-lg shrink-0">🔐</span>
          <div class="flex items-center flex-wrap gap-1.5">
            <h3 class="text-sm sm:text-base font-semibold text-slate-100 tracking-tight">
              Acceso a Telemetría y Reportes <span class="text-emerald-400 font-normal">(CSV / XLSX)</span>
            </h3>
            <span class="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black tracking-widest uppercase rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/40 shrink-0">
              BETA
            </span>
          </div>
        </div>
        <button onclick="cerrarModalToken()" class="text-slate-400 hover:text-white transition-colors p-1 -mr-1 shrink-0 text-xl font-bold leading-none">
          &times;
        </button>
      </div>

      <!-- Cuerpo del modal -->
      <div class="space-y-3 text-xs text-slate-300 leading-relaxed">
        <p>
          <strong class="font-medium text-slate-100">Auditoría Continua:</strong> StreamRank audita y registra telemetría de audiencia minuto a minuto con una ventana de retención estructurada de hasta 2 años en Turso DB.
        </p>

        <div class="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-200/90 text-[11px] leading-relaxed">
          <span class="font-semibold text-amber-300">Transparencia de Inicio Oficial:</span> La captura oficial y consolidada de métricas comenzó en <strong class="text-amber-200">Septiembre de 2026</strong>. La base de datos acumula el historial de forma progresiva a partir de este hito fundacional.
        </div>

        <p class="text-slate-400">
          El acceso a datos crudos y exportaciones ejecutivas está reservado a <span class="text-slate-200 font-medium">agencias de medios, directores y marcas auditadas</span>. La credencial de acceso se tramita por única vez y queda guardada en este navegador.
        </p>
      </div>

      <!-- Formulario de Token -->
      <div class="space-y-2 pt-1">
        <label class="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">CÓDIGO DE ACCESO (TOKEN B2B)</label>
        <div class="flex gap-2">
          <input 
            type="password" 
            id="token-input" 
            placeholder="Ingresá tu código institucional..." 
            class="flex-1 px-3.5 py-2.5 bg-[#050811] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-matrix focus:shadow-matrixSoft font-mono"
          >
          <button 
            onclick="validarYAbrirDescarga()" 
            class="px-4 py-2.5 bg-matrix text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-all shadow-matrix shrink-0"
          >
            Acceder
          </button>
        </div>
        <p id="token-error" class="text-[11px] text-red-400 hidden">Código no válido. Solicitá tu clave oficial vía mail.</p>
      </div>

      <!-- Footer modal -->
      <div class="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <span class="text-slate-400 text-[11px]">¿No tenés token corporativo?</span>
        <a 
          href="mailto:info@modoia.online?subject=Solicitud%20de%20Acceso%20Telemetria%20StreamRank" 
          class="text-emerald-400 hover:underline font-medium text-[11px] transition-colors"
        >
          Solicitar código a info@modoia.online
        </a>
      </div>

    </div>
  </div>

  <!-- MODAL DE FILTRO Y DESCARGA CSV -->
  <div id="modal-reportes" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md hidden p-4">
    <div class="bg-[#0b1120] border border-[#162238] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
      
      <div class="flex items-center justify-between pb-3 border-b border-[#162238]">
        <div class="flex items-center space-x-2">
          <span class="text-matrix font-black text-base sm:text-lg">📊 EXPORTAR TELEMETRÍA Y PICOS (CSV)</span>
        </div>
        <button onclick="cerrarModalReportes()" class="text-slate-400 hover:text-white transition-colors text-2xl font-bold">&times;</button>
      </div>

      <p class="text-xs text-slate-300">
        Configurá los filtros para generar tu informe oficial. Encabezados institucionales de auditoría incluidos.
      </p>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">CANAL A AUDITAR</label>
          <select id="report-channel-select" onchange="actualizarProgramasAuditModal(this.value)" class="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-matrix">
            <option value="todos">Todos los Canales Monitoreados</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">PROGRAMA A AUDITAR</label>
          <select id="report-program-select" class="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-matrix">
            <option value="todos">Todos los programas del canal</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">PERÍODO TEMPORAL</label>
          <select id="report-period-select" onchange="ajustarFechasPeriodo(this.value)" class="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-matrix">
            <option value="hoy">Hoy (Día en curso)</option>
            <option value="7dias">Últimos 7 Días</option>
            <option value="mes">Todo el Mes</option>
            <option value="custom">Rango Personalizado</option>
          </select>
        </div>

        <div id="custom-dates-container" class="grid grid-cols-2 gap-3 hidden">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">DESDE (FROM)</label>
            <input type="date" id="report-from-date" class="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-matrix">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">HASTA (TO)</label>
            <input type="date" id="report-to-date" class="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-matrix">
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-[#162238]">
        <button onclick="ejecutarDescargaReporte()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-matrix text-black hover:bg-emerald-400 transition-all shadow-matrix flex items-center justify-center space-x-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          <span>Descargar CSV Oficial</span>
        </button>
      </div>

    </div>
  </div>

  <!-- MODAL DUELO 1 VS 1 -->
  <div id="modal-duel" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md hidden p-4 overflow-y-auto">
    <div class="bg-[#0b1120] border border-[#162238] rounded-2xl max-w-xl sm:max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-auto">
      
      <div class="flex items-center justify-between pb-3 border-b border-[#162238]">
        <div class="flex items-center space-x-2">
          <span class="text-matrix font-extrabold text-base sm:text-lg">⚡ DUELO 1 VS 1</span>
          <span class="text-xs text-slate-400">Comparativa directa</span>
        </div>
        <button onclick="cerrarModalDuelo()" class="text-slate-400 hover:text-white transition-colors text-2xl font-bold">&times;</button>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:gap-4 my-3">
        <div>
          <label class="block text-[11px] sm:text-xs font-semibold text-slate-400 mb-1">CANAL A</label>
          <select id="duel-select-a" onchange="renderizarContenidoDuelo()" class="w-full bg-[#050811] border border-slate-700 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-matrix">
          </select>
        </div>
        <div>
          <label class="block text-[11px] sm:text-xs font-semibold text-slate-400 mb-1">CANAL B</label>
          <select id="duel-select-b" onchange="renderizarContenidoDuelo()" class="w-full bg-[#050811] border border-slate-700 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-matrix">
          </select>
        </div>
      </div>

      <div id="duel-capture-card" class="bg-[#050811] border border-matrix/30 rounded-2xl w-full max-w-[500px] aspect-square mx-auto flex flex-col justify-between p-5 sm:p-7 shadow-glow relative my-2">
        <div class="text-center pt-1">
          <span class="text-[10px] sm:text-[11px] font-black tracking-widest uppercase bg-matrix/10 text-matrix px-3.5 py-1.5 rounded-full border border-matrix/30">STREAMRANK ARG • DUELO EN DIRECTO</span>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:gap-4 items-stretch my-auto">
          <!-- Canal A -->
          <div class="text-center p-3.5 rounded-xl bg-[#0b1120]/90 border border-slate-700/70 flex flex-col justify-between h-[190px] sm:h-[210px]">
            <div>
              <img id="duel-a-avatar" crossorigin="anonymous" src="" class="w-12 h-12 sm:w-14 sm:h-14 rounded-full mx-auto border-2 border-matrix object-cover shadow-matrixSoft mb-1.5" alt="A">
              <div id="duel-a-program" class="font-black text-white text-sm sm:text-base leading-tight line-clamp-2 break-words mt-0.5">--</div>
              <h4 id="duel-a-name" class="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">--</h4>
              <p id="duel-a-status" class="text-[9px] sm:text-[10px] font-mono text-matrix">OFFLINE</p>
            </div>
            <div>
              <div id="duel-a-viewers" class="text-2xl sm:text-3xl font-black font-mono text-matrix matrix-glow">0</div>
              <div class="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Espectadores</div>
            </div>
          </div>

          <!-- Canal B -->
          <div class="text-center p-3.5 rounded-xl bg-[#0b1120]/90 border border-slate-700/70 flex flex-col justify-between h-[190px] sm:h-[210px]">
            <div>
              <img id="duel-b-avatar" crossorigin="anonymous" src="" class="w-12 h-12 sm:w-14 sm:h-14 rounded-full mx-auto border-2 border-cyan-400 object-cover shadow-cyan-500/50 mb-1.5" alt="B">
              <div id="duel-b-program" class="font-black text-white text-sm sm:text-base leading-tight line-clamp-2 break-words mt-0.5">--</div>
              <h4 id="duel-b-name" class="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">--</h4>
              <p id="duel-b-status" class="text-[9px] sm:text-[10px] font-mono text-cyan-400">OFFLINE</p>
            </div>
            <div>
              <div id="duel-b-viewers" class="text-2xl sm:text-3xl font-black font-mono text-cyan-400">0</div>
              <div class="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Espectadores</div>
            </div>
          </div>
        </div>

        <div class="space-y-2.5 pb-1">
          <div>
            <div class="flex justify-between text-xs font-mono font-bold mb-1">
              <span id="duel-pct-a" class="text-matrix">50%</span>
              <span class="text-slate-400 text-[10px] sm:text-xs tracking-wider">SHARE DE AUDIENCIA</span>
              <span id="duel-pct-b" class="text-cyan-400">50%</span>
            </div>
            <div class="w-full h-3.5 sm:h-4 bg-slate-900 rounded-full overflow-hidden flex border border-[#162238] p-0.5">
              <div id="duel-bar-a" class="h-full bg-matrix rounded-l-full transition-all duration-500 shadow-matrix" style="width: 50%"></div>
              <div id="duel-bar-b" class="h-full bg-cyan-400 rounded-r-full transition-all duration-500 shadow-cyan-400" style="width: 50%"></div>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs sm:text-sm font-mono pt-1.5 border-t border-[#162238]/80">
            <span id="duel-timestamp" class="text-[#00FF66] font-bold tracking-wide">--</span>
            <span class="text-slate-400 font-bold text-[10px] sm:text-xs tracking-wider">STREAMRANK.AR</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end space-x-3 pt-3 border-t border-[#162238]">
        <button onclick="cerrarModalDuelo()" class="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">
          Cerrar
        </button>
        <button onclick="descargarDueloPNG()" class="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-matrix text-black hover:bg-emerald-400 transition-all shadow-matrix flex items-center">
          <svg class="w-4 h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Descargar Placa HD
        </button>
      </div>

    </div>
  </div>

  <!-- SVG TEMPLATES PARA PLATAFORMAS -->
  <div class="hidden">
    <svg id="svg-yt" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
    <svg id="svg-tw" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
    <svg id="svg-ki" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.333 0h8v5.333H6.667v2.667h2.666v2.667H6.667v2.666h2.666V16H6.667v2.667h2.666V24h-8zm13.334 8h2.666v2.667h-2.666zm2.666 2.667h2.667v2.666h-2.667zm2.667 2.666h2.667V16H20zm-2.667 2.667h2.667v2.667h-2.667zm-2.667 2.667h2.667V24h-2.667zm0-10.667h2.667V5.333h-2.667zm2.667-2.667h2.667V2.667H17.333zm2.667-2.666H22.667V0H20z"/>
    </svg>
  </div>

  <!-- FOOTER SUTIL -->
  <footer class="border-t border-[#162238] bg-[#050811] py-6 sm:py-8 text-center text-xs text-slate-500 font-mono space-y-2">
    <div>StreamRank ARG • Monitor en Tiempo Real de Streaming de Argentina</div>
    <div>
      <a href="https://modoia.online" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-matrix underline transition-colors">Desarrollado por Modo IA</a>
    </div>
  </footer>

  <!-- SCRIPT LOGICA CLIENTE -->
  <script>
    let canalesData = [];
    let solapaActiva = 'Todos';
    let subtemaActivo = 'TODOS';
    let filtroEstado = 'TODOS';
    let busquedaTexto = '';

    const formatNum = (num) => new Intl.NumberFormat('es-AR').format(num || 0);

    const formatBadgeNum = (num) => {
      if (!num) return '0';
      if (num >= 100000) return Math.round(num / 1000) + 'k';
      if (num >= 10000) return (num / 1000).toFixed(1) + 'k';
      return formatNum(num);
    };

    function getFallbackAvatar(name) {
      const initials = (name || 'SR')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'SR';

      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
        '<defs>' +
        '<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#0b1120"/>' +
        '<stop offset="100%" stop-color="#162238"/>' +
        '</linearGradient>' +
        '</defs>' +
        '<rect width="64" height="64" rx="32" fill="url(#g)" stroke="#00ff66" stroke-width="2"/>' +
        '<text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#00ff66" dominant-baseline="middle" text-anchor="middle">' + initials + '</text>' +
        '</svg>';

      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    const filtrarPorBusqueda = (texto) => {
      busquedaTexto = (texto || '').toLowerCase().trim();
      renderizarGrilla();
    };

    const cambiarSolapa = (solapa) => {
      solapaActiva = solapa;
      subtemaActivo = 'TODOS';
      actualizarEstilosSolapas();
      actualizarDropdownSubtemas();
      renderizarGrilla();
    };

    const cambiarSubtema = (subtema) => {
      subtemaActivo = subtema;
      renderizarGrilla();
    };

    const cambiarFiltroEstado = (estado) => {
      filtroEstado = estado;
      renderizarGrilla();
    };

    const actualizarEstilosSolapas = () => {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.innerText.includes(solapaActiva)) {
          btn.className = 'tab-btn px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all bg-matrix text-black shadow-matrix';
        } else {
          btn.className = 'tab-btn px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50';
        }
      });
    };

    const actualizarDropdownSubtemas = () => {
      const dropdown = document.getElementById('subtheme-dropdown');
      const canalesFiltradosPorSolapa = solapaActiva === 'Todos' 
        ? canalesData 
        : canalesData.filter(c => c.category === solapaActiva);

      const subtemasUnicos = [...new Set(canalesFiltradosPorSolapa.map(c => c.subtheme))].filter(Boolean);

      let optionsHtml = '<option value="TODOS">Todos los subtemas (' + subtemasUnicos.length + ')</option>';
      subtemasUnicos.forEach(st => {
        optionsHtml += '<option value="' + st + '">' + st + '</option>';
      });
      dropdown.innerHTML = optionsHtml;
      dropdown.value = 'TODOS';
    };

    const fetchDatos = async () => {
      try {
        const respuesta = await fetch('/api/ranks');
        const json = await respuesta.json();
        canalesData = json.data || [];

        document.getElementById('stat-live-count').innerText = json.liveChannels || 0;
        document.getElementById('stat-total-viewers').innerText = formatNum(json.totalAudience);

        const fechaArg = new Intl.DateTimeFormat('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(new Date());

        const clockEl = document.getElementById('sync-clock');
        if (clockEl) clockEl.innerText = 'Sinc: ' + fechaArg + ' ART';

        renderizarGrilla();
        poblarSelectoresDuelo();
        poblarSelectoresReportes();
      } catch (err) {
        console.error('Error al sincronizar datos:', err);
      }
    };

    const renderizarPlataformaBadge = (tipo, plat) => {
      let estilo = 'text-slate-500 border-[#162238] bg-black/40';
      let iconColor = 'text-slate-600';
      let valor = 'Off';

      if (plat && plat.isLive) {
        if (tipo === 'yt') {
          estilo = 'text-red-400 border-red-500/40 bg-red-950/30';
          iconColor = 'text-[#FF0000]';
        } else if (tipo === 'tw') {
          estilo = 'text-purple-300 border-purple-500/40 bg-purple-950/30';
          iconColor = 'text-[#9146FF]';
        } else if (tipo === 'ki') {
          estilo = 'text-emerald-400 border-[#53FC18]/40 bg-emerald-950/30';
          iconColor = 'text-[#53FC18]';
        }
        valor = formatBadgeNum(plat.viewers);
      } else if (plat && !plat.active) {
        valor = '-';
      }

      const svgIcon = document.getElementById('svg-' + tipo).outerHTML;

      return '<div class="flex items-center space-x-1.5 px-2 py-1 rounded-md border shrink-0 ' + estilo + '">' +
        '<div class="w-3.5 h-3.5 shrink-0 ' + iconColor + '">' + svgIcon + '</div>' +
        '<span class="text-[10px] font-mono font-bold leading-none">' + valor + '</span>' +
      '</div>';
    };

    // ========================================================================
    // GRILLA RESPONSIVE
    // ========================================================================
    const renderizarGrilla = () => {
      const container = document.getElementById('channels-grid');
      let filtrados = solapaActiva === 'Todos'
        ? canalesData
        : canalesData.filter(c => c.category === solapaActiva);

      if (subtemaActivo !== 'TODOS') {
        filtrados = filtrados.filter(c => c.subtheme === subtemaActivo);
      }

      if (filtroEstado === 'SOLO_VIVO') {
        filtrados = filtrados.filter(c => c.isLive);
      } else if (filtroEstado === 'SOLO_OFFLINE') {
        filtrados = filtrados.filter(c => !c.isLive);
      }

      if (busquedaTexto) {
        filtrados = filtrados.filter(c => c.name.toLowerCase().includes(busquedaTexto));
      }

      let html = '';

      filtrados.forEach((c, index) => {
        const puestoGlobal = canalesData.findIndex(item => item.id === c.id) + 1;
        const isLive = c.isLive;
        const tieneBotShield = c.bot_shield === true;
        const esTopVisible = (index === 0 && isLive);

        let borderClass = 'border border-slate-700/80 sm:border-[#162238] hover:border-matrix/40 hover:shadow-matrixSoft';
        if (tieneBotShield) {
          borderClass = 'border-2 border-amber-500/80 shadow-amber-950/40 bg-gradient-to-b from-[#1c120c] to-[#0b1120]';
        } else if (esTopVisible) {
          borderClass = 'border-2 border-amber-400/90 shadow-goldGlow bg-gradient-to-b from-[#0b1329] to-[#0b1120]';
        }

        html += '<div class="w-full rounded-2xl bg-[#0b1120] ' + borderClass + ' shadow-lg shadow-black/60 transition-all duration-300 p-4 flex flex-col justify-between min-h-[225px] h-auto group relative">';

        // Fila 1: Avatar + Nombre
        html += '<div class="flex items-center justify-between gap-2 mb-2">';
        html += '<div class="flex items-center space-x-2.5 min-w-0 flex-1">';
        html += '<img crossorigin="anonymous" onerror="this.onerror=null; this.src=getFallbackAvatar(\\'' + c.name.replace(/'/g, "\\\\'") + '\\')" src="' + c.avatar + '" class="w-11 h-11 rounded-full ' + (esTopVisible ? 'border-2 border-amber-400 shadow-goldGlow' : (isLive ? 'border-2 border-matrix shadow-matrixSoft' : 'border border-slate-700 opacity-80')) + ' object-cover shrink-0">';
        html += '<div class="min-w-0 flex-1">';
        html += '<h3 class="text-sm font-bold text-white truncate leading-tight">' + c.name + '</h3>';
        html += '<span class="text-[10px] text-slate-400 font-semibold block truncate">' + c.category + '</span>';
        html += '</div></div>';

        html += '<div class="flex items-center space-x-1.5 shrink-0">';
        if (esTopVisible) {
          html += '<span class="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono font-black text-[10px] border border-amber-400/60 shadow-goldGlow whitespace-nowrap">#1 👑</span>';
        } else {
          html += '<span class="px-2 py-0.5 rounded-md bg-black/80 text-[11px] font-mono font-black text-matrix border border-matrix/30">#' + puestoGlobal + '</span>';
        }

        if (isLive) {
          html += '<span class="px-2 py-0.5 rounded-md bg-matrix text-black font-black text-[9px] tracking-wider animate-pulse">EN VIVO</span>';
        } else {
          html += '<span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-bold text-[9px]">OFFLINE</span>';
        }
        html += '</div></div>';

        // Fila 2: Programa o Bot Shield
        html += '<div class="my-auto py-1.5">';
        if (tieneBotShield) {
          html += '<div class="px-2.5 py-1.5 rounded-lg bg-amber-950/70 border border-amber-500/70 text-[10px] text-amber-200 leading-tight flex items-center space-x-1.5">';
          html += '<span class="shrink-0 text-sm">🛡️</span>';
          html += '<span class="truncate"><strong>ALERTA:</strong> Posible inyección externa de tráfico/bots detectada. Tráfico anómalo no atribuible al canal.</span>';
          html += '</div>';
        } else {
          html += '<p class="text-[11px] text-matrix font-mono font-semibold truncate">' + (c.programas && c.programas.length ? c.programas[0] : c.subtheme) + '</p>';
          html += '<p class="text-xs text-slate-300 truncate mt-0.5 leading-snug">' + (c.title || 'Señal sin transmisión activa') + '</p>';
        }
        html += '</div>';

        // Fila 3: Espectadores y Badges
        html += '<div class="pt-2 border-t border-slate-800/80 space-y-2">';
        html += '<div class="flex items-center justify-between gap-2">';
        html += '<div class="flex items-baseline space-x-1.5 min-w-0">';
        html += '<span class="text-[9px] uppercase font-mono text-slate-400">Espectadores:</span>';
        html += '<span class="text-base sm:text-lg font-black font-mono leading-none ' + (tieneBotShield ? 'text-amber-400' : (isLive ? 'text-matrix matrix-glow' : 'text-slate-500')) + '">' + formatNum(c.totalViewers) + '</span>';
        html += '</div>';

        html += '<button onclick="abrirDueloCon(\\'' + c.id + '\\')" class="px-3 py-1 rounded-lg bg-black/80 hover:bg-matrix hover:text-black transition-all text-matrix font-black text-xs border border-matrix/50 shadow-matrixSoft shrink-0" title="Duelo Versus">';
        html += 'VS';
        html += '</button>';
        html += '</div>';

        html += '<div class="flex items-center gap-1.5 flex-wrap">';
        html += renderizarPlataformaBadge('yt', c.platforms.youtube);
        html += renderizarPlataformaBadge('tw', c.platforms.twitch);
        html += renderizarPlataformaBadge('ki', c.platforms.kick);
        html += '</div>';

        html += '</div>';
        html += '</div>';
      });

      // TARJETA DE POSTULACIÓN
      if (solapaActiva === 'Emergentes' || solapaActiva === 'Todos') {
        html += '<div class="w-full rounded-2xl bg-gradient-to-br from-[#0c1527] to-[#050811] border-2 border-dashed border-matrix/40 p-4 flex flex-col justify-between min-h-[225px] h-auto text-center shadow-matrixSoft">';
        html += '<div class="space-y-1.5 my-auto">';
        html += '<span class="text-2xl">📡</span>';
        html += '<h4 class="text-sm font-black text-white leading-snug">¿Tenés un canal y querés aparecer en StreamRank?</h4>';
        html += '<p class="text-[11px] text-slate-400 leading-tight">Sumate a las métricas oficiales de la escena nacional.</p>';
        html += '</div>';
        html += '<a href="mailto:info@modoia.online?subject=Postulacion%20de%20Canal%20-%20StreamRank" class="w-full py-2.5 rounded-xl bg-matrix text-black font-black text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-matrix text-center block">';
        html += 'Postular Mi Canal';
        html += '</a>';
        html += '</div>';
      }

      container.innerHTML = html;
    };

    // ========================================================================
    // DATA ROOM & TOKEN
    // ========================================================================
    const solicitarDescargaCSV = () => {
      const savedToken = localStorage.getItem('streamrank_b2b_token');
      if (savedToken) {
        abrirModalReportes();
      } else {
        document.getElementById('modal-token').classList.remove('hidden');
      }
    };

    const cerrarModalToken = () => {
      document.getElementById('modal-token').classList.add('hidden');
      document.getElementById('token-error').classList.add('hidden');
    };

    const validarYAbrirDescarga = async () => {
      const tokenInput = document.getElementById('token-input').value.trim();
      if (!tokenInput) return;

      try {
        const res = await fetch('/api/validate-token?token=' + encodeURIComponent(tokenInput));
        if (res.ok) {
          localStorage.setItem('streamrank_b2b_token', tokenInput);
          cerrarModalToken();
          abrirModalReportes();
        } else {
          document.getElementById('token-error').classList.remove('hidden');
        }
      } catch (e) {
        document.getElementById('token-error').classList.remove('hidden');
      }
    };

    const poblarSelectoresReportes = () => {
      const selectCanal = document.getElementById('report-channel-select');
      if (!selectCanal || !canalesData.length) return;

      const valorPrevio = selectCanal.value;
      let opts = '<option value="todos">Todos los Canales Monitoreados</option>';

      canalesData.forEach((c) => {
        opts += '<option value="' + c.id + '">' + c.name + '</option>';
      });

      selectCanal.innerHTML = opts;
      if (valorPrevio) selectCanal.value = valorPrevio;

      actualizarProgramasAuditModal(selectCanal.value);
    };

    const actualizarProgramasAuditModal = (canalId) => {
      const progSelect = document.getElementById('report-program-select');
      if (!progSelect) return;

      let opts = '<option value="todos">Todos los programas del canal</option>';

      if (canalId !== 'todos') {
        const canal = canalesData.find((c) => c.id === canalId);
        if (canal) {
          if (canal.programas && Array.isArray(canal.programas)) {
            canal.programas.forEach((prog) => {
              opts += '<option value="' + prog.replace(/"/g, '&quot;') + '">' + prog + '</option>';
            });
          }
          if (
            canal.title &&
            canal.title !== 'Transmisión finalizada' &&
            canal.title !== 'Sincronizando señal en vivo...' &&
            (!canal.programas || !canal.programas.includes(canal.title))
          ) {
            opts += '<option value="' + canal.title.replace(/"/g, '&quot;') + '">🔴 ' + canal.title + '</option>';
          }
        }
      }

      progSelect.innerHTML = opts;
      progSelect.value = 'todos';
    };

    const abrirModalReportes = () => {
      document.getElementById('modal-reportes').classList.remove('hidden');
      ajustarFechasPeriodo(document.getElementById('report-period-select').value);
      actualizarProgramasAuditModal(document.getElementById('report-channel-select').value);
    };

    const cerrarModalReportes = () => {
      document.getElementById('modal-reportes').classList.add('hidden');
    };

    const ajustarFechasPeriodo = (periodo) => {
      const customContainer = document.getElementById('custom-dates-container');
      const inputFrom = document.getElementById('report-from-date');
      const inputTo = document.getElementById('report-to-date');

      const hoy = new Date();
      const formatIso = (d) => d.toISOString().split('T')[0];

      inputTo.value = formatIso(hoy);

      if (periodo === 'custom') {
        customContainer.classList.remove('hidden');
        return;
      }

      customContainer.classList.add('hidden');

      if (periodo === 'hoy') {
        inputFrom.value = formatIso(hoy);
      } else if (periodo === '7dias') {
        const d7 = new Date();
        d7.setDate(hoy.getDate() - 7);
        inputFrom.value = formatIso(d7);
      } else if (periodo === 'mes') {
        const d30 = new Date();
        d30.setDate(1);
        inputFrom.value = formatIso(d30);
      }
    };

    const ejecutarDescargaReporte = () => {
      const token = localStorage.getItem('streamrank_b2b_token') || '';
      const canal = document.getElementById('report-channel-select').value;
      const programa = document.getElementById('report-program-select').value;
      const from = document.getElementById('report-from-date').value;
      const to = document.getElementById('report-to-date').value;

      let url = '/api/export-csv?token=' + encodeURIComponent(token);
      if (canal) url += '&canal=' + encodeURIComponent(canal);
      if (programa && programa !== 'todos') url += '&programa=' + encodeURIComponent(programa);
      if (from) url += '&from=' + encodeURIComponent(from);
      if (to) url += '&to=' + encodeURIComponent(to);

      window.location.href = url;
    };

    // ========================================================================
    // MODAL DUELO
    // ========================================================================
    const poblarSelectoresDuelo = () => {
      const selA = document.getElementById('duel-select-a');
      const selB = document.getElementById('duel-select-b');
      if (!selA || !selB || !canalesData.length) return;

      const prevA = selA.value;
      const prevB = selB.value;

      let opciones = '';
      canalesData.forEach((c) => {
        opciones += '<option value="' + c.id + '">' + c.name + ' (' + formatNum(c.totalViewers) + ' viewers)</option>';
      });

      selA.innerHTML = opciones;
      selB.innerHTML = opciones;

      if (prevA && canalesData.some((c) => c.id === prevA)) {
        selA.value = prevA;
      } else {
        selA.value = canalesData[0].id;
      }

      if (prevB && canalesData.some((c) => c.id === prevB)) {
        selB.value = prevB;
      } else if (canalesData.length > 1) {
        selB.value = canalesData[1].id;
      }

      renderizarContenidoDuelo();
    };

    const abrirDueloCon = (canalId) => {
      document.getElementById('modal-duel').classList.remove('hidden');
      const selA = document.getElementById('duel-select-a');
      const selB = document.getElementById('duel-select-b');

      selA.value = canalId;
      const alternativo = canalesData.find((c) => c.id !== canalId);
      if (alternativo) selB.value = alternativo.id;

      renderizarContenidoDuelo();
    };

    const cerrarModalDuelo = () => {
      document.getElementById('modal-duel').classList.add('hidden');
    };

    const renderizarContenidoDuelo = () => {
      const idA = document.getElementById('duel-select-a').value;
      const idB = document.getElementById('duel-select-b').value;

      const canalA = canalesData.find((c) => c.id === idA);
      const canalB = canalesData.find((c) => c.id === idB);

      if (!canalA || !canalB) return;

      const progA =
        canalA.isLive && canalA.title && canalA.title !== 'Transmisión en directo' && canalA.title !== 'Transmitiendo en directo'
          ? canalA.title
          : canalA.programas && canalA.programas.length
          ? canalA.programas[0]
          : canalA.subtheme || canalA.name;

      const progB =
        canalB.isLive && canalB.title && canalB.title !== 'Transmisión en directo' && canalB.title !== 'Transmitiendo en directo'
          ? canalB.title
          : canalB.programas && canalB.programas.length
          ? canalB.programas[0]
          : canalB.subtheme || canalB.name;

      document.getElementById('duel-a-program').innerText = progA;
      document.getElementById('duel-a-name').innerText = canalA.name;
      document.getElementById('duel-a-avatar').src = canalA.avatar;
      document.getElementById('duel-a-avatar').onerror = function () {
        this.onerror = null;
        this.src = getFallbackAvatar(canalA.name);
      };
      document.getElementById('duel-a-status').innerText = canalA.isLive ? '🔴 EN VIVO' : '⚫ OFFLINE';
      document.getElementById('duel-a-viewers').innerText = formatNum(canalA.totalViewers);

      document.getElementById('duel-b-program').innerText = progB;
      document.getElementById('duel-b-name').innerText = canalB.name;
      document.getElementById('duel-b-avatar').src = canalB.avatar;
      document.getElementById('duel-b-avatar').onerror = function () {
        this.onerror = null;
        this.src = getFallbackAvatar(canalB.name);
      };
      document.getElementById('duel-b-status').innerText = canalB.isLive ? '🔴 EN VIVO' : '⚫ OFFLINE';
      document.getElementById('duel-b-viewers').innerText = formatNum(canalB.totalViewers);

      const totalShare = (canalA.totalViewers || 0) + (canalB.totalViewers || 0);
      let pctA = 50;
      let pctB = 50;

      if (totalShare > 0) {
        pctA = Math.round((canalA.totalViewers / totalShare) * 100);
        pctB = 100 - pctA;
      }

      document.getElementById('duel-pct-a').innerText = pctA + '%';
      document.getElementById('duel-pct-b').innerText = pctB + '%';

      document.getElementById('duel-bar-a').style.width = pctA + '%';
      document.getElementById('duel-bar-b').style.width = pctB + '%';

      const fechaActual = new Intl.DateTimeFormat('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        dateStyle: 'short',
        timeStyle: 'medium'
      }).format(new Date());

      document.getElementById('duel-timestamp').innerText = 'CAPTURA: ' + fechaActual + ' ART';
    };

    const descargarDueloPNG = async () => {
      const tarjeta = document.getElementById('duel-capture-card');
      try {
        const canvas = await html2canvas(tarjeta, {
          backgroundColor: '#050811',
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          onclone: (clonedDoc) => {
            const clonedCard = clonedDoc.getElementById('duel-capture-card');
            if (clonedCard) {
              clonedCard.style.letterSpacing = 'normal';
              clonedCard.style.overflow = 'visible';
            }
          }
        });
        const enlace = document.createElement('a');
        enlace.href = canvas.toDataURL('image/png');
        enlace.download = 'streamrank_duelo_' + Date.now() + '.png';
        enlace.click();
      } catch (err) {
        console.error('Error al exportar PNG:', err);
        alert('No se pudo generar la placa. Revisa la conexión de red.');
      }
    };

    fetchDatos();
    actualizarDropdownSubtemas();
    setInterval(fetchDatos, 20000);
  </script>
</body>
</html>
`;

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(HTML_APP);
});

// ============================================================================
// ARRANQUE DEL SERVIDOR
// ============================================================================
app.listen(PORT, () => {
  console.log(`[StreamRank ARG] Servidor activo en puerto ${PORT}`);
});
