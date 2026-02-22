import './globals.css'
import { Inter } from 'next/font/google'
import { SessionProvider } from './components/SessionProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Awed - Daily Awe Moments',
  description: 'Discover daily awe moments across 8 categories. Reflect, journal, and build your personal collection of inspiring content. Based on Dacher Keltner\'s research on awe.',
  keywords: 'awe, mindfulness, daily ritual, reflection, Dacher Keltner, awe moments, moral beauty, nature, spirituality, epiphany',
  authors: [{ name: 'Awed' }],
  openGraph: {
    title: 'Awed - Daily Awe Moments',
    description: 'A daily ritual of awe. Choose a card, reflect, collect.',
    url: 'https://awed.life',
    siteName: 'Awed',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Awed - Daily Awe Moments' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Awed - Daily Awe Moments',
    description: 'A daily ritual of awe. Choose a card, reflect, collect.',
    images: ['/opengraph-image'],
  },
  verification: {
    // We'll add Google Search Console verification here later
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#FAF8F5" />
      </head>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-primary focus:font-medium">
          Skip to content
        </a>
        <SessionProvider>
          <main id="main-content">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  )
}
