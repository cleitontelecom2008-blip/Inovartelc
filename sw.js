// ─── Book MDU · Service Worker v2 ────────────────────
const CACHE_NAME = 'book-mdu-v2';

// Assets locais — obrigatórios
const LOCAL_ASSETS = [
  './book_construcao_ativacao.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Assets externos — opcionais (não travam instalação)
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// ── Instalação ────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Locais: obrigatórios — se falhar, instala mesmo assim
      return cache.addAll(LOCAL_ASSETS).then(() => {
        // Externos: tenta cachear sem travar instalação
        EXTERNAL_ASSETS.forEach(url => {
          fetch(url, { mode: 'cors' })
            .then(res => { if (res && res.status === 200) cache.put(url, res); })
            .catch(() => {});
        });
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Ativação: remove caches antigos ──────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first, fallback rede ────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('./book_construcao_ativacao.html');
        }
      });
    })
  );
});
