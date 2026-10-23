/* Prism phone remote. Talks to the small server inside the Prism TV app on your home Wi-Fi. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search), TOKEN = params.get('t') || '';
  try { if (TOKEN) localStorage.setItem('prism.token', TOKEN); else TOKEN = localStorage.getItem('prism.token') || ''; } catch (e) {}
  if (params.get('t')) history.replaceState(null, '', location.pathname);
  var ST = null, DEMO = false, BOOT = true;
  var ICON = {
    up: '<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>', down: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>', edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16Z"/></svg>',
    go: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function buzz() { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} }
  var toastT; function toast(t) { var e = $('toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove('show'); }, 2200); }

  /* ---------- Talking to the TV ---------- */
  function api(path, body, raw) {
    if (DEMO) return Promise.resolve(demoReply(path, body));
    var opt = { method: body === undefined ? 'GET' : 'POST', headers: { 'X-Prism-Token': TOKEN } };
    if (body !== undefined) { if (raw) { opt.body = body; } else { opt.body = JSON.stringify(body); opt.headers['Content-Type'] = 'application/json'; } }
    return fetch(path, opt).then(function (r) {
      if (r.status === 401) { banner('This phone is not paired. Scan the code on the TV again (Control Centre, Phone remote).'); throw new Error('auth'); }
      return r.json();
    }).then(function (j) { $('dot').classList.add('ok'); if (j && j.state) setState(j.state); else if (j && j.profiles) setState(j); if (j && j.message) toast(j.message); return j; })
      .catch(function (e) { if (e.message !== 'auth') { $('dot').classList.remove('ok'); if (!BOOT) toast('Can’t reach the TV. Check it is on and on the same Wi-Fi.'); } throw e; });
  }
  function cmd(c) { return api('/api/cmd', c).catch(function () {}); }
  function key(k) { buzz(); api('/api/key', { key: k }).catch(function () {}); }
  function banner(t) { var b = $('banner'); b.textContent = t; b.hidden = !t; }

  /* ---------- Tabs ---------- */
  var TITLES = { remote: 'Remote', type: 'Type', photos: 'Photos', notes: 'Notes', home: 'Home screen', settings: 'Settings' };
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('.tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
    document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('on', x.id === 't-' + b.dataset.t); });
    $('title').textContent = TITLES[b.dataset.t];
    if (b.dataset.t === 'photos') loadPhotos();
    if (b.dataset.t !== 'remote') refresh();
    window.scrollTo(0, 0);
  });

  /* ---------- Remote ---------- */
  document.querySelectorAll('[data-k]').forEach(function (b) { b.addEventListener('click', function () { key(b.dataset.k); }); });
  $('remoteMode').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#remoteMode button').forEach(function (x) { x.classList.toggle('on', x === b); });
    $('padView').hidden = b.dataset.m !== 'pad'; $('touchView').hidden = b.dataset.m === 'pad';
  });
  (function touchpad() {
    var el = $('touch'), sx = 0, sy = 0, moved = false, holdT = null, held = false;
    el.addEventListener('pointerdown', function (e) {
      sx = e.clientX; sy = e.clientY; moved = false; held = false; el.classList.add('hit'); el.setPointerCapture(e.pointerId);
      holdT = setTimeout(function () { held = true; key('okhold'); }, 600);
    });
    el.addEventListener('pointermove', function (e) {
      var dx = e.clientX - sx, dy = e.clientY - sy, step = 46;
      if (Math.abs(dx) > step || Math.abs(dy) > step) {
        clearTimeout(holdT); moved = true;
        key(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        sx = e.clientX; sy = e.clientY;
      }
    });
    function end() { clearTimeout(holdT); el.classList.remove('hit'); if (!moved && !held) key('ok'); }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', function () { clearTimeout(holdT); el.classList.remove('hit'); });
  })();

  /* ---------- Type ---------- */
  var typeT;
  $('typeBox').addEventListener('input', function () { clearTimeout(typeT); typeT = setTimeout(function () { api('/api/text', { text: $('typeBox').value, target: 'prism' }).catch(function () {}); }, 220); });
  $('typeSearch').addEventListener('click', function () { api('/api/text', { text: $('typeBox').value, target: 'prism', enter: true }).catch(function () {}); buzz(); });
  $('typeApp').addEventListener('click', function () { api('/api/text', { text: $('typeBox').value, target: 'app' }).then(function () { $('typeBox').value = ''; }).catch(function () {}); buzz(); });

  /* ---------- Photos ---------- */
  function loadPhotos() {
    api('/api/photos').then(function (j) {
      var list = j.photos || [];
      $('photoGrid').innerHTML = list.map(function (p) { return '<div style="background-image:url(\'' + esc(p.thumb || p.url) + '\')"><button data-n="' + esc(p.name) + '" aria-label="Delete">' + ICON.x + '</button></div>'; }).join('');
      $('photoStatus').textContent = list.length ? list.length + ' photo' + (list.length > 1 ? 's' : '') + ' on the TV.' : 'No photos yet. They show in the screensaver.';
    }).catch(function () {});
  }
  $('photoGrid').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; api('/api/photo-delete', { name: b.dataset.n }).then(loadPhotos).catch(function () {}); });
  $('photoPick').addEventListener('change', function () {
    var files = Array.prototype.slice.call(this.files || []), done = 0;
    if (!files.length) return;
    $('photoStatus').textContent = 'Sending 1 of ' + files.length;
    (function next() {
      if (!files.length) { $('photoPick').value = ''; cmd({ type: 'photos', added: done }); loadPhotos(); return; }
      var f = files.shift();
      shrink(f, 1920, 0.86).then(function (blob) {
        return fetch('/api/photo?name=' + encodeURIComponent(Date.now() + '.jpg'), { method: 'POST', headers: { 'X-Prism-Token': TOKEN, 'Content-Type': 'image/jpeg' }, body: blob });
      }).then(function (r) { if (!r.ok) throw new Error(); done++; $('photoStatus').textContent = 'Sent ' + done + ', ' + files.length + ' to go'; next(); })
        .catch(function () { toast('A photo could not be sent'); next(); });
    })();
  });
  function shrink(file, max, q) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(); }, 'image/jpeg', q);
      };
      img.onerror = rej; img.src = url;
    });
  }

  /* ---------- Notes ---------- */
  try { $('noteFrom').value = localStorage.getItem('prism.from') || ''; } catch (e) {}
  $('notePost').addEventListener('click', function () {
    var t = $('noteText').value.trim(); if (!t) return toast('Write a note first');
    try { localStorage.setItem('prism.from', $('noteFrom').value.trim()); } catch (e) {}
    cmd({ type: 'note', op: 'add', text: t, from: $('noteFrom').value.trim() }).then(function () { $('noteText').value = ''; toast('Posted to the TV'); });
  });
  $('noteList').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) cmd({ type: 'note', op: 'delete', id: b.dataset.id }); });

  /* ---------- Render state ---------- */
  function opts(list, v) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function choice(label, path, list, v) { return '<div class="cell"><span>' + esc(label) + '</span><select data-path="' + path + '">' + opts(list, v) + '</select></div>'; }
  function toggle(label, path, on) { return '<div class="cell"><span>' + esc(label) + '</span><button class="switch' + (on ? ' on' : '') + '" data-path="' + path + '" data-on="' + (on ? 1 : 0) + '" aria-label="' + esc(label) + '"></button></div>'; }
  function setState(s) {
    ST = s;
    var pf = s.profile, o = s.options, active = s.profiles.filter(function (p) { return p.id === s.active; })[0];
    $('tv').textContent = DEMO ? 'Demo mode' : 'Connected to Prism' + (active ? ', ' + active.name : '');
    // Notes
    $('noteList').innerHTML = (s.notes || []).length ? s.notes.map(function (n) { return '<div class="cell note"><span><p>' + esc(n.text) + '</p><small>' + esc(n.from || 'Family') + '</small></span><div class="tools"><button class="del" data-id="' + esc(n.id) + '" aria-label="Delete">' + ICON.x + '</button></div></div>'; }).join('') : '<div class="cell"><span class="sub">No notes yet</span></div>';
    // Home
    $('profileSel').innerHTML = s.profiles.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === s.active ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('');
    $('homeList').innerHTML = pf.home.map(function (it, i) {
      return '<div class="cell"><span>' + esc(it.name) + (it.kind === 'folder' ? ' (folder)' : it.kind === 'input' ? ' (input)' : '') + '</span><div class="tools">'
        + '<button data-op="move" data-dir="-1" data-id="' + esc(it.id) + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">' + ICON.up + '</button>'
        + '<button data-op="move" data-dir="1" data-id="' + esc(it.id) + '"' + (i === pf.home.length - 1 ? ' disabled' : '') + ' aria-label="Move down">' + ICON.down + '</button>'
        + '<button class="del" data-op="remove" data-id="' + esc(it.id) + '" aria-label="Remove">' + ICON.x + '</button></div></div>';
    }).join('');
    var onHome = pf.home.map(function (x) { return x.id; });
    $('homeAdd').innerHTML = '<option value="">Choose</option>' + s.apps.filter(function (a) { return onHome.indexOf(a.id) < 0; }).map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>'; }).join('')
      + s.inputs.filter(function (i) { return onHome.indexOf('input:' + i.id) < 0; }).map(function (i) { return '<option value="input:' + esc(i.id) + '">' + esc(i.name || i.label) + ' (input)</option>'; }).join('');
    $('lookList').innerHTML = choice('Layout', 'p:look', o.look, pf.look) + choice('Appearance', 'p:appearance', o.appearance, pf.appearance) + choice('Wallpaper', 'p:wall', o.wall, pf.wall)
      + choice('App tiles', 'p:tiles', o.tiles, pf.tiles) + choice('App order', 'p:order', o.order, pf.order);
    $('folderList').innerHTML = pf.folders.length ? pf.folders.map(function (f) { return '<div class="cell"><span>' + esc(f.name) + ' <span class="sub">' + esc(f.apps.join(', ')) + '</span></span><div class="tools"><button data-folder="' + esc(f.id) + '" aria-label="Rename">' + ICON.edit + '</button></div></div>'; }).join('')
      : '<div class="cell"><span class="sub">No folders. On the TV, hold OK on an app and choose Add to a folder.</span></div>';
    $('pageList').innerHTML = pf.pages.length ? pf.pages.map(function (p) { return '<div class="cell"><span>' + esc(p.name) + ' <span class="sub">' + p.items.length + ' apps</span></span><div class="tools"><button data-page="' + esc(p.id) + '" aria-label="Rename">' + ICON.edit + '</button><button class="del" data-pdel="' + esc(p.id) + '" aria-label="Delete">' + ICON.x + '</button></div></div>'; }).join('')
      : '<div class="cell"><span class="sub">Home, Today, Watch, Listen and All apps are built in. Add your own below.</span></div>';
    $('pageApps').innerHTML = s.apps.map(function (a) { return '<label><input type="checkbox" value="' + esc(a.id) + '">' + esc(a.name) + '</label>'; }).join('');
    // Settings
    $('profList').innerHTML = s.profiles.map(function (p) { return '<div class="cell"><span>' + esc(p.name) + (p.id === s.active ? ' <span class="sub">on the TV now</span>' : '') + '</span><div class="tools"><button data-prof="' + esc(p.id) + '" aria-label="Rename">' + ICON.edit + '</button>' + (p.id !== s.active ? '<button data-pswitch="' + esc(p.id) + '" aria-label="Switch">' + ICON.go + '</button>' : '') + (s.profiles.length > 1 ? '<button class="del" data-pdelete="' + esc(p.id) + '" aria-label="Delete">' + ICON.x + '</button>' : '') + '</div></div>'; }).join('');
    var pr = s.prefs;
    $('saverList').innerHTML = o.scenes.map(function (sc) { return toggle(sc[1], 'g:saver.scenes.' + sc[0], pr.saver.scenes[sc[0]]); }).join('')
      + choice('Each scene shows for', 'g:saver.each', o.each, pr.saver.each) + choice('Start after', 'g:ambient', o.ambient, pr.ambient)
      + '<div class="cell"><span>Start it now</span><div class="tools"><button data-saver="1" aria-label="Start">' + ICON.go + '</button></div></div>';
    $('nightList').innerHTML = choice('Switch the TV off at', 'g:night.off', o.off, pr.night.off) + '<div class="cell"><span>Preview the countdown</span><div class="tools"><button data-night="1" aria-label="Preview">' + ICON.go + '</button></div></div>';
    $('genList').innerHTML = choice('Clock', 'g:clock', o.clock, pr.clock) + choice('Start on', 'g:start', o.start, pr.start) + choice('Motion', 'g:motion', o.motion, pr.motion)
      + choice('Interface sounds', 'g:sounds', o.sounds, pr.sounds) + choice('Ask who is watching', 'g:askWho', o.sounds, pr.askWho);
    $('placeNow').textContent = 'Now: ' + pr.info.place;
    $('icsState').textContent = pr.info.ics ? 'A calendar is linked.' : 'No calendar linked.';
    $('newsList').innerHTML = s.feeds.map(function (f) { return '<div class="cell"><span>' + esc(f.name) + '</span><button class="switch' + (pr.info.news[f.id] ? ' on' : '') + '" data-news="' + f.id + '" aria-label="' + esc(f.name) + '"></button></div>'; }).join('');
    $('inputList').innerHTML = s.inputs.length ? s.inputs.map(function (i) { return '<div class="cell"><span>' + esc(i.name || i.label) + ' <span class="sub">' + esc(i.label) + '</span></span><div class="tools"><button data-input="' + esc(i.id) + '" aria-label="Rename">' + ICON.edit + '</button></div></div>'; }).join('') : '<div class="cell"><span class="sub">No inputs found on this TV.</span></div>';
    if (document.activeElement !== $('updUrl')) $('updUrl').value = pr.updateUrl || '';
    $('updState').textContent = 'Prism ' + (s.version || '') + ' is installed.';
  }

  /* ---------- Edits ---------- */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.path) { var v = t.value; if (v === 'true') v = true; if (v === 'false') v = false; cmd({ type: 'pref', path: t.dataset.path, value: v }); }
    if (t.id === 'profileSel') cmd({ type: 'profile', op: 'switch', id: t.value });
    if (t.id === 'homeAdd' && t.value) cmd({ type: 'home', op: 'add', id: t.value });
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (b.classList.contains('switch') && d.path) { var on = d.on !== '1'; b.classList.toggle('on', on); d.on = on ? '1' : '0'; cmd({ type: 'pref', path: d.path, value: on }); }
    if (d.news) { var n = Object.assign({}, ST.prefs.info.news); n[d.news] = !n[d.news]; b.classList.toggle('on', n[d.news]); cmd({ type: 'info', news: n }); }
    if (d.op) cmd({ type: 'home', op: d.op, id: d.id, dir: +d.dir || 0 });
    if (d.folder) { var fn = prompt('Folder name'); if (fn) cmd({ type: 'folder', id: d.folder, name: fn }); }
    if (d.page) { var pn = prompt('Page name'); if (pn) cmd({ type: 'page', op: 'update', id: d.page, name: pn }); }
    if (d.pdel) cmd({ type: 'page', op: 'delete', id: d.pdel });
    if (d.prof) { var nn = prompt('Profile name'); if (nn) cmd({ type: 'profile', op: 'rename', id: d.prof, name: nn }); }
    if (d.pswitch) cmd({ type: 'profile', op: 'switch', id: d.pswitch });
    if (d.pdelete && confirm('Delete this profile? Its Home and habits are removed.')) cmd({ type: 'profile', op: 'delete', id: d.pdelete });
    if (d.input) { var inn = prompt('Name for this input, for example Set-top box'); if (inn !== null) cmd({ type: 'input', id: d.input, name: inn }); }
    if (d.saver) cmd({ type: 'saver' });
    if (d.night) cmd({ type: 'night' });
  });
  $('pageAdd').addEventListener('click', function () {
    var items = Array.prototype.slice.call(document.querySelectorAll('#pageApps input:checked')).map(function (i) { return i.value; });
    var name = $('pageName').value.trim();
    if (!name || !items.length) return toast('Give the page a name and pick at least one app');
    cmd({ type: 'page', op: 'add', name: name, items: items }).then(function () { $('pageName').value = ''; document.querySelector('details.new').open = false; toast('Page added'); });
  });
  $('profAdd').addEventListener('click', function () { var n = $('profName').value.trim(); if (!n) return; cmd({ type: 'profile', op: 'add', name: n }).then(function () { $('profName').value = ''; }); });
  var placeT;
  $('placeQ').addEventListener('input', function () {
    clearTimeout(placeT); var qv = this.value.trim(); if (qv.length < 2) { $('placeRes').innerHTML = ''; return; }
    placeT = setTimeout(function () {
      fetch('https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&name=' + encodeURIComponent(qv)).then(function (r) { return r.json(); }).then(function (j) {
        $('placeRes').innerHTML = (j.results || []).map(function (p) { return '<button data-lat="' + p.latitude + '" data-lon="' + p.longitude + '" data-name="' + esc(p.name) + '">' + esc(p.name + (p.admin1 ? ', ' + p.admin1 : '') + (p.country ? ', ' + p.country : '')) + '</button>'; }).join('') || '<p class="sub">No places found</p>';
      }).catch(function () { $('placeRes').innerHTML = '<p class="sub">Search needs internet on your phone.</p>'; });
    }, 300);
  });
  $('placeRes').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; cmd({ type: 'info', place: b.dataset.name, lat: b.dataset.lat, lon: b.dataset.lon }); $('placeRes').innerHTML = ''; $('placeQ').value = ''; });
  $('icsSave').addEventListener('click', function () { var u = $('icsUrl').value.trim(); if (!/^(https|webcal):\/\//i.test(u)) return toast('Paste the secret address that starts with https://'); cmd({ type: 'info', ics: u }).then(function () { $('icsUrl').value = ''; toast('Calendar linked'); }); });
  $('icsClear').addEventListener('click', function () { cmd({ type: 'info', ics: '' }); });
  $('updSave').addEventListener('click', function () { cmd({ type: 'update', url: $('updUrl').value.trim() }); });
  $('apkPick').addEventListener('change', function () {
    var f = this.files && this.files[0]; if (!f) return;
    $('updState').textContent = 'Sending the update to the TV';
    fetch('/api/apk', { method: 'POST', headers: { 'X-Prism-Token': TOKEN, 'Content-Type': 'application/vnd.android.package-archive' }, body: f })
      .then(function (r) { return r.json(); }).then(function (j) { $('updState').textContent = j.ok ? 'Sent. Confirm the install on the TV.' : 'The TV could not install it: ' + (j.error || 'unknown problem'); })
      .catch(function () { $('updState').textContent = 'Could not send the file.'; });
    this.value = '';
  });

  /* ---------- Start ---------- */
  function refresh() { return api('/api/state').catch(function () {}); }
  api('/api/state').then(function () { BOOT = false; }, function () {
    BOOT = false;
    if (location.protocol === 'https:' || /claude|localhost|127\.0\.0\.1/.test(location.hostname) || !TOKEN) {
      DEMO = true; banner('Demo mode. On your phone, scan the code on the TV to control it.'); setState(demoState());
    }
  });
  setInterval(function () { if (!document.hidden && !DEMO) refresh(); }, 15000);

  /* ---------- Demo data, used only when this page is opened away from the TV ---------- */
  function demoState() {
    var apps = [['netflix', 'Netflix'], ['youtube', 'YouTube'], ['primevideo', 'Prime Video'], ['disneyplus', 'Disney+'], ['applemusic', 'Apple Music'], ['spotify', 'Spotify']];
    return { ok: true, version: 'demo', profiles: [{ id: 'p1', name: 'Me', color: '#0a84ff' }], active: 'p1',
      profile: { name: 'Me', look: 'shelf', appearance: 'auto', wall: 'auto', tiles: 'banner', order: 'manual', home: apps.slice(0, 5).map(function (a) { return { id: a[0], name: a[1], kind: 'app' }; }), folders: [], pages: [] },
      apps: apps.map(function (a) { return { id: a[0], name: a[1] }; }), inputs: [{ id: 'hdmi1', label: 'HDMI 1', name: 'Set-top box' }, { id: 'hdmi2', label: 'HDMI 2', name: '' }],
      prefs: { clock: '12', motion: 'full', sounds: 'on', ambient: '5', start: 'auto', askWho: 'off', saver: { scenes: { clock: true, photos: true, weather: true, art: true, calendar: true, notes: true, news: false }, each: '2' }, night: { off: '21:00' }, info: { place: 'Hyderabad', ics: false, news: { hyd: true, india: true, bbc: true } }, updateUrl: '' },
      notes: [{ id: 'n1', text: 'Sample note: dinner at 8', from: 'Family', t: Date.now() }],
      feeds: [{ id: 'hyd', name: 'The Hindu, Hyderabad' }, { id: 'india', name: 'The Hindu, India' }, { id: 'toi', name: 'Times of India' }, { id: 'et', name: 'Economic Times' }, { id: 'bbc', name: 'BBC World' }],
      options: { look: [['shelf', 'Shelf'], ['glass', 'Glass'], ['carousel', 'Carousel']], appearance: [['auto', 'Automatic'], ['light', 'Light'], ['dark', 'Dark']], wall: [['auto', 'Changes daily']], tiles: [['banner', 'Full colour'], ['icon', 'Icons on glass']], order: [['manual', 'As arranged'], ['habit', 'By habit']], motion: [['full', 'Full'], ['lite', 'Lite']], sounds: [['on', 'On'], ['off', 'Off']], clock: [['12', '12-hour'], ['24', '24-hour']], start: [['auto', 'Today in the morning'], ['home', 'Always Home'], ['today', 'Always Today']], ambient: [['2', '2 minutes'], ['5', '5 minutes'], ['0', 'Never']], each: [['1', '1 minute'], ['2', '2 minutes']], off: [['off', 'Never'], ['21:00', '9:00 pm'], ['22:00', '10:00 pm']], scenes: [['clock', 'Clock'], ['photos', 'Family photos'], ['weather', 'Weather'], ['art', 'Art gallery'], ['calendar', 'Calendar'], ['notes', 'Family notes'], ['news', 'Headlines']] } };
  }
  function demoReply(path) { toast('Demo mode: nothing is sent'); if (path === '/api/photos') return { photos: [] }; return { ok: true }; }
})();
