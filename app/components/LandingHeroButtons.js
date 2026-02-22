'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export function HeroButtons() {
  const { data: session } = useSession()

  if (session) {
    return (
      <Link
        href="/cards"
        className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg"
      >
        Open Your Cards →
      </Link>
    )
  }

  return (
    <>
      <Link
        href="/signup"
        className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg"
      >
        Get Started — Free
      </Link>
      <Link
        href="/login"
        className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:bg-opacity-10 transition-all"
      >
        Sign In
      </Link>
    </>
  )
}

export function HowItWorksCTA() {
  const { data: session } = useSession()

  return (
    <Link
      href={session ? '/cards' : '/signup'}
      className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors inline-block"
    >
      {session ? 'Open Your Cards →' : 'Start for Free →'}
    </Link>
  )
}

export function SubmitCTA() {
  const { data: session } = useSession()

  return (
    <>
      {session && (
        <p className="text-purple-600 font-medium mb-8">Earn ⭐ submission points when approved!</p>
      )}
      <Link
        href={session ? '/submit' : '/signup'}
        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors inline-block"
      >
        {session ? 'Submit a Moment ✨' : 'Sign Up to Submit →'}
      </Link>
    </>
  )
}

export function FooterLinks() {
  const { data: session } = useSession()

  return (
    <div className="flex justify-center gap-6 text-sm text-gray-400 mb-8">
      {session ? (
        <Link href="/cards" className="hover:text-white transition-colors">My Cards</Link>
      ) : (
        <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
      )}
      <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
      <a href="https://blog.awed.life" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Blog</a>
      <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
      <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
    </div>
  )
}
