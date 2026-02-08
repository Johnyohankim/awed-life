'use client'

import { useState, useEffect } from 'react'

// Category example videos - YOU WILL REPLACE THESE WITH YOUR CHOSEN VIDEOS
const categoryExamples = [
  {
    category: "Moral Beauty",
    videoId: "kOr3qLQXPI4", // Replace with actual YouTube video ID
    description: "Acts of courage, kindness, and extraordinary strength"
  },
  {
    category: "Collective Effervescence",
    videoId: "G5goISKPSH8", // Replace
    description: "Shared energy in group activities"
  },
  {
    category: "Nature",
    videoId: "9udylvYXRJI", // Replace
    description: "The vastness of the natural world"
  },
  {
    category: "Music",
    videoId: "5m5n_-yVLog", // Replace
    description: "Melodies that stir deep emotions"
  },
  {
    category: "Visual Design",
    videoId: "A92_B_mnO-I", // Replace
    description: "Human creativity in art and architecture"
  },
  {
    category: "Spirituality & Religion",
    videoId: "l1wHyMR_SCA", // Replace
    description: "Mystical connection and oneness"
  },
  {
    category: "Life & Death",
    videoId: "iVdXYo_VVHk", // Replace
    description: "Witnessing birth or contemplating mortality"
  },
  {
    category: "Epiphany",
    videoId: "cDtwqL6xsXE", // Replace
    description: "Sudden insights that shift understanding"
  }
]

function CategoryExamples() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {categoryExamples.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${item.videoId}`}
              title={item.category}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1">{item.category}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentSubmissions()
  }, [])

  const fetchRecentSubmissions = async () => {
    try {
      const response = await fetch('/api/recent-submissions')
      const data = await response.json()
      setSubmissions(data.submissions || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching recent submissions:', error)
      setLoading(false)
    }
  }

  // Extract YouTube video ID from URL
  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return match ? match[1] : null
  }

  if (loading) {
    return <p className="text-center text-gray-500">Loading...</p>
  }

  if (submissions.length === 0) {
    return <p className="text-center text-gray-500">No submissions yet. Be the first!</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {submissions.slice(0, 6).map((submission) => {
        const videoId = getYouTubeId(submission.videoLink)
        return (
          <div key={submission.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm">
            <div className="aspect-video">
              {videoId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Awe moment"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">Video unavailable</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {submission.category}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
function CardPreview() {
  const [flippedCard, setFlippedCard] = useState(null)

  const handleCardClick = (index) => {
    setFlippedCard(flippedCard === index ? null : index)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categoryExamples.map((example, index) => (
        <div
          key={index}
          className="relative aspect-[3/4] cursor-pointer"
          onClick={() => handleCardClick(index)}
        >
          {flippedCard === index ? (
            // Flipped - show video
            <div className="w-full h-full bg-white rounded-lg shadow-lg p-3 flex flex-col">
              <div className="flex-1 mb-2">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${example.videoId}?autoplay=1`}
                  title={example.category}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded"
                />
              </div>
              <p className="text-xs font-semibold text-center">{example.category}</p>
            </div>
          ) : (
            // Face down - show category name
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center p-4 hover:shadow-xl transition-shadow">
              <p className="text-white font-bold text-center text-sm">
                {example.category}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
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
  src="https://pub-a9edba097fc04f4ea77b1baac778b4f9.r2.dev/menifesto1.mp4"
>
</video>
</section>
{/* What is Awe - Category Examples */}
<section className="py-16 bg-gray-50">
  <div className="container mx-auto px-4">
    <h2 className="text-4xl font-bold text-center mb-4">
      What is Awe?
    </h2>
    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
      Awe moments fall into 8 categories. Here are examples of each:
    </p>
    
    <CategoryExamples />
  </div>
</section>

{/* Recently Approved Moments */}
<section className="py-16 bg-white">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-4">
      Recent Awe Moments
    </h2>
    <p className="text-center text-gray-600 mb-12">
      Shared by our community
    </p>
    
    <RecentSubmissions />
  </div>
</section>

      {/* Counter + Teaser Section */}
<section className="py-16 bg-white">
  <div className="container mx-auto px-4 text-center">
    <h2 className="text-5xl font-bold mb-4">{submissionCount}</h2>
    <p className="text-gray-600 mb-8">awe moments collected</p>
    
    <div className="max-w-2xl mx-auto bg-gray-100 p-8 rounded-lg mb-12">
      <p className="text-lg font-semibold mb-4">Coming Soon:</p>
      <p className="text-gray-600 mb-4">
        Once we collect <span className="font-bold text-blue-600">1,000 awe moments</span>, awed.life will launch.
      </p>
      <p className="text-gray-600">
        Daily ritual: Choose one card. Watch. Reflect. Collect.
      </p>
    </div>

    {/* Interactive Preview */}
    <div className="max-w-5xl mx-auto">
      <h3 className="text-2xl font-bold mb-4">Preview the Experience</h3>
      <p className="text-gray-600 mb-8">Click a card to see what awaits you</p>
      <CardPreview />
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