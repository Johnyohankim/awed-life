'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const error = searchParams.get('error')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [resendEmail, setResendEmail] = useState(email || '')

  const handleResend = async () => {
    if (!resendEmail) return
    setResending(true)
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail })
      })
      setResent(true)
    } catch {
      // Silent fail
    } finally {
      setResending(false)
    }
  }

  const errorMessages = {
    'missing-token': 'Invalid verification link.',
    'invalid-or-expired': 'This verification link has expired.',
    'user-not-found': 'Account not found.',
    'server-error': 'Something went wrong. Please try again.',
  }

  const hasError = error && errorMessages[error]

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-surface-card p-8 rounded-lg shadow-sm max-w-md w-full text-center">
        {hasError ? (
          <>
            <div className="text-4xl mb-4">&#9888;&#65039;</div>
            <h1 className="font-bold text-2xl text-text-primary mb-2">Verification failed</h1>
            <p className="text-text-secondary mb-6">{errorMessages[error]}</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">&#9993;&#65039;</div>
            <h1 className="font-bold text-2xl text-text-primary mb-2">Check your email</h1>
            <p className="text-text-secondary mb-6">
              We sent a verification link to{' '}
              {email ? <strong className="text-text-primary">{email}</strong> : 'your email'}.
              <br />
              Click the link to activate your account.
            </p>
          </>
        )}

        {resent ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Verification email sent! Check your inbox.
          </div>
        ) : (
          <div className="space-y-3">
            {!email && (
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            )}
            <button
              onClick={handleResend}
              disabled={resending || !resendEmail}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:bg-text-muted font-medium text-sm"
            >
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        )}

        <p className="mt-6 text-sm text-text-muted">
          Didn&apos;t receive it? Check your spam folder.
        </p>

        <p className="mt-4 text-sm text-text-secondary">
          <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
