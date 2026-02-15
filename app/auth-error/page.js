'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages = {
    'OAuthSignin': 'Error starting Google sign in. Please try again.',
    'OAuthCallback': 'Error completing Google sign in. Please try again.',
    'OAuthCreateAccount': 'Could not create account. Please try again.',
    'EmailCreateAccount': 'Could not create account. Please try again.',
    'Callback': 'Error during sign in callback. Please try again.',
    'Default': 'An error occurred during sign in. Please try again.',
  }

  const message = errorMessages[error] || errorMessages['Default']

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Sign In Error</h1>
        <p className="text-gray-700 mb-6">{message}</p>
        <p className="text-sm text-gray-500 mb-6">Error code: {error}</p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Back to Login
          </Link>
          <Link
            href="/signup"
            className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}