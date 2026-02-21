'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'

const CATEGORIES = [
  { value: 'moral-beauty', label: 'Moral Beauty', description: 'Acts of courage, kindness, extraordinary strength', color: 'from-rose-400 to-pink-600' },
  { value: 'collective-effervescence', label: 'Collective Effervescence', description: 'Shared energy in group activities', color: 'from-orange-400 to-red-600' },
  { value: 'nature', label: 'Nature', description: 'The vastness of the natural world', color: 'from-green-400 to-emerald-600' },
  { value: 'music', label: 'Music', description: 'Melodies that stir deep emotions', color: 'from-purple-400 to-violet-600' },
  { value: 'visual-design', label: 'Visual Design', description: 'Human creativity in art and architecture', color: 'from-blue-400 to-cyan-600' },
  { value: 'spirituality', label: 'Spirituality & Religion', description: 'Mystical connection and oneness', color: 'from-amber-400 to-yellow-600' },
  { value: 'life-death', label: 'Life & Death', description: 'Witnessing birth or contemplating mortality', color: 'from-slate-400 to-gray-600' },
  { value: 'epiphany', label: 'Epiphany', description: 'Sudden insights that shift understanding', color: 'from-indigo-400 to-blue-600' },
]

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

function isInstagramUrl(url) {
  return url && url.includes('instagram.com')
}

function VideoPreview({ url }) {
  const videoId = getYouTubeId(url)
  const isInstagram = isInstagramUrl(url)

  if (!url) return null

  if (isInstagram) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex flex-col items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white mb-2">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
        </svg>
        <p className="text-white font-bold text-sm">Instagram Reel detected</p>
      </div>
    )
  }

  if (videoId) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Video preview"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Paste a YouTube or Instagram URL to preview</p>
    </div>
  )
}

export default function SubmitPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videoLink, setVideoLink] = useState('')
  const [category, setCategory] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [journal, setJournal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // Debounce preview URL
  useEffect(() => {
    const timer = setTimeout(() => setPreviewUrl(videoLink), 600)
    return () => clearTimeout(timer)
  }, [videoLink])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoLink, category, hashtags, journal })
      })
      const result = await response.json()

      if (result.success) {
        setSubmitted(true)
      } else {
        const errorMsg = result.details
          ? `${result.error}: ${result.details}`
          : result.error || 'Something went wrong. Please try again.'
        setError(errorMsg)
      }
    } catch (err) {
      setError('Error submitting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-2xl">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gray-600">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold">Submit a Moment</h1>
          <div className="w-16" />
        </div>
      </nav>

      <div className="container mx-auto px-3 py-3 max-w-2xl">

        {submitted ? (
          /* Success state */
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-4xl mb-3">🙏</p>
            <h2 className="text-xl font-bold mb-2">Thank you!</h2>
            <p className="text-gray-600 text-sm mb-2">
              Your awe moment has been submitted for review.
            </p>
            <p className="text-gray-500 text-xs mb-6">
              Once approved, it will be added to your moments and you'll earn <span className="font-semibold text-purple-600">+1 point</span>. ⭐
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setSubmitted(false); setVideoLink(''); setCategory(''); setHashtags(''); setJournal('') }}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 text-sm"
              >
                Submit another moment
              </button>
              <button
                onClick={() => router.push('/cards')}
                className="w-full py-3 px-6 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 text-sm"
              >
                Back to Cards
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Compact incentive banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3 flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <p className="text-purple-700 text-xs">
                <span className="font-semibold">Earn +1 point</span> for each approved moment
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Combined card: Link + Preview */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paste Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={videoLink}
                  onChange={e => setVideoLink(e.target.value)}
                  placeholder="YouTube or Instagram link"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-3"
                />
                <VideoPreview url={previewUrl} />
              </div>

              {/* Journal textarea */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Reflection <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <textarea
                  value={journal}
                  onChange={e => setJournal(e.target.value)}
                  placeholder="What made this moment special? How did it make you feel?"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Share your thoughts about this awe moment
                </p>
              </div>

              {/* Colorful category buttons */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-left transition-all ${
                        category === cat.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${cat.color} flex-shrink-0`} />
                      <span className="text-xs font-medium truncate">{cat.label}</span>
                      {category === cat.value && (
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-500 ml-auto flex-shrink-0">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hashtags <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  placeholder="#inspiring #beautiful #nature"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-xs">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !videoLink || !category}
                className={`w-full py-3 px-6 rounded-xl font-medium text-sm transition-all ${
                  submitting || !videoLink || !category
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit ✨'}
              </button>

            </form>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}