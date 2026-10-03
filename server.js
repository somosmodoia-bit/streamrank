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

// 1. Healthcheck inmediato
app.get('/health', (req, res) => res.status(200).send('OK'));

// 2. Canales completos
const CANALES = [
  // ENTRETENIMIENTO
  { id: 'luzutv', nombre: 'LUZU TV', yt: 'luzutv', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'olga', nombre: 'OLGA', yt: 'olgaenvivo_', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'blender', nombre: 'Blender', yt: 'somosblender', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'gelatina', nombre: 'Gelatina', yt: 'somosgelatina', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'vorterix', nombre: 'Vorterix', yt: 'VorterixOficial', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'bondilive', nombre: 'Bondi Live', yt: 'bondi_liveok', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'lacasastreaming', nombre: 'La Casa Streaming', yt: 'somoslacasa', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'unpocoderuido', nombre: 'Un Poco de Ruido', yt: 'unpocoderuido', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'loftstream', nombre: 'Loft Stream', yt: 'loftstream', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'republicaz', nombre: 'República Z', yt: 'RepublicaZ', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'posdata', nombre: 'Posdata', yt: 'posdatastream', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'telefe', nombre: 'Telefe Streams (Oficial)', yt: 'telefe', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'eltrece', nombre: 'eltrece', yt: 'eltrece', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },
  { id: 'americatv', nombre: 'América TV', yt: 'americaenvivo', tw: null, ki: null, categoria: 'entretenimiento', plataforma: 'youtube' },

  // DEPORTES
  { id: 'programa412', nombre: '412 Fútbol (Davoo & La Cobra)', yt: 'programa412', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'azzstream', nombre: 'AZZ Stream (Flavio Azzaro)', yt: 'FlavioAzzaroOK', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'picadotv', nombre: 'Picado TV', yt: 'picadotv', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'tycsports', nombre: 'TyC Sports', yt: 'TyCSportsOficial', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'espnarg', nombre: 'ESPN Argentina', yt: 'espnargentina', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'foxsportsarg', nombre: 'Fox Sports Argentina', yt: 'FoxSportsArg', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'tntsportsarg', nombre: 'TNT Sports Argentina', yt: 'TNTSportsAR', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'dsports', nombre: 'DSports / DGO', yt: 'DIRECTVSports', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },
  { id: 'carrozza', nombre: 'Pablo Carrozza', yt: 'PabloCarrozza', tw: null, ki: null, categoria: 'deportes', plataforma: 'youtube' },

  // STREAMERS
  { id: 'martincirio', nombre: 'Martín Cirio (La Faraona)', yt: 'MartinCirio', tw: null, ki: null, categoria: 'streamers', plataforma: 'youtube' },
  { id: 'davoo', nombre: 'Davoo Xeneize', yt: null, tw: null, ki: 'davoo_xeneize', categoria: 'streamers', plataforma: 'kick' },
  { id: 'lacobra', nombre: 'La Cobra', yt: null, tw: null, ki: 'lacobra', categoria: 'streamers', plataforma: 'kick' },
  { id: 'spreen', nombre: 'Spreen', yt: null, tw: null, ki: 'spreen', categoria: 'streamers', plataforma: 'kick' },
  { id: 'luquitas', nombre: 'Luquitas Rodríguez', yt: null, tw: 'luquitasrodriguez', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'coscu', nombre: 'Coscu', yt: null, tw: null, ki: 'coscu', categoria: 'streamers', plataforma: 'kick' },
  { id: 'kunaguero', nombre: 'Sergio Kun Agüero', yt: null, tw: 'slakun10', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'momo', nombre: 'Momo (Gerónimo Benavides)', yt: null, tw: null, ki: 'momoladinastia', categoria: 'streamers', plataforma: 'kick' },
  { id: 'brunenger', nombre: 'Brunenger', yt: null, tw: null, ki: 'brunenger', categoria: 'streamers', plataforma: 'kick' },
  { id: 'goncho', nombre: 'Goncho Banzas', yt: null, tw: 'goncho', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'robergalati', nombre: 'Rober Galati', yt: null, tw: 'robergalati', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'santutu', nombre: 'Santutu', yt: null, tw: 'santutu', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'bananirou', nombre: 'Bananirou', yt: null, tw: 'bananirou', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'boffegp', nombre: 'Boffe GP', yt: 'BoffeGP', tw: null, ki: null, categoria: 'streamers', plataforma: 'youtube' },
  { id: 'litkillah', nombre: 'Lit Killah', yt: null, tw: 'litkillah', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'frankkaster', nombre: 'Frankkaster', yt: null, tw: 'frankkaster', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'markitonavaja', nombre: 'Markito Navaja', yt: null, tw: 'markitonavaja', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'joacolopez', nombre: 'Joaco López', yt: null, tw: 'joacolopez', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'pimpeano', nombre: 'Pimpeano', yt: null, tw: 'pimpeano', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'teodelia', nombre: "Teo D'Elía", yt: null, tw: 'teodelia', ki: null, categoria: 'streamers', plataforma: 'twitch' },
  { id: 'benitosdr', nombre: 'Benito SDR', yt: null, tw: null, ki: 'benitosdr', categoria: 'streamers', plataforma: 'kick' },
  { id: 'laagusneta', nombre: 'LaAgusneta', yt: null, tw: null, ki: 'laagusneta', categoria: 'streamers', plataforma: 'kick' },

  // FINANZAS
  { id: 'neura', nombre: 'Neura Media / Troncal', yt: 'neuramedia', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },
  { id: 'canale', nombre: 'Canal E (Económico)', yt: 'canaleperfil', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },
  { id: 'elcronista', nombre: 'El Cronista TV', yt: 'CronistaComercial', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },
  { id: 'ambitofinanciero', nombre: 'Ámbito Financiero', yt: 'AmbitoFinanciero', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },
  { id: 'bullmarket', nombre: 'Bull Market Brokers', yt: 'bullmarketbrokers', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },
  { id: 'joveninversor', nombre: 'Joven Inversor', yt: 'JovenInversor', tw: null, ki: null, categoria: 'finanzas', plataforma: 'youtube' },

  // NOTICIAS
  { id: 'tn', nombre: 'TN (Todo Noticias)', yt: 'todonoticias', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'c5n', nombre: 'C5N', yt: 'c5n', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'lanacionmas', nombre: 'La Nación +', yt: 'lanacionmas', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'carajostream', nombre: 'Carajo Stream', yt: 'carajostream', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'eldestape', nombre: 'El Destape', yt: 'eldestapeweb', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'a24', nombre: 'A24', yt: 'A24com', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'infobae', nombre: 'Infobae en Vivo', yt: 'infobae', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'elobservador', nombre: 'El Observador 107.9', yt: 'elobservador1079', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'radiomitre', nombre: 'Radio Mitre', yt: 'radiomitre', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'urbanaplay', nombre: 'Urbana Play 104.3', yt: 'UrbanaPlayFM', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'la100', nombre: 'La 100', yt: 'La100FM', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' },
  { id: 'futurock', nombre: 'Futurock', yt: 'futurockfm', tw: null, ki: null, categoria: 'noticias', plataforma: 'youtube' }
];

const CATEGORIAS_CONFIG = {
  entretenimiento: { nombre: 'Entretenimiento', banner: 'PAUTA PREMIUM ENTRETENIMIENTO • info@modoia.online', bannerColor: 'from-purple-950/80 via-slate-900 to-indigo-950/80', borderColor: 'border-purple-500/30' },
  deportes: { nombre: 'Deportes', banner: 'ESPACIO PUBLICITARIO DEPORTES • info@modoia.online', bannerColor: 'from-emerald-950/80 via-slate-900 to-green-950/80', borderColor: 'border-emerald-500/30' },
  streamers: { nombre: 'Streamers', banner: 'SPONSOR CREATIVO • info@modoia.online', bannerColor: 'from-cyan-950/80 via-slate-900 to-blue-950/80', borderColor: 'border-cyan-500/30' },
  finanzas: { nombre: 'Economía & Finanzas', banner: 'PAUTA FINANCIERA & BROKERS • info@modoia.online', bannerColor: 'from-amber-950/80 via-slate-900 to-yellow-950/80', borderColor: 'border-amber-500/30' },
  noticias: { nombre: 'Noticias & Actualidad', banner: 'MEDIOS & NOTICIAS • info@modoia.online', bannerColor: 'from-rose-950/80 via-slate-900 to-red-950/80', borderColor: 'border-rose-500/30' }
};

const CATEGORIAS_ORDEN = ['entretenimiento', 'deportes', 'streamers', 'finanzas', 'noticias'];

let telemetriaState = CANALES.map((c) => ({
  ...c,
  handle: c.yt || c.tw || c.ki,
  viewers: 0,
  is_live: false,
  title: 'Señal en espera',
  hora_actualizacion: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  plataformas_live: { yt: false, tw: false, ki: false },
  viewers_breakdown: { yt: 0, tw: 0, ki: 0 }
}));

// Scrapers con timeout estricto de 2.5s para no trabar jamás el servidor
async function scrapeYouTubeLive(handle) {
  if (!handle) return { is_live: false, viewers: 0, title: 'Señal en espera' };
  try {
    const res = await axios.get(`https://www.youtube.com/@${handle}/live`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 2500
    });
    const html = res.data;
    if (html.includes('"status":"UPCOMING"')) return { is_live: false, viewers: 0, title: 'Transmisión programada' };

    let viewers = 0;
    const m = html.match(/"concurrentViewers":\s*"(\d+)"/) || html.match(/\\"concurrentViewers\\":\s*\\"(\d+)\\"/);
    if (m) viewers = parseInt(m[1], 10) || 0;

    if (viewers <= 5 && !html.includes('"isLive":true')) {
      return { is_live: false, viewers: 0, title: 'Señal en espera' };
    }

    let title = '';
    const tm = html.match(/([^<]*)<\/title>/);
    if (tm && tm[1]) title = tm[1].replace(' - YouTube', '').trim();
    if (!title || title.toLowerCase().includes('canal fuera de l')) title = 'Transmisión en directo';

    return { is_live: true, viewers, title };
  } catch (err) {
    return { is_live: false, viewers: 0, title: 'Señal en espera' };
  }
}

