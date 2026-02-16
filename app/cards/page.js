'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import AchievementToast from '../components/AchievementToast'
import { getDailyQuestion } from '../lib/journalQuestions'
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_QUOTES, MILESTONES } from '../lib/constants'
import { trackEvent, EVENTS } from '../lib/analytics'

const categoryColors = CATEGORY_COLORS
const categoryLabels = CATEGORY_LABELS
const categoryQuotes = CATEGORY_QUOTES

// Smart rotation: cycle through categories to ensure variety
function getSmartRotatedCards(cards) {
  if (!cards || cards.length === 0) return cards
  
  // Get today's date as a seed for consistent daily rotation
  const today = new Date()
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000)
  
  // Get all unique categories from available cards
  const categories = [...new Set(cards.map(c => c.category))]
  
  // Rotate which category is featured based on day of year
  const featuredCategoryIndex = dayOfYear % categories.length
  const featuredCategory = categories[featuredCategoryIndex]
  
  // Find the first card matching featured category
  const featuredCard = cards.find(c => c.category === featuredCategory)
  
  // If we found a featured card, move it to the front
  if (featuredCard) {
    const otherCards = cards.filter(c => c.category !== featuredCategory)
    return [featuredCard, ...otherCards]
  }
  
  return cards
}

function getYouTubeId(url) {
  if (!url) return null

  try {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,  // Standard & short URLs
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,                     // Embed URLs
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,                    // Shorts
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,                         // /v/ format
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/                 // Mobile URLs
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting YouTube ID:', error)
    return null
  }
}

function ReactionBar({ submissionId, onReact }) {
  const [reaction, setReaction] = useState(null)
  const [awedCount, setAwedCount] = useState(0)
  const [nawedCount, setNawedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!submissionId) return

    const abortController = new AbortController()

    fetch(`/api/moment-reactions?submissionId=${submissionId}`, {
      signal: abortController.signal
    })
      .then(r => r.json())
      .then(data => {
        setAwedCount(data.awedCount || 0)
        setNawedCount(data.nawedCount || 0)
        setReaction(data.userReaction || null)
        setLoading(false)
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setLoading(false)
        }
      })

    return () => abortController.abort()
  }, [submissionId])

  const handleReaction = async (type) => {
    try {
      const response = await fetch('/api/moment-reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, reactionType: type })
      })
      const data = await response.json()
      if (data.success) {
        if (data.action === 'removed') {
          setReaction(null)
          if (type === 'awed') setAwedCount(p => Math.max(p - 1, 0))
          else setNawedCount(p => Math.max(p - 1, 0))
        } else if (data.action === 'added') {
          setReaction(type)
          if (type === 'awed') setAwedCount(p => p + 1)
          else setNawedCount(p => p + 1)

          // Track reaction
          trackEvent(type === 'awed' ? EVENTS.REACTION_AWED : EVENTS.REACTION_NAWED, {
            submissionId,
            action: 'added'
          })
        } else if (data.action === 'updated') {
          setReaction(type)
          if (type === 'awed') { setAwedCount(p => p + 1); setNawedCount(p => Math.max(p - 1, 0)) }
          else { setNawedCount(p => p + 1); setAwedCount(p => Math.max(p - 1, 0)) }

          // Track reaction change
          trackEvent(type === 'awed' ? EVENTS.REACTION_AWED : EVENTS.REACTION_NAWED, {
            submissionId,
            action: 'updated'
          })
        }
      }
      if (onReact) onReact(type)
    } catch (error) { console.error('Reaction error:', error) }
  }

  if (loading) return null

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => handleReaction('awed')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all active:scale-95 ${
          reaction === 'awed' 
            ? 'border-yellow-400 bg-yellow-400/30' 
            : 'border-white/30 bg-white/10 hover:bg-white/20'
        }`}
      >
        <img src="/awed-emoji.png" alt="awed" width={24} height={24} />
        <span className="font-medium text-sm text-white">Awed</span>
        {awedCount > 0 && <span className="text-sm text-white/80">{awedCount}</span>}
      </button>
      <button
        onClick={() => handleReaction('nawed')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all active:scale-95 ${
          reaction === 'nawed' 
            ? 'border-blue-400 bg-blue-400/30' 
            : 'border-white/30 bg-white/10 hover:bg-white/20'
        }`}
      >
        <img src="/nawed-emoji.png" alt="nawed" width={24} height={24} />
        <span className="font-medium text-sm text-white">Nawed</span>
        {nawedCount > 0 && <span className="text-sm text-white/80">{nawedCount}</span>}
      </button>
    </div>
  )
}

