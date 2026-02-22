'use client'

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-surface-card p-8 rounded-lg shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold text-error mb-4">Error</h1>
        <p className="text-text-secondary mb-4">{error?.message || 'Something went wrong'}</p>
        <pre className="bg-primary-light p-4 rounded text-xs overflow-auto mb-4">
          {error?.stack || 'No stack trace available'}
        </pre>
        <button
          onClick={() => reset()}
          className="w-full bg-primary text-white py-2.5 px-4 rounded-xl hover:bg-primary-hover transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}