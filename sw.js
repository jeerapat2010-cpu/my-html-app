/* ============================================================
   TTM Digital Portal — Service Worker
   หน้าที่: ทำให้เปิดใช้งานได้แม้ออฟไลน์ และโหลดเร็วขึ้น
   • หน้า .html  -> ลองเน็ตก่อน (ได้ข้อมูลใหม่เสมอ) ถ้าเน็ตล่มค่อยใช้ที่เก็บไว้
   • ไอคอน/ฟอนต์/CDN -> ใช้ของที่เก็บไว้ก่อน (เร็ว) แล้วอัปเดตเบื้องหลัง
   ⚠️ ทุกครั้งที่แก้ไฟล์นี้ ให้เปลี่ยนเลข VERSION เพื่อบังคับอัปเดต
   ============================================================ */
const VERSION = 'ttm-v1';
const SHELL   = `${VERSION}-shell`;
const PAGES   = `${VERSION}-pages`;
const ASSETS  = `${VERSION}-assets`;

/* ไฟล์หลักที่เก็บไว้ตั้งแต่ติดตั้ง */
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* ให้หน้าเว็บสั่งอัปเดตทันทีได้ */
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

const isHTML = req =>
  req.mode === 'navigate' ||
  (req.headers.get('accept') || '').includes('text/html') ||
  new URL(req.url).pathname.toLowerCase().endsWith('.html');

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* ข้าม GitHub API และรูปจากภายนอกที่เปลี่ยนบ่อย — ปล่อยผ่านตามปกติ */
  if (url.hostname === 'api.github.com' || url.hostname === 'loremflickr.com') return;

  /* ---------- หน้า HTML : Network-first ---------- */
  if (isHTML(req)) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(PAGES);
        c.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
        const home = await caches.match('./index.html');
        if (home) return home;
        return new Response(
          '<meta charset="utf-8"><div style="font-family:sans-serif;padding:40px;text-align:center">' +
          '<h2>ออฟไลน์อยู่</h2><p>ยังไม่เคยเปิดหน้านี้ขณะออนไลน์ จึงยังไม่มีข้อมูลที่บันทึกไว้</p></div>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
        );
      }
    })());
    return;
  }

  /* ---------- ไฟล์อื่น (ไอคอน ฟอนต์ CSS CDN) : Cache-first + อัปเดตเบื้องหลัง ---------- */
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        caches.open(ASSETS).then(c => c.put(req, res.clone()));
      }
      return res;
    }).catch(() => null);
    return cached || (await net) || new Response('', { status: 504 });
  })());
});
