import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// 1. HEALTHCHECK ULTRA RÁPIDO PARA UPTIMEROBOT
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 2. CONFIGURACIÓN DE CATEGORÍAS
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
    banner: 'SPONSOR CREATIVO • info@modoia.online',
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
    banner: 'MEDIOS & NOTICIAS • info@modoia.online',
    bannerColor: 'from-rose-950/80 via-slate-900 to-red-950/80',
    borderColor: 'border-rose-500/30'
  }
};

const CATEGORIAS_ORDEN = ['entretenimiento', 'deportes', 'streamers', 'finanzas', 'noticias'];

// 3. BASE DE DATOS DE CANALES CON TELEMETRÍA BASE ESTABLE
const CANALES = [
  // --- ENTRETENIMIENTO ---
  { id: 'luzutv', nombre: 'LUZU TV', yt: 'luzutv', tw: null, ki: null, categoria: 'entretenimiento', viewers: 42150, is_live: true, title: 'NADIE DICE NADA • EN VIVO' },
  { id: 'olga', nombre: 'OLGA', yt: 'olgaenvivo_', tw: null, ki: null, categoria: 'entretenimiento', viewers: 36400, is_live: true, title: 'SERÍA INCREÍBLE • EN DIRECTO' },
  { id: 'blender', nombre: 'Blender', yt: 'somosblender', tw: null, ki: null, categoria: 'entretenimiento', viewers: 11200, is_live: true, title: 'HAY ALGO AHÍ • TRANSMISIÓN OFICIAL' },
  { id: 'gelatina', nombre: 'Gelatina', yt: 'somosgelatina', tw: null, ki: null, categoria: 'entretenimiento', viewers: 8900, is_live: true, title: 'GELATINA EN DIRECTO' },
  { id: 'vorterix', nombre: 'Vorterix', yt: 'VorterixOficial', tw: null, ki: null, categoria: 'entretenimiento', viewers: 4500, is_live: false, title: 'Señal en espera' },
  { id: 'bondilive', nombre: 'Bondi Live', yt: 'bondi_liveok', tw: null, ki: null, categoria: 'entretenimiento', viewers: 3200, is_live: false, title: 'Señal en espera' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', yt: 'somoslacasa', tw: null, ki: null, categoria: 'entretenimiento', viewers: 2100, is_live: false, title: 'Señal en espera' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', yt: 'unpocoderuido', tw: null, ki: null, categoria: 'entretenimiento', viewers: 18500, is_live: false, title: 'Señal en espera' },
  { id: 'loftstream', nombre: 'Loft Stream', yt: 'loftstream', tw: null, ki: null, categoria: 'entretenimiento', viewers: 1200, is_live: false, title: 'Señal en espera' },
  { id: 'republicaz', nombre: 'República Z', yt: 'RepublicaZ', tw: null, ki: null, categoria: 'entretenimiento', viewers: 1900, is_live: false, title: 'Señal en espera' },
  { id: 'posdata', nombre: 'Posdata', yt: 'posdatastream', tw: null, ki: null, categoria: 'entretenimiento', viewers: 850, is_live: false, title: 'Señal en espera' },
  { id: 'telefe', nombre: 'Telefe Streams (Oficial)', yt: 'telefe', tw: null, ki: null, categoria: 'entretenimiento', viewers: 9400, is_live: true, title: 'STREAMING OFICIAL TELEFE' },
  { id: 'eltrece', nombre: 'eltrece', yt: 'eltrece', tw: null, ki: null, categoria: 'entretenimiento', viewers: 3100, is_live: false, title: 'Señal en espera' },
  { id: 'americatv', nombre: 'América TV', yt: 'americaenvivo', tw: null, ki: null, categoria: 'entretenimiento', viewers: 2600, is_live: false, title: 'Señal en espera' },

  // --- DEPORTES ---
  { id: 'azzstream', nombre: 'AZZ Stream (Flavio Azzaro)', yt: 'FlavioAzzaroOK', tw: null, ki: null, categoria: 'deportes', viewers: 28400, is_live: true, title: 'EL LOCO Y EL CUERDO EN DIRECTO' },
  { id: 'programa412', nombre: '412 Fútbol (Davoo & La Cobra)', yt: 'programa412', tw: null, ki: null, categoria: 'deportes', viewers: 22100, is_live: true, title: 'DEBATE FUTBOLERO OFICIAL' },
  { id: 'picadotv', nombre: 'Picado TV', yt: 'picadotv', tw: null, ki: null, categoria: 'deportes', viewers: 5100, is_live: false, title: 'Señal en espera' },
  { id: 'tycsports', nombre: 'TyC Sports', yt: 'TyCSportsOficial', tw: null, ki: null, categoria: 'deportes', viewers: 14200, is_live: true, title: 'LÍBERO / TYC SPORTS EN VIVO' },
  { id: 'espnarg', nombre: 'ESPN Argentina', yt: 'espnargentina', tw: null, ki: null, categoria: 'deportes', viewers: 16800, is_live: true, title: 'F90 ESPN EN DIRECTO' },
  { id: 'foxsportsarg', nombre: 'Fox Sports Argentina', yt: 'FoxSportsArg', tw: null, ki: null, categoria: 'deportes', viewers: 3400, is_live: false, title: 'Señal en espera' },
  { id: 'tntsportsarg', nombre: 'TNT Sports Argentina', yt: 'TNTSportsAR', tw: null, ki: null, categoria: 'deportes', viewers: 2900, is_live: false, title: 'Señal en espera' },
  { id: 'dsports', nombre: 'DSports / DGO', yt: 'DIRECTVSports', tw: null, ki: null, categoria: 'deportes', viewers: 4100, is_live: false, title: 'Señal en espera' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', yt: 'PabloCarrozza', tw: null, ki: null, categoria: 'deportes', viewers: 9700, is_live: true, title: 'REACCIÓN EN VIVO CARROZZA' },

  // --- STREAMERS ---
  { id: 'davoo', nombre: 'Davoo Xeneize', yt: null, tw: null, ki: 'davoo_xeneize', categoria: 'streamers', viewers: 31500, is_live: true, title: 'ANALIZANDO EL FÚTBOL ARGENTINO' },
  { id: 'lacobra', nombre: 'La Cobra', yt: null, tw: null, ki: 'lacobra', categoria: 'streamers', viewers: 24300, is_live: true, title: 'STREAM EN KICK • PRENDIDO' },
  { id: 'spreen', nombre: 'Spreen', yt: null, tw: null, ki: 'spreen', categoria: 'streamers', viewers: 19800, is_live: true, title: 'EN VIVO SPREEN' },
  { id: 'luquitas', nombre: 'Luquitas Rodríguez', yt: null, tw: 'luquitasrodriguez', ki: null, categoria: 'streamers', viewers: 14200, is_live: true, title: 'PRENDIDO EN TWITCH' },
  { id: 'martincirio', nombre: 'Martín Cirio (La Faraona)', yt: 'MartinCirio', tw: null, ki: null, categoria: 'streamers', viewers: 18100, is_live: true, title: 'STREAM OFICIAL LA FARAONA' },
  { id: 'coscu', nombre: 'Coscu', yt: null, tw: null, ki: 'coscu', categoria: 'streamers', viewers: 8700, is_live: false, title: 'Señal en espera' },
  { id: 'kunaguero', nombre: 'Sergio Kun Agüero', yt: null, tw: 'slakun10', ki: null, categoria: 'streamers', viewers: 6200, is_live: false, title: 'Señal en espera' },
  { id: 'momo', nombre: 'Momo (Gerónimo Benavides)', yt: null, tw: null, ki: 'momoladinastia', categoria: 'streamers', viewers: 4800, is_live: false, title: 'Señal en espera' },
  { id: 'brunenger', nombre: 'Brunenger', yt: null, tw: null, ki: 'brunenger', categoria: 'streamers', viewers: 3900, is_live: false, title: 'Señal en espera' },
  { id: 'goncho', nombre: 'Goncho Banzas', yt: null, tw: 'goncho', ki: null, categoria: 'streamers', viewers: 2700, is_live: false, title: 'Señal en espera' },
  { id: 'robergalati', nombre: 'Rober Galati', yt: null, tw: 'robergalati', ki: null, categoria: 'streamers', viewers: 2100, is_live: false, title: 'Señal en espera' },
  { id: 'santutu', nombre: 'Santutu', yt: null, tw: 'santutu', ki: null, categoria: 'streamers', viewers: 1800, is_live: false, title: 'Señal en espera' },
  { id: 'bananirou', nombre: 'Bananirou', yt: null, tw: 'bananirou', ki: null, categoria: 'streamers', viewers: 5400, is_live: true, title: 'SPEEDRUN EN VIVO' },
  { id: 'boffegp', nombre: 'Boffe GP', yt: 'BoffeGP', tw: null, ki: null, categoria: 'streamers', viewers: 3100, is_live: false, title: 'Señal en espera' },
  { id: 'litkillah', nombre: 'Lit Killah', yt: null, tw: 'litkillah', ki: null, categoria: 'streamers', viewers: 1500, is_live: false, title: 'Señal en espera' },
  { id: 'frankkaster', nombre: 'Frankkaster', yt: null, tw: 'frankkaster', ki: null, categoria: 'streamers', viewers: 1200, is_live: false, title: 'Señal en espera' },
  { id: 'markitonavaja', nombre: 'Markito Navaja', yt: null, tw: 'markitonavaja', ki: null, categoria: 'streamers', viewers: 950, is_live: false, title: 'Señal en espera' },
  { id: 'joacolopez', nombre: 'Joaco López', yt: null, tw: 'joacolopez', ki: null, categoria: 'streamers', viewers: 800, is_live: false, title: 'Señal en espera' },
  { id: 'pimpeano', nombre: 'Pimpeano', yt: null, tw: 'pimpeano', ki: null, categoria: 'streamers', viewers: 750, is_live: false, title: 'Señal en espera' },
  { id: 'teodelia', nombre: "Teo D'Elía", yt: null, tw: 'teodelia', ki: null, categoria: 'streamers', viewers: 600, is_live: false, title: 'Señal en espera' },
  { id: 'benitosdr', nombre: 'Benito SDR', yt: null, tw: null, ki: 'benitosdr', categoria: 'streamers', viewers: 500, is_live: false, title: 'Señal en espera' },
  { id: 'laagusneta', nombre: 'LaAgusneta', yt: null, tw: null, ki: 'laagusneta', categoria: 'streamers', viewers: 450, is_live: false, title: 'Señal en espera' },

  // --- FINANZAS ---
  { id: 'neura', nombre: 'Neura Media / Troncal', yt: 'neuramedia', tw: null, ki: null, categoria: 'finanzas', viewers: 27500, is_live: true, title: 'NEURA STREAM • ACTUALIDAD' },
  { id: 'bullmarket', nombre: 'Bull Market Brokers', yt: 'bullmarketbrokers', tw: null, ki: null, categoria: 'finanzas', viewers: 8300, is_live: true, title: 'CIERRE DE MERCADOS EN DIRECTO' },
  { id: 'joveninversor', nombre: 'Joven Inversor', yt: 'JovenInversor', tw: null, ki: null, categoria: 'finanzas', viewers: 6100, is_live: false, title: 'Señal en espera' },
  { id: 'elcronista', nombre: 'El Cronista TV', yt: 'CronistaComercial', tw: null, ki: null, categoria: 'finanzas', viewers: 2300, is_live: false, title: 'Señal en espera' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', yt: 'AmbitoFinanciero', tw: null, ki: null, categoria: 'finanzas', viewers: 1800, is_live: false, title: 'Señal en espera' },
  { id: 'canale', nombre: 'Canal E (Económico)', yt: 'canaleperfil', tw: null, ki: null, categoria: 'finanzas', viewers: 1200, is_live: false, title: 'Señal en espera' },

  // --- NOTICIAS ---
  { id: 'tn', nombre: 'TN (Todo Noticias)', yt: 'todonoticias', tw: null, ki: null, categoria: 'noticias', viewers: 48900, is_live: true, title: 'TN EN VIVO 24HS' },
  { id: 'c5n', nombre: 'C5N', yt: 'c5n', tw: null, ki: null, categoria: 'noticias', viewers: 41200, is_live: true, title: 'C5N EN DIRECTO' },
  { id: 'lanacionmas', nombre: 'La Nación +', yt: 'lanacionmas', tw: null, ki: null, categoria: 'noticias', viewers: 33400, is_live: true, title: 'LN+ EN VIVO' },
  { id: 'carajostream', nombre: 'Carajo Stream', yt: 'carajostream', tw: null, ki: null, categoria: 'noticias', viewers: 19100, is_live: true, title: 'CARAJO STREAM OFICIAL' },
  { id: 'eldestape', nombre: 'El Destape', yt: 'eldestapeweb', tw: null, ki: null, categoria: 'noticias', viewers: 12400, is_live: true, title: 'EL DESTAPE RADIO / TV' },
  { id: 'a24', nombre: 'A24', yt: 'A24com', tw: null, ki: null, categoria: 'noticias', viewers: 7800, is_live: false, title: 'Señal en espera' },
  { id: 'infobae', nombre: 'Infobae en Vivo', yt: 'infobae', tw: null, ki: null, categoria: 'noticias', viewers: 4500, is_live: false, title: 'Señal en espera' },
  { id: 'elobservador', nombre: 'El Observador 107.9', yt: 'elobservador1079', tw: null, ki: null, categoria: 'noticias', viewers: 5600, is_live: true, title: 'EL OBSERVADOR EN DIRECTO' },
  { id: 'radiomitre', nombre: 'Radio Mitre', yt: 'radiomitre', tw: null, ki: null, categoria: 'noticias', viewers: 9100, is_live: true, title: 'MITRE HD EN VIVO' },
  { id: 'urbanaplay', nombre: 'Urbana Play 104.3', yt: 'UrbanaPlayFM', tw: null, ki: null, categoria: 'noticias', viewers: 8400, is_live: true, title: 'URBANA PLAY STREAM' },
  { id: 'la100', nombre: 'La 100', yt: 'La100FM', tw: null, ki: null, categoria: 'noticias', viewers: 3900, is_live: false, title: 'Señal en espera' },
  { id: 'futurock', nombre: 'Futurock', yt: 'futurockfm', tw: null, ki: null, categoria: 'noticias', viewers: 2200, is_live: false, title: 'Señal en espera' }
];

// Estructura de estado en memoria
const telemetriaState = CANALES.map((c) => ({
  ...c,
  handle: c.yt || c.tw || c.ki,
  hora_actualizacion: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  plataformas_live: {
    yt: Boolean(c.yt && c.is_live),
    tw: Boolean(c.tw && c.is_live),
    ki: Boolean(c.ki && c.is_live)
  },
  viewers_breakdown: {
    yt: c.yt && c.is_live ? c.viewers : 0,
    tw: c.tw && c.is_live ? c.viewers : 0,
    ki: c.ki && c.is_live ? c.viewers : 0
  }
}));

// 4. RUTAS DE LA API
app.get('/api/ranking-categorias', (req, res) => {
  const categorias = CATEGORIAS_ORDEN.map((catKey) => {
    const meta = CATEGORIAS_CONFIG[catKey];
    const canales = telemetriaState
      .filter((c) => c.categoria === catKey)
      .sort((a, b) => b.viewers - a.viewers);

    const lider = canales.find((c) => c.is_live && c.viewers > 0) || canales[0] || null;

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

// 5. SERVIR EL FRONTEND ESTÁTICO
const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 6. INICIAR SERVIDOR
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[StreamRank ARG] Servidor activo en puerto ${PORT}`);
});
