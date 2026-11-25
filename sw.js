const V = 'brainloop-1.1.0';
const FILES = ["./", "index.html", "style.css", "gen.js", "app.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "about.html", "brain-training-faq.html", "guide.html", "logic-puzzles.html", "mental-math.html", "mini-sudoku.html", "privacy.html", "sequences.html"];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(FILES))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url); if (u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
});
