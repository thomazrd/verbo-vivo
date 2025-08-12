
// Service Worker

const CACHE_NAME = 'verbo-vivo-cache-v1';

// Lista de arquivos a serem cacheados na instalação.
// Inclui a 'casca' da aplicação (app shell).
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  // Adicione aqui outros assets estáticos que são essenciais,
  // como a logo principal ou fontes, se não forem carregados via CSS.
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  // Realiza a instalação: abre o cache e adiciona os arquivos do app shell.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  // Limpa caches antigos para garantir que a nova versão do SW seja usada.
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET (ex: POST para APIs)
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Estratégia: Network Falling to Cache
  // Tenta buscar da rede primeiro. Se falhar (offline), recorre ao cache.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a requisição à rede foi bem-sucedida, clona a resposta.
        // A resposta original vai para o navegador, a cópia vai para o cache.
        // Isso mantém o cache atualizado.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            // Não cacheia requisições do Chrome extension, pois causam erro.
            if (event.request.url.startsWith('chrome-extension://')) {
              return;
            }
            cache.put(event.request, responseToCache);
          });
        return networkResponse;
      })
      .catch(() => {
        // Se a requisição à rede falhou (offline), tenta encontrar no cache.
        return caches.match(event.request)
          .then((cachedResponse) => {
            // Retorna a resposta do cache se encontrada.
            // Se nem na rede nem no cache, o navegador exibirá a página de erro padrão.
            return cachedResponse || Response.error();
          });
      })
  );
});
