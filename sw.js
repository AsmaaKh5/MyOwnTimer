const CACHE_NAME = 'timer-v1';
const FILES = [
    '/MyOwnTimer/',
    '/MyOwnTimer/index.html',
    '/MyOwnTimer/style.css',
    '/MyOwnTimer/app.js',
    '/MyOwnTimer/manifest.json'
];

// تنزيل الملفات عند التثبيت
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
    );
});

// حذف الكاش القديم
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
});

// تشغيل من الكاش لو مفيش نت
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});