import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;

// ==========================================
// CANALES Y CONFIGURACIÓN INICIAL
// Avatares con proxies CORS abiertos (unavatar)
// ==========================================
const DEFAULT_CHANNELS = [
  // Entretenimiento / Medios
  {
    id: 'luzutv',
    name: 'LUZU TV',
    category: 'Entretenimiento',
    avatar: 'https://unavatar.io/youtube/LuzuTV',
    platforms: { yt: 'LuzuTV', tw: 'luzutv' }
  },
  {
    id: 'olga',
    name: 'OLGA',
    category: 'Entretenimiento',
    avatar: 'https://unavatar.io/youtube/olgaenvivo_',
    platforms: { yt: 'olgaenvivo_', tw: 'olgaenvivo' }
  },
  {
    id: 'somoslacasaok',
    name: 'La Casa Streaming',
    category: 'Entretenimiento',
    avatar: 'https://unavatar.io/youtube/somoslacasaok',
    platforms: { yt: 'somoslacasaok' }
  },
  {
    id: 'estoesblender',
    name: 'Blender',
    category: 'Entretenimiento',
    avatar: 'https://unavatar.io/youtube/estoesblender',
    platforms: { yt: 'estoesblender' }
  },
  {
    id: 'vorterix',
    name: 'Vorterix',
    category: 'Entretenimiento',
    avatar: 'https://unavatar.io/youtube/vorterixoficial',
    platforms: { yt: 'vorterixoficial', tw: 'vorterixoficial' }
  },
  {
    id: 'bondi_liveok',
    name: 'Bondi Live',
    category: 'Entretenimiento',
    avatar: 'https://unavatar.io/youtube/bondi_liveok',
    platforms: { yt: 'bondi_liveok' }
  },
  {
    id: 'telefe',
    name: 'Telefe',
    category: 'Entretenimiento',
    avatar: 'https://unavatar.io/youtube/telefe',
    platforms: { yt: 'telefe', tw: 'telefe' }
  },
  {
    id: 'eltrece',
    name: 'El Trece',
    category: 'Entretenimiento',
    avatar: 'https://unavatar.io/youtube/eltrece',
    platforms: { yt: 'eltrece' }
  },

  // Política / Noticias
  {
    id: 'todonoticias',
    name: 'TN (Todo Noticias)',
    category: 'Política',
    avatar: 'https://unavatar.io/youtube/todonoticias',
    platforms: { yt: 'todonoticias' }
  },
  {
    id: 'lanacionmas',
    name: 'La Nación+',
    category: 'Política',
    avatar: 'https://unavatar.io/youtube/lanacionmas',
    platforms: { yt: 'lanacionmas' }
  },
  {
    id: 'c5n',
    name: 'C5N',
    category: 'Política',
    avatar: 'https://unavatar.io/youtube/c5n',
    platforms: { yt: 'c5n' }
  },
  {
    id: 'cronicatv',
    name: 'Crónica TV',
    category: 'Política',
    avatar: 'https://unavatar.io/youtube/cronicatv',
    platforms: { yt: 'cronicatv' }
  },
  {
    id: 'somosgelatina',
    name: 'Gelatina',
    category: 'Política',
    avatar: 'https://unavatar.io/youtube/somosgelatina',
    platforms: { yt: 'somosgelatina', tw: 'somosgelatina' }
  },
  {
    id: 'carajostream',
    name: 'Carajo Stream',
    category: 'Política',
    avatar: 'https://unavatar.io/youtube/carajostream',
    platforms: { yt: 'carajostream' }
  },
  {
    id: 'neuramedia',
    name: 'Neura Media',
    category: 'Política',
    avatar: 'https://unavatar.io/youtube/neuramedia',
    platforms: { yt: 'neuramedia', tw: 'neuramedia' }
  },

  // Deportes
  {
    id: 'flavioazzaro',
    name: 'Flavio Azzaro / AZZ',
    category: 'Deportes',
    avatar: 'https://unavatar.io/youtube/FlavioAzzaroOficial',
    platforms: { yt: 'FlavioAzzaroOficial' }
  },
  {
    id: 'dsportsradio',
    name: 'DSPORTS Radio',
    category: 'Deportes',
    avatar: 'https://unavatar.io/youtube/dsportsradio',
    platforms: { yt: 'dsportsradio' }
  },
  {
    id: 'tycsports',
    name: 'TyC Sports',
    category: 'Deportes',
    avatar: 'https://unavatar.io/youtube/tycsports',
    platforms: { yt: 'tycsports' }
  },

  // Streamers
  {
    id: 'coscu',
    name: 'Coscu',
    category: 'Streamers',
    avatar: 'https://unavatar.io/twitch/coscu',
    platforms: { tw: 'coscu', ki: 'coscu', yt: 'Coscu' }
  },
  {
    id: 'spreen',
    name: 'Spreen',
    category: 'Streamers',
    avatar: 'https://unavatar.io/twitch/elspreen',
    platforms: { tw: 'elspreen', ki: 'spreen', yt: 'SpreenDMC' }
  },
  {
    id: 'davooxeneize',
    name: 'Davoo Xeneize',
    category: 'Streamers',
    avatar: 'https://unavatar.io/twitch/davooxeneize',
    platforms: { tw: 'davooxeneize', ki: 'davooxeneize' }
  },
  {
    id: 'lacobraaa',
    name: 'La Cobra',
    category: 'Streamers',
    avatar: 'https://unavatar.io/twitch/lacobraaa',
    platforms: { tw: 'lacobraaa', ki: 'lacobraaa' }
  },
  {
    id: 'luquitasrodriguez',
    name: 'Luquitas Rodríguez',
    category: 'Streamers',
    avatar: 'https://unavatar.io/twitch/luquitasrodriguez',
    platforms: { tw: 'luquitasrodriguez' }
  }
];

