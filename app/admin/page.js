'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'moral-beauty', 'collective-effervescence', 'nature', 'music',
  'visual-design', 'spirituality', 'life-death', 'epiphany'
]
const categoryLabel = (cat) => cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}
function isInstagramUrl(url) { return url && url.includes('instagram.com') }

function VideoPreview({ url }) {
  const [show, setShow] = useState(false)
  const videoId = getYouTubeId(url)
  const isInstagram = isInstagramUrl(url)
  if (!url) return null
  if (!show) return (
    <button onClick={() => setShow(true)} className="text-xs text-blue-500 underline hover:text-blue-700 mt-1">
      ▶ Preview video
    </button>
  )
  if (isInstagram) return (
    <div className="mt-3">
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded-lg text-white text-sm font-medium w-fit">
        Open Instagram Reel ↗
      </a>
      <button onClick={() => setShow(false)} className="text-xs text-gray-400 underline mt-1 block">Hide</button>
    </div>
  )
  if (videoId) return (
    <div className="mt-3">
      <div className="aspect-video rounded-lg overflow-hidden max-w-sm">
        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="preview" frameBorder="0" allowFullScreen />
      </div>
      <button onClick={() => setShow(false)} className="text-xs text-gray-400 underline mt-1 block">Hide</button>
    </div>
  )
  return <p className="text-xs text-red-500 mt-1">⚠️ Could not detect video format</p>
}

