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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-surface-card p-8 rounded-2xl shadow-sm max-w-md w-full text-center border border-border">
        <h1 className="font-bold text-2xl text-error mb-4">Sign In Error</h1>
        <p className="text-text-secondary mb-6">{message}</p>
        <p className="text-sm text-text-muted mb-6">Error code: {error}</p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-primary text-white py-2.5 px-4 rounded-xl hover:bg-primary-hover transition-colors font-medium"
          >
            Back to Login
          </Link>
          <Link
            href="/signup"
            className="block w-full bg-surface-card border border-border text-text-primary py-2.5 px-4 rounded-xl hover:bg-primary-light transition-colors font-medium"
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
