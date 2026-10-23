/* Prism TV Home. Runs in a browser (preview) or inside the Android TV app, which provides
   window.PrismNative. Large layers only animate transform and opacity. */
(function () {
  'use strict';

  var W = 1920, H = 1080, NATIVE = window.PrismNative || null, STORE = 'prism.v3', OLD = ['prism.v2', 'prism.home.v1'];
  var HOME_MAX = 16, ALL = '__all', PARAMS = location.search || '';
  var DREAM = /saver=1/.test(PARAMS);

  /* ---------- Symbols (original line drawings on a 24-unit grid) ---------- */
  var SVG = {
    apps: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>',
    cc: '<rect x="3" y="5" width="18" height="6" rx="3"/><circle cx="16" cy="8" r="1.6"/><rect x="3" y="13" width="18" height="6" rx="3"/><circle cx="8" cy="16" r="1.6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.8 12.5a9 9 0 0 1 12.4 0"/><path d="M9.2 16a4 4 0 0 1 5.6 0"/><circle cx="12" cy="19.2" r=".9"/>',
    bt: '<path d="m7 7 10 10-5 4.5V2.5L17 7 7 17"/>',
    input: '<rect x="3" y="5" width="18" height="12" rx="2.4"/><path d="M9 21h6M12 17v4"/><path d="m10 9 3 2-3 2"/>',
    settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
    appearance: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17Z" fill="currentColor"/>',
    layout: '<rect x="3.5" y="4" width="17" height="10" rx="2.4"/><rect x="3.5" y="17" width="5" height="3" rx="1"/><rect x="9.5" y="17" width="5" height="3" rx="1"/><rect x="15.5" y="17" width="5" height="3" rx="1"/>',
    photo: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.4"/><circle cx="9" cy="9.8" r="1.5"/><path d="m4.5 17.5 4.5-4.5 3 3 2.5-2.5 5 5"/>',
    play: '<path d="M8 5.5v13l10-6.5Z"/>',
    pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    prev: '<path d="M18 6v12l-8-6ZM6 6v12"/>',
    next: '<path d="M6 6v12l8-6ZM18 6v12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    move: '<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>',
    left: '<path d="m14.5 5-7 7 7 7"/>',
    right: '<path d="m9.5 5 7 7-7 7"/>',
    updown: '<path d="m8 9.5 4-4 4 4M8 14.5l4 4 4-4"/>',
    check: '<path d="m5.5 12.5 4 4 9-9"/>',
    tv: '<rect x="3" y="4.5" width="18" height="12" rx="2.4"/><path d="M8.5 20h7"/>',
    folder: '<path d="M3.5 6.5a1 1 0 0 1 1-1h5l2 2.5h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z"/>',
    film: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.4"/><path d="M7.5 4.5v15M16.5 4.5v15M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4"/>',
    cast: '<path d="M3 16a5 5 0 0 1 5 5M3 12a9 9 0 0 1 9 9"/><path d="M3 8V6a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6v12a1.5 1.5 0 0 1-1.5 1.5H15"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    person: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M11 18.5h2"/>',
    power: '<path d="M12 3v9"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/>',
    moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3"/>',
    partly: '<path d="M8.5 4.5v1.2M3.8 9.2H5M5.2 5.9l.9.9M11.8 5.9l-.9.9"/><path d="M5.9 11.6A3.3 3.3 0 1 1 11.6 8"/><path d="M8.5 19.5h9a3.5 3.5 0 0 0 .3-7 4.8 4.8 0 0 0-9.2 1.3 2.9 2.9 0 0 0-.1 5.7Z"/>',
    cloud: '<path d="M7 18.5h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.5A3.3 3.3 0 0 0 7 18.5Z"/>',
    fog: '<path d="M4 9.5h16M2.5 13h15M6 16.5h15M4.5 20h10"/><path d="M6.5 6.5a5.8 5.8 0 0 1 11 0"/>',
    drizzle: '<path d="M7 14.5h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.5A3.3 3.3 0 0 0 7 14.5Z"/><path d="M9 17.5v1M12.5 18v1M16 17.5v1"/>',
    rain: '<path d="M7 14h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.5A3.3 3.3 0 0 0 7 14Z"/><path d="m9 16.5-1 3M12.5 16.5l-1 3M16 16.5l-1 3"/>',
    snow: '<path d="M7 14h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.5A3.3 3.3 0 0 0 7 14Z"/><path d="M9 18h.01M12.5 19.5h.01M16 18h.01"/>',
    storm: '<path d="M7 13.5h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.5A3.3 3.3 0 0 0 7 13.5Z"/><path d="m12.5 14-2 3.5h3l-2 3.5"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    note: '<path d="M5 4.5h14v10.5l-5 5H5Z"/><path d="M14 20v-5h5"/>',
    news: '<rect x="3" y="4.5" width="15" height="15" rx="2"/><path d="M18 8.5h2.5V18a1.5 1.5 0 0 1-3 0M6.5 8.5h8M6.5 12h8M6.5 15.5h5"/>',
    air: '<path d="M3 9h11a3 3 0 1 0-3-3M3 13.5h15a3 3 0 1 1-3 3M3 18h7"/>',
    sunrise: '<path d="M12 3v5M9.5 5.5 12 3l2.5 2.5"/><path d="M5.5 16a6.5 6.5 0 0 1 13 0M2.5 19.5h19M4.5 12.5l1.2.7M19.5 12.5l-1.2.7"/>',
    sunset: '<path d="M12 8V3M9.5 5.5 12 8l2.5-2.5"/><path d="M5.5 16a6.5 6.5 0 0 1 13 0M2.5 19.5h19M4.5 12.5l1.2.7M19.5 12.5l-1.2.7"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    del: '<path d="M8.5 5.5H20v13H8.5L3 12Z"/><path d="m11.5 9.5 5 5M16.5 9.5l-5 5"/>',
    space: '<path d="M4 10v4h16v-4"/>',
    update: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>',
    home: '<path d="M4 11 12 4.5l8 6.5v8a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z"/>',
    keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.4"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9"/>',
    shield: '<path d="M12 3 5 6v5.5c0 4.3 3 7.8 7 9.5 4-1.7 7-5.2 7-9.5V6Z"/>'
  };
  function ico(n) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (SVG[n] || SVG.info) + '</svg>'; }

  /* ---------- Preview catalogue (on the TV, the real installed apps and inputs are used) ---------- */
  var DEMO = [
    { id: 'netflix', name: 'Netflix', color: '#e50914', mark: 'netflix', cat: 'Films and series', k: 'watch' },
    { id: 'youtube', name: 'YouTube', color: '#ff1f3d', mark: 'youtube', cat: 'Video', k: 'watch' },
    { id: 'primevideo', name: 'Prime Video', color: '#1a98ff', mark: 'primevideo', cat: 'Films and series', k: 'watch' },
    { id: 'disneyplus', name: 'Disney+', color: '#1438c8', mark: 'disneyplus', cat: 'Films and series', k: 'watch' },
    { id: 'applemusic', name: 'Apple Music', color: '#fa2d48', mark: 'applemusic', cat: 'Music', k: 'listen' },
    { id: 'spotify', name: 'Spotify', color: '#1db954', mark: 'spotify', cat: 'Music', k: 'listen' },
    { id: 'appletv', name: 'Apple TV', color: '#2c2c2e', mark: 'appletv', cat: 'Films and series', k: 'watch' },
    { id: 'max', name: 'Max', color: '#6a2cf0', mark: 'hbomax', cat: 'Films and series', k: 'watch' },
    { id: 'tubi', name: 'Tubi', color: '#7408ff', mark: 'tubi', cat: 'Free films', k: 'watch' },
    { id: 'stremio', name: 'Stremio', color: '#7b4fa8', mark: 'stremio', cat: 'Media centre', k: 'watch' },
    { id: 'livetv', name: 'Live TV', color: '#0f7a6c', glyph: 'tv', cat: 'Channels', k: 'watch' },
    { id: 'files', name: 'Files', color: '#c7781c', glyph: 'folder', cat: 'Tools' },
    { id: 'player', name: 'Media Player', color: '#3d57d6', glyph: 'film', cat: 'Tools', k: 'watch' },
    { id: 'screenshare', name: 'Screen Share', color: '#2a8bb8', glyph: 'cast', cat: 'Tools' },
    { id: 'gallery', name: 'Gallery', color: '#b8406a', glyph: 'photo', cat: 'Photos' }
  ];
  var DEMO_INPUTS = [{ id: 'hdmi1', label: 'HDMI 1' }, { id: 'hdmi2', label: 'HDMI 2' }, { id: 'hdmi3', label: 'HDMI 3' }, { id: 'av', label: 'AV' }];
  var DEMO_HOME = ['netflix', 'youtube', 'primevideo', 'disneyplus', 'applemusic', 'spotify', 'appletv', 'max', 'livetv'];
  var PREFERRED = ['com.netflix.ninja', 'com.google.android.youtube.tv', 'com.amazon.amazonvideo.livingroom', 'in.startv.hotstar', 'in.startv.hotstartvonly',
    'com.apple.android.music', 'com.apple.atve.androidtv.appletv', 'com.jio.media.ondemand', 'com.sonyliv', 'com.zee5.zee5tv', 'com.spotify.tv.android',
    'com.google.android.youtube.tvmusic', 'com.oneplus.tv.oxygenplay', 'com.android.vending'];
  var WATCH_WORDS = /netflix|youtube(?!.*music)|amazonvideo|prime|hotstar|jio|sony|zee5|mxplayer|tubi|stremio|kodi|plex|vlc|apple\.atve|disney|hbo|tv\.?player|video|movie|cinema|aha|sunnxt|voot|erosnow|hoichoi/i;
  var LISTEN_WORDS = /music|spotify|gaana|saavn|wynk|audible|podcast|radio|soundcloud|tidal|deezer/i;
  var SEARCH_TARGETS = [
    { id: 'youtube', name: 'YouTube', pkgs: ['com.google.android.youtube.tv'], demo: 'youtube' },
    { id: 'netflix', name: 'Netflix', pkgs: ['com.netflix.ninja'], demo: 'netflix' },
    { id: 'prime', name: 'Prime Video', pkgs: ['com.amazon.amazonvideo.livingroom'], demo: 'primevideo' },
    { id: 'play', name: 'Play Store', pkgs: ['com.android.vending'], demo: null }
  ];

  /* ---------- Photographs (bundled, Unsplash licence; see NOTICES.md) ---------- */
  var WALLS = [
    { id: 'peaks', name: 'Blue peaks', credit: 'John Rodenn Castillo', day: true },
    { id: 'misty', name: 'Misty coast', credit: 'Ganapathy Kumar', day: true },
    { id: 'sydney', name: 'Sydney Harbour', credit: 'Caleb', day: true },
    { id: 'goldcoast', name: 'Gold Coast dusk', credit: 'City of Gold Coast', day: true },
    { id: 'alpine', name: 'Alpine glow', credit: 'Cristina Gottardi', day: true },
    { id: 'amber', name: 'Amber hills', credit: 'Chris Barbalis', day: true },
    { id: 'summit', name: 'Sunlit summits', credit: 'Rudra Gupta' },
    { id: 'bridge', name: 'Bridge at dusk', credit: 'Justin Wolff' },
    { id: 'night', name: 'Desert stars', credit: 'Mohammad Alizade' },
    { id: 'cove', name: 'Quiet cove', credit: 'Joshua Wordel' },
    { id: 'golden', name: 'Golden hour', credit: 'Karthik Sreenivas' },
    { id: 'ridge', name: 'Sunlit ridges', credit: 'Cristina Gottardi' },
    { id: 'valley', name: 'Mountain valley', credit: 'Aniket Deole' },
    { id: 'forest', name: 'Forest mist', credit: 'Dejan Zakic' },
    { id: 'mint', name: 'Mint wave', credit: 'MagicPattern' }
  ];
  var COLORS = ['#0a84ff', '#ff9f0a', '#30d158', '#bf5af2', '#ff375f', '#64d2ff', '#ffd60a', '#ac8e68'];

  var O = {
    look: [['shelf', 'Shelf'], ['glass', 'Glass'], ['carousel', 'Carousel']],
    appearance: [['auto', 'Automatic'], ['light', 'Light'], ['dark', 'Dark']],
    wall: [['auto', 'Changes daily']].concat(WALLS.map(function (w) { return [w.id, w.name]; })),
    tiles: [['banner', 'Full colour'], ['icon', 'Icons on glass']],
    motion: [['full', 'Full'], ['lite', 'Lite, for slower TVs']],
    onoff: [['on', 'On'], ['off', 'Off']],
    order: [['manual', 'As arranged'], ['habit', 'By habit']],
    start: [['auto', 'Today in the morning'], ['home', 'Always Home'], ['today', 'Always Today']],
    clock: [['12', '12-hour'], ['24', '24-hour']],
    ambient: [['2', '2 minutes'], ['5', '5 minutes'], ['15', '15 minutes'], ['30', '30 minutes'], ['0', 'Never']],
    each: [['1', '1 minute'], ['2', '2 minutes'], ['5', '5 minutes'], ['10', '10 minutes']],
    off: [['off', 'Never'], ['21:00', '9:00 pm'], ['21:30', '9:30 pm'], ['22:00', '10:00 pm'], ['22:30', '10:30 pm'], ['23:00', '11:00 pm'], ['23:30', '11:30 pm'], ['00:00', 'Midnight']]
  };
  var SCENES = [['clock', 'Clock'], ['photos', 'Family photos'], ['weather', 'Weather'], ['art', 'Art gallery'], ['calendar', 'Calendar'], ['notes', 'Family notes'], ['news', 'Headlines']];

  /* ---------- Preferences ---------- */
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function profileDefaults(id, name, color) { return { id: id, name: name, color: color, home: null, folders: {}, pages: [], look: 'shelf', appearance: 'auto', wall: 'auto', tiles: 'banner', order: 'manual' }; }
  function defaults() {
    return { v: 3, profiles: [profileDefaults('p1', 'Me', COLORS[0])], active: 'p1', askWho: 'off', clock: '12', motion: reduced ? 'lite' : 'full', sounds: 'on', ambient: '5', start: 'auto',
      saver: { scenes: { clock: true, photos: true, weather: true, art: true, calendar: true, notes: true, news: false }, each: '2' },
      night: { off: '21:00' }, notes: [], inputs: {}, updateUrl: '', habits: {},
      info: { place: 'Hyderabad', lat: 17.385, lon: 78.4867, ics: '', news: { hyd: true, india: true, bbc: true } } };
  }
  function load() {
    var d = defaults(), s = null;
    try { s = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
    if (s && s.v === 3) { merge(d, s); return d; }
    var old = null;
    for (var i = 0; i < OLD.length && !old; i++) { try { old = JSON.parse(localStorage.getItem(OLD[i]) || 'null'); } catch (e) {} }
    if (old) {
      var p = d.profiles[0];
      ['home', 'look', 'appearance', 'wall', 'tiles'].forEach(function (k) { if (old[k]) p[k] = old[k]; });
      ['clock', 'motion', 'sounds', 'ambient'].forEach(function (k) { if (old[k]) d[k] = old[k]; });
    }
    return d;
  }
  function merge(d, s) { for (var k in s) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) merge(d[k], s[k]); else d[k] = s[k]; } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(P)); } catch (e) {} }
  var FIRST_RUN = (function () { try { return !localStorage.getItem(STORE); } catch (e) { return false; } })();
  var P = load();
  function PF() { for (var i = 0; i < P.profiles.length; i++) if (P.profiles[i].id === P.active) return P.profiles[i]; P.active = P.profiles[0].id; return P.profiles[0]; }
  function getPath(path) { var sc = path.charAt(0), parts = path.slice(2).split('.'), o = sc === 'p' ? PF() : P; for (var i = 0; i < parts.length; i++) { if (o == null) return undefined; o = o[parts[i]]; } return o; }
  function setPath(path, v) { var sc = path.charAt(0), parts = path.slice(2).split('.'), o = sc === 'p' ? PF() : P; for (var i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null) o[parts[i]] = {}; o = o[parts[i]]; } o[parts[parts.length - 1]] = v; }

  /* ---------- State ---------- */
  var APPS = [], BY = {}, PAGES = [], INPUTS = [];
  var S = { layer: 'home', stack: [], zone: 'row', page: 0, idx: {}, top: 0, cc: 0, set: 0, menu: 0, menuOpts: [], moving: false, dir: null, busy: false,
    heroFlip: false, heroId: null, wallFlip: false, wallId: null, spotFlip: false, idle: Date.now(), saver: false, appearance: null, gridTop: 0,
    tw: 0, sq: '', sz: 'k0', sk: [0, 0], sres: 0, sact: 0, num: false, prof: 0, fold: null, fi: 0, inp: 0, np: null, npKey: '', update: null, night: null, lastApp: null, device: null };
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage');

  /* ---------- Helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rgb(hex) { hex = String(hex || '#3d57d6').replace('#', ''); if (hex.length === 3) hex = hex.replace(/./g, '$&$&'); var n = parseInt(hex, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) { a = rgb(a); b = rgb(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] * (1 - t) + b[i] * t); }).join(',') + ')'; }
  function alpha(hex, a) { var c = rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function q(sel, root) { return (root || stage).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || stage).querySelectorAll(sel)); }
  function scale() { return Math.min(innerWidth / W, innerHeight / H); }
  function stageRect(el) { var s = scale(), r = el.getBoundingClientRect(), o = stage.getBoundingClientRect(); return { x: (r.left - o.left) / s, y: (r.top - o.top) / s, w: r.width / s, h: r.height / s }; }
  function reg(el, x, y) { if (!el) return; if (x === undefined) { var r = stageRect(el); x = r.x; y = r.y; } el.style.setProperty('--gx', (-x) + 'px'); el.style.setProperty('--gy', (-y) + 'px'); }
  function lbl(list, v) { for (var i = 0; i < list.length; i++) if (String(list[i][0]) === String(v)) return list[i][1]; return list[0][1]; }
  function lite() { return P.motion === 'lite'; }
  function initials(n) { var p = String(n).trim().split(/\s+/); return ((p[0] || '?').charAt(0) + (p[1] ? p[1].charAt(0) : '')).toUpperCase(); }
  /* Android's bridge matches methods by argument count, so call with exactly the arguments given. */
  function nat(fn, a, b) {
    if (!NATIVE || typeof NATIVE[fn] !== 'function') return undefined;
    try { var n = arguments.length - 1; return n === 0 ? NATIVE[fn]() : n === 1 ? NATIVE[fn](a) : NATIVE[fn](a, b); } catch (e) { return undefined; }
  }
  function natJSON(fn) { var r = nat(fn); if (!r) return null; try { return JSON.parse(r); } catch (e) { return null; } }
  function fmtTime(d, bare, hourOnly) {
    var h = d.getHours(), m = d.getMinutes(), mm = m < 10 ? '0' + m : m;
    if (P.clock === '24') return (h < 10 ? '0' + h : h) + (hourOnly ? '' : ':' + mm);
    var hh = h % 12 || 12, ap = h < 12 ? ' am' : ' pm';
    if (hourOnly) return hh + ap;
    return hh + ':' + mm + (bare ? '' : ap);
  }

  /* ---------- Sounds: short synthesized cues ---------- */
  var AC = null, noise = null;
  function snd(type) {
    if (P.sounds !== 'on' || DREAM) return;
    try {
      if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return; AC = new C(); }
      if (AC.state === 'suspended') AC.resume();
      var t = AC.currentTime, g = AC.createGain(); g.connect(AC.destination);
      if (type === 'open' || type === 'page') {
        if (!noise) { noise = AC.createBuffer(1, AC.sampleRate * 0.6, AC.sampleRate); var d = noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
        var src = AC.createBufferSource(), f = AC.createBiquadFilter(), len = type === 'open' ? 0.42 : 0.22;
        src.buffer = noise; f.type = 'bandpass'; f.Q.value = 1.4;
        f.frequency.setValueAtTime(type === 'open' ? 380 : 900, t); f.frequency.exponentialRampToValueAtTime(type === 'open' ? 2600 : 2200, t + len);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(type === 'open' ? 0.09 : 0.035, t + len * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        src.connect(f); f.connect(g); src.start(t); src.stop(t + len + 0.02);
        return;
      }
      var o = AC.createOscillator(), spec = { move: [1900, 1500, 0.035, 0.022], select: [700, 1050, 0.09, 0.05], back: [560, 380, 0.09, 0.04], toggle: [1250, 1250, 0.03, 0.03], key: [2400, 2100, 0.02, 0.018] }[type] || [1000, 1000, 0.03, 0.02];
      o.type = 'sine'; o.frequency.setValueAtTime(spec[0], t); o.frequency.exponentialRampToValueAtTime(spec[1], t + spec[2]);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(spec[3], t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + spec[2] + 0.04);
      o.connect(g); o.start(t); o.stop(t + spec[2] + 0.06);
    } catch (e) {}
  }

  /* ---------- Live info and screensaver ---------- */
  var INFO = window.PrismInfo({ native: NATIVE, prefs: function () { return P; }, samples: !NATIVE });
  var SAVER = window.PrismSaver({
    root: $('saver'), info: INFO, prefs: function () { return P; }, walls: WALLS, ico: ico, esc: esc, lite: lite,
    fmtTime: fmtTime, wallNow: function () { return S.wallId || 'summit'; },
    photos: function () { return (natJSON('photos') || []).map(function (p) { return { url: p.url, title: 'Family photos', sub: 'Added ' + new Date(p.t).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) }; }); }
  });
  INFO.on(function () { if (page() && page().today) renderToday(); glance(); });

  /* ---------- Apps, folders, inputs, pages ---------- */
  function loadApps() {
    var list = DEMO;
    if (NATIVE) {
      list = (natJSON('apps') || []).map(function (a) {
        var key = a.id + ' ' + a.name, k = /Video/.test(a.cat) || WATCH_WORDS.test(key) ? 'watch' : /Music|audio/.test(a.cat) || LISTEN_WORDS.test(key) ? 'listen' : '';
        if (k === 'watch' && LISTEN_WORDS.test(key)) k = 'listen';
        return { id: a.id, name: a.name, color: a.color || '#3d57d6', cat: a.cat || 'App', icon: a.icon, banner: a.banner || null, k: k };
      });
    }
    APPS = list.slice().sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
    INPUTS = (NATIVE ? natJSON('inputs') : DEMO_INPUTS) || [];
    indexItems();
    P.profiles.forEach(function (pf) {
      if (!pf.home) pf.home = defaultHome();
      pf.home = pf.home.filter(function (id) { return !!BY[id] && id !== ALL; });
      Object.keys(pf.folders).forEach(function (f) { pf.folders[f].apps = pf.folders[f].apps.filter(function (id) { return !!BY[id]; }); });
      pf.pages.forEach(function (pg) { pg.items = pg.items.filter(function (id) { return !!BY[id]; }); });
    });
    if (!PF().home.length) PF().home = defaultHome();
    buildPages();
  }
  function indexItems() {
    BY = {};
    APPS.forEach(function (a) { BY[a.id] = a; });
    BY[ALL] = { id: ALL, name: 'All apps', color: '#5e5ce6', glyph: 'apps', cat: 'Every app on this TV' };
    INPUTS.forEach(function (i) {
      var custom = P.inputs[i.id] && P.inputs[i.id].name;
      BY['input:' + i.id] = { id: 'input:' + i.id, input: i.id, kind: 'input', name: custom || i.label, sub: i.label, color: '#1c1c22', glyph: 'input', cat: custom ? i.label : 'TV input' };
    });
    var fs = PF().folders;
    Object.keys(fs).forEach(function (f) { BY['folder:' + f] = { id: 'folder:' + f, folder: f, kind: 'folder', name: fs[f].name, color: '#3a3a44', cat: fs[f].apps.length + ' apps' }; });
  }
  function defaultHome() {
    if (!NATIVE) return DEMO_HOME.slice();
    var out = [];
    PREFERRED.forEach(function (p) { if (BY[p] && out.length < 9) out.push(p); });
    APPS.forEach(function (a) { if (out.length < 9 && out.indexOf(a.id) < 0) out.push(a.id); });
    return out;
  }
  function homeItems() {
    var list = PF().home.filter(function (id) { return !!BY[id]; });
    if (PF().order === 'habit') {
      var h = new Date().getHours(), base = list.slice();
      list.sort(function (a, b) { return score(b, h) - score(a, h) || base.indexOf(a) - base.indexOf(b); });
    }
    return list;
  }
  function buildPages() {
    indexItems();
    var watch = APPS.filter(function (a) { return a.k === 'watch'; }).map(function (a) { return a.id; });
    var listen = APPS.filter(function (a) { return a.k === 'listen'; }).map(function (a) { return a.id; });
    var keep = PAGES[S.page] && PAGES[S.page].id;
    PAGES = [{ id: 'home', name: 'Home', items: homeItems().concat([ALL]) }, { id: 'today', name: 'Today', items: [], today: true }];
    if (watch.length) PAGES.push({ id: 'watch', name: 'Watch', items: watch });
    if (listen.length) PAGES.push({ id: 'listen', name: 'Listen', items: listen });
    PF().pages.forEach(function (pg) { if (pg.items.length) PAGES.push({ id: pg.id, name: pg.name, items: pg.items.slice(), custom: true }); });
    PAGES.push({ id: 'all', name: 'All apps', items: APPS.map(function (a) { return a.id; }), grid: true });
    S.page = 0;
    for (var i = 0; i < PAGES.length; i++) if (PAGES[i].id === keep) S.page = i;
  }
  function page() { return PAGES[S.page]; }
  function pageIndex(id) { for (var i = 0; i < PAGES.length; i++) if (PAGES[i].id === id) return i; return 0; }
  function cur() { var p = page(); return clamp(S.idx[p.id] || 0, 0, Math.max(0, p.items.length - 1)); }
  function setCur(i) { S.idx[page().id] = i; }
  function curItem() { return BY[page().items[cur()]]; }

  /* ---------- Habits: what you open, and when ---------- */
  function habits() { if (!P.habits[P.active]) P.habits[P.active] = {}; return P.habits[P.active]; }
  function record(id) {
    var H = habits(), e = H[id] || (H[id] = { n: 0, h: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], last: 0 });
    e.n++; e.h[new Date().getHours()]++; e.last = Date.now(); save();
  }
  function score(id, hour) {
    var it = BY[id];
    if (it && it.folder) return PF().folders[it.folder].apps.reduce(function (s, a) { return s + score(a, hour); }, 0);
    var e = habits()[id]; if (!e) return 0;
    var near = e.h[hour] + 0.6 * (e.h[(hour + 23) % 24] + e.h[(hour + 1) % 24]);
    return near * 3 + e.n * 0.3 + (Date.now() - e.last < 2 * 86400000 ? 2 : 0);
  }
  function usualNow(id) {
    var e = habits()[id], h = new Date().getHours(); if (!e || e.h[h] + e.h[(h + 23) % 24] + e.h[(h + 1) % 24] < 3) return false;
    var best = Object.keys(habits()).sort(function (a, b) { return score(b, h) - score(a, h); })[0];
    return best === id;
  }

  /* ---------- Tiles ---------- */
  function faceInner(a, mode) {
    if (a.folder) {
      var apps = PF().folders[a.folder].apps.slice(0, 4).map(function (id) { return BY[id]; });
      return '<div class="fgrid">' + apps.map(function (x) { return '<i style="' + tileVars(x.color) + '">' + faceInner(x, 'mini') + '</i>'; }).join('') + '</div>';
    }
    if (a.input) return '<span class="inp">' + ico('input') + '<b>' + esc(a.sub) + '</b></span>';
    var fb = '<span class="letter fb">' + esc(a.name.charAt(0)) + '</span>';
    if (a.banner && mode === 'banner' && PF().tiles === 'banner') return '<img class="banner" src="' + a.banner + '" alt="" onerror="prismImgFail(this,\'' + (a.icon || '') + '\')">' + fb;
    if (a.icon) return '<img class="icon" src="' + a.icon + '" alt="" onerror="prismImgFail(this,\'\')">' + fb;
    if (a.mark) return '<span class="mark" style="--m:url(icons/' + a.mark + '.svg)"></span>';
    if (a.glyph) return '<span class="glyph">' + ico(a.glyph) + '</span>';
    return '<span class="letter">' + esc(a.name.charAt(0)) + '</span>';
  }
  /* A missing banner falls back to the icon, a missing icon to the app's initial. */
  window.prismImgFail = function (img, next) {
    if (next && img.className === 'banner') { img.className = 'icon'; img.setAttribute('onerror', 'prismImgFail(this,\'\')'); img.src = next; return; }
    if (img.parentNode) img.parentNode.classList.add('noimg');
    img.remove();
  };
  function tileVars(c) { return '--c1:' + mix(c, '#ffffff', .12) + ';--c2:' + mix(c, '#000000', .28) + ';--cl:' + mix(c, '#ffffff', .2); }
  function tileHtml(a) {
    return '<div class="lift"><div class="tshadow"></div><div class="float"><div class="tilt"><div class="face' + (a.folder ? ' isfolder' : '') + (a.input ? ' isinput' : '') + '" style="' + tileVars(a.color) + '">' + faceInner(a, 'banner') + '<i class="sheen"></i></div></div></div></div>';
  }

  /* ---------- Appearance and wallpaper ---------- */
  function dayIndex() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function resolvedAppearance() {
    if (PF().appearance !== 'auto') return PF().appearance;
    var d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    return m >= 390 && m < 1050 ? 'light' : 'dark';
  }
  function wallFor(pageIdx) {
    var pw = PF().wall;
    if (pw !== 'auto') { for (var i = 0; i < WALLS.length; i++) if (WALLS[i].id === pw) return WALLS[i]; }
    var light = resolvedAppearance() === 'light', pool = WALLS.filter(function (w) { return !!w.day === light; });
    return pool[(dayIndex() + pageIdx * 2) % pool.length];
  }
  function applyWall() {
    var w = wallFor(S.page);
    if (w.id === S.wallId) return;
    S.wallId = w.id;
    var a = $(S.wallFlip ? 'wallA' : 'wallB'), b = $(S.wallFlip ? 'wallB' : 'wallA');
    S.wallFlip = !S.wallFlip;
    a.style.backgroundImage = 'url(media/walls/' + w.id + '.jpg)';
    a.classList.remove('on'); void a.offsetWidth; a.classList.add('on'); b.classList.remove('on');
    stage.style.setProperty('--glass-img', 'url(media/glass/' + w.id + '.jpg)');
  }
  function applyLook() {
    var ap = resolvedAppearance(), pf = PF();
    S.appearance = ap;
    stage.classList.toggle('light', ap === 'light');
    stage.classList.toggle('dark', ap !== 'light');
    O.look.forEach(function (l) { stage.classList.remove('look-' + l[0]); });
    stage.classList.add('look-' + pf.look);
    stage.classList.toggle('motion', !lite());
    stage.classList.toggle('lite', lite());
    stage.classList.toggle('tiles-icon', pf.tiles === 'icon');
    applyWall();
    clock();
  }

  /* ---------- Render: top bar ---------- */
  var BTNS = [['search', 'search', 'Search'], ['mic', 'mic', 'Voice'], ['cc', 'cc', 'Control Centre'], ['customize', 'settings', 'Customize'], ['profile', 'person', 'Profiles']];
  function renderTop() {
    var seg = $('seg');
    qa('.seg-item', seg).forEach(function (e) { seg.removeChild(e); });
    PAGES.forEach(function (p, i) { var e = document.createElement('div'); e.className = 'seg-item'; e.setAttribute('data-tab', i); e.textContent = p.name; seg.appendChild(e); });
    $('btns').innerHTML = BTNS.map(function (b, i) {
      if (b[0] === 'profile') return '<div class="cbtn glass avatar" data-ctl="' + i + '" aria-label="' + b[2] + '" style="--av:' + PF().color + '"><span>' + esc(initials(PF().name)) + '</span></div>';
      return '<div class="cbtn glass" data-ctl="' + i + '" aria-label="' + b[2] + '">' + ico(b[1]) + '</div>';
    }).join('');
    regStatic();
  }
  function renderPage() {
    var p = page();
    stage.classList.toggle('page-all', !!p.grid);
    stage.classList.toggle('page-today', !!p.today);
    if (p.grid) return renderGrid();
    if (p.today) return renderToday();
    var items = p.items.map(function (id) { return BY[id]; });
    $('row').innerHTML = items.map(function (a, i) { return '<div class="tile" data-i="' + i + '" style="--jd:' + ((i * 67) % 230) + 'ms">' + tileHtml(a) + '</div>'; }).join('');
    $('dock').innerHTML = items.map(function (a, i) {
      return '<div class="dicon" data-i="' + i + '" style="--jd:' + ((i * 67) % 230) + 'ms"><div class="face' + (a.folder ? ' isfolder' : '') + (a.input ? ' isinput' : '') + '" style="' + tileVars(a.color) + '">' + faceInner(a, 'icon') + '</div><i class="dotrun"></i></div>';
    }).join('');
    $('ring').innerHTML = items.map(function (a, i) {
      return '<div class="ctile" data-i="' + i + '" style="--jd:' + ((i * 67) % 230) + 'ms"><div class="face' + (a.folder ? ' isfolder' : '') + (a.input ? ' isinput' : '') + '" style="' + tileVars(a.color) + '">' + faceInner(a, 'banner') + '</div><i class="ring-focus"></i></div>';
    }).join('');
    S.heroId = null;
  }
  function renderGrid() {
    var p = page();
    $('allCount').textContent = p.items.length + (p.items.length === 1 ? ' app' : ' apps') + (NATIVE ? ' on this TV' : ' in this preview');
    $('grid').innerHTML = p.items.map(function (id, i) {
      var a = BY[id], x = (i % 6) * 284, y = Math.floor(i / 6) * 232;
      return '<div class="tile enter" data-i="' + i + '" style="transform:translate3d(' + x + 'px,' + y + 'px,0);--d:' + Math.min(i * 24, 480) + 'ms">' + tileHtml(a)
        + (PF().home.indexOf(id) >= 0 ? '<i class="pin" title="On Home"></i>' : '') + '<div class="gname">' + esc(a.name) + '</div></div>';
    }).join('');
    setTimeout(function () { qa('#grid .tile.enter').forEach(function (e) { e.classList.remove('enter'); }); }, 1000);
  }

  /* ---------- Today page: widgets ---------- */
  var TODAY = [['weather', 'weather'], ['calendar', 'calendar'], ['sky', 'weather'], ['news', 'news'], ['notes', 'notes']];
  var TODAY_ROWS = [[0, 1, 2], [3, 4]];
  function renderToday() {
    var wx = INFO.read('weather'), aq = INFO.read('aqi').data, ev = INFO.events(7), news = INFO.read('news'), notes = (P.notes || []).slice().sort(function (a, b) { return b.t - a.t; });
    var h = new Date().getHours(), greet = h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    $('todayHead').innerHTML = '<h1>' + greet + ', ' + esc(PF().name) + '</h1><span>' + esc(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })) + '</span>';
    var w = wx.data, cards = [];
    cards.push(w ? '<div class="wk wk-weather" data-w="0"><div class="wk-top">' + ico('pin') + esc(w.place) + '</div><div class="wk-temp">' + w.temp + '°</div><div class="wk-cond">' + ico(INFO.wx(w.code)[1]) + esc(INFO.wx(w.code)[0]) + '</div>'
      + '<div class="wk-hours">' + (w.hours || []).slice(1, 6).map(function (x) { return '<span><small>' + fmtTime(new Date(x.t), false, true) + '</small>' + ico(INFO.wx(x.code)[1]) + '<b>' + x.temp + '°</b></span>'; }).join('') + '</div>'
      + (rainSoon(w) ? '<div class="wk-alert">' + ico('rain') + 'Rain likely ' + rainSoon(w) + '</div>' : '') + (wx.sample ? '<em class="smp">Sample</em>' : '') + '</div>'
      : '<div class="wk wk-weather" data-w="0"><div class="wk-top">' + ico('cloud') + 'Weather</div><p class="wk-empty">Weather appears once the TV is online.</p></div>');
    var evs = ev.slice(0, 4);
    cards.push('<div class="wk wk-cal" data-w="1"><div class="wk-top">' + ico('cal') + 'Calendar</div>' + (evs.length ? evs.map(function (e) {
      return '<div class="wk-ev' + (e.src === 'holiday' ? ' hol' : '') + '"><span>' + (e.allDay ? dayWord(e.start) : fmtTime(new Date(e.start))) + '</span><b>' + esc(e.title) + '</b></div>';
    }).join('') : '<p class="wk-empty">Nothing coming up this week.</p>') + (!(P.info.ics || '').trim() ? '<p class="wk-hint">Add your Google Calendar from the phone remote.</p>' : '') + (INFO.read('cal').sample ? '<em class="smp">Sample</em>' : '') + '</div>');
    var m = INFO.moon(new Date());
    cards.push('<div class="wk wk-sky" data-w="2"><div class="wk-top">' + ico('air') + 'Air and sky</div>'
      + (aq ? '<div class="wk-aqi"><b>' + aq.aqi + '</b><span>Air quality<br>' + INFO.aqiLabel(aq.aqi) + '</span><i class="aqbar"><i style="left:' + clamp(aq.aqi / 3, 0, 100) + '%"></i></i></div>' : '<p class="wk-empty">Air quality appears once online.</p>')
      + '<div class="wk-sun">' + (w ? '<span>' + ico('sunrise') + fmtTime(new Date(w.sunrise)) + '</span><span>' + ico('sunset') + fmtTime(new Date(w.sunset)) + '</span>' : '') + '<span>' + ico('moon') + esc(m.name) + '</span></div>' + (INFO.read('aqi').sample ? '<em class="smp">Sample</em>' : '') + '</div>');
    var nl = (news.data || []).slice(0, 4);
    cards.push('<div class="wk wk-news" data-w="3"><div class="wk-top">' + ico('news') + 'Headlines</div>' + (nl.length ? nl.map(function (n) { return '<div class="wk-n"><b>' + esc(n.title) + '</b><span>' + esc(n.source) + '</span></div>'; }).join('') : '<p class="wk-empty">Headlines appear once the TV is online.</p>') + (news.sample ? '<em class="smp">Sample</em>' : '') + '</div>');
    cards.push('<div class="wk wk-notes" data-w="4"><div class="wk-top">' + ico('note') + 'Family notes</div>' + (notes.length ? '<div class="wk-note"><p>' + esc(notes[0].text) + '</p><span>' + esc(notes[0].from || 'Family') + '</span></div>' + (notes.length > 1 ? '<p class="wk-hint">' + (notes.length - 1) + ' more</p>' : '') : '<p class="wk-empty">No notes yet. Leave one from the phone remote.</p>') + '</div>');
    $('today').innerHTML = cards.join('');
    qa('#today .wk').forEach(function (c) { var r = TODAY_POS[+c.getAttribute('data-w')]; c.style.left = r[0] + 'px'; c.style.top = r[1] + 'px'; c.style.width = r[2] + 'px'; c.style.height = r[3] + 'px'; c.classList.add('glass'); reg(c, r[0], r[1]); });
    paint();
  }
  var TODAY_POS = [[120, 300, 560, 330], [710, 300, 560, 330], [1300, 300, 500, 330], [120, 660, 1150, 300], [1300, 660, 500, 300]];
  function rainSoon(w) { var hr = (w.hours || []).slice(0, 6).filter(function (x) { return x.rain >= 60; })[0]; return hr ? 'around ' + fmtTime(new Date(hr.t), false, true) : ''; }
  function dayWord(t) { var d = new Date(t), today = new Date(); today.setHours(0, 0, 0, 0); var diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - today) / 86400000); return diff <= 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }); }
  function todayMove(d) {
    var r = 0, c = 0; TODAY_ROWS.forEach(function (row, ri) { var ci = row.indexOf(S.tw); if (ci >= 0) { r = ri; c = ci; } });
    if (d === 'left' && c > 0) c--; if (d === 'right' && c < TODAY_ROWS[r].length - 1) c++;
    if (d === 'down' && r < TODAY_ROWS.length - 1) { r++; c = c === 2 ? 1 : 0; }
    else if (d === 'up') { if (r === 0) { S.zone = 'top'; S.top = S.page; return; } r--; c = c === 1 ? 2 : 0; }
    S.tw = TODAY_ROWS[r][Math.min(c, TODAY_ROWS[r].length - 1)];
  }

  /* ---------- Layout per look ---------- */
  function layoutRow(focusOn) {
    var p = page(), n = p.items.length, f = cur(), PITCH = 376;
    var first = clamp(f - 1, 0, Math.max(0, n - 4)), off = first * PITCH;
    $('row').style.transform = 'translate3d(' + (-off) + 'px,0,0)';
    qa('#row .tile').forEach(function (e, i) { e.style.transform = 'translate3d(' + (i * PITCH) + 'px,0,0)'; });
    var lab = $('tlabel'), a = BY[p.items[f]];
    lab.textContent = a ? a.name : '';
    lab.style.transform = 'translate3d(' + (120 + f * PITCH - off) + 'px,0,0)';
    lab.classList.toggle('show', focusOn);
  }
  function layoutDock(focusOn) {
    var p = page(), n = p.items.length, f = cur(), G = 24, PAD = 40;
    var B = Math.min(128, Math.floor((1600 - (n - 1) * G - PAD * 2) / n)), mag = [1.42, 1.18, 1.05], xs = [], ws = [], x = PAD;
    for (var i = 0; i < n; i++) {
      var d = Math.abs(i - f), s = focusOn && d < 3 ? mag[d] : 1;
      if (lite() && focusOn) s = d === 0 ? 1.25 : 1;
      xs.push(x); ws.push(B * s); x += B * s + G;
    }
    var total = x - G + PAD, left = (W - total) / 2, dock = $('dock');
    dock.style.width = total + 'px'; dock.style.left = left + 'px';
    reg(dock, left, H - 92 - 212);
    qa('#dock .dicon').forEach(function (e, i) {
      var s = ws[i] / B;
      e.style.width = B + 'px'; e.style.height = B + 'px';
      e.style.transform = 'translate3d(' + (xs[i] + (ws[i] - B) / 2) + 'px,' + (-(s - 1) * 14) + 'px,0) scale(' + s + ')';
    });
    var tip = $('tip'), a = BY[p.items[f]];
    if (a) {
      tip.textContent = a.name;
      var tw = tip.offsetWidth, cx = left + xs[f] + ws[f] / 2, tx = clamp(cx - tw / 2, 60, W - 60 - tw);
      tip.style.transform = 'translate3d(' + tx + 'px,0,0)';
      reg(tip, tx, H - 380 - 60);
    }
    tip.classList.toggle('show', focusOn && !!a);
  }
  function layoutRing() {
    var p = page(), f = cur(), STEP = 24, R = 1060;
    $('ring').style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + (-f * STEP) + 'deg)';
    qa('#ring .ctile').forEach(function (e, i) {
      var d = Math.abs(i - f);
      e.style.transform = 'rotateY(' + (i * STEP) + 'deg) translateZ(' + R + 'px)';
      e.classList.toggle('far', d >= 3); e.classList.toggle('side', d === 2);
    });
    var a = BY[p.items[f]];
    if (a) {
      var sp = $(S.spotFlip ? 'spotA' : 'spotB'), so = $(S.spotFlip ? 'spotB' : 'spotA');
      if (sp.getAttribute('data-c') !== a.color) {
        S.spotFlip = !S.spotFlip;
        sp.style.setProperty('--sc', alpha(a.color, S.appearance === 'light' ? .35 : .55)); sp.setAttribute('data-c', a.color);
        sp.classList.add('on'); so.classList.remove('on');
      }
    }
  }
  function layoutGrid() {
    var f = cur(), row = Math.floor(f / 6);
    if (row < S.gridTop) S.gridTop = row; if (row > S.gridTop + 2) S.gridTop = row - 2;
    $('grid').style.transform = 'translate3d(0,' + (-S.gridTop * 232) + 'px,0)';
  }

  function hero() {
    var a = curItem();
    if (!a || a.id === S.heroId || page().grid || page().today) return;
    S.heroId = a.id;
    var inEl = $(S.heroFlip ? 'heroA' : 'heroB'), outEl = $(S.heroFlip ? 'heroB' : 'heroA');
    S.heroFlip = !S.heroFlip;
    outEl.className = 'hero-t out';
    inEl.className = 'hero-t';
    inEl.textContent = a.name;
    var max = PF().look === 'carousel' ? 1600 : 1300, base = PF().look === 'carousel' ? 104 : 128;
    inEl.style.fontSize = '';
    var w = inEl.scrollWidth;
    if (w > max) inEl.style.fontSize = Math.floor(base * max / w) + 'px';
    void inEl.offsetWidth;
    inEl.className = 'hero-t in';
    var bits = ['<span>' + esc(a.cat || 'App') + '</span>'];
    if (usualNow(a.id)) bits.push('<span class="usual">' + ico('sun') + 'You usually open this around now</span>');
    else if (page().id === 'home' && a.id !== ALL) bits.push('<span>' + (cur() + 1) + ' of ' + (page().items.length - 1) + ' on Home</span>');
    $('heroS').innerHTML = bits.join('<i class="sep"></i>');
  }

  function hints() {
    var h, p = page();
    if (S.moving) h = '<span><b>Left</b> and <b>Right</b> move it</span><span><b>OK</b> places it</span>';
    else if (S.zone === 'top') h = '<span><b>Left</b> and <b>Right</b> switch pages</span>';
    else if (p.today) h = '<span><b>OK</b> opens full screen</span>';
    else if (curItem() && curItem().id === ALL) h = '<span><b>OK</b> shows every app</span>';
    else if (curItem() && curItem().folder) h = '<span><b>OK</b> opens the folder</span><span>Hold <b>OK</b> for options</span>';
    else h = '<span><b>OK</b> opens</span><span>Hold <b>OK</b> for options</span>';
    $('hints').innerHTML = h;
  }

  function topCount() { return PAGES.length + BTNS.length; }
  function paint() {
    var p = page(), rowOn = (S.layer === 'home' && S.zone === 'row') || (S.layer === 'menu' && S.menuFrom === 'home');
    stage.classList.toggle('zone-row', S.zone === 'row');
    stage.classList.toggle('zone-top', S.zone === 'top');
    var seg = $('seg'), tabs = qa('.seg-item', seg);
    tabs.forEach(function (t, i) { t.classList.toggle('on', i === S.page); });
    var onTab = tabs[S.page];
    if (onTab) { var pill = $('segPill'); pill.style.width = onTab.offsetWidth + 'px'; pill.style.transform = 'translate3d(' + onTab.offsetLeft + 'px,0,0)'; }
    seg.classList.toggle('focused', S.layer === 'home' && S.zone === 'top' && S.top < PAGES.length);
    qa('.cbtn').forEach(function (b, i) { b.classList.toggle('focus', S.layer === 'home' && S.zone === 'top' && S.top === PAGES.length + i); });
    var f = cur();
    qa('#row .tile, #dock .dicon, #ring .ctile, #grid .tile').forEach(function (e) {
      var on = rowOn && +e.getAttribute('data-i') === f;
      if (on && !e.classList.contains('focus')) {
        e.classList.remove('from-left', 'from-right', 'from-up');
        if (S.dir) e.classList.add('from-' + (S.dir === 'right' ? 'left' : S.dir === 'left' ? 'right' : 'up'));
      }
      e.classList.toggle('focus', on);
    });
    qa('#today .wk').forEach(function (c) { c.classList.toggle('focus', S.layer === 'home' && S.zone === 'row' && p.today && +c.getAttribute('data-w') === S.tw); });
    if (p.grid) layoutGrid();
    else if (!p.today) { layoutRow(rowOn); layoutDock(rowOn); layoutRing(); hero(); }
    $('row').classList.toggle('dimmed', S.moving);
    stage.classList.toggle('jiggle', S.moving);
    hints();
  }

  /* ---------- Page switching ---------- */
  function goPage(i, viaTabs) {
    i = clamp(i, 0, PAGES.length - 1);
    if (i === S.page) return;
    var dir = i > S.page ? 'swap-r' : 'swap-l';
    S.page = i; S.heroId = null; S.gridTop = 0; S.tw = 0;
    stage.classList.remove('swap-l', 'swap-r'); void stage.offsetWidth;
    if (!lite()) stage.classList.add(dir);
    snd('page');
    renderPage(); applyWall(); paint();
    if (viaTabs) S.top = i;
  }

  /* ---------- Dynamic island: messages and now playing ---------- */
  var islandT = null;
  function island(text, icon, color, ms) {
    var el = $('island');
    el.classList.remove('live');
    $('islandDot').innerHTML = ico(icon || 'info');
    $('islandDot').style.background = color || '#0a84ff';
    $('islandText').textContent = text;
    sizeIsland();
    el.classList.add('show');
    clearTimeout(islandT);
    islandT = setTimeout(function () { islandT = null; el.classList.remove('show'); setTimeout(liveIsland, 480); }, ms || 2800);
  }
  function sizeIsland() {
    var el = $('island'), sp = $('islandText');
    var w = Math.min(1300, sp.scrollWidth + 14 + 36 + 16 + 30 + (el.classList.contains('live') ? 60 : 0));
    el.style.width = w + 'px'; el.style.marginLeft = (-w / 2) + 'px';
  }
  function liveIsland() {
    if (islandT || DREAM) return;
    var np = S.np, el = $('island');
    if (!np || S.layer === 'saver') { if (el.classList.contains('live')) el.classList.remove('show', 'live'); return; }
    el.classList.add('live');
    $('islandDot').innerHTML = np.art ? '<img src="' + np.art + '" alt="">' : ico('play');
    $('islandDot').style.background = '#fa2d48';
    $('islandText').innerHTML = esc(np.title) + (np.artist ? '<em> ' + esc(np.artist) + '</em>' : '');
    $('islandBars').classList.toggle('paused', !np.playing);
    sizeIsland();
    el.classList.add('show');
  }
  function pollNow() {
    var np = NATIVE ? natJSON('nowPlaying') : S.demoNp;
    var key = np ? np.title + '|' + np.artist + '|' + np.playing : '';
    if (key === S.npKey) return;
    var changedSong = np && (!S.np || S.np.title !== np.title);
    S.np = np; S.npKey = key;
    if (S.layer === 'cc') { renderCC(); paintLayer(); }
    if (changedSong && !islandT) { liveIsland(); $('island').classList.add('pop'); setTimeout(function () { $('island').classList.remove('pop'); }, 900); }
    else liveIsland();
  }
  function media(cmd) {
    if (NATIVE) { nat('media', cmd); setTimeout(pollNow, 400); return; }
    if (S.demoNp) { if (cmd === 'toggle') S.demoNp.playing = !S.demoNp.playing; pollNow(); island('Preview: on your TV this controls ' + (S.demoNp.app || 'the music app'), cmd === 'toggle' ? 'pause' : cmd, '#fa2d48', 1800); }
  }

  /* ---------- Control Centre ---------- */
  var CC_BASE = [
    { id: 'wifi', name: 'Network', icon: 'wifi', sub: 'Wi-Fi settings' },
    { id: 'bluetooth', name: 'Bluetooth', icon: 'bt', sub: 'Remotes and speakers' },
    { id: 'inputs', name: 'Inputs', icon: 'input', sub: 'HDMI and AV' },
    { id: 'settings', name: 'TV settings', icon: 'gear', sub: 'Picture, sound, more' },
    { id: 'appearance', name: 'Appearance', icon: 'appearance' },
    { id: 'look', name: 'Layout', icon: 'layout' },
    { id: 'saver', name: 'Start screensaver', icon: 'photo', sub: 'Any button returns' },
    { id: 'phone', name: 'Phone remote', icon: 'phone', sub: 'Scan to pair' },
    { id: 'sleep', name: 'Sleep now', icon: 'moon', sub: 'Switch the TV off', wide: true }
  ];
  var CC = [], CC_ROWS = [];
  function renderCC() {
    CC = []; CC_ROWS = [];
    var html = '';
    if (S.np) {
      html += '<div class="np"><div class="np-art">' + (S.np.art ? '<img src="' + S.np.art + '" alt="">' : ico('play')) + '</div><div class="np-t"><b>' + esc(S.np.title) + '</b><small>' + esc(S.np.artist || S.np.app || '') + '</small></div></div>';
      ['prev', S.np.playing ? 'pause' : 'play', 'next'].forEach(function (c, i) { CC.push({ id: 'np-' + ['prev', 'toggle', 'next'][i], icon: c, np: true }); });
      CC_ROWS.push([0, 1, 2]);
    }
    var base = CC.length, row = [];
    CC_BASE.forEach(function (m, i) {
      CC.push(m);
      if (m.wide) { if (row.length) CC_ROWS.push(row); CC_ROWS.push([base + i]); row = []; }
      else { row.push(base + i); if (row.length === 2) { CC_ROWS.push(row); row = []; } }
    });
    if (row.length) CC_ROWS.push(row);
    html += CC.map(function (m, i) {
      if (m.np) return '<div class="mod npb" data-m="' + i + '" style="--d:' + (i * 30) + 'ms">' + ico(m.icon) + '</div>';
      var sub = m.id === 'appearance' ? lbl(O.appearance, PF().appearance) + (PF().appearance === 'auto' ? ', ' + (S.appearance === 'light' ? 'light now' : 'dark now') : '')
        : m.id === 'look' ? lbl(O.look, PF().look) : m.sub;
      return '<div class="mod' + (m.wide ? ' wide' : '') + '" data-m="' + i + '" style="--d:' + (i * 30) + 'ms"><div class="mi">' + ico(m.icon) + '</div><div><b>' + m.name + '</b><small>' + esc(sub) + '</small></div></div>';
    }).join('');
    $('ccCard').innerHTML = html;
    reg($('ccCard'), W - 120 - 640, 150);
    $('ccCard').style.top = S.np ? '110px' : '150px';
    if (S.cc >= CC.length) S.cc = 0;
  }
  function ccMove(d) {
    var r = 0, c = 0;
    CC_ROWS.forEach(function (row, ri) { var ci = row.indexOf(S.cc); if (ci >= 0) { r = ri; c = ci; } });
    if (d === 'left' && c > 0) c--; if (d === 'right' && c < CC_ROWS[r].length - 1) c++;
    if (d === 'up') { if (r === 0) return closeLayer(); r--; }
    if (d === 'down' && r < CC_ROWS.length - 1) r++;
    S.cc = CC_ROWS[r][Math.min(c, CC_ROWS[r].length - 1)];
  }
  function ccDo(m) {
    if (m.np) return media(m.id.slice(3));
    if (m.id === 'appearance') { cycle('p:appearance', O.appearance, 1); renderCC(); return paintLayer(); }
    if (m.id === 'look') { cycle('p:look', O.look, 1); renderCC(); return paintLayer(); }
    if (m.id === 'saver') { closeAll(); return startSaver(); }
    if (m.id === 'inputs') { closeLayer(); return openInputs(); }
    if (m.id === 'phone') { closeLayer(); return openPhone(); }
    if (m.id === 'sleep') { closeAll(); return startNight(true); }
    native(m.id);
  }

  /* ---------- Customize ---------- */
  function deviceInfo() { if (!S.device) S.device = natJSON('deviceInfo') || { model: 'Browser preview', android: '', memory: '', version: 'preview' }; return S.device; }
  function status() { return natJSON('status') || {}; }
  function settingsList() {
    var st = status(), dv = deviceInfo(), L = [];
    function h(t) { L.push({ h: t }); }
    function ch(name, path, opts) { L.push({ name: name, path: path, opts: opts }); }
    function act(name, a, val) { L.push({ name: name, action: a, val: val }); }
    function inf(name, val) { L.push({ name: name, info: true, val: val }); }
    function sw(name, ok, a) { L.push({ name: name, action: a, val: NATIVE ? (ok ? 'On' : 'Set up') : 'On the TV', state: ok }); }
    h('Profile');
    act('Who is watching', 'profiles', PF().name);
    ch('Ask who is watching at start', 'g:askWho', O.onoff);
    h('Look');
    ch('Layout', 'p:look', O.look); ch('Appearance', 'p:appearance', O.appearance); ch('Wallpaper', 'p:wall', O.wall);
    ch('App tiles', 'p:tiles', O.tiles); ch('Motion', 'g:motion', O.motion); ch('Interface sounds', 'g:sounds', O.onoff);
    h('Home');
    ch('App order', 'p:order', O.order); ch('Start on', 'g:start', O.start); ch('Clock', 'g:clock', O.clock);
    act('Rearrange Home', 'arrange'); act('Restore default Home apps', 'reset');
    h('Screensaver');
    ch('Start after', 'g:ambient', O.ambient);
    SCENES.forEach(function (s) { ch(s[1], 'g:saver.scenes.' + s[0], [[true, 'On'], [false, 'Off']]); });
    ch('Each scene shows for', 'g:saver.each', O.each);
    act('Start the screensaver now', 'saver');
    h('Night');
    ch('Switch the TV off at', 'g:night.off', O.off);
    act('Preview the switch-off countdown', 'nightpreview');
    h('Phone and information');
    act('Pair your phone', 'phone', 'Show code');
    inf('Weather place', P.info.place + ', change from phone');
    inf('Google Calendar', (P.info.ics ? 'Linked' : 'Not linked') + ', change from phone');
    inf('News sources', Object.keys(P.info.news).filter(function (k) { return P.info.news[k]; }).length + ' on, change from phone');
    h('This TV');
    inf('Model', dv.model); if (dv.android) inf('Android', dv.android); if (dv.memory) inf('Memory', dv.memory); inf('Prism version', dv.version);
    sw('System screensaver', st.dream, 'set-dream');
    sw('Night switch-off and phone Back/Home', st.access, 'set-access');
    sw('Typing from your phone in other apps', st.ime, 'set-ime');
    sw('Now playing card', st.listener, 'set-listener');
    sw('Install updates', st.install, 'set-install');
    act(S.update && S.update.newer ? 'Install update ' + S.update.versionName : 'Check for updates', S.update && S.update.newer ? 'install' : 'update', P.updateUrl ? '' : 'Add link from phone');
    act('Open the TV’s own home screen', 'stockhome');
    return L;
  }
  var SET = [];
  function renderSettings() {
    SET = settingsList();
    $('setList').innerHTML = SET.map(function (s, i) {
      var d = 'style="--d:' + Math.min(40 + i * 18, 600) + 'ms"';
      if (s.h) return '<div class="set-h" ' + d + '>' + s.h + '</div>';
      var v;
      if (s.opts) v = ico('updown') + '<span>' + esc(lbl(s.opts, getPath(s.path))) + '</span>';
      else if (s.info) v = '<span>' + esc(s.val) + '</span>';
      else v = (s.val ? '<span class="' + (s.state === true ? 'ok' : s.state === false ? 'todo' : '') + '">' + esc(s.val) + '</span>' : '') + ico('right');
      return '<div class="srow' + (s.info ? ' info' : '') + '" data-s="' + i + '" ' + d + '><span class="k">' + esc(s.name) + '</span><span class="v">' + v + '</span></div>';
    }).join('');
    if (!SET[S.set] || SET[S.set].h) S.set = 1;
    preview();
  }
  function preview() {
    var w = wallFor(S.page), pv = $('preview'), a = BY[PF().home[0]] || { name: 'Netflix' };
    pv.style.backgroundImage = 'url(media/thumbs/' + w.id + '.jpg)';
    pv.className = 'preview pv-' + PF().look;
    $('pvT').textContent = PF().look === 'glass' ? fmtTime(new Date(), true) : a.name;
    $('pvCap').textContent = lbl(O.look, PF().look) + ' layout, ' + (S.appearance === 'light' ? 'light' : 'dark') + ' appearance, ' + w.name;
  }
  function setMove(d) {
    var rows = []; SET.forEach(function (s, i) { if (!s.h) rows.push(i); });
    var k = rows.indexOf(S.set);
    if (d === 'up') S.set = rows[Math.max(0, k - 1)];
    if (d === 'down') S.set = rows[Math.min(rows.length - 1, k + 1)];
    if (d === 'left' || d === 'right') cycleRow(d);
  }
  function cycle(path, opts, step) {
    var v = getPath(path), i = 0;
    for (var j = 0; j < opts.length; j++) if (String(opts[j][0]) === String(v)) i = j;
    i = (i + step + opts.length) % opts.length;
    setPath(path, opts[i][0]); save(); afterPref(path);
    snd('toggle');
    return opts[i][1];
  }
  function afterPref(path) {
    if (path === 'p:tiles' || path === 'p:order') { buildPages(); renderPage(); }
    if (path === 'p:look') S.heroId = null;
    if (path === 'g:night.off') nat('setNight', P.night.off);
    if (path.indexOf('g:info') === 0) INFO.refresh(true);
    applyLook(); paint();
  }
  function cycleRow(d) {
    var s = SET[S.set]; if (!s || !s.opts) return;
    var text = cycle(s.path, s.opts, d === 'right' ? 1 : -1);
    var span = q('[data-s="' + S.set + '"] .v span');
    if (span) { span.textContent = text; span.className = ''; void span.offsetWidth; span.className = d === 'right' ? 'from-right' : 'from-left'; }
    preview();
  }
  function scrollSettings() {
    var row = q('[data-s="' + S.set + '"]'); if (!row) return;
    var list = $('setList'), off = Math.max(0, Math.min(row.offsetTop - 300, list.scrollHeight - 860));
    list.style.transform = 'translate3d(0,' + (-off) + 'px,0)';
  }
  function settingsAction(a) {
    if (a === 'arrange') { closeAll(); goPage(0, true); S.zone = 'row'; if (cur() >= page().items.length - 1) setCur(0); if (PF().order === 'habit') { PF().order = 'manual'; save(); buildPages(); renderPage(); } return startMove(); }
    if (a === 'reset') { PF().home = defaultHome(); save(); buildPages(); S.idx = {}; renderTop(); renderPage(); closeAll(); return island('Home apps restored', 'check', '#30d158'); }
    if (a === 'saver') { closeAll(); return startSaver(); }
    if (a === 'nightpreview') { closeAll(); return startNight(false, true); }
    if (a === 'profiles') return openProfiles();
    if (a === 'phone') return openPhone();
    if (a === 'update') {
      if (!P.updateUrl) return island('Add your update link from the phone remote first', 'update', '#ff9f0a', 3600);
      if (!NATIVE) return island('Preview: on your TV this checks for a new version', 'update');
      island('Checking for updates', 'update', '#0a84ff'); return nat('checkUpdate', P.updateUrl);
    }
    if (a === 'install') { island('Downloading the update', 'update', '#0a84ff', 4000); return nat('installUpdate', S.update.apk); }
    if (a === 'stockhome') return NATIVE ? nat('openStockHome') : island('Preview: on your TV this opens the TV’s own home screen', 'home');
    if (a.indexOf('set-') === 0) {
      if (a === 'set-listener') return island('Needs one computer command. See "Now playing" in the guide.', 'info', '#ff9f0a', 5000);
      return NATIVE ? nat('open', a) : island('Preview: on your TV this opens the right settings screen', 'gear');
    }
  }

  /* ---------- Context menu ---------- */
  function openMenu(from, item) {
    var a = item || curItem(); if (!a || a.id === ALL) return;
    from = from || 'home';
    var p = page(), onHome = PF().home.indexOf(a.id) >= 0, o = [];
    if (from === 'folder') { o = [['open', 'Open', 'play'], ['unfold', 'Remove from folder', 'minus', 1]]; }
    else if (a.folder) { o = [['open', 'Open folder', 'folder']]; if (p.id === 'home') o.push(['move', 'Move', 'move']); o.push(['unfolder', 'Ungroup folder', 'minus', 1]); }
    else {
      o.push(['open', 'Open', a.input ? 'input' : 'play']);
      if (p.id === 'home' && from === 'home') o.push(['move', 'Move', 'move']);
      if (!a.input && from !== 'inputs') o.push(['folder', 'Add to a folder', 'folder']);
      o.push(onHome ? ['unpin', 'Remove from Home', 'minus', 1] : ['pin', 'Add to Home', 'plus']);
      if (NATIVE && !a.input) o.push(['info', 'App info', 'info']);
    }
    showMenu(a, o, from);
  }
  function showMenu(a, o, from, title, sub) {
    S.menuOpts = o; S.menu = 0; S.menuFor = a; S.menuFrom = from;
    var card = $('menuCard');
    card.innerHTML = '<h3>' + esc(title || a.name) + '</h3><p>' + esc(sub || a.cat || 'App') + '</p>' + o.map(function (x, i) { return '<div class="opt' + (x[3] ? ' danger' : '') + '" data-o="' + i + '"><span>' + esc(x[1]) + '</span>' + ico(x[2]) + '</div>'; }).join('');
    var el = from === 'folder' ? q('#folderGrid [data-i="' + S.fi + '"] .face') : from === 'inputs' ? q('#inputRow [data-i="' + S.inp + '"] .face') : from === 'profiles' ? q('#profRow [data-i="' + S.prof + '"]') : focusEl();
    var r = el ? stageRect(el) : { x: 760, y: 600, w: 400, h: 200 };
    var ch = 130 + o.length * 72, cx = clamp(r.x, 60, W - 540), cy = r.y - ch - 30;
    if (cy < 120) cy = Math.min(H - ch - 60, r.y + r.h + 30);
    card.style.left = cx + 'px'; card.style.top = cy + 'px';
    card.style.transformOrigin = clamp(r.x + r.w / 2 - cx, 40, 440) + 'px ' + (cy < r.y ? '100%' : '0%');
    reg(card, cx, cy);
    snd('select');
    openLayer('menu');
  }
  function menuDo(k) {
    var a = S.menuFor, from = S.menuFrom;
    if (k.indexOf('to:') === 0) { closeLayer(); return addToFolder(a.id, k.slice(3)); }
    if (k === 'folder') {
      var fs = PF().folders, opts = Object.keys(fs).map(function (f) { return ['to:' + f, fs[f].name, 'folder']; });
      opts.push(['to:new', 'New folder', 'plus']);
      return showMenu(a, opts, from, 'Add to a folder', a.name);
    }
    if (k === 'pdel') { closeLayer(); return deleteProfile(a.pid); }
    if (k === 'prename') { closeLayer(); return island('Rename profiles from the phone remote', 'phone', '#0a84ff', 3200); }
    closeLayer();
    if (k === 'open') return activate(a);
    if (k === 'move') return startMove();
    if (k === 'pin') {
      if (PF().home.length >= HOME_MAX) return island('Home holds ' + HOME_MAX + ' items. Remove one first.', 'info', '#ff9f0a');
      PF().home.push(a.id); save(); rebuild(); island(a.name + ' added to Home', 'plus', '#30d158');
    } else if (k === 'unpin') {
      if (PF().home.length <= 1) return island('Home needs at least one app', 'info', '#ff9f0a');
      PF().home = PF().home.filter(function (x) { return x !== a.id; }); save(); rebuild(); island(a.name + ' removed from Home', 'minus', '#8e8e93');
    } else if (k === 'info') nat('open', 'appinfo:' + a.id);
    else if (k === 'unfold') removeFromFolder(S.fold, a.id);
    else if (k === 'unfolder') ungroup(a.folder);
    if (S.layer === 'inputs') renderInputs();
  }
  function rebuild() { buildPages(); setCur(clamp(cur(), 0, Math.max(0, page().items.length - 1))); renderTop(); renderPage(); paint(); }

  /* ---------- Folders ---------- */
  function addToFolder(id, fid) {
    var pf = PF();
    if (fid === 'new') {
      var n = 1; while (Object.keys(pf.folders).some(function (f) { return pf.folders[f].name === 'Folder ' + n; })) n++;
      fid = 'f' + Date.now().toString(36); pf.folders[fid] = { name: 'Folder ' + n, apps: [] };
      var at = pf.home.indexOf(id); if (at >= 0) pf.home.splice(at, 0, 'folder:' + fid); else pf.home.push('folder:' + fid);
    }
    var f = pf.folders[fid];
    if (f.apps.indexOf(id) < 0) f.apps.push(id);
    pf.home = pf.home.filter(function (x) { return x !== id; });
    save(); rebuild(); island(BY[id].name + ' moved to ' + f.name, 'folder', '#ff9f0a');
  }
  function removeFromFolder(fid, id) {
    var pf = PF(), f = pf.folders[fid]; if (!f) return;
    f.apps = f.apps.filter(function (x) { return x !== id; });
    var at = pf.home.indexOf('folder:' + fid);
    if (pf.home.indexOf(id) < 0) pf.home.splice(at + 1, 0, id);
    if (!f.apps.length) { delete pf.folders[fid]; pf.home = pf.home.filter(function (x) { return x !== 'folder:' + fid; }); closeAll(); }
    save(); rebuild();
    if (S.layer === 'folder') renderFolder();
  }
  function ungroup(fid) {
    var pf = PF(), f = pf.folders[fid]; if (!f) return;
    var at = pf.home.indexOf('folder:' + fid);
    pf.home.splice.apply(pf.home, [at, 1].concat(f.apps.filter(function (x) { return pf.home.indexOf(x) < 0; })));
    delete pf.folders[fid]; save(); rebuild(); island(f.name + ' ungrouped', 'folder', '#8e8e93');
  }
  function openFolder(fid) { S.fold = fid; S.fi = 0; renderFolder(); openLayer('folder'); }
  function renderFolder() {
    var f = PF().folders[S.fold]; if (!f) return;
    $('folderName').textContent = f.name;
    $('folderGrid').innerHTML = f.apps.map(function (id, i) {
      var a = BY[id];
      return '<div class="tile" data-i="' + i + '" style="--d:' + (i * 40) + 'ms">' + tileHtml(a) + '<div class="gname">' + esc(a.name) + '</div></div>';
    }).join('');
    var cols = Math.min(4, f.apps.length), rows = Math.ceil(f.apps.length / 4), cw = cols * 280 + 120, chh = rows * 230 + 200;
    var card = $('folderCard'); card.style.width = cw + 'px'; card.style.height = chh + 'px'; card.style.left = (W - cw) / 2 + 'px'; card.style.top = Math.max(120, (H - chh) / 2) + 'px';
    reg(card, (W - cw) / 2, Math.max(120, (H - chh) / 2));
    qa('#folderGrid .tile').forEach(function (e, i) { e.style.transform = 'translate3d(' + ((i % 4) * 280) + 'px,' + (Math.floor(i / 4) * 230) + 'px,0)'; });
  }

  /* ---------- Inputs ---------- */
  function openInputs() { if (!INPUTS.length) return island('No TV inputs were found', 'input', '#ff9f0a'); S.inp = 0; renderInputs(); openLayer('inputs'); }
  function renderInputs() {
    $('inputRow').innerHTML = INPUTS.map(function (inp, i) {
      var a = BY['input:' + inp.id];
      return '<div class="tile" data-i="' + i + '" style="--d:' + (i * 50) + 'ms">' + tileHtml(a) + '<div class="it"><b>' + esc(a.name) + '</b><span>' + esc(a.name === inp.label ? 'Rename from the phone remote' : inp.label) + '</span></div></div>';
    }).join('');
    qa('#inputRow .tile').forEach(function (e, i) { e.style.transform = 'translate3d(' + (i * 376) + 'px,0,0)'; });
    $('inputRow').style.left = Math.max(120, (W - INPUTS.length * 376 + 40) / 2) + 'px';
  }

  /* ---------- Search and voice ---------- */
  var KB = { abc: 'abcdefghijklmnopqrstuvwxyz'.split(''), num: '1234567890-&\'.:'.split('') };
  var KB2 = [['space', 'Space', 'space'], ['del', 'Delete', 'del'], ['clear', 'Clear', 'minus'], ['num', '123', null], ['mic', 'Voice', 'mic']];
  function openSearch(text) {
    S.sq = text || ''; S.sz = 'k0'; S.sk = [0, 0]; S.sres = 0; S.sact = 0; S.num = false;
    renderSearch(); openLayer('search');
  }
  function searchResults() {
    var qv = S.sq.trim().toLowerCase(); if (!qv) return [];
    var items = APPS.map(function (a) { return a.id; }).concat(INPUTS.map(function (i) { return 'input:' + i.id; })).concat(Object.keys(PF().folders).map(function (f) { return 'folder:' + f; }));
    return items.map(function (id) {
      var n = BY[id].name.toLowerCase(), s = n.indexOf(qv) === 0 ? 3 : n.split(/\s+/).some(function (w) { return w.indexOf(qv) === 0; }) ? 2 : n.indexOf(qv) >= 0 ? 1 : fuzzy(n, qv) ? 0.5 : 0;
      return { id: id, s: s };
    }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s || BY[a.id].name.localeCompare(BY[b.id].name); }).slice(0, 8).map(function (x) { return x.id; });
  }
  function fuzzy(n, qv) { var i = 0; for (var k = 0; k < n.length && i < qv.length; k++) if (n[k] === qv[i]) i++; return i === qv.length && qv.length > 2; }
  function searchActions() {
    if (!S.sq.trim()) return [];
    return SEARCH_TARGETS.filter(function (t) { return !NATIVE || t.pkgs.some(function (p) { return !!BY[p]; }); }).map(function (t) { return t; });
  }
  function renderSearch() {
    $('sField').innerHTML = (S.sq ? esc(S.sq) : '<span class="ph">Search apps, inputs, or YouTube</span>') + '<i class="caret"></i>';
    var keys = S.num ? KB.num : KB.abc;
    $('sKeys0').innerHTML = keys.map(function (k, i) { return '<div class="key" data-k="0:' + i + '">' + esc(k) + '</div>'; }).join('');
    $('sKeys1').innerHTML = KB2.map(function (k, i) { return '<div class="key wide" data-k="1:' + i + '">' + (k[2] ? ico(k[2]) : '') + '<span>' + (k[0] === 'num' ? (S.num ? 'ABC' : '123') : k[1]) + '</span></div>'; }).join('');
    var res = searchResults(), acts = searchActions();
    $('sRes').innerHTML = res.length ? res.map(function (id, i) { var a = BY[id]; return '<div class="tile" data-r="' + i + '">' + tileHtml(a) + '<div class="gname">' + esc(a.name) + '</div></div>'; }).join('')
      : (S.sq.trim() ? '<p class="s-none">No apps or inputs match “' + esc(S.sq) + '”</p>' : '<p class="s-none">Type with the remote, speak with Voice, or type on your phone.</p>');
    qa('#sRes .tile').forEach(function (e, i) { e.style.transform = 'translate3d(' + (i * 284) + 'px,0,0)'; });
    $('sAct').innerHTML = acts.map(function (t, i) { return '<div class="sa glass" data-a="' + i + '">' + ico('search') + '<span>Search ' + esc(t.name) + ' for “' + esc(S.sq.trim()) + '”</span></div>'; }).join('');
    reg($('sAct'), 0, 0); qa('#sAct .sa').forEach(function (e) { reg(e); });
    S.sres = clamp(S.sres, 0, Math.max(0, res.length - 1)); S.sact = clamp(S.sact, 0, Math.max(0, acts.length - 1));
    paintSearch();
  }
  function paintSearch() {
    qa('#search .key, #search .tile, #search .sa').forEach(function (e) { e.classList.remove('focus'); });
    var el = S.sz === 'k0' ? q('[data-k="0:' + S.sk[0] + '"]') : S.sz === 'k1' ? q('[data-k="1:' + S.sk[1] + '"]') : S.sz === 'res' ? q('#sRes [data-r="' + S.sres + '"]') : q('#sAct [data-a="' + S.sact + '"]');
    if (el) el.classList.add('focus');
  }
  function searchMove(d) {
    var res = searchResults().length, acts = searchActions().length, zones = ['k0', 'k1'].concat(res ? ['res'] : []).concat(acts ? ['act'] : []), zi = zones.indexOf(S.sz);
    if (d === 'up') { if (zi === 0) return; S.sz = zones[zi - 1]; }
    if (d === 'down') { if (zi < zones.length - 1) S.sz = zones[zi + 1]; }
    if (d === 'left' || d === 'right') {
      var s = d === 'left' ? -1 : 1;
      if (S.sz === 'k0') S.sk[0] = clamp(S.sk[0] + s, 0, (S.num ? KB.num : KB.abc).length - 1);
      if (S.sz === 'k1') S.sk[1] = clamp(S.sk[1] + s, 0, KB2.length - 1);
      if (S.sz === 'res') S.sres = clamp(S.sres + s, 0, res - 1);
      if (S.sz === 'act') S.sact = clamp(S.sact + s, 0, acts - 1);
    }
    paintSearch();
  }
  function searchOk() {
    if (S.sz === 'k0') { S.sq += (S.num ? KB.num : KB.abc)[S.sk[0]]; snd('key'); return renderSearch(); }
    if (S.sz === 'k1') {
      var k = KB2[S.sk[1]][0]; snd('key');
      if (k === 'space') S.sq += ' '; if (k === 'del') S.sq = S.sq.slice(0, -1); if (k === 'clear') S.sq = '';
      if (k === 'num') { S.num = !S.num; S.sk[0] = 0; }
      if (k === 'mic') return voice();
      return renderSearch();
    }
    if (S.sz === 'res') { var id = searchResults()[S.sres]; closeLayer(); return activate(BY[id]); }
    if (S.sz === 'act') { var t = searchActions()[S.sact]; return searchIn(t, S.sq.trim()); }
  }
  function searchIn(t, text) {
    if (!t) return;
    if (NATIVE) { var pkg = t.pkgs.filter(function (p) { return !!BY[p]; })[0] || t.pkgs[0]; closeAll(); recordLaunch(pkg); return nat('search', pkg, text); }
    island('Preview: on your TV this searches ' + t.name + ' for “' + text + '”', 'search', '#0a84ff', 3200);
  }
  function voice() {
    if (NATIVE && nat('voice') !== false) return;
    island('Voice works on the TV with the remote’s mic button', 'mic', '#bf5af2', 3000);
  }
  function onVoice(text) {
    text = String(text || '').trim(); if (!text) return;
    island('“' + text + '”', 'mic', '#bf5af2', 2600);
    var t = text.toLowerCase(), m;
    if ((m = /^(?:search|play|find|watch)\s+(.+?)\s+on\s+(youtube|netflix|prime(?: video)?|play store)$/.exec(t))) {
      var target = SEARCH_TARGETS.filter(function (x) { return x.name.toLowerCase().indexOf(m[2].split(' ')[0]) === 0; })[0];
      return searchIn(target, m[1]);
    }
    if (/(good ?night|turn off|switch off|sleep)/.test(t)) return startNight(true);
    if (/(screen ?saver|show photos|photo frame)/.test(t)) { closeAll(); return startSaver(); }
    if ((m = /^(?:open|launch|start|go to|switch to|show)\s+(.+)$/.exec(t))) {
      S.sq = m[1]; var r = searchResults();
      if (r.length) { closeAll(); return activate(BY[r[0]]); }
      if (/today/.test(m[1])) { closeAll(); return goPage(pageIndex('today'), true); }
    }
    if (S.layer !== 'search') openSearch(text); else { S.sq = text; renderSearch(); }
  }

  /* ---------- Profiles ---------- */
  function openProfiles(atStart) {
    S.prof = Math.max(0, P.profiles.map(function (p) { return p.id; }).indexOf(P.active)); S.profStart = !!atStart;
    renderProfiles(); openLayer('profiles');
  }
  function renderProfiles() {
    var list = P.profiles.map(function (p, i) { return '<div class="prof" data-i="' + i + '" style="--av:' + p.color + ';--d:' + (i * 60) + 'ms"><div class="pav"><span>' + esc(initials(p.name)) + '</span></div><b>' + esc(p.name) + '</b></div>'; });
    list.push('<div class="prof add" data-i="' + P.profiles.length + '" style="--d:' + (P.profiles.length * 60) + 'ms"><div class="pav">' + ico('plus') + '</div><b>Add profile</b></div>');
    $('profRow').innerHTML = list.join('');
    qa('#profRow .prof').forEach(function (e, i) { e.classList.toggle('focus', i === S.prof); });
  }
  function profOk() {
    if (S.prof === P.profiles.length) {
      if (P.profiles.length >= 6) return island('Up to six profiles', 'info', '#ff9f0a');
      var n = P.profiles.length + 1, id = 'p' + Date.now().toString(36);
      P.profiles.push(profileDefaults(id, 'Profile ' + n, COLORS[(n - 1) % COLORS.length]));
      save(); renderProfiles(); return island('Profile ' + n + ' added. Rename it from the phone remote.', 'person', '#30d158', 3400);
    }
    switchProfile(P.profiles[S.prof].id);
  }
  function switchProfile(id) {
    var changed = id !== P.active;
    P.active = id; save(); closeAll();
    loadApps(); S.idx = {}; S.page = 0; S.wallId = null; S.heroId = null;
    stage.classList.add('switching');
    setTimeout(function () { renderTop(); applyLook(); renderPage(); paint(); stage.classList.remove('switching'); }, lite() ? 60 : 260);
    if (changed) island('Hello, ' + PF().name, 'person', PF().color);
  }
  function deleteProfile(pid) {
    if (P.profiles.length <= 1) return island('Keep at least one profile', 'info', '#ff9f0a');
    P.profiles = P.profiles.filter(function (p) { return p.id !== pid; }); delete P.habits[pid];
    if (P.active === pid) P.active = P.profiles[0].id;
    save(); S.prof = 0; renderProfiles(); renderTop(); applyLook(); rebuild();
  }

  /* ---------- Phone pairing ---------- */
  function openPhone() {
    var c = natJSON('companion') || { url: 'http://192.168.1.20:8765/?t=preview', preview: true };
    $('qr').innerHTML = qrSvg(c.url);
    $('phoneUrl').textContent = c.url.replace(/\?t=.*/, '');
    $('phoneNote').textContent = c.preview ? 'Preview: on your TV this shows your TV’s own address.' : c.url ? 'Your phone and TV need to be on the same Wi-Fi.' : 'Connect the TV to Wi-Fi first.';
    openLayer('phone');
  }
  function qrSvg(text) {
    if (!window.qrcode) return '';
    var qr = window.qrcode(0, 'M'); qr.addData(text); qr.make();
    var n = qr.getModuleCount(), s = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) s += '<rect x="' + c + '" y="' + r + '" width="1.02" height="1.02" rx=".28"/>';
    return '<svg viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" aria-label="QR code"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff" rx="2"/><g fill="#1d1d1f">' + s + '</g></svg>';
  }

  /* ---------- Night switch-off ---------- */
  var nightT = null;
  function startNight(now, preview) {
    closeAll(); stopSaver();
    S.night = { left: now ? 10 : 60, total: now ? 10 : 60, preview: !!preview, choice: 0 };
    $('nightMsg').textContent = now ? 'Switching off' : 'Time for bed';
    $('nightSub').textContent = 'Your TV switches off in';
    renderNight(); openLayer('night'); snd('select');
    clearInterval(nightT);
    nightT = setInterval(function () {
      S.night.left--; renderNight();
      if (S.night.left <= 0) { clearInterval(nightT); sleepNow(); }
    }, 1000);
  }
  function renderNight() {
    var n = S.night, total = n.total;
    $('nightNum').textContent = Math.max(0, n.left);
    $('nightRing').style.strokeDashoffset = String(565.5 * (1 - Math.max(0, n.left) / total));
    qa('#night .nb').forEach(function (b, i) { b.classList.toggle('focus', i === n.choice); });
  }
  function nightOk() {
    var c = S.night.choice; clearInterval(nightT); closeLayer();
    if (c === 0) {
      if (S.night.preview) return island('Preview finished. The TV stays on.', 'moon', '#5e5ce6');
      nat('snoozeNight', 30); island('OK, the TV stays on for 30 more minutes', 'moon', '#5e5ce6', 3200);
      if (S.lastApp && NATIVE && S.nightFromApp) nat('launch', S.lastApp);
      return;
    }
    sleepNow();
  }
  function sleepNow() {
    closeAll(); clearInterval(nightT);
    if (S.night && S.night.preview) return island('Preview: here the TV would switch off', 'power', '#5e5ce6', 3000);
    var ok = NATIVE ? nat('sleepNow') : false;
    if (ok === true) return;
    openLayer('blackout');
    if (NATIVE) setTimeout(function () { island('To switch off fully, turn on Prism in Accessibility settings', 'power', '#ff9f0a', 6000); }, 400);
  }

  /* ---------- Layers ---------- */
  var LAYER_EL = { cc: 'cc', settings: 'settings', menu: 'menu', folder: 'folder', inputs: 'inputs', search: 'search', profiles: 'profiles', phone: 'phone', night: 'night', blackout: 'blackout' };
  function openLayer(id) {
    if (S.layer !== 'home' && S.layer !== id) S.stack.push(S.layer);
    S.layer = id;
    var el = $(LAYER_EL[id]); el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
    dimFor(); paintLayer(); paint();
  }
  function dimFor() {
    var l = S.layer, under = S.stack[S.stack.length - 1];
    var full = l === 'settings' || l === 'search' || l === 'profiles' || l === 'phone' || l === 'night' || l === 'blackout' || (l === 'menu' && (under === 'settings' || under === 'profiles'));
    stage.classList.toggle('dim', l !== 'home');
    stage.classList.toggle('dimmore', full);
    stage.classList.toggle('menuopen', l === 'menu');
  }
  function closeLayer() {
    var id = S.layer; if (id === 'home') return;
    var el = $(LAYER_EL[id]); el.classList.remove('open'); el.setAttribute('aria-hidden', 'true');
    if (id === 'night') clearInterval(nightT);
    S.layer = S.stack.pop() || 'home';
    dimFor(); snd('back'); paintLayer(); paint();
  }
  function closeAll() { while (S.layer !== 'home') closeLayer(); }
  function paintLayer() {
    qa('.mod, .srow, .opt').forEach(function (e) { e.classList.remove('focus'); });
    if (S.layer === 'cc') { var m = q('[data-m="' + S.cc + '"]'); if (m) m.classList.add('focus'); }
    if (S.layer === 'settings') { var r = q('[data-s="' + S.set + '"]'); if (r) r.classList.add('focus'); scrollSettings(); }
    if (S.layer === 'menu') { var o = q('[data-o="' + S.menu + '"]'); if (o) o.classList.add('focus'); }
    qa('#folderGrid .tile').forEach(function (e) { e.classList.toggle('focus', S.layer === 'folder' && +e.getAttribute('data-i') === S.fi); });
    qa('#inputRow .tile').forEach(function (e) { e.classList.toggle('focus', S.layer === 'inputs' && +e.getAttribute('data-i') === S.inp); });
    qa('#profRow .prof').forEach(function (e, i) { e.classList.toggle('focus', i === S.prof); });
  }

  /* ---------- Opening things ---------- */
  function focusEl() {
    var p = page(), f = cur();
    if (p.today) return q('#today [data-w="' + S.tw + '"]');
    if (p.grid) return q('#grid [data-i="' + f + '"] .face');
    if (PF().look === 'glass') return q('#dock [data-i="' + f + '"] .face');
    if (PF().look === 'carousel') return q('#ring [data-i="' + f + '"] .face');
    return q('#row [data-i="' + f + '"] .face');
  }
  function activate(a) {
    if (!a) return;
    if (a.id === ALL) return goPage(PAGES.length - 1, true);
    if (a.folder) { snd('select'); return openFolder(a.folder); }
    launch(a);
  }
  function recordLaunch(id) { record(id); S.lastApp = id; }
  function launch(a) {
    if (S.busy || !a) return;
    var el = S.layer === 'folder' ? q('#folderGrid [data-i="' + S.fi + '"] .face') : S.layer === 'inputs' ? q('#inputRow [data-i="' + S.inp + '"] .face') : focusEl();
    var r = el ? stageRect(el) : { x: 760, y: 440, w: 400, h: 200 }, L = $('launch');
    S.busy = true; snd('open'); recordLaunch(a.id);
    L.style.setProperty('--lc1', mix(a.color, '#ffffff', .12)); L.style.setProperty('--lc2', mix(a.color, '#000000', .5));
    $('lmark').innerHTML = a.input ? '<span class="glyph">' + ico('input') + '</span>' : faceInner(a, 'icon');
    L.className = 'launch on'; L.style.opacity = '1'; L.style.transition = 'none';
    L.style.clipPath = 'inset(' + r.y + 'px ' + (W - r.x - r.w) + 'px ' + (H - r.y - r.h) + 'px ' + r.x + 'px round 26px)';
    void L.offsetWidth;
    L.style.transition = '';
    L.className = 'launch on grow';
    L.style.clipPath = 'inset(0px 0px 0px 0px round 0px)';
    setTimeout(function () {
      closeAll();
      if (NATIVE) {
        var ok = a.input ? nat('openInput', a.input) : nat('launch', a.id);
        if (ok === false) { island('Could not open ' + a.name, 'info', '#ff9f0a'); returnFromApp(); }
        setTimeout(function () { if (S.busy && document.visibilityState === 'visible' && !S.paused) returnFromApp(); }, 6000);
      } else { island('Preview: on your TV this opens ' + a.name, a.input ? 'input' : 'play', a.color, 2200); setTimeout(returnFromApp, 1000); }
    }, lite() ? 360 : 600);
  }
  function returnFromApp() {
    var L = $('launch');
    L.style.transition = 'opacity 380ms ease'; L.style.opacity = '0';
    setTimeout(function () { L.className = 'launch'; L.style.clipPath = ''; L.style.opacity = ''; S.busy = false; }, 400);
  }
  function native(cmd) {
    if (NATIVE) { if (nat('open', cmd) === false) island('That screen is not available on this TV', 'info', '#ff9f0a'); return; }
    island('Preview: on your TV this opens ' + ({ wifi: 'network settings', bluetooth: 'Bluetooth', settings: 'TV settings' }[cmd] || 'that screen'), ({ wifi: 'wifi', bluetooth: 'bt' }[cmd] || 'gear'));
  }

  /* ---------- Screensaver ---------- */
  function startSaver(only) {
    if (S.layer === 'saver') return;
    closeAll(); S.stack = [];
    S.layer = 'saver'; S.saverOnly = only || null;
    var el = $('saver'); el.classList.add('open');
    $('island').classList.remove('show', 'live');
    SAVER.start(only);
  }
  function stopSaver() {
    if (S.layer !== 'saver') return false;
    SAVER.stop(); $('saver').classList.remove('open');
    S.layer = 'home'; paint(); setTimeout(liveIsland, 600);
    return true;
  }
  function wake() { S.idle = Date.now(); if (S.layer === 'blackout') { closeLayer(); return true; } return stopSaver(); }

  /* ---------- Clock and periodic work ---------- */
  function clock() {
    var d = new Date(), wx = INFO.read('weather').data;
    $('clockT').innerHTML = fmtTime(d, true) + (P.clock === '12' ? '<small>' + (d.getHours() < 12 ? 'AM' : 'PM') + '</small>' : '');
    $('clockD').innerHTML = esc(d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })) + (wx ? '<span class="cw">' + ico(INFO.wx(wx.code)[1]) + wx.temp + '°</span>' : '');
    $('bigT').textContent = fmtTime(d, true);
    $('bigD').innerHTML = esc(d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })) + (wx ? '<span class="bw">' + ico(INFO.wx(wx.code)[1]) + wx.temp + '° ' + esc(INFO.wx(wx.code)[0]) + '</span>' : '');
  }
  function glance() { clock(); }
  function tick() {
    clock();
    if (PF().appearance === 'auto' && resolvedAppearance() !== S.appearance) { S.wallId = null; applyLook(); paint(); }
    var mins = +P.ambient;
    if (mins && S.layer === 'home' && !S.busy && !S.moving && Date.now() - S.idle > mins * 60000) startSaver();
  }

  /* ---------- Input ---------- */
  var okTimer = null, okHeld = false, okDown = false;
  var KEYS = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 27: 'back', 8: 'back', 461: 'back', 10009: 'back', 82: 'menu', 93: 'menu' };
  function key(e) {
    var name = KEYS[e.keyCode];
    if (S.layer === 'search' && e.type === 'keydown' && e.key && e.key.length === 1 && /[\w \-&'.:]/.test(e.key)) { S.sq += e.key.toLowerCase(); renderSearch(); e.preventDefault(); return; }
    if (S.layer === 'search' && e.type === 'keydown' && e.keyCode === 8) { S.sq = S.sq.slice(0, -1); renderSearch(); e.preventDefault(); return; }
    if (!name) return;
    e.preventDefault();
    if (e.type === 'keydown' && wake()) { okDown = false; return; }
    if (S.busy || DREAM) return;
    if (name === 'ok') {
      if (e.type === 'keydown') {
        if (okDown) return; okDown = true; okHeld = false;
        okTimer = setTimeout(function () { okHeld = true; hold(); }, 550);
      } else { clearTimeout(okTimer); if (okDown && !okHeld) ok(); okDown = false; }
      return;
    }
    if (e.type !== 'keydown') return;
    S.idle = Date.now();
    if (name === 'back') return back();
    if (name === 'menu') return hold();
    move(name);
  }
  function hold() {
    if (S.layer === 'home' && S.zone === 'row' && !S.moving && !page().today) return openMenu('home');
    if (S.layer === 'folder') { var id = PF().folders[S.fold].apps[S.fi]; return openMenu('folder', BY[id]); }
    if (S.layer === 'inputs') return openMenu('inputs', BY['input:' + INPUTS[S.inp].id]);
    if (S.layer === 'profiles' && S.prof < P.profiles.length) {
      var p = P.profiles[S.prof];
      return showMenu({ id: 'profile', name: p.name, pid: p.id }, [['prename', 'Rename', 'phone'], ['pdel', 'Delete profile', 'minus', 1]], 'profiles', p.name, 'Profile');
    }
  }
  function move(d) {
    S.dir = d;
    var L = S.layer;
    if (L === 'cc') { ccMove(d); snd('move'); return paintLayer(); }
    if (L === 'settings') { setMove(d); if (d === 'up' || d === 'down') snd('move'); return paintLayer(); }
    if (L === 'menu') { if (d === 'up') S.menu = Math.max(0, S.menu - 1); if (d === 'down') S.menu = Math.min(S.menuOpts.length - 1, S.menu + 1); snd('move'); return paintLayer(); }
    if (L === 'folder') { var n = PF().folders[S.fold].apps.length; if (d === 'left') S.fi = Math.max(0, S.fi - 1); if (d === 'right') S.fi = Math.min(n - 1, S.fi + 1); if (d === 'down') S.fi = Math.min(n - 1, S.fi + 4); if (d === 'up') S.fi = Math.max(0, S.fi - 4); snd('move'); return paintLayer(); }
    if (L === 'inputs') { if (d === 'left') S.inp = Math.max(0, S.inp - 1); if (d === 'right') S.inp = Math.min(INPUTS.length - 1, S.inp + 1); snd('move'); return paintLayer(); }
    if (L === 'profiles') { if (d === 'left') S.prof = Math.max(0, S.prof - 1); if (d === 'right') S.prof = Math.min(P.profiles.length, S.prof + 1); snd('move'); return paintLayer(); }
    if (L === 'search') { snd('move'); return searchMove(d); }
    if (L === 'night') { if (d === 'left') S.night.choice = 0; if (d === 'right') S.night.choice = 1; return renderNight(); }
    if (L === 'phone') return;
    var p = page(), n2 = p.items.length, f = cur(), before = f + S.zone + S.top + S.page + S.tw;
    if (S.moving) { if (d === 'left') moveTile(-1); if (d === 'right') moveTile(1); return; }
    if (S.zone === 'row') {
      if (p.today) todayMove(d);
      else if (p.grid) {
        if (d === 'left' && f % 6 > 0) f--;
        if (d === 'right' && f % 6 < 5 && f + 1 < n2) f++;
        if (d === 'down') f = Math.min(f + 6, n2 - 1);
        if (d === 'up') { if (f < 6) { S.zone = 'top'; S.top = S.page; } else f -= 6; }
      } else {
        if (d === 'left') f = Math.max(0, f - 1);
        if (d === 'right') f = Math.min(n2 - 1, f + 1);
        if (d === 'up') { S.zone = 'top'; S.top = S.page; }
      }
      if (!p.today) setCur(f);
    } else {
      if (d === 'left') S.top = Math.max(0, S.top - 1);
      if (d === 'right') S.top = Math.min(topCount() - 1, S.top + 1);
      if (d === 'down') { S.zone = 'row'; S.dir = 'up'; }
      if ((d === 'left' || d === 'right') && S.top < PAGES.length && S.top !== S.page) { goPage(S.top, true); return; }
    }
    if (before !== cur() + S.zone + S.top + S.page + S.tw) snd('move');
    paint();
  }
  function ok() {
    var L = S.layer;
    if (L === 'cc') { snd('select'); return ccDo(CC[S.cc]); }
    if (L === 'settings') { var s = SET[S.set]; if (!s || s.info) return; snd('select'); return s.action ? settingsAction(s.action) : cycleRow('right'); }
    if (L === 'menu') { snd('select'); return menuDo(S.menuOpts[S.menu][0]); }
    if (L === 'folder') return activate(BY[PF().folders[S.fold].apps[S.fi]]);
    if (L === 'inputs') return activate(BY['input:' + INPUTS[S.inp].id]);
    if (L === 'profiles') { snd('select'); return profOk(); }
    if (L === 'search') return searchOk();
    if (L === 'night') return nightOk();
    if (L === 'phone') return closeLayer();
    if (S.moving) return endMove();
    if (S.zone === 'top') {
      if (S.top < PAGES.length) { S.zone = 'row'; S.dir = 'up'; return paint(); }
      snd('select');
      var b = BTNS[S.top - PAGES.length][0];
      if (b === 'search') return openSearch();
      if (b === 'mic') return voice();
      if (b === 'cc') { renderCC(); S.cc = S.np ? 1 : 0; return openLayer('cc'); }
      if (b === 'customize') { renderSettings(); return openLayer('settings'); }
      if (b === 'profile') return openProfiles();
    }
    if (page().today) { snd('select'); return startSaver(TODAY[S.tw][1]); }
    activate(curItem());
  }
  function back() {
    if (S.layer !== 'home') { if (S.layer === 'night') { S.night.choice = 0; return nightOk(); } if (S.layer === 'profiles' && S.profStart) return; return closeLayer(); }
    if (S.moving) return endMove();
    if (S.zone === 'top') { S.zone = 'row'; snd('back'); return paint(); }
    if (!page().today && cur() > 0) { S.dir = 'left'; setCur(0); snd('back'); return paint(); }
    if (S.page !== 0) return goPage(0, true);
  }

  /* Move mode */
  function startMove() { if (PF().order === 'habit') return island('Set App order to "As arranged" to move apps', 'info', '#ff9f0a', 3200); S.moving = true; snd('select'); paint(); }
  function endMove() { S.moving = false; save(); buildPages(); island('Home order saved', 'check', '#30d158'); paint(); }
  function moveTile(d) {
    var home = PF().home, i = cur(), j = i + d; if (j < 0 || j >= home.length) return;
    var t = home[i]; home[i] = home[j]; home[j] = t; buildPages(); setCur(j);
    ['#row .tile', '#dock .dicon', '#ring .ctile'].forEach(function (sel) {
      var els = qa(sel), a = els[i], b = els[j];
      if (a && b) { a.setAttribute('data-i', j); b.setAttribute('data-i', i); if (d > 0) b.parentNode.insertBefore(b, a); else a.parentNode.insertBefore(a, b); }
    });
    S.heroId = null; snd('move'); paint();
  }

  /* Mouse and touch, for the preview */
  function pointer() {
    stage.addEventListener('click', function (e) {
      if (wake() || S.busy) return;
      var t = e.target, L = S.layer;
      var tile = t.closest('.tile, .dicon, .ctile'), tab = t.closest('.seg-item'), cb = t.closest('.cbtn'), mod = t.closest('.mod'), row = t.closest('.srow'), opt = t.closest('.opt'), wk = t.closest('.wk'), keyEl = t.closest('.key'), sa = t.closest('.sa'), prof = t.closest('.prof'), nb = t.closest('.nb');
      if (L === 'menu') { if (opt) { S.menu = +opt.getAttribute('data-o'); return ok(); } return closeLayer(); }
      if (L === 'cc') { if (mod) { S.cc = +mod.getAttribute('data-m'); paintLayer(); return ok(); } if (!t.closest('.cc-card')) return closeLayer(); return; }
      if (L === 'settings') { if (row) { S.set = +row.getAttribute('data-s'); paintLayer(); return ok(); } if (!t.closest('.set-right')) return closeLayer(); return; }
      if (L === 'folder') { if (tile) { S.fi = +tile.getAttribute('data-i'); paintLayer(); return ok(); } if (!t.closest('.folder-card')) return closeLayer(); return; }
      if (L === 'inputs') { if (tile) { S.inp = +tile.getAttribute('data-i'); paintLayer(); return ok(); } return closeLayer(); }
      if (L === 'profiles') { if (prof) { S.prof = +prof.getAttribute('data-i'); paintLayer(); return ok(); } return S.profStart ? null : closeLayer(); }
      if (L === 'phone') return closeLayer();
      if (L === 'night') { if (nb) { S.night.choice = +nb.getAttribute('data-n'); return nightOk(); } return; }
      if (L === 'search') {
        if (keyEl) { var k = keyEl.getAttribute('data-k').split(':'); S.sz = 'k' + k[0]; S.sk[+k[0]] = +k[1]; return searchOk(); }
        if (tile) { S.sz = 'res'; S.sres = +tile.getAttribute('data-r'); return searchOk(); }
        if (sa) { S.sz = 'act'; S.sact = +sa.getAttribute('data-a'); return searchOk(); }
        if (!t.closest('.s-panel')) return closeLayer();
        return;
      }
      if (tab) { S.zone = 'top'; S.top = +tab.getAttribute('data-tab'); if (S.top !== S.page) goPage(S.top, true); else paint(); return; }
      if (cb) { S.zone = 'top'; S.top = PAGES.length + +cb.getAttribute('data-ctl'); paint(); return ok(); }
      if (wk) { S.zone = 'row'; S.tw = +wk.getAttribute('data-w'); paint(); return ok(); }
      if (tile) {
        var i = +tile.getAttribute('data-i');
        if (S.moving) return endMove();
        if (S.zone === 'row' && i === cur()) return ok();
        S.dir = i > cur() ? 'right' : 'left'; S.zone = 'row'; setCur(i); snd('move'); paint();
      }
    });
    stage.addEventListener('contextmenu', function (e) {
      var tile = e.target.closest && e.target.closest('.tile, .dicon, .ctile, .prof'); if (!tile) return;
      e.preventDefault();
      if (S.layer === 'home') { S.zone = 'row'; setCur(+tile.getAttribute('data-i')); paint(); }
      if (S.layer === 'folder') S.fi = +tile.getAttribute('data-i');
      if (S.layer === 'inputs') S.inp = +tile.getAttribute('data-i');
      if (S.layer === 'profiles') S.prof = +tile.getAttribute('data-i');
      hold();
    });
    document.addEventListener('mousemove', function () { S.idle = Date.now(); });
  }

  /* ---------- Phone remote commands (relayed by the Android app) ---------- */
  function exportState() {
    var pf = PF();
    return {
      ok: true, version: deviceInfo().version, foreground: S.layer,
      profiles: P.profiles.map(function (p) { return { id: p.id, name: p.name, color: p.color }; }), active: P.active,
      profile: { name: pf.name, look: pf.look, appearance: pf.appearance, wall: pf.wall, tiles: pf.tiles, order: pf.order,
        home: pf.home.map(function (id) { return { id: id, name: BY[id] ? BY[id].name : id, kind: BY[id] && BY[id].kind || 'app' }; }),
        folders: Object.keys(pf.folders).map(function (f) { return { id: f, name: pf.folders[f].name, apps: pf.folders[f].apps.map(function (id) { return BY[id] ? BY[id].name : id; }) }; }),
        pages: pf.pages.map(function (pg) { return { id: pg.id, name: pg.name, items: pg.items }; }) },
      apps: APPS.map(function (a) { return { id: a.id, name: a.name }; }),
      inputs: INPUTS.map(function (i) { return { id: i.id, label: i.label, name: (P.inputs[i.id] && P.inputs[i.id].name) || '' }; }),
      prefs: { clock: P.clock, motion: P.motion, sounds: P.sounds, ambient: P.ambient, start: P.start, askWho: P.askWho, saver: P.saver, night: P.night,
        info: { place: P.info.place, lat: P.info.lat, lon: P.info.lon, ics: !!P.info.ics, news: P.info.news }, updateUrl: P.updateUrl },
      notes: P.notes, feeds: Object.keys(INFO.feeds).map(function (k) { return { id: k, name: INFO.feeds[k].name }; }),
      options: { look: O.look, appearance: O.appearance, wall: O.wall, tiles: O.tiles, order: O.order, motion: O.motion, sounds: O.onoff, clock: O.clock, start: O.start, ambient: O.ambient, each: O.each, off: O.off, scenes: SCENES },
      search: S.layer === 'search' ? S.sq : null
    };
  }
  function remote(cmd) {
    var c = typeof cmd === 'string' ? JSON.parse(cmd) : cmd, pf = PF(), msg = null;
    S.idle = Date.now();
    switch (c.type) {
      case 'state': return exportState();
      case 'key':
        if (wake()) return { ok: true };
        if (c.key === 'okhold') hold(); else if (c.key === 'ok') ok(); else if (c.key === 'back') back(); else if (c.key === 'home') window.Prism.onHome(); else move(c.key);
        return { ok: true };
      case 'text':
        if (S.layer !== 'search') openSearch('');
        S.sq = c.text; renderSearch();
        if (c.enter) { var r = searchResults(); if (r.length) { closeAll(); activate(BY[r[0]]); } else if (searchActions()[0]) searchIn(searchActions()[0], S.sq.trim()); }
        return { ok: true };
      case 'pref':
        if (!/^[pg]:[\w.]+$/.test(c.path)) return { ok: false };
        setPath(c.path, c.value); save(); afterPref(c.path); msg = 'Settings updated from your phone'; break;
      case 'home':
        if (c.op === 'set') pf.home = c.items.filter(function (id) { return !!BY[id]; });
        if (c.op === 'add' && BY[c.id] && pf.home.indexOf(c.id) < 0) pf.home.push(c.id);
        if (c.op === 'remove') pf.home = pf.home.filter(function (x) { return x !== c.id; });
        if (c.op === 'move') { var i = pf.home.indexOf(c.id), j = i + c.dir; if (i >= 0 && j >= 0 && j < pf.home.length) { pf.home[i] = pf.home[j]; pf.home[j] = c.id; } }
        if (pf.order === 'habit' && c.op === 'move') pf.order = 'manual';
        msg = 'Home updated from your phone'; break;
      case 'page':
        if (c.op === 'add') pf.pages.push({ id: 'c' + Date.now().toString(36), name: String(c.name || 'My page').slice(0, 20), items: (c.items || []).filter(function (id) { return !!BY[id]; }) });
        if (c.op === 'update') pf.pages.forEach(function (pg) { if (pg.id === c.id) { if (c.name) pg.name = String(c.name).slice(0, 20); if (c.items) pg.items = c.items.filter(function (id) { return !!BY[id]; }); } });
        if (c.op === 'delete') pf.pages = pf.pages.filter(function (pg) { return pg.id !== c.id; });
        msg = 'Pages updated from your phone'; break;
      case 'folder':
        if (pf.folders[c.id]) pf.folders[c.id].name = String(c.name || '').slice(0, 24) || pf.folders[c.id].name;
        msg = 'Folder renamed'; break;
      case 'input':
        P.inputs[c.id] = { name: String(c.name || '').slice(0, 24) }; msg = 'Input renamed'; break;
      case 'profile':
        if (c.op === 'add' && P.profiles.length < 6) { var n = P.profiles.length + 1; P.profiles.push(profileDefaults('p' + Date.now().toString(36), String(c.name || 'Profile ' + n).slice(0, 20), COLORS[(n - 1) % COLORS.length])); }
        if (c.op === 'rename') P.profiles.forEach(function (p) { if (p.id === c.id) p.name = String(c.name || p.name).slice(0, 20); });
        if (c.op === 'delete') { save(); deleteProfile(c.id); return exportState(); }
        if (c.op === 'switch') { save(); switchProfile(c.id); return exportState(); }
        msg = 'Profiles updated'; break;
      case 'note':
        if (c.op === 'add' && c.text) { P.notes.unshift({ id: Date.now().toString(36), text: String(c.text).slice(0, 280), from: String(c.from || '').slice(0, 30), t: Date.now() }); P.notes = P.notes.slice(0, 30); msg = 'New note from ' + (c.from || 'your phone'); }
        if (c.op === 'delete') P.notes = P.notes.filter(function (n) { return n.id !== c.id; });
        break;
      case 'info':
        if (c.place) { P.info.place = String(c.place).slice(0, 40); P.info.lat = +c.lat; P.info.lon = +c.lon; INFO.clear('weather'); INFO.clear('aqi'); }
        if (c.ics !== undefined) { P.info.ics = String(c.ics || '').trim(); INFO.clear('cal'); }
        if (c.news) P.info.news = c.news;
        save(); INFO.refresh(true); msg = 'Information sources updated'; break;
      case 'update': P.updateUrl = String(c.url || '').trim(); msg = 'Update link saved'; break;
      case 'photos': msg = c.added ? c.added + ' photo' + (c.added > 1 ? 's' : '') + ' added' : null; break;
      case 'saver': startSaver(c.scene || null); return { ok: true };
      case 'night': startNight(false, true); return { ok: true };
      default: return { ok: false, error: 'unknown' };
    }
    save(); loadApps(); renderTop(); applyLook(); if (S.layer === 'home') renderPage(); paint();
    if (page().today) renderToday();
    if (msg) island(msg, 'phone', '#0a84ff', 2600);
    return exportState();
  }

  /* ---------- Native callbacks ---------- */
  /* Quietly checks the update link once a day; only speaks up when a newer Prism is ready. */
  function autoUpdate() {
    if (!NATIVE || !P.updateUrl) return;
    var last = 0; try { last = +localStorage.getItem('prism.updateCheck') || 0; } catch (e) { }
    if (Date.now() - last < 20 * 3600000) return;
    try { localStorage.setItem('prism.updateCheck', String(Date.now())); } catch (e) { }
    S.quietUpdate = true; setTimeout(function () { nat('checkUpdate', P.updateUrl); }, 8000);
  }
  window.Prism = {
    onResume: function () { S.paused = false; okDown = false; clearTimeout(okTimer); if (S.busy) returnFromApp(); tick(); pollNow(); },
    onPause: function () { S.paused = true; },
    onHome: function () {
      if (S.layer === 'saver') stopSaver();
      closeAll(); S.moving = false; stage.classList.remove('jiggle');
      var target = startPage(); if (S.page !== target) goPage(target); S.zone = 'row'; S.dir = 'left'; setCur(0); S.idle = Date.now(); paint();
    },
    onBack: function () { if (!wake()) back(); },
    onMenu: function () { if (!wake()) hold(); },
    onAppsChanged: function () { loadApps(); save(); renderTop(); renderPage(); paint(); },
    onVoice: function (t) { onVoice(t); },
    onSleep: function (fromApp) { S.nightFromApp = !!fromApp; startNight(false); },
    onUpdate: function (j) {
      var u = typeof j === 'string' ? JSON.parse(j) : j, quiet = S.quietUpdate; S.update = u; S.quietUpdate = false;
      if (quiet && (!u || u.error || !u.newer)) return;
      if (!u || u.error) island(u && u.error ? u.error : 'Could not check for updates', 'update', '#ff9f0a', 3600);
      else if (u.newer) island('Prism ' + u.versionName + ' is ready. Install it from Customize.', 'update', '#30d158', 4200);
      else island('Prism is up to date', 'check', '#30d158');
      if (S.layer === 'settings') { renderSettings(); paintLayer(); }
    },
    remote: function (cmd) { try { return JSON.stringify(remote(cmd)); } catch (e) { return JSON.stringify({ ok: false, error: String(e) }); } }
  };

  /* ---------- Layout ---------- */
  function fit() {
    var s = scale();
    stage.style.transform = 'translate3d(' + ((innerWidth - W * s) / 2) + 'px,' + ((innerHeight - H * s) / 2) + 'px,0) scale(' + s + ')';
    document.body.classList.toggle('has-room', !NATIVE && innerHeight - H * s > 110);
    regStatic();
  }
  function regStatic() { reg($('seg'), 120, 66); qa('.cbtn').forEach(function (b) { reg(b); }); }
  function startPage() { var h = new Date().getHours(); return P.start === 'today' || (P.start === 'auto' && h >= 5 && h < 11) ? pageIndex('today') : 0; }

  /* ---------- Boot ---------- */
  function boot() {
    if (NATIVE) document.body.classList.add('on-tv');
    fit(); window.addEventListener('resize', fit);
    if (FIRST_RUN && deviceInfo().lowRam) P.motion = 'lite';
    loadApps(); save();
    renderTop(); applyLook();
    S.page = startPage();
    renderPage(); clock(); paint();
    document.addEventListener('keydown', key); document.addEventListener('keyup', key);
    pointer();
    INFO.refresh(false);
    setInterval(function () { INFO.refresh(false); }, 10 * 60000);
    setInterval(tick, 15000);
    setInterval(pollNow, 3000);
    if (!NATIVE) S.demoNp = { app: 'Apple Music', title: 'Sample track', artist: 'Now playing preview', playing: true };
    if (DREAM) {
      stage.classList.remove('booting'); $('boot').style.display = 'none';
      stage.classList.add('dream'); startSaver(); nat('ready'); return;
    }
    var wait = lite() ? 450 : 1650;
    if (lite()) $('boot').classList.add('gone');
    setTimeout(function () {
      $('boot').classList.add('gone');
      stage.classList.add('entering'); stage.classList.remove('booting');
      regStatic(); paint();
      setTimeout(function () { stage.classList.remove('entering'); $('boot').style.display = 'none'; }, 1700);
      if (P.askWho === 'on' && P.profiles.length > 1) openProfiles(true);
      setTimeout(pollNow, 1200);
      nat('setNight', P.night.off);
      autoUpdate(); setInterval(autoUpdate, 6 * 3600000);
      nat('ready');
    }, wait);
  }
  window.PrismQA = { state: function () { return S; }, prefs: function () { return P; }, pages: function () { return PAGES; }, saver: startSaver, island: island, remote: remote, voice: onVoice, night: startNight, phone: openPhone };
  boot();
})();
