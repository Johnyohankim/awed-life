'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [submissionCount, setSubmissionCount] = useState(0)
  
  // Load submission count when page loads
  useEffect(() => {
    fetchCount()
  }, [])
  
  const fetchCount = async () => {
    try {
      const response = await fetch('/api/admin/submissions')
      const data = await response.json()
      setSubmissionCount(data.submissions.length)
    } catch (error) {
      console.error('Error fetching count:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const formData = new FormData(e.target)
    const data = {
      videoLink: formData.get('videoLink'),
      category: formData.get('category'),
      hashtags: formData.get('hashtags'),
      email: formData.get('email')
    }
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('Thank you! Your awe moment has been submitted.')
        e.target.reset()
        fetchCount() // ← Add this line to refresh the count
        }
      else {
              alert('Something went wrong. Please try again.')
            }
      
    } catch (error) {
      alert('Error submitting. Please try again.')
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      
{/* Manifesto Video Section */}
<section className="relative w-full h-screen bg-black">
  <video
    autoPlay
    muted
    loop
    playsInline
    className="w-full h-full object-cover"
    src="/menifesto1.mp4"
  >
  </video>
</section>

      {/* Counter + Teaser Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-4">{submissionCount}</h2>
          <p className="text-gray-600 mb-8">awe moments collected</p>
          <div className="max-w-2xl mx-auto bg-gray-100 p-8 rounded-lg">
            <p className="text-lg mb-4">Coming soon:</p>
            <p className="text-gray-600">
              Collect one awe moment daily. Reflect. Build your personal collection.
            </p>
          </div>
        </div>
      </section>

      {/* Submission Form Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-xl">
          <h2 className="text-3xl font-bold text-center mb-8">
            Share Your Awe Moment
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Help us build a collection of awe-inspiring moments from around the world.
          </p>
          
          <form 
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-lg shadow-sm space-y-6"
          >
            
            {/* Video Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Link
              </label>
              <input
                type="url"
                name="videoLink"
                placeholder="https://youtube.com/watch?v=..."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                YouTube, Instagram, TikTok, or X link
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category...</option>
                <option value="moral-beauty">Moral Beauty</option>
                <option value="collective-effervescence">Collective Effervescence</option>
                <option value="nature">Nature</option>
                <option value="music">Music</option>
                <option value="visual-design">Visual Design</option>
                <option value="spirituality">Spirituality & Religion</option>
                <option value="life-death">Life & Death</option>
                <option value="epiphany">Epiphany</option>
              </select>
            </div>

            {/* Custom Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Hashtags (optional)
              </label>
              <input
                type="text"
                name="hashtags"
                placeholder="#inspiring #beautiful"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll notify you when we launch
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Submit Awe Moment
            </button>

          </form>
        </div>
      </section>

    </div>
  )
}