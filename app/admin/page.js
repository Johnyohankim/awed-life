'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check authentication on page load
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
      setLoading(false)
    } catch (error) {
      console.error('Error loading submissions:', error)
      setLoading(false)
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
      // Reload submissions to show updated list
      loadSubmissions()
    } else {
      alert('Error updating submission')
    }
  } catch (error) {
    console.error('Error:', error)
    alert('Error updating submission')
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
        
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-gray-600">Total submissions: {submissions.length}</p>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div 
                key={submission.id}
                className="bg-white rounded-lg shadow-sm p-6"
              >
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
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {submission.category}
                  </span>
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
      </div>
    </div>
  )
}