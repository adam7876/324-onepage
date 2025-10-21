const CACHE_NAME = '324-games-v2.3.0';
const urlsToCache = [
  '/games',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // 添加其他重要資源
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // 強制激活新的 Service Worker
  self.skipWaiting();
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  // 對於 HTML 頁面，優先檢查網路更新
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 如果網路請求成功，更新快取並返回
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 如果網路請求失敗，返回快取版本
          return caches.match(event.request);
        })
    );
  } else {
    // 對於其他資源（圖片、CSS、JS等），使用快取優先策略
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
});

// 更新 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即控制所有頁面
      return self.clients.claim();
    })
  );
});
