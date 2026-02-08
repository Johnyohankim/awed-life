export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">About Awed</h1>
        
        <div className="prose prose-lg">
          <p className="text-gray-700 mb-4">
            Awed is a daily ritual designed to help you experience awe in your everyday life.
          </p>
          
          <h2 className="text-2xl font-bold mb-3 mt-8">What is Awe?</h2>
          <p className="text-gray-700 mb-4">
            Based on research by psychologist Dacher Keltner in his book <em>Awe: The New Science of Everyday Wonder and How It Can Transform Your Life</em>, awe is a powerful emotion that makes us feel part of something larger than ourselves.
          </p>
          
          <h2 className="text-2xl font-bold mb-3 mt-8">The Eight Categories of Awe</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>Moral Beauty</strong> - Witnessing acts of courage, kindness, and extraordinary strength</li>
            <li><strong>Collective Effervescence</strong> - Shared energy in group activities</li>
            <li><strong>Nature</strong> - The vastness of the natural world</li>
            <li><strong>Music</strong> - Melodies that stir deep emotions</li>
            <li><strong>Visual Design</strong> - Human creativity in art and architecture</li>
            <li><strong>Spirituality & Religion</strong> - Mystical connection and oneness</li>
            <li><strong>Life & Death</strong> - Witnessing birth or contemplating mortality</li>
            <li><strong>Epiphany</strong> - Sudden insights that shift understanding</li>
          </ul>
          
          <h2 className="text-2xl font-bold mb-3 mt-8">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            In a world of algorithm-driven social media and infinite scrolling, Awed offers something different: a finite, intentional practice. One card per day. Reflect. Collect. 
          </p>
          
          <p className="text-gray-700">
            We're building a community of people who pause, reflect, and reconnect with wonder.
          </p>
        </div>
      </div>
    </div>
  )
}