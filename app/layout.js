import './globals.css'
import { AppProvider } from '../utils/appContext'
import InstallPrompt from '../components/InstallPrompt'

export const metadata = {
  metadataBase: new URL('https://lgk-business.vercel.app'),
  title: {
    default: 'LGK Business — Dostawa dla restauracji Szczecin | 10% prowizji',
    template: '%s | LGK Business',
  },
  description: 'Własna dostawa dla restauracji w Szczecinie. 10% prowizji zamiast 25-30%. GPS potwierdzenie każdej dostawy. Bez umowy. Pierwsza dostawa gratis.',
  keywords: ['dostawa jedzenia Szczecin','własna dostawa restauracja',
    'platforma kurierska Szczecin','tania dostawa restauracja Polska',
    'kurier dla restauracji','dostawa GPS potwierdzenie',
    'alternatywa platforma dostawy'],
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
    title: 'LGK Business — Dostawa dla restauracji Szczecin',
    description: 'Własna dostawa dla restauracji w Szczecinie. 10% prowizji zamiast 25-30%. GPS potwierdzenie każdej dostawy.',
    images: [{ url: '/og-business.svg', width: 1200, height: 630,
      alt: 'LGK Business — Dostawa dla restauracji w Szczecinie' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LGK Business — Dostawa dla restauracji Szczecin | 10% prowizji',
    description: 'Własna dostawa dla restauracji w Szczecinie. 10% prowizji zamiast 25-30%.',
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
  icons: { icon: '/icon.png', apple: '/icon.png' },
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
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
        <InstallPrompt />
      </body>
    </html>
  )
}