// Cache global en memoria
let telemetriaCache = [];
let ultimaActualizacion = null;
let estaScrapeando = false;

// ==========================================
// CLIENTES DE TELEMETRÍA (SCRAPING SEGURO)
// ==========================================

const fetchWithTimeout = async (url, options = {}, timeoutMs = 1500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

// YouTube Live Scraper
const scrapeYouTube = async (handle) => {
  if (!handle) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const url = `https://www.youtube.com/@${handle}/live`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
        }
      },
      1500
    );

    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    const html = await res.text();

    const isLiveRegex = /"isLive":\s*true/;
    const isUpcomingRegex = /"status":\s*"UPCOMING"/;
    const isLive = isLiveRegex.test(html) && !isUpcomingRegex.test(html);

    if (!isLive) {
      return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    }

    let viewers = 0;
    const concurrentMatch = html.match(/"concurrentViewers":\s*"(\d+)"/);
    const simpleViewMatch = html.match(/"originalViewCount":\s*"(\d+)"/);
    const viewMatch = html.match(/"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);

    if (concurrentMatch) {
      viewers = parseInt(concurrentMatch[1], 10) || 0;
    } else if (simpleViewMatch) {
      viewers = parseInt(simpleViewMatch[1], 10) || 0;
    } else if (viewMatch && viewMatch[1]) {
      const cleanNum = viewMatch[1].replace(/[^0-9]/g, '');
      viewers = parseInt(cleanNum, 10) || 0;
    }

    let videoId = '';
    const videoIdMatch = html.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
    if (videoIdMatch) {
      videoId = videoIdMatch[1];
    }

    let title = '';
    const titleMatch = html.match(/"title":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
    if (titleMatch) {
      title = titleMatch[1];
    }

    const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

    return {
      isLive: true,
      viewers,
      title: title || 'Transmisión en directo',
      thumbnail
    };
  } catch (err) {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
};

// Twitch GQL Scraper
const scrapeTwitch = async (login) => {
  if (!login) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const res = await fetchWithTimeout(
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
      1500
    );

    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    const data = await res.json();
    const stream = data?.data?.user?.stream;

    if (stream) {
      return {
        isLive: true,
        viewers: stream.viewersCount || 0,
        title: stream.title || 'Transmisión de Twitch',
        thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login.toLowerCase()}-640x360.jpg`
      };
    }
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  } catch (err) {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
};

// Kick API v2 Scraper
const scrapeKick = async (slug) => {
  if (!slug) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const res = await fetchWithTimeout(
      `https://kick.com/api/v2/channels/${slug}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json'
        }
      },
      1500
    );

    if (!res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    const data = await res.json();
    const isLive = data?.livestream?.is_live === true;

    if (isLive) {
      return {
        isLive: true,
        viewers: data.livestream.viewer_count || 0,
        title: data.livestream.session_title || 'En vivo en Kick',
        thumbnail: data.livestream.thumbnail?.url || ''
      };
    }
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  } catch (err) {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
};

