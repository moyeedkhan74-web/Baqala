import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const CookiePolicy = () => {
  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <SEOHead 
        title="Cookie Policy | Baqala"
        description="Information about how we use cookies and local storage."
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-12 rounded-3xl"
      >
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          Cookie <span className="gradient-text">Policy</span>
        </h1>
        <p className="text-slate-500 dark:text-gray-400 mb-8 font-medium italic">Last updated: June 2026</p>

        <div className="space-y-8 text-slate-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Use of Cookies</h2>
            <p>
              Baqala keeps browsing simple. We do not use traditional "cookies" for tracking or marketing purposes. Instead, we use your browser's <strong>Local Storage</strong> and <strong>Session Storage</strong> to keep you logged in and remember your preferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Essential Data</h2>
            <p>We store the following essential information locally on your device:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Auth Tokens:</strong> Secure JWT tokens provided by Firebase to keep you signed into your account.</li>
              <li><strong>User Profile:</strong> Basic information (like your username) used to personalize your dashboard.</li>
              <li><strong>Theme Preference:</strong> Whether you prefer Light Mode or Dark Mode.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Third-Party Cookies</h2>
            <p>
              Our authentication provider, <strong>Firebase (Google)</strong>, may place essential cookies required to manage the login process and prevent fraudulent activity. These are not used for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. No Ad Tracking</h2>
            <p className="font-bold text-accent-emerald">
              Baqala does not use any third-party advertising networks, tracking pixels, or marketing cookies. Your browsing habits stay private.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Managing Preferences</h2>
            <p>
              You can clear your local storage at any time through your browser settings, though this will sign you out of your account and reset your theme preferences.
            </p>
          </section>

          <section>
            <p className="text-xs italic text-slate-500 mt-10">
              Questions? Contact us at <a href="mailto:legal@baqala.com" className="text-accent-violet hover:underline">legal@baqala.com</a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default CookiePolicy;
