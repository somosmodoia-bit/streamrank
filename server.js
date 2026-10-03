import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Verificación de estado de servicio
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Configuración visual y semántica de categorías
const CATEGORIAS_CONFIG = {
  entretenimiento: {
    nombre: 'Entretenimiento',
    banner: 'ESPACIO PUBLICITARIO DISPONIBLE • ENTRETENIMIENTO',
    bannerColor: 'from-purple-950/80 via-slate-900 to-indigo-950/80',
    borderColor: 'border-purple-500/30'
  },
  deportes: {
    nombre: 'Deportes',
    banner: 'ESPACIO PUBLICITARIO DISPONIBLE • DEPORTES',
    bannerColor: 'from-emerald-950/80 via-slate-900 to-green-950/80',
    borderColor: 'border-emerald-500/30'
  },
  streamers: {
    nombre: 'Streamers',
    banner: 'ESPACIO PUBLICITARIO DISPONIBLE • STREAMERS',
    bannerColor: 'from-cyan-950/80 via-slate-900 to-blue-950/80',
    borderColor: 'border-cyan-500/30'
  },
  finanzas: {
    nombre: 'Economía & Finanzas',
    banner: 'ESPACIO PUBLICITARIO DISPONIBLE • FINANZAS',
    bannerColor: 'from-amber-950/80 via-slate-900 to-yellow-950/80',
    borderColor: 'border-amber-500/30'
  },
  noticias: {
    nombre: 'Noticias & Actualidad',
    banner: 'ESPACIO PUBLICITARIO DISPONIBLE • AUDITORÍA DE MEDIOS',
    bannerColor: 'from-rose-950/80 via-slate-900 to-red-950/80',
    borderColor: 'border-rose-500/30'
  }
};

const CATEGORIAS_ORDEN = ['entretenimiento', 'deportes', 'streamers', 'finanzas', 'noticias'];

