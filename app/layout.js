import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Awed - Daily Awe Moments',
    description: 'A daily ritual of awe. Choose a card, reflect, collect.',
  },
  verification: {
    // We'll add Google Search Console verification here later
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
