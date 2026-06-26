const CACHE='sb-v18';
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
    icon:data.icon||'/icon-192.png',
    badge:data.badge||'/icon-512.png',
    requireInteraction:data.requireInteraction!==false,
    data:{url:data.url||'https://app.secretariadebolso.com'}
  }));
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const target=(e.notification.data&&e.notification.data.url)||'https://app.secretariadebolso.com';
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      for(const c of list){
        if(c.url.startsWith('https://app.secretariadebolso.com')&&'focus' in c)return c.focus();
      }
      return clients.openWindow(target);
    })
  );
});
