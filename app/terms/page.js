<div className="flex justify-center gap-6 text-sm text-gray-400 mb-8">
  {session ? (
    <button onClick={() => router.push('/cards')} className="hover:text-white transition-colors">My Cards</button>
  ) : (
    <button onClick={() => router.push('/signup')} className="hover:text-white transition-colors">Sign Up</button>
  )}
  <button onClick={() => router.push('/login')} className="hover:text-white transition-colors">Sign In</button>
  <a href="https://blog.awed.life" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Blog</a>
  <a href="#submit" className="hover:text-white transition-colors">Submit a Moment</a>
  <button onClick={() => router.push('/terms')} className="hover:text-white transition-colors">Terms</button>
</div>