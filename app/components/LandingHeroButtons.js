'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function HeroButtons() {
  const { data: session } = useSession()
  const router = useRouter()

  if (session) {
    return (
      <button
        onClick={() => router.push('/cards')}
        className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg"
      >
        Open Your Cards →
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => router.push('/signup')}
        className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg"
      >
        Get Started — Free
      </button>
      <button
        onClick={() => router.push('/login')}
        className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:bg-opacity-10 transition-all"
      >
        Sign In
      </button>
    </>
  )
}

export function HowItWorksCTA() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(session ? '/cards' : '/signup')}
      className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors"
    >
      {session ? 'Open Your Cards →' : 'Start for Free →'}
    </button>
  )
}

export function SubmitCTA() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <>
      {session && (
        <p className="text-purple-600 font-medium mb-8">Earn ⭐ submission points when approved!</p>
      )}
      <button
        onClick={() => router.push(session ? '/submit' : '/signup')}
        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors"
      >
        {session ? 'Submit a Moment ✨' : 'Sign Up to Submit →'}
      </button>
    </>
  )
}

export function FooterLinks() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <div className="flex justify-center gap-6 text-sm text-gray-400 mb-8">
      {session ? (
        <button onClick={() => router.push('/cards')} className="hover:text-white transition-colors">My Cards</button>
      ) : (
        <button onClick={() => router.push('/signup')} className="hover:text-white transition-colors">Sign Up</button>
      )}
      <button onClick={() => router.push('/login')} className="hover:text-white transition-colors">Sign In</button>
      <a href="https://blog.awed.life" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Blog</a>
      <button onClick={() => router.push('/terms')} className="hover:text-white transition-colors">Terms</button>
      <button onClick={() => router.push('/privacy')} className="hover:text-white transition-colors">Privacy</button>
    </div>
  )
}
