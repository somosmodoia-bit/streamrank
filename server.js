import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).send('OK'));

// MAPA DE CATEGORÍAS (backend <-> frontend match 1:1)
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

// LISTADO MAESTRO DE CANALES
const CANALES = [
  // 1. Entretenimiento
  { id: 'luzutv', nombre: 'LUZU TV', categoria: 'entretenimiento', ytHandle: '@luzutv', twitchUser: 'luzutv' },
  { id: 'olga', nombre: 'OLGA', categoria: 'entretenimiento', ytHandle: '@olgaenvivo_', twitchUser: 'olgaenvivo' },
  { id: 'blender', nombre: 'Blender', categoria: 'entretenimiento', ytHandle: '@somosblender', twitchUser: 'somosblender' },
  { id: 'gelatina', nombre: 'Gelatina', categoria: 'entretenimiento', ytHandle: '@somosgelatina', twitchUser: 'somosgelatina' },
  { id: 'vorterix', nombre: 'Vorterix', categoria: 'entretenimiento', ytHandle: '@vorterixoficial', twitchUser: 'vorterixoficial' },
  { id: 'bondilive', nombre: 'Bondi Live', categoria: 'entretenimiento', ytHandle: '@bondi_liveok' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', categoria: 'entretenimiento', ytHandle: '@lacasastreaming' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', categoria: 'entretenimiento', ytHandle: '@unpocoderuido_' },
  { id: 'republicaz', nombre: 'República Z', categoria: 'entretenimiento', ytHandle: '@republicaz' },
  { id: 'posdata', nombre: 'Posdata', categoria: 'entretenimiento', ytHandle: '@posdatastream' },
  { id: 'dgo', nombre: 'DGO en Vivo', categoria: 'entretenimiento', ytHandle: '@DGO_Latam' },
  { id: 'telefe', nombre: 'Telefe Streams', categoria: 'entretenimiento', ytHandle: '@telefe' },
  { id: 'eltrece', nombre: 'eltrece', categoria: 'entretenimiento', ytHandle: '@eltrece' },
  { id: 'americatv', nombre: 'América TV', categoria: 'entretenimiento', ytHandle: '@americatv' },
  { id: 'urbanaplay', nombre: 'Urbana Play', categoria: 'entretenimiento', ytHandle: '@UrbanaPlayFM', twitchUser: 'urbanaplayfm' },

  // 2. Deportes
  { id: 'programa412', nombre: '412 Fútbol (Davoo & Cobra)', categoria: 'deportes', ytHandle: '@412futbol' },
  { id: 'azzstream', nombre: 'AZZ Stream (Azzaro)', categoria: 'deportes', ytHandle: '@azzstream' },
  { id: 'picadotv', nombre: 'Picado TV', categoria: 'deportes', ytHandle: '@picadotv' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', categoria: 'deportes', ytHandle: '@pablocarrozza' },
  { id: 'tycsports', nombre: 'TyC Sports', categoria: 'deportes', ytHandle: '@TyCSportsOficial' },
  { id: 'dsports', nombre: 'DSports', categoria: 'deportes', ytHandle: '@DSports' },
  { id: 'espnarg', nombre: 'ESPN Argentina', categoria: 'deportes', ytHandle: '@espnargentina' },
  { id: 'tntsportsarg', nombre: 'TNT Sports Argentina', categoria: 'deportes', ytHandle: '@TNTSportsAR' },

  // 3. Streamers
  { id: 'davoo', nombre: 'Davoo Xeneize', categoria: 'streamers', ytHandle: '@davooxeneize', twitchUser: 'davooxeneize', kickUser: 'davooxeneize' },
  { id: 'lacobra', nombre: 'La Cobra', categoria: 'streamers', ytHandle: '@lacobraaa', twitchUser: 'lacobraaa', kickUser: 'lacobraaa' },
  { id: 'spreen', nombre: 'Spreen', categoria: 'streamers', ytHandle: '@spreen', twitchUser: 'spreen', kickUser: 'spreen' },
  { id: 'luquitas', nombre: 'Luquitas Rodríguez', categoria: 'streamers', ytHandle: '@luquitasrodriguez', twitchUser: 'luquitasrodriguez' },
  { id: 'martincirio', nombre: 'Martín Cirio', categoria: 'streamers', ytHandle: '@martincirio', twitchUser: 'martincirio' },
  { id: 'coscu', nombre: 'Coscu', categoria: 'streamers', ytHandle: '@coscu', kickUser: 'coscu' },
  { id: 'kunaguero', nombre: 'Kun Agüero', categoria: 'streamers', ytHandle: '@SLAKUN10', twitchUser: 'slakun10' },
  { id: 'momo', nombre: 'Momo Benavides', categoria: 'streamers', ytHandle: '@momoladinastia', kickUser: 'momo' },
  { id: 'brunenger', nombre: 'Brunenger', categoria: 'streamers', ytHandle: '@brunengerx', kickUser: 'brunenger' },
  { id: 'goncho', nombre: 'Goncho Banzas', categoria: 'streamers', ytHandle: '@goncho', twitchUser: 'goncho' },
  { id: 'gregorossello', nombre: 'Grego Rossello', categoria: 'streamers', ytHandle: '@GregoRossello1' },

  // 4. Economía & Finanzas
  { id: 'bullmarket', nombre: 'Bull Market Brokers', categoria: 'finanzas', ytHandle: '@BullMarketBrokers' },
  { id: 'joveninversor', nombre: 'Joven Inversor', categoria: 'finanzas', ytHandle: '@JovenInversor' },
  { id: 'elcronista', nombre: 'El Cronista TV', categoria: 'finanzas', ytHandle: '@ElCronistaTV' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', categoria: 'finanzas', ytHandle: '@ambitofinanciero' },
  { id: 'canale', nombre: 'Canal E', categoria: 'finanzas', ytHandle: '@canaleoficial' },

  // 5. Noticias & Actualidad
  { id: 'neura', nombre: 'Neura Media / Troncal', categoria: 'noticias', ytHandle: '@neuramedia', twitchUser: 'neuramedia' },
  { id: 'tn', nombre: 'TN (Todo Noticias)', categoria: 'noticias', ytHandle: '@todonoticias' },
  { id: 'c5n', nombre: 'C5N', categoria: 'noticias', ytHandle: '@c5n' },
  { id: 'lanacionmas', nombre: 'La Nación +', categoria: 'noticias', ytHandle: '@lanacionmas' },
  { id: 'carajostream', nombre: 'Carajo Stream', categoria: 'noticias', ytHandle: '@carajostream' },
  { id: 'eldestape', nombre: 'El Destape', categoria: 'noticias', ytHandle: '@ElDestapeRadio' },
  { id: 'a24', nombre: 'A24', categoria: 'noticias', ytHandle: '@A24com' },
  { id: 'infobae', nombre: 'Infobae en Vivo', categoria: 'noticias', ytHandle: '@infobae' },
  { id: 'elobservador', nombre: 'El Observador 107.9', categoria: 'noticias', ytHandle: '@ElObservador1079' }
];

const publicPath = path.resolve(__dirname, 'public');
const logosDir = path.join(publicPath, 'logos');

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const horaBase = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

// Estado inicial en memoria
const telemetriaState = CANALES.map((c) => {
  const handle = c.ytHandle || (c.twitchUser ? `@\({c.twitchUser}` : '') || (c.kickUser ? `@\){c.kickUser}` : '');
  return {
    id: c.id,
    nombre: c.nombre,
    categoria: c.categoria,
    ytHandle: c.ytHandle,
    twitchUser: c.twitchUser,
    kickUser: c.kickUser,
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

// Helper de peticiones JSON seguras con timeout
function requestJSON(options, postData = null) {
  return new Promise((resolve) => {
    try {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      if (postData) req.write(postData);
      req.end();
    } catch (e) {
      resolve(null);
    }
  });
}

// 1. KICK (API Pública oficial de Kick)
async function consultarKick(user) {
  if (!user) return { isLive: false, viewers: 0 };
  const res = await requestJSON({
    hostname: 'kick.com',
    path: `/api/v1/channels/${user}`,
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    timeout: 4000
  });

  if (res?.livestream?.is_live) {
    return {
      isLive: true,
      viewers: parseInt(res.livestream.viewer_count || 0, 10),
      title: res.livestream.session_title || ''
    };
  }
  return { isLive: false, viewers: 0 };
}

// 2. TWITCH (GQL público de alta velocidad)
async function consultarTwitch(user) {
  if (!user) return { isLive: false, viewers: 0 };
  const query = JSON.stringify({
    query: `query { user(login: "${user}") { stream { viewersCount title } } }`
  });

  const res = await requestJSON({
    hostname: 'gql.twitch.tv',
    path: '/gql',
    method: 'POST',
    headers: {
      'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(query)
    },
    timeout: 4000
  }, query);

  const stream = res?.data?.user?.stream;
  if (stream) {
    return {
      isLive: true,
      viewers: parseInt(stream.viewersCount || 0, 10),
      title: stream.title || ''
    };
  }
  return { isLive: false, viewers: 0 };
}

// 3. YOUTUBE (Lector directo de transmisión en vivo en tiempo real)
function consultarYouTube(handle) {
  return new Promise((resolve) => {
    if (!handle) return resolve({ isLive: false, viewers: 0, title: '' });
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const url = `https://www.youtube.com/${cleanHandle}/live`;

    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
      },
      timeout: 5000
    }, (res) => {
      // Manejo de redirección natural a /watch?v=XXXX
      if ([301, 302, 303, 307].includes(res.statusCode) && res.headers.location) {
        let redir = res.headers.location;
        if (!redir.startsWith('http')) redir = 'https://www.youtube.com' + redir;
        return resolve(fetchHtmlBuffer(redir));
      }

      let data = '';
      res.on('data', chunk => {
        data += chunk;
        if (data.length > 700000) {
          req.destroy();
          resolve(parseYouTubeHtml(data));
        }
      });
      res.on('end', () => resolve(parseYouTubeHtml(data)));
      res.on('close', () => resolve(parseYouTubeHtml(data)));
    });

    req.on('error', () => resolve({ isLive: false, viewers: 0, title: '' }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ isLive: false, viewers: 0, title: '' });
    });
  });
}

