// Service worker: ใช้งานออฟไลน์ — แคชหน้าแอปและไลบรารี CDN (ไม่แคชข้อมูล/แผนที่)
const V='seize70-v7';
const CORE=['SeizeDoc70.html','seize-manifest.webmanifest','seize-icon-192.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('seize70-')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url); if(e.request.method!=='GET') return;
  const mine=u.origin===location.origin && /SeizeDoc70|seize-/.test(u.pathname);
  const lib=/cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u.host);
  if(!mine&&!lib) return;
  e.respondWith(caches.open(V).then(async c=>{ const hit=await c.match(e.request,{ignoreSearch:true});
    const net=fetch(e.request).then(r=>{ if(r&&(r.ok||r.type==='opaque')) c.put(e.request,r.clone()); return r; }).catch(()=>hit||Response.error());
    return lib?(hit||net):net.then(r=>r||hit); })); });
