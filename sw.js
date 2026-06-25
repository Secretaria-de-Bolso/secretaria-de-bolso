const CACHE='sb-v15';
const ASSETS=['/manifest.json'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.pathname==='/'||url.pathname==='/index.html'){
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});

self.addEventListener('push',e=>{
  const data=e.data?e.data.json():{title:'Secretária de Bolso',body:'Nova notificação'};
  e.waitUntil(self.registration.showNotification(data.title||'Secretária de Bolso',{
    body:data.body||'',
    icon:'/icon-192.png'
  }));
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
