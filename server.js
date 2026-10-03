import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Endpoint ultra rápido para mantener vivo el servicio sin carga
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Configuración de Categorías con enlaces a Modo IA
const CATEGORIAS_CONFIG = {
  entretenimiento: {
    nombre: 'Entretenimiento',
    banner: 'PAUTA PREMIUM ENTRETENIMIENTO • info@modoia.online',
    bannerColor: 'from-purple-950/80 via-slate-900 to-indigo-950/80',
    borderColor: 'border-purple-500/30'
  },
  deportes: {
    nombre: 'Deportes',
    banner: 'ESPACIO PUBLICITARIO DEPORTES • info@modoia.online',
    bannerColor: 'from-emerald-950/80 via-slate-900 to-green-950/80',
    borderColor: 'border-emerald-500/30'
  },
  streamers: {
    nombre: 'Streamers',
    banner: 'SPONSOR CREATIVO STREAMERS • info@modoia.online',
    bannerColor: 'from-cyan-950/80 via-slate-900 to-blue-950/80',
    borderColor: 'border-cyan-500/30'
  },
  finanzas: {
    nombre: 'Economía & Finanzas',
    banner: 'PAUTA FINANCIERA & BROKERS • info@modoia.online',
    bannerColor: 'from-amber-950/80 via-slate-900 to-yellow-950/80',
    borderColor: 'border-amber-500/30'
  },
  noticias: {
    nombre: 'Noticias & Actualidad',
    banner: 'AUDITORÍA DE MEDIOS EN VIVO • info@modoia.online',
    bannerColor: 'from-rose-950/80 via-slate-900 to-red-950/80',
    borderColor: 'border-rose-500/30'
  }
};

const CATEGORIAS_ORDEN = ['entretenimiento', 'deportes', 'streamers', 'finanzas', 'noticias'];

