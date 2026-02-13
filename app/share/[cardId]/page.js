export default async function SharePage({ params }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Debug Share Page</h1>
        <p className="text-gray-600 mb-2">params.cardId: <strong>{params.cardId}</strong></p>
        <p className="text-gray-600 mb-2">type: <strong>{typeof params.cardId}</strong></p>
        <p className="text-gray-600 mb-2">parseInt: <strong>{parseInt(params.cardId, 10)}</strong></p>
        <p className="text-gray-600">isNaN: <strong>{String(isNaN(parseInt(params.cardId, 10)))}</strong></p>
      </div>
    </div>
  )
}