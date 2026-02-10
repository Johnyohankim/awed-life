'use client'

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700 mb-4">{error?.message || 'Something went wrong'}</p>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto mb-4">
          {error?.stack || 'No stack trace available'}
        </pre>
        <button
          onClick={() => reset()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}