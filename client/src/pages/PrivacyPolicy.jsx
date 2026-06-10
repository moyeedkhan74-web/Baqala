import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const PrivacyPolicy = () => {
  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <SEOHead 
        title="Privacy Policy | Baqala"
        description="Learn how Baqala collects, uses, and protects your data."
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-12 rounded-3xl"
      >
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          Privacy <span className="gradient-text">Policy</span>
        </h1>
        <p className="text-slate-500 dark:text-gray-400 mb-8 font-medium italic">Last updated: June 10, 2026</p>

        <div className="space-y-8 text-slate-700 dark:text-gray-300 leading-relaxed">

          {/* 1. Who we are */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Who we are</h2>
            <p>
              Baqala ("we", "us", "our") is a web-based app discovery and distribution platform available at{' '}
              <a href="https://baqala-lovat.vercel.app" className="text-accent-violet hover:underline font-semibold" target="_blank" rel="noopener noreferrer">baqala-lovat.vercel.app</a>.
              We help developers publish their apps and help users discover, download, and review them.
            </p>
            <p className="mt-3">
              For privacy enquiries contact:{' '}
              <a href="mailto:officialbaqala@gmail.com" className="text-accent-violet hover:underline font-semibold">officialbaqala@gmail.com</a>
            </p>
          </section>

          {/* 2. What data we collect */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. What data we collect</h2>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mt-4 mb-2">a) Account data</h3>
            <p>When you register, we collect your email address, username, and encrypted password (via Firebase Authentication).</p>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mt-4 mb-2">b) Profile data</h3>
            <p>Developers may optionally provide a bio, portfolio links, and profile photo.</p>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mt-4 mb-2">c) Usage data</h3>
            <p>We automatically collect pages visited, search queries entered, apps viewed, download events, and engagement actions (upvotes, reviews, comments).</p>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mt-4 mb-2">d) Device and technical data</h3>
            <p>IP address, browser type, operating system, referring URLs, and session duration — collected automatically via Cloudflare and our backend infrastructure.</p>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mt-4 mb-2">e) Cookie data</h3>
            <p>We use cookies and localStorage to store your cookie consent preference, authentication session tokens, and basic UI preferences. See our Cookie Policy for full details.</p>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mt-4 mb-2">f) User-generated content</h3>
            <p>Reviews, ratings, comments, and app submissions you post on the platform.</p>
          </section>

          {/* 3. How we use your data */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. How we use your data</h2>
            <p>We use your data to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Create and manage your account</li>
              <li>Deliver platform features (search, downloads, reviews, developer profiles)</li>
              <li>Show you relevant apps based on browsing and search activity</li>
              <li>Improve platform performance and fix bugs</li>
              <li>Detect and prevent fraud, abuse, and unauthorised access</li>
              <li>Send transactional emails (account verification, password reset)</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-4 font-semibold text-slate-900 dark:text-white">We do not sell your personal data to third parties. Ever.</p>
          </section>

          {/* 4. Legal basis for processing (GDPR) */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Legal basis for processing (GDPR)</h2>
            <p>If you are located in the European Economic Area or United Kingdom, we process your data under the following legal bases:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Contract:</strong> to provide the service you signed up for</li>
              <li><strong>Legitimate interests:</strong> platform security, abuse prevention, and service improvement</li>
              <li><strong>Consent:</strong> cookies, marketing communications (where applicable)</li>
              <li><strong>Legal obligation:</strong> compliance with applicable laws</li>
            </ul>
          </section>

          {/* 5. Third-party services we use */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Third-party services we use</h2>
            <p>Your data may be processed by the following sub-processors:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Firebase (Google LLC)</strong> — authentication and database</li>
              <li><strong>Cloudflare Inc.</strong> — CDN, DDoS protection, and security</li>
              <li><strong>Vercel Inc.</strong> — hosting and deployment</li>
              <li><strong>Render</strong> — backend API hosting</li>
              <li><strong>UptimeRobot</strong> — uptime monitoring (no personal data stored)</li>
            </ul>
            <p className="mt-3">Each provider operates under their own privacy policy and data processing agreements. We have confirmed all providers offer GDPR-compliant data processing.</p>
          </section>

          {/* 6. Data retention */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Data retention</h2>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Account data:</strong> retained for as long as your account is active. Deleted within 30 days of account deletion request.</li>
              <li><strong>Usage and analytics data:</strong> retained for up to 12 months, then aggregated or deleted.</li>
              <li><strong>Legal/compliance records:</strong> retained for up to 7 years as required by law.</li>
            </ul>
          </section>

          {/* 7. Your rights */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. Your rights</h2>
            <p>Depending on your location, you have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data ("right to be forgotten")</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability (receive your data in a machine-readable format)</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
            </ul>
            <p className="mt-3">
              To exercise any right, email us at{' '}
              <a href="mailto:officialbaqala@gmail.com" className="text-accent-violet hover:underline font-semibold">officialbaqala@gmail.com</a>.
              We will respond within 30 days.
            </p>
          </section>

          {/* 8. Children's privacy */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">8. Children's privacy</h2>
            <p>
              Baqala is not directed at children under the age of 13. We do not knowingly collect personal data from children under 13.
              If you believe a child has provided us with personal data, contact us immediately and we will delete it.
            </p>
          </section>

          {/* 9. International data transfers */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">9. International data transfers</h2>
            <p>
              Our infrastructure is primarily based in the United States. If you access Baqala from the EEA, UK, or other regions,
              your data may be transferred to and processed in the US. We ensure such transfers are covered by appropriate safeguards
              (Standard Contractual Clauses or equivalent mechanisms).
            </p>
          </section>

          {/* 10. Security */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">10. Security</h2>
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Firebase Authentication with secure token handling</li>
              <li>Cloudflare DDoS and bot protection</li>
              <li>Rate limiting on all API endpoints</li>
              <li>Regular security reviews</li>
            </ul>
            <p className="mt-3">
              No system is 100% secure. If you discover a vulnerability, please contact us responsibly at{' '}
              <a href="mailto:officialbaqala@gmail.com" className="text-accent-violet hover:underline font-semibold">officialbaqala@gmail.com</a>.
            </p>
          </section>

          {/* 11. Changes to this policy */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">11. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify registered users by email and update the
              "Last updated" date at the top of this page. Continued use of the platform after changes constitutes acceptance.
            </p>
          </section>

          {/* 12. Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">12. Contact</h2>
            <p>
              <strong>Baqala</strong><br />
              Email:{' '}
              <a href="mailto:officialbaqala@gmail.com" className="text-accent-violet hover:underline font-semibold">officialbaqala@gmail.com</a><br />
              Website:{' '}
              <a href="https://baqala-lovat.vercel.app" className="text-accent-violet hover:underline font-semibold" target="_blank" rel="noopener noreferrer">baqala-lovat.vercel.app</a>
            </p>
          </section>

        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
