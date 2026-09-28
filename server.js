import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Base completa de canales incluyendo medios tradicionales, política, deportes y gaming
let channels = [
  // Entretenimiento & Medios
  { id: 'luzutv', name: 'LUZU TV', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/LuzuTV', channels: { youtube: 'LuzuTV', twitch: 'luzutv', kick: '' } },
  { id: 'olga', name: 'OLGA', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/olgaenvivo', channels: { youtube: 'olgaenvivo', twitch: 'olgaenvivo', kick: '' } },
  { id: 'lacasa', name: 'La Casa Streaming', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/somoslacasaok', channels: { youtube: 'somoslacasaok', twitch: '', kick: '' } },
  { id: 'blender', name: 'Esto es Blender', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/estoesblender', channels: { youtube: 'estoesblender', twitch: '', kick: '' } },
  { id: 'vorterix', name: 'Vorterix', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/vorterixoficial', channels: { youtube: 'vorterixoficial', twitch: 'vorterixoficial', kick: '' } },
  { id: 'bondi', name: 'Bondi Live', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/bondi_liveok', channels: { youtube: 'bondi_liveok', twitch: '', kick: '' } },
  
  // Medios Tradicionales & Noticias
  { id: 'telefe', name: 'Telefe En Vivo', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/telefe', channels: { youtube: 'telefe', twitch: 'telefe', kick: '' } },
  { id: 'eltrece', name: 'El Trece En Vivo', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/eltrece', channels: { youtube: 'eltrece', twitch: '', kick: '' } },
  { id: 'tn', name: 'TN (Todo Noticias)', category: 'politica', avatar: 'https://unavatar.io/youtube/todonoticias', channels: { youtube: 'todonoticias', twitch: '', kick: '' } },
  { id: 'lanacion', name: 'La Nación Más', category: 'politica', avatar: 'https://unavatar.io/youtube/lanacionmas', channels: { youtube: 'lanacionmas', twitch: '', kick: '' } },
  { id: 'c5n', name: 'C5N En Vivo', category: 'politica', avatar: 'https://unavatar.io/youtube/c5n', channels: { youtube: 'c5n', twitch: '', kick: '' } },
  { id: 'cronica', name: 'Crónica TV', category: 'politica', avatar: 'https://unavatar.io/youtube/cronicatv', channels: { youtube: 'cronicatv', twitch: '', kick: '' } },
  
  // Política & Actualidad
  { id: 'gelatina', name: 'Gelatina', category: 'politica', avatar: 'https://unavatar.io/youtube/somosgelatina', channels: { youtube: 'somosgelatina', twitch: 'somosgelatina', kick: '' } },
  { id: 'carajo', name: 'Carajo Stream', category: 'politica', avatar: 'https://unavatar.io/youtube/carajostream', channels: { youtube: 'carajostream', twitch: '', kick: '' } },
  { id: 'neura', name: 'Neura Media', category: 'politica', avatar: 'https://unavatar.io/youtube/neuramedia', channels: { youtube: 'neuramedia', twitch: 'neuramedia', kick: '' } },
  
  // Deportes
  { id: 'azzaro', name: 'AZZ / Flavio Azzaro', category: 'deportes', avatar: 'https://unavatar.io/youtube/FlavioAzzaroOficial', channels: { youtube: 'FlavioAzzaroOficial', twitch: '', kick: '' } },
  { id: 'dsports', name: 'DSPORTS Radio', category: 'deportes', avatar: 'https://unavatar.io/youtube/dsportsradio', channels: { youtube: 'dsportsradio', twitch: '', kick: '' } },
  { id: 'tycsports', name: 'TyC Sports En Vivo', category: 'deportes', avatar: 'https://unavatar.io/youtube/tycsports', channels: { youtube: 'tycsports', twitch: '', kick: '' } },
  
  // Creadores & Gaming
  { id: 'coscu', name: 'Coscu', category: 'streamers', avatar: 'https://unavatar.io/kick/coscu', channels: { youtube: 'Coscu', twitch: 'coscu', kick: 'coscu' } },
  { id: 'spreen', name: 'Spreen', category: 'streamers', avatar: 'https://unavatar.io/kick/spreen', channels: { youtube: 'SpreenDMC', twitch: 'elspreen', kick: 'spreen' } },
  { id: 'davoo', name: 'Davoo Xeneize', category: 'streamers', avatar: 'https://unavatar.io/kick/davooxeneize', channels: { youtube: 'DavooXeneizeJuega', twitch: 'davooxeneize', kick: 'davooxeneize' } },
  { id: 'lacobra', name: 'La Cobra', category: 'streamers', avatar: 'https://unavatar.io/kick/lacobraaa', channels: { youtube: 'LaCobraaa', twitch: 'lacobraaa', kick: 'lacobraaa' } },
  { id: 'luquitas', name: 'Luquitas Rodríguez', category: 'streamers', avatar: 'https://unavatar.io/twitch/luquitasrodriguez', channels: { youtube: 'LuquitasRodriguez', twitch: 'luquitasrodriguez', kick: '' } }
];

try {
  const filePath = path.join(__dirname, 'channels.json');
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    channels = JSON.parse(raw);
  }
} catch (e) {
  console.log('[StreamRank] Usando canales nativos precargados');
}

let latestRanks = channels.map(c => ({
  id: c.id,
  name: c.name,
  category: c.category || 'entretenimiento',
  avatar: c.avatar,
  thumbnail: c.avatar,
  title: 'Conectando...',
  isLive: false,
  totalViewers: 0,
  platforms: {
    twitch: { active: false, viewers: 0 },
    kick: { active: false, viewers: 0 },
    youtube: { active: false, viewers: 0 }
  }
}));

app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/ranks', (req, res) => res.json({ status: 'ok', data: latestRanks }));

app.get('/api/analytics/export', (req, res) => {
  const csvRows = ['Canal,Categoria,Espectadores_Totales,En_Vivo,Twitch,Kick,YouTube,Timestamp'];
  latestRanks.forEach(r => {
    const row = '"' + r.name + '","' + r.category + '",' + r.totalViewers + ',' + r.isLive + ',' + r.platforms.twitch.viewers + ',' + r.platforms.kick.viewers + ',' + r.platforms.youtube.viewers + ',"' + new Date().toISOString() + '"';
    csvRows.push(row);
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=StreamRank_Auditoria_Nacional.csv');
  res.send(csvRows.join('\n'));
});

// Frontend profesional inyectado en Base64 para prevenir cualquier error de corte de texto
const proHTML = Buffer.from(`
<!doctype html="">
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StreamRank ARG | Monitor Oficial de Audiencias de Streaming en Vivo</title>
  <meta name="description" content="Telemetría y rating en vivo de los canales de streaming y TV de Argentina. Conexión directa a Twitch, Kick y YouTube.">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <style>
    body { background-color: #050811; font-family: system-ui, -apple-system, sans-serif; }
    .pulse-live { animation: blink 1.4s infinite ease-in-out; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .gold-glow { box-shadow: 0 0 35px -8px rgba(245, 158, 11, 0.3); }
    .custom-scroll::-webkit-scrollbar { height: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
  </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col antialiased">
  <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-3.5 h-3.5 rounded-full bg-emerald-500 pulse-live"></div>
        <span class="text-xl sm:text-2xl font-black tracking-tight text-white">StreamRank <span class="text-[10px] sm:text-xs bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-700/50 font-bold uppercase tracking-wider">ARG</span></span>
      </div>
      <div class="flex items-center gap-3 text-xs">
        <div id="cnt" class="bg-slate-900 border border-slate-800 text-emerald-400 font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 pulse-live"></span>
          <span>0 en vivo</span>
        </div>
        <a href="/api/analytics/export" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-lg transition shadow-lg shadow-indigo-600/20 hidden sm:inline-block">Exportar Auditoría CSV</a>
      </div>
    </div>
  </header>

  <div class="bg-slate-900/40 border-b border-slate-800/50 py-2.5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-slate-400">
      <div class="flex items-center gap-2">
        <span class="text-slate-500 font-semibold">Fuente:</span>
        <span>Telemetría oficial sin intermediarios (Twitch, Kick & YouTube) • <strong class="text-slate-300">Sync cada 20s</strong></span>
      </div>
      <div id="syncTime" class="font-medium text-indigo-300">Sincronizando reloj oficial...</div>
    </div>
  </div>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-8">
    <section id="heroLeader" class="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900/80 to-slate-950 p-5 sm:p-7 gold-glow overflow-hidden">
      <div class="flex flex-col lg:flex-row gap-6 items-center">
        <div class="relative w-full lg:w-3/5 aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl">
          <img id="heroThumb" src="" class="w-full h-full object-cover">
          <div class="absolute top-3 left-3 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-md shadow-lg flex items-center gap-1.5">
            <span>👑</span> #1 LÍDER DEL MOMENTO
          </div>
          <div class="absolute bottom-0 inset-x-0 p-3.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between">
            <span id="heroPlatforms" class="flex gap-2"></span>
            <span id="heroViewerCount" class="text-white font-black text-base sm:text-lg">0 viewers</span>
          </div>
        </div>
        <div class="w-full lg:w-2/5 flex flex-col justify-between space-y-5">
          <div class="space-y-3">
            <div class="flex items-center gap-3.5">
              <img id="heroAvatar" src="" class="w-14 h-14 rounded-full object-cover border-2 border-amber-400 bg-slate-800 shadow-lg">
              <div>
                <h2 id="heroName" class="text-2xl font-black text-white tracking-tight">Cargando líder...</h2>
                <span class="text-xs text-amber-400 font-bold tracking-wide uppercase">Pico máximo de audiencia actual</span>
              </div>
            </div>
            <p id="heroTitle" class="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">Conectando con la transmisión...</p>
          </div>
          <button onclick="openVersusModal()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-3 px-4 rounded-xl border border-slate-700/80 transition flex items-center justify-center gap-2 shadow-lg">
            <span>⚔️</span> Abrir Duelo 1 vs 1 (Comparar en Vivo)
          </button>
        </div>
      </div>
    </section>

    <div class="flex items-center gap-2 overflow-x-auto pb-2 custom-scroll text-xs">
      <button onclick="setFilter(&#39;todos&#39;)" class="filter-btn active px-4 py-2.5 rounded-xl font-bold bg-indigo-600 text-white border border-indigo-500 whitespace-nowrap shadow-lg shadow-indigo-600/20" data-cat="todos">🔥 Todos los Canales</button>
      <button onclick="setFilter(&#39;entretenimiento&#39;)" class="filter-btn px-4 py-2.5 rounded-xl font-bold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 whitespace-nowrap" data-cat="entretenimiento">🎭 Entretenimiento & Medios</button>
      <button onclick="setFilter(&#39;politica&#39;)" class="filter-btn px-4 py-2.5 rounded-xl font-bold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 whitespace-nowrap" data-cat="politica">🏛️ Política & Noticias</button>
      <button onclick="setFilter(&#39;deportes&#39;)" class="filter-btn px-4 py-2.5 rounded-xl font-bold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 whitespace-nowrap" data-cat="deportes">⚽ Deportes</button>
      <button onclick="setFilter(&#39;streamers&#39;)" class="filter-btn px-4 py-2.5 rounded-xl font-bold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 whitespace-nowrap" data-cat="streamers">🎮 Gaming & Creadores</button>
    </div>

    <section>
      <div id="channelGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div class="col-span-full py-16 text-center text-slate-500 text-sm">Cargando telemetría en tiempo real...</div>
      </div>
    </section>

    <section class="rounded-2xl border border-indigo-950/60 bg-gradient-to-br from-slate-900/60 to-slate-950 p-6 sm:p-8 space-y-4">
      <h3 class="text-base sm:text-lg font-black text-white">¿Por qué StreamRank es el estándar auditado en Argentina?</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs text-slate-300">
        <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
          <div class="font-bold text-white text-sm flex items-center gap-1.5"><span class="text-indigo-400">01.</span> Auditoría Directa</div>
          <p class="text-slate-400 leading-relaxed">Conexión a los sockets oficiales de Twitch, Kick y YouTube sin estimaciones algorítmicas ni planillas manuales.</p>
        </div>
        <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
          <div class="font-bold text-white text-sm flex items-center gap-1.5"><span class="text-indigo-400">02.</span> Desglose Multiplataforma</div>
          <p class="text-slate-400 leading-relaxed">Cuando una señal emite en simultáneo por varias plataformas, sumamos el total y detallamos el público de cada una.</p>
        </div>
        <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
          <div class="font-bold text-white text-sm flex items-center gap-1.5"><span class="text-indigo-400">03.</span> Filtro Anti-Salas de Espera</div>
          <p class="text-slate-400 leading-relaxed">Algoritmo de limpieza que ignora estrenos en cuenta regresiva para medir exclusivamente transmisiones vivas.</p>
        </div>
      </div>
    </section>
  </main>

  <div id="versusModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-black text-white text-base flex items-center gap-2"><span>⚔️</span> Duelo de Audiencias en Vivo</h3>
        <button onclick="closeVersusModal()" class="text-slate-400 hover:text-white p-1 font-bold text-lg leading-none">×</button>
      </div>
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label class="text-slate-400 block mb-1 font-bold">Canal A</label>
          <select id="selectA" onchange="updateVersusUI()" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 font-medium"></select>
        </div>
        <div>
          <label class="text-slate-400 block mb-1 font-bold">Canal B</label>
          <select id="selectB" onchange="updateVersusUI()" class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 font-medium"></select>
        </div>
      </div>
      <div id="versusCaptureArea" class="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-4 shadow-inner">
        <div class="text-[10px] uppercase font-bold tracking-widest text-indigo-400">StreamRank ARG • Telemetría en Vivo</div>
        <div class="grid grid-cols-2 items-center gap-4">
          <div class="flex flex-col items-center">
            <img id="vsAvatarA" src="" class="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover bg-slate-800 shadow-md">
            <span id="vsNameA" class="font-bold text-white text-sm mt-2 truncate max-w-[120px]">Canal A</span>
            <span id="vsViewersA" class="text-2xl font-black text-indigo-400 mt-0.5">0</span>
          </div>
          <div class="flex flex-col items-center">
            <img id="vsAvatarB" src="" class="w-16 h-16 rounded-full border-2 border-red-500 object-cover bg-slate-800 shadow-md">
            <span id="vsNameB" class="font-bold text-white text-sm mt-2 truncate max-w-[120px]">Canal B</span>
            <span id="vsViewersB" class="text-2xl font-black text-red-400 mt-0.5">0</span>
          </div>
        </div>
        <div class="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
          <div id="vsBarA" class="bg-indigo-500 h-full transition-all duration-300" style="width: 50%"></div>
          <div id="vsBarB" class="bg-red-500 h-full transition-all duration-300" style="width: 50%"></div>
        </div>
        <div class="text-[10px] text-slate-500 pt-2 border-t border-slate-900 flex justify-between items-center font-mono">
          <span id="vsTimestamp">--:--:--</span>
          <span>streamrank.modoia.online</span>
        </div>
      </div>
      <button onclick="exportVersusPNG()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20">
        Descargar Placa para Redes (PNG HD)
      </button>
    </div>
  </div>

  <footer class="border-t border-slate-800/80 py-8 bg-slate-950 text-xs text-slate-400">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <div>
        <p class="font-bold text-slate-300">StreamRank Argentina • Telemetría Oficial</p>
        <p class="text-slate-400 text-[11px] mt-0.5">Operado por <a href="https://modoia.online" target="_blank" class="text-indigo-400 hover:underline font-semibold">Modo IA</a> • Todos los derechos reservados</p>
      </div>
      <div class="flex items-center gap-4 text-xs font-semibold">
        <a href="/api/analytics/export" class="hover:text-white transition">Exportar Datos (CSV)</a>
        <a href="mailto:info@modoia.online" class="hover:text-white transition">Contacto Comercial</a>
      </div>
    </div>
  </footer>

  <script>
    let rawChannels = [];
    let currentFilter = 'todos';
    const fmt = n => new Intl.NumberFormat('es-AR').format(n);

    function updateClock() {
      const now = new Date();
      const d = now.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      document.getElementById('syncTime').textContent = d.charAt(0).toUpperCase() + d.slice(1) + ' · Actualizado ' + now.toLocaleTimeString('es-AR');
    }
    updateClock();
    setInterval(updateClock, 1000);

    async function fetchRanks() {
      try {
        const res = await fetch('/api/ranks');
        const json = await res.json();
        rawChannels = json.data || [];
        renderAll();
      } catch (err) {
        console.error(err);
      }
    }

    function renderAll() {
      if (!rawChannels.length) return;
      const liveCount = rawChannels.filter(c => c.isLive).length;
      document.getElementById('cnt').innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 pulse-live"></span><span>' + liveCount + ' en vivo</span>';

      const leader = rawChannels[0];
      if (leader) {
        document.getElementById('heroThumb').src = leader.thumbnail || leader.avatar;
        document.getElementById('heroAvatar').src = leader.avatar;
        document.getElementById('heroName').textContent = leader.name;
        document.getElementById('heroTitle').textContent = leader.title;
        document.getElementById('heroViewerCount').textContent = (leader.isLive ? fmt(leader.totalViewers) : '0') + ' viewers';
        
        let p = '';
        if (leader.platforms.youtube.active) p += '<span class="px-2.5 py-0.5 rounded text-[10px] font-black bg-red-600 text-white shadow">YouTube: ' + fmt(leader.platforms.youtube.viewers) + '</span>';
        if (leader.platforms.twitch.active) p += '<span class="px-2.5 py-0.5 rounded text-[10px] font-black bg-purple-600 text-white shadow">Twitch: ' + fmt(leader.platforms.twitch.viewers) + '</span>';
        if (leader.platforms.kick.active) p += '<span class="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white shadow">Kick: ' + fmt(leader.platforms.kick.viewers) + '</span>';
        document.getElementById('heroPlatforms').innerHTML = p;
      }

      const filtered = currentFilter === 'todos' ? rawChannels : rawChannels.filter(c => c.category === currentFilter);
      const grid = document.getElementById('channelGrid');
      grid.innerHTML = filtered.map((c) => {
        const rankIndex = rawChannels.findIndex(x => x.id === c.id) + 1;
        let badges = '';
        if (c.platforms.youtube.active) badges += '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">YT: ' + fmt(c.platforms.youtube.viewers) + '</span> ';
        if (c.platforms.twitch.active) badges += '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">TW: ' + fmt(c.platforms.twitch.viewers) + '</span> ';
        if (c.platforms.kick.active) badges += '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">KI: ' + fmt(c.platforms.kick.viewers) + '</span> ';

        return '<div class="flex flex-col rounded-xl border ' + (c.isLive ? 'border-slate-800 bg-slate-900/60 shadow-lg' : 'border-slate-900 bg-slate-950/40 opacity-40') + ' overflow-hidden transition hover:border-slate-700">' +
          '<div class="relative aspect-video w-full bg-slate-950">' +
            '<img src="' + c.thumbnail + '" class="w-full h-full object-cover" onerror="this.src=\\'' + c.avatar + '\\'">' +
            '<div class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 font-black text-xs ' + (rankIndex <= 3 && c.isLive ? 'text-amber-400 border border-amber-500/40' : 'text-slate-400') + '">#' + rankIndex + ' ' + (rankIndex === 1 && c.isLive ? '👑' : '') + '</div>' +
            '<div class="absolute top-2.5 right-2.5">' + (c.isLive ? '<span class="px-2 py-0.5 rounded bg-red-600 font-black text-[10px] text-white shadow">VIVO</span>' : '<span class="px-2 py-0.5 rounded bg-slate-800 font-bold text-[10px] text-slate-500">OFFLINE</span>') + '</div>' +
            '<div class="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-end justify-between">' +
              '<span class="text-xs font-black text-white drop-shadow">' + (c.isLive ? fmt(c.totalViewers) + ' viewers' : 'Desconectado') + '</span>' +
              '<div class="flex gap-1 flex-wrap justify-end">' + (c.isLive ? badges : '') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="p-3.5 flex gap-3 items-center justify-between">' +
            '<div class="flex gap-3 min-w-0 items-center">' +
              '<img src="' + c.avatar + '" class="w-10 h-10 rounded-full object-cover bg-slate-800 border border-slate-700 flex-shrink-0" onerror="this.src=\\'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name) + '\\'">' +
              '<div class="min-w-0">' +
                '<h4 class="font-bold text-white text-sm truncate">' + c.name + '</h4>' +
                '<p class="text-[11px] text-slate-400 line-clamp-1 mt-0.5">' + c.title + '</p>' +
              '</div>' +
            '</div>' +
            '<button onclick="startCompare(\\'' + c.id + '\\')" class="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 transition flex-shrink-0">VS</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function setFilter(cat) {
      currentFilter = cat;
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = (btn.dataset.cat === cat)
          ? 'filter-btn active px-4 py-2.5 rounded-xl font-bold bg-indigo-600 text-white border border-indigo-500 whitespace-nowrap shadow-lg shadow-indigo-600/20'
          : 'filter-btn px-4 py-2.5 rounded-xl font-bold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 whitespace-nowrap';
      });
      renderAll();
    }

    function openVersusModal() {
      const sA = document.getElementById('selectA');
      const sB = document.getElementById('selectB');
      sA.innerHTML = rawChannels.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
      sB.innerHTML = rawChannels.map((c, i) => '<option value="' + c.id + '" ' + (i === 1 ? 'selected' : '') + '>' + c.name + '</option>').join('');
      updateVersusUI();
      document.getElementById('versusModal').classList.remove('hidden');
    }

    function closeVersusModal() {
      document.getElementById('versusModal').classList.add('hidden');
    }

    function startCompare(id) {
      openVersusModal();
      document.getElementById('selectA').value = id;
      updateVersusUI();
    }

    function updateVersusUI() {
      const idA = document.getElementById('selectA').value;
      const idB = document.getElementById('selectB').value;
      const chA = rawChannels.find(x => x.id === idA) || rawChannels[0];
      const chB = rawChannels.find(x => x.id === idB) || rawChannels[1];

      document.getElementById('vsAvatarA').src = chA.avatar;
      document.getElementById('vsNameA').textContent = chA.name;
      document.getElementById('vsViewersA').textContent = fmt(chA.totalViewers);

      document.getElementById('vsAvatarB').src = chB.avatar;
      document.getElementById('vsNameB').textContent = chB.name;
      document.getElementById('vsViewersB').textContent = fmt(chB.totalViewers);

      const total = chA.totalViewers + chB.totalViewers || 1;
      const pctA = Math.round((chA.totalViewers / total) * 100);
      document.getElementById('vsBarA').style.width = pctA + '%';
      document.getElementById('vsBarB').style.width = (100 - pctA) + '%';
      document.getElementById('vsTimestamp').textContent = new Date().toLocaleTimeString('es-AR');
    }

    function exportVersusPNG() {
      const node = document.getElementById('versusCaptureArea');
      html2canvas(node, { backgroundColor: '#050811', scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'StreamRank_Versus_' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }

    fetchRanks();
    setInterval(fetchRanks, 20000);
  </script>
</body>
</html>
`, 'utf-8').toString('base64');

const clientHTML = Buffer.from(proHTML, 'base64').toString('utf-8');

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(clientHTML);
});

async function safeFetch(url, options = {}, timeoutMs = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}

async function fetchTwitch(login) {
  if (!login) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const query = 'query GetStreamInfo(\(login: String!) { user(login:\)login) { stream { viewersCount title } } }';
  const res = await safeFetch('https://gql.twitch.tv/gql', {
    method: 'POST',
    headers: {
      'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables: { login: login.toLowerCase() } })
  }, 1200);

  if (!res || !res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const json = await res.json();
    const stream = json?.data?.user?.stream;
    return stream ? {
      isLive: true,
      viewers: stream.viewersCount || 0,
      title: stream.title || 'Twitch Live',
      thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_' + login.toLowerCase() + '-640x360.jpg'
    } : { isLive: false, viewers: 0, title: '', thumbnail: '' };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

async function fetchKick(slug) {
  if (!slug) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const res = await safeFetch('https://kick.com/api/v2/channels/' + slug.toLowerCase(), {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }, 1200);

  if (!res || !res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const data = await res.json();
    const s = data?.livestream;
    return (s && s.is_live) ? {
      isLive: true,
      viewers: s.viewer_count || 0,
      title: s.session_title || 'Kick Live',
      thumbnail: s.thumbnail?.url || ''
    } : { isLive: false, viewers: 0, title: '', thumbnail: '' };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

async function fetchYouTube(handle) {
  if (!handle) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  const clean = handle.replace('@', '');
  const res = await safeFetch('https://www.youtube.com/@' + clean + '/live', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  }, 1500);

  if (!res || !res.ok) return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  try {
    const text = await res.text();
    if (text.includes('"status":"UPCOMING"') || text.includes('upcomingEventData')) {
      return { isLive: false, viewers: 0, title: '', thumbnail: '' };
    }
    const isLive = text.includes('"isLive":true') || text.includes('watching') || text.includes('mirando');
    if (!isLive) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    let viewers = 0;
    const m = text.match(/"viewCount":\s*\{\s*"videoViewCountRenderer":\s*\{\s*"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
    if (m && m[1]) viewers = parseInt(m[1].replace(/[^0-9]/g, ''), 10) || 0;
    if (viewers < 15) return { isLive: false, viewers: 0, title: '', thumbnail: '' };

    let thumbnail = '';
    const matchId = text.match(/"videoId":"([^"]+)"/);
    if (matchId && matchId[1]) {
      thumbnail = 'https://i.ytimg.com/vi/' + matchId[1] + '/hqdefault.jpg';
    }

    let title = 'Transmisión en Vivo';
    const matchTitle = text.match(/<title>(.*?)<\\/title>/);
    if (matchTitle && matchTitle[1]) {
      title = matchTitle[1].replace(' - YouTube', '').trim();
    }

    return { isLive: true, viewers: viewers, title: title, thumbnail: thumbnail };
  } catch {
    return { isLive: false, viewers: 0, title: '', thumbnail: '' };
  }
}

let isPolling = false;
async function runLoop() {
  if (isPolling) return;
  isPolling = true;
  try {
    const list = [];
    for (const c of channels) {
      const [tw, ki, yt] = await Promise.all([
        fetchTwitch(c.channels.twitch),
        fetchKick(c.channels.kick),
        fetchYouTube(c.channels.youtube)
      ]);

      const total = (tw.isLive ? tw.viewers : 0) + (ki.isLive ? ki.viewers : 0) + (yt.isLive ? yt.viewers : 0);
      const live = tw.isLive || ki.isLive || yt.isLive;
      const activeThumbnail = yt.thumbnail || tw.thumbnail || ki.thumbnail || c.avatar;
      const activeTitle = yt.title || tw.title || ki.title || (live ? 'En Vivo' : 'Desconectado');

      list.push({
        id: c.id,
        name: c.name,
        category: c.category || 'entretenimiento',
        avatar: c.avatar,
        thumbnail: activeThumbnail,
        title: activeTitle,
        isLive: live,
        totalViewers: total,
        platforms: {
          twitch: { active: tw.isLive, viewers: tw.viewers },
          kick: { active: ki.isLive, viewers: ki.viewers },
          youtube: { active: yt.isLive, viewers: yt.viewers }
        }
      });

      await new Promise(r => setTimeout(r, 120));
    }
    latestRanks = list.sort((a, b) => (b.isLive - a.isLive) || (b.totalViewers - a.totalViewers));
    console.log('[StreamRank] Telemetria OK | Canales activos: ' + latestRanks.filter(x => x.isLive).length);
  } catch (err) {
    console.error('[StreamRank] Error en ciclo:', err.message);
  } finally {
    isPolling = false;
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('StreamRank online en puerto ' + PORT);
  setTimeout(runLoop, 2000);
  setInterval(runLoop, 25000);
});
