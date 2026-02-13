'use client'

import { useState } from 'react'

export default function ShareCard({ shareUrl, shareText }) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedText = encodeURIComponent(shareText)

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const platforms = [
    {
      name: 'Twitter / X',
      color: 'bg-black',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: 'Facebook',
      color: 'bg-blue-600',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: 'Instagram',
      color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400',
      url: `https://www.instagram.com/`,
      note: '(copy link to paste in bio)',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
        </svg>
      )
    }
  ]

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-gray-600 mb-4">Share this moment</p>

      {platforms.map((platform) => (
        <a
          key={platform.name}
          href={platform.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${platform.color} flex items-center justify-center gap-3 w-full py-3 px-6 rounded-xl text-white font-medium transition-opacity hover:opacity-90 active:opacity-75`}
        >
          {platform.icon}
          <span>Share on {platform.name}</span>
          {platform.note && (
            <span className="text-xs opacity-75">{platform.note}</span>
          )}
        </a>
      ))}

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className={`flex items-center justify-center gap-3 w-full py-3 px-6 rounded-xl border-2 font-medium transition-all active:scale-95 ${
          copied
            ? 'border-green-400 bg-green-50 text-green-700'
            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {copied ? (
          <>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-600 flex-shrink-0">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Link Copied!
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gray-600 flex-shrink-0">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            Copy Link
          </>
        )}
      </button>
    </div>
  )
}