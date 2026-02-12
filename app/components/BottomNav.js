'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
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
      label: 'Collection',
      path: '/collection',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-blue-600' : 'fill-gray-400'}`}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: (active) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-blue-600' : 'fill-gray-400'}`}>
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      )
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-40">
      <div className="flex items-center justify-around px-4 py-2 safe-area-pb">
        {tabs.map((tab) => {
          const active = pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${
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