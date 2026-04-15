// NAFA Market — Service Worker
// Handles push notifications and offline caching

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Push notification handler ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'NAFA Market', body: event.data.text(), url: '/home' };
  }

  const { title = 'NAFA Market', body = '', url = '/home', icon, badge } = data;

  const options = {
    body,
    icon: icon || '/icons/icon-192.png',
    badge: badge || '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: { url },
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'dismiss', title: 'Ignorer' },
    ],
    tag: 'nafa-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click handler ──────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/home';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing window if one is open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
