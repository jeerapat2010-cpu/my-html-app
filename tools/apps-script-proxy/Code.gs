/**
 * Area Ready — ตัวกลางข้อมูล (Google Apps Script Web App) v1
 * พัฒนาโดย ภก.จีรภัทร พลายงาม
 *
 * ทำไมต้องมี: Air4Thai และ API กรมอุตุฯ ไม่อนุญาตให้เว็บอื่นดึงข้อมูลผ่านเบราว์เซอร์ (CORS)
 * สคริปต์นี้ดึงแทนฝั่งเซิร์ฟเวอร์ ย่อข้อมูลให้เล็ก แล้วส่งให้แอป
 *
 * ปลอดภัย: เรียกได้เฉพาะ 4 แหล่งที่กำหนดไว้ด้านล่าง (ไม่ใช่ proxy เปิด) • ไม่เก็บพิกัดผู้ใช้
 * หากต้องใช้ GISTDA: ตั้งค่า Script property ชื่อ GISTDA_KEY (อย่าวางคีย์ในโค้ด)
 */
var AIR4THAI = 'https://air4thai.pcd.go.th/services/getNewAQI_JSON.php';
var TMD_QUAKE = 'https://data.tmd.go.th/api/DailySeismicEvent/v1/?uid=api&ukey=api12345&format=json';
var GISTDA = 'https://api-gateway.gistda.or.th/api/2.0/resources/gi-service/v1.1/disasters/flood-recurrence';

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    switch (p.src) {
      case 'ping':     return out_({ ok: true, v: 1, t: Date.now() });
      case 'air4thai': return out_(air4thai_(num_(p.lat), num_(p.lon)));
      case 'tmdquake': return out_(tmdquake_());
      case 'gistda':   return out_(gistda_(num_(p.lat), num_(p.lon)));
      default:         return out_({ ok: false, error: 'unknown src' });
    }
  } catch (err) {
    return out_({ ok: false, error: String((err && err.message) || err).slice(0, 200) });
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function num_(x) {
  var n = parseFloat(x);
  if (!isFinite(n)) throw new Error('bad coordinate');
  return n;
}
function r1_(x) { return Math.round(x * 10) / 10; }
function r2_(x) { return Math.round(x * 100) / 100; }
function hav_(a, b, c, d) {
  var R = 6371, rad = Math.PI / 180;
  var x = Math.pow(Math.sin((c - a) * rad / 2), 2) + Math.cos(a * rad) * Math.cos(c * rad) * Math.pow(Math.sin((d - b) * rad / 2), 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}
function getJson_(url, headers) {
  var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: headers || {} });
  var code = r.getResponseCode();
  if (code !== 200) throw new Error('upstream HTTP ' + code);
  return JSON.parse(r.getContentText());
}
function cacheGet_(k) {
  try { var v = CacheService.getScriptCache().get(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function cachePut_(k, o, ttl) {
  try { var s = JSON.stringify(o); if (s.length < 90000) CacheService.getScriptCache().put(k, s, ttl); } catch (e) {}
}

/* Air4Thai: สถานีตรวจวัดคุณภาพอากาศจริง — คัดสถานีใกล้พิกัด (≤40 กม.) สูงสุด 8 สถานี */
function air4thai_(lat, lon) {
  var la = r1_(lat), lo = r1_(lon), key = 'a4t:' + la + ',' + lo;
  var c = cacheGet_(key); if (c) return c;
  var j = getJson_(AIR4THAI), st = (j && j.stations) || [], rows = [];
  for (var i = 0; i < st.length; i++) {
    var s = st[i], slat = parseFloat(s.lat), slon = parseFloat(s.long);
    if (!isFinite(slat) || !isFinite(slon)) continue;
    var d = hav_(la, lo, slat, slon); if (d > 40) continue;
    var L = s.AQILast || {}, pm = L.PM25 || {}, v = parseFloat(pm.value), aq = parseFloat(pm.aqi);
    if (!isFinite(v) || v < 0) continue;
    rows.push({ id: String(s.stationID || ''), n: String(s.nameTH || ''), a: String(s.areaTH || ''), lat: slat, lon: slon, d: r1_(d),
      date: String(L.date || ''), time: String(L.time || ''), pm25: v, aqi: isFinite(aq) && aq >= 0 ? aq : null });
  }
  rows.sort(function (a, b) { return a.d - b.d; });
  var o = { ok: true, src: 'air4thai', fetched: Date.now(), owner: 'กรมควบคุมมลพิษ (Air4Thai)', stations: rows.slice(0, 8) };
  cachePut_(key, o, 600);
  return o;
}

/* TMD: แผ่นดินไหวในไทย/ภูมิภาค (กรอบ lat 0–25, lon 90–112) ย้อนหลัง 72 ชม. */
function tmdquake_() {
  var c = cacheGet_('tmdq'); if (c) return c;
  var j = getJson_(TMD_QUAKE), ev = (j && j.DailyEarthquakes) || [], rows = [], now = Date.now();
  for (var i = 0; i < ev.length; i++) {
    var e = ev[i], la = parseFloat(e.Latitude), lo = parseFloat(e.Longitude), m = parseFloat(e.Magnitude);
    if (!isFinite(la) || !isFinite(lo) || !isFinite(m)) continue;
    if (la < 0 || la > 25 || lo < 90 || lo > 112) continue;
    var t = Date.parse(String(e.DateTimeThai || '').replace(' ', 'T').replace(/\.\d+$/, '') + '+07:00');
    if (!isFinite(t) || now - t > 72 * 3600e3) continue;
    var dp = parseFloat(e.Depth);
    rows.push({ t: t, o: String(e.OriginThai || ''), m: m, dp: isFinite(dp) ? dp : null, lat: la, lon: lo });
  }
  rows.sort(function (a, b) { return b.t - a.t; });
  var o = { ok: true, src: 'tmdquake', fetched: now, owner: 'กรมอุตุนิยมวิทยา', events: rows.slice(0, 60) };
  cachePut_('tmdq', o, 300);
  return o;
}

/* GISTDA: พื้นที่น้ำท่วมซ้ำซาก (ต้องมี GISTDA_KEY ใน Script properties) — ส่งผลดิบแบบย่อ */
function gistda_(lat, lon) {
  var key = PropertiesService.getScriptProperties().getProperty('GISTDA_KEY');
  if (!key) return { ok: false, error: 'GISTDA_KEY not set' };
  var la = r2_(lat), lo = r2_(lon), ck = 'gd:' + la + ',' + lo;
  var c = cacheGet_(ck); if (c) return c;
  var j = getJson_(GISTDA + '?lat=' + encodeURIComponent(la) + '&lon=' + encodeURIComponent(lo) + '&api_key=' + encodeURIComponent(key));
  var s = JSON.stringify(j), cut = s.length > 20000;
  var o = { ok: true, src: 'gistda', fetched: Date.now(), owner: 'GISTDA', truncated: cut, raw: cut ? s.slice(0, 20000) : j };
  cachePut_(ck, o, 86400);
  return o;
}
