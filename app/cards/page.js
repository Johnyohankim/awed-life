'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import BottomNav from '../components/BottomNav'
import AchievementToast from '../components/AchievementToast'
import AweraCircle from '../components/AweraCircle'
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

function FullscreenVideoModal({ card, onClose, onKeep, alreadyKeptToday, isSubmissionCard, totalCards, keptCategories }) {
  const categoryAlreadyKept = !isSubmissionCard && (keptCategories || []).includes(card.category)
  const [keeping, setKeeping] = useState(false)
  const [kept, setKept] = useState(card.isKept || isSubmissionCard || categoryAlreadyKept)
  const [showJournal, setShowJournal] = useState(false)

  // Chat state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatDone, setChatDone] = useState(false)
  const chatEndRef = useRef(null)

  const userMessages = chatMessages.filter(m => m.role === 'user')
  const canKeep = userMessages.length > 0 && userMessages.some(m => m.content.trim().length >= 5)

  const videoId = getYouTubeId(card.video?.videoLink || card.video_link)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  // Open chat: fetch Claude's first message
  useEffect(() => {
    if (showJournal && !kept && !isSubmissionCard && chatMessages.length === 0) {
      fetchChatReply([])
    }
  }, [showJournal])

  // Handle back button
  useEffect(() => {
    window.history.pushState({ modal: true }, '')
    const handlePopState = () => onClose()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [onClose])

  const fetchChatReply = async (messages) => {
    setChatLoading(true)
    try {
      const res = await fetch('/api/journal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, category: card.category })
      })
      const data = await res.json()
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch (e) {
      console.error('Chat error:', e)
    } finally {
      setChatLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')

    // Claude replies up to 3 times total (opening + 2 follow-ups)
    const assistantCount = newMessages.filter(m => m.role === 'assistant').length
    if (assistantCount < 3) {
      await fetchChatReply(newMessages)
    } else {
      // User has answered 3 times — close the chat with a nudge
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Thank you for sharing. You can edit your reflection once you keep the card ✨'
        }])
        setChatDone(true)
      }, 400)
    }
  }

  const handleKeep = async () => {
    if (!canKeep || keeping || alreadyKeptToday) return
    setKeeping(true)

    // Opening question saved separately; journal body = full dialogue after that
    const openingQuestion = chatMessages.find(m => m.role === 'assistant')?.content || ''
    const afterOpening = chatMessages.slice(chatMessages.findIndex(m => m.role === 'assistant') + 1)
    const journalText = afterOpening
      .filter(m => m.role !== 'assistant' || !m.content.startsWith('Thank you for sharing.'))
      .map(m => m.role === 'assistant' ? `Guide: ${m.content}` : `You: ${m.content}`)
      .join('\n\n')

    try {
      const localDate = new Date().toLocaleDateString('en-CA')
      const response = await fetch('/api/cards/keep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: card.video?.id || card.submission_id,
          journalText,
          isPublic: false,
          isSubmission: false,
          question: openingQuestion,
          localDate
        })
      })
      const data = await response.json()
      if (data.success) {
        setKept(true)
        onKeep()
        trackEvent(EVENTS.CARD_KEPT, {
          category: card.category,
          journalLength: journalText.length,
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
                💬 Talk it through
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet - chat journal */}
      <div
        className={`bg-white rounded-t-3xl transition-all duration-300 ${
          showJournal || kept || isSubmissionCard ? 'max-h-[65vh]' : 'max-h-0'
        } overflow-hidden flex flex-col`}
      >
        <div className="p-5 flex flex-col" style={{ height: showJournal || kept || isSubmissionCard ? '65vh' : 0 }}>
          {/* Drag handle */}
          <div className="flex justify-center mb-3 flex-shrink-0">
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
              <p className="text-2xl mb-1">✨</p>
              <p className="text-green-800 font-bold text-lg mb-3">Card Kept!</p>
              <div className="flex justify-center">
                <AweraCircle totalCards={(totalCards || 0) + 1} size="sm" />
              </div>
              <button onClick={onClose} className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm">
                Explore more cards →
              </button>
            </div>
          ) : (
            <>
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm">
                      <span className="text-gray-400 text-sm tracking-widest">···</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input row — hidden once chat is done */}
              {!chatDone && (
                <div className="flex gap-2 flex-shrink-0">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type your reflection..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95 transition-all"
                  >
                    →
                  </button>
                </div>
              )}

              {/* Keep button — appears after first user message */}
              {canKeep && (
                <button
                  onClick={handleKeep}
                  disabled={keeping || alreadyKeptToday}
                  className={`mt-2 w-full py-3 rounded-xl font-medium text-sm transition-all active:scale-95 flex-shrink-0 ${
                    alreadyKeptToday ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {keeping ? 'Keeping...' : alreadyKeptToday ? "You've kept a card today" : 'Keep This Card ✨'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FeaturedCard({ card, onClick, isClosed }) {
  const router = useRouter()
  const quote = categoryQuotes[card.category] || ''

  return (
    <div
      onClick={() => !card.isEmpty && !isClosed && onClick(card)}
      className={`relative aspect-[16/9] md:aspect-[21/9] rounded-3xl shadow-xl transition-all duration-200 ${
        card.isEmpty || isClosed ? 'cursor-default opacity-60' : card.isKept ? 'cursor-pointer opacity-75' : 'cursor-pointer active:scale-[0.98] hover:scale-[1.02] hover:shadow-2xl'
      }`}
    >
      {isClosed ? (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-3xl flex flex-col items-center justify-center p-8 relative`}>
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-3xl" />
          <div className="relative z-10 text-center">
            <p className="text-white text-4xl md:text-5xl mb-3">🔒</p>
            <p className="text-white font-bold text-xl md:text-2xl mb-2">{card.label}</p>
            <p className="text-white text-sm md:text-base opacity-90">Already kept a card from this category today</p>
          </div>
        </div>
      ) : card.isEmpty ? (
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

function SmallCard({ card, onClick, isClosed }) {
  const router = useRouter()

  return (
    <div
      onClick={() => !card.isEmpty && !isClosed && onClick(card)}
      className={`relative aspect-[3/4] rounded-xl shadow-md transition-all duration-200 ${
        card.isEmpty || isClosed ? 'cursor-default opacity-60' : card.isKept ? 'cursor-pointer opacity-75' : 'cursor-pointer active:scale-95 hover:scale-105 hover:shadow-lg'
      }`}
    >
      {isClosed ? (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-xl flex flex-col items-center justify-center p-3 relative`}>
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-xl" />
          <div className="relative z-10 text-center">
            <p className="text-white text-3xl mb-2">🔒</p>
            <p className="text-white font-bold text-xs">{card.label}</p>
            <p className="text-white text-[10px] mt-1 opacity-90 leading-tight">Already kept today</p>
          </div>
        </div>
      ) : card.isEmpty ? (
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

function TodaysAwedMoment({ moment, source, onClick }) {
  const videoId = getYouTubeId(moment.video_link)
  const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
  const color = categoryColors[moment.category] || 'from-gray-400 to-gray-600'
  const label = categoryLabels[moment.category] || moment.category

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Today's Most Awed</h3>
        {source === 'awed' && moment.awed_count > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <img src="/awed-emoji.png" alt="awed" width={14} height={14} />
            {moment.awed_count}
          </span>
        )}
      </div>
      <div
        onClick={onClick}
        className="relative rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200"
      >
        {thumbnail ? (
          <img src={thumbnail} alt={label} className="w-full aspect-video object-cover" />
        ) : (
          <div className={`w-full aspect-video bg-gradient-to-br ${color}`} />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/25" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-gray-900 ml-1">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        {/* Category pill */}
        <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${color} shadow`}>
          {label}
        </div>

        {source === 'random' && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-xs text-white/80 bg-black/30 backdrop-blur-sm">
            Featured
          </div>
        )}
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
  const [keptCategories, setKeptCategories] = useState([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [achievementCount, setAchievementCount] = useState(null)
  const [totalCards, setTotalCards] = useState(0)
  const [aweOfDay, setAweOfDay] = useState(null)
  const [aweOfDaySource, setAweOfDaySource] = useState(null)

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
      // Get local date in YYYY-MM-DD format (browser timezone)
      const localDate = new Date().toLocaleDateString('en-CA') // en-CA gives YYYY-MM-DD format
      const [response, aweRes] = await Promise.all([
        fetch(`/api/cards/today?localDate=${localDate}`),
        fetch('/api/awe-of-day')
      ])
      const data = await response.json()
      const aweData = await aweRes.json()
      if (data.cards) {
        // Apply smart rotation to feature different category each day
        const rotatedCards = getSmartRotatedCards(data.cards)
        setCards(rotatedCards)
        setKeptToday(data.keptToday || 0)
        setAllowedKeeps(data.allowedKeeps || 1)
        setKeptCategories(data.keptCategories || [])
        setSubmissionSlots(data.submissionSlots || [])
        setSubmissionPoints(data.submissionPoints || 0)
      }
      if (aweData.moment) {
        setAweOfDay(aweData.moment)
        setAweOfDaySource(aweData.source)
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
            <button onClick={() => router.push('/journey')} className="text-sm text-gray-600 hover:text-gray-900">My Journey</button>
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

        {/* Today's Most Awed Moment */}
        {aweOfDay && !keptCategories.includes(aweOfDay.category) && (
          <TodaysAwedMoment
            moment={aweOfDay}
            source={aweOfDaySource}
            onClick={() => handleCardClick({
              video_link: aweOfDay.video_link,
              submission_id: aweOfDay.id,
              category: aweOfDay.category,
              label: categoryLabels[aweOfDay.category] || aweOfDay.category,
              color: categoryColors[aweOfDay.category] || 'from-gray-400 to-gray-600',
              isKept: keptCategories.includes(aweOfDay.category),
              isEmpty: false
            }, false)}
          />
        )}

        {/* Featured card - large */}
        {featuredCard && (
          <div className="mb-6">
            <FeaturedCard card={featuredCard} onClick={c => handleCardClick(c, false)} isClosed={keptCategories.includes(featuredCard.category)} />
          </div>
        )}

        {/* Remaining 7 cards - grid */}
        {remainingCards.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
            {remainingCards.map(card => (
              <SmallCard key={card.category} card={card} onClick={c => handleCardClick(c, false)} isClosed={keptCategories.includes(card.category)} />
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
          totalCards={totalCards}
          keptCategories={keptCategories}
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