function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      emoji: '🎴',
      title: 'Choose a Card',
      description: 'Each day, 8 new awe moments await. Tap any card to reveal your moment of wonder.'
    },
    {
      emoji: '✨',
      title: 'Watch & Feel',
      description: 'Let the moment wash over you. Notice how it makes you feel. There\'s no rush.'
    },
    {
      emoji: '📝',
      title: 'Reflect & Keep',
      description: 'Write just 10 characters about how it made you feel. That\'s it. Your moment is saved forever.'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-8">
          <p className="text-6xl mb-4">{steps[step].emoji}</p>
          <h2 className="text-2xl font-bold mb-2">{steps[step].title}</h2>
          <p className="text-gray-600 leading-relaxed">{steps[step].description}</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200'}`} />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 px-6 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            onClick={() => step < steps.length - 1 ? setStep(step + 1) : onClose()}
            className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
          >
            {step < steps.length - 1 ? 'Next' : 'Start Collecting ✨'}
          </button>
        </div>

        {step === 0 && (
          <button onClick={onClose} className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600">
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  )
}

function FullscreenVideoModal({ card, onClose, onKeep, alreadyKeptToday, isSubmissionCard }) {
  const [journalText, setJournalText] = useState(isSubmissionCard ? 'I submitted this awe moment ✨' : '')
  const [keeping, setKeeping] = useState(false)
  const [kept, setKept] = useState(card.isKept || isSubmissionCard)
  const [streak, setStreak] = useState(null)
  const [showJournal, setShowJournal] = useState(false)
  const [question, setQuestion] = useState('')

  const videoId = getYouTubeId(card.video?.videoLink || card.video_link)
  const canKeep = journalText.trim().length >= 10

  // Get question for this card
  useEffect(() => {
    if (card.category) {
      setQuestion(getDailyQuestion(card.category))
    }
  }, [card.category])

  // Handle back button
  useEffect(() => {
    // Push a history state when modal opens
    window.history.pushState({ modal: true }, '')

    const handlePopState = (e) => {
      onClose()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose])

  const handleKeep = async () => {
    if (!canKeep || keeping) return
    setKeeping(true)
    try {
      const response = await fetch('/api/cards/keep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: card.video?.id || card.submission_id,
          journalText: journalText.trim(),
          isPublic: false,
          isSubmission: false,
          question
        })
      })
      const data = await response.json()
      if (data.success) {
        setKept(true)
        setStreak(data.streak)
        onKeep()

        // Track card kept
        trackEvent(EVENTS.CARD_KEPT, {
          category: card.category,
          streak: data.streak,
          journalLength: journalText.trim().length,
          hasQuestion: !!question
        })
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video container - fullscreen */}
      <div className="flex-1 relative">
        {videoId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={card.label}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <p className="text-white">Video unavailable</p>
          </div>
        )}

        {/* Overlay controls - top */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-lg drop-shadow">{card.label || card.category}</h3>
              {isSubmissionCard && (
                <p className="text-white/90 text-sm">⭐ Your submission</p>
              )}
              {kept && streak && (
                <p className="text-orange-400 text-sm font-medium">🔥 {streak} day streak!</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-all"
            >
              ×
            </button>
          </div>
        </div>

        {/* Reactions + Write button - floating center-bottom */}
        {!isSubmissionCard && !kept && (
          <div className="absolute bottom-24 left-0 right-0 px-4">
            <div className="flex flex-col items-center gap-3">
              {(card.video?.id || card.submission_id) && (
                <ReactionBar 
                  submissionId={card.video?.id || card.submission_id}
                  onReact={() => setShowJournal(true)}
                />
              )}
              <button
                onClick={() => setShowJournal(true)}
                className="px-6 py-3 rounded-full bg-white/90 backdrop-blur-md text-gray-900 font-medium text-sm hover:bg-white transition-all active:scale-95 shadow-lg"
              >
                ✍️ Write & Keep
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet - journal */}
      <div
        className={`bg-white rounded-t-3xl transition-all duration-300 ${
          showJournal || kept || isSubmissionCard ? 'max-h-[60vh]' : 'max-h-0'
        } overflow-hidden`}
      >
        <div className="p-6">
          {/* Drag handle */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {isSubmissionCard ? (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
              <p className="text-2xl mb-2">⭐</p>
              <p className="text-purple-800 font-bold text-lg mb-1">Your Submission!</p>
              <p className="text-gray-600 text-sm">This moment is already in your collection.</p>
            </div>
          ) : kept ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <p className="text-2xl mb-2">✨</p>
              <p className="text-green-800 font-bold text-lg mb-1">Card Kept!</p>
              {streak && <p className="text-orange-500 font-medium text-sm">🔥 {streak} day streak!</p>}
              <button onClick={onClose} className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                Explore more cards →
              </button>
            </div>
          ) : (
            <>
              <h4 className="font-bold text-lg mb-1">{question}</h4>
              <p className="text-gray-500 text-sm mb-3">Reflect on how this moment made you feel</p>
              <textarea
                value={journalText}
                onChange={e => setJournalText(e.target.value)}
                placeholder="Write your thoughts here..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base mb-3"
                autoFocus
              />
              {!canKeep && journalText.length > 0 && (
                <p className="text-xs text-gray-400 mb-3">{10 - journalText.trim().length} more characters needed</p>
              )}
              <button
                onClick={handleKeep}
                disabled={!canKeep || keeping || alreadyKeptToday}
                className={`w-full py-4 px-6 rounded-xl font-medium transition-all text-base active:scale-95 ${
                  canKeep && !alreadyKeptToday ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {keeping ? 'Keeping...' : alreadyKeptToday ? "You've kept a card today" : canKeep ? 'Keep This Card ✨' : 'Write to keep this card'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FeaturedCard({ card, onClick }) {
  const router = useRouter()
  const quote = categoryQuotes[card.category] || ''
  
  return (
    <div
      onClick={() => !card.isEmpty && onClick(card)}
      className={`relative aspect-[16/9] md:aspect-[21/9] rounded-3xl shadow-xl transition-all duration-200 ${
        card.isEmpty ? 'cursor-default' : card.isKept ? 'cursor-pointer opacity-75' : 'cursor-pointer active:scale-[0.98] hover:scale-[1.02] hover:shadow-2xl'
      }`}
    >
      {card.isEmpty ? (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-3xl flex flex-col items-center justify-center p-8 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          <div className="relative z-10 text-center">
            <p className="text-white text-5xl md:text-6xl mb-4">🌱</p>
            <p className="text-white font-bold text-xl md:text-2xl mb-2">{card.label}</p>
            <p className="text-white text-sm md:text-base opacity-90 mb-6 max-w-md">Help us grow this category by sharing an awe moment</p>
            <button
              onClick={(e) => { e.stopPropagation(); router.push('/submit') }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm md:text-base font-medium px-6 py-3 rounded-xl backdrop-blur-sm border border-white border-opacity-30 transition-all"
            >
              Submit a moment →
            </button>
          </div>
        </div>
      ) : card.isKept ? (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-3xl flex flex-col items-center justify-center p-8`}>
          <p className="text-white text-4xl md:text-5xl mb-3">✨</p>
          <p className="text-white font-bold text-center text-xl md:text-2xl">{card.label}</p>
          <p className="text-white text-sm md:text-base mt-3 opacity-75">Kept today</p>
        </div>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-3xl flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden`}>
          <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium border border-white/30">
            Today's Featured
          </div>
          <div className="text-center max-w-3xl">
            <p className="text-white font-bold text-2xl md:text-3xl drop-shadow-lg mb-4">{card.label}</p>
            {quote && (
              <p className="text-white text-sm md:text-base opacity-90 italic leading-relaxed mb-4 drop-shadow">
                {quote}
              </p>
            )}
            <p className="text-white text-sm md:text-base opacity-80 font-medium">Tap to reveal your awe moment</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SmallCard({ card, onClick }) {
  const router = useRouter()
  
  return (
    <div
      onClick={() => !card.isEmpty && onClick(card)}
      className={`relative aspect-[3/4] rounded-xl shadow-md transition-all duration-200 ${
        card.isEmpty ? 'cursor-default' : card.isKept ? 'cursor-pointer opacity-75' : 'cursor-pointer active:scale-95 hover:scale-105 hover:shadow-lg'
      }`}
    >
      {card.isEmpty ? (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          <div className="relative z-10 text-center">
            <p className="text-white text-2xl mb-2">🌱</p>
            <p className="text-white font-bold text-xs mb-1">{card.label}</p>
            <button
              onClick={(e) => { e.stopPropagation(); router.push('/submit') }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white border-opacity-30 transition-all mt-2"
            >
              Submit →
            </button>
          </div>
        </div>
      ) : card.isKept ? (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-xl flex flex-col items-center justify-center p-3`}>
          <p className="text-white text-xl mb-1">✨</p>
          <p className="text-white font-bold text-center text-xs">{card.label}</p>
          <p className="text-white text-xs mt-1 opacity-75">Kept</p>
        </div>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-xl flex flex-col items-center justify-center p-3`}>
          <p className="text-white font-bold text-center text-xs drop-shadow">{card.label}</p>
          <p className="text-white text-xs mt-1 opacity-75">Tap</p>
        </div>
      )}
    </div>
  )
}

function SubmissionCard({ card, onClick }) {
  const categoryColors = {
    'moral-beauty': 'from-rose-400 to-pink-600',
    'collective-effervescence': 'from-orange-400 to-red-600',
    'nature': 'from-green-400 to-emerald-600',
    'music': 'from-purple-400 to-violet-600',
    'visual-design': 'from-blue-400 to-cyan-600',
    'spirituality': 'from-amber-400 to-yellow-600',
    'life-death': 'from-slate-400 to-gray-600',
    'epiphany': 'from-indigo-400 to-blue-600'
  }
  const categoryLabels = {
    'moral-beauty': 'Moral Beauty',
    'collective-effervescence': 'Collective Effervescence',
    'nature': 'Nature',
    'music': 'Music',
    'visual-design': 'Visual Design',
    'spirituality': 'Spirituality & Religion',
    'life-death': 'Life & Death',
    'epiphany': 'Epiphany'
  }
  const color = categoryColors[card.category] || 'from-gray-400 to-gray-600'
  const label = categoryLabels[card.category] || card.category

  return (
    <div
      onClick={() => onClick(card)}
      className="relative aspect-[3/4] rounded-xl shadow-md cursor-pointer active:scale-95 hover:scale-105 hover:shadow-lg transition-all duration-200"
    >
      <div className={`w-full h-full bg-gradient-to-br ${color} rounded-xl flex flex-col items-center justify-center p-3`}>
        <p className="text-white text-lg mb-1">⭐</p>
        <p className="text-white font-bold text-center text-xs drop-shadow leading-tight">{label}</p>
        <p className="text-white text-xs mt-1 opacity-75">Yours</p>
      </div>
    </div>
  )
}

export default function CardsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cards, setCards] = useState([])
  const [submissionSlots, setSubmissionSlots] = useState([])
  const [submissionPoints, setSubmissionPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)
  const [isSubmissionCard, setIsSubmissionCard] = useState(false)
  const [keptToday, setKeptToday] = useState(0)
  const [allowedKeeps, setAllowedKeeps] = useState(1)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [achievementCount, setAchievementCount] = useState(null)
  const [totalCards, setTotalCards] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadCards()
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
      }

      // Track page view
      trackEvent(EVENTS.PAGE_VIEWED, { page: 'cards' })
    }
  }, [status])

  const loadCards = async () => {
    try {
      const response = await fetch('/api/cards/today')
      const data = await response.json()
      if (data.cards) {
        // Apply smart rotation to feature different category each day
        const rotatedCards = getSmartRotatedCards(data.cards)
        setCards(rotatedCards)
        setKeptToday(data.keptToday || 0)
        setAllowedKeeps(data.allowedKeeps || 1)
        setSubmissionSlots(data.submissionSlots || [])
        setSubmissionPoints(data.submissionPoints || 0)
      }
      
      // Get total card count for achievement tracking
      const profileResponse = await fetch('/api/profile')
      const profileData = await profileResponse.json()
      if (profileData.totalCards !== undefined) {
        setTotalCards(profileData.totalCards)
      }
    } catch (error) {
      console.error('Error loading cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeep = async () => {
    setKeptToday(prev => prev + 1)

    // Reload cards and get new total
    await loadCards()

    // Get fresh total from profile API to check milestone
    try {
      const profileResponse = await fetch('/api/profile')
      const profileData = await profileResponse.json()
      if (profileData.totalCards !== undefined) {
        const newTotal = profileData.totalCards
        setTotalCards(newTotal)

        // Check if we hit a milestone
        if (MILESTONES.includes(newTotal)) {
          setAchievementCount(newTotal)
          trackEvent(EVENTS.MILESTONE_ACHIEVED, {
            milestone: newTotal,
            totalCards: newTotal
          })
        }
      }
    } catch (error) {
      console.error('Error checking achievement:', error)
    }
  }

  const handleCardClick = (card, isSubmission = false) => {
    setSelectedCard(card)
    setIsSubmissionCard(isSubmission)

    // Track card view
    trackEvent(EVENTS.CARD_VIEWED, {
      category: card.category,
      isSubmission
    })
  }

  const handleCloseOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem('hasSeenOnboarding', 'true')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading your cards...</p>
      </div>
    )
  }

  if (!session) return null

  // Featured card (first one) and remaining 7 cards
  const featuredCard = cards[0]
  const remainingCards = cards.slice(1)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
          <button onClick={() => router.push('/cards')} className="text-2xl font-bold hover:text-gray-700 transition-colors">Awed</button>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => router.push('/collection')} className="text-sm text-gray-600 hover:text-gray-900">Collection</button>
            <button onClick={() => router.push('/profile')} className="text-sm text-gray-600 hover:text-gray-900">Profile</button>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-gray-600 hover:text-gray-900">Sign Out</button>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="md:hidden text-sm text-gray-400">Sign Out</button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Today's Awe Moments</h2>
          <p className="text-gray-600 text-sm md:text-base mb-2">
            {keptToday >= allowedKeeps 
              ? `You've kept ${keptToday} card${keptToday > 1 ? 's' : ''} today. Come back tomorrow! ✨` 
              : "Choose a card to reveal your awe moment"
            }
          </p>
          {allowedKeeps > 1 && keptToday < allowedKeeps && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
              <span className="text-purple-700 text-sm font-medium">
                {keptToday} of {allowedKeeps} cards kept today
              </span>
              <span className="text-purple-500 text-xs">⭐ {submissionPoints} bonus slots</span>
            </div>
          )}
        </div>

        {/* Featured card - large */}
        {featuredCard && (
          <div className="mb-6">
            <FeaturedCard card={featuredCard} onClick={c => handleCardClick(c, false)} />
          </div>
        )}

        {/* Remaining 7 cards - grid */}
        {remainingCards.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
            {remainingCards.map(card => (
              <SmallCard key={card.category} card={card} onClick={c => handleCardClick(c, false)} />
            ))}
          </div>
        )}

        {submissionSlots.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-bold">Your Submissions</h3>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                ⭐ {submissionPoints} point{submissionPoints !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              These moments are permanently in your collection — one per approved submission.
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {submissionSlots.map(card => (
                <SubmissionCard key={card.card_id} card={card} onClick={c => handleCardClick(c, true)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />

      {selectedCard && (
        <FullscreenVideoModal
          card={selectedCard}
          onClose={() => { setSelectedCard(null); setIsSubmissionCard(false) }}
          onKeep={handleKeep}
          alreadyKeptToday={!isSubmissionCard && keptToday >= allowedKeeps}
          isSubmissionCard={isSubmissionCard}
        />
      )}

      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}

      {achievementCount && (
        <AchievementToast 
          newCardCount={achievementCount} 
          onDismiss={() => setAchievementCount(null)} 
        />
      )}
    </div>
  )
}