'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

export default function BlogPostPage({ params }) {
  const router = useRouter()
  const { slug } = use(params)
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    fetch(`/api/blog?slug=${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setPost(data.post)
      })
      .catch(() => setError('Failed to load post'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Post not found</p>
          <button onClick={() => router.push('/blog')} className="text-blue-600">← Back to Blog</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-3xl">
          <button onClick={() => router.push('/')} className="text-2xl font-bold">Awed</button>
          <button onClick={() => router.push('/signup')} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
            Get Started
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Back link */}
        <button
          onClick={() => router.push('/blog')}
          className="text-gray-400 hover:text-gray-600 text-sm mb-8 flex items-center gap-1"
        >
          ← All posts
        </button>

        {/* Post header */}
        <header className="mb-10">
          <p className="text-sm text-gray-400 mb-3">
            {new Date(post.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
          <h1 className="text-4xl font-bold mb-4 leading-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="text-xl text-gray-500 leading-relaxed">{post.excerpt}</p>
          )}
        </header>

        {/* Post content */}
        <article className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            {post.content.split('\n').map((paragraph, i) => {
              if (!paragraph.trim()) return <div key={i} className="h-4" />

              // Headings
              if (paragraph.startsWith('## ')) {
                return <h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-gray-900">{paragraph.slice(3)}</h2>
              }
              if (paragraph.startsWith('# ')) {
                return <h1 key={i} className="text-3xl font-bold mt-8 mb-4 text-gray-900">{paragraph.slice(2)}</h1>
              }

              // Bold text with **
              const renderInline = (text) => {
                const parts = text.split(/(\*\*.*?\*\*)/g)
                return parts.map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j}>{part.slice(2, -2)}</strong>
                  }
                  return part
                })
              }

              return (
                <p key={i} className="text-gray-700 leading-relaxed mb-4 text-lg">
                  {renderInline(paragraph)}
                </p>
              )
            })}
          </div>
        </article>

        {/* CTA */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-8 text-center">
          <p className="text-lg font-bold mb-2">Experience Awe Daily</p>
          <p className="text-gray-600 text-sm mb-6">Join Awed and start your daily wonder ritual</p>
          <button
            onClick={() => router.push('/signup')}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700"
          >
            Get Started — Free →
          </button>
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <button onClick={() => router.push('/blog')} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back to all posts
          </button>
        </div>
      </div>
    </div>
  )
}