// ==========================================
// ORQUESTADOR DE RASTREO SECUENCIAL (ANTI 429)
// ==========================================
const actualizarTelemetria = async () => {
  if (estaScrapeando) return;
  estaScrapeando = true;

  try {
    const resultados = [];

    // Procesamiento canal por canal de forma secuencial con pausa de 120 ms
    for (const canal of DEFAULT_CHANNELS) {
      try {
        const [ytRes, twRes, kiRes] = await Promise.all([
          canal.platforms.yt ? scrapeYouTube(canal.platforms.yt) : Promise.resolve({ isLive: false, viewers: 0 }),
          canal.platforms.tw ? scrapeTwitch(canal.platforms.tw) : Promise.resolve({ isLive: false, viewers: 0 }),
          canal.platforms.ki ? scrapeKick(canal.platforms.ki) : Promise.resolve({ isLive: false, viewers: 0 })
        ]);

        const isLive = ytRes.isLive || twRes.isLive || kiRes.isLive;
        const totalViewers = (ytRes.viewers || 0) + (twRes.viewers || 0) + (kiRes.viewers || 0);

        let thumbnail = ytRes.thumbnail || twRes.thumbnail || kiRes.thumbnail || '';
        let title = ytRes.title || twRes.title || kiRes.title || (isLive ? 'Transmitiendo en vivo' : 'Canal fuera de línea');

        resultados.push({
          id: canal.id,
          name: canal.name,
          category: canal.category,
          avatar: canal.avatar,
          isLive,
          totalViewers,
          title,
          thumbnail,
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
        });
      } catch (canalErr) {
        console.error(`Error procesando canal ${canal.id}:`, canalErr);
      }

      // Pausa segura de 120 ms para evitar rate-limiting y bloqueos por IP compartida
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    // Ordenar: primero los que están en vivo con mayor audiencia, luego los offline
    resultados.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return b.totalViewers - a.totalViewers;
    });

    telemetriaCache = resultados;
    ultimaActualizacion = new Date().toISOString();
  } catch (error) {
    console.error('Error durante la actualización de telemetría:', error);
  } finally {
    estaScrapeando = false;
  }
};

// Iniciar scrapeo inicial y ciclo periódico de 25 segundos
actualizarTelemetria();
setInterval(actualizarTelemetria, 25000);

// ==========================================
// ENDPOINTS DE API
// ==========================================

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/ranks', (req, res) => {
  res.json({
    updatedAt: ultimaActualizacion,
    totalChannels: telemetriaCache.length,
    liveChannels: telemetriaCache.filter((c) => c.isLive).length,
    totalAudience: telemetriaCache.reduce((acc, c) => acc + c.totalViewers, 0),
    data: telemetriaCache
  });
});

