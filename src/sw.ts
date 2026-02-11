/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Precache static assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  const options: NotificationOptions & { renotify?: boolean } = {
    body: data.body,
    icon: '/site-icon.png',
    badge: '/site-icon.png',
    tag: data.tag || 'kaizen-notification',
    data: {
      url: data.url || '/dashboard',
      notificationId: data.notificationId,
    },
    renotify: !!data.tag,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'The Way of Kaizen', options)
  )
})

// Notification click handler — route to relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: url,
          })
          return
        }
      }
      return self.clients.openWindow(url)
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
