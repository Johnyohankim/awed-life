import { sql } from '@vercel/postgres'
import ShareCard from './ShareCard'

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

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

function isInstagramUrl(url) {
  return url && url.includes('instagram.com')
}

async function getCardData(cardId) {
  try {
    const cardIdInt = parseInt(cardId, 10)
    if (isNaN(cardIdInt)) return { error: 'invalid_id' }

    const result = await sql`
      SELECT 
        uc.id,
        uc.journal_text,
        uc.is_public,
        uc.kept_at,
        s.category,
        s.video_link,
        u.name as user_name
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      JOIN users u ON uc.user_id = u.id
      WHERE uc.id = ${cardIdInt}
    `

    if (result.rows.length === 0) return { error: 'not_found' }
    return { card: result.rows[0] }
  } catch (error) {
    console.error('Share page DB error:', error)
    return { error: 'db_error', message: error.message }
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const { card } = await getCardData(id)
  if (!card) return { title: 'Awed - Awe Moment' }

  const label = categoryLabels[card.category] || card.category
  const journal = card.journal_text.slice(0, 100) + (card.journal_text.length > 100 ? '...' : '')

  return {
    title: `${card.user_name || 'Someone'} felt awe in ${label} | Awed`,
    description: journal,
    openGraph: {
      title: `${card.user_name || 'Someone'} felt awe in ${label}`,
      description: journal,
      url: `https://awed.life/share/${id}`,
      siteName: 'Awed',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${card.user_name || 'Someone'} felt awe in ${label}`,
      description: journal,
    }
  }
}

export default async function SharePage({ params }) {
  const { id } = await params
  const result = await getCardData(id)

  if (result.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold mb-2">Card not found</h1>
          <p className="text-gray-500 text-sm mb-4">This card may have been removed or made private.</p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">Visit Awed</a>
        </div>
      </div>
    )
  }

  const { card } = result

  if (!card.is_public) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-2xl font-bold mb-2">Private card</h1>
          <p className="text-gray-600 mb-6">This reflection is private.</p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">Visit Awed</a>
        </div>
      </div>
    )
  }

  const color = categoryColors[card.category] || 'from-gray-400 to-gray-600'
  const label = categoryLabels[card.category] || card.category
  const date = new Date(card.kept_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
  const shareUrl = `https://awed.life/share/${id}`
  const shareText = `I felt awe in "${label}" on Awed ✨\n\n"${card.journal_text.slice(0, 120)}${card.journal_text.length > 120 ? '...' : ''}"`
  const videoId = getYouTubeId(card.video_link)
  const isInstagram = isInstagramUrl(card.video_link)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-6">
          <a href="/" className="text-2xl font-bold text-gray-800">Awed</a>
          <p className="text-gray-500 text-sm mt-1">A daily moment of awe</p>
        </div>

        {/* Card header */}
        <div className={`bg-gradient-to-br ${color} rounded-t-3xl px-6 pt-6 pb-4`}>
          <div className="text-center mb-4">
            <p className="text-white text-sm font-medium uppercase tracking-widest opacity-80 mb-1">
              {label}
            </p>
            <p className="text-white text-3xl">✨</p>
          </div>
        </div>

        {/* Video */}
        <div className="bg-black">
          {isInstagram ? (
            <a
              href={card.video_link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full aspect-video bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex flex-col items-center justify-center hover:opacity-90 transition-opacity"
              style={{ display: 'flex' }}
            >
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white mb-2">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
              <p className="text-white font-bold">Watch on Instagram</p>
              <p className="text-white text-sm mt-1 opacity-75">Tap to open Reel ↗</p>
            </a>
          ) : videoId ? (
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={label}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
        </div>

        {/* Journal reflection */}
        <div className="bg-white rounded-b-3xl shadow-xl px-6 py-5 mb-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
            Reflection
          </p>
          <p className="text-gray-800 text-base leading-relaxed mb-4">
            "{card.journal_text}"
          </p>
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>— {card.user_name || 'Anonymous'}</span>
            <span>{date}</span>
          </div>
        </div>

        {/* Share buttons */}
        <ShareCard shareUrl={shareUrl} shareText={shareText} />

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-3">Experience your own awe moments</p>
          <a
            href="/signup"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-medium inline-block"
          >
            Join Awed for free →
          </a>
        </div>

      </div>
    </div>
  )
}