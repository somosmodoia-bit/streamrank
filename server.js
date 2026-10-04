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
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).send('OK'));

// MAPA ESTRICTO DE CATEGORÍAS (backend <-> frontend match 1:1)
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
  { id: 'luzutv', nombre: 'LUZU TV', categoria: 'entretenimiento', ytHandle: '@luzutv', twitchUser: 'luzutv', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'olga', nombre: 'OLGA', categoria: 'entretenimiento', ytHandle: '@olgaenvivo_', twitchUser: 'olgaenvivo', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'blender', nombre: 'Blender', categoria: 'entretenimiento', ytHandle: '@somosblender', twitchUser: 'somosblender', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'gelatina', nombre: 'Gelatina', categoria: 'entretenimiento', ytHandle: '@somosgelatina', twitchUser: 'somosgelatina', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'vorterix', nombre: 'Vorterix', categoria: 'entretenimiento', ytHandle: '@vorterixoficial', twitchUser: 'vorterixoficial', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'bondilive', nombre: 'Bondi Live', categoria: 'entretenimiento', ytHandle: '@bondi_liveok', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', categoria: 'entretenimiento', ytHandle: '@lacasastreaming', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', categoria: 'entretenimiento', ytHandle: '@unpocoderuido_', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'republicaz', nombre: 'República Z', categoria: 'entretenimiento', ytHandle: '@republicaz', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'posdata', nombre: 'Posdata', categoria: 'entretenimiento', ytHandle: '@posdatastream', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'dgo', nombre: 'DGO en Vivo', categoria: 'entretenimiento', ytHandle: '@DGO_Latam', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'telefe', nombre: 'Telefe Streams', categoria: 'entretenimiento', ytHandle: '@telefe', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'eltrece', nombre: 'eltrece', categoria: 'entretenimiento', ytHandle: '@eltrece', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'americatv', nombre: 'América TV', categoria: 'entretenimiento', ytHandle: '@americatv', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'urbanaplay', nombre: 'Urbana Play', categoria: 'entretenimiento', ytHandle: '@UrbanaPlayFM', twitchUser: 'urbanaplayfm', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },

  // 2. Deportes
  { id: 'programa412', nombre: '412 Fútbol (Davoo & Cobra)', categoria: 'deportes', ytHandle: '@412futbol', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'azzstream', nombre: 'AZZ Stream (Azzaro)', categoria: 'deportes', ytHandle: '@azzstream', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'picadotv', nombre: 'Picado TV', categoria: 'deportes', ytHandle: '@picadotv', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', categoria: 'deportes', ytHandle: '@pablocarrozza', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'tycsports', nombre: 'TyC Sports', categoria: 'deportes', ytHandle: '@TyCSportsOficial', defViewers: 14200, defLive: true, defTitle: 'TyC Sports en Vivo • Cobertura Deportiva' },
  { id: 'dsports', nombre: 'DSports', categoria: 'deportes', ytHandle: '@DSports', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'espnarg', nombre: 'ESPN Argentina', categoria: 'deportes', ytHandle: '@espnargentina', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'tntsportsarg', nombre: 'TNT Sports Argentina', categoria: 'deportes', ytHandle: '@TNTSportsAR', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },

  // 3. Streamers
  { id: 'davoo', nombre: 'Davoo Xeneize', categoria: 'streamers', ytHandle: '@davooxeneize', twitchUser: 'davooxeneize', kickUser: 'davooxeneize', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'lacobra', nombre: 'La Cobra', categoria: 'streamers', ytHandle: '@lacobraaa', twitchUser: 'lacobraaa', kickUser: 'lacobraaa', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'spreen', nombre: 'Spreen', categoria: 'streamers', ytHandle: '@spreen', twitchUser: 'spreen', kickUser: 'spreen', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'luquitas', nombre: 'Luquitas Rodríguez', categoria: 'streamers', ytHandle: '@luquitasrodriguez', twitchUser: 'luquitasrodriguez', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'martincirio', nombre: 'Martín Cirio', categoria: 'streamers', ytHandle: '@martincirio', twitchUser: 'martincirio', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'coscu', nombre: 'Coscu', categoria: 'streamers', ytHandle: '@coscu', kickUser: 'coscu', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'kunaguero', nombre: 'Kun Agüero', categoria: 'streamers', ytHandle: '@SLAKUN10', twitchUser: 'slakun10', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'momo', nombre: 'Momo Benavides', categoria: 'streamers', ytHandle: '@momoladinastia', kickUser: 'momo', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'brunenger', nombre: 'Brunenger', categoria: 'streamers', ytHandle: '@brunengerx', kickUser: 'brunenger', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'goncho', nombre: 'Goncho Banzas', categoria: 'streamers', ytHandle: '@goncho', twitchUser: 'goncho', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'gregorossello', nombre: 'Grego Rossello', categoria: 'streamers', ytHandle: '@GregoRossello1', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },

  // 4. Economía & Finanzas (Clave: finanzas)
  { id: 'bullmarket', nombre: 'Bull Market Brokers', categoria: 'finanzas', ytHandle: '@BullMarketBrokers', defViewers: 1200, defLive: false, defTitle: 'Señal en espera' },
  { id: 'joveninversor', nombre: 'Joven Inversor', categoria: 'finanzas', ytHandle: '@JovenInversor', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'elcronista', nombre: 'El Cronista TV', categoria: 'finanzas', ytHandle: '@ElCronistaTV', defViewers: 850, defLive: false, defTitle: 'Señal en espera' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', categoria: 'finanzas', ytHandle: '@ambitofinanciero', defViewers: 0, defLive: false, defTitle: 'Señal en espera' },
  { id: 'canale', nombre: 'Canal E', categoria: 'finanzas', ytHandle: '@canaleoficial', defViewers: 950, defLive: false, defTitle: 'Señal en espera' },

  // 5. Noticias & Actualidad (Clave: noticias)
  { id: 'neura', nombre: 'Neura Media / Troncal', categoria: 'noticias', ytHandle: '@neuramedia', twitchUser: 'neuramedia', defViewers: 18400, defLive: true, defTitle: 'NEURA MEDIA • Troncal' },
  { id: 'tn', nombre: 'TN (Todo Noticias)', categoria: 'noticias', ytHandle: '@todonoticias', defViewers: 48500, defLive: true, defTitle: 'TN EN VIVO • Cobertura en directo' },
  { id: 'c5n', nombre: 'C5N', categoria: 'noticias', ytHandle: '@c5n', defViewers: 36200, defLive: true, defTitle: 'C5N EN DIRECTO • Noticias las 24 horas' },
  { id: 'lanacionmas', nombre: 'La Nación +', categoria: 'noticias', ytHandle: '@lanacionmas', defViewers: 29300, defLive: true, defTitle: 'LN+ Transmisión Continua' },
  { id: 'carajostream', nombre: 'Carajo Stream', categoria: 'noticias', ytHandle: '@carajostream', defViewers: 6200, defLive: true, defTitle: 'Carajo Stream en Vivo' },
  { id: 'eldestape', nombre: 'El Destape', categoria: 'noticias', ytHandle: '@ElDestapeRadio', defViewers: 8900, defLive: true, defTitle: 'El Destape en Directo' },
  { id: 'a24', nombre: 'A24', categoria: 'noticias', ytHandle: '@A24com', defViewers: 12500, defLive: true, defTitle: 'A24 en Vivo' },
  { id: 'infobae', nombre: 'Infobae en Vivo', categoria: 'noticias', ytHandle: '@infobae', defViewers: 3400, defLive: true, defTitle: 'Infobae Cobertura en Directo' },
  { id: 'elobservador', nombre: 'El Observador 107.9', categoria: 'noticias', ytHandle: '@ElObservador1079', defViewers: 2800, defLive: true, defTitle: 'El Observador 107.9 Streaming' }
];

const publicPath = path.resolve(__dirname, 'public');
const logosDir = path.join(publicPath, 'logos');

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const horaBase = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

// Inicialización de la telemetría asegurando coincidencia absoluta
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
    viewers: c.defViewers || 0,
    is_live: Boolean(c.defLive),
    title: c.defTitle || 'Señal en espera',
    hora_actualizacion: horaBase,
    plataformas_live: {
      yt: Boolean(c.defLive),
      tw: false,
      ki: false
    },
    viewers_breakdown: {
      yt: c.defViewers || 0,
      tw: 0,
      ki: 0
    }
  };
});

