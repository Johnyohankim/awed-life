import LandingNavbar from './components/LandingNavbar'
import LiveStats from './components/LiveStats'
import ChatPreview from './components/ChatPreview'
import RecentSubmissions from './components/RecentSubmissions'
import { HeroButtons, HowItWorksCTA, SubmitCTA, FooterLinks } from './components/LandingHeroButtons'

export default function Home() {
  return (
    <div className="min-h-screen bg-surface">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative w-full h-screen bg-surface-dark">
        <video
          autoPlay muted loop playsInline
          className="w-full h-full object-cover opacity-60"
          src="https://pub-a9edba097fc04f4ea77b1baac778b4f9.r2.dev/menifesto1.mp4"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-bold text-5xl md:text-8xl text-white mb-6 drop-shadow-lg tracking-tight">
            Find Your Awe
          </h1>
          <LiveStats />
          <p className="text-lg md:text-2xl text-white/85 mb-4 max-w-2xl drop-shadow font-light tracking-wide">
            A daily ritual of wonder. One moment. One reflection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <HeroButtons />
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white opacity-40 animate-[pulse_3s_ease-in-out_infinite]" aria-hidden="true">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </section>

      {/* Book credit */}
      <section className="py-8 bg-surface border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-text-secondary text-sm">
            Inspired by{' '}
            <a
              href="https://www.amazon.com/Awe-Science-Everyday-Wonder-Transform/dp/1984879685"
              target="_blank" rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-primary-hover underline decoration-border-strong underline-offset-2"
            >
              <em className="font-bold">Awe: The New Science of Everyday Wonder and How It Can Transform Your Life</em>
            </a>
            {' '}by Dacher Keltner
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-surface-card">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-bold text-4xl md:text-5xl text-center mb-4 text-text-primary">How It Works</h2>
          <p className="text-center text-text-secondary mb-16 max-w-xl mx-auto text-lg">
            A simple daily ritual to bring more wonder into your life
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">🎴</div>
              <h3 className="font-bold text-xl mb-2 text-text-primary">1. Choose a Moment</h3>
              <p className="text-text-secondary text-sm leading-relaxed">Each day, 8 new awe moments across different categories are waiting for you.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-light rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">💬</div>
              <h3 className="font-bold text-xl mb-2 text-text-primary">2. Watch & Reflect</h3>
              <p className="text-text-secondary text-sm leading-relaxed">Watch the moment, then talk it through with a gentle AI guide. Just a few words.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#E8F0E8] rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">📚</div>
              <h3 className="font-bold text-xl mb-2 text-text-primary">3. Collect & Grow</h3>
              <p className="text-text-secondary text-sm leading-relaxed">Build your personal wonder journal. Watch your Awera circle expand with every card.</p>
            </div>
          </div>
          <div className="text-center mt-16">
            <HowItWorksCTA />
          </div>
        </div>
      </section>

      {/* Interactive preview */}
      <section className="py-24 bg-surface">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="font-bold text-3xl md:text-4xl mb-3 text-text-primary">Try It Now</h2>
          <p className="text-text-secondary mb-12">Tap the card, watch the moment, talk it through</p>
          <ChatPreview />
        </div>
      </section>

      {/* Recent submissions */}
      <section className="py-24 bg-surface-card">
        <div className="container mx-auto px-4">
          <h2 className="font-bold text-3xl md:text-4xl text-center mb-4 text-text-primary">Recent Awe Moments</h2>
          <p className="text-center text-text-secondary mb-16">Shared by our community</p>
          <RecentSubmissions />
        </div>
      </section>

      {/* Submit CTA */}
      <section className="py-24 bg-surface">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="font-bold text-3xl md:text-4xl mb-4 text-text-primary">Share an Awe Moment</h2>
          <p className="text-text-secondary mb-10">
            Help build the world&apos;s largest collection of awe-inspiring moments.
          </p>
          <SubmitCTA />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-dark text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="font-bold text-3xl mb-2">Awed</h2>
          <p className="text-text-muted text-sm mb-8">A daily moment of wonder</p>
          <FooterLinks />
          <p className="text-text-muted/60 text-xs">
            Inspired by Dacher Keltner&apos;s research on awe
          </p>
        </div>
      </footer>
    </div>
  )
}
