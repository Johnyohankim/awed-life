'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import BottomNav from '../components/BottomNav'

export default function ExplorePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
          <button onClick={() => router.push('/cards')} className="text-2xl font-bold hover:text-gray-700 transition-colors">Awed</button>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => router.push('/explore')} className="text-sm text-blue-600 font-medium">Explore</button>
            <button onClick={() => router.push('/cards')} className="text-sm text-gray-600 hover:text-gray-900">Today's Cards</button>
            <button onClick={() => router.push('/journey')} className="text-sm text-gray-600 hover:text-gray-900">My Journey</button>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-gray-600 hover:text-gray-900">Sign Out</button>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="md:hidden text-sm text-gray-400">Sign Out</button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-blue-500">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">Explore</h1>
          <p className="text-gray-500 text-lg mb-2">Coming Soon</p>
          <p className="text-gray-400 text-sm max-w-md">
            Discover awe moments from the community, browse by category, and find new sources of wonder.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
