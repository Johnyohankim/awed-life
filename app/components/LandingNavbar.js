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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow] duration-500 ${
      scrolled ? 'bg-surface-card/95 backdrop-blur-sm border-b border-border' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-6xl">
        <span className={`font-bold text-2xl ${scrolled ? 'text-text-primary' : 'text-white'}`}>
          Awed
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://blog.awed.life"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm font-medium transition-colors hidden md:block ${
              scrolled ? 'text-text-secondary hover:text-text-primary' : 'text-white/80 hover:text-white'
            }`}
          >
            Blog
          </a>
          {session ? (
            <Link
              href="/cards"
              className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Open App →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  scrolled ? 'text-text-secondary hover:bg-primary-light' : 'text-white hover:bg-white/15'
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
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