// Helper de peticiones HTTP con control estricto de timeout
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

// 1. Kick API
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

// 2. Twitch GQL
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

// Bucle en segundo plano: corre en paralelo sin bloquear la API
let refrescando = false;
async function sincronizarMultiplataforma() {
  if (refrescando) return;
  refrescando = true;

  const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  for (const canal of telemetriaState) {
    try {
      const [tw, ki] = await Promise.all([
        canal.twitchUser ? consultarTwitch(canal.twitchUser) : Promise.resolve({ isLive: false, viewers: 0 }),
        canal.kickUser ? consultarKick(canal.kickUser) : Promise.resolve({ isLive: false, viewers: 0 })
      ]);

      canal.viewers_breakdown.tw = tw.viewers;
      canal.viewers_breakdown.ki = ki.viewers;
      canal.plataformas_live.tw = tw.isLive;
      canal.plataformas_live.ki = ki.isLive;

      // Consolidado final
      const ytViewers = canal.viewers_breakdown.yt || 0;
      canal.viewers = ytViewers + tw.viewers + ki.viewers;
      canal.is_live = canal.viewers > 0 || tw.isLive || ki.isLive;

      if (tw.isLive && tw.title) canal.title = tw.title;
      if (ki.isLive && ki.title) canal.title = ki.title;

      canal.hora_actualizacion = horaActual;
    } catch (e) {
      // Ignorar fallas puntuales para no cortar el ciclo
    }
  }

  refrescando = false;
}

setTimeout(sincronizarMultiplataforma, 2000);
setInterval(sincronizarMultiplataforma, 30000);

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

// RUTA PRINCIPAL DE LA APP
app.get('/api/ranking-categorias', (req, res) => {
  try {
    const categorias = CATEGORIAS_ORDEN.map((catKey) => {
      const meta = CATEGORIAS_CONFIG[catKey];

      // Filtra por 'finanzas', 'noticias', 'entretenimiento', 'deportes', 'streamers'
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
