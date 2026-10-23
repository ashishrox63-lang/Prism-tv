/* Prism screensaver engine. Used by Prism's own idle screensaver, by the Android system
   screensaver (index.html?saver=1) and by the Today page's full-screen views.
   Scenes: clock, photos, weather, art, calendar, notes, news. */
(function () {
  'use strict';

  function PrismSaver(env) {
    /* env: root, info, prefs(), walls, ico(name), esc(s), fmtTime(d), photos() -> [{url, caption}], lite(), wallNow() */
    var root = env.root, esc = env.esc, ico = env.ico, scenes = {}, current = null, timer = null, drift = null, order = [], idx = 0, running = false, single = false;

    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    function dateLong(d) { return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
    function dayLabel(t) {
      var d = new Date(t), today = new Date(); today.setHours(0, 0, 0, 0);
      var diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - today) / 86400000);
      return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : DAYS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3);
    }
    function el(cls, html) { var e = document.createElement('div'); e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
    function ago(t) { var m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; }

    /* ---------- Clock ---------- */
    scenes.clock = function (box) {
      var w = env.wallNow();
      box.innerHTML = '<div class="sv-bgimg sv-slow" style="background-image:url(media/glass/' + w + '.jpg)"></div><div class="sv-shade"></div>'
        + '<div class="sv-clock drift"><div class="t" data-r="t"></div><div class="d" data-r="d"></div><div class="x" data-r="x"></div></div>';
      function up() {
        var d = new Date(), wx = env.info.read('weather').data, ev = env.info.events(2)[0];
        q(box, 't').textContent = env.fmtTime(d, true);
        q(box, 'd').textContent = dateLong(d);
        var bits = [];
        if (wx) bits.push('<span>' + ico(env.info.wx(wx.code)[1]) + wx.temp + '° ' + esc(env.info.wx(wx.code)[0]) + '</span>');
        if (ev) bits.push('<span>' + ico('cal') + esc(ev.title) + ', ' + (ev.allDay ? dayLabel(ev.start).toLowerCase() : env.fmtTime(new Date(ev.start))) + '</span>');
        q(box, 'x').innerHTML = bits.join('');
      }
      up(); var t = setInterval(up, 10000);
      return function () { clearInterval(t); };
    };

    /* ---------- Photos: family photos from the phone, otherwise the bundled landscapes ---------- */
    var CAMS = ['cam-in', 'cam-pan-l', 'cam-out', 'cam-pan-r', 'cam-crane'];
    scenes.photos = function (box) {
      var list = env.photos();
      if (!list.length) list = env.walls.map(function (w) { return { url: 'media/walls/' + w.id + '.jpg', title: w.name, sub: 'Photo by ' + w.credit }; });
      var n = Math.floor(Math.random() * list.length), flip = false;
      box.innerHTML = '<div class="amb-img" data-r="a"></div><div class="amb-img" data-r="b"></div><div class="amb-shade"></div>'
        + '<div class="sv-time drift"><div class="t" data-r="t"></div></div><div class="amb-cap drift" data-r="cap"><div class="n" data-r="n"></div><div class="c" data-r="c"></div></div>';
      function next() {
        var p = list[n % list.length], a = q(box, flip ? 'a' : 'b'), b = q(box, flip ? 'b' : 'a'); flip = !flip;
        var img = new Image(); img.src = p.url;
        a.style.backgroundImage = 'url("' + p.url + '")';
        a.className = 'amb-img'; void a.offsetWidth; a.className = 'amb-img on ' + (env.lite() ? '' : CAMS[n % CAMS.length]);
        b.classList.remove('on');
        var cap = q(box, 'cap'); cap.classList.remove('show');
        setTimeout(function () { q(box, 'n').textContent = p.title || ''; q(box, 'c').textContent = p.sub || ''; if (p.title) cap.classList.add('show'); }, 900);
        n++;
      }
      function clock() { q(box, 't').textContent = env.fmtTime(new Date(), true); }
      next(); clock();
      var t1 = setInterval(next, 14000), t2 = setInterval(clock, 10000);
      return function () { clearInterval(t1); clearInterval(t2); };
    };

    /* ---------- Weather: a live sky for the real conditions and time of day ---------- */
    scenes.weather = function (box) {
      var wx = env.info.read('weather'), aq = env.info.read('aqi').data;
      if (!wx.data) { box.innerHTML = '<div class="sv-empty">' + ico('cloud') + '<b>Weather will appear here</b><span>It needs an internet connection the first time.</span></div>'; return function () {}; }
      var w = wx.data, now = Date.now(), kind = env.info.wx(w.code)[1], cond = env.info.wx(w.code)[0];
      var dayLen = w.sunset - w.sunrise, p = (now - w.sunrise) / dayLen, isDay = p >= 0 && p <= 1;
      var sky = isDay ? (p < 0.12 ? 'dawn' : p > 0.85 ? 'dusk' : 'day') : 'night';
      var grey = kind === 'cloud' || kind === 'rain' || kind === 'storm' || kind === 'drizzle' || kind === 'fog';
      var arc = isDay ? p : (now > w.sunset ? (now - w.sunset) / (86400000 - dayLen) : (now - (w.sunset - 86400000)) / (86400000 - dayLen));
      arc = Math.max(0, Math.min(1, arc));
      var x = 48 + arc * 44, y = 62 - Math.sin(Math.PI * arc) * 42, m = env.info.moon(new Date());
      var clouds = Math.round((w.cloud || 0) / 14) + (grey ? 3 : 0), cl = '';
      for (var i = 0; i < clouds; i++) {
        var cw = 500 + (i * 137) % 500, top = 4 + (i * 53) % 46, dur = 90 + (i * 29) % 80, delay = -((i * 41) % dur);
        cl += '<i class="cloud" style="width:' + cw + 'px;height:' + Math.round(cw * .42) + 'px;top:' + top + '%;animation-duration:' + dur + 's;animation-delay:' + delay + 's;opacity:' + (grey ? .75 : .5) + '"></i>';
      }
      var hours = (w.hours || []).slice(1, 7).map(function (h) {
        return '<div class="hr"><span>' + env.fmtTime(new Date(h.t), false, true) + '</span>' + ico(env.info.wx(h.code)[1]) + '<b>' + h.temp + '°</b><small>' + (h.rain >= 20 ? h.rain + '%' : '') + '</small></div>';
      }).join('');
      box.innerHTML = '<div class="sky sky-' + sky + (grey ? ' sky-grey' : '') + '"></div>'
        + (isDay ? '<i class="sun" style="left:' + x + '%;top:' + y + '%"></i>' : '<i class="moon" style="left:' + x + '%;top:' + y + '%;--lit:' + m.phase + '"></i><div class="stars-s"></div>')
        + '<div class="clouds">' + cl + '</div>' + (kind === 'fog' ? '<div class="fogl"></div>' : '')
        + '<canvas class="precip" width="960" height="540"></canvas>' + (kind === 'storm' ? '<div class="flash"></div>' : '')
        + '<div class="sv-wx drift"><div class="pl">' + ico('pin') + esc(w.place) + '</div><div class="tp">' + w.temp + '°</div><div class="cd">' + esc(cond) + '</div>'
        + '<div class="mt">Feels like ' + w.feels + '°<i></i>High ' + w.max + '°, low ' + w.min + '°<i></i>Humidity ' + w.humidity + '%' + (aq ? '<i></i>Air quality ' + aq.aqi + ', ' + env.info.aqiLabel(aq.aqi).toLowerCase() : '') + '</div></div>'
        + '<div class="sv-hours drift glass-d">' + hours + '</div>'
        + '<div class="sv-sun drift">' + ico('sunrise') + env.fmtTime(new Date(w.sunrise)) + '<i></i>' + ico('sunset') + env.fmtTime(new Date(w.sunset)) + '<i></i>' + esc(m.name) + '</div>'
        + (wx.sample ? '<div class="sv-sample">Sample weather. Live weather appears on the TV.</div>' : '');
      var stop = precip(box.querySelector('.precip'), kind);
      return stop;
    };
    function precip(cv, kind) {
      if (kind !== 'rain' && kind !== 'drizzle' && kind !== 'storm' && kind !== 'snow') return function () {};
      var ctx = cv.getContext('2d'), n = env.lite() ? 50 : (kind === 'drizzle' ? 90 : 160), drops = [], snow = kind === 'snow', raf = 0, last = 0, alive = true;
      for (var i = 0; i < n; i++) drops.push({ x: Math.random() * 960, y: Math.random() * 540, v: snow ? 0.6 + Math.random() : 9 + Math.random() * 7, l: snow ? 2 + Math.random() * 2 : 10 + Math.random() * 14 });
      function frame(t) {
        if (!alive) return;
        raf = requestAnimationFrame(frame);
        if (t - last < 33) return; last = t;
        ctx.clearRect(0, 0, 960, 540);
        ctx.strokeStyle = 'rgba(220,230,255,.45)'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        drops.forEach(function (d) {
          d.y += d.v; d.x += snow ? Math.sin(d.y / 30) * .6 : -1.2;
          if (d.y > 545) { d.y = -10; d.x = Math.random() * 980; }
          if (snow) { ctx.moveTo(d.x + d.l, d.y); ctx.arc(d.x, d.y, d.l, 0, 6.283); } else { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 1.6, d.y + d.l); }
        });
        if (snow) ctx.fill(); else ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
      return function () { alive = false; cancelAnimationFrame(raf); };
    }

    /* ---------- Art gallery ---------- */
    scenes.art = function (box) {
      var list = env.info.read('art').data;
      if (!list || !list.length) return null;
      var n = Math.floor(Math.random() * list.length);
      box.innerHTML = '<div class="gal-wall"></div><div class="gal-light"></div><div class="gal-frame drift" data-r="f"><img data-r="img" alt=""></div>'
        + '<div class="gal-label drift" data-r="l"><div class="tt" data-r="tt"></div><div class="ar" data-r="ar"></div><div class="src">Art Institute of Chicago, public domain</div></div>';
      function next() {
        var a = list[n++ % list.length], img = q(box, 'img'), f = q(box, 'f'), l = q(box, 'l');
        f.classList.remove('show'); l.classList.remove('show');
        var pre = new Image();
        pre.onload = function () { setTimeout(function () { img.src = a.img; q(box, 'tt').textContent = a.title; q(box, 'ar').textContent = a.artist + (a.date ? ', ' + a.date : ''); f.classList.add('show'); l.classList.add('show'); }, 700); };
        pre.onerror = function () { setTimeout(next, 500); };
        pre.src = a.img;
      }
      next(); var t = setInterval(next, 30000);
      return function () { clearInterval(t); };
    };

    /* ---------- Calendar ---------- */
    scenes.calendar = function (box) {
      function draw() {
        var d = new Date(), evs = env.info.events(7), hasCal = !!(env.prefs().info.ics || '').trim(), sample = env.info.read('cal').sample || env.info.read('holidays').sample;
        var groups = {}, keys = [];
        evs.slice(0, 9).forEach(function (e) { var k = dayLabel(e.start); if (!groups[k]) { groups[k] = []; keys.push(k); } groups[k].push(e); });
        var list = keys.map(function (k) {
          return '<div class="ag-day">' + k + '</div>' + groups[k].map(function (e) {
            return '<div class="ag-ev' + (e.src === 'holiday' ? ' hol' : '') + '"><span class="tm">' + (e.allDay ? (e.src === 'holiday' ? 'Holiday' : 'All day') : env.fmtTime(new Date(e.start))) + '</span><span class="ti">' + esc(e.title) + '</span></div>';
          }).join('');
        }).join('') || '<div class="ag-none">Nothing on the calendar for the next week.</div>';
        box.innerHTML = '<div class="sv-bgimg" style="background-image:url(media/glass/' + env.wallNow() + '.jpg)"></div><div class="sv-shade strong"></div>'
          + '<div class="cal-left drift"><div class="wd">' + DAYS[d.getDay()] + '</div><div class="dn">' + d.getDate() + '</div><div class="mo">' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '</div>' + month(d) + '</div>'
          + '<div class="cal-right drift glass-d"><h3>Coming up</h3>' + list + (hasCal ? '' : '<p class="hint">Add your Google Calendar from the phone remote to see your own events here.</p>') + '</div>'
          + (sample ? '<div class="sv-sample">Sample events. Your calendar appears on the TV.</div>' : '');
      }
      draw(); var t = setInterval(draw, 60000);
      return function () { clearInterval(t); };
    };
    function month(d) {
      var first = new Date(d.getFullYear(), d.getMonth(), 1), start = first.getDay(), days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), h = '<div class="mgrid">';
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (x) { h += '<b>' + x + '</b>'; });
      for (var i = 0; i < start; i++) h += '<i></i>';
      for (var k = 1; k <= days; k++) h += '<i class="' + (k === d.getDate() ? 'on' : '') + '">' + k + '</i>';
      return h + '</div>';
    }

    /* ---------- Family notes ---------- */
    scenes.notes = function (box) {
      var notes = (env.prefs().notes || []).slice().sort(function (a, b) { return b.t - a.t; });
      var main = notes[0], rest = notes.slice(1, 7);
      box.innerHTML = '<div class="sv-bgimg sv-slow" style="background-image:url(media/glass/' + env.wallNow() + '.jpg)"></div><div class="sv-shade"></div>'
        + (main ? '<div class="nt-main drift"><div class="q">' + esc(main.text) + '</div><div class="by">' + esc(main.from || 'Family') + ', ' + ago(main.t) + '</div></div>'
          + '<div class="nt-rest drift">' + rest.map(function (n) { return '<div class="nt glass-d"><p>' + esc(n.text) + '</p><span>' + esc(n.from || 'Family') + ', ' + ago(n.t) + '</span></div>'; }).join('') + '</div>'
          : '<div class="sv-empty">' + ico('note') + '<b>No family notes yet</b><span>Leave one from the phone remote. It shows up here and on the Today page.</span></div>');
      return function () {};
    };

    /* ---------- Headlines ---------- */
    scenes.news = function (box) {
      var r = env.info.read('news'), items = (r.data || []).slice(0, 7);
      box.innerHTML = '<div class="sv-bgimg" style="background-image:url(media/glass/' + env.wallNow() + '.jpg)"></div><div class="sv-shade strong"></div>'
        + '<div class="nw drift"><h3>Headlines</h3>' + (items.length ? items.map(function (n, i) { return '<div class="nw-i' + (i === 0 ? ' big' : '') + '"><p>' + esc(n.title) + '</p><span>' + esc(n.source) + (n.t ? ', ' + ago(n.t) : '') + '</span></div>'; }).join('') : '<p class="hint">Headlines appear once the TV is online.</p>') + '</div>'
        + (r.sample ? '<div class="sv-sample">Sample headlines. Live news appears on the TV.</div>' : '');
      return function () {};
    };

    function q(box, r) { return box.querySelector('[data-r="' + r + '"]'); }

    /* ---------- Engine ---------- */
    function show(name) {
      var box = el('scene'), stop = null;
      root.appendChild(box);
      try { stop = scenes[name](box); } catch (e) { stop = null; }
      if (stop === null) { root.removeChild(box); return false; }
      var old = current;
      void box.offsetWidth; box.classList.add('in');
      if (old) { old.box.classList.remove('in'); old.box.classList.add('out'); setTimeout(function () { try { old.stop && old.stop(); } catch (e) {} if (old.box.parentNode) old.box.parentNode.removeChild(old.box); }, 1400); }
      current = { box: box, stop: stop, name: name };
      return true;
    }
    function advance() {
      for (var tries = 0; tries < order.length; tries++) { var name = order[idx++ % order.length]; if (show(name)) return; }
      show('clock');
    }
    function start(only) {
      stop(true);
      running = true; single = !!only;
      var s = env.prefs().saver;
      order = only ? [only] : ['clock', 'photos', 'weather', 'art', 'calendar', 'notes', 'news'].filter(function (k) { return s.scenes[k]; });
      if (!order.length) order = ['clock'];
      idx = 0; advance();
      if (!single && order.length > 1) timer = setInterval(advance, Math.max(1, +s.each || 2) * 60000);
      drift = setInterval(function () {
        Array.prototype.forEach.call(root.querySelectorAll('.drift'), function (e) { e.style.transform = 'translate3d(' + Math.round(Math.random() * 32 - 16) + 'px,' + Math.round(Math.random() * 24 - 12) + 'px,0)'; });
      }, 60000);
    }
    function stop(silent) {
      running = false; clearInterval(timer); clearInterval(drift);
      if (current) { var c = current; current = null; try { c.stop && c.stop(); } catch (e) {} if (c.box.parentNode) c.box.parentNode.removeChild(c.box); }
    }
    return { start: start, stop: stop, running: function () { return running; }, scene: function () { return current && current.name; } };
  }
  window.PrismSaver = PrismSaver;
})();