// Registro oficial de canales monitoreados
const CANALES = [
  // Entretenimiento
  { id: 'luzutv', nombre: 'LUZU TV', yt: 'luzutv', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'olga', nombre: 'OLGA', yt: 'olgaenvivo_', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'blender', nombre: 'Blender', yt: 'somosblender', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'gelatina', nombre: 'Gelatina', yt: 'somosgelatina', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'vorterix', nombre: 'Vorterix', yt: 'VorterixOficial', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'bondilive', nombre: 'Bondi Live', yt: 'bondi_liveok', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', yt: 'somoslacasa', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', yt: 'unpocoderuido', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'loftstream', nombre: 'Loft Stream', yt: 'loftstream', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'republicaz', nombre: 'República Z', yt: 'RepublicaZ', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'posdata', nombre: 'Posdata', yt: 'posdatastream', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'telefe', nombre: 'Telefe Streams', yt: 'telefe', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'eltrece', nombre: 'eltrece', yt: 'eltrece', tw: null, ki: null, categoria: 'entretenimiento' },
  { id: 'americatv', nombre: 'América TV', yt: 'americaenvivo', tw: null, ki: null, categoria: 'entretenimiento' },

  // Deportes
  { id: 'programa412', nombre: '412 Fútbol (Davoo & La Cobra)', yt: 'programa412', tw: null, ki: null, categoria: 'deportes' },
  { id: 'azzstream', nombre: 'AZZ Stream (Flavio Azzaro)', yt: 'FlavioAzzaroOK', tw: null, ki: null, categoria: 'deportes' },
  { id: 'picadotv', nombre: 'Picado TV', yt: 'picadotv', tw: null, ki: null, categoria: 'deportes' },
  { id: 'tycsports', nombre: 'TyC Sports', yt: 'TyCSportsOficial', tw: null, ki: null, categoria: 'deportes' },
  { id: 'espnarg', nombre: 'ESPN Argentina', yt: 'espnargentina', tw: null, ki: null, categoria: 'deportes' },
  { id: 'foxsportsarg', nombre: 'Fox Sports Argentina', yt: 'FoxSportsArg', tw: null, ki: null, categoria: 'deportes' },
  { id: 'tntsportsarg', nombre: 'TNT Sports Argentina', yt: 'TNTSportsAR', tw: null, ki: null, categoria: 'deportes' },
  { id: 'dsports', nombre: 'DSports / DGO', yt: 'DIRECTVSports', tw: null, ki: null, categoria: 'deportes' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', yt: 'PabloCarrozza', tw: null, ki: null, categoria: 'deportes' },

  // Streamers
  { id: 'davoo', nombre: 'Davoo Xeneize', yt: null, tw: null, ki: 'davoo_xeneize', categoria: 'streamers' },
  { id: 'lacobra', nombre: 'La Cobra', yt: null, tw: null, ki: 'lacobra', categoria: 'streamers' },
  { id: 'spreen', nombre: 'Spreen', yt: null, tw: null, ki: 'spreen', categoria: 'streamers' },
  { id: 'luquitas', nombre: 'Luquitas Rodríguez', yt: null, tw: 'luquitasrodriguez', ki: null, categoria: 'streamers' },
  { id: 'martincirio', nombre: 'Martín Cirio', yt: 'MartinCirio', tw: null, ki: null, categoria: 'streamers' },
  { id: 'coscu', nombre: 'Coscu', yt: null, tw: null, ki: 'coscu', categoria: 'streamers' },
  { id: 'kunaguero', nombre: 'Kun Agüero', yt: null, tw: 'slakun10', ki: null, categoria: 'streamers' },
  { id: 'momo', nombre: 'Momo Benavides', yt: null, tw: null, ki: 'momoladinastia', categoria: 'streamers' },
  { id: 'brunenger', nombre: 'Brunenger', yt: null, tw: null, ki: 'brunenger', categoria: 'streamers' },
  { id: 'goncho', nombre: 'Goncho Banzas', yt: null, tw: 'goncho', ki: null, categoria: 'streamers' },

  // Finanzas
  { id: 'bullmarket', nombre: 'Bull Market Brokers', yt: 'bullmarketbrokers', tw: null, ki: null, categoria: 'finanzas' },
  { id: 'joveninversor', nombre: 'Joven Inversor', yt: 'JovenInversor', tw: null, ki: null, categoria: 'finanzas' },
  { id: 'elcronista', nombre: 'El Cronista TV', yt: 'CronistaComercial', tw: null, ki: null, categoria: 'finanzas' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', yt: 'AmbitoFinanciero', tw: null, ki: null, categoria: 'finanzas' },
  { id: 'canale', nombre: 'Canal E (Económico)', yt: 'canaleperfil', tw: null, ki: null, categoria: 'finanzas' },

  // Noticias
  { id: 'neura', nombre: 'Neura Media / Troncal (Fantino)', yt: 'neuramedia', tw: null, ki: null, categoria: 'noticias' },
  { id: 'tn', nombre: 'TN (Todo Noticias)', yt: 'todonoticias', tw: null, ki: null, categoria: 'noticias' },
  { id: 'c5n', nombre: 'C5N', yt: 'c5n', tw: null, ki: null, categoria: 'noticias' },
  { id: 'lanacionmas', nombre: 'La Nación +', yt: 'lanacionmas', tw: null, ki: null, categoria: 'noticias' },
  { id: 'carajostream', nombre: 'Carajo Stream', yt: 'carajostream', tw: null, ki: null, categoria: 'noticias' },
  { id: 'eldestape', nombre: 'El Destape', yt: 'eldestapeweb', tw: null, ki: null, categoria: 'noticias' },
  { id: 'a24', nombre: 'A24', yt: 'A24com', tw: null, ki: null, categoria: 'noticias' },
  { id: 'infobae', nombre: 'Infobae en Vivo', yt: 'infobae', tw: null, ki: null, categoria: 'noticias' },
  { id: 'elobservador', nombre: 'El Observador 107.9', yt: 'elobservador1079', tw: null, ki: null, categoria: 'noticias' }
];

const publicPath = path.resolve(__dirname, 'public');
const logosDir = path.join(publicPath, 'logos');

// Creación de carpeta de almacenamiento local de avatares
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Descarga escalonada con manejo de redirecciones HTTP/HTTPS
function descargarLogoConRedirect(url, destino) {
  const modulo = url.startsWith('https') ? https : http;
  modulo.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      if (res.headers.location) {
        descargarLogoConRedirect(res.headers.location, destino);
      }
      return;
    }
    if (res.statusCode === 200) {
      const stream = fs.createWriteStream(destino);
      res.pipe(stream);
    }
  }).on('error', () => {});
}

// Sincronización diferida de imágenes para no saturar requests al iniciar
CANALES.forEach((c, index) => {
  const filePath = path.join(logosDir, `${c.id}.jpg`);
  if (!fs.existsSync(filePath)) {
    setTimeout(() => {
      const service = c.yt ? 'youtube' : (c.tw ? 'twitch' : 'kick');
      const handle = (c.yt || c.tw || c.ki || '').replace('@', '');
      const url = `https://unavatar.io/\({service}/\){handle}`;
      descargarLogoConRedirect(url, filePath);
    }, index * 800);
  }
});

// Estado global de telemetría en memoria
let telemetriaState = CANALES.map((c) => ({
  ...c,
  handle: c.yt || c.tw || c.ki,
  avatar: `/logos/${c.id}.jpg`,
  viewers: 0,
  is_live: false,
  title: 'Señal en espera',
  hora_actualizacion: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  plataformas_live: { yt: false, tw: false, ki: false },
  viewers_breakdown: { yt: 0, tw: 0, ki: 0 }
}));

