import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const TermsOfService = () => {
  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <SEOHead 
        title="Terms of Service | Baqala"
        description="Read our terms and conditions for using the Baqala app store."
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-12 rounded-3xl"
      >
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          Terms of <span className="gradient-text">Service</span>
        </h1>
        <p className="text-slate-500 dark:text-gray-400 mb-8 font-medium italic">Last updated: June 10, 2026</p>

        <div className="space-y-8 text-slate-700 dark:text-gray-300 leading-relaxed">

          {/* 1. Agreement to terms */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Agreement to terms</h2>
            <p>
              By accessing or using Baqala ("the platform", "we", "us") at{' '}
              <a href="https://baqala-lovat.vercel.app" className="text-accent-violet hover:underline font-semibold" target="_blank" rel="noopener noreferrer">baqala-lovat.vercel.app</a>,
              you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.
            </p>
          </section>

          {/* 2. What Baqala is */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. What Baqala is</h2>
            <p>
              Baqala is a web platform where developers can publish apps, tools, and projects, and where users can discover,
              download, review, and engage with them. Baqala is not a native app store and does not distribute iOS or Android
              binaries directly.
            </p>
          </section>

          {/* 3. Eligibility */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Eligibility</h2>
            <p>
              You must be at least 13 years old to use Baqala. By using the platform you confirm you meet this requirement.
              If you are under 18, you confirm you have parental or guardian consent.
            </p>
          </section>

          {/* 4. Accounts */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Accounts</h2>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>You are responsible for maintaining the security of your account and password.</li>
              <li>You must provide accurate and complete registration information.</li>
              <li>You must not share your account with others or create accounts on behalf of others without permission.</li>
              <li>We reserve the right to terminate accounts that violate these terms.</li>
            </ul>
          </section>

          {/* 5. Developer terms — publishing apps */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Developer terms — publishing apps</h2>
            <p>By submitting an app to Baqala, you confirm that:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>You own or have full rights to distribute the app and all its contents.</li>
              <li>Your app does not contain malware, spyware, ransomware, or any code designed to harm users or their devices.</li>
              <li>Your app does not infringe any third-party intellectual property rights, including copyrights, trademarks, or patents.</li>
              <li>Your app does not violate any applicable laws or regulations.</li>
              <li>Your app listing is accurate — screenshots, descriptions, and version info must reflect the actual product.</li>
              <li>You will keep your listing up to date and promptly remove apps you no longer support or that develop security issues.</li>
            </ul>
            <p className="mt-3 font-semibold text-slate-900 dark:text-white">
              Baqala reserves the right to remove any app at any time without notice if it violates these terms or poses risk to users.
            </p>
          </section>

          {/* 6. Revenue share */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Revenue share</h2>
            <p>
              Baqala plans to implement a 5% revenue share on paid app transactions processed through the platform.
              This will be communicated clearly before any monetisation features go live. Free app distribution will always remain free.
            </p>
          </section>

          {/* 7. User conduct */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. User conduct</h2>
            <p>All users agree not to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Post false, misleading, or fraudulent reviews or ratings</li>
              <li>Harass, threaten, or abuse other users or developers</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from the platform beyond normal use</li>
              <li>Use automated bots or scripts to interact with the platform</li>
              <li>Upload or share any content that is illegal, obscene, defamatory, or infringes third-party rights</li>
              <li>Attempt to gain unauthorised access to any part of the platform or its infrastructure</li>
              <li>Circumvent rate limiting, security measures, or authentication systems</li>
            </ul>
          </section>

          {/* 8. Content ownership */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">8. Content ownership</h2>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>You retain ownership of all content you submit to Baqala (apps, descriptions, screenshots, reviews).</li>
              <li>By submitting content, you grant Baqala a worldwide, non-exclusive, royalty-free licence to display, distribute, and promote your content within the platform and for marketing purposes.</li>
              <li>You can remove your content at any time by deleting your listing or account.</li>
            </ul>
          </section>

          {/* 9. Intellectual property */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">9. Intellectual property</h2>
            <p>
              The Baqala name, logo, design, and platform code are the property of Baqala and may not be used without written permission.
              All third-party app content belongs to its respective developers.
            </p>
          </section>

          {/* 10. Disclaimers */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">10. Disclaimers</h2>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Apps listed on Baqala are provided by independent developers. Baqala does not review, endorse, or guarantee the quality, safety, or accuracy of third-party apps.</li>
              <li>You download and install third-party apps at your own risk.</li>
              <li>The platform is provided "as is" without warranty of any kind, express or implied, including warranties of merchantability or fitness for a particular purpose.</li>
            </ul>
          </section>

          {/* 11. Limitation of liability */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">11. Limitation of liability</h2>
            <p>To the maximum extent permitted by law, Baqala shall not be liable for:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Loss of data, profits, or business arising from use of the platform</li>
              <li>Any damages resulting from third-party app content or conduct</li>
            </ul>
            <p className="mt-3">
              Our total liability for any claim shall not exceed the amount you paid us in the 12 months prior to the claim (or $10 if you paid nothing).
            </p>
          </section>

          {/* 12. Indemnification */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold Baqala harmless from any claims, damages, or expenses (including legal fees)
              arising from your use of the platform, your content submissions, or your violation of these terms.
            </p>
          </section>

          {/* 13. Termination */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">13. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violation of these terms. You may delete your account at any time.
              Upon termination, your right to use the platform ceases immediately.
            </p>
          </section>

          {/* 14. Governing law */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">14. Governing law</h2>
            <p>
              These terms are governed by the laws of the applicable jurisdiction. Any disputes shall be resolved in the courts of that jurisdiction.
            </p>
          </section>

          {/* 15. Changes to these terms */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">15. Changes to these terms</h2>
            <p>
              We may update these terms at any time. We will notify registered users by email and update the "Last updated" date.
              Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          {/* 16. Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">16. Contact</h2>
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

export default TermsOfService;