app.get('/api/analytics/export', (req, res) => {
  const encabezados = ['Canal', 'Categoria', 'Espectadores_Totales', 'En_Vivo', 'Twitch', 'Kick', 'YouTube', 'Timestamp'];
  const filas = telemetriaCache.map((c) => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.category}"`,
    c.totalViewers,
    c.isLive ? 'SI' : 'NO',
    c.platforms.twitch.viewers || 0,
    c.platforms.kick.viewers || 0,
    c.platforms.youtube.viewers || 0,
    `"${c.timestamp}"`
  ]);

  const csvContenido = [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="streamrank_arg_${Date.now()}.csv"`);
  res.status(200).send(csvContenido);
});

// ==========================================
// FRONTEND SERVIDO EN GET /
// ==========================================
const HTML_BODY = `
<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StreamRank ARG | Monitor de Streaming en Vivo</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- html2canvas con soporte CORS -->
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
            glow: '0 0 30px rgba(0, 255, 102, 0.3)'
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #050811;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    .matrix-glow {
      text-shadow: 0 0 8px rgba(0, 255, 102, 0.6), 0 0 18px rgba(0, 255, 102, 0.3);
    }
    .matrix-badge {
      box-shadow: 0 0 10px rgba(0, 255, 102, 0.4);
    }
    .custom-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: #1e293b;
      border-radius: 4px;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-[#050811] text-slate-100 antialiased selection:bg-[#00ff66] selection:text-black">

  <!-- BARRA SUPERIOR / HEADER -->
  <header class="sticky top-0 z-40 bg-[#050811]/90 backdrop-blur-md border-b border-[#162238]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      
      <!-- LOGO & PULSO -->
      <div class="flex items-center space-x-3">
        <div class="relative flex items-center justify-center w-10 h-10 rounded-xl bg-black border border-matrix/40 shadow-matrixSoft">
          <span class="absolute w-3 h-3 rounded-full bg-matrix animate-ping opacity-75"></span>
          <span class="w-3 h-3 rounded-full bg-matrix"></span>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xl font-extrabold tracking-wider text-white">STREAMRANK</span>
            <span class="text-xs px-2 py-0.5 rounded font-black tracking-widest bg-matrix/20 text-matrix border border-matrix/30">ARG</span>
          </div>
          <p class="text-xs text-slate-400">Monitor en vivo de canales de Argentina</p>
        </div>
      </div>

      <!-- STATUS & ACCIONES -->
      <div class="flex items-center space-x-4">
        <div class="hidden md:flex items-center bg-[#0b1120] border border-[#162238] rounded-xl px-4 py-2 space-x-4">
          <div class="flex items-center space-x-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-matrix shadow-matrix"></span>
            <span class="text-xs font-semibold text-slate-300"><span id="stat-live-count" class="text-matrix font-bold">0</span> En Vivo</span>
          </div>
          <div class="w-px h-4 bg-slate-700"></div>
          <div class="text-xs text-slate-400">
            Público: <span id="stat-total-viewers" class="text-white font-mono font-bold">0</span>
          </div>
          <div class="w-px h-4 bg-slate-700"></div>
          <div class="text-[11px] font-mono text-slate-400" id="sync-clock">
            Sinc: --:--:--
          </div>
        </div>

        <a href="/api/analytics/export" class="inline-flex items-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-matrix rounded-xl hover:bg-emerald-400 transition-all shadow-matrix hover:shadow-glow">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Exportar CSV
        </a>
      </div>
    </div>
  </header>

  <!-- CONTENIDO PRINCIPAL -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    
    <!-- HERO / CANAL #1 DESTACADO -->
    <section id="hero-leader" class="w-full">
      <div class="w-full h-72 rounded-2xl bg-[#0b1120] border border-[#162238] animate-pulse flex items-center justify-center text-slate-500">
        Cargando líder de audiencia...
      </div>
    </section>

    <!-- BARRA DE FILTROS POR CATEGORÍA -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#162238] pb-4">
      <div class="flex flex-wrap gap-2" id="filter-buttons">
        <button onclick="setFilter('Todos')" class="cat-btn active px-4 py-2 rounded-xl text-xs font-bold transition-all bg-matrix text-black shadow-matrix">
          🔥 Todos
        </button>
        <button onclick="setFilter('Entretenimiento')" class="cat-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50">
          🎭 Entretenimiento
        </button>
        <button onclick="setFilter('Política')" class="cat-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50">
          🏛️ Política
        </button>
        <button onclick="setFilter('Deportes')" class="cat-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50">
          ⚽ Deportes
        </button>
        <button onclick="setFilter('Streamers')" class="cat-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50">
          🎮 Streamers
        </button>
      </div>

      <div class="text-xs text-slate-400 font-mono">
        Ordenado por espectadores concurrentes
      </div>
    </div>

    <!-- GRILLA COMPLETA DE CANALES -->
    <section>
      <div id="channels-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      </div>
    </section>
  </main>

  <!-- MODAL DUELO 1 VS 1 -->
  <div id="modal-duel" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md hidden p-4">
    <div class="bg-[#0b1120] border border-[#162238] rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative overflow-hidden">
      
      <!-- Encabezado Modal -->
      <div class="flex items-center justify-between pb-4 border-b border-[#162238]">
        <div class="flex items-center space-x-2">
          <span class="text-matrix font-extrabold text-lg">⚡ DUELO 1 VS 1</span>
          <span class="text-xs text-slate-400">Comparativa en directo</span>
        </div>
        <button onclick="closeDuelModal()" class="text-slate-400 hover:text-white transition-colors text-2xl font-bold">&times;</button>
      </div>

      <!-- Selectores de Canales -->
      <div class="grid grid-cols-2 gap-4 my-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">CANAL A</label>
          <select id="duel-select-a" onchange="renderDuelContent()" class="w-full bg-[#050811] border border-[#162238] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-matrix">
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">CANAL B</label>
          <select id="duel-select-b" onchange="renderDuelContent()" class="w-full bg-[#050811] border border-[#162238] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-matrix">
          </select>
        </div>
      </div>

      <!-- PLACA DE DUELO (ÁREA A EXPORTAR EN PNG) -->
      <div id="duel-capture-card" class="bg-[#050811] border border-matrix/30 rounded-2xl p-6 shadow-glow relative my-4">
        <div class="text-center mb-4">
          <span class="text-[10px] font-black tracking-widest uppercase bg-matrix/10 text-matrix px-3 py-1 rounded-full border border-matrix/30">STREAMRANK ARG • TELEMETRÍA EN DIRECTO</span>
        </div>

        <div class="grid grid-cols-2 gap-4 items-center">
          
          <!-- Canal A Card -->
          <div class="text-center p-4 rounded-xl bg-[#0b1120]/80 border border-[#162238]">
            <img id="duel-a-avatar" crossorigin="anonymous" src="" class="w-16 h-16 rounded-full mx-auto border-2 border-matrix object-cover shadow-matrixSoft mb-2" alt="A">
            <h3 id="duel-a-name" class="font-extrabold text-white text-base truncate">--</h3>
            <p id="duel-a-status" class="text-xs font-mono text-slate-400 mb-2">OFFLINE</p>
            <div id="duel-a-viewers" class="text-2xl font-black font-mono text-matrix matrix-glow">0</div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider">Espectadores</div>
          </div>

          <!-- Canal B Card -->
          <div class="text-center p-4 rounded-xl bg-[#0b1120]/80 border border-[#162238]">
            <img id="duel-b-avatar" crossorigin="anonymous" src="" class="w-16 h-16 rounded-full mx-auto border-2 border-cyan-400 object-cover shadow-cyan-500/50 mb-2" alt="B">
            <h3 id="duel-b-name" class="font-extrabold text-white text-base truncate">--</h3>
            <p id="duel-b-status" class="text-xs font-mono text-slate-400 mb-2">OFFLINE</p>
            <div id="duel-b-viewers" class="text-2xl font-black font-mono text-cyan-400">0</div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider">Espectadores</div>
          </div>
        </div>

        <!-- BARRAS DE PORCENTAJE ENFRENTADAS -->
        <div class="mt-6">
          <div class="flex justify-between text-xs font-mono font-bold mb-1">
            <span id="duel-pct-a" class="text-matrix">50%</span>
            <span class="text-slate-500">SHARE CONJUNTO</span>
            <span id="duel-pct-b" class="text-cyan-400">50%</span>
          </div>
          <div class="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex border border-[#162238]">
            <div id="duel-bar-a" class="h-full bg-matrix transition-all duration-500 shadow-matrix" style="width: 50%"></div>
            <div id="duel-bar-b" class="h-full bg-cyan-400 transition-all duration-500 shadow-cyan-400" style="width: 50%"></div>
          </div>
        </div>

        <div class="mt-4 text-center">
          <span class="text-[10px] font-mono text-slate-500" id="duel-timestamp">--</span>
        </div>
      </div>

      <!-- Acciones Modal -->
      <div class="flex items-center justify-end space-x-3 pt-4 border-t border-[#162238]">
        <button onclick="closeDuelModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">
          Cerrar
        </button>
        <button onclick="downloadDuelPNG()" class="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-matrix text-black hover:bg-emerald-400 transition-all shadow-matrix flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Descargar Placa HD (PNG)
        </button>
      </div>

    </div>
  </div>

  <!-- ICONOS SVG PLATAFORMAS -->
  <div class="hidden">
    <!-- YouTube SVG -->
    <svg id="svg-yt" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
    <!-- Twitch SVG -->
    <svg id="svg-tw" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
    <!-- Kick SVG -->
    <svg id="svg-ki" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.333 0h8v5.333H6.667v2.667h2.666v2.667H6.667v2.666h2.666V16H6.667v2.667h2.666V24h-8zm13.334 8h2.666v2.667h-2.666zm2.666 2.667h2.667v2.666h-2.667zm2.667 2.666h2.667V16H20zm-2.667 2.667h2.667v2.667h-2.667zm-2.667 2.667h2.667V24h-2.667zm0-10.667h2.667V5.333h-2.667zm2.667-2.667h2.667V2.667H17.333zm2.667-2.666H22.667V0H20z"/>
    </svg>
  </div>

  <!-- LOGICA JS CLIENTE -->
  <script>
    let canalesData = [];
    let categoriaActiva = 'Todos';

    const formatNum = (num) => new Intl.NumberFormat('es-AR').format(num || 0);

    const setFilter = (cat) => {
      categoriaActiva = cat;
      document.querySelectorAll('.cat-btn').forEach(btn => {
        if (btn.innerText.includes(cat)) {
          btn.className = 'cat-btn active px-4 py-2 rounded-xl text-xs font-bold transition-all bg-matrix text-black shadow-matrix';
        } else {
          btn.className = 'cat-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#0b1120] text-slate-300 border border-[#162238] hover:border-matrix/50';
        }
      });
      renderGrid();
    };

    const fetchRanks = async () => {
      try {
        const res = await fetch('/api/ranks');
        const json = await res.json();
        canalesData = json.data || [];
        
        document.getElementById('stat-live-count').innerText = json.liveChannels || 0;
        document.getElementById('stat-total-viewers').innerText = formatNum(json.totalAudience);
        
        const now = new Date();
        document.getElementById('sync-clock').innerText = 'Sinc: ' + now.toTimeString().split(' ')[0];

        renderHeroLeader();
        renderGrid();
        populateDuelSelectors();
      } catch (err) {
        console.error('Error al consultar /api/ranks:', err);
      }
    };

    const renderHeroLeader = () => {
      const container = document.getElementById('hero-leader');
      if (!canalesData.length) return;

      const leader = canalesData[0];
      const isLive = leader.isLive;
      
      let html = '<div class="relative w-full rounded-3xl bg-gradient-to-r from-[#0b1120] to-[#050811] border border-matrix/40 p-6 md:p-8 shadow-matrix overflow-hidden">';
      html += '<div class="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-matrix/10 blur-3xl pointer-events-none"></div>';
      html += '<div class="flex flex-col lg:flex-row items-center gap-6 relative z-10">';
      
      // Thumbnail 16:9
      html += '<div class="w-full lg:w-3/5 aspect-video rounded-2xl overflow-hidden bg-black/60 relative border border-[#162238] flex items-center justify-center">';
      if (leader.thumbnail) {
        html += '<img crossorigin="anonymous" src="' + leader.thumbnail + '" class="w-full h-full object-cover" alt="Stream Leader">';
      } else {
        html += '<img crossorigin="anonymous" src="' + leader.avatar + '" class="w-24 h-24 rounded-full border border-matrix/30 object-cover" alt="Avatar">';
      }
      
      html += '<div class="absolute top-3 left-3 flex items-center space-x-2">';
      html += '<span class="px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg text-xs font-mono font-black text-matrix border border-matrix/40">#1 LÍDER ARGENTINA</span>';
      if (isLive) {
        html += '<span class="px-3 py-1 bg-matrix text-black font-black text-xs rounded-lg tracking-wider animate-pulse shadow-matrix">EN VIVO</span>';
      }
      html += '</div></div>';

      // Información del Canal
      html += '<div class="w-full lg:w-2/5 flex flex-col justify-between space-y-4">';
      html += '<div class="flex items-center space-x-3">';
      html += '<img crossorigin="anonymous" src="' + leader.avatar + '" class="w-14 h-14 rounded-full border-2 border-matrix object-cover shadow-matrixSoft">';
      html += '<div>';
      html += '<h2 class="text-2xl font-black text-white leading-tight">' + leader.name + '</h2>';
      html += '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#162238] text-slate-300">' + leader.category + '</span>';
      html += '</div></div>';

      html += '<p class="text-sm text-slate-300 line-clamp-2 italic font-sans">"' + leader.title + '"</p>';

      html += '<div class="p-4 rounded-xl bg-black/40 border border-[#162238]">';
      html += '<div class="text-[11px] font-mono text-slate-400 uppercase tracking-widest">Audiencia Concurrente Total</div>';
      html += '<div class="text-4xl md:text-5xl font-black font-mono text-matrix matrix-glow mt-1">' + formatNum(leader.totalViewers) + '</div>';
      html += '<div class="text-xs text-slate-400 mt-1 font-mono">espectadores en simultáneo</div>';
      html += '</div>';

      // Desglose plataformas
      html += '<div class="grid grid-cols-3 gap-2">';
      html += renderPlatformBadge('yt', leader.platforms.youtube);
      html += renderPlatformBadge('tw', leader.platforms.twitch);
      html += renderPlatformBadge('ki', leader.platforms.kick);
      html += '</div>';

      html += '<button onclick="openDuelModalWithLeader()" class="w-full py-2.5 rounded-xl bg-matrix/10 hover:bg-matrix/20 border border-matrix/30 text-matrix text-xs font-black tracking-wider transition-all">';
      html += '⚡ RETAR EN DUELO 1 VS 1';
      html += '</button>';

      html += '</div></div></div>';

      container.innerHTML = html;
    };

    const renderPlatformBadge = (type, plat) => {
      let color = 'text-slate-500 border-[#162238] bg-black/20';
      let iconColor = 'text-slate-600';
      let label = 'Offline';
      
      if (plat && plat.isLive) {
        if (type === 'yt') {
          color = 'text-red-400 border-red-500/40 bg-red-950/20';
          iconColor = 'text-[#FF0000]';
        }
        if (type === 'tw') {
          color = 'text-purple-300 border-purple-500/40 bg-purple-950/20';
          iconColor = 'text-[#9146FF]';
        }
        if (type === 'ki') {
          color = 'text-emerald-400 border-[#53FC18]/40 bg-emerald-950/20';
          iconColor = 'text-[#53FC18]';
        }
        label = formatNum(plat.viewers);
      } else if (plat && !plat.active) {
        label = 'N/A';
      }

      const svgHtml = document.getElementById('svg-' + type).outerHTML;

      return '<div class="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border ' + color + '">' +
        '<div class="w-3.5 h-3.5 ' + iconColor + '">' + svgHtml + '</div>' +
        '<span class="text-[11px] font-mono font-bold truncate">' + label + '</span>' +
      '</div>';
    };

    const renderGrid = () => {
      const container = document.getElementById('channels-grid');
      const filtrados = categoriaActiva === 'Todos' 
        ? canalesData 
        : canalesData.filter(c => c.category === categoriaActiva);

      if (!filtrados.length) {
        container.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500 font-mono">No hay canales para la categoría seleccionada.</div>';
        return;
      }

      let html = '';
      filtrados.forEach((c, index) => {
        const globalRank = canalesData.findIndex(item => item.id === c.id) + 1;
        const isLive = c.isLive;

        html += '<div class="rounded-2xl bg-[#0b1120] border border-[#162238] hover:border-matrix/40 transition-all duration-300 p-4 flex flex-col justify-between group hover:shadow-matrixSoft">';
        
        // Miniatura
        html += '<div class="relative w-full aspect-video rounded-xl bg-black overflow-hidden mb-3 border border-[#162238]">';
        if (c.thumbnail) {
          html += '<img crossorigin="anonymous" src="' + c.thumbnail + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="' + c.name + '">';
        } else {
          html += '<div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0b1120] to-black">';
          html += '<img crossorigin="anonymous" src="' + c.avatar + '" class="w-12 h-12 rounded-full opacity-60 mb-2 object-cover">';
          html += '<span class="text-[10px] text-slate-500 font-mono">OFFLINE</span>';
          html += '</div>';
        }

        // Badges sobre imagen
        html += '<div class="absolute top-2 left-2 flex items-center space-x-1.5">';
        html += '<span class="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-mono font-black text-matrix border border-matrix/30">#' + globalRank + '</span>';
        if (isLive) {
          html += '<span class="px-2 py-0.5 rounded-md bg-matrix text-black font-black text-[10px] tracking-wider animate-pulse">VIVO</span>';
        }
        html += '</div>';

        html += '<button onclick="openDuelModalWith(\\'' + c.id + '\\')" class="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/80 hover:bg-matrix hover:text-black transition-all text-matrix text-[10px] font-black border border-matrix/30">';
        html += 'VS';
        html += '</button>';

        html += '</div>';

        // Título e info
        html += '<div class="flex items-start space-x-3 mb-3">';
        html += '<img crossorigin="anonymous" src="' + c.avatar + '" class="w-10 h-10 rounded-full border border-slate-700 object-cover flex-shrink-0 mt-0.5">';
        html += '<div class="flex-1 min-w-0">';
        html += '<div class="flex items-center justify-between">';
        html += '<h3 class="text-sm font-bold text-white truncate">' + c.name + '</h3>';
        html += '<span class="text-[10px] text-slate-400 font-semibold">' + c.category + '</span>';
        html += '</div>';
        html += '<p class="text-xs text-slate-400 truncate mt-0.5">' + c.title + '</p>';
        html += '</div></div>';

        // Conteo total de espectadores
        html += '<div class="flex items-end justify-between bg-black/30 rounded-xl p-2.5 mb-3 border border-[#162238]">';
        html += '<div><span class="text-[10px] uppercase font-mono text-slate-400">Total Viewers</span></div>';
        html += '<div class="text-lg font-black font-mono ' + (isLive ? 'text-matrix matrix-glow' : 'text-slate-500') + '">' + formatNum(c.totalViewers) + '</div>';
        html += '</div>';

        // Desglose plataformas
        html += '<div class="grid grid-cols-3 gap-1.5">';
        html += renderPlatformBadge('yt', c.platforms.youtube);
        html += renderPlatformBadge('tw', c.platforms.twitch);
        html += renderPlatformBadge('ki', c.platforms.kick);
        html += '</div>';

        html += '</div>';
      });

      container.innerHTML = html;
    };

    // ==========================================
    // LOGICA MODAL DUELO 1 VS 1
    // ==========================================
    const populateDuelSelectors = () => {
      const selA = document.getElementById('duel-select-a');
      const selB = document.getElementById('duel-select-b');
      if (!selA || !selB || !canalesData.length) return;

      const prevA = selA.value;
      const prevB = selB.value;

      let opts = '';
      canalesData.forEach(c => {
        opts += '<option value="' + c.id + '">' + c.name + ' (' + formatNum(c.totalViewers) + ' viewers)</option>';
      });

      selA.innerHTML = opts;
      selB.innerHTML = opts;

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

      renderDuelContent();
    };

    const openDuelModalWith = (channelId) => {
      document.getElementById('modal-duel').classList.remove('hidden');
      const selA = document.getElementById('duel-select-a');
      const selB = document.getElementById('duel-select-b');
      
      selA.value = channelId;
      if (canalesData.length > 1) {
        const alt = canalesData.find(c => c.id !== channelId);
        if (alt) selB.value = alt.id;
      }
      renderDuelContent();
    };

    const openDuelModalWithLeader = () => {
      if (canalesData.length) openDuelModalWith(canalesData[0].id);
    };

    const closeDuelModal = () => {
      document.getElementById('modal-duel').classList.add('hidden');
    };

    const renderDuelContent = () => {
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

      const totalAud = (canalA.totalViewers || 0) + (canalB.totalViewers || 0);
      let pctA = 50;
      let pctB = 50;

      if (totalAud > 0) {
        pctA = Math.round((canalA.totalViewers / totalAud) * 100);
        pctB = 100 - pctA;
      }

      document.getElementById('duel-pct-a').innerText = pctA + '%';
      document.getElementById('duel-pct-b').innerText = pctB + '%';

      document.getElementById('duel-bar-a').style.width = pctA + '%';
      document.getElementById('duel-bar-b').style.width = pctB + '%';

      document.getElementById('duel-timestamp').innerText = 'Captura en tiempo real: ' + new Date().toLocaleString('es-AR');
    };

    const downloadDuelPNG = async () => {
      const card = document.getElementById('duel-capture-card');
      try {
        const canvas = await html2canvas(card, {
          backgroundColor: '#050811',
          scale: 2,
          useCORS: true,
          allowTaint: false
        });
        const img = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = img;
        a.download = 'streamrank_duelo_' + Date.now() + '.png';
        a.click();
      } catch (e) {
        console.error('Error al generar canvas:', e);
        alert('Error al generar la imagen HD.');
      }
    };

    // Polling automático cada 20 segundos
    fetchRanks();
    setInterval(fetchRanks, 20000);
  </script>
</body>
</html>
`;

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(HTML_BODY);
});

// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`[StreamRank ARG] Servidor activo en http://localhost:${PORT}`);
});
