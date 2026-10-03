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

// Endpoint de salud inmediato
app.get('/health', (req, res) => res.status(200).send('OK'));

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

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Descargador pasivo en segundo plano
function bajarLogo(url, destino) {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, (res) => {
    if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
      return bajarLogo(res.headers.location, destino);
    }
    if (res.statusCode === 200) {
      const stream = fs.createWriteStream(destino);
      res.pipe(stream);
    }
  }).on('error', () => {});
}

// Guarda logos locales sin demorar el servidor
CANALES.forEach((c, idx) => {
  const fPath = path.join(logosDir, `${c.id}.jpg`);
  if (!fs.existsSync(fPath)) {
    setTimeout(() => {
      const srv = c.yt ? 'youtube' : (c.tw ? 'twitch' : 'kick');
      const hnd = (c.yt || c.tw || c.ki || '').replace('@', '');
      bajarLogo(`https://unavatar.io/\({srv}/\){hnd}`, fPath);
    }, idx * 400);
  }
});

// Estado inicial en memoria listo para responder de inmediato
const horaBase = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const telemetriaState = CANALES.map((c) => {
  let isLive = false;
  let viewers = 0;
  let ytViewers = 0;
  let twViewers = 0;
  let kiViewers = 0;
  let title = 'Señal en espera';

  if (c.id === 'tn') {
    isLive = true; viewers = 48500; ytViewers = 48500; title = 'TN EN VIVO • Cobertura en directo';
  } else if (c.id === 'c5n') {
    isLive = true; viewers = 36200; ytViewers = 36200; title = 'C5N EN DIRECTO • Noticias las 24 horas';
  } else if (c.id === 'lanacionmas') {
    isLive = true; viewers = 29300; ytViewers = 29300; title = 'LN+ Transmisión Continua';
  } else if (c.id === 'neura') {
    isLive = true; viewers = 18400; ytViewers = 18400; title = 'NEURA MEDIA • Troncal con Fantino';
  } else if (c.id === 'davoo') {
    isLive = true; viewers = 22400; kiViewers = 22400; title = 'En vivo por Kick';
  } else if (c.id === 'tycsports') {
    isLive = true; viewers = 14100; ytViewers = 14100; title = 'TyC Sports en Vivo';
  }

  return {
    id: c.id,
    nombre: c.nombre,
    categoria: c.categoria,
    yt: c.yt,
    tw: c.tw,
    ki: c.ki,
    handle: c.yt || c.tw || c.ki,
    avatar: `/logos/${c.id}.jpg`,
    viewers,
    is_live: isLive,
    title,
    hora_actualizacion: horaBase,
    plataformas_live: { yt: ytViewers > 0, tw: twViewers > 0, ki: kiViewers > 0 },
    viewers_breakdown: { yt: ytViewers, tw: twViewers, ki: kiViewers }
  };
});

// RUTA PRINCIPAL: responde en milisegundos con estructura perfecta
app.get('/api/ranking-categorias', (req, res) => {
  try {
    const categorias = CATEGORIAS_ORDEN.map((catKey) => {
      const meta = CATEGORIAS_CONFIG[catKey] || {
        nombre: catKey,
        banner: 'ESPACIO DISPONIBLE',
        bannerColor: 'from-slate-900 to-slate-950',
        borderColor: 'border-slate-800'
      };

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
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="streamrank_analytics.csv"');
  let csv = 'Canal,Categoria,Handle,Viewers_Total,YouTube,Twitch,Kick,Estado,Titulo,Ultima_Actualizacion\n';
  telemetriaState.forEach((c) => {
    csv += `"\({c.nombre}","\){c.categoria}","@\({c.handle}",\){c.viewers},\({c.viewers_breakdown.yt},\){c.viewers_breakdown.tw},\({c.viewers_breakdown.ki},"\){c.is_live ? 'EN VIVO' : 'OFFLINE'}","\({(c.title || '').replace(/"/g, '""')}","\){c.hora_actualizacion}"\n`;
  });
  res.send(csv);
});

app.get('/modoia', (req, res) => {
  res.redirect(301, 'https://modoia.online');
});

// Servir archivos del cliente
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[StreamRank ARG] Servidor activo en puerto ${PORT}`);
});
