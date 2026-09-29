import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================================================
// CONFIGURACIÓN DE CANALES CON METADATOS Y LÍMITES HEURÍSTICOS
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
    baselineMax: 150000,
    isEmerging: false
  },
  {
    id: 'somoslacasaok',
    name: 'La Casa Streaming',
    category: 'Entretenimiento',
    subtheme: 'Streaming General',
    avatar: 'https://unavatar.io/youtube/somoslacasaok',
    platforms: { yt: 'somoslacasaok' },
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
    baselineMax: 35000,
    isEmerging: false
  },
  {
    id: 'bondi_liveok',
    name: 'Bondi Live',
    category: 'Entretenimiento',
    subtheme: 'Farándula / Magazine',
    avatar: 'https://unavatar.io/youtube/bondi_liveok',
    platforms: { yt: 'bondi_liveok' },
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
    baselineMax: 95000,
    isEmerging: false
  },
  {
    id: 'lanacionmas',
    name: 'La Nación+',
    category: 'Política',
    subtheme: 'Análisis Político',
    avatar: 'https://unavatar.io/youtube/lanacionmas',
    platforms: { yt: 'lanacionmas' },
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
    baselineMax: 45000,
    isEmerging: false
  },
  {
    id: 'somosgelatina',
    name: 'Gelatina',
    category: 'Política',
    subtheme: 'Humor Político / Streaming',
    avatar: 'https://unavatar.io/youtube/somosgelatina',
    platforms: { yt: 'somosgelatina', tw: 'somosgelatina' },
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
    baselineMax: 45000,
    isEmerging: false
  },

  // Deportes
  {
    id: 'flavioazzaro',
    name: 'Flavio Azzaro / AZZ',
    category: 'Deportes',
    subtheme: 'Debate Futbolero',
    avatar: 'https://unavatar.io/youtube/FlavioAzzaroOficial',
    platforms: { yt: 'FlavioAzzaroOficial' },
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
    baselineMax: 45000,
    isEmerging: false
  },

  // Emergentes
  {
    id: 'cenital',
    name: 'Cenital',
    category: 'Política',
    subtheme: 'Periodismo Independiente',
    avatar: 'https://unavatar.io/youtube/Cenitalcom',
    platforms: { yt: 'Cenitalcom' },
    baselineMax: 20000,
    isEmerging: true
  },
  {
    id: 'urbanaplay',
    name: 'Urbana Play 104.3',
    category: 'Entretenimiento',
    subtheme: 'Radio Multimedia',
    avatar: 'https://unavatar.io/youtube/urbanaplayfm',
    platforms: { yt: 'urbanaplayfm' },
    baselineMax: 25000,
    isEmerging: true
  },
  {
    id: 'parenlamanotv',
    name: 'Paren La Mano',
    category: 'Entretenimiento',
    subtheme: 'Comedia & Charlas',
    avatar: 'https://unavatar.io/youtube/parenlamanoclips',
    platforms: { yt: 'parenlamanoclips' },
    baselineMax: 40000,
    isEmerging: true
  }
];

// ============================================================================
// PERSISTENCIA HISTÓRICA EN MEMORIA (MOTOR ANALÍTICO PARA AUDITORÍA)
// ============================================================================
const historicalSnapshots = [];
const MAX_HISTORICAL_RECORDS = 50000;

