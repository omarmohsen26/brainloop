const V = 'brainloop-1.8.0';
const HTML = ["./", "index.html", "about.html", "brain-training-faq.html", "daily-puzzle-habit.html", "guide.html", "learn.html", "letter-sequences.html", "logic-puzzles.html", "mental-math.html", "mini-sudoku.html", "missing-signs.html", "number-grids.html", "odd-one-out.html", "order-of-operations.html", "privacy.html", "sequences.html", "shape-equations.html", "solve-puzzles-faster.html"];
const ASSETS = ["style.css?v=1.8.0", "gen.js?v=1.8.0", "app.js?v=1.8.0", "manifest.webmanifest", "icon-192.png", "icon-512.png", "og.png"];
// Install is all-or-nothing: fetch every file fresh (bypass HTTP cache), check every page carries this version,
// and only then swap caches. A stale CDN copy during a Pages publish makes install fail, the old cache stays, the browser retries later.
self.addEventListener('install', e => {
  e.waitUntil((async () => { try {
    const c = await caches.open(V);
    for (const u of HTML) {
      const r = await fetch(u, { cache: 'reload' });
      if (!r.ok) throw new Error('bad ' + u);
      const t = await r.clone().text();
      if (t.indexOf('name="bl-version" content="1.8.0"') < 0) throw new Error('stale ' + u);
      await c.put(u, r);
    }
    for (const u of ASSETS) {
      const r = await fetch(u, { cache: 'reload' });
      if (!r.ok) throw new Error('bad ' + u);
      await c.put(u, r);
    }
    await self.skipWaiting();
  } catch (err) { await caches.delete(V); throw err; } })());
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url); if (u.origin !== location.origin) return;
  e.respondWith(caches.open(V).then(c => c.match(e.request, { ignoreSearch: false })).then(m => m || caches.open(V).then(c => c.match(e.request, { ignoreSearch: true })).then(m2 => m2 || fetch(e.request))));
});
