/* 五里头子奇 PWA 离线缓存 */
var CACHE = 'gomoku-v5';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(ASSETS);
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; })
      .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate'){
    /* 页面导航：优先联网取最新版，离线再回退缓存 */
    e.respondWith(
      fetch(e.request).then(function(res){
        if (res && res.status === 200){
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', clone); });
        }
        return res;
      }).catch(function(){
        return caches.match('./index.html');
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if (hit) return hit;
      return fetch(e.request).then(function(res){
        if (res && res.status === 200 && res.type === 'basic'){
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return res;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
