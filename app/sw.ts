import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: /^\/dashboard/,
      handler: 'NetworkFirst',
      options: { cacheName: 'lgk-dashboard', expiration: { maxAgeSeconds: 7200 } },
    },
    {
      matcher: /^\/orders$/,
      handler: 'NetworkFirst',
      options: { cacheName: 'lgk-orders', expiration: { maxAgeSeconds: 1800 } },
    },
    {
      matcher: /supabase\.co\/storage/,
      handler: 'CacheFirst',
      options: { cacheName: 'lgk-photos', expiration: { maxEntries: 100, maxAgeSeconds: 2592000 } },
    },
    ...defaultCache,
  ],
})

serwist.addEventListeners()
