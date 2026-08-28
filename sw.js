// Service worker mínimo: no cachea nada agresivamente (los datos son en
// vivo desde Firestore), solo existe para que el navegador permita
// "Agregar a pantalla de inicio" con ícono propio.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', () => {});
