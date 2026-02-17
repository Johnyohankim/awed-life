'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const milestoneLabel = {
  '7_day_streak': '🔥 7-Day Streak',
  '20_total_days': '🌟 20 Total Days'
}

export default function AdminRewardsPage() {
  const router = useRouter()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadClaims()
  }, [])

  const loadClaims = async () => {
    try {
      const res = await fetch('/api/admin/reward-claims?format=json')
      if (res.status === 403) {
        router.push('/admin/login')
        return
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setClaims(data.claims || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const markShipped = async (claimId) => {
    try {
      const res = await fetch('/api/admin/reward-claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId })
      })
      const data = await res.json()
      if (data.success) {
        setClaims(prev => prev.map(c => c.id === claimId ? { ...c, shipped: true } : c))
      }
    } catch (err) {
      alert('Failed to mark as shipped')
    }
  }

  const filteredClaims = claims.filter(c => {
    if (filter === 'unshipped') return !c.shipped
    if (filter === 'shipped') return c.shipped
    if (filter === '7_day_streak') return c.milestone_type === '7_day_streak'
    if (filter === '20_total_days') return c.milestone_type === '20_total_days'
    return true
  })

  const unshippedCount = claims.filter(c => !c.shipped).length

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading reward claims...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.push('/admin')} className="text-sm text-gray-500 hover:text-gray-800 mb-2 block">
              ← Back to Admin
            </button>
            <h1 className="text-2xl font-bold">Reward Claims 🎁</h1>
            <p className="text-sm text-gray-600 mt-1">
              {claims.length} total claims · {unshippedCount} pending shipment
            </p>
          </div>
          <a
            href="/api/admin/reward-claims"
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            ↓ Download CSV
          </a>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: 'all', label: `All (${claims.length})` },
            { key: 'unshipped', label: `Unshipped (${unshippedCount})` },
            { key: 'shipped', label: `Shipped (${claims.length - unshippedCount})` },
            { key: '7_day_streak', label: '🔥 7-Day Streak' },
            { key: '20_total_days', label: '🌟 20 Total Days' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Claims list */}
        {filteredClaims.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">No claims found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClaims.map(claim => (
              <div
                key={claim.id}
                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                  claim.shipped ? 'border-green-400 opacity-70' : 'border-purple-400'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{claim.full_name}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {milestoneLabel[claim.milestone_type] || claim.milestone_type}
                      </span>
                      {claim.shipped && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✓ Shipped
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-700">
                      <div>
                        <span className="text-gray-400 text-xs">Email:</span>
                        <p className="font-medium">{claim.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Phone:</span>
                        <p>{claim.phone || '—'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-gray-400 text-xs">Address:</span>
                        <p>{claim.address}, {claim.city}, {claim.state} {claim.zip_code}, {claim.country}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Claimed:</span>
                        <p>{new Date(claim.claimed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>

                  {!claim.shipped && (
                    <button
                      onClick={() => markShipped(claim.id)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 whitespace-nowrap flex-shrink-0"
                    >
                      Mark Shipped ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
