// Escala JBS — Service Worker oficial
// Versão 1.7
// Atualização do cache e funcionamento offline.

const CACHE = 'escala-jbs-oficial-v1-7-0';
const SCOPE = self.registration.scope;
const APP = new URL('./index.html', SCOPE).href;

const ASSETS = [
  APP,
  new URL('./manifest.webmanifest', SCOPE).href,
  new URL('./icon-192.png', SCOPE).href,
  new URL('./icon-512.png', SCOPE).href
];

// Instala o novo cache e ativa a atualização.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Remove somente caches antigos do Escala JBS.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith('escala-jbs-oficial-') &&
            key !== CACHE
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Busca primeiro a versão atual na internet.
// Se estiver offline, utiliza a versão armazenada.
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (
    url.origin !== self.location.origin ||
    !url.href.startsWith(SCOPE)
  ) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            event.waitUntil(
              caches.open(CACHE)
                .then(cache => cache.put(APP, copy))
            );
          }

          return response;
        })
        .catch(async () =>
          (await caches.match(APP)) || Response.error()
        )
    );

    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
