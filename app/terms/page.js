import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Awed',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-3xl">
          <Link href="/" className="text-2xl font-bold text-gray-900">Awed</Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: February 2026</p>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6 prose prose-sm max-w-none">
          
          <section>
            <h2 className="text-xl font-bold mb-3">1. Age Requirement</h2>
            <p className="text-gray-700 leading-relaxed">
              Awed is intended for users who are 18 years of age or older. By creating an account and using this service, you confirm that you are at least 18 years old. If you are under 18, you may not use Awed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Awed, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Content</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Awed displays curated video content from third-party platforms (YouTube, Instagram, etc.). While we strive to provide meaningful and appropriate content:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Some content may contain mature themes or language</li>
              <li>We do not control the original content on third-party platforms</li>
              <li>Users are responsible for their own viewing choices</li>
              <li>Content is curated for adult audiences (18+)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. User Submissions</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you submit content to Awed:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>You must have the right to share the content</li>
              <li>Content must comply with YouTube, Instagram, and other platform guidelines</li>
              <li>We reserve the right to reject or remove any submission</li>
              <li>Submitted content may be reviewed and shared with other users if approved</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. User-Generated Reflections</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you write journal reflections on Awed:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Private reflections remain private to your account</li>
              <li>Public reflections may be visible to other users</li>
              <li>You retain ownership of your written content</li>
              <li>We reserve the right to remove inappropriate or harmful content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              We collect and use your information as described in our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              By using Awed, you consent to our data practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Account Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              Awed is provided "as is" without warranties of any kind. We are not responsible for the content, accuracy, or availability of third-party videos or services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms of Service from time to time. Continued use of Awed after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these Terms of Service, please contact us through our website.
            </p>
          </section>

        </div>

        <div className="mt-8 flex justify-center gap-6 text-sm text-gray-500">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Awed</Link>
          <Link href="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}