// Blog editor component
function BlogEditor({ post, onSave, onCancel }) {
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [published, setPublished] = useState(post?.published || false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { alert('Title and content required'); return }
    setSaving(true)
    try {
      const method = post?.id ? 'PATCH' : 'POST'
      const body = post?.id
        ? { id: post.id, title, content, excerpt, published }
        : { title, content, excerpt, published }
      const response = await fetch('/api/admin/blog', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await response.json()
      if (result.success) onSave()
      else alert('Error saving post')
    } catch (error) {
      alert('Error saving post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6">{post?.id ? 'Edit Post' : 'New Post'}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Why I Built Awed"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-medium" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (shown on blog list)</label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
            placeholder="A brief summary of the post..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <p className="text-xs text-gray-400 mb-2">Supports: # Heading, ## Subheading, **bold**, blank line = paragraph break</p>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={20}
            placeholder={`# Why I Built Awed\n\nWrite your post here...\n\n## A Section\n\nMore text with **bold words** if needed.`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y" />
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <input type="checkbox" id="published" checked={published} onChange={e => setPublished(e.target.checked)} className="w-5 h-5" />
          <label htmlFor="published" className="text-sm font-medium text-gray-700">
            Published <span className="text-gray-400 font-normal">(visible on /blog)</span>
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className={`px-6 py-2 rounded-lg font-medium text-sm ${saving ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {saving ? 'Saving...' : post?.id ? 'Update Post' : 'Create Post'}
          </button>
          <button onClick={onCancel} className="px-6 py-2 rounded-lg font-medium text-sm bg-gray-100 text-gray-600 hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function BlogTab() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPost, setEditingPost] = useState(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => { loadPosts() }, [])

  const loadPosts = async () => {
    const response = await fetch('/api/admin/blog')
    const data = await response.json()
    setPosts(data.posts || [])
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return
    await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' })
    loadPosts()
  }

  const handleSave = () => {
    setShowEditor(false)
    setEditingPost(null)
    loadPosts()
  }

  if (showEditor || editingPost) {
    return (
      <BlogEditor
        post={editingPost}
        onSave={handleSave}
        onCancel={() => { setShowEditor(false); setEditingPost(null) }}
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Blog Posts</h2>
        <button onClick={() => setShowEditor(true)}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700">
          + New Post
        </button>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> : posts.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm">
          <p className="text-4xl mb-4">✍️</p>
          <p className="text-gray-500 mb-4">No posts yet</p>
          <button onClick={() => setShowEditor(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
            Write your first post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg">{post.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {post.excerpt && <p className="text-gray-500 text-sm">{post.excerpt}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {' · '}
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      /blog/{post.slug}
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditingPost(post)} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">Edit</button>
                <button onClick={() => handleDelete(post.id)} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [cardCounts, setCardCounts] = useState([])
  const [activeTab, setActiveTab] = useState('submissions')
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCategory, setNewCategory] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const router = useRouter()

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const r = await fetch('/api/admin/check-auth')
      const result = await r.json()
      if (result.authenticated) { setIsAuthenticated(true); loadSubmissions(); loadCardCounts() }
      else router.push('/admin/login')
    } catch { router.push('/admin/login') }
  }

  const loadSubmissions = async () => {
    try {
      const r = await fetch('/api/admin/submissions')
      const data = await r.json()
      setSubmissions(data.submissions || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const loadCardCounts = async () => {
    try {
      const r = await fetch('/api/admin/card-counts')
      const data = await r.json()
      setCardCounts(data.counts || [])
    } catch (e) { console.error(e) }
  }

  const handleUpdate = async (id, action) => {
    const r = await fetch('/api/admin/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) })
    const result = await r.json()
    if (result.success) { loadSubmissions(); loadCardCounts() }
    else alert('Error updating submission')
  }

  const handleCategoryEdit = async (id) => {
    if (!newCategory) return
    const r = await fetch('/api/admin/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'update-category', category: newCategory }) })
    const result = await r.json()
    if (result.success) { setEditingCategory(null); setNewCategory(''); loadSubmissions(); loadCardCounts() }
    else alert('Error updating category')
  }

  const handleBulkSubmit = async () => {
    if (!bulkUrls.trim() || !bulkCategory) { alert('Please enter URLs and select a category'); return }
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0)
    if (urls.length === 0) { alert('No valid URLs found'); return }
    setBulkSubmitting(true); setBulkResult(null)
    try {
      const r = await fetch('/api/admin/bulk-submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls, category: bulkCategory }) })
      const result = await r.json()
      setBulkResult(result)
      if (result.success) { setBulkUrls(''); loadSubmissions(); loadCardCounts() }
    } catch { alert('Error submitting') }
    finally { setBulkSubmitting(false) }
  }

  if (!isAuthenticated || loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-gray-600">Loading...</p></div>
  )

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-gray-600">Total submissions: {submissions.length}</p>
        </div>

        {cardCounts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Category Stock Levels</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cardCounts.map(cat => (
                <div key={cat.category} className={`p-4 rounded-lg text-center ${cat.total_approved === 0 ? 'bg-red-100 border-2 border-red-400' : cat.total_approved <= 7 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-green-100 border-2 border-green-400'}`}>
                  <p className="text-sm font-medium capitalize">{cat.category.replace(/-/g, ' ')}</p>
                  <p className="text-2xl font-bold mt-1">{cat.total_approved}</p>
                  <p className="text-xs mt-1">{cat.total_approved === 0 ? '⚠️ Empty!' : cat.total_approved <= 7 ? '⚠️ Low stock' : '✓ Good'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['submissions', 'bulk', 'blog'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {tab === 'submissions' ? `Submissions (${submissions.length})` : tab === 'bulk' ? '⚡ Bulk Add' : '✍️ Blog'}
            </button>
          ))}
        </div>

        {/* Bulk tab */}
        {activeTab === 'bulk' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-2">Bulk Add Videos</h2>
            <p className="text-gray-500 text-sm mb-6">One URL per line. All auto-approved.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Select a category...</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{categoryLabel(cat)}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Video URLs (one per line)</label>
              <textarea value={bulkUrls} onChange={e => setBulkUrls(e.target.value)} rows={10}
                placeholder="https://www.youtube.com/watch?v=xxx" className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm resize-y" />
              <p className="text-xs text-gray-500 mt-1">{bulkUrls.split('\n').filter(u => u.trim()).length} URLs entered</p>
            </div>
            <button onClick={handleBulkSubmit} disabled={bulkSubmitting || !bulkCategory || !bulkUrls.trim()}
              className={`w-full py-3 rounded-lg font-medium ${bulkSubmitting || !bulkCategory || !bulkUrls.trim() ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {bulkSubmitting ? 'Submitting...' : `Add ${bulkUrls.split('\n').filter(u => u.trim()).length} Videos`}
            </button>
            {bulkResult && (
              <div className={`mt-4 p-4 rounded-lg ${bulkResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {bulkResult.success ? <><p className="text-green-800 font-medium">✓ {bulkResult.added} videos added!</p>{bulkResult.skipped > 0 && <p className="text-yellow-700 text-sm mt-1">⚠ {bulkResult.skipped} duplicates skipped</p>}</> : <p className="text-red-800">{bulkResult.error}</p>}
              </div>
            )}
          </div>
        )}

        {/* Blog tab */}
        {activeTab === 'blog' && <BlogTab />}

        {/* Submissions tab */}
        {activeTab === 'submissions' && (
          submissions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center"><p className="text-gray-500">No submissions yet</p></div>
          ) : (
            <div className="space-y-4">
              {submissions.map(submission => (
                <div key={submission.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${submission.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {submission.approved ? 'Approved' : 'Pending'}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">{new Date(submission.submittedAt).toLocaleDateString()}</span>
                      {submission.email === 'admin-bulk' && <span className="ml-2 text-xs text-gray-400">bulk</span>}
                    </div>
                    {editingCategory === submission.id ? (
                      <div className="flex items-center gap-2">
                        <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm">
                          <option value="">Select...</option>
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{categoryLabel(cat)}</option>)}
                        </select>
                        <button onClick={() => handleCategoryEdit(submission.id)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Save</button>
                        <button onClick={() => { setEditingCategory(null); setNewCategory('') }} className="px-2 py-1 bg-gray-200 rounded text-xs">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{submission.category}</span>
                        <button onClick={() => { setEditingCategory(submission.id); setNewCategory(submission.category) }} className="text-gray-400 hover:text-gray-600 text-xs underline">edit</button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Video Link:</p>
                      <a href={submission.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">{submission.videoLink}</a>
                      <VideoPreview url={submission.videoLink} />
                    </div>
                    {submission.hashtags && submission.hashtags !== '' && (
                      <div><p className="text-sm font-medium text-gray-700">Hashtags:</p><p className="text-sm text-gray-600">{submission.hashtags}</p></div>
                    )}
                    {submission.email && submission.email !== 'admin-bulk' && (
                      <div><p className="text-sm font-medium text-gray-700">Email:</p><p className="text-sm text-gray-600">{submission.email}</p></div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {!submission.approved
                      ? <button onClick={() => handleUpdate(submission.id, 'approve')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Approve</button>
                      : <button onClick={() => handleUpdate(submission.id, 'unapprove')} className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700">Unapprove</button>
                    }
                    <button onClick={() => handleUpdate(submission.id, 'reject')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}