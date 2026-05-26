import './globals.css'
import { AppProvider } from '../utils/appContext'
import InstallPrompt from '../components/InstallPrompt'

export const metadata = {
  title: 'LGK Courier Business',
  description: 'Order and track deliveries across Poland',
  manifest: '/manifest.webmanifest',
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
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
        <InstallPrompt />
      </body>
    </html>
  )
}
