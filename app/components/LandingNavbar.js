'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function LandingNavbar() {
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow] duration-300 ${
      scrolled ? 'bg-white shadow-sm' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-6xl">
        <span className={`text-2xl font-bold ${scrolled ? 'text-gray-900' : 'text-white'}`}>
          Awed
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://blog.awed.life"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm font-medium transition-colors hidden md:block ${
              scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white opacity-90 hover:opacity-100'
            }`}
          >
            Blog
          </a>
          {session ? (
            <Link
              href="/cards"
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Open App →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
