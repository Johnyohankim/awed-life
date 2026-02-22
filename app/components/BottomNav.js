'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    {
      label: 'Explore',
      path: '/explore',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-primary' : 'fill-text-muted'}`}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/>
        </svg>
      )
    },
    {
      label: 'Cards',
      path: '/cards',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-primary' : 'fill-text-muted'}`}>
          <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4zm2 0v16h12V4H6z"/>
          <path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
        </svg>
      )
    },
    {
      label: 'My Journey',
      path: '/journey',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-primary' : 'fill-text-muted'}`}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-card border-t border-border md:hidden z-40">
      <div className="flex items-center px-2 py-2 safe-area-pb">
        {tabs.map((tab) => {
          const active = pathname === tab.path
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${
                active ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {tab.icon(active)}
              <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-text-muted'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
