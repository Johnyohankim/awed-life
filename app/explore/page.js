'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import { TIME_HORIZONS } from '../lib/exploreActivities'

function ExploreCard({ card, onKeep, keptToday, isFlipped, onFlip }) {
  const [keeping, setKeeping] = useState(false)
  const [kept, setKept] = useState(false)

  if (card.allDone) {
    return (
      <div className="relative aspect-[3/4] rounded-xl shadow-md opacity-60">
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-xl flex flex-col items-center justify-center p-3`}>
          <p className="text-white text-2xl mb-2">✅</p>
          <p className="text-white font-bold text-xs text-center">{card.label}</p>
          <p className="text-white text-[10px] mt-1 opacity-90">All collected!</p>
        </div>
      </div>
    )
  }

  const horizon = TIME_HORIZONS[card.activity?.horizon]

  const handleKeep = async (e) => {
    e.stopPropagation()
    if (keeping || keptToday || kept) return
    setKeeping(true)
    const success = await onKeep(card)
    if (success) setKept(true)
    setKeeping(false)
  }

  return (
    <div
      onClick={() => !isFlipped && onFlip()}
      className="relative aspect-[3/4] cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front - category card */}
        <div
          className={`absolute inset-0 rounded-xl shadow-md ${
            kept ? 'opacity-75' : 'active:scale-95 hover:scale-105 hover:shadow-lg'
          } transition-all duration-200`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-xl flex flex-col items-center justify-center p-3`}>
            {kept ? (
              <>
                <p className="text-white text-xl mb-1">✨</p>
                <p className="text-white font-bold text-center text-xs">{card.label}</p>
                <p className="text-white text-xs mt-1 opacity-75">Kept</p>
              </>
            ) : (
              <>
                <p className="text-white font-bold text-center text-xs drop-shadow">{card.label}</p>
                <p className="text-white text-xs mt-1 opacity-75">Tap</p>
              </>
            )}
          </div>
        </div>

        {/* Back - activity revealed */}
        <div
          className="absolute inset-0 rounded-xl shadow-md"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-xl flex flex-col items-center justify-between p-3 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/20 rounded-xl" />
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center">
              {/* Horizon badge */}
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] font-medium border border-white/20 mb-2">
                {horizon?.emoji} {horizon?.label}
              </span>
              {/* Activity text */}
              <p className="text-white font-semibold text-sm leading-snug drop-shadow px-1">
                {card.activity?.text}
              </p>
            </div>
            {/* Keep button */}
            <div className="relative z-10 w-full mt-2">
              {kept ? (
                <div className="w-full py-2 rounded-lg bg-white/20 text-white text-xs font-medium text-center">
                  ✨ Kept
                </div>
              ) : keptToday ? (
                <div className="w-full py-2 rounded-lg bg-black/20 text-white/60 text-[10px] text-center">
                  1 keep per day
                </div>
              ) : (
                <button
                  onClick={handleKeep}
                  disabled={keeping}
                  className="w-full py-2 rounded-lg bg-white/90 text-gray-900 text-xs font-semibold active:scale-95 transition-all hover:bg-white"
                >
                  {keeping ? '...' : 'Keep ✨'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturedExploreCard({ card, onKeep, keptToday, isFlipped, onFlip }) {
  const [keeping, setKeeping] = useState(false)
  const [kept, setKept] = useState(false)

  if (card.allDone) {
    return (
      <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-3xl shadow-xl opacity-60">
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-3xl flex flex-col items-center justify-center p-8`}>
          <p className="text-white text-4xl md:text-5xl mb-3">✅</p>
          <p className="text-white font-bold text-xl md:text-2xl">{card.label}</p>
          <p className="text-white text-sm mt-2 opacity-90">All walks collected!</p>
        </div>
      </div>
    )
  }

  const horizon = TIME_HORIZONS[card.activity?.horizon]

  const handleKeep = async (e) => {
    e.stopPropagation()
    if (keeping || keptToday || kept) return
    setKeeping(true)
    const success = await onKeep(card)
    if (success) setKept(true)
    setKeeping(false)
  }

  return (
    <div
      onClick={() => !isFlipped && onFlip()}
      className="relative aspect-[16/9] md:aspect-[21/9] cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-600`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 rounded-3xl shadow-xl ${
            kept ? 'opacity-75' : 'active:scale-[0.98] hover:scale-[1.02] hover:shadow-2xl'
          } transition-all duration-200`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-3xl flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden`}>
            <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium border border-white/30">
              Today's Explore
            </div>
            <div className="text-center max-w-3xl">
              {kept ? (
                <>
                  <p className="text-white text-4xl md:text-5xl mb-3">✨</p>
                  <p className="text-white font-bold text-xl md:text-2xl">{card.label}</p>
                  <p className="text-white text-sm mt-3 opacity-75">Kept today</p>
                </>
              ) : (
                <>
                  <p className="text-white font-bold text-2xl md:text-3xl drop-shadow-lg mb-4">{card.label}</p>
                  <p className="text-white text-sm md:text-base opacity-90 italic leading-relaxed mb-4 drop-shadow">
                    {card.subtitle}
                  </p>
                  <p className="text-white text-sm md:text-base opacity-80 font-medium">Tap to reveal your awe walk</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-3xl shadow-xl"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-3xl flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/25 rounded-3xl" />
            <div className="relative z-10 text-center max-w-3xl">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/20 mb-4">
                {horizon?.emoji} {horizon?.label}
              </span>
              <p className="text-white font-bold text-xl md:text-2xl leading-snug drop-shadow mb-6">
                {card.activity?.text}
              </p>
              {kept ? (
                <div className="inline-block px-6 py-3 rounded-xl bg-white/20 text-white font-medium text-sm">
                  ✨ Kept
                </div>
              ) : keptToday ? (
                <div className="inline-block px-6 py-3 rounded-xl bg-black/20 text-white/60 text-sm">
                  You've already kept a card today
                </div>
              ) : (
                <button
                  onClick={handleKeep}
                  disabled={keeping}
                  className="px-8 py-3 rounded-xl bg-white/90 text-gray-900 font-semibold text-sm active:scale-95 transition-all hover:bg-white shadow-lg"
                >
                  {keeping ? 'Keeping...' : 'Keep This Activity ✨'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cards, setCards] = useState([])
  const [totalKept, setTotalKept] = useState(0)
  const [keptToday, setKeptToday] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flippedCards, setFlippedCards] = useState(new Set())

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') loadExplore()
  }, [status])

  const loadExplore = async () => {
    try {
      const localDate = new Date().toLocaleDateString('en-CA')
      const res = await fetch(`/api/explore?localDate=${localDate}`)
      const data = await res.json()
      if (data.cards) {
        setCards(data.cards)
        setKeptToday(data.keptToday || false)
        setTotalKept(data.totalKept || 0)
      }
    } catch (error) {
      console.error('Error loading explore:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFlip = (category) => {
    setFlippedCards(prev => {
      const next = new Set(prev)
      next.add(category)
      return next
    })
  }

  const handleKeep = async (card) => {
    try {
      const localDate = new Date().toLocaleDateString('en-CA')
      const res = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: card.activity.id,
          category: card.category,
          horizon: card.activity.horizon,
          activityText: card.activity.text,
          localDate,
        })
      })
      const data = await res.json()
      if (data.success) {
        setKeptToday(true)
        setTotalKept(prev => prev + 1)
        return true
      } else {
        alert(data.error || 'Error keeping card')
        return false
      }
    } catch (error) {
      alert('Something went wrong')
      return false
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session) return null

  const featuredCard = cards[0]
  const remainingCards = cards.slice(1)

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
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Explore Awe</h2>
          <p className="text-gray-500 text-sm md:text-base mb-2">
            {keptToday
              ? 'You\'ve kept a walk today. Come back tomorrow! ✨'
              : 'Bring awe into your life. Flip a card and keep the one you feel like trying.'
            }
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
            <span className="text-blue-700 text-sm font-medium">
              {totalKept} walk{totalKept !== 1 ? 's' : ''} collected
            </span>
          </div>
        </div>

        {/* Featured card */}
        {featuredCard && (
          <div className="mb-6">
            <FeaturedExploreCard
              card={featuredCard}
              onKeep={handleKeep}
              keptToday={keptToday}
              isFlipped={flippedCards.has(featuredCard.category)}
              onFlip={() => handleFlip(featuredCard.category)}
            />
          </div>
        )}

        {/* Remaining cards grid */}
        {remainingCards.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {remainingCards.map(card => (
              <ExploreCard
                key={card.category}
                card={card}
                onKeep={handleKeep}
                keptToday={keptToday}
                isFlipped={flippedCards.has(card.category)}
                onFlip={() => handleFlip(card.category)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
