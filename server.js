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

const RAW_YT_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_API_KEY = RAW_YT_KEY.trim().replace(/['"\r\n\s]/g, '');

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
  { id: 'luzutv', nombre: 'LUZU TV', categoria: 'entretenimiento', ytChannelId: 'UCH5F5i0v9zZz8d9pS4C9w6A', twitchUser: 'luzutv' },
  { id: 'olga', nombre: 'OLGA', categoria: 'entretenimiento', ytChannelId: 'UCWbN8rVbI09kS-4P4v1dK3w', twitchUser: 'olgaenvivo' },
  { id: 'blender', nombre: 'Blender', categoria: 'entretenimiento', ytChannelId: 'UCgB6qA7Mh2V1bM8UaQ9r0Yw', twitchUser: 'somosblender' },
  { id: 'gelatina', nombre: 'Gelatina', categoria: 'entretenimiento', ytChannelId: 'UCsRzT1pQeG5G7xS4nE8zWbQ', twitchUser: 'somosgelatina' },
  { id: 'vorterix', nombre: 'Vorterix', categoria: 'entretenimiento', ytChannelId: 'UC2wYc4uK9f7gW2Z3xK_kH2A', twitchUser: 'vorterixoficial' },
  { id: 'bondilive', nombre: 'Bondi Live', categoria: 'entretenimiento', ytChannelId: 'UCm6f_27x8Fm4zP8m4F9yN6g' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', categoria: 'entretenimiento', ytChannelId: 'UCe5j3a6pD1yA-6vS7n3hT1w' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', categoria: 'entretenimiento', ytChannelId: 'UCd4_w8YQ6E_mE7k0A0Vz5LQ' },
  { id: 'republicaz', nombre: 'República Z', categoria: 'entretenimiento', ytChannelId: 'UC5Jb5A5n_F7vS5M4K7xVw6Q' },
  { id: 'posdata', nombre: 'Posdata', categoria: 'entretenimiento', ytChannelId: 'UCZ3WkYv4m7B8K6D9X_q1m8w' },
  { id: 'dgo', nombre: 'DGO en Vivo', categoria: 'entretenimiento', ytChannelId: 'UCY7pZqZ6QjG5x2T2X7K9q3Q' },
  { id: 'telefe', nombre: 'Telefe Streams', categoria: 'entretenimiento', ytChannelId: 'UC8_YpL2yQ3T5J4b4Z8_K7tA' },
  { id: 'eltrece', nombre: 'eltrece', categoria: 'entretenimiento', ytChannelId: 'UCj6aTqJkPz_v0wZ3R1X2L4A' },
  { id: 'americatv', nombre: 'América TV', categoria: 'entretenimiento', ytChannelId: 'UCd8uH1tWw3nF1lG6qJ2sY5w' },
  { id: 'urbanaplay', nombre: 'Urbana Play', categoria: 'entretenimiento', ytChannelId: 'UCQ5qJ5u5bT1fK4jW4n0m7gA', twitchUser: 'urbanaplayfm' },

  // 2. Deportes
  { id: 'programa412', nombre: '412 Fútbol (Davoo & Cobra)', categoria: 'deportes', ytChannelId: 'UCmK_P8XkY2nN_m6E7xX8Y7w' },
  { id: 'azzstream', nombre: 'AZZ Stream (Azzaro)', categoria: 'deportes', ytChannelId: 'UC3v4wG0x9e_1K5s3Y5f4Q9A' },
  { id: 'picadotv', nombre: 'Picado TV', categoria: 'deportes', ytChannelId: 'UCv6K2_0fP9nN7mY3f7_yQ5A' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', categoria: 'deportes', ytChannelId: 'UCr5hXgY8Y5N0m_N3K4v5w9A' },
  { id: 'tycsports', nombre: 'TyC Sports', categoria: 'deportes', ytChannelId: 'UCw8qfP9aJ_n8WpE9S3yPkWQ' },
  { id: 'dsports', nombre: 'DSports', categoria: 'deportes', ytChannelId: 'UCp6HkY4rX7m0V2n5W8m4Q6A' },
  { id: 'espnarg', nombre: 'ESPN Argentina', categoria: 'deportes', ytChannelId: 'UCzJpE8b2P0nN9_Z4m2j7Q8A' },
  { id: 'tntsportsarg', nombre: 'TNT Sports Argentina', categoria: 'deportes', ytChannelId: 'UCF6g3mN0F5X2Q4k5m9Y8_wA' },

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
  { id: 'gregorossello', nombre: 'Grego Rossello', categoria: 'streamers', ytChannelId: 'UC3v5F1wP8sK_7m9n2f_5Y5w' },

  // 4. Economía & Finanzas
  { id: 'bullmarket', nombre: 'Bull Market Brokers', categoria: 'finanzas', ytChannelId: 'UCnN5u4tT7qN8L5f2_6mQ9hA' },
  { id: 'joveninversor', nombre: 'Joven Inversor', categoria: 'finanzas', ytChannelId: 'UC3a2K4m0B7k7K8m2K4k8w5w' },
  { id: 'elcronista', nombre: 'El Cronista TV', categoria: 'finanzas', ytChannelId: 'UCgK8t5j7q8N8L5f2_6mQ9hA' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', categoria: 'finanzas', ytChannelId: 'UC7v4K8m0B7k7K8m2K4k8w5w' },
  { id: 'canale', nombre: 'Canal E', categoria: 'finanzas', ytChannelId: 'UC0x4m7B8K6D9X_q1m8w8K9A' },

  // 5. Noticias & Actualidad
  { id: 'tn', nombre: 'TN (Todo Noticias)', categoria: 'noticias', ytChannelId: 'UCj6P3CGNP457_k4bZq1l_4w' },
  { id: 'c5n', nombre: 'C5N', categoria: 'noticias', ytChannelId: 'UCFgk2Q2mVO1BklRQhSv6p0w' },
  { id: 'lanacionmas', nombre: 'La Nación +', categoria: 'noticias', ytChannelId: 'UC554_bZyhmhCdC7y_WcT7vg' },
  { id: 'neura', nombre: 'Neura Media / Troncal', categoria: 'noticias', ytChannelId: 'UCv6GkWv7l9xH7wIqB0b3ZqA', twitchUser: 'neuramedia' },
  { id: 'carajostream', nombre: 'Carajo Stream', categoria: 'noticias', ytChannelId: 'UC0X6_m4B8N8L5f2_6mQ9h7w' },
  { id: 'eldestape', nombre: 'El Destape', categoria: 'noticias', ytChannelId: 'UC4s5qO4zJ2b5qWf6K8p2aPw' },
  { id: 'a24', nombre: 'A24', categoria: 'noticias', ytChannelId: 'UC_7Q8Vb4x8g2nK4v5w9A3qg' },
  { id: 'infobae', nombre: 'Infobae en Vivo', categoria: 'noticias', ytChannelId: 'UCd4_w8YQ6E_mE7k0A0Vz5Lw' },
  { id: 'elobservador', nombre: 'El Observador 107.9', categoria: 'noticias', ytChannelId: 'UC3v4wG0x9e_1K5s3Y5f4Q9w' }
];

const publicPath = path.resolve(__dirname, 'public');
const logosDir = path.join(publicPath, 'logos');

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const horaBase = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const telemetriaState = CANALES.map((c) => {
  const handle = (c.twitchUser ? `@\({c.twitchUser}` : '') || (c.kickUser ? `@\){c.kickUser}` : `@${c.id}`);
  return {
    id: c.id,
    nombre: c.nombre,
    categoria: c.categoria,
    ytChannelId: c.ytChannelId || null,
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

function requestJSON(options, postData = null) {
  return new Promise((resolve) => {
    try {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); } catch (e) { resolve({ status: res.statusCode, data: null, raw: data }); }
        });
      });
      req.on('error', (err) => resolve({ error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
      if (postData) req.write(postData);
      req.end();
    } catch (e) {
      resolve({ error: e.message });
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
    timeout: 3500
  });

  if (res?.data?.livestream?.is_live) {
    return {
      isLive: true,
      viewers: parseInt(res.data.livestream.viewer_count || 0, 10),
      title: res.data.livestream.session_title || ''
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
    timeout: 3500
  }, query);

  const stream = res?.data?.data?.user?.stream;
  if (stream) {
    return {
      isLive: true,
      viewers: parseInt(stream.viewersCount || 0, 10),
      title: stream.title || ''
    };
  }
  return { isLive: false, viewers: 0 };
}

// 3. YouTube: Detección exacta de vivo mediante Search + Videos.list
async function consultarYouTubePorCanal(channelId) {
  if (!YOUTUBE_API_KEY || !channelId) return { isLive: false, viewers: 0, title: '' };

  try {
    const searchRes = await requestJSON({
      hostname: 'www.googleapis.com',
      path: `/youtube/v3/search?part=id&channelId=\({channelId}&eventType=live&type=video&key=\){YOUTUBE_API_KEY}&maxResults=1`,
      method: 'GET',
      timeout: 5000
    });

    const videoId = searchRes?.data?.items?.[0]?.id?.videoId;
    if (!videoId) return { isLive: false, viewers: 0, title: '' };

    const videoRes = await requestJSON({
      hostname: 'www.googleapis.com',
      path: `/youtube/v3/videos?part=snippet,liveStreamingDetails&id=\({videoId}&key=\){YOUTUBE_API_KEY}`,
      method: 'GET',
      timeout: 5000
    });

    const item = videoRes?.data?.items?.[0];
    const details = item?.liveStreamingDetails;
    const viewers = parseInt(details?.concurrentViewers || '0', 10);
    const title = item?.snippet?.title || 'En vivo';

    return {
      isLive: viewers > 0,
      viewers: viewers,
      title: title
    };
  } catch (err) {
    return { isLive: false, viewers: 0, title: '' };
  }
}

// Canales principales a monitorear continuamente
const PRIORITARIOS = ['tn', 'c5n', 'lanacionmas', 'neura', 'tycsports', 'a24', 'luzutv', 'olga'];

let ejecutando = false;
async function sincronizarMultiplataforma() {
  if (ejecutando) return;
  ejecutando = true;

  const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  for (const canal of telemetriaState) {
    try {
      const [tw, ki] = await Promise.all([
        canal.twitchUser ? consultarTwitch(canal.twitchUser) : Promise.resolve({ isLive: false, viewers: 0 }),
        canal.kickUser ? consultarKick(canal.kickUser) : Promise.resolve({ isLive: false, viewers: 0 })
      ]);

      let yt = { isLive: false, viewers: 0, title: '' };
      if (canal.ytChannelId && PRIORITARIOS.includes(canal.id)) {
        yt = await consultarYouTubePorCanal(canal.ytChannelId);
      }

      canal.viewers_breakdown.yt = yt.viewers;
      canal.viewers_breakdown.tw = tw.viewers;
      canal.viewers_breakdown.ki = ki.viewers;

      canal.plataformas_live.yt = yt.isLive;
      canal.plataformas_live.tw = tw.isLive;
      canal.plataformas_live.ki = ki.isLive;

      canal.viewers = yt.viewers + tw.viewers + ki.viewers;
      canal.is_live = canal.viewers > 0;

      if (canal.is_live) {
        canal.title = yt.title || tw.title || ki.title || 'En vivo';
      } else {
        canal.title = 'Señal en espera';
      }

      canal.hora_actualizacion = horaActual;
    } catch (e) {}
  }

  ejecutando = false;
}

setTimeout(sincronizarMultiplataforma, 1000);
setInterval(sincronizarMultiplataforma, 30000);

// Endpoint de diagnóstico directo
app.get('/api/test-yt', async (req, res) => {
  if (!YOUTUBE_API_KEY) {
    return res.json({ error: 'YOUTUBE_API_KEY no encontrada en process.env' });
  }

  const tnChannelId = 'UCj6P3CGNP457_k4bZq1l_4w';
  const resultado = await consultarYouTubePorCanal(tnChannelId);

  return res.json({
    apiKeyConfigurada: Boolean(YOUTUBE_API_KEY),
    longitudApiKey: YOUTUBE_API_KEY.length,
    resultadoTN: resultado
  });
});

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

// Endpoints principales
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
