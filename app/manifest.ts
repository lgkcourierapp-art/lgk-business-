import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LGK Business',
    short_name: 'LGK',
    description: 'Place and track deliveries. GPS-verified proof of delivery.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      {
        name: 'Admin — Orders',
        short_name: 'Orders',
        description: 'View and confirm incoming orders',
        url: '/admin/orders',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Admin — HQ',
        short_name: 'HQ',
        description: 'Operations control centre',
        url: '/admin',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
    categories: ['business', 'productivity'],
  }
}
