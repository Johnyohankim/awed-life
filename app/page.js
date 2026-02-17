'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LiveStats from './components/LiveStats'

const categoryColors = {
  "Moral Beauty": "from-rose-400 to-pink-600",
  "Collective Effervescence": "from-orange-400 to-red-600",
  "Nature": "from-green-400 to-emerald-600",
  "Music": "from-purple-400 to-violet-600",
  "Visual Design": "from-blue-400 to-cyan-600",
  "Spirituality & Religion": "from-amber-400 to-yellow-600",
  "Life & Death": "from-slate-400 to-gray-600",
  "Epiphany": "from-indigo-400 to-blue-600"
}

const getYouTubeId = (url) => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

const isInstagramUrl = (url) => url && url.includes('instagram.com')

function Navbar({ session }) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
            <button
              onClick={() => router.push('/cards')}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Open App →
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function RecentSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recent-submissions')
      .then(r => r.json())
      .then(data => setSubmissions(data.submissions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-center text-gray-500">Loading...</p>
  if (submissions.length === 0) return <p className="text-center text-gray-500">No submissions yet. Be the first!</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {submissions.slice(0, 3).map((submission) => {
        const videoId = getYouTubeId(submission.videoLink)
        const isInstagram = isInstagramUrl(submission.videoLink)
        return (
          <div key={submission.id} className="bg-gray-50 rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-video">
              {isInstagram ? (
                <a href={submission.videoLink} target="_blank" rel="noopener noreferrer"
                  className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                  <p className="text-white font-bold">Watch on Instagram ↗</p>
                </a>
              ) : videoId ? (
                <iframe width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Awe moment" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">Video unavailable</p>
                </div>
              )}
            </div>
            <div className="p-3">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {submission.category}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Preview card — single Moral Beauty card with live Claude chat
const PREVIEW_CARD = {
  category: 'moral-beauty',
  label: 'Moral Beauty',
  videoId: '7ckfH6Sj9xk',
  color: 'from-rose-400 to-pink-600',
}

function ChatPreview({ session }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatDone, setChatDone] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  const openPreview = () => {
    setOpen(true)
    setChatMessages([])
    setChatInput('')
    setChatLoading(false)
    setChatDone(false)
    fetchReply([])
  }

  const fetchReply = async (messages) => {
    setChatLoading(true)
    try {
      const res = await fetch('/api/preview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, category: PREVIEW_CARD.category })
      })
      const data = await res.json()
      if (data.reply) setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      console.error(e)
    } finally {
      setChatLoading(false)
    }
  }

  const handleSend = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')

    const assistantCount = newMessages.filter(m => m.role === 'assistant').length
    if (assistantCount < 3) {
      await fetchReply(newMessages)
    } else {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Thank you for sharing. Sign up to keep this card and collect moments like this every day.'
        }])
        setChatDone(true)
      }, 400)
    }
  }

  const userMessages = chatMessages.filter(m => m.role === 'user')
  const canComplete = userMessages.length > 0

  return (
    <>
      {/* Single card */}
      <div className="flex justify-center">
        <div
          onClick={openPreview}
          className={`relative w-48 aspect-[3/4] cursor-pointer transform transition-transform hover:scale-105 rounded-2xl shadow-xl bg-gradient-to-br ${PREVIEW_CARD.color} flex items-center justify-center p-4`}
        >
          <div className="text-center">
            <p className="text-white font-bold text-lg drop-shadow-lg mb-2">{PREVIEW_CARD.label}</p>
            <p className="text-white text-xs opacity-80">Tap to experience</p>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Video */}
          <div className="flex-1 relative">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${PREVIEW_CARD.videoId}?autoplay=1&rel=0`}
              title={PREVIEW_CARD.label}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center">
              <h3 className="text-white font-bold text-lg drop-shadow">{PREVIEW_CARD.label}</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl hover:bg-white/20"
              >
                ×
              </button>
            </div>
          </div>

          {/* Chat sheet */}
          <div className="bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: '55vh' }}>
            <div className="p-5 flex flex-col h-full">
              <div className="flex justify-center mb-3 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {chatDone ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <p className="text-2xl mb-1">✨</p>
                  <p className="text-green-800 font-bold text-lg mb-2">You felt it</p>
                  <p className="text-gray-600 text-sm mb-4">
                    Sign up to collect a new awe moment every day and keep your wonder journal.
                  </p>
                  <button
                    onClick={() => router.push('/signup')}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 mb-2"
                  >
                    Start Collecting →
                  </button>
                  <button onClick={() => setOpen(false)} className="text-gray-400 text-sm">
                    Maybe later
                  </button>
                </div>
              ) : (
                <>
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

                  {!chatDone && (
                    <div className="flex gap-2 flex-shrink-0">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Type your reflection..."
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={chatLoading}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!chatInput.trim() || chatLoading}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95 transition-all"
                      >
                        →
                      </button>
                    </div>
                  )}

                  {canComplete && !chatDone && (
                    <button
                      onClick={() => router.push('/signup')}
                      className="mt-2 w-full py-3 rounded-xl font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 flex-shrink-0"
                    >
                      Sign up to keep this card ✨
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [submissionCount, setSubmissionCount] = useState(0)

  useEffect(() => {
    fetch('/api/admin/submissions')
      .then(r => r.json())
      .then(data => setSubmissionCount(data.submissions?.length || 0))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />

      {/* Hero */}
      <section className="relative w-full h-screen bg-black">
        <video
          autoPlay muted loop playsInline
          className="w-full h-full object-cover opacity-70"
          src="https://pub-a9edba097fc04f4ea77b1baac778b4f9.r2.dev/menifesto1.mp4"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Find Your Awe
          </h1>
          <LiveStats />
          <p className="text-xl md:text-2xl text-white opacity-90 mb-4 max-w-2xl drop-shadow">
            A daily ritual of wonder. One card. One moment. One reflection.
          </p>
          <p className="text-white opacity-75 mb-10 text-sm md:text-base">
            {submissionCount > 0 ? `featuring ${submissionCount} awe moments` : ''}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {session ? (
              <button
                onClick={() => router.push('/cards')}
                className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg"
              >
                Open Your Cards →
              </button>
            ) : (
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
            )}
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white opacity-60">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </section>

      {/* Book credit */}
      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Inspired by{' '}
            <a
              href="https://www.amazon.com/Awe-Science-Everyday-Wonder-Transform/dp/1984879685"
              target="_blank" rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              <em>Awe: The New Science of Everyday Wonder and How It Can Transform Your Life</em>
            </a>
            {' '}by Dacher Keltner
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
            A simple daily ritual to bring more wonder into your life
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🎴</div>
              <h3 className="font-bold text-lg mb-2">1. Choose a Card</h3>
              <p className="text-gray-600 text-sm">Each day, 8 new awe moments across different categories are waiting for you.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">💬</div>
              <h3 className="font-bold text-lg mb-2">2. Watch & Reflect</h3>
              <p className="text-gray-600 text-sm">Watch the moment, then talk it through with a gentle AI guide. Just a few words.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📚</div>
              <h3 className="font-bold text-lg mb-2">3. Collect & Grow</h3>
              <p className="text-gray-600 text-sm">Build your personal wonder journal. Watch your Awera circle expand with every card.</p>
            </div>
          </div>
          <div className="text-center mt-12">
            {session ? (
              <button
                onClick={() => router.push('/cards')}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors"
              >
                Open Your Cards →
              </button>
            ) : (
              <button
                onClick={() => router.push('/signup')}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors"
              >
                Start for Free →
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Interactive preview */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-3">Try It Now</h2>
          <p className="text-gray-600 mb-10">Tap the card, watch the moment, talk it through</p>
          <ChatPreview session={session} />
        </div>
      </section>

      {/* Recent submissions */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Recent Awe Moments</h2>
          <p className="text-center text-gray-600 mb-12">Shared by our community</p>
          <RecentSubmissions />
        </div>
      </section>

      {/* Submit CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Share an Awe Moment</h2>
          <p className="text-gray-600 mb-8">
            Help build the world's largest collection of awe-inspiring moments.
            {session && <span className="text-purple-600 font-medium"> Earn ⭐ submission points when approved!</span>}
          </p>
          {session ? (
            <button
              onClick={() => router.push('/submit')}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              Submit a Moment ✨
            </button>
          ) : (
            <button
              onClick={() => router.push('/signup')}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              Sign Up to Submit →
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-2">Awed</h2>
          <p className="text-gray-400 text-sm mb-6">A daily moment of wonder</p>
          <div className="flex justify-center gap-6 text-sm text-gray-400 mb-8">
            {session ? (
              <button onClick={() => router.push('/cards')} className="hover:text-white transition-colors">My Cards</button>
            ) : (
              <button onClick={() => router.push('/signup')} className="hover:text-white transition-colors">Sign Up</button>
            )}
            <button onClick={() => router.push('/login')} className="hover:text-white transition-colors">Sign In</button>
            <a href="https://blog.awed.life" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Blog</a>
            <button onClick={() => router.push('/terms')} className="hover:text-white transition-colors">Terms</button>
          </div>
          <p className="text-gray-600 text-xs">
            Inspired by Dacher Keltner's research on awe
          </p>
        </div>
      </footer>
    </div>
  )
}
