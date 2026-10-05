/* Guarda la app en el teléfono para que abra y funcione sin señal. Cambia VERSION al publicar cambios. */
const VERSION = 'concreto-v1';
const ARCHIVOS = ['./', './index.html', './estilos.css', './logica.js', './app.js', './manifest.webmanifest',
  './icono-180.png', './icono-192.png', './icono-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r => r ||
      fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
