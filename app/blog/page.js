'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(data => setPosts(data.posts || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">From the Creator</h1>
          <p className="text-gray-500">Thoughts on awe, wonder, and building Awed</p>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-4">✍️</p>
            <p className="text-gray-500">No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <article
                key={post.id}
                onClick={() => router.push(`/blog/${post.slug}`)}
                className="bg-white rounded-2xl p-8 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <p className="text-sm text-gray-400 mb-2">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
                <h2 className="text-2xl font-bold mb-3 hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-gray-600 leading-relaxed">{post.excerpt}</p>
                )}
                <p className="text-blue-600 text-sm font-medium mt-4">Read more →</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="text-gray-400 text-sm">
            <button onClick={() => router.push('/')} className="hover:text-gray-600">← Back to Awed</button>
          </p>
        </div>
      </footer>
    </div>
  )
}