async function scrapeTwitchLive(login) {
  if (!login) return { is_live: false, viewers: 0, title: 'Señal en espera' };
  try {
    const res = await axios.post(
      'https://gql.twitch.tv/gql',
      {
        query: `query GetStreamInfo(\(login: String!) { user(login:\)login) { stream { viewersCount title } } }`,
        variables: { login }
      },
      { headers: { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko' }, timeout: 2500 }
    );
    const stream = res.data?.data?.user?.stream;
    if (stream && (stream.viewersCount || 0) > 3) {
      return { is_live: true, viewers: stream.viewersCount, title: stream.title || 'En vivo en Twitch' };
    }
    return { is_live: false, viewers: 0, title: 'Señal en espera' };
  } catch (err) {
    return { is_live: false, viewers: 0, title: 'Señal en espera' };
  }
}

async function scrapeKickLive(slug) {
  if (!slug) return { is_live: false, viewers: 0, title: 'Señal en espera' };
  try {
    const res = await axios.get(`https://kick.com/api/v2/channels/${slug}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 2500
    });
    if (res.data?.livestream?.is_live && res.data.livestream.viewer_count > 3) {
      return { is_live: true, viewers: res.data.livestream.viewer_count, title: res.data.livestream.session_title || 'En vivo en Kick' };
    }
    return { is_live: false, viewers: 0, title: 'Señal en espera' };
  } catch (err) {
    return { is_live: false, viewers: 0, title: 'Señal en espera' };
  }
}

// Scrapea de a 1 canal por vez para mantener la CPU en 1%
let scrapeandoActualmente = false;
async function cicloTelemetriaUltraSeguro() {
  if (scrapeandoActualmente) return;
  scrapeandoActualmente = true;

  for (let i = 0; i < CANALES.length; i++) {
    const c = CANALES[i];
    try {
      let yt = { is_live: false, viewers: 0, title: '' };
      let tw = { is_live: false, viewers: 0, title: '' };
      let ki = { is_live: false, viewers: 0, title: '' };

      if (c.yt) yt = await scrapeYouTubeLive(c.yt);
      if (c.tw) tw = await scrapeTwitchLive(c.tw);
      if (c.ki) ki = await scrapeKickLive(c.ki);

      const total = (yt.viewers || 0) + (tw.viewers || 0) + (ki.viewers || 0);
      const isLive = yt.is_live || tw.is_live || ki.is_live;
      const title = (yt.is_live && yt.title) || (tw.is_live && tw.title) || (ki.is_live && ki.title) || 'Señal en espera';

      telemetriaState[i] = {
        ...telemetriaState[i],
        viewers: total,
        is_live: isLive,
        title: title,
        hora_actualizacion: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        plataformas_live: { yt: yt.is_live, tw: tw.is_live, ki: ki.is_live },
        viewers_breakdown: { yt: yt.viewers, tw: tw.viewers, ki: ki.viewers }
      };
    } catch (e) {}

    // Pausa entre canales para que Express respire siempre
    await new Promise((r) => setTimeout(r, 600));
  }
  scrapeandoActualmente = false;
}

// Rutas de API
app.get('/api/ranking-categorias', (req, res) => {
  const categorias = CATEGORIAS_ORDEN.map((catKey) => {
    const meta = CATEGORIAS_CONFIG[catKey];
    const canales = telemetriaState
      .filter((c) => c.categoria === catKey)
      .sort((a, b) => b.viewers - a.viewers);

    return {
      id: catKey,
      nombre: meta.nombre,
      banner: meta.banner,
      bannerColor: meta.bannerColor,
      borderColor: meta.borderColor,
      lider: canales.length > 0 && canales[0].viewers > 0 ? canales[0] : null,
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
  res.json({ status: 'ok', channels: telemetriaState.length });
});

app.get('/api/descargar-analytics', (req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send('Canal,Estado\nLuzu,OK');
});

// Frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicio del servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[StreamRank ARG] Servidor activo en puerto ${PORT}`);
  // Comienza a scrapear recién 10 segundos después del arranque
  setTimeout(() => {
    cicloTelemetriaUltraSeguro();
    setInterval(cicloTelemetriaUltraSeguro, 60000);
  }, 10000);
});