// Funciones para monitoreo y telemetría multiplataforma
async function checkYouTube(handle) {
  return new Promise((resolve) => {
    if (!handle) return resolve({ live: false, viewers: 0, title: '' });
    const options = {
      hostname: 'www.youtube.com',
      path: `/@${handle}/live`,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 6000
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const isLive = data.includes('"isLive":true') || data.includes('liveStreamabilityRenderer');
        let viewers = 0;
        const viewMatch = data.match(/"viewCount":\{"runs":\[\{"text":"([0-9.,]+)"/);
        if (viewMatch && viewMatch[1]) {
          viewers = parseInt(viewMatch[1].replace(/[.,]/g, ''), 10) || 0;
        }
        let title = '';
        const titleMatch = data.match(/(.*?)<\/title>/);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].replace(' - YouTube', '').trim();
        }
        resolve({ live: isLive && viewers > 0, viewers, title });
      });
    }).on('error', () => resolve({ live: false, viewers: 0, title: '' }));
  });
}

async function checkTwitch(user) {
  return new Promise((resolve) => {
    if (!user) return resolve({ live: false, viewers: 0, title: '' });
    const req = https.request('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json'
      },
      timeout: 6000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const stream = json?.data?.user?.stream;
          if (stream) {
            resolve({
              live: true,
              viewers: stream.viewersCount || 0,
              title: stream.title || 'Transmisión en directo'
            });
          } else {
            resolve({ live: false, viewers: 0, title: '' });
          }
        } catch {
          resolve({ live: false, viewers: 0, title: '' });
        }
      });
    });
    req.on('error', () => resolve({ live: false, viewers: 0, title: '' }));
    req.write(JSON.stringify({
      query: `query { user(login: "${user}") { stream { viewersCount title } } }`
    }));
    req.end();
  });
}

async function checkKick(user) {
  return new Promise((resolve) => {
    if (!user) return resolve({ live: false, viewers: 0, title: '' });
    const options = {
      hostname: 'kick.com',
      path: `/api/v2/channels/${user}`,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 6000
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const livestream = json?.livestream;
          if (livestream && livestream.is_live) {
            resolve({
              live: true,
              viewers: livestream.viewer_count || 0,
              title: livestream.session_title || 'En vivo en Kick'
            });
          } else {
            resolve({ live: false, viewers: 0, title: '' });
          }
        } catch {
          resolve({ live: false, viewers: 0, title: '' });
        }
      });
    }).on('error', () => resolve({ live: false, viewers: 0, title: '' }));
  });
}

// Bucle de actualización continua en segundo plano
async function actualizarTelemetria() {
  const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  
  for (let i = 0; i < CANALES.length; i++) {
    const c = CANALES[i];
    try {
      const [ytData, twData, kiData] = await Promise.all([
        checkYouTube(c.yt),
        checkTwitch(c.tw),
        checkKick(c.ki)
      ]);

      const totalViewers = ytData.viewers + twData.viewers + kiData.viewers;
      const isLive = ytData.live || twData.live || kiData.live;
      const tituloActivo = ytData.title || twData.title || kiData.title || (isLive ? 'Transmisión oficial' : 'Señal en espera');

      telemetriaState[i] = {
        ...c,
        handle: c.yt || c.tw || c.ki,
        avatar: `/logos/${c.id}.jpg`,
        viewers: totalViewers,
        is_live: isLive,
        title: tituloActivo,
        hora_actualizacion: horaActual,
        plataformas_live: {
          yt: ytData.live,
          tw: twData.live,
          ki: kiData.live
        },
        viewers_breakdown: {
          yt: ytData.viewers,
          tw: twData.viewers,
          ki: kiData.viewers
        }
      };
    } catch {}
  }
}

// Ciclo cada 45 segundos para no agotar cuotas
setInterval(actualizarTelemetria, 45000);
actualizarTelemetria();

// Rutas de entrega de datos para el cliente
app.get('/api/ranking-categorias', (req, res) => {
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
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="streamrank_analytics.csv"');
  let csv = 'Canal,Categoria,Handle,Viewers_Total,YouTube,Twitch,Kick,Estado,Titulo,Ultima_Actualizacion\n';
  telemetriaState.forEach((c) => {
    csv += `"\({c.nombre}","\){c.categoria}","@\({c.handle}",\){c.viewers},\({c.viewers_breakdown.yt},\){c.viewers_breakdown.tw},\({c.viewers_breakdown.ki},"\){c.is_live ? 'EN VIVO' : 'OFFLINE'}","\({c.title.replace(/"/g, '""')}","\){c.hora_actualizacion}"\n`;
  });
  res.send(csv);
});

app.get('/modoia', (req, res) => {
  res.redirect(301, 'https://modoia.online');
});

// Servicio estático del build/frontend y fallback SPA
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[StreamRank ARG] Servidor activo en puerto ${PORT}`);
});