function fetchHtmlBuffer(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
        if (data.length > 700000) {
          req.destroy();
          resolve(parseYouTubeHtml(data));
        }
      });
      res.on('end', () => resolve(parseYouTubeHtml(data)));
      res.on('close', () => resolve(parseYouTubeHtml(data)));
    });

    req.on('error', () => resolve({ isLive: false, viewers: 0, title: '' }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ isLive: false, viewers: 0, title: '' });
    });
  });
}

function parseYouTubeHtml(html) {
  try {
    const isLive = html.includes('"isLive":true') || 
                   html.includes('"isLiveNow":true') || 
                   html.includes('"status":"LIVE"');

    if (!isLive) {
      return { isLive: false, viewers: 0, title: 'Señal en espera' };
    }

    let viewers = 0;
    const matchViewers = html.match(/"viewCount":\{"runs":\[\{"text":"([^"]+)"\}/) ||
                         html.match(/"originalViewCount":"(\d+)"/) ||
                         html.match(/"text":"([0-9.,\s]+)(?:espectadores|watching|viendo)/i);

    if (matchViewers) {
      const rawNum = matchViewers[1].replace(/[^\d]/g, '');
      viewers = parseInt(rawNum, 10) || 0;
    }

    let title = 'En vivo';
    const matchTitle = html.match(/(.*?)<\/title>/);
    if (matchTitle && matchTitle[1]) {
      title = matchTitle[1].replace(' - YouTube', '').trim();
    }

    return { isLive: viewers > 0, viewers, title };
  } catch (e) {
    return { isLive: false, viewers: 0, title: 'Señal en espera' };
  }
}

// BUCLE DE TELEMETRÍA ASÍNCRONA MULTIPLATAFORMA
let enSincronizacion = false;
async function sincronizarTelemetria() {
  if (enSincronizacion) return;
  enSincronizacion = true;

  const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  // Procesamos en bloques para agilidad
  for (let i = 0; i < telemetriaState.length; i += 3) {
    const bloque = telemetriaState.slice(i, i + 3);
    await Promise.all(bloque.map(async (canal) => {
      try {
        const [yt, tw, ki] = await Promise.all([
          canal.ytHandle ? consultarYouTube(canal.ytHandle) : Promise.resolve({ isLive: false, viewers: 0, title: '' }),
          canal.twitchUser ? consultarTwitch(canal.twitchUser) : Promise.resolve({ isLive: false, viewers: 0, title: '' }),
          canal.kickUser ? consultarKick(canal.kickUser) : Promise.resolve({ isLive: false, viewers: 0, title: '' })
        ]);

        canal.viewers_breakdown.yt = yt.viewers;
        canal.viewers_breakdown.tw = tw.viewers;
        canal.viewers_breakdown.ki = ki.viewers;

        canal.plataformas_live.yt = yt.isLive && yt.viewers > 0;
        canal.plataformas_live.tw = tw.isLive && tw.viewers > 0;
        canal.plataformas_live.ki = ki.isLive && ki.viewers > 0;

        canal.viewers = yt.viewers + tw.viewers + ki.viewers;
        canal.is_live = canal.viewers > 0;

        if (canal.is_live) {
          canal.title = yt.title || tw.title || ki.title || 'En vivo';
        } else {
          canal.title = 'Señal en espera';
        }

        canal.hora_actualizacion = horaActual;
      } catch (err) {
        // En caso de fallo individual, no interrumpe el ciclo
      }
    }));
  }

  enSincronizacion = false;
}

// Inicia inmediatamente tras levantar y repite periódicamente
setTimeout(sincronizarTelemetria, 1500);
setInterval(sincronizarTelemetria, 25000);

// Helper autenticación institucional
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

// ENDPOINTS PRINCIPALES
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