// Inicialización de arranque rápido: el servidor sirve la web de inmediato
let telemetriaCache = CHANNELS.map((canal) => ({
  id: canal.id,
  name: canal.name,
  category: canal.category,
  subtheme: canal.subtheme,
  avatar: canal.avatar,
  isEmerging: canal.isEmerging,
  isLive: false,
  totalViewers: 0,
  title: 'Sincronizando señal en vivo...',
  thumbnail: '',
  botAlert: false,
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

// Helper de Fecha y Hora en zona horaria Buenos Aires (America/Argentina/Buenos_Aires)
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

// ============================================================================
// MOTOR DE SCRAPING CON TIMEOUT DE RED ROBUSTO (6000 MS)
// ============================================================================
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
// YOUTUBE SCRAPER: REDIRECTS, BYPASS Y EXTRACCIÓN DIRECTA
// ============================================================================
const scrapeYouTube = async (handle) => {
  if (!handle) return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: '' };
  try {
    const url = `https://www.youtube.com/@${handle}/live`;
    const res = await fetchConTimeout(
      url,
      {
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
          'Cookie': 'SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+'
        }
      },
      6000
    );

    if (!res.ok) return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: '' };

    // 1. Extraer videoId desde la URL final tras redirecciones
    let videoId = '';
    const finalUrl = res.url || '';
    if (finalUrl.includes('watch?v=')) {
      const urlMatch = finalUrl.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (urlMatch) videoId = urlMatch[1];
    }

    const html = await res.text();

    // 2. Si no provino de la URL final, buscar en tags canónicos y meta
    if (!videoId) {
      const canonicalMatch =
        html.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/i) ||
        html.match(/<meta\s+property="og:url"\s+content="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/i) ||
        html.match(/<meta\s+itemprop="videoId"\s+content="([a-zA-Z0-9_-]{11})"/i) ||
        html.match(/"liveStreamabilityRenderer":\s*\{\s*"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
      if (canonicalMatch && canonicalMatch[1]) {
        videoId = canonicalMatch[1];
      }
    }

    // Si la URL canónica no apunta a un video en watch?v=, el canal está fuera del aire
    if (!videoId) {
      return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: '' };
    }

    // 3. Descartar transmisiones programadas o futuras (UPCOMING)
    const isUpcoming =
      /"status":\s*"UPCOMING"/i.test(html) ||
      /\\"status\\":\s*\\"UPCOMING\\"/i.test(html) ||
      html.includes('"upcomingEventData"');
    if (isUpcoming) {
      return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: '' };
    }

    // 4. Extraer título exclusivo
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

    // Descartar títulos de cortesía y carteles de espera
    const blacklistRegex = /(hasta ma[nñ]ana|pr[oó]ximamente|en espera|directo finalizado)/i;
    if (title && blacklistRegex.test(title)) {
      return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: '' };
    }

    // 5. Extraer Viewers Concurrentes
    let viewers = 0;
    const concurrentMatch =
      html.match(/"concurrentViewers":\s*"(\d+)"/) ||
      html.match(/\\"concurrentViewers\\":\s*\\"(\d+)\\"/);
    const originalViewMatch =
      html.match(/"originalViewCount":\s*"(\d+)"/) ||
      html.match(/\\"originalViewCount\\":\s*\\"(\d+)\\"/);
    const viewRunsMatch =
      html.match(/"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/) ||
      html.match(/\\"viewCount\\":\s*\{\s*\\"runs\\":\s*\[\s*\{\s*\\"text\\":\s*\\"([^"\\]+)\\"/);

    if (concurrentMatch) {
      viewers = parseInt(concurrentMatch[1], 10) || 0;
    } else if (originalViewMatch) {
      viewers = parseInt(originalViewMatch[1], 10) || 0;
    } else if (viewRunsMatch && viewRunsMatch[1]) {
      const limpio = viewRunsMatch[1].replace(/[^0-9]/g, '');
      viewers = parseInt(limpio, 10) || 0;
    }

    // 6. Validación de En Vivo: (viewers > 20 o señales live en JSON) y viewers > 5
    const hasLiveSignal =
      viewers > 20 ||
      /"isLive":\s*true/i.test(html) ||
      /\\"isLive\\":\s*true/i.test(html) ||
      /"isLiveBroadcast":\s*true/i.test(html) ||
      /\\"isLiveBroadcast\\":\s*true/i.test(html) ||
      /"isLiveNow":\s*true/i.test(html) ||
      /\\"isLiveNow\\":\s*true/i.test(html);

    if (hasLiveSignal && viewers > 5) {
      console.log(`[YouTube OK] ${handle}: ${viewers} viewers`);
      return {
        isLive: true,
        viewers,
        title: title || 'Transmisión en directo',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      };
    }

    return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: '' };
  } catch (err) {
    console.error(`[YouTube Error] ${handle}:`, err.message);
    return { isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: '' };
  }
};

// Twitch GQL Scraper (Público, sin API keys)
const scrapeTwitch = async (login) => {
  if (!login) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
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

    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

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
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  } catch (err) {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
};

// Kick API v2 Scraper (Público, sin API keys)
const scrapeKick = async (slug) => {
  if (!slug) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
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

    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    const data = await res.json();
    const isLive = data?.livestream?.is_live === true;
    const viewers = data?.livestream?.viewer_count || 0;

    if (isLive && viewers > 3) {
      return {
        isLive: true,
        viewers,
        title: data.livestream.session_title || 'En vivo en Kick',
        thumbnail: data.livestream.thumbnail?.url || ''
      };
    }
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  } catch (err) {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
};

// ============================================================================
// MOTOR HEURÍSTICO DE ANOMALÍAS Y TRÁFICO ARTIFICIAL (BOTS)
// ============================================================================
const evaluarAnomaliaTrafico = (canal, totalViewers) => {
  const historial = historialLecturas.get(canal.id) || [];
  
  historial.push(totalViewers);
  if (historial.length > 10) historial.shift();
  historialLecturas.set(canal.id, historial);

  if (!totalViewers || totalViewers < 2500) {
    return { botAlert: false, reason: null, decoupled: false };
  }

  if (canal.baselineMax && totalViewers > canal.baselineMax * 2.8) {
    return {
      botAlert: true,
      reason: `Pico desproporcionado (+${Math.round((totalViewers / canal.baselineMax) * 100)}% de baseline)`,
      decoupled: true
    };
  }

  if (historial.length >= 4) {
    const lecturasAnteriores = historial.slice(0, -1).filter((v) => v > 0);
    if (lecturasAnteriores.length >= 2) {
      const promedioPrevio = lecturasAnteriores.reduce((a, b) => a + b, 0) / lecturasAnteriores.length;
      if (promedioPrevio > 500 && totalViewers > promedioPrevio * 4.2 && totalViewers > 15000) {
        return {
          botAlert: true,
          reason: 'Variación anómala repentina sin correlación orgánica',
          decoupled: true
        };
      }
    }
  }

  return { botAlert: false, reason: null, decoupled: false };
};

// ============================================================================
// CICLO DE SCRAPEO SECUENCIAL CON PAUSA DE 120 MS (ANTI 429)
// ============================================================================
const actualizarTelemetria = async () => {
  if (estaScrapeando) return;
  estaScrapeando = true;

  try {
    const listaActualizada = [];
    const bsAsTime = getBuenosAiresTime();

    for (const canal of CHANNELS) {
      try {
        const [ytRes, twRes, kiRes] = await Promise.all([
          canal.platforms.yt ? scrapeYouTube(canal.platforms.yt) : Promise.resolve({ isLive: false, viewers: 0, title: 'Transmisión finalizada', thumbnail: '' }),
          canal.platforms.tw ? scrapeTwitch(canal.platforms.tw) : Promise.resolve({ isLive: false, viewers: 0, title: '', thumbnail: '' }),
          canal.platforms.ki ? scrapeKick(canal.platforms.ki) : Promise.resolve({ isLive: false, viewers: 0, title: '', thumbnail: '' })
        ]);

        const isLive = ytRes.isLive || twRes.isLive || kiRes.isLive;
        const totalViewers = (ytRes.viewers || 0) + (twRes.viewers || 0) + (kiRes.viewers || 0);

        let thumbnail = isLive ? (ytRes.thumbnail || twRes.thumbnail || kiRes.thumbnail || '') : '';
        let title = isLive ? (ytRes.title || twRes.title || kiRes.title || 'Transmitiendo en directo') : 'Transmisión finalizada';

        const anomalia = isLive ? evaluarAnomaliaTrafico(canal, totalViewers) : { botAlert: false, reason: null, decoupled: false };

        const itemTelemetria = {
          id: canal.id,
          name: canal.name,
          category: canal.category,
          subtheme: canal.subtheme,
          avatar: canal.avatar,
          isEmerging: canal.isEmerging,
          isLive,
          totalViewers,
          title,
          thumbnail,
          botAlert: anomalia.botAlert,
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

        listaActualizada.push(itemTelemetria);

        if (isLive && totalViewers > 0) {
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
            bot_alert: anomalia.botAlert ? 1 : 0,
            fecha: bsAsTime.date,
            hora: bsAsTime.time,
            timestamp_buenos_aires: bsAsTime.timestamp
          });

          if (historicalSnapshots.length > MAX_HISTORICAL_RECORDS) {
            historicalSnapshots.splice(0, historicalSnapshots.length - (MAX_HISTORICAL_RECORDS - 5000));
          }
        }
      } catch (canalError) {
        console.error(`Error procesando telemetría de ${canal.name}:`, canalError);
      }

      await new Promise((resolve) => setTimeout(resolve, 120));
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

// Iniciar scrapeo en background sin bloquear peticiones entrantes
actualizarTelemetria();
setInterval(actualizarTelemetria, 25000);

// ============================================================================
// ENDPOINTS DE API
// ============================================================================

// 1. Healthcheck ultra-rápido para UptimeRobot
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 2. Telemetría en tiempo real
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

// 3. Exportación de corte instantáneo CSV
app.get('/api/analytics/export', (req, res) => {
  const bsAsTime = getBuenosAiresTime();

  const cabeceras = ['Canal', 'Categoria', 'Subtema', 'Espectadores_Totales', 'En_Vivo', 'Alerta_Bots', 'YouTube', 'Twitch', 'Kick', 'Fecha_Hora_Buenos_Aires'];
  const lineas = telemetriaCache.map((c) => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.category}"`,
    `"${c.subtheme}"`,
    c.totalViewers,
    c.isLive ? 'SI' : 'NO',
    c.botAlert ? 'AUDITORIA_ACTIVADA' : 'NORMAL',
    c.platforms.youtube.viewers || 0,
    c.platforms.twitch.viewers || 0,
    c.platforms.kick.viewers || 0,
    `"${bsAsTime.timestamp}"`
  ]);

  const csv = [cabeceras.join(','), ...lineas.map((l) => l.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="streamrank_instantaneo_${Date.now()}.csv"`);
  res.status(200).send(csv);
});

// 4. Endpoint de Auditoría Histórica con filtros de canal y fecha
app.get('/api/analytics/historical', (req, res) => {
  const { canal, from, to, format } = req.query;

  let filtrados = historicalSnapshots;

  if (canal && canal !== 'todos') {
    filtrados = filtrados.filter((s) => s.canal_id === canal.toLowerCase());
  }

  if (from) {
    filtrados = filtrados.filter((s) => s.fecha >= from);
  }

  if (to) {
    filtrados = filtrados.filter((s) => s.fecha <= to);
  }

  if (format === 'csv') {
    const cabeceras = [
      'Canal_ID',
      'Nombre',
      'Categoria',
      'Subtema',
      'Titulo_Programa',
      'Viewers_Total',
      'Viewers_YouTube',
      'Viewers_Twitch',
      'Viewers_Kick',
      'Alerta_Bots',
      'Fecha',
      'Hora',
      'Timestamp_Buenos_Aires'
    ];

    const filas = filtrados.map((s) => [
      `"${s.canal_id}"`,
      `"${s.nombre.replace(/"/g, '""')}"`,
      `"${s.categoria}"`,
      `"${s.subtema}"`,
      `"${s.titulo_programa.replace(/"/g, '""')}"`,
      s.viewers_total,
      s.viewers_yt,
      s.viewers_tw,
      s.viewers_ki,
      s.bot_alert,
      `"${s.fecha}"`,
      `"${s.hora}"`,
      `"${s.timestamp_buenos_aires}"`
    ]);

    const csvData = [cabeceras.join(','), ...filas.map((f) => f.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="streamrank_auditoria_${canal || 'general'}_${from || 'inicio'}_${to || 'hoy'}.csv"`);
    return res.status(200).send(csvData);
  }

  res.json({
    totalSamples: filtrados.length,
    filters: {
      canal: canal || 'todos',
      from: from || null,
      to: to || null
    },
    data: filtrados
  });
});

// ============================================================================
// FRONTEND SERVIDO EN GET /
// ============================================================================
const HTML_APP = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StreamRank ARG | Monitor de Audiencia en Vivo</title>
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
            yt: '#FF0000',
            tw: '#9146FF',
            ki: '#53FC18'
          },
          boxShadow: {
            matrix: '0 0 20px rgba(0, 255, 102, 0.45)',
            matrixSoft: '0 0 10px rgba(0, 255, 102, 0.25)',
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
    }
    .matrix-glow {
      text-shadow: 0 0 10px rgba(0, 255, 102, 0.7), 0 0 22px rgba(0, 255, 102, 0.35);
    }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-[#050811] text-slate-100 antialiased selection:bg-[#00ff66] selection:text-black">

  <!-- HEADER -->
  <header class="sticky top-0 z-40 bg-[#050811]/95 backdrop-blur-md border-b border-[#162238]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      
      <!-- LOGO -->
      <div class="flex items-center space-x-2.5 sm:space-x-3">
        <div class="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black border border-matrix/50 shadow-matrixSoft flex-shrink-0">
          <span class="absolute w-3.5 h-3.5 rounded-full bg-matrix animate-ping opacity-75"></span>
          <span class="w-3 h-3 rounded-full bg-matrix"></span>
        </div>
        <div>
          <div class="flex items-center space-x-1.5 sm:space-x-2">
            <span class="text-base sm:text-xl font-black tracking-wider text-white">STREAMRANK</span>
            <span class="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-black tracking-widest bg-matrix/20 text-matrix border border-matrix/40">ARG</span>
          </div>
          <p class="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[190px] sm:max-w-none">Telemetría y Ranking en Vivo de Argentina</p>
        </div>
      </div>

      <!-- STATUS & BOTÓN CSV RESPONSIVE -->
      <div class="flex items-center space-x-2 sm:space-x-3">
        <div class="hidden lg:flex items-center bg-[#0b1120] border border-[#162238] rounded-xl px-4 py-2 space-x-4">
          <div class="flex items-center space-x-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-matrix shadow-matrix"></span>
            <span class="text-xs font-semibold text-slate-300"><span id="stat-live-count" class="text-matrix font-bold">0</span> En Vivo</span>
          </div>
          <div class="w-px h-4 bg-slate-700"></div>
          <div class="text-xs text-slate-400">
            Audiencia: <span id="stat-total-viewers" class="text-white font-mono font-bold">0</span>
          </div>
          <div class="w-px h-4 bg-slate-700"></div>
          <div class="text-[11px] font-mono text-slate-400" id="sync-clock">Sinc: --:--:--</div>
        </div>

        <a href="/api/analytics/export" class="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs font-black uppercase tracking-wider text-black bg-matrix rounded-xl hover:bg-emerald-400 transition-all shadow-matrix flex-shrink-0">
          <svg class="w-4 h-4 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span class="hidden sm:inline">Exportar CSV</span>
          <span class="sm:hidden text-[11px]">CSV</span>
        </a>
      </div>
    </div>
  </header>

  <!-- BANNER DE INTEGRIDAD DE DATOS Y AUDITORÍA DE BOTS -->
  <div class="bg-gradient-to-r from-emerald-950/40 via-amber-950/30 to-emerald-950/40 border-b border-matrix/20 px-4 py-2.5">
    <div class="max-w-7xl mx-auto flex items-center justify-between text-xs">
      <div class="flex items-center space-x-2 text-slate-300">
        <svg class="w-4 h-4 text-matrix flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
        <span><strong class="text-matrix font-bold">AUDITORÍA ACTIVA DE TRÁFICO ARTIFICIAL:</strong> El sistema evalúa picos no orgánicos y descarta placas de espera, repeticiones o bucles sin audiencia real para mantener un ranking 100% fidedigno.</span>
      </div>
      <span class="hidden md:inline-block text-[11px] font-mono text-slate-400">Buenos Aires ART</span>
    </div>
  </div>

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
    
    <!-- HERO LEADER (#1 DEL MOMENTO) -->
    <section id="hero-leader" class="w-full">
      <div class="w-full h-64 sm:h-72 rounded-2xl bg-[#0b1120] border border-[#162238] animate-pulse flex items-center justify-center text-slate-500 font-mono text-xs sm:text-sm">
        Sincronizando canal líder orgánico de Argentina...
      </div>
    </section>

    <!-- BARRA CON BUSCADOR INSTANTÁNEO Y BOTÓN MODAL AUDITORÍA HISTÓRICA -->
    <section class="w-full flex flex-col sm:flex-row items-center gap-3">
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
          placeholder="Buscar canal en vivo por nombre (ej: Olga, Luzu, TN, Davoo)..." 
          class="w-full pl-10 pr-4 py-3 bg-[#0b1120] border border-[#162238] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-matrix focus:shadow-matrixSoft transition-all"
        >
      </div>

      <!-- BOTÓN MODAL REPORTES & AUDITORÍA HISTÓRICA -->
      <button 
        onclick="abrirModalReportes()" 
        class="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0b1120] border border-matrix/50 text-matrix hover:bg-matrix hover:text-black transition-all shadow-matrixSoft text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 flex-shrink-0"
      >
        <span>📊</span>
        <span>Reportes & Auditoría Histórica</span>
      </button>
    </section>

    <!-- NAVEGACIÓN Y FILTROS RESPONSIVE -->
    <section class="space-y-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#162238] pb-4">
        
        <!-- Solapas Principales -->
        <div class="flex flex-wrap gap-2" id="tab-buttons">
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
        </div>

        <!-- Desplegables de Subtemas y Estado -->
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
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

    <!-- GRILLA COMPLETA DE CANALES -->
    <section>
      <div id="channels-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      </div>
    </section>

    <!-- CANALES EMERGENTES & NUEVAS PROMESAS -->
    <section class="mt-8 sm:mt-12 bg-gradient-to-br from-[#0b1120] to-[#050811] rounded-2xl border border-[#162238] p-5 sm:p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-xl">🚀</span>
          <div>
            <h2 class="text-sm sm:text-base font-black text-white">Canales Emergentes & Nuevas Promesas</h2>
            <p class="text-xs text-slate-400">Comunidades en ascenso, proyectos independientes y radios digitales.</p>
          </div>
        </div>
        <span class="text-[10px] sm:text-xs font-mono font-bold text-matrix bg-matrix/10 border border-matrix/20 px-2.5 sm:px-3 py-1 rounded-full">RADAR ARG</span>
      </div>

      <div id="emerging-channels-grid" class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      </div>
    </section>

    <!-- BANNER SPONSOR -->
    <section class="w-full">
      <div class="relative w-full rounded-2xl bg-gradient-to-r from-emerald-950/20 via-[#0b1120] to-blue-950/20 border border-matrix/30 p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div class="space-y-1">
          <span class="text-[10px] font-mono tracking-widest text-matrix uppercase bg-matrix/10 px-2 py-0.5 rounded border border-matrix/20">ESPACIO PUBLICITARIO</span>
          <h3 class="text-base sm:text-lg font-black text-white">Conecta con la industria del streaming argentino</h3>
          <p class="text-xs text-slate-400">Presencia directa ante agencias, marcas y creadores de contenido.</p>
        </div>
        <a href="mailto:info@modoia.online" class="px-5 py-2.5 rounded-xl bg-[#0b1120] hover:bg-matrix hover:text-black border border-matrix/40 text-matrix text-xs font-black transition-all shadow-matrixSoft flex-shrink-0">
          CONTACTAR PUBLICIDAD
        </a>
      </div>
    </section>

    <!-- AUTORIDAD Y TRANSPARENCIA METODOLÓGICA -->
    <section class="bg-[#0b1120] rounded-2xl border border-[#162238] p-5 sm:p-6 space-y-4 text-xs text-slate-400 leading-relaxed">
      <div class="flex items-center space-x-2 text-white font-bold text-sm">
        <svg class="w-5 h-5 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>¿Cómo funciona, por qué y en qué se basa StreamRank ARG?</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div class="space-y-1.5">
          <h4 class="font-bold text-slate-200">1. Extracción Canónica Aislada</h4>
          <p>La telemetría extrae metadatos exclusivamente de la URL canónica y reproductor del stream en directo, impidiendo la captura de miniaturas ajenas o sugerencias de otros canales.</p>
        </div>
        <div class="space-y-1.5">
          <h4 class="font-bold text-slate-200">2. Detección Heurística de Bots</h4>
          <p>Las subidas abruptas y anormales de audiencia sin correlación orgánica son auditadas y desacopladas del ranking general para preservar la transparencia.</p>
        </div>
        <div class="space-y-1.5">
          <h4 class="font-bold text-slate-200">3. Auditoría Histórica Abierta</h4>
          <p>Disponibilizamos descargas en CSV estructuradas por programa y fecha para verificación pública y auditoría de pautas de agencias.</p>
        </div>
      </div>
    </section>

  </main>

  <!-- MODAL DE REPORTES & AUDITORÍA HISTÓRICA -->
  <div id="modal-reportes" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md hidden p-4">
    <div class="bg-[#0b1120] border border-[#162238] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
      
      <div class="flex items-center justify-between pb-3 border-b border-[#162238]">
        <div class="flex items-center space-x-2">
          <span class="text-matrix font-black text-lg">📊 REPORTES & AUDITORÍA HISTÓRICA</span>
        </div>
        <button onclick="cerrarModalReportes()" class="text-slate-400 hover:text-white transition-colors text-2xl font-bold">&times;</button>
      </div>

      <p class="text-xs text-slate-300">
        Descarga informes consolidados en CSV estructurado con telemetría por programa, canal y franja horaria para análisis de medios y agencias.
      </p>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">CANAL A AUDITAR</label>
          <select id="report-channel-select" class="w-full bg-[#050811] border border-[#162238] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-matrix">
            <option value="todos">Todos los Canales Monitoreados</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">PERÍODO TEMPORAL</label>
          <select id="report-period-select" onchange="ajustarFechasPeriodo(this.value)" class="w-full bg-[#050811] border border-[#162238] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-matrix">
            <option value="hoy">Hoy (Día en curso)</option>
            <option value="7dias">Últimos 7 Días</option>
            <option value="mes">Todo el Mes</option>
            <option value="custom">Rango Personalizado</option>
          </select>
        </div>

        <div id="custom-dates-container" class="grid grid-cols-2 gap-3 hidden">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">DESDE (FROM)</label>
            <input type="date" id="report-from-date" class="w-full bg-[#050811] border border-[#162238] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-matrix">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">HASTA (TO)</label>
            <input type="date" id="report-to-date" class="w-full bg-[#050811] border border-[#162238] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-matrix">
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#162238]">
        <button onclick="descargarCorteInstantaneo()" class="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#050811] border border-[#162238] transition-colors">
          ⚡ Corte Actual en Vivo
        </button>
        <button onclick="ejecutarDescargaReporte()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-matrix text-black hover:bg-emerald-400 transition-all shadow-matrix flex items-center justify-center space-x-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          <span>Descargar Reporte CSV</span>
        </button>
      </div>

    </div>
  </div>

  <!-- MODAL DUELO 1 VS 1 (FORMATO 1:1 CUADRADO PARA REDES) -->
  <div id="modal-duel" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md hidden p-4 overflow-y-auto">
    <div class="bg-[#0b1120] border border-[#162238] rounded-2xl max-w-xl sm:max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-auto">
      
      <div class="flex items-center justify-between pb-3 border-b border-[#162238]">
        <div class="flex items-center space-x-2">
          <span class="text-matrix font-extrabold text-base sm:text-lg">⚡ DUELO 1 VS 1</span>
          <span class="text-xs text-slate-400">Comparativa directa en vivo</span>
        </div>
        <button onclick="cerrarModalDuelo()" class="text-slate-400 hover:text-white transition-colors text-2xl font-bold">&times;</button>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:gap-4 my-3">
        <div>
          <label class="block text-[11px] sm:text-xs font-semibold text-slate-400 mb-1">CANAL A</label>
          <select id="duel-select-a" onchange="renderizarContenidoDuelo()" class="w-full bg-[#050811] border border-[#162238] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-matrix">
          </select>
        </div>
        <div>
          <label class="block text-[11px] sm:text-xs font-semibold text-slate-400 mb-1">CANAL B</label>
          <select id="duel-select-b" onchange="renderizarContenidoDuelo()" class="w-full bg-[#050811] border border-[#162238] rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-matrix">
          </select>
        </div>
      </div>

      <!-- PLACA PARA CAPTURA HTML2CANVAS (1:1 CUADRADO EXACTO) -->
      <div id="duel-capture-card" class="bg-[#050811] border border-matrix/30 rounded-2xl w-full max-w-[520px] aspect-square mx-auto flex flex-col justify-between p-6 sm:p-8 shadow-glow relative my-3">
        
        <div class="text-center pt-1">
          <span class="text-[10px] sm:text-[11px] font-black tracking-widest uppercase bg-matrix/10 text-matrix px-3.5 py-1.5 rounded-full border border-matrix/30">STREAMRANK ARG • DUELO EN DIRECTO</span>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:gap-4 items-stretch my-auto">
          
          <!-- Canal A -->
          <div class="text-center p-3.5 sm:p-4 rounded-xl bg-[#0b1120]/90 border border-[#162238] flex flex-col justify-between">
            <div>
              <img id="duel-a-avatar" crossorigin="anonymous" src="" class="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto border-2 border-matrix object-cover shadow-matrixSoft mb-1.5" alt="A">
              <h3 id="duel-a-name" class="font-extrabold text-white text-sm sm:text-base leading-normal break-words mt-1 mb-1">--</h3>
              <p id="duel-a-status" class="text-[10px] sm:text-xs font-mono text-slate-400 mb-2">OFFLINE</p>
            </div>
            <div>
              <div id="duel-a-viewers" class="text-2xl sm:text-3xl font-black font-mono text-matrix matrix-glow">0</div>
              <div class="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Espectadores</div>
            </div>
          </div>

          <!-- Canal B -->
          <div class="text-center p-3.5 sm:p-4 rounded-xl bg-[#0b1120]/90 border border-[#162238] flex flex-col justify-between">
            <div>
              <img id="duel-b-avatar" crossorigin="anonymous" src="" class="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto border-2 border-cyan-400 object-cover shadow-cyan-500/50 mb-1.5" alt="B">
              <h3 id="duel-b-name" class="font-extrabold text-white text-sm sm:text-base leading-normal break-words mt-1 mb-1">--</h3>
              <p id="duel-b-status" class="text-[10px] sm:text-xs font-mono text-slate-400 mb-2">OFFLINE</p>
            </div>
            <div>
              <div id="duel-b-viewers" class="text-2xl sm:text-3xl font-black font-mono text-cyan-400">0</div>
              <div class="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Espectadores</div>
            </div>
          </div>

        </div>

        <div class="space-y-3 pb-1">
          <div>
            <div class="flex justify-between text-xs font-mono font-bold mb-1.5">
              <span id="duel-pct-a" class="text-matrix">50%</span>
              <span class="text-slate-400 text-[10px] sm:text-xs tracking-wider">SHARE DE AUDIENCIA</span>
              <span id="duel-pct-b" class="text-cyan-400">50%</span>
            </div>
            <div class="w-full h-4 sm:h-5 bg-slate-900 rounded-full overflow-hidden flex border border-[#162238] p-0.5">
              <div id="duel-bar-a" class="h-full bg-matrix rounded-l-full transition-all duration-500 shadow-matrix" style="width: 50%"></div>
              <div id="duel-bar-b" class="h-full bg-cyan-400 rounded-r-full transition-all duration-500 shadow-cyan-400" style="width: 50%"></div>
            </div>
          </div>

          <div class="flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-slate-500 pt-1 border-t border-[#162238]/60">
            <span id="duel-timestamp">--</span>
            <span class="text-slate-400">streamrank.ar</span>
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

  <!-- FOOTER -->
  <footer class="border-t border-[#162238] bg-[#050811] py-8 text-center text-xs text-slate-500 font-mono space-y-2.5">
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

    const getFallbackAvatar = (nombre) => {
      return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nombre) + '&background=0b1120&color=00ff66&bold=true';
    };

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

        document.getElementById('sync-clock').innerText = 'Sinc: ' + fechaArg + ' ART';

        renderizarHeroLeader();
        renderizarGrilla();
        renderizarEmergentes();
        poblarSelectoresDuelo();
        poblarSelectoresReportes();
      } catch (err) {
        console.error('Error al sincronizar datos:', err);
      }
    };

    const renderizarPlataformaBadge = (tipo, plat) => {
      let estilo = 'text-slate-500 border-[#162238] bg-black/30';
      let iconColor = 'text-slate-600';
      let valor = 'Offline';

      if (plat && plat.isLive) {
        if (tipo === 'yt') {
          estilo = 'text-red-400 border-red-500/40 bg-red-950/20';
          iconColor = 'text-[#FF0000]';
        } else if (tipo === 'tw') {
          estilo = 'text-purple-300 border-purple-500/40 bg-purple-950/20';
          iconColor = 'text-[#9146FF]';
        } else if (tipo === 'ki') {
          estilo = 'text-emerald-400 border-[#53FC18]/40 bg-emerald-950/20';
          iconColor = 'text-[#53FC18]';
        }
        valor = formatNum(plat.viewers);
      } else if (plat && !plat.active) {
        valor = 'N/A';
      }

      const svgIcon = document.getElementById('svg-' + tipo).outerHTML;

      return '<div class="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border ' + estilo + '">' +
        '<div class="w-3.5 h-3.5 ' + iconColor + '">' + svgIcon + '</div>' +
        '<span class="text-[11px] font-mono font-bold truncate">' + valor + '</span>' +
      '</div>';
    };

    const renderizarHeroLeader = () => {
      const container = document.getElementById('hero-leader');
      if (!canalesData.length) return;

      const lider = canalesData.find(c => c.isLive && !c.decoupled) || canalesData[0];
      const isLive = lider.isLive;

      let html = '<div class="relative w-full rounded-3xl bg-gradient-to-r from-[#0b1120] to-[#050811] border border-matrix/40 p-5 sm:p-8 shadow-matrix overflow-hidden">';
      html += '<div class="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-matrix/10 blur-3xl pointer-events-none"></div>';
      html += '<div class="flex flex-col lg:flex-row items-center gap-6 relative z-10">';

      html += '<div class="w-full lg:w-3/5 aspect-video rounded-2xl overflow-hidden bg-black/60 relative border border-[#162238] flex items-center justify-center">';
      if (lider.thumbnail) {
        html += '<img crossorigin="anonymous" onerror="this.onerror=null;this.src=\\'' + getFallbackAvatar(lider.name) + '\\'" src="' + lider.thumbnail + '" class="w-full h-full object-cover" alt="Líder">';
      } else {
        html += '<img crossorigin="anonymous" onerror="this.onerror=null;this.src=\\'' + getFallbackAvatar(lider.name) + '\\'" src="' + lider.avatar + '" class="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-matrix/40 object-cover shadow-matrixSoft" alt="Avatar">';
      }

      html += '<div class="absolute top-3 left-3 flex items-center space-x-2">';
      html += '<span class="px-2.5 sm:px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] sm:text-xs font-mono font-black text-matrix border border-matrix/40">#1 LÍDER ORGÁNICO</span>';
      if (isLive) {
        html += '<span class="px-2.5 sm:px-3 py-1 bg-matrix text-black font-black text-[10px] sm:text-xs rounded-lg tracking-wider animate-pulse shadow-matrix">EN VIVO</span>';
      }
      html += '</div></div>';

      html += '<div class="w-full lg:w-2/5 flex flex-col justify-between space-y-4">';
      html += '<div class="flex items-center space-x-3">';
      html += '<img crossorigin="anonymous" onerror="this.onerror=null;this.src=\\'' + getFallbackAvatar(lider.name) + '\\'" src="' + lider.avatar + '" class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-matrix object-cover shadow-matrixSoft flex-shrink-0">';
      html += '<div class="min-w-0">';
      html += '<h2 class="text-xl sm:text-2xl font-black text-white leading-tight truncate">' + lider.name + '</h2>';
      html += '<div class="flex flex-wrap items-center gap-1.5 mt-0.5">';
      html += '<span class="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-[#162238] text-slate-300">' + lider.category + '</span>';
      html += '<span class="text-[10px] sm:text-[11px] font-mono text-matrix truncate">' + lider.subtheme + '</span>';
      html += '</div></div></div>';

      html += '<p class="text-xs sm:text-sm text-slate-300 line-clamp-2 italic">"' + lider.title + '"</p>';

      html += '<div class="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-[#162238]">';
      html += '<div class="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Audiencia Concurrente Total</div>';
      html += '<div class="text-3xl sm:text-5xl font-black font-mono text-matrix matrix-glow mt-1">' + formatNum(lider.totalViewers) + '</div>';
      html += '<div class="text-xs text-slate-400 mt-0.5 font-mono">espectadores simultáneos</div>';
      html += '</div>';

      html += '<div class="grid grid-cols-3 gap-2">';
      html += renderizarPlataformaBadge('yt', lider.platforms.youtube);
      html += renderizarPlataformaBadge('tw', lider.platforms.twitch);
      html += renderizarPlataformaBadge('ki', lider.platforms.kick);
      html += '</div>';

      html += '<button onclick="abrirDueloConLeader()" class="w-full py-2.5 rounded-xl bg-matrix/10 hover:bg-matrix/20 border border-matrix/40 text-matrix text-xs font-black tracking-wider transition-all">';
      html += '⚡ RETAR EN DUELO 1 VS 1';
      html += '</button>';

      html += '</div></div></div>';
      container.innerHTML = html;
    };

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

      if (!filtrados.length) {
        container.innerHTML = '<div class="col-span-full py-16 text-center text-slate-500 font-mono text-xs sm:text-sm">No se encontraron canales con los filtros seleccionados.</div>';
        return;
      }

      let html = '';
      filtrados.forEach((c) => {
        const puestoGlobal = canalesData.findIndex(item => item.id === c.id) + 1;
        const isLive = c.isLive;
        const tieneBotAlert = c.botAlert === true;

        html += '<div class="rounded-2xl bg-[#0b1120] border ' + (tieneBotAlert ? 'border-amber-500/60 shadow-amber-950/40' : 'border-[#162238] hover:border-matrix/40 hover:shadow-matrixSoft') + ' transition-all duration-300 p-4 flex flex-col justify-between group">';

        html += '<div class="relative w-full aspect-video rounded-xl bg-black overflow-hidden mb-3 border border-[#162238]">';
        if (c.thumbnail) {
          html += '<img crossorigin="anonymous" onerror="this.onerror=null;this.src=\\'' + getFallbackAvatar(c.name) + '\\'" src="' + c.thumbnail + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="' + c.name + '">';
        } else {
          html += '<div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0b1120] to-black">';
          html += '<img crossorigin="anonymous" onerror="this.onerror=null;this.src=\\'' + getFallbackAvatar(c.name) + '\\'" src="' + c.avatar + '" class="w-12 h-12 rounded-full opacity-60 mb-2 object-cover border border-[#162238]">';
          html += '<span class="text-[10px] text-slate-500 font-mono tracking-widest">OFFLINE</span>';
          html += '</div>';
        }

        html += '<div class="absolute top-2 left-2 flex items-center space-x-1.5">';
        html += '<span class="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-mono font-black text-matrix border border-matrix/30">#' + puestoGlobal + '</span>';
        if (isLive) {
          html += '<span class="px-2 py-0.5 rounded-md bg-matrix text-black font-black text-[10px] tracking-wider animate-pulse">EN VIVO</span>';
        }
        html += '</div>';

        html += '<button onclick="abrirDueloCon(\\'' + c.id + '\\')" class="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/80 hover:bg-matrix hover:text-black transition-all text-matrix text-[10px] font-black border border-matrix/30 flex items-center space-x-1">';
        html += '<span>⚡</span><span>Comparar</span>';
        html += '</button>';

        html += '</div>';

        if (tieneBotAlert) {
          html += '<div class="mb-3 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/50 flex items-start space-x-2">';
          html += '<span class="text-amber-400 text-sm">⚠️</span>';
          html += '<div class="text-[10px] text-amber-200 leading-tight">';
          html += '<strong class="font-bold text-amber-300">Alerta de Tráfico No Orgánico:</strong> Métrica bajo auditoría heurística. Datos desacoplados del liderazgo general.';
          html += '</div></div>';
        }

        html += '<div class="flex items-start space-x-3 mb-3">';
        html += '<img crossorigin="anonymous" onerror="this.onerror=null;this.src=\\'' + getFallbackAvatar(c.name) + '\\'" src="' + c.avatar + '" class="w-10 h-10 rounded-full border border-slate-700 object-cover flex-shrink-0 mt-0.5">';
        html += '<div class="flex-1 min-w-0">';
        html += '<div class="flex items-center justify-between">';
        html += '<h3 class="text-sm font-bold text-white truncate">' + c.name + '</h3>';
        html += '<span class="text-[10px] text-slate-400 font-semibold">' + c.category + '</span>';
        html += '</div>';
        html += '<p class="text-[11px] text-matrix font-mono truncate">' + c.subtheme + '</p>';
        html += '<p class="text-xs text-slate-400 truncate mt-0.5">' + c.title + '</p>';
        html += '</div></div>';

        html += '<div class="flex items-end justify-between bg-black/30 rounded-xl p-2.5 mb-3 border border-[#162238]">';
        html += '<div><span class="text-[10px] uppercase font-mono text-slate-400">Total Viewers</span></div>';
        html += '<div class="text-xl font-black font-mono ' + (tieneBotAlert ? 'text-amber-400' : (isLive ? 'text-matrix matrix-glow' : 'text-slate-500')) + '">' + formatNum(c.totalViewers) + '</div>';
        html += '</div>';

        html += '<div class="grid grid-cols-3 gap-1.5">';
        html += renderizarPlataformaBadge('yt', c.platforms.youtube);
        html += renderizarPlataformaBadge('tw', c.platforms.twitch);
        html += renderizarPlataformaBadge('ki', c.platforms.kick);
        html += '</div>';

        html += '</div>';
      });

      container.innerHTML = html;
    };

    const renderizarEmergentes = () => {
      const container = document.getElementById('emerging-channels-grid');
      const emergentes = canalesData.filter(c => c.isEmerging);

      if (!emergentes.length) {
        container.innerHTML = '<div class="col-span-full text-slate-500 text-xs font-mono">No hay canales destacados en el radar actualmente.</div>';
        return;
      }

      let html = '';
      emergentes.forEach(c => {
        html += '<div class="p-3.5 rounded-xl bg-[#050811] border border-[#162238] flex items-center justify-between space-x-3">';
        html += '<div class="flex items-center space-x-3 min-w-0">';
        html += '<img crossorigin="anonymous" onerror="this.onerror=null;this.src=\\'' + getFallbackAvatar(c.name) + '\\'" src="' + c.avatar + '" class="w-10 h-10 rounded-full border border-matrix/30 object-cover flex-shrink-0">';
        html += '<div class="min-w-0">';
        html += '<h4 class="text-xs font-bold text-white truncate">' + c.name + '</h4>';
        html += '<p class="text-[10px] text-slate-400 truncate">' + c.subtheme + '</p>';
        html += '</div></div>';

        html += '<div class="text-right flex-shrink-0">';
        html += '<span class="text-xs font-mono font-bold ' + (c.isLive ? 'text-matrix' : 'text-slate-500') + '">' + formatNum(c.totalViewers) + '</span>';
        html += '<div class="text-[9px] font-mono ' + (c.isLive ? 'text-matrix' : 'text-slate-600') + '">' + (c.isLive ? 'EN VIVO' : 'OFFLINE') + '</div>';
        html += '</div></div>';
      });

      container.innerHTML = html;
    };

    // ========================================================================
    // LOGICA DE AUDITORÍA HISTÓRICA Y REPORTES CSV
    // ========================================================================
    const poblarSelectoresReportes = () => {
      const select = document.getElementById('report-channel-select');
      if (!select || !canalesData.length) return;

      const valorPrevio = select.value;
      let opts = '<option value="todos">Todos los Canales Monitoreados</option>';

      canalesData.forEach(c => {
        opts += '<option value="' + c.id + '">' + c.name + '</option>';
      });

      select.innerHTML = opts;
      if (valorPrevio) select.value = valorPrevio;
    };

    const abrirModalReportes = () => {
      document.getElementById('modal-reportes').classList.remove('hidden');
      ajustarFechasPeriodo(document.getElementById('report-period-select').value);
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

    const descargarCorteInstantaneo = () => {
      window.location.href = '/api/analytics/export';
    };

    const ejecutarDescargaReporte = () => {
      const canal = document.getElementById('report-channel-select').value;
      const from = document.getElementById('report-from-date').value;
      const to = document.getElementById('report-to-date').value;

      let url = '/api/analytics/historical?format=csv';
      if (canal) url += '&canal=' + encodeURIComponent(canal);
      if (from) url += '&from=' + encodeURIComponent(from);
      if (to) url += '&to=' + encodeURIComponent(to);

      window.location.href = url;
    };

    // ========================================================================
    // MODAL DE DUELO 1 VS 1 Y EXPORTACIÓN PNG CON HTML2CANVAS (1:1 CUADRADO)
    // ========================================================================
    const poblarSelectoresDuelo = () => {
      const selA = document.getElementById('duel-select-a');
      const selB = document.getElementById('duel-select-b');
      if (!selA || !selB || !canalesData.length) return;

      const prevA = selA.value;
      const prevB = selB.value;

      let opciones = '';
      canalesData.forEach(c => {
        opciones += '<option value="' + c.id + '">' + c.name + ' (' + formatNum(c.totalViewers) + ' viewers)</option>';
      });

      selA.innerHTML = opciones;
      selB.innerHTML = opciones;

      if (prevA && canalesData.some(c => c.id === prevA)) {
        selA.value = prevA;
      } else {
        selA.value = canalesData[0].id;
      }

      if (prevB && canalesData.some(c => c.id === prevB)) {
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
      const alternativo = canalesData.find(c => c.id !== canalId);
      if (alternativo) selB.value = alternativo.id;

      renderizarContenidoDuelo();
    };

    const abrirDueloConLeader = () => {
      if (canalesData.length) abrirDueloCon(canalesData[0].id);
    };

    const cerrarModalDuelo = () => {
      document.getElementById('modal-duel').classList.add('hidden');
    };

    const renderizarContenidoDuelo = () => {
      const idA = document.getElementById('duel-select-a').value;
      const idB = document.getElementById('duel-select-b').value;

      const canalA = canalesData.find(c => c.id === idA);
      const canalB = canalesData.find(c => c.id === idB);

      if (!canalA || !canalB) return;

      document.getElementById('duel-a-name').innerText = canalA.name;
      document.getElementById('duel-a-avatar').src = canalA.avatar;
      document.getElementById('duel-a-status').innerText = canalA.isLive ? '🔴 EN VIVO' : '⚫ OFFLINE';
      document.getElementById('duel-a-viewers').innerText = formatNum(canalA.totalViewers);

      document.getElementById('duel-b-name').innerText = canalB.name;
      document.getElementById('duel-b-avatar').src = canalB.avatar;
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

      document.getElementById('duel-timestamp').innerText = 'Captura: ' + fechaActual + ' ART';
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
  console.log(`[StreamRank ARG] Servidor ejecutándose en el puerto ${PORT}`);
});
