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
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">
            Visit Awed
          </a>
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
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">
            Visit Awed
          </a>
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-6">
          <a href="/" className="text-2xl font-bold text-gray-800">Awed</a>
          <p className="text-gray-500 text-sm mt-1">A daily moment of awe</p>
        </div>

        {/* Card */}
        <div className={`bg-gradient-to-br ${color} rounded-3xl p-8 mb-6 shadow-xl`}>
          <div className="text-center mb-6">
            <p className="text-white text-sm font-medium uppercase tracking-widest mb-2 opacity-80">
              {label}
            </p>
            <p className="text-white text-4xl">✨</p>
          </div>

          <div className="bg-white bg-opacity-20 rounded-2xl p-5">
            <p className="text-white text-lg leading-relaxed font-medium">
              "{card.journal_text}"
            </p>
          </div>

          <div className="mt-5 flex justify-between items-center">
            <p className="text-white text-sm opacity-70">— {card.user_name || 'Anonymous'}</p>
            <p className="text-white text-sm opacity-70">{date}</p>
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