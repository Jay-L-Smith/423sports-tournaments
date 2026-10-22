/* Saves the app screens (scripts, styles, pictures). Never saves scores or schedules. */
const CACHE = "423sports-shell-v2";
const SHELL = /\.(?:js|css|woff2?|png|svg|jpe?g|webp|ico|gif)$/i;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") return;
  if (url.pathname.includes("_serverFn") || url.pathname.startsWith("/api") || url.pathname.startsWith("/_server")) return;
  if (!SHELL.test(url.pathname)) return;
  event.respondWith(shell(request));
});

async function shell(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request);
  const updating = fetch(request)
    .then((fresh) => {
      if (fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => null);
  if (saved) return saved;
  const fresh = await updating;
  if (fresh) return fresh;
  throw new Error("offline");
}
