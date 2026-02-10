'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

function CardModal({ card, onClose, onKeep, alreadyKeptToday }) {
  const [journalText, setJournalText] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [keeping, setKeeping] = useState(false)
  const [kept, setKept] = useState(card.isKept)
  const [streak, setStreak] = useState(null)

  const videoId = getYouTubeId(card.video?.videoLink)
  const canKeep = journalText.trim().length >= 10
  const charsLeft = 10 - journalText.trim().length

  const handleKeep = async () => {
    if (!canKeep || keeping) return
    setKeeping(true)

    try {
      const response = await fetch('/api/cards/keep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: card.video.id,
          journalText: journalText.trim(),
          isPublic
        })
      })

      const data = await response.json()

      if (data.success) {
        setKept(true)
        setStreak(data.streak)
        onKeep()
      } else {
        alert(data.error || 'Error keeping card')
      }
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setKeeping(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold">{card.label}</h3>
            {kept && streak && (
              <p className="text-sm text-orange-500 font-medium">
                🔥 {streak} day streak!
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {videoId ? (
            <div className="aspect-video mb-6 rounded-xl overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={card.label}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video mb-6 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">Video unavailable</p>
            </div>
          )}

          {kept ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <p className="text-2xl mb-2">✨</p>
              <p className="text-green-800 font-bold text-lg mb-1">Card Kept!</p>
              <p className="text-gray-600 text-sm mb-2">
                Added to your{' '}
                <span className="font-semibold">{card.label}</span> collection
              </p>
              {streak && (
                <p className="text-orange-500 font-medium text-sm">
                  🔥 {streak} day streak! Keep it up!
                </p>
              )}
              <button
                onClick={onClose}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Explore more cards →
              </button>
            </div>
          ) : (
            <>
              {alreadyKeptToday && !card.isKept && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-center">
                  <p className="text-blue-800 text-sm">
                    You have already kept a card today. Come back tomorrow to keep another!
                  </p>
                </div>
              )}

              {!alreadyKeptToday && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How does this moment make you feel?
                    </label>
                    <textarea
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      placeholder="Write your reflection here..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                    {!canKeep && journalText.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {charsLeft} more characters needed
                      </p>
                    )}
                  </div>

                  {canKeep && (
                    <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="isPublic" className="text-sm text-gray-700">
                        Share my reflection publicly
                        <span className="block text-xs text-gray-400">
                          Others can read your journal entry for this moment
                        </span>
                      </label>
                    </div>
                  )}

                  <button
                    onClick={handleKeep}
                    disabled={!canKeep || keeping}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${
                      canKeep
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {keeping ? 'Keeping...' : canKeep ? 'Keep This Card ✨' : 'Write to keep this card'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AweCard({ card, onClick }) {
  return (
    <div
      onClick={() => !card.isEmpty && onClick(card)}
      className={`relative aspect-[3/4] rounded-2xl shadow-lg transition-all duration-200 ${
        card.isEmpty
          ? 'cursor-default opacity-60'
          : card.isKept
          ? 'cursor-pointer opacity-75'
          : 'cursor-pointer hover:scale-105 hover:shadow-xl'
      }`}
    >
      {card.isEmpty ? (
        <div className="w-full h-full bg-gray-100 rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300">
          <p className="text-gray-400 font-medium text-center text-sm mb-2">
            {card.label}
          </p>
          <p className="text-gray-400 text-xs text-center mb-3">
            No moments yet
          </p>
          
            href="/#submit"
            className="text-xs text-blue-500 hover:text-blue-600 underline"
            onClick={(e) => e.stopPropagation()}
          >
            Submit one →
          </a>
        </div>
      ) : card.isKept ? (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-2xl flex flex-col items-center justify-center p-4`}>
          <p className="text-white text-2xl mb-2">✨</p>
          <p className="text-white font-bold text-center text-sm">
            {card.label}
          </p>
          <p className="text-white text-xs mt-2 opacity-75">Kept today</p>
        </div>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-2xl flex flex-col items-center justify-center p-4`}>
          <p className="text-white font-bold text-center text-sm drop-shadow">
            {card.label}
          </p>
          <p className="text-white text-xs mt-2 opacity-75">Tap to reveal</p>
        </div>
      )}
    </div>
  )
}

export default function CardsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)
  const [keptToday, setKeptToday] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadCards()
    }
  }, [status])

  const loadCards = async () => {
    try {
      const response = await fetch('/api/cards/today')
      const data = await response.json()

      if (data.cards) {
        setCards(data.cards)
        setKeptToday(!!data.keptCard)
      }
    } catch (error) {
      console.error('Error loading cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (card) => {
    setSelectedCard(card)
  }

  const handleKeep = () => {
    setKeptToday(true)
    loadCards()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading your cards...</p>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
          <h1 className="text-2xl font-bold">Awed</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/collection')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              My Collection
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Today's Awe Moments
          </h2>
          <p className="text-gray-600">
            {keptToday
              ? "You've kept a card today. Come back tomorrow for more! ✨"
              : "Choose a card to reveal your awe moment"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <AweCard
              key={card.category}
              card={card}
              onClick={handleCardClick}
            />
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No cards available today.</p>
          </div>
        )}
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onKeep={handleKeep}
          alreadyKeptToday={keptToday && !selectedCard.isKept}
        />
      )}
    </div>
  )
}