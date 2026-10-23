/* Prism live information: weather, air quality, news, Indian holidays, your Google Calendar (private
   iCal link), sunrise/sunset and moon phase. Everything is cached so it still shows when offline.
   On the TV, requests go through the Android app (no browser cross-site limits). */
(function () {
  'use strict';

  var CACHE_KEY = 'prism.cache.v1';
  var HOLIDAYS = 'https://calendar.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics';
  var FEEDS = {
    hyd: { name: 'The Hindu, Hyderabad', url: 'https://www.thehindu.com/news/cities/Hyderabad/feeder/default.rss' },
    india: { name: 'The Hindu, India', url: 'https://www.thehindu.com/news/national/feeder/default.rss' },
    toi: { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
    et: { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms' },
    bbc: { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' }
  };
  var ART_TOPICS = ['landscape', 'impressionism', 'garden', 'sea', 'river', 'mountains', 'flowers', 'city'];
  var EVERY = { weather: 30, aqi: 60, news: 30, holidays: 720, cal: 15, art: 720 };

  var WX = {
    0: ['Clear', 'sun'], 1: ['Mostly clear', 'sun'], 2: ['Partly cloudy', 'partly'], 3: ['Cloudy', 'cloud'],
    45: ['Fog', 'fog'], 48: ['Fog', 'fog'], 51: ['Light drizzle', 'drizzle'], 53: ['Drizzle', 'drizzle'], 55: ['Heavy drizzle', 'drizzle'],
    56: ['Freezing drizzle', 'drizzle'], 57: ['Freezing drizzle', 'drizzle'], 61: ['Light rain', 'rain'], 63: ['Rain', 'rain'], 65: ['Heavy rain', 'rain'],
    66: ['Freezing rain', 'rain'], 67: ['Freezing rain', 'rain'], 71: ['Light snow', 'snow'], 73: ['Snow', 'snow'], 75: ['Heavy snow', 'snow'], 77: ['Snow grains', 'snow'],
    80: ['Showers', 'rain'], 81: ['Showers', 'rain'], 82: ['Heavy showers', 'rain'], 85: ['Snow showers', 'snow'], 86: ['Snow showers', 'snow'],
    95: ['Thunderstorm', 'storm'], 96: ['Thunderstorm', 'storm'], 99: ['Thunderstorm', 'storm']
  };

  function PrismInfo(opts) {
    var N = opts.native, cache = {}, pending = {}, seq = 0, listeners = [];
    try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (e) { cache = {}; }
    function persist() { try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {} }
    function emit(k) { listeners.forEach(function (f) { try { f(k); } catch (e) {} }); }

    /* Android calls this when a request it made for us finishes. */
    window.PrismFetchDone = function (id, ok, text) { var cb = pending[id]; delete pending[id]; if (cb) cb(ok ? text : null); };
    function get(url) {
      return new Promise(function (resolve) {
        var done = false, finish = function (v) { if (!done) { done = true; resolve(v); } };
        setTimeout(function () { finish(null); }, 20000);
        if (N && N.fetch) {
          var id = 'f' + (++seq); pending[id] = finish;
          try { N.fetch(id, url); } catch (e) { delete pending[id]; finish(null); }
          return;
        }
        try { fetch(url).then(function (r) { return r.ok ? r.text() : null; }).then(finish, function () { finish(null); }); } catch (e) { finish(null); }
      });
    }

    function place() { var i = opts.prefs().info; return { name: i.place || 'Hyderabad', lat: i.lat || 17.385, lon: i.lon || 78.4867 }; }
    function fresh(k) { var c = cache[k]; return c && !c.sample && Date.now() - c.t < EVERY[k] * 60000; }
    function put(k, data) { cache[k] = { t: Date.now(), data: data }; persist(); emit(k); }

    /* ---------- Weather and air ---------- */
    function weather(force) {
      if (!force && fresh('weather')) return Promise.resolve();
      var p = place();
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + p.lat + '&longitude=' + p.lon
        + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,cloud_cover,wind_speed_10m'
        + '&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max'
        + '&timezone=auto&forecast_days=3';
      return get(url).then(function (t) {
        if (!t) return;
        try {
          var j = JSON.parse(t), c = j.current, now = Date.now(), hours = [];
          for (var i = 0; i < j.hourly.time.length && hours.length < 8; i++) {
            var ht = new Date(j.hourly.time[i]).getTime();
            if (ht >= now - 3600000) hours.push({ t: ht, temp: Math.round(j.hourly.temperature_2m[i]), code: j.hourly.weather_code[i], rain: j.hourly.precipitation_probability[i] || 0 });
          }
          put('weather', {
            place: p.name, temp: Math.round(c.temperature_2m), feels: Math.round(c.apparent_temperature), humidity: Math.round(c.relative_humidity_2m),
            code: c.weather_code, day: !!c.is_day, cloud: c.cloud_cover, wind: Math.round(c.wind_speed_10m), hours: hours,
            max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]),
            sunrise: new Date(j.daily.sunrise[0]).getTime(), sunset: new Date(j.daily.sunset[0]).getTime(),
            tomorrow: { code: j.daily.weather_code[1], max: Math.round(j.daily.temperature_2m_max[1]), min: Math.round(j.daily.temperature_2m_min[1]), rain: j.daily.precipitation_probability_max[1] }
          });
        } catch (e) {}
      });
    }
    function aqi(force) {
      if (!force && fresh('aqi')) return Promise.resolve();
      var p = place();
      return get('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + p.lat + '&longitude=' + p.lon + '&current=us_aqi,pm2_5,pm10').then(function (t) {
        if (!t) return;
        try { var c = JSON.parse(t).current; put('aqi', { aqi: Math.round(c.us_aqi), pm25: Math.round(c.pm2_5), pm10: Math.round(c.pm10) }); } catch (e) {}
      });
    }

    /* ---------- News ---------- */
    function news(force) {
      if (!force && fresh('news')) return Promise.resolve();
      var on = opts.prefs().info.news || {}, keys = Object.keys(FEEDS).filter(function (k) { return on[k]; });
      if (!keys.length) { put('news', []); return Promise.resolve(); }
      return Promise.all(keys.map(function (k) {
        return get(FEEDS[k].url).then(function (t) {
          if (!t) return [];
          try {
            var doc = new DOMParser().parseFromString(t, 'text/xml'), items = doc.getElementsByTagName('item'), out = [];
            for (var i = 0; i < items.length && i < 8; i++) {
              var title = text(items[i], 'title'), when = Date.parse(text(items[i], 'pubDate')) || 0;
              if (title) out.push({ title: title.replace(/\s+/g, ' ').trim(), source: FEEDS[k].name, t: when });
            }
            return out;
          } catch (e) { return []; }
        });
      })).then(function (lists) {
        var all = [].concat.apply([], lists);
        if (!all.length) return;
        all.sort(function (a, b) { return b.t - a.t; });
        put('news', all.slice(0, 24));
      });
    }
    function text(node, tag) { var e = node.getElementsByTagName(tag)[0]; return e ? (e.textContent || '') : ''; }

    /* ---------- Calendars (iCal) ---------- */
    function holidays(force) {
      if (!force && fresh('holidays')) return Promise.resolve();
      return get(HOLIDAYS).then(function (t) { if (t) put('holidays', ics(t, 'holiday', 120).map(ser)); });
    }
    function calendar(force) {
      var url = (opts.prefs().info.ics || '').trim().replace(/^webcal:/i, 'https:');
      if (!url) { if (cache.cal) { delete cache.cal; persist(); emit('cal'); } return Promise.resolve(); }
      if (!force && fresh('cal')) return Promise.resolve();
      return get(url).then(function (t) { if (t) put('cal', ics(t, 'cal', 45).map(ser)); });
    }
    function ser(e) { return { title: e.title, start: e.start.getTime(), allDay: e.allDay, src: e.src }; }
    function ics(raw, src, days) {
      var lines = raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/), out = [], ev = null;
      var from = Date.now() - 86400000, to = Date.now() + days * 86400000;
      lines.forEach(function (l) {
        if (l === 'BEGIN:VEVENT') ev = {};
        else if (l === 'END:VEVENT') { if (ev && ev.start) expand(ev, from, to, src).forEach(function (x) { out.push(x); }); ev = null; }
        else if (ev) {
          var c = l.indexOf(':'); if (c < 0) return;
          var head = l.slice(0, c), val = l.slice(c + 1), name = head.split(';')[0];
          if (name === 'SUMMARY') ev.title = val.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, ' ');
          else if (name === 'DTSTART') { ev.start = icsDate(val); ev.allDay = /VALUE=DATE(?!-)/.test(head) || val.length === 8; }
          else if (name === 'RRULE') ev.rrule = val;
          else if (name === 'EXDATE') { ev.ex = ev.ex || []; val.split(',').forEach(function (v) { var d = icsDate(v); if (d) ev.ex.push(d.getTime()); }); }
          else if (name === 'STATUS' && val === 'CANCELLED') ev.cancelled = true;
        }
      });
      out.sort(function (a, b) { return a.start - b.start; });
      return out;
    }
    function icsDate(v) {
      var m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/.exec(v); if (!m) return null;
      if (!m[4]) return new Date(+m[1], +m[2] - 1, +m[3]);
      if (m[7]) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
      return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    }
    function expand(ev, from, to, src) {
      if (ev.cancelled) return [];
      var base = { title: ev.title || 'Event', allDay: !!ev.allDay, src: src }, list = [];
      function add(d) { if (d.getTime() >= from && d.getTime() <= to && !(ev.ex && ev.ex.indexOf(d.getTime()) >= 0)) list.push({ title: base.title, allDay: base.allDay, src: src, start: d }); }
      if (!ev.rrule) { add(ev.start); return list; }
      var r = {}; ev.rrule.split(';').forEach(function (p) { var kv = p.split('='); r[kv[0]] = kv[1]; });
      var step = +(r.INTERVAL || 1), count = r.COUNT ? +r.COUNT : 2000, until = r.UNTIL ? icsDate(r.UNTIL) : null;
      var days = r.BYDAY ? r.BYDAY.split(',').map(function (d) { return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(d.replace(/[^A-Z]/g, '')); }) : null;
      var d = new Date(ev.start.getTime()), n = 0, guard = 0;
      while (n < count && guard++ < 3000) {
        if (until && d > until) break;
        if (d.getTime() > to) break;
        if (r.FREQ === 'WEEKLY' && days) {
          for (var k = 0; k < 7; k++) {
            var x = new Date(d.getTime()); x.setDate(d.getDate() + k);
            if (days.indexOf(x.getDay()) >= 0 && x >= ev.start) { if (until && x > until) break; add(x); n++; if (n >= count) break; }
          }
          d.setDate(d.getDate() + 7 * step);
        } else {
          add(new Date(d.getTime())); n++;
          if (r.FREQ === 'DAILY') d.setDate(d.getDate() + step);
          else if (r.FREQ === 'WEEKLY') d.setDate(d.getDate() + 7 * step);
          else if (r.FREQ === 'MONTHLY') d.setMonth(d.getMonth() + step);
          else if (r.FREQ === 'YEARLY') d.setFullYear(d.getFullYear() + step);
          else break;
        }
      }
      return list;
    }

    /* ---------- Art (Art Institute of Chicago, public-domain works, no key needed) ---------- */
    function art(force) {
      if (!force && fresh('art')) return Promise.resolve();
      var topic = ART_TOPICS[Math.floor(Date.now() / 86400000) % ART_TOPICS.length];
      var url = 'https://api.artic.edu/api/v1/artworks/search?q=' + topic + '&query%5Bterm%5D%5Bis_public_domain%5D=true&limit=40&fields=id,title,artist_title,date_display,image_id';
      return get(url).then(function (t) {
        if (!t) return;
        try {
          var list = (JSON.parse(t).data || []).filter(function (a) { return a.image_id; }).map(function (a) {
            return { title: a.title, artist: a.artist_title || 'Unknown artist', date: a.date_display || '', img: 'https://www.artic.edu/iiif/2/' + a.image_id + '/full/1686,/0/default.jpg' };
          });
          if (list.length) put('art', list);
        } catch (e) {}
      });
    }

    /* ---------- Sky ---------- */
    function moon(d) {
      var syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14), age = (((d.getTime() - ref) / 86400000) % syn + syn) % syn, f = age / syn;
      var names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
      return { phase: f, name: names[Math.round(f * 8) % 8], lit: Math.round((1 - Math.cos(2 * Math.PI * f)) * 50) };
    }

    /* ---------- Samples for the browser preview (never shown as real data) ---------- */
    function sample(k) {
      var now = new Date(), h = now.getHours(), base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (k === 'weather') {
        var hours = []; for (var i = 0; i < 8; i++) hours.push({ t: now.getTime() + i * 3600000, temp: 27 - Math.round(i / 3), code: i < 3 ? 2 : i < 5 ? 3 : 61, rain: i < 3 ? 10 : i < 5 ? 30 : 60 });
        return { place: 'Hyderabad', temp: 27, feels: 29, humidity: 72, code: 2, day: h >= 6 && h < 18, cloud: 45, wind: 9, hours: hours, max: 31, min: 21,
          sunrise: base.getTime() + (6 * 60 + 9) * 60000, sunset: base.getTime() + (17 * 60 + 46) * 60000, tomorrow: { code: 3, max: 30, min: 21, rain: 40 } };
      }
      if (k === 'aqi') return { aqi: 92, pm25: 31, pm10: 58 };
      if (k === 'news') return [
        { title: 'Sample headline: live news from the sources you pick appears here on the TV', source: 'Preview', t: now.getTime() },
        { title: 'Sample headline: The Hindu Hyderabad, The Hindu India, Times of India, Economic Times and BBC World are available', source: 'Preview', t: now.getTime() - 1800000 },
        { title: 'Sample headline: choose your sources from the phone remote', source: 'Preview', t: now.getTime() - 3600000 }
      ];
      if (k === 'holidays') return [{ title: 'Sample holiday', start: base.getTime() + 3 * 86400000, allDay: true, src: 'holiday' }];
      if (k === 'cal') return [
        { title: 'Sample event from your Google Calendar', start: base.getTime() + (h + 1) * 3600000, allDay: false, src: 'cal' },
        { title: 'Sample all-day event', start: base.getTime() + 86400000, allDay: true, src: 'cal' }
      ];
      return null;
    }

    function read(k) {
      var c = cache[k];
      if (c && c.data) return { data: c.data, t: c.t, sample: false };
      if (k === 'cal' && !(opts.prefs().info.ics || '').trim()) return { data: null, t: 0, sample: false };
      if (k === 'art') return { data: null, t: 0, sample: false };
      if (opts.samples) return { data: sample(k), t: Date.now(), sample: true };
      return { data: null, t: 0, sample: false };
    }
    function events(days) {
      var cal = read('cal').data || [], hol = read('holidays').data || [], from = new Date(); from.setHours(0, 0, 0, 0);
      var to = from.getTime() + (days || 7) * 86400000;
      return cal.concat(hol).filter(function (e) { return e.start >= (e.allDay ? from.getTime() : Date.now() - 1800000) && e.start < to; })
        .sort(function (a, b) { return a.start - b.start || (a.allDay ? -1 : 1); });
    }
    function refresh(force) {
      return Promise.all([weather(force), aqi(force), news(force), holidays(force), calendar(force), art(force)]).then(function () { emit('all'); });
    }

    return {
      refresh: refresh, read: read, events: events, moon: moon, feeds: FEEDS,
      wx: function (code) { return WX[code] || ['Weather', 'cloud']; },
      on: function (f) { listeners.push(f); },
      place: place,
      aqiLabel: function (v) { return v <= 50 ? 'Good' : v <= 100 ? 'Moderate' : v <= 150 ? 'Unhealthy for some' : v <= 200 ? 'Unhealthy' : v <= 300 ? 'Very unhealthy' : 'Hazardous'; },
      clear: function (k) { delete cache[k]; persist(); }
    };
  }
  window.PrismInfo = PrismInfo;
})();
