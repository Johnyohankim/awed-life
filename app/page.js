import LandingNavbar from './components/LandingNavbar'
import LiveStats from './components/LiveStats'
import ChatPreview from './components/ChatPreview'
import RecentSubmissions from './components/RecentSubmissions'
import { HeroButtons, HowItWorksCTA, SubmitCTA, FooterLinks } from './components/LandingHeroButtons'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative w-full h-screen bg-black">
        <video
          autoPlay muted loop playsInline
          className="w-full h-full object-cover opacity-70"
          src="https://pub-a9edba097fc04f4ea77b1baac778b4f9.r2.dev/menifesto1.mp4"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Find Your Awe
          </h1>
          <LiveStats />
          <p className="text-xl md:text-2xl text-white opacity-90 mb-4 max-w-2xl drop-shadow">
            A daily ritual of wonder. One card. One moment. One reflection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <HeroButtons />
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white opacity-60">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </section>

      {/* Book credit */}
      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Inspired by{' '}
            <a
              href="https://www.amazon.com/Awe-Science-Everyday-Wonder-Transform/dp/1984879685"
              target="_blank" rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              <em>Awe: The New Science of Everyday Wonder and How It Can Transform Your Life</em>
            </a>
            {' '}by Dacher Keltner
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
            A simple daily ritual to bring more wonder into your life
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🎴</div>
              <h3 className="font-bold text-lg mb-2">1. Choose a Card</h3>
              <p className="text-gray-600 text-sm">Each day, 8 new awe moments across different categories are waiting for you.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">💬</div>
              <h3 className="font-bold text-lg mb-2">2. Watch & Reflect</h3>
              <p className="text-gray-600 text-sm">Watch the moment, then talk it through with a gentle AI guide. Just a few words.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📚</div>
              <h3 className="font-bold text-lg mb-2">3. Collect & Grow</h3>
              <p className="text-gray-600 text-sm">Build your personal wonder journal. Watch your Awera circle expand with every card.</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <HowItWorksCTA />
          </div>
        </div>
      </section>

      {/* Interactive preview */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-3">Try It Now</h2>
          <p className="text-gray-600 mb-10">Tap the card, watch the moment, talk it through</p>
          <ChatPreview />
        </div>
      </section>

      {/* Recent submissions */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Recent Awe Moments</h2>
          <p className="text-center text-gray-600 mb-12">Shared by our community</p>
          <RecentSubmissions />
        </div>
      </section>

      {/* Submit CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Share an Awe Moment</h2>
          <p className="text-gray-600 mb-8">
            Help build the world&apos;s largest collection of awe-inspiring moments.
          </p>
          <SubmitCTA />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-2">Awed</h2>
          <p className="text-gray-400 text-sm mb-6">A daily moment of wonder</p>
          <FooterLinks />
          <p className="text-gray-600 text-xs">
            Inspired by Dacher Keltner&apos;s research on awe
          </p>
        </div>
      </footer>
    </div>
  )
}
