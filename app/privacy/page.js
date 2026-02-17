import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Awed',
  description: 'Privacy Policy for Awed — how we collect, use, and protect your information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-3xl">
          <Link href="/" className="text-2xl font-bold text-gray-900">Awed</Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: February 2026</p>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">1. Who We Are</h2>
            <p>
              Awed (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website at{' '}
              <a href="https://awed.life" className="text-blue-600 hover:underline">awed.life</a>
              . This Privacy Policy explains how we collect, use, and protect your personal information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">2. Information We Collect</h2>
            <p className="mb-3">We collect the following information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Account information:</strong> Name, email address, and a hashed (never readable) password when you sign up with email.</li>
              <li><strong>Google account data:</strong> If you sign in with Google, we receive your name, email address, and profile picture from Google OAuth. We do not receive or store your Google password.</li>
              <li><strong>Journal reflections:</strong> The text you write when reflecting on awe moments. You choose whether each entry is private (only visible to you) or public.</li>
              <li><strong>Usage data:</strong> Cards you keep, categories you choose, your streak and card count, and dates of activity.</li>
              <li><strong>Submitted content:</strong> YouTube or Instagram URLs and category labels you submit for review.</li>
              <li><strong>Preview chat messages:</strong> If you use the &quot;Try It Now&quot; feature on the homepage, your typed messages are sent to an AI for a response. These messages are not stored.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To create and manage your account</li>
              <li>To show you your personal card collection and wonder journal</li>
              <li>To track your daily practice and progress</li>
              <li>To generate AI-assisted reflection questions using your journal text (processed in real time, not stored by the AI provider beyond the request)</li>
              <li>To display your public reflections to other users (only if you mark entries as public)</li>
              <li>To review and approve content submissions</li>
              <li>To improve the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Vercel:</strong> Hosts the application and database. Your data is stored on Vercel&apos;s infrastructure.</li>
              <li><strong>Google OAuth:</strong> Used for &quot;Sign in with Google.&quot; Subject to Google&apos;s Privacy Policy.</li>
              <li><strong>Anthropic Claude API:</strong> Processes your journal text to generate reflection questions. Text is sent per-request and is not used to train AI models under Anthropic&apos;s API terms.</li>
              <li><strong>YouTube / Instagram:</strong> Video content is embedded from these platforms. They may set cookies according to their own policies.</li>
              <li><strong>Cloudflare:</strong> Used for video delivery (CDN).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">5. Data Sharing</h2>
            <p>
              We do not sell your personal information. We do not share your data with third parties except as necessary to operate the service (see Section 4) or as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">6. Data Retention</h2>
            <p>
              We retain your account data and journal entries for as long as your account is active. You may request deletion of your account and associated data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of public display of your journal entries at any time by marking them private</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">8. Security</h2>
            <p>
              Passwords are hashed using bcrypt and never stored in plaintext. All data is transmitted over HTTPS. We take reasonable steps to protect your information, though no online service can guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">9. Children&apos;s Privacy</h2>
            <p>
              Awed is intended for users 18 and older. We do not knowingly collect information from anyone under 18. If you believe we have collected information from a minor, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will note the date of the last update at the top of this page. Continued use of Awed after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">11. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or want to exercise your rights, please contact us at{' '}
              <a href="mailto:hello@awed.life" className="text-blue-600 hover:underline">hello@awed.life</a>.
            </p>
          </section>

        </div>

        <div className="mt-8 flex justify-center gap-6 text-sm text-gray-500">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Awed</Link>
          <Link href="/terms" className="hover:text-gray-700">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}
