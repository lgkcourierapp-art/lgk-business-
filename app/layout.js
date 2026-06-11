import './globals.css'
import { AppProvider } from '../utils/appContext'

export const metadata = {
  metadataBase: new URL('https://lgk-business.vercel.app'),
  title: {
    default: 'LGK Business — Platforma dostaw dla firm',
    template: '%s | LGK Business',
  },
  description: 'Platforma dostaw dla firm w Polsce. Same-day delivery. Szczecin i cała Polska.',
  keywords: ['dostawa dla firm Szczecin','platforma kurierska Szczecin',
    'same-day delivery Polska','dostawa GPS potwierdzenie',
    'platforma dostaw B2B','kurier biznesowy Szczecin'],
  authors: [{ name: 'LGK Holdings Sp. z o.o.' }],
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true,
      'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 }
  },
  openGraph: {
    type: 'website', locale: 'pl_PL',
    alternateLocale: ['en_GB'],
    url: 'https://lgk-business.vercel.app',
    siteName: 'LGK Business',
    title: 'LGK Business — Platforma dostaw dla firm',
    description: 'Platforma dostaw dla firm w Polsce. Same-day delivery. GPS potwierdzenie każdej dostawy.',
    images: [{ url: '/og-business.svg', width: 1200, height: 630,
      alt: 'LGK Business — Platforma dostaw dla firm' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LGK Business — Platforma dostaw dla firm',
    description: 'Platforma dostaw dla firm w Polsce. Same-day delivery. GPS potwierdzenie każdej dostawy.',
    images: ['/og-business.svg'],
  },
  alternates: {
    canonical: 'https://lgk-business.vercel.app',
    languages: {
      pl: 'https://lgk-business.vercel.app',
      en: 'https://lgk-business.vercel.app?lang=en',
      uk: 'https://lgk-business.vercel.app?lang=uk',
    },
  },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
  manifest: '/manifest.webmanifest',
  verification: {
    google: 'BlsaKad1HdIxbJAt-lqBh9N49un9nffZrCeEHYvLkwQ',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#D4FF00" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="geo.region" content="PL-ZP" />
        <meta name="geo.placename" content="Szczecin" />
        <meta name="geo.position" content="53.4285;14.5528" />
        <meta name="ICBM" content="53.4285, 14.5528" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://ytoituxrrgrjjscnmsch.supabase.co" />
        <link rel="dns-prefetch" href="https://ytoituxrrgrjjscnmsch.supabase.co" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
