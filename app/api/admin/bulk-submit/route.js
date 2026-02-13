'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'moral-beauty',
  'collective-effervescence',
  'nature',
  'music',
  'visual-design',
  'spirituality',
  'life-death',
  'epiphany'
]

const categoryLabel = (cat) => cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

export default function AdminPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [cardCounts, setCardCounts] = useState([])
  const [activeTab, setActiveTab] = useState('submissions') // 'submissions' | 'bulk'
  const [editingCategory, setEditingCategory] = useState(null) // submission id being edited
  const [newCategory, setNewCategory] = useState('')

  // Bulk submission state
  const [bulkUrls, setBulkUrls] = useState('')
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)

  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/check-auth')
      const result = await response.json()
      if (result.authenticated) {
        setIsAuthenticated(true)
        loadSubmissions()
        loadCardCounts()
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      router.push('/admin/login')
    }
  }

  const loadSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions')
      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCardCounts = async () => {
    try {
      const response = await fetch('/api/admin/card-counts')
      const data = await response.json()
      setCardCounts(data.counts || [])
    } catch (error) {
      console.error('Error loading card counts:', error)
    }
  }

  const handleUpdate = async (id, action) => {
    try {
      const response = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      })
      const result = await response.json()
      if (result.success) {
        loadSubmissions()
        loadCardCounts()
      } else {
        alert('Error updating submission')
      }
    } catch (error) {
      alert('Error updating submission')
    }
  }

  const handleCategoryEdit = async (id) => {
    if (!newCategory) return
    try {
      const response = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'update-category', category: newCategory })
      })
      const result = await response.json()
      if (result.success) {
        setEditingCategory(null)
        setNewCategory('')
        loadSubmissions()
        loadCardCounts()
      } else {
        alert('Error updating category')
      }
    } catch (error) {
      alert('Error updating category')
    }
  }

  const handleBulkSubmit = async () => {
    if (!bulkUrls.trim() || !bulkCategory) {
      alert('Please enter URLs and select a category')
      return
    }

    const urls = bulkUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    if (urls.length === 0) {
      alert('No valid URLs found')
      return
    }

    setBulkSubmitting(true)
    setBulkResult(null)

    try {
      const response = await fetch('/api/admin/bulk-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, category: bulkCategory })
      })
      const result = await response.json()
      setBulkResult(result)
      if (result.success) {
        setBulkUrls('')
        loadSubmissions()
        loadCardCounts()
      }
    } catch (error) {
      alert('Error submitting bulk URLs')
    } finally {
      setBulkSubmitting(false)
    }
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-gray-600">Total submissions: {submissions.length}</p>
        </div>

        {/* Category stock levels */}
        {cardCounts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Category Stock Levels</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cardCounts.map((cat) => (
                <div
                  key={cat.category}
                  className={`p-4 rounded-lg text-center ${
                    cat.total_approved === 0
                      ? 'bg-red-100 border-2 border-red-400'
                      : cat.total_approved <= 7
                      ? 'bg-yellow-100 border-2 border-yellow-400'
                      : 'bg-green-100 border-2 border-green-400'
                  }`}
                >
                  <p className="text-sm font-medium capitalize">
                    {cat.category.replace(/-/g, ' ')}
                  </p>
                  <p className="text-2xl font-bold mt-1">{cat.total_approved}</p>
                  <p className="text-xs mt-1">
                    {cat.total_approved === 0
                      ? '⚠️ Empty!'
                      : cat.total_approved <= 7
                      ? '⚠️ Low stock'
                      : '✓ Good'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'submissions'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'bulk'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⚡ Bulk Add
          </button>
        </div>

        {/* Bulk Submit Tab */}
        {activeTab === 'bulk' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-2">Bulk Add Videos</h2>
            <p className="text-gray-500 text-sm mb-6">
              Paste one URL per line. All URLs will be assigned to the selected category and auto-approved.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{categoryLabel(cat)}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URLs (one per line)
              </label>
              <textarea
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                placeholder={`https://www.youtube.com/watch?v=xxx\nhttps://www.youtube.com/shorts/xxx\nhttps://www.instagram.com/reel/xxx`}
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y"
              />
              <p className="text-xs text-gray-500 mt-1">
                {bulkUrls.split('\n').filter(u => u.trim()).length} URLs entered
              </p>
            </div>

            <button
              onClick={handleBulkSubmit}
              disabled={bulkSubmitting || !bulkCategory || !bulkUrls.trim()}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                bulkSubmitting || !bulkCategory || !bulkUrls.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {bulkSubmitting ? 'Submitting...' : `Add ${bulkUrls.split('\n').filter(u => u.trim()).length} Videos`}
            </button>

            {/* Bulk result */}
            {bulkResult && (
              <div className={`mt-4 p-4 rounded-lg ${bulkResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {bulkResult.success ? (
                  <>
                    <p className="text-green-800 font-medium">✓ {bulkResult.added} videos added successfully!</p>
                    {bulkResult.skipped > 0 && (
                      <p className="text-yellow-700 text-sm mt-1">⚠ {bulkResult.skipped} duplicates skipped</p>
                    )}
                  </>
                ) : (
                  <p className="text-red-800">{bulkResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <>
            {submissions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          submission.approved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.approved ? 'Approved' : 'Pending'}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Category with edit */}
                      {editingCategory === submission.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select...</option>
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{categoryLabel(cat)}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleCategoryEdit(submission.id)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingCategory(null); setNewCategory('') }}
                            className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {submission.category}
                          </span>
                          <button
                            onClick={() => { setEditingCategory(submission.id); setNewCategory(submission.category) }}
                            className="text-gray-400 hover:text-gray-600 text-xs underline"
                          >
                            edit
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Video Link:</p>
                        <a
                          href={submission.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {submission.videoLink}
                        </a>
                      </div>

                      {submission.hashtags && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Hashtags:</p>
                          <p className="text-sm text-gray-600">{submission.hashtags}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium text-gray-700">Email:</p>
                        <p className="text-sm text-gray-600">{submission.email}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      {!submission.approved ? (
                        <button
                          onClick={() => handleUpdate(submission.id, 'approve')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdate(submission.id, 'unapprove')}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                        >
                          Unapprove
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdate(submission.id, 'reject')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}