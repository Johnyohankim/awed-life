'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    {
      label: 'Explore',
      path: '/explore',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-blue-600' : 'fill-gray-400'}`}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      )
    },
    {
      label: 'Cards',
      path: '/cards',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-blue-600' : 'fill-gray-400'}`}>
          <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4zm2 0v16h12V4H6z"/>
          <path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
        </svg>
      )
    },
    {
      label: 'My Journey',
      path: '/journey',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-blue-600' : 'fill-gray-400'}`}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-40">
      <div className="flex items-center px-2 py-2 safe-area-pb">
        {tabs.map((tab) => {
          const active = pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {tab.icon(active)}
              <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}