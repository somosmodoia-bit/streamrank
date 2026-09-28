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

let channels = [
  { id: 'luzutv', name: 'LUZU TV', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/LuzuTV', channels: { youtube: 'LuzuTV', twitch: 'luzutv', kick: '' } },
  { id: 'olga', name: 'OLGA', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/olgaenvivo_', channels: { youtube: 'olgaenvivo_', twitch: 'olgaenvivo', kick: '' } },
  { id: 'lacasa', name: 'La Casa Streaming', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/somoslacasaok', channels: { youtube: 'somoslacasaok', twitch: '', kick: '' } },
  { id: 'blender', name: 'Esto es Blender', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/estoesblender', channels: { youtube: 'estoesblender', twitch: '', kick: '' } },
  { id: 'vorterix', name: 'Vorterix', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/vorterixoficial', channels: { youtube: 'vorterixoficial', twitch: 'vorterixoficial', kick: '' } },
  { id: 'bondi', name: 'Bondi Live', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/bondi_liveok', channels: { youtube: 'bondi_liveok', twitch: '', kick: '' } },
  { id: 'telefe', name: 'Telefe En Vivo', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/telefe', channels: { youtube: 'telefe', twitch: 'telefe', kick: '' } },
  { id: 'eltrece', name: 'El Trece En Vivo', category: 'entretenimiento', avatar: 'https://unavatar.io/youtube/eltrece', channels: { youtube: 'eltrece', twitch: '', kick: '' } },
  { id: 'tn', name: 'TN (Todo Noticias)', category: 'politica', avatar: 'https://unavatar.io/youtube/todonoticias', channels: { youtube: 'todonoticias', twitch: '', kick: '' } },
  { id: 'lanacion', name: 'La Nación Más', category: 'politica', avatar: 'https://unavatar.io/youtube/lanacionmas', channels: { youtube: 'lanacionmas', twitch: '', kick: '' } },
  { id: 'c5n', name: 'C5N En Vivo', category: 'politica', avatar: 'https://unavatar.io/youtube/c5n', channels: { youtube: 'c5n', twitch: '', kick: '' } },
  { id: 'cronica', name: 'Crónica TV', category: 'politica', avatar: 'https://unavatar.io/youtube/cronicatv', channels: { youtube: 'cronicatv', twitch: '', kick: '' } },
  { id: 'gelatina', name: 'Gelatina', category: 'politica', avatar: 'https://unavatar.io/youtube/somosgelatina', channels: { youtube: 'somosgelatina', twitch: 'somosgelatina', kick: '' } },
  { id: 'carajo', name: 'Carajo Stream', category: 'politica', avatar: 'https://unavatar.io/youtube/carajostream', channels: { youtube: 'carajostream', twitch: '', kick: '' } },
  { id: 'neura', name: 'Neura Media', category: 'politica', avatar: 'https://unavatar.io/youtube/neuramedia', channels: { youtube: 'neuramedia', twitch: 'neuramedia', kick: '' } },
  { id: 'azzaro', name: 'AZZ / Flavio Azzaro', category: 'deportes', avatar: 'https://unavatar.io/youtube/FlavioAzzaroOficial', channels: { youtube: 'FlavioAzzaroOficial', twitch: '', kick: '' } },
  { id: 'dsports', name: 'DSPORTS Radio', category: 'deportes', avatar: 'https://unavatar.io/youtube/dsportsradio', channels: { youtube: 'dsportsradio', twitch: '', kick: '' } },
  { id: 'tycsports', name: 'TyC Sports En Vivo', category: 'deportes', avatar: 'https://unavatar.io/youtube/tycsports', channels: { youtube: 'tycsports', twitch: '', kick: '' } },
  { id: 'coscu', name: 'Coscu', category: 'streamers', avatar: 'https://unavatar.io/kick/coscu', channels: { youtube: 'Coscu', twitch: 'coscu', kick: 'coscu' } },
  { id: 'spreen', name: 'Spreen', category: 'streamers', avatar: 'https://unavatar.io/kick/spreen', channels: { youtube: 'SpreenDMC', twitch: 'elspreen', kick: 'spreen' } },
  { id: 'davoo', name: 'Davoo Xeneize', category: 'streamers', avatar: 'https://unavatar.io/kick/davooxeneize', channels: { youtube: 'DavooXeneizeJuega', twitch: 'davooxeneize', kick: 'davooxeneize' } },
  { id: 'lacobra', name: 'La Cobra', category: 'streamers', avatar: 'https://unavatar.io/kick/lacobraaa', channels: { youtube: 'LaCobraaa', twitch: 'lacobraaa', kick: 'lacobraaa' } },
  { id: 'luquitas', name: 'Luquitas Rodríguez', category: 'streamers', avatar: 'https://unavatar.io/twitch/luquitasrodriguez', channels: { youtube: 'LuquitasRodriguez', twitch: 'luquitasrodriguez', kick: '' } }
];

try {
  const filePath = path.join(__dirname, 'channels.json');
  if (fs.existsSync(filePath)) {
    channels = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
} catch (e) {
  console.log('[StreamRank] Usando canales nativos precargados');
}

let latestRanks = channels.map(c => ({
  id: c.id,
  name: c.name,
  category: c.category || 'entretenimiento',
  avatar: c.avatar,
  thumbnail: '',
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

// UI en Base64 para que el chat no rompa ninguna etiqueta
const rawUI = Buffer.from(
  'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVzIiBjbGFzcz0iZGFyayI+CjxoZWFk' +
  'PgogIDxtZXRhIGNoYXJzZXQ9IlVURi04Ij4KICA8bWV0YSBuYW1lPSJ2aWV3cG9ydCIg' +
  'Y29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+CiAg' +
  'PHRpdGxlPlN0cmVhbVJhbmsgQVJHIHwgTW9uaXRvciBPZmljaWFsIGRlIEF1ZGllbmNp' +
  'YXMgZW4gVml2bzwvdGl0bGU+CiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLnRhaWx3' +
  'aW5kY3NzLmNvbSI+PC9zY3JpcHQ+CiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2pzbC5j' +
  'bG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvaHRtbDJjYW52YXMvMS40LjEvaHRtbDJjYW52' +
  'YXMubWluLmpzIj48L3NjcmlwdD4KICA8c3R5bGU+CiAgICBib2R5IHsgYmFja2dyb3Vu' +
  'ZC1jb2xvcjogIzA1MDgxMTsgZm9udC1mYW1pbHk6IHN5c3RlbS11aSwgLXN5c3RlbSwg' +
  'c2Fucy1zZXJpZjsgfQogICAgLnB1bHNlLWxpdmUgeyBhbmltYXRpb246IGJsaW5rIDEu' +
  'NHMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7IH0KICAgIEBrZXlmcmFtZXMgYmxpbmsgeyAw' +
  'JSwgMTAwJSB7IG9wYWNpdHk6IDE7IH0gNTAlIHsgb3BhY2l0eTogMC4zOyB9IH0KICAg' +
  'IC5nb2xkLWdsb3cgeyBib3gtc2hhZG93OiAwIDAgMzVweCAtOHB4IHJnYmEoMjQ1LCAx' +
  'NTgsIDExLCAwLjMpOyB9CiAgPC9zdHlsZT4KPC9oZWFkPgo8Ym9keSBjbGFzcz0idGV4' +
  'dC1zbGF0ZS0xMDAgbWluLWgtc2NyZWVuIGZsZXggZmxleC1jb2wgYW50aWFsaWFzZWQi' +
  'PgogIDxoZWFkZXIgY2xhc3M9ImJvcmRlci1iIGJvcmRlci1zbGF0ZS04MC84MCBiZy1z' +
  'bGF0ZS05NTAvODAgYmFja2Ryb3AtYmx1ciBzdGlja3kgdG9wLTAgei00MCI+CiAgICA8' +
  'ZGl2IGNsYXNzPSJtYXgtdy03eGwgbXgtYXV0byBweC00IHNtOnB4LTYgaC0xNiBmbGV4' +
  'IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPgogICAgICA8ZGl2IGNsYXNzPSJm' +
  'bGV4IGl0ZW1zLWNlbnRlciBnYXAtMyI+CiAgICAgICAgPGRpdiBjbGFzcz0idy0zLjUg' +
  'aC0zLjUgcm91bmRlZC1mdWxsIGJnLWVtZXJhbGQtNTAwIHB1bHNlLWxpdmUiPjwvZGl2' +
  'PgogICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhsIHNtOnRleHQtMnhsIGZvbnQtYmxh' +
  'Y2sgdHJhY2tpbmctdGlnaHQgdGV4dC13aGl0ZSI+U3RyZWFtUmFuayA8c3BhbiBjbGFz' +
  'cz0idGV4dC1bMTBweF0gc206dGV4dC14cyBiZy1pbmRpZ28tOTUwIHRleHQtaW5kaWdv' +
  'LTQwMCBweC0yIHB5LTAuNSByb3VuZGVkIGJvcmRlciBib3JkZXItaW5kaWdvLTcwMC81' +
  'MCBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIj5BUkc8L3NwYW4+PC9z' +
  'cGFuPgogICAgICA8L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50' +
  'ZXIgZ2FwLTMgdGV4dC14cyI+CiAgICAgICAgPGRpdiBpZD0iY250IiBjbGFzcz0iYmct' +
  'c2xhdGUtOTAwIGJvcmRlciBib3JkZXItc2xhdGUtODAwIHRleHQtZW1lcmFsZC00MDAg' +
  'Zm9udC1ib2xkIHB4LTMgcHktMS41IHJvdW5kZWQtZnVsbCI+MCBlbiB2aXZvPC9kaXY+' +
  'CiAgICAgICAgPGEgaHJlZj0iL2FwaS9hbmFseXRpY3MvZXhwb3J0IiBjbGFzcz0iYmct' +
  'aW5kaWdvLTYwMCBob3ZlcjpiZy1pbmRpZ28tNTAwIHRleHQtd2hpdGUgZm9udC1ib2xk' +
  'IHB4LTMuNSBweS0xLjUgcm91bmRlZC1sZyB0cmFuc2l0aW9uIGhpZGRlbiBzbTppbmxp' +
  'bmUtYmxvY2siPkV4cG9ydGFyIENTVjwvYT4KICAgICAgPC9kaXY+CiAgICA8L2Rpdj4K' +
  'ICA8L2hlYWRlcj4KCiAgPG1haW4gY2xhc3M9Im1heC13LTd4bCBteC1hdXRvIHB4LTQg' +
  'c206cHgtNiBweS02IGZsZXgtMSB3LWZ1bGwgc3BhY2UteS04Ij4KICAgIDxzZWN0aW9u' +
  'IGlkPSJoZXJvTGVhZGVyIiBjbGFzcz0icmVsYXRpdmUgcm91bmRlZC0yeGwgYm9yZGVy' +
  'IGJvcmRlci1hbWJlci01MDAvMzAgYmctc2xhdGUtOTAwLzgwIHAtNSBzbTpwLTcgZ29s' +
  'ZC1nbG93IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgZ2FwLTYgaXRlbXMtY2VudGVy' +
  'Ij4KICAgICAgPGRpdiBjbGFzcz0icmVsYXRpdmUgdy1mdWxsIGxnOnctMy81IGFzcGVj' +
  'dC12aWRlbyByb3VuZGVkLXhsIGJnLXNsYXRlLTk1MCBvdmVyZmxvdy1oaWRkZW4gYm9y' +
  'ZGVyIGJvcmRlci1zbGF0ZS04MDAiPgogICAgICAgIDxpbWcgaWQ9Imhlcm9UaHVtYiIg' +
  'c3JjPSIiIGNsYXNzPSJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciI+CiAgICAgICAg' +
  'PGRpdiBjbGFzcz0iYWJzb2x1dGUgdG9wLTMgbGVmdC0zIGJnLWFtYmVyLTUwMCB0ZXh0' +
  'LXNsYXRlLTk1MCBmb250LWJsYWNrIHRleHQteHMgcHgtMyBweS0xIHJvdW5kZWQiPsKg' +
  'ICMxIEzDjERFUiBBQ1RVQUw8L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJhYnNvbHV0' +
  'ZSBib3R0b20tMCBpbnNldC14LTAgcC0zLjUgYmctZ3JhZGllbnQtdG8tdCBmcm9tLWJs' +
  'YWNrIHZpYS1ibGFjay82MCB0by10cmFuc3BhcmVudCBmbGV4IGl0ZW1zLWNlbnRlciBq' +
  'dXN0aWZ5LWJldHdlZW4iPgogICAgICAgICAgPHNwYW4gaWQ9Imhlcm9QbGF0Zm9ybXMi' +
  'IGNsYXNzPSJmbGV4IGdhcC0yIj48L3NwYW4+CiAgICAgICAgICA8c3BhbiBpZD0iaGVy' +
  'b1ZpZXdlckNvdW50IiBjbGFzcz0idGV4dC13aGl0ZSBmb250LWJsYWNrIHRleHQtYmFz' +
  'ZSBzbTp0ZXh0LWxnIj4wIHZpZXdlcnM8L3NwYW4+CiAgICAgICAgPC9kaXY+CiAgICAg' +
  'IDwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJ3LWZ1bGwgbGc6dy0yLzUgZmxleCBmbGV4' +
  'LWNvbCBqdXN0aWZ5LWJldHdlZW4gc3BhY2UteS01Ij4KICAgICAgICA8ZGl2IGNsYXNz' +
  'PSJzcGFjZS15LTMiPgogICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50' +
  'ZXIgZ2FwLTMuNSI+CiAgICAgICAgICAgIDxpbWcgaWQ9Imhlcm9BdmF0YXIiIHNyYz0i' +
  'IiBjbGFzcz0idy0xNCBoLTE0IHJvdW5kZWQtZnVsbCBvYmplY3QtY292ZXIgYm9yZGVy' +
  'LTIgYm9yZGVyLWFtYmVyLTQwMCBiZy1zbGF0ZS04MDAiPgogICAgICAgICAgICA8ZGl2' +
  'PgogICAgICAgICAgICAgIDxoMiBpZD0iaGVyb05hbWUiIGNsYXNzPSJ0ZXh0LTJ4bCBm' +
  'b250LWJsYWNrIHRleHQtd2hpdGUiPkNhcmdhbmRvLi4uPC9oMj4KICAgICAgICAgICAg' +
  'ICA8c3BhbiBjbGFzcz0idGV4dC14cyB0ZXh0LWFtYmVyLTQwMCBmb250LWJvbGQgdXBw' +
  'ZXJjYXNlIj5QaWNvIG3DoXhpbW88L3NwYW4+CiAgICAgICAgICAgIDwvZGl2PgogICAg' +
  'ICAgICAgPC9kaXY+CiAgICAgICAgICA8cCBpZD0iaGVyb1RpdGxlIiBjbGFzcz0idGV4' +
  'dC14cyBzbTp0ZXh0LXNtIHRleHQtc2xhdGUtMzAwIGxpbmUtY2xhbXAtMiBiZy1zbGF0' +
  'ZS05NTAvNDAgcC0zIHJvdW5kZWQtbGcgbWluLWgtWzQ4cHhdIj5Db25lY3RhbmRvLi4u' +
  'PC9wPgogICAgICAgIDwvZGl2PgogICAgICAgIDxidXR0b24gb25jbGljaz0ib3BlblZl' +
  'cnN1c01vZGFsKCkiIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtODAwIGhvdmVyOmJnLXNs' +
  'YXRlLTcwMCB0ZXh0LXNsYXRlLTIwMCB0ZXh0LXhzIGZvbnQtYm9sZCBweS0zIHJvdW5k' +
  'ZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAgdHJhbnNpdGlvbiI+4pqUIEFicmly' +
  'IER1ZWxvIDEgdnMgMTwvYnV0dG9uPgogICAgICA8L2Rpdj4KICAgIDwvc2VjdGlvbj4K' +
  'CiAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBvdmVyZmxvdy14' +
  'LWF1dG8gcGItMiB0ZXh0LXhzIj4KICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzZXRGaWx0' +
  'ZXIoJ3RvZG9zJykiIGNsYXNzPSJmaWx0ZXItYnRuIHB4LTQgcHktMi41IHJvdW5kZWQt' +
  'eGwgZm9udC1ib2xkIGJnLWluZGlnby02MDAgdGV4dC13aGl0ZSIgZGF0YS1jYXQ9InRv' +
  'ZG9zIj7wn5SlIFRvZG9zPC9idXR0b24+CiAgICAgIDxidXR0b24gb25jbGljaz0ic2V0' +
  'RmlsdGVyKCdlbnRyZXRlbmltaWVudG8nKSIgY2xhc3M9ImZpbHRlci1idG4gcHgtNCBw' +
  'eS0yLjUgcm91bmRlZC14bCBmb250LWJvbGQgYmctc2xhdGUtOTAwIHRleHQtc2xhdGUt' +
  'NDAwIGJvcmRlciBib3JkZXItc2xhdGUtODAwIiBkYXRhLWNhdD0iZW50cmV0ZW5pbWll' +
  'bnRvIj7wn4+tIEVudHJldGVuaW1pZW50bzwvYnV0dG9uPgogICAgICA8YnV0dG9uIG9u' +
  'Y2xpY2s9InNldEZpbHRlcigncG9saXRpY2EnKSIgY2xhc3M9ImZpbHRlci1idG4gcHgt' +
  'NCBweS0yLjUgcm91bmRlZC14bCBmb250LWJvbGQgYmctc2xhdGUtOTAwIHRleHQtc2xh' +
  'dGUtNDAwIGJvcmRlciBib3JkZXItc2xhdGUtODAwIiBkYXRhLWNhdD0icG9saXRpY2Ei' +
  'PvCfjZvvuI8gUG9sw610aWNhPC9idXR0b24+CiAgICAgIDxidXR0b24gb25jbGljaz0i' +
  'c2V0RmlsdGVyKCdkZXBvcnRlcycpIiBjbGFzcz0iZmlsdGVyLWJ0biBweC00IHB5LTIu' +
  'NSByb3VuZGVkLXhsIGZvbnQtYm9sZCBiZy1zbGF0ZS05MDAgdGV4dC1zbGF0ZS00MDAg' +
  'Ym9yZGVyIGJvcmRlci1zbGF0ZS04MDAiIGRhdGEtY2F0PSJkZXBvcnRlcyI+4pq9IERl' +
  'cG9ydGVzPC9idXR0b24+CiAgICAgIDxidXR0b24gb25jbGljaz0ic3RyZWFtZXJzJyki' +
  'IGNsYXNzPSJmaWx0ZXItYnRuIHB4LTQgcHktMi41IHJvdW5kZWQteGwgZm9udC1ib2xk' +
  'IGJnLXNsYXRlLTkwMCB0ZXh0LXNsYXRlLTQwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTgw' +
  'MCIgZGF0YS1jYXQ9InN0cmVhbWVycyI+8J+OriBTdHJlYW1lcnM8L2J1dHRvbj4KICAg' +
  'IDwvZGl2PgoKICAgIDxzZWN0aW9uPgogICAgICA8ZGl2IGlkPSJjaGFubmVsR3JpZCIg' +
  'Y2xhc3M9ImdyaWQgZ3JpZC1jb2xzLTEgc206Z3JpZC1jb2xzLTIgbGc6Z3JpZC1jb2xz' +
  'LTMgZ2FwLTUiPgogICAgICAgIDxkaXYgY2xhc3M9ImNvbC1zcGFuLWZ1bGwgcHktMTYg' +
  'dGV4dC1jZW50ZXIgdGV4dC1zbGF0ZS01MDAgdGV4dC14cyI+Q2FyZ2FuZG8gdGVsZW1l' +
  'dHLDrWEuLi48L2Rpdj4KICAgICAgPC9kaXY+CiAgICA8L3NlY3Rpb24+CiAgPC9tYWlu' +
  'PgoKICA8ZGl2IGlkPSJ2ZXJzdXNNb2RhbCIgY2xhc3M9ImZpeGVkIGluc2V0LTAgYmct' +
  'YmxhY2svODAgYmFja2Ryb3AtYmx1ci1zbSB6LTUwIGhpZGRlbiBmbGV4IGl0ZW1zLWNl' +
  'bnRlciBqdXN0aWZ5LWNlbnRlciBwLTQiPgogICAgPGRpdiBjbGFzcz0iYmctc2xhdGUt' +
  'OTAwIGJvcmRlciBib3JkZXItc2xhdGUtNzAwIHJvdW5kZWQtMnhsIG1heC13LWxnIHct' +
  'ZnVsbCBwLTYgc3BhY2UteS01Ij4KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1j' +
  'ZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJvcmRlci1iIGJvcmRlci1zbGF0ZS04MDAgcGIt' +
  'MyI+CiAgICAgICAgPGgzIGNsYXNzPSJmb250LWJsYWNrIHRleHQtd2hpdGUgdGV4dC1i' +
  'YXNlIj7imqkgRHVlbG8gMSB2cyAxPC9oMz4KICAgICAgICA8YnV0dG9uIG9uY2xpY2s9' +
  'ImNsb3NlVmVyc3VzTW9kYWwoKSIgY2xhc3M9InRleHQtc2xhdGUtNDAwIGhvdmVyOnRl' +
  'eHQtd2hpdGUgZm9udC1ib2xkIHRleHQteGwiPiZ0aW1lczs8L2J1dHRvbj4KICAgICAg' +
  'PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTMgdGV4' +
  'dC14cyI+CiAgICAgICAgPHNlbGVjdCBpZD0ic2VsZWN0QSIgb25jaGFuZ2U9InVwZGF0' +
  'ZVZlcnN1c1VJKCkiIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtOTUwIGJvcmRlciBib3Jk' +
  'ZXItc2xhdGUtNzAwIHRleHQtd2hpdGUgcm91bmRlZC1sZyBwLTIuNSI+PC9zZWxlY3Q+' +
  'CiAgICAgICAgPHNlbGVjdCBpZD0ic2VsZWN0QiIgb25jaGFuZ2U9InVwZGF0ZVZlcnN1' +
  'c1VJKCkiIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtOTUwIGJvcmRlciBib3JkZXItc2xh' +
  'dGUtNzAwIHRleHQtd2hpdGUgcm91bmRlZC1sZyBwLTIuNSI+PC9zZWxlY3Q+CiAgICAg' +
  'IDwvZGl2PgogICAgICA8ZGl2IGlkPSJ2ZXJzdXNDYXB0dXJlQXJlYSIgY2xhc3M9ImJn' +
  'LXNsYXRlLTk1MCBwLTYgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMCB0' +
  'ZXh0LWNlbnRlciBzcGFjZS15LTQiPgogICAgICAgIDxkaXYgY2xhc3M9InRleHQtWzEw' +
  'cHhdIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXN0IHRleHQtaW5kaWdv' +
  'LTQwMCI+U3RyZWFtUmFuayBBUkcg4oCiIFRlbGVtZXRyw61hPC9kaXY+CiAgICAgICAg' +
  'PGRpdiBjbGFzcz0iZ3JpZCBncmlkLWNvbHMtMiBpdGVtcy1jZW50ZXIgZ2FwLTQiPgog' +
  'ICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIiPgog' +
  'ICAgICAgICAgICA8aW1nIGlkPSJ2c0F2YXRhckEiIHNyYz0iIiBjbGFzcz0idy0xNiBo' +
  'LTE2IHJvdW5kZWQtZnVsbCBib3JkZXItMiBib3JkZXItaW5kaWdvLTUwMCBvYmplY3Qt' +
  'Y292ZXIgYmctc2xhdGUtODAwIj4KICAgICAgICAgICAgPHNwYW4gaWQ9InZzTmFtZUEi' +
  'IGNsYXNzPSJmb250LWJvbGQgdGV4dC13aGl0ZSB0ZXh0LXhzIGZsb2NrIHRydW5jYXRl' +
  'IG1heC13LVsxMTBweF0gbXQtMiI+Q2FuYWwgQTwvc3Bhbj4KICAgICAgICAgICAgPHNw' +
  'YW4gaWQ9InZzVmlld2Vyc0EiIGNsYXNzPSJ0ZXh0LTJ4bCBmb250LWJsYWNrIHRleHQt' +
  'aW5kaWdvLTQwMCBtdC0wLjUiPjA8L3NwYW4+CiAgICAgICAgICA8L2Rpdj4KICAgICAg' +
  'ICAgIDxkaXYgY2xhc3M9ImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIj4KICAgICAg' +
  'ICAgICAgPGltZyBpZD0idnNBdmF0YXJCIiBzcmM9IiIgY2xhc3M9InctMTYgaC0xNiBy' +
  'b3VuZGVkLWZ1bGwgYm9yZGVyLTIgYm9yZGVyLXJlZC01MDAgb2JqZWN0LWNvdmVyIGJn' +
  'LXNsYXRlLTgwMCI+CiAgICAgICAgICAgIDxzcGFuIGlkPSJ2c05hbWVCIiBjbGFzcz0i' +
  'Zm9udC1ib2xkIHRleHQtd2hpdGUgdGV4dC14cyBmbG9jayB0cnVuY2F0ZSBtYXgtdy1b' +
  'MTEwcHhdIG10LTIiPkNhbmFsIEI8L3NwYW4+CiAgICAgICAgICAgIDxzcGFuIGlkPSJ2' +
  'c1ZpZXdlcnNCIiBjbGFzcz0idGV4dC0yeGwgZm9udC1ib2NrIHRleHQtcmVkLTQwMCBt' +
  'dC0wLjUiPjA8L3NwYW4+CiAgICAgICAgICA8L2Rpdj4KICAgICAgICA8L2Rpdj4KICAg' +
  'ICAgICA8ZGl2IGNsYXNzPSJ3LWZ1bGwgaC0zIGJnLXNsYXRlLTgwMCByb3VuZGVkLWZ1' +
  'bGwgb3ZlcmZsb3ctaGlkZGVuIGZsZXgiPgogICAgICAgICAgPGRpdiBpZD0idnNCYXJB' +
  'IiBjbGFzcz0iYmctaW5kaWdvLTUwMCBoLWZ1bGwgdHJhbnNpdGlvbi1hbGwiIHN0eWxl' +
  'PSJ3aWR0aDogNTAlIj48L2Rpdj4KICAgICAgICAgIDxkaXYgaWQ9InZzQmFyQiIgY2xh' +
  'c3M9ImJnLXJlZC01MDAgaC1mdWxsIHRyYW5zaXRpb24tYWxsIiBzdHlsZT0id2lkdGg6' +
  'IDUwJSI+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgIDwvZGl2PgogICAgICA8YnV0' +
  'dG9uIG9uY2xpY2s9ImV4cG9ydFZlcnN1c1BORygpIiBjbGFzcz0idy1mdWxsIGJnLWVt' +
  'ZXJhbGQtNjAwIGhvdmVyOmJnLWVtZXJhbGQtNTAwIHRleHQtd2hpdGUgZm9udC1ib2xk' +
  'IHB5LTMgcm91bmRlZC14bCB0ZXh0LXhzIHRyYW5zaXRpb24iPkRlc2NhcmdhciBQbGFj' +
  'YSBQTkc8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8c2NyaXB0PgogICAg' +
  'bGV0IHJhd0NoYW5uZWxzID0gW107CiAgICBsZXQgY3VycmVudEZpbHRlciA9ICd0b2Rv' +
  'cyc7CiAgICBjb25zdCBmbXQgPSBuID0+IG5ldyBJbnRsLk51bWJlckZvcm1hdCgnZXMt' +
  'QVInKS5mb3JtYXQobik7CgogICAgYXN5bmMgZnVuY3Rpb24gZmV0Y2hSYW5rcygpIHsK' +
  'ICAgICAgdHJ5IHsKICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FwaS9y' +
  'YW5rcycpOwogICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXMuanNvbigpOwogICAg' +
  'ICAgIHJhd0NoYW5uZWxzID0ganNvbi5kYXRhIHx8IFtdOwogICAgICAgIHJlbmRlckFs' +
  'bCgpOwogICAgICB9IGNhdGNoIChlcnIpIHsgY29uc29sZS5lcnJvcihlcnIpOyB9CiAg' +
  'ICB9CgogICAgZnVuY3Rpb24gcmVuZGVyQWxsKCkgewogICAgICBpZiAoIXJhd0NoYW5u' +
  'ZWxzLmxlbmd0aCkgcmV0dXJuOwogICAgICBjb25zdCBsaXZlQ291bnQgPSByYXdDaGFu' +
  'bmVscy5maWx0ZXIoYyA9PiBjLmlzTGl2ZSkubGVuZ3RoOwogICAgICBkb2N1bWVudC5n' +
  'ZXRFbGVtZW50QnlJZCgnY250JykudGV4dENvbnRlbnQgPSBsaXZlQ291bnQgKyAnIGVu' +
  'IHZpdm8nOwoKICAgICAgY29uc3QgbGVhZGVyID0gcmF3Q2hhbm5lbHNbMF07CiAgICAg' +
  'IGlmIChsZWFkZXIpIHsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGVy' +
  'b1RodW1iJykuc3JjID0gbGVhZGVyLnRodW1ibmFpbCB8fCBsZWFkZXIuYXZhdGFyOwog' +
  'ICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdoZXJvQXZhdGFyJykuc3JjID0g' +
  'bGVhZGVyLmF2YXRhcjsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGVy' +
  'b05hbWUnKS50ZXh0Q29udGVudCA9IGxlYWRlci5uYW1lOwogICAgICAgIGRvY3VtZW50' +
  'LmdldEVsZW1lbnRCeUlkKCdoZXJvVGl0bGUnKS50ZXh0Q29udGVudCA9IGxlYWRlci50' +
  'aXRsZTsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGVyb1ZpZXdlckNv' +
  'dW50JykudGV4dENvbnRlbnQgPSAobGVhZGVyLmlzTGl2ZSA/IGZtdChsZWFkZXIudG90' +
  'YWxWaWV3ZXJzKSA6ICcwJykgKyAnIHZpZXdlcnMnOwogICAgICAgIGxldCBwID0gJyc7' +
  'CiAgICAgICAgaWYgKGxlYWRlci5wbGF0Zm9ybXMueW91dHViZS5hY3RpdmUpIHAgKz0g' +
  'JzxzcGFuIGNsYXNzPSJweC0yIHB5LTAuNSByb3VuZGVkIHRleHQtWzEwcHhdIGZvbnQt' +
  'Ym9sZCBiZy1yZWQtNjAwIHRleHQtd2hpdGUiPllUOiAnICsgZm10KGxlYWRlci5wbGF0' +
  'Zm9ybXMueW91dHViZS52aWV3ZXJzKSArICc8L3NwYW4+JzsKICAgICAgICBpZiAobGVh' +
  'ZGVyLnBsYXRmb3Jtcy50d2l0Y2guYWN0aXZlKSBwICs9ICc8c3BhbiBjbGFzcz0icHgt' +
  'MiBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYmctcHVycGxlLTYw' +
  'MCB0ZXh0LXdoaXRlIj5UVzogJyArIGZtdChsZWFkZXIucGxhdGZvcm1zLnR3aXRjaC52' +
  'aWV3ZXJzKSArICc8L3NwYW4+JzsKICAgICAgICBpZiAobGVhZGVyLnBsYXRmb3Jtcy5r' +
  'aWNrLmFjdGl2ZSkgcCArPSAnPHNwYW4gY2xhc3M9InB4LTIgcHktMC41IHJvdW5kZWQg' +
  'dGV4dC1bMTBweF0gZm9udC1ib2xkIGJnLWVtZXJhbGQtNjAwIHRleHQtd2hpdGUiPktJ' +
  'OiAnICsgZm10KGxlYWRlci5wbGF0Zm9ybXMua2ljay52aWV3ZXJzKSArICc8L3NwYW4+' +
  'JzsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGVyb1BsYXRmb3Jtcycp' +
  'LmlubmVySFRNTCA9IHA7CiAgICAgIH0KCiAgICAgIGNvbnN0IGZpbHRlcmVkID0gY3Vy' +
  'cmVudEZpbHRlciA9PT0gJ3RvZG9zJyA/IHJhd0NoYW5uZWxzIDogcmF3Q2hhbm5lbHMu' +
  'ZmlsdGVyKGMgPT4gYy5jYXRlZ29yeSA9PT0gY3VycmVudEZpbHRlcik7CiAgICAgIGRv' +
  'Y3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGFubmVsR3JpZCcpLmlubmVySFRNTCA9IGZp' +
  'bHRlcmVkLm1hcChjID0+IHsKICAgICAgICBjb25zdCByYW5rSW5kZXggPSByYXdDaGFu' +
  'bmVscy5maW5kSW5kZXgoeCA9PiB4LmlkID09PSBjLmlkKSArIDE7CiAgICAgICAgbGV0' +
  'IGJhZGdlcyA9ICcnOwogICAgICAgIGlmIChjLnBsYXRmb3Jtcy55b3V0dWJlLmFjdGl2' +
  'ZSkgYmFkZ2VzICs9ICc8c3BhbiBjbGFzcz0icHgtMS41IHB5LTAuNSByb3VuZGVkIHRl' +
  'eHQtWzlweF0gZm9udC1ib2xkIGJnLXJlZC05NTAgdGV4dC1yZWQtMzAwIGJvcmRlciBi' +
  'b3JkZXItcmVkLTgwMCI+WVQ6ICcrIGZtdChjLnBsYXRmb3Jtcy55b3V0dWJlLnZpZXdl' +
  'cnMpICsnPC9zcGFuPiAnOwogICAgICAgIGlmIChjLnBsYXRmb3Jtcy50d2l0Y2guYWN0' +
  'aXZlKSBiYWRnZXMgKz0gJzxzcGFuIGNsYXNzPSJweC0xLjUgcHktMC41IHJvdW5kZWQg' +
  'dGV4dC1bOXB4XSBmb250LWJvbGQgYmctcHVycGxlLTk1MCB0ZXh0LXB1cnBsZS0zMDAg' +
  'Ym9yZGVyIGJvcmRlci1wdXJwbGUtODAwIj5UVzogJyArIGZtdChjLnBsYXRmb3Jtcy50' +
  'd2l0Y2gudmlld2VycykgKyAnPC9zcGFuPiAnOwogICAgICAgIGlmIChjLnBsYXRmb3Jt' +
  'cy5raWNrLmFjdGl2ZSkgYmFkZ2VzICs9ICc8c3BhbiBjbGFzcz0icHgtMS41IHB5LTAu' +
  'NSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkIGJnLWVtZXJhbGQtOTUwIHRleHQt' +
  'ZW1lcmFsZC0zMDAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTgwMCI+S0k6ICcrIGZtdChj' +
  'LnBsYXRmb3Jtcy5raWNrLnZpZXdlcnMpICsnPC9zcGFuPiAnOwoKICAgICAgICByZXR1' +
  'cm4gJzxkaXYgY2xhc3M9InJvdW5kZWQteGwgYm9yZGVyICcgKyAoYy5pc0xpdmUgPyAn' +
  'Ym9yZGVyLXNsYXRlLTgwMCBiZy1zbGF0ZS05MDAvNjAnIDogJ2JvcmRlci1zbGF0ZS05' +
  'MDAgYmctc2xhdGUtOTUwIG9wYWNpdHktNDAnKSArICcgb3ZlcmZsb3ctaGlkZGVuIj4n' +
  'ICsKICAgICAgICAgICc8ZGl2IGNsYXNzPSJyZWxhdGl2ZSBhc3BlY3QtdmlkZW8gdy1m' +
  'dWxsIGJnLXNsYXRlLTk1MCI+JyArCiAgICAgICAgICAgICc8aW1nIHNyYz0iJyArIChj' +
  'LnRodW1ibmFpbCB8fCBjLmF2YXRhcikgKyAnIiBjbGFzcz0idy1mdWxsIGgtZnVsbCBv' +
  'YmplY3QtY292ZXIiIG9uZXJyb3I9InRoaXMuc3JjPVxcXCcnICsgYy5hdmF0YXIgKyAn' +
  'XFxcJyI+JyArCiAgICAgICAgICAgICc8ZGl2IGNsYXNzPSJhYnNvbHV0ZSB0b3AtMiBs' +
  'ZWZ0LTIgcHgtMiBweS0wLjUgcm91bmRlZCBiZy1ibGFjay84MCBm            b250' +
  'LWJsYWNrIHRleHQteHMgJyArIChyYW5rSW5kZXggPD0gMyAmJiBjLmlzTGl2ZSA/ICd0' +
  'ZXh0LWFtYmVyLTQwMCcgOiAndGV4dC1zbGF0ZS00MDAnKSArICciPiMnICsgcmFua0lu' +
  'ZGV4ICsgJzwvZGl2PicgKwogICAgICAgICAgICAnPGRpdiBjbGFzcz0iYWJzb2x1dGUg' +
  'Ym90dG9tLTAgaW5zZXQteC0wIHAtMiBiZy1ncmFkaWVudC10by10IGZyb20tYmxhY2sg' +
  'dmlhLWJsYWNrLzcwIHRvLXRyYW5zcGFyZW50IGZsZXggaXRlbXMtZW5kIGp1c3RpZnkt' +
  'YmV0d2VlbiI+JyArCiAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGZv' +
  'bnQtYmxhY2sgdGV4dC13aGl0ZSI+JyArIChjLmlzTGl2ZSA/IGZtdChjLnRvdGFsVmll' +
  'd2VycykgKyAnIHZpZXdlcnMnIDogJ09mZmxpbmUnKSArICc8L3NwYW4+JyArCiAgICAg' +
  'ICAgICAgICAgJzxkaXYgY2xhc3M9ImZsZXggZ2FwLTEiPicgKyBiYWRnZXMgKyAnPC9k' +
  'aXY+JyArCiAgICAgICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgICc8L2Rpdj4nICsK' +
  'ICAgICAgICAgICc8ZGl2IGNsYXNzPSJwLTMgZmxleCBnYXAtMyBpdGVtcy1jZW50ZXIg' +
  'anVzdGlmeS1iZXR3ZWVuIj4nICsKICAgICAgICAgICAgJzxkaXYgY2xhc3M9ImZsZXgg' +
  'Z2FwLTIuNSBpdGVtcy1jZW50ZXIgbWluLXctMCI+JyArCiAgICAgICAgICAgICAgJzxp' +
  'bWcgc3JjPSInICsgYy5hdmF0YXIgKyAnIiBjbGFzcz0idy05IGgtOSByb3VuZGVkLWZ1' +
  'bGwgb2JqZWN0LWNvdmVyIGJnLXNsYXRlLTgwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTcw' +
  'MCBmbGV4LXNocmluay0wIj4nICsKICAgICAgICAgICAgICAnPGRpdiBjbGFzcz0ibWlu' +
  'LXctMCI+PGg0IGNsYXNzPSJmb250LWJvbGQgdGV4dC13aGl0ZSB0ZXh0LXhzIHRydW5j' +
  'YXRlIj4nICsgYy5uYW1lICsgJzwvaDQ+PHAgY2xhc3M9InRleHQtWzEwcHhdIHRleHQt' +
  'c2xhdGUtNDAwIHRydW5jYXRlIj4nICsgYy50aXRsZSArICc8L3A+PC9kaXY+JyArCiAg' +
  'ICAgICAgICAgICc8L2Rpdj4nICsKICAgICAgICAgICAgJzxidXR0b24gb25jbGljaz0i' +
  'c3RhcnRDb21wYXJlKFxcXCcnICsgYy5pZCArICdcXFwnKSIgY2xhc3M9InRleHQteHMg' +
  'Zm9udC1ib2xkIGJnLXNsYXRlLTgwMCB0ZXh0LXNsYXRlLTMwMCBweC0yIHB5LTEgcm91' +
  'bmRlZCBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCI+VlM8L2J1dHRvbj4nICsKICAgICAg' +
  'ICAgICc8L2Rpdj4nICsKICAgICAgICAnPC9kaXY+JzsKICAgICAgfSkuam9pbignJyk7' +
  'CiAgICB9CgogICAgZnVuY3Rpb24gc2V0RmlsdGVyKGNhdCkgewogICAgICBjdXJyZW50' +
  'RmlsdGVyID0gY2F0OwogICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZmls' +
  'dGVyLWJ0bicpLmZvckVhY2goYnRuID0+IHsKICAgICAgICBidG4uY2xhc3NOYW1lID0g' +
  'KGJ0bi5kYXRhc2V0LmNhdCA9PT0gY2F0KQogICAgICAgICAgPyAnZmlsdGVyLWJ0biBw' +
  'eC00IHB5LTIuNSByb3VuZGVkLXhsIGZvbnQtYm9sZCBiZy1pbmRpZ28tNjAwIHRleHQt' +
  'd2hpdGUnCiAgICAgICAgICA6ICdmaWx0ZXItYnRuIHB4LTQgcHktMi41IHJvdW5kZWQt' +
  'eGwgZm9udC1ib2xkIGJnLXNsYXRlLTkwMCB0ZXh0LXNsYXRlLTQwMCBib3JkZXIgYm9y' +
  'ZGVyLXNsYXRlLTgwMCc7CiAgICAgIH0pOwogICAgICByZW5kZXJBbGwoKTsKICAgIH0K' +
  'CiAgICBmdW5jdGlvbiBvcGVuVmVyc3VzTW9kYWwoKSB7CiAgICAgIGNvbnN0IHNBID0g' +
  'ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbGVjdEEnKTsKICAgICAgY29uc3Qgc0Ig' +
  'PSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VsZWN0QicpOwogICAgICBzQS5pbm5l' +
  'ckhUTUwgPSByYXdDaGFubmVscy5tYXAoYyA9PiAnPG9wdGlvbiB2YWx1ZT0iJyArIGMu' +
  'aWQgKyAnIj4nICsgYy5uYW1lICsgJzwvb3B0aW9uPicpLmpvaW4oJycpOwogICAgICBz' +
  'Qi5pbm5lckhUTUwgPSByYXdDaGFubmVscy5tYXAoKGMsIGkpID0+ICc8b3B0aW9uIHZh' +
  'bHVlPSInICsgYy5pZCArICciICcgKyAoaSA9PT0gMSA/ICdzZWxlY3RlZCcgOiAnJykg' +
  'KyAnPicgKyBjLm5hbWUgKyAnPC9vcHRpb24+JykLam9pbignJyk7CiAgICAgIHVwZGF0' +
  'ZVZlcnN1c1VJKCk7CiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2ZXJzdXNN' +
  'b2RhbCcpLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpOwogICAgfQoKICAgIGZ1bmN0' +
  'aW9uIGNsb3NlVmVyc3VzTW9kYWwoKSB7CiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRC' +
  'eUlkKCd2ZXJzdXNNb2RhbCcpLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpOwogICAgfQoK' +
  'ICAgIGZ1bmN0aW9uIHN0YXJ0Q29tcGFyZShpZCkgewogICAgICBvcGVuVmVyc3VzTW9k' +
  'YWwoKTsKICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbGVjdEEnKS52YWx1' +
  'ZSA9IGlkOwogICAgICB1cGRhdGVWZXJzdXNVSSgpOwogICAgfQoKICAgIGZ1bmN0aW9u' +
  'IHVwZGF0ZVZlcnN1c1VJKCk7CiAgICAgIGNvbnN0IGNoQSA9IHJhd0NoYW5uZWxzLmZp' +
  'bmQoeCA9PiB4LmlkID09PSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VsZWN0QScp' +
  'LnZhbHVlKSB8fCByYXdDaGFubmVsc1swXTsKICAgICAgY29uc3QgY2hCID0gcmF3Q2hh' +
  'bm5lbHMuZmluZCh4ID0+IHguaWQgPT09IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdz' +
  'ZWxlY3RCJykudmFsdWUpIHx8IHJhd0NoYW5uZWxzWzFdOwogICAgICBkb2N1bWVudC5n' +
  'ZXRFbGVtZW50QnlJZCgndnNBdmF0YXJBJykuc3JjID0gY2hBLmF2YXRhcjsKICAgICAg' +
  'ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZzTmFtZUEnKS50ZXh0Q29udGVudCA9IGNo' +
  'QS5uYW1lOwogICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndnNWaWV3ZXJzQScp' +
  'LnRleHRDb250ZW50ID0gZm10KGNoQS50b3RhbFZpZXdlcnMpOwogICAgICBkb2N1bWVu' +
  'dC5nZXRFbGVtZW50QnlJZCgndnNBdmF0YXJCJykuc3JjID0gY2hCLmF2YXRhcjsKICAg' +
  'ICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZzTmFtZUInKS50ZXh0Q29udGVudCA9' +
  'IGNoQi5uYW1lOwogICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndnNWaWV3ZXJz' +
  'QicpLnRleHRDb250ZW50ID0gZm10KGNoQi50b3RhbFZpZXdlcnMpOwogICAgICBjb25z' +
  'dCB0b3RhbCA9IGNoQS50b3RhbFZpZXdlcnMgKyBjaEIudG90YWxWaWV3ZXJzIHx8IDE7' +
  'CiAgICAgIGNvbnN0IHBjdEEgPSBNYXRoLnJvdW5kKChjaEEudG90YWxWaWV3ZXJzIC8g' +
  'dG90YWwpICogMTAwKTsKICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZzQmFy' +
  'QScpLnN0eWxlLndpZHRoID0gcGN0QSArICclJzsKICAgICAgZG9jdW1lbnQuZ2V0RWxl' +
  'bWVudEJ5SWQoJ3ZzQmFyQicpLnN0eWxlLndpZHRoID0gKDEwMCAtIHBjdEEpICsgJyUn' +
  'OwogICAgfQoKICAgIGZ1bmN0aW9uIGV4cG9ydFZlcnN1c1BORygpIHsKICAgICAgaHRt' +
  'bDJjYW52YXMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZlcnN1c0NhcHR1cmVBcmVh' +
  'JyksIHsgYmFja2dyb3VuZENvbG9yOiAnIzA1MDgxMScgfSkudGhlbihjYW52YXMgPT4g' +
  'ewogICAgICAgIGNvbnN0IGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7' +
  'CiAgICAgICAgbGluay5kb3dubG9hZCA9ICdTdHJlYW1SYW5rX1ZlcnN1cy5wbmcnOwog' +
  'ICAgICAgIGxpbmsuaHJlZiA9IGNhbnZhcy50b0RhdGFVUkwoKTsKICAgICAgICBsaW5r' +
  'LmNsaWNrKCk7CiAgICAgIH0pOwogICAgfQoKICAgIGZldGNoUmFua3MoKTsKICAgIHNl' +
  'dEludGVydmFsKGZldGNoUmFua3MsIDIwMDAwKTsKICA8L3NjcmlwdD4KPC9ib2R5Pgo8' +
  'L2h0bWw+'
, 'base64').toString('utf-8');

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(rawUI);
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
    const startTag = '';
    const endTag = '';
    const startIdx = text.indexOf(startTag);
    const endIdx = text.indexOf(endTag);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      title = text.slice(startIdx + startTag.length, endIdx).replace(' - YouTube', '').trim();
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
      const activeThumbnail = yt.thumbnail || tw.thumbnail || ki.thumbnail || '';
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
