const cacheName = "v0"

async function cleanupCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map(key => {
    if (key != cacheName) {
      console.log("Removing cache", key);
      return caches.delete(key);
    }
  }));
}

async function getFromCache(request) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request, { ignoreSearch: true });
  if (cachedResponse) {
    return cachedResponse;
  }
  const networkResponse = await fetch(request)
  cache.put(request, networkResponse.clone());
  return networkResponse;
}

async function tryFetchFromNetwork(request) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    await cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (e) {
    const cachedResponse = await cache.match(request, { ignoreSearch: true });
    if (cachedResponse) {
      return cachedResponse;
    } else {
      throw e;
    }
  }
}

async function getFromCacheAndRevalidate(request) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request, { ignoreSearch: true });
  // Update cache in the background
  const fetchedResponse = fetch(request)
    .then(networkResponse => {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    })
    .catch();
  return cachedResponse || fetchedResponse;
}

self.addEventListener("activate", e => {
  e.waitUntil(cleanupCaches());
})

self.addEventListener("fetch", async event => {
  console.log("Request:", event.request);
  if (event.request.cache == "no-cache") {
    event.respondWith(tryFetchFromNetwork(event.request));
  } else {
    event.respondWith(getFromCache(event.request));
  }
});
