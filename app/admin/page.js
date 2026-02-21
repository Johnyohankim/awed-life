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

// Users tab component
function UsersTab({ onUsersCountChange }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    const response = await fetch('/api/admin/users')
    const data = await response.json()
    setUsers(data.users || [])
    setLoading(false)
    if (onUsersCountChange) onUsersCountChange(data.users?.length || 0)
  }

  const handleEdit = (user) => {
    setEditingUser(user.id)
    setEditName(user.name || '')
    setEditEmail(user.email)
  }

  const handleSave = async (id) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName, email: editEmail })
      })
      const result = await response.json()
      if (result.success) {
        setEditingUser(null)
        loadUsers()
      } else {
        alert('Error updating user')
      }
    } catch (error) {
      alert('Error updating user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, email) => {
    if (!confirm(`Delete user ${email}? This will remove all their cards, reactions, and submissions.`)) return
    const response = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    const result = await response.json()
    if (result.success) loadUsers()
    else alert('Error deleting user')
  }

  if (loading) return <p className="text-gray-500">Loading users...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Users ({users.length})</h2>
          <p className="text-sm text-gray-500 mt-1">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm">
          <p className="text-gray-500">No users yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm p-6">
              {editingUser === user.id ? (
                // Edit mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(user.id)} disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditingUser(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{user.name || 'Anonymous'}</h3>
                      <p className="text-gray-500 text-sm">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      {user.last_login && (
                        <p className="text-xs text-gray-400">
                          Last login: {new Date(user.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">ID: {user.id}</span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">{user.total_cards}</p>
                      <p className="text-xs text-gray-500">Moments</p>
                    </div>
                    <div className="bg-cyan-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">{user.total_walks || 0}</p>
                      <p className="text-xs text-gray-500">Walks</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">🔥 {user.streak_count || 0}</p>
                      <p className="text-xs text-gray-500">Streak</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">⭐ {user.submission_points || 0}</p>
                      <p className="text-xs text-gray-500">Points</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">{user.approved_submissions || 0}</p>
                      <p className="text-xs text-gray-500">Submissions</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">{user.total_reactions || 0}</p>
                      <p className="text-xs text-gray-500">Reactions</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(user)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(user.id, user.email)}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </>
              )}
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
  const [activeTab, setActiveTab] = useState('users')
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCategory, setNewCategory] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const [usersCount, setUsersCount] = useState(0)
  const [cleaningVideos, setCleaningVideos] = useState(false)
  const [cleanResult, setCleanResult] = useState(null)
  const [cleaningCards, setCleaningCards] = useState(false)
  const [finalizingBatch, setFinalizingBatch] = useState(false)
  const [finalizeResult, setFinalizeResult] = useState(null)
  const [finalizeDate, setFinalizeDate] = useState(new Date().toISOString().split('T')[0])
  const router = useRouter()

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const r = await fetch('/api/admin/check-auth')
      const result = await r.json()
      if (result.authenticated) { setIsAuthenticated(true); loadSubmissions(); loadCardCounts(); loadUsersCount() }
      else router.push('/admin/login')
    } catch { router.push('/admin/login') }
  }

  const loadUsersCount = async () => {
    try {
      const r = await fetch('/api/admin/users')
      const data = await r.json()
      setUsersCount(data.users?.length || 0)
    } catch (e) { console.error(e) }
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

  const handleCleanBlockedVideos = async () => {
    if (!confirm('This will scan all YouTube videos and remove any that are blocked from embedding. Continue?')) return
    setCleaningVideos(true); setCleanResult(null)
    try {
      const r = await fetch('/api/admin/clean-blocked-videos', { method: 'POST' })
      const result = await r.json()
      setCleanResult(result)
      if (result.success) { loadSubmissions(); loadCardCounts() }
    } catch { alert('Error cleaning videos') }
    finally { setCleaningVideos(false) }
  }

  const handleFinalizeBatch = async () => {
    if (!confirm(`Finalize batch for ${finalizeDate}? This will mark deleted videos as rejected for future search improvement.`)) return
    setFinalizingBatch(true); setFinalizeResult(null)
    try {
      const r = await fetch('/api/admin/finalize-batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batchDate: finalizeDate }) })
      const result = await r.json()
      setFinalizeResult(result)
    } catch { setFinalizeResult({ error: 'Network error' }) }
    finally { setFinalizingBatch(false) }
  }

  const handleCleanDailyCards = async () => {
    if (!confirm('This will delete today\'s daily cards and force regeneration. Continue?')) return
    setCleaningCards(true)
    try {
      const r = await fetch('/api/admin/clean-daily-cards', { method: 'POST' })
      const result = await r.json()
      if (result.success) {
        alert(`✓ Cleaned ${result.orphanedDeleted} orphaned cards and ${result.todayDeleted} today's cards. Refresh the app to see new cards.`)
      } else {
        alert('Error: ' + result.error)
      }
    } catch { alert('Error cleaning daily cards') }
    finally { setCleaningCards(false) }
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
          {[
            { id: 'submissions', label: `Submissions (${submissions.length})` },
            { id: 'bulk', label: '⚡ Bulk Add' },
            { id: 'users', label: `👥 Users${usersCount > 0 ? ` (${usersCount})` : ''}` }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => router.push('/admin/analytics')}
            className="px-5 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all">
            📊 Analytics
          </button>
          <button
            onClick={handleCleanBlockedVideos}
            disabled={cleaningVideos}
            className="px-5 py-2 rounded-lg font-medium text-sm bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {cleaningVideos ? '🔄 Scanning...' : '🧹 Clean Blocked Videos'}
          </button>
          <button
            onClick={handleCleanDailyCards}
            disabled={cleaningCards}
            className="px-5 py-2 rounded-lg font-medium text-sm bg-orange-600 text-white hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {cleaningCards ? '🔄 Cleaning...' : '🔄 Reset Daily Cards'}
          </button>
        </div>

        {/* Clean result banner */}
        {cleanResult && (
          <div className={`mb-6 p-4 rounded-lg ${cleanResult.success ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
            {cleanResult.success ? (
              <div>
                <p className="text-blue-800 font-medium">✓ Scan complete!</p>
                <p className="text-sm text-blue-700 mt-1">Checked {cleanResult.checked} videos, removed {cleanResult.removed} blocked videos</p>
                {cleanResult.errors.length > 0 && (
                  <p className="text-sm text-yellow-700 mt-1">⚠ {cleanResult.errors.length} errors during check</p>
                )}
              </div>
            ) : (
              <p className="text-red-800">{cleanResult.error}</p>
            )}
            <button onClick={() => setCleanResult(null)} className="text-xs underline mt-2">Dismiss</button>
          </div>
        )}

        {/* Bulk tab */}
        {activeTab === 'bulk' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-2">Bulk Add Videos</h2>
            <p className="text-gray-500 text-sm mb-6">One URL per line. Added as unapproved for review.</p>
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

            {/* Finalize Batch */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold mb-2">Finalize Batch</h3>
              <p className="text-gray-500 text-sm mb-4">After reviewing and deleting unsuitable videos, click to save rejection feedback for future searches.</p>
              <div className="flex items-center gap-3">
                <input type="date" value={finalizeDate} onChange={e => setFinalizeDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                <button onClick={handleFinalizeBatch} disabled={finalizingBatch}
                  className={`px-5 py-2 rounded-lg font-medium text-sm ${finalizingBatch ? 'bg-gray-100 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                  {finalizingBatch ? 'Finalizing...' : 'Finalize Batch'}
                </button>
              </div>
              {finalizeResult && (
                <div className={`mt-4 p-4 rounded-lg ${finalizeResult.success ? 'bg-purple-50 border border-purple-200' : 'bg-red-50 border border-red-200'}`}>
                  {finalizeResult.success ? (
                    <div>
                      <p className="text-purple-800 font-medium">Batch finalized for {finalizeResult.date}</p>
                      <p className="text-sm text-purple-700 mt-1">{finalizeResult.total} total — {finalizeResult.kept} kept, {finalizeResult.rejected} rejected</p>
                      {finalizeResult.rejected > 0 && <p className="text-sm text-purple-600 mt-1">Rejection patterns saved for future searches.</p>}
                    </div>
                  ) : (
                    <p className="text-red-800">{finalizeResult.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && <UsersTab onUsersCountChange={setUsersCount} />}

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