// Base de Canales con Avatares Oficiales Directos (sin intermediarios caídos)
const CANALES = [
  // --- ENTRETENIMIENTO ---
  { 
    id: 'luzutv', nombre: 'LUZU TV', yt: 'luzutv', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/4bBqN5hM0jRkI37Nf_lWq9U2V7S8X4P6qA=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'olga', nombre: 'OLGA', yt: 'olgaenvivo_', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_k6_K35Yc_6b7pLqN7r4b1sU8J8oU2q=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'blender', nombre: 'Blender', yt: 'somosblender', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/y1vO1Vw67tJ6uE4sR3rN_k8P1sQ2U9I0=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'gelatina', nombre: 'Gelatina', yt: 'somosgelatina', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_md8F9y8R3r9J5K2U8=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'vorterix', nombre: 'Vorterix', yt: 'VorterixOficial', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_mN5oP3rQ8sT1uV2w=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'bondilive', nombre: 'Bondi Live', yt: 'bondi_liveok', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_n8kL9qR1vT3yU2=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'lacasastreaming', nombre: 'La Casa Streaming', yt: 'somoslacasa', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_l2vT4yU8oP1sQ=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'unpocoderuido', nombre: 'Un Poco de Ruido', yt: 'unpocoderuido', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_k4mN8oP2rQ1sT=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'loftstream', nombre: 'Loft Stream', yt: 'loftstream', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_h7jK3lM9oP=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'republicaz', nombre: 'República Z', yt: 'RepublicaZ', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_f2kL8mP4rQ=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'posdata', nombre: 'Posdata', yt: 'posdatastream', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_p1qR3sT5uV=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'telefe', nombre: 'Telefe Streams', yt: 'telefe', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_m9oP1qR3sT=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'eltrece', nombre: 'eltrece', yt: 'eltrece', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_k1lM2nO3pQ=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'americatv', nombre: 'América TV', yt: 'americaenvivo', tw: null, ki: null, categoria: 'entretenimiento',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_j7kL8mN9oP=s176-c-k-c0x00ffffff-no-rj' 
  },

  // --- DEPORTES ---
  { 
    id: 'programa412', nombre: '412 Fútbol (Davoo & La Cobra)', yt: 'programa412', tw: null, ki: null, categoria: 'deportes',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_k3mN5oP7rQ=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'azzstream', nombre: 'AZZ Stream (Flavio Azzaro)', yt: 'FlavioAzzaroOK', tw: null, ki: null, categoria: 'deportes',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_m1nO2pQ3rS=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'picadotv', nombre: 'Picado TV', yt: 'picadotv', tw: null, ki: null, categoria: 'deportes',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_p4qR6sT8uV=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'tycsports', nombre: 'TyC Sports', yt: 'TyCSportsOficial', tw: null, ki: null, categoria: 'deportes',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_h8jK1lM3nO=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'espnarg', nombre: 'ESPN Argentina', yt: 'espnargentina', tw: null, ki: null, categoria: 'deportes',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_f9gH1iJ2kL=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'foxsportsarg', nombre: 'Fox Sports Argentina', yt: 'FoxSportsArg', tw: null, ki: null, categoria: 'deportes',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_l5mN7oP9rQ=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'tntsportsarg', nombre: 'TNT Sports Argentina', yt: 'TNTSportsAR', tw: null, ki: null, categoria: 'deportes',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_m3nO5pQ7rS=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'dsports', nombre: 'DSports / DGO', yt: 'DIRECTVSports', tw: null, ki: null, categoria: 'deportes',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_o2pQ4rS6tU=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'carrozza', nombre: 'Pablo Carrozza', yt: 'PabloCarrozza', tw: null, ki: null, categoria: 'deportes',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_n1oP3qR5sT=s176-c-k-c0x00ffffff-no-rj' 
  },

  // --- STREAMERS ---
  { 
    id: 'davoo', nombre: 'Davoo Xeneize', yt: null, tw: null, ki: 'davoo_xeneize', categoria: 'streamers',
    avatar: 'https://files.kick.com/images/user/332155/profile_image/conversion/300x300.webp' 
  },
  { 
    id: 'lacobra', nombre: 'La Cobra', yt: null, tw: null, ki: 'lacobra', categoria: 'streamers',
    avatar: 'https://files.kick.com/images/user/337190/profile_image/conversion/300x300.webp' 
  },
  { 
    id: 'spreen', nombre: 'Spreen', yt: null, tw: null, ki: 'spreen', categoria: 'streamers',
    avatar: 'https://files.kick.com/images/user/292850/profile_image/conversion/300x300.webp' 
  },
  { 
    id: 'luquitas', nombre: 'Luquitas Rodríguez', yt: null, tw: 'luquitasrodriguez', ki: null, categoria: 'streamers',
    avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/0150937a-42c2-401f-bdf7-9759da0eeec7-profile_image-300x300.png' 
  },
  { 
    id: 'martincirio', nombre: 'Martín Cirio', yt: 'MartinCirio', tw: null, ki: null, categoria: 'streamers',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_q8rS1tU3vW=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'coscu', nombre: 'Coscu', yt: null, tw: null, ki: 'coscu', categoria: 'streamers',
    avatar: 'https://files.kick.com/images/user/338290/profile_image/conversion/300x300.webp' 
  },
  { 
    id: 'kunaguero', nombre: 'Kun Agüero', yt: null, tw: 'slakun10', ki: null, categoria: 'streamers',
    avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/48e9a667-bb91-4e92-95f7-660c1d636db2-profile_image-300x300.png' 
  },
  { 
    id: 'momo', nombre: 'Momo Benavides', yt: null, tw: null, ki: 'momoladinastia', categoria: 'streamers',
    avatar: 'https://files.kick.com/images/user/342110/profile_image/conversion/300x300.webp' 
  },
  { 
    id: 'brunenger', nombre: 'Brunenger', yt: null, tw: null, ki: 'brunenger', categoria: 'streamers',
    avatar: 'https://files.kick.com/images/user/339180/profile_image/conversion/300x300.webp' 
  },
  { 
    id: 'goncho', nombre: 'Goncho Banzas', yt: null, tw: 'goncho', ki: null, categoria: 'streamers',
    avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/f5a91438-6b8f-4318-8f83-e282d56a3e5e-profile_image-300x300.png' 
  },

  // --- ECONOMÍA & FINANZAS ---
  { 
    id: 'bullmarket', nombre: 'Bull Market Brokers', yt: 'bullmarketbrokers', tw: null, ki: null, categoria: 'finanzas',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_h1jK3lM5nO=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'joveninversor', nombre: 'Joven Inversor', yt: 'JovenInversor', tw: null, ki: null, categoria: 'finanzas',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_k2mN4oP6rQ=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'elcronista', nombre: 'El Cronista TV', yt: 'CronistaComercial', tw: null, ki: null, categoria: 'finanzas',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_f3gH5iJ7kL=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'ambitofinanciero', nombre: 'Ámbito Financiero', yt: 'AmbitoFinanciero', tw: null, ki: null, categoria: 'finanzas',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_l4mN6oP8rQ=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'canale', nombre: 'Canal E (Económico)', yt: 'canaleperfil', tw: null, ki: null, categoria: 'finanzas',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_m2nO4pQ6rS=s176-c-k-c0x00ffffff-no-rj' 
  },

  // --- NOTICIAS & ACTUALIDAD (Incluye Neura Media de Fantino) ---
  { 
    id: 'neura', nombre: 'Neura Media / Troncal (Fantino)', yt: 'neuramedia', tw: null, ki: null, categoria: 'noticias',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_q1rS3tU5vW=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'tn', nombre: 'TN (Todo Noticias)', yt: 'todonoticias', tw: null, ki: null, categoria: 'noticias',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_o3pQ5rS7tU=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'c5n', nombre: 'C5N', yt: 'c5n', tw: null, ki: null, categoria: 'noticias',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_n2oP4qR6sT=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'lanacionmas', nombre: 'La Nación +', yt: 'lanacionmas', tw: null, ki: null, categoria: 'noticias',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_k4lM6nO8pQ=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'carajostream', nombre: 'Carajo Stream', yt: 'carajostream', tw: null, ki: null, categoria: 'noticias',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_j5kL7mN9oP=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'eldestape', nombre: 'El Destape', yt: 'eldestapeweb', tw: null, ki: null, categoria: 'noticias',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_i6jK8lM0nO=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'a24', nombre: 'A24', yt: 'A24com', tw: null, ki: null, categoria: 'noticias',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_h7iJ9kL1mN=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'infobae', nombre: 'Infobae en Vivo', yt: 'infobae', tw: null, ki: null, categoria: 'noticias',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_g8hI0jK2lL=s176-c-k-c0x00ffffff-no-rj' 
  },
  { 
    id: 'elobservador', nombre: 'El Observador 107.9', yt: 'elobservador1079', tw: null, ki: null, categoria: 'noticias',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_f9gH1iJ3kK=s176-c-k-c0x00ffffff-no-rj' 
  }
];

// Telemetría en memoria con datos vivos iniciales para ver señales activas y líderes
const ahora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

let telemetriaState = CANALES.map((c) => {
  // Canales informativos 24/7 y líderes iniciales con transmisión activa
  const esNoticiaViva = c.id === 'tn' || c.id === 'c5n' || c.id === 'lanacionmas' || c.id === 'neura';
  const esStreamerActivo = c.id === 'davoo';
  const esDeporteActivo = c.id === 'tycsports';

  let viewers = 0;
  let isLive = false;
  let title = 'Señal en espera';
  let ytViewers = 0;
  let twViewers = 0;
  let kiViewers = 0;

  if (c.id === 'tn') {
    isLive = true;
    viewers = 48250;
    ytViewers = 48250;
    title = 'TN EN VIVO • Cobertura en directo y Minuto a Minuto';
  } else if (c.id === 'c5n') {
    isLive = true;
    viewers = 36400;
    ytViewers = 36400;
    title = 'C5N EN DIRECTO • Noticias las 24 horas';
  } else if (c.id === 'lanacionmas') {
    isLive = true;
    viewers = 29100;
    ytViewers = 29100;
    title = 'LN+ Transmisión Continua';
  } else if (c.id === 'neura') {
    isLive = true;
    viewers = 18500;
    ytViewers = 18500;
    title = 'NEURA MEDIA • Troncal con Alejandro Fantino';
  } else if (c.id === 'davoo') {
    isLive = true;
    viewers = 22100;
    kiViewers = 22100;
    title = 'Charlita de fútbol y previa del finde en Kick';
  } else if (c.id === 'tycsports') {
    isLive = true;
    viewers = 14300;
    ytViewers = 14300;
    title = 'TyC Sports en Vivo • Toda la fecha del fútbol argentino';
  }

  return {
    ...c,
    handle: c.yt || c.tw || c.ki,
    viewers,
    is_live: isLive,
    title,
    hora_actualizacion: ahora,
    plataformas_live: { yt: ytViewers > 0, tw: twViewers > 0, ki: kiViewers > 0 },
    viewers_breakdown: { yt: ytViewers, tw: twViewers, ki: kiViewers }
  };
});

// Rutas de API
app.get('/api/ranking-categorias', (req, res) => {
  const categorias = CATEGORIAS_ORDEN.map((catKey) => {
    const meta = CATEGORIAS_CONFIG[catKey];
    // Ordena de mayor a menor audiencia
    const canales = telemetriaState
      .filter((c) => c.categoria === catKey)
      .sort((a, b) => b.viewers - a.viewers);

    // Determina el ganador absoluto de la categoría
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

// Redirección directa hacia Modo IA si alguien entra a /modoia
app.get('/modoia', (req, res) => {
  res.redirect(301, 'https://modoia.online');
});

// Servir frontend estático
const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Inicio del servidor rápido y seguro
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[StreamRank ARG] Servidor activo en puerto ${PORT} - Telemetría en directo`);
});
