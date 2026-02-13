'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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

const categoryExamples = [
  { category: "Moral Beauty", videoId: "kOr3qLQXPI4", description: "Acts of courage, kindness, and extraordinary strength" },
  { category: "Collective Effervescence", videoId: "G5goISKPSH8", description: "Shared energy in group activities" },
  { category: "Nature", videoId: "9udylvYXRJI", description: "The vastness of the natural world" },
  { category: "Music", videoId: "5m5n_-yVLog", description: "Melodies that stir deep emotions" },
  { category: "Visual Design", videoId: "A92_B_mnO-I", description: "Human creativity in art and architecture" },
  { category: "Spirituality & Religion", videoId: "l1wHyMR_SCA", description: "Mystical connection and oneness" },
  { category: "Life & Death", videoId: "iVdXYo_VVHk", description: "Witnessing birth or contemplating mortality" },
  { category: "Epiphany", videoId: "cDtwqL6xsXE", description: "Sudden insights that shift understanding" }
]

const getYouTubeId = (url) => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

const isInstagramUrl = (url) => url && url.includes('instagram.com')

function InstagramCard({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex flex-col items-center justify-center hover:opacity-90 transition-opacity"
      style={{ display: 'flex' }}
    >
      <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white mb-2">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
      <p className="text-white font-bold">Watch on Instagram</p>
      <p className="text-white text-sm mt-1 opacity-75">Tap to open Reel ↗</p>
    </a>
  )
}

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
        <div className="flex items-center gap-3">
          
            href="https://blog.awed.life"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm font-medium transition-colors hidden md:block ${
              scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white hover:text-white opacity-80 hover:opacity-100'
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

function CategoryExamples() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {categoryExamples.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${item.videoId}`}
              title={item.category}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1">{item.category}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRecentSubmissions() }, [])

  const fetchRecentSubmissions = async () => {
    try {
      const response = await fetch('/api/recent-submissions')
      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Error fetching recent submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="text-center text-gray-500">Loading...</p>
  if (submissions.length === 0) return <p className="text-center text-gray-500">No submissions yet. Be the first!</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {submissions.slice(0, 6).map((submission) => {
        const videoId = getYouTubeId(submission.videoLink)
        const isInstagram = isInstagramUrl(submission.videoLink)
        return (
          <div key={submission.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm">
            <div className="aspect-video">
              {isInstagram ? (
                <InstagramCard url={submission.videoLink} />
              ) : videoId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Awe moment"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">Video unavailable</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {submission.category}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CardPreview({ session }) {
  const router = useRouter()
  const [selectedCard, setSelectedCard] = useState(null)
  const [journalText, setJournalText] = useState('')
  const [showKeepButton, setShowKeepButton] = useState(false)
  const [kept, setKept] = useState(false)

  const handleCardClick = (index) => {
    setSelectedCard(index)
    setJournalText('')
    setShowKeepButton(false)
    setKept(false)
  }

  const handleCloseModal = () => setSelectedCard(null)

  const handleJournalChange = (e) => {
    const text = e.target.value
    setJournalText(text)
    setShowKeepButton(text.trim().length >= 10)
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categoryExamples.map((example, index) => (
          <div
            key={index}
            className="relative aspect-[3/4] cursor-pointer transform transition-transform hover:scale-105"
            onClick={() => handleCardClick(index)}
          >
            <div className={`w-full h-full bg-gradient-to-br ${categoryColors[example.category]} rounded-lg shadow-lg flex items-center justify-center p-4`}>
              <p className="text-white font-bold text-center text-sm drop-shadow-lg">{example.category}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedCard !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">{categoryExamples[selectedCard].category}</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6">
              <div className="aspect-video mb-6">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${categoryExamples[selectedCard].videoId}?autoplay=1`}
                  title={categoryExamples[selectedCard].category}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
              {!kept ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Write what you think of this moment
                    </label>
                    <textarea
                      value={journalText}
                      onChange={handleJournalChange}
                      placeholder="How does this moment make you feel? What does it remind you of?"
                      rows="5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {journalText.trim().length < 10
                        ? `Write at least ${10 - journalText.trim().length} more characters to keep this card`
                        : "Ready to keep this card!"}
                    </p>
                  </div>
                  {showKeepButton && (
                    <button
                      onClick={() => setKept(true)}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Keep This Card
                    </button>
                  )}
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <p className="text-2xl mb-2">✨</p>
                  <p className="text-green-800 font-semibold mb-2">You felt it!</p>
                  <p className="text-gray-600 text-sm mb-6">
                    Sign up to collect real awe moments every day and build your personal wonder journal.
                  </p>
                  <button
                    onClick={() => router.push('/signup')}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 mb-2"
                  >
                    Start Collecting →
                  </button>
                  <button onClick={handleCloseModal} className="text-gray-400 text-sm">
                    Maybe later
                  </button>
                </div>
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

  useEffect(() => { fetchCount() }, [])

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/admin/submissions')
      const data = await response.json()
      setSubmissionCount(data.submissions.length)
    } catch (error) {
      console.error('Error fetching count:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      videoLink: formData.get('videoLink'),
      category: formData.get('category'),
      hashtags: formData.get('hashtags'),
      email: formData.get('email')
    }
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      if (result.success) {
        alert('Thank you! Your awe moment has been submitted.')
        e.target.reset()
        fetchCount()
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch (error) {
      alert('Error submitting. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky nav */}
      <Navbar session={session} />

      {/* Manifesto Video with hero overlay */}
      <section className="relative w-full h-screen bg-black">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-70"
          src="https://pub-a9edba097fc04f4ea77b1baac778b4f9.r2.dev/menifesto1.mp4"
        />
        {/* Hero overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Find Your Awe
          </h1>
          <p className="text-xl md:text-2xl text-white opacity-90 mb-4 max-w-2xl drop-shadow">
            A daily ritual of wonder. One card. One moment. One reflection.
          </p>
          <p className="text-white opacity-75 mb-10 text-sm md:text-base">
            {submissionCount} awe moments collected
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

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white opacity-60">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </section>

      {/* Book Credit */}
      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Inspired by{' '}
            <a
              href="https://www.amazon.com/Awe-Science-Everyday-Wonder-Transform/dp/1984879685"
              target="_blank"
              rel="noopener noreferrer"
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
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">✨</div>
              <h3 className="font-bold text-lg mb-2">2. Watch & Reflect</h3>
              <p className="text-gray-600 text-sm">Watch the moment, then write how it made you feel. Just 10 characters minimum.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📚</div>
              <h3 className="font-bold text-lg mb-2">3. Collect & Grow</h3>
              <p className="text-gray-600 text-sm">Build your personal wonder journal. Track streaks, earn milestones, share moments.</p>
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

      {/* What is Awe */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">What is Awe?</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Awe moments fall into 8 categories. Here are examples of each:
          </p>
          <CategoryExamples />
        </div>
      </section>

      {/* Recent Awe Moments */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Recent Awe Moments</h2>
          <p className="text-center text-gray-600 mb-12">Shared by our community</p>
          <RecentSubmissions />
        </div>
      </section>

      {/* Interactive preview */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center max-w-5xl">
          <h2 className="text-3xl font-bold mb-4">Preview the Experience</h2>
          <p className="text-gray-600 mb-10">Click any card to try it out</p>
          <CardPreview session={session} />
        </div>
      </section>

      {/* Submit CTA */}
      <section className="py-16 bg-white">
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
            <div>
              {/* Public submission form */}
              <form onSubmit={handleSubmit} className="bg-gray-50 p-8 rounded-2xl shadow-sm space-y-4 text-left mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video Link</label>
                  <input type="url" name="videoLink" placeholder="https://youtube.com/watch?v=..." required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <p className="text-xs text-gray-500 mt-1">YouTube, YouTube Shorts, or Instagram Reels</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select name="category" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select a category...</option>
                    <option value="moral-beauty">Moral Beauty</option>
                    <option value="collective-effervescence">Collective Effervescence</option>
                    <option value="nature">Nature</option>
                    <option value="music">Music</option>
                    <option value="visual-design">Visual Design</option>
                    <option value="spirituality">Spirituality & Religion</option>
                    <option value="life-death">Life & Death</option>
                    <option value="epiphany">Epiphany</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags (optional)</label>
                  <input type="text" name="hashtags" placeholder="#inspiring #beautiful"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
                  <input type="email" name="email" placeholder="you@example.com" required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <p className="text-xs text-gray-500 mt-1">We'll notify you when approved</p>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Submit Awe Moment
                </button>
              </form>
              <p className="text-gray-500 text-sm">
                Or{' '}
                <button onClick={() => router.push('/signup')} className="text-blue-600 font-medium hover:underline">
                  create an account
                </button>
                {' '}to earn submission points and track your contributions
              </p>
            </div>
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
            <div className="flex justify-center gap-6 text-sm text-gray-400 mb-8">
  {session ? (
    <button onClick={() => router.push('/cards')} className="hover:text-white transition-colors">My Cards</button>
  ) : (
    <button onClick={() => router.push('/signup')} className="hover:text-white transition-colors">Sign Up</button>
  )}
  <button onClick={() => router.push('/login')} className="hover:text-white transition-colors">Sign In</button>
  <a href="https://blog.awed.life" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Blog</a>
  <a href="#submit" className="hover:text-white transition-colors">Submit a Moment</a>
</div>
            <a href="#submit" className="hover:text-white transition-colors">Submit a Moment</a>
          </div>
          <p className="text-gray-600 text-xs">
            Inspired by Dacher Keltner's research on awe
          </p>
        </div>
      </footer>

    </div>
  )
}