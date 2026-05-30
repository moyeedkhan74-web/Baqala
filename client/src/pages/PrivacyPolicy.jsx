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
        <p className="text-slate-500 dark:text-gray-400 mb-8 font-medium italic">Last updated: June 2026</p>

        <div className="space-y-8 text-slate-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to Baqala. We value your privacy and are committed to protecting your personal data. This policy explains how we handle your information when you use our app store.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Data We Collect</h2>
            <p>We keep things simple. We only collect the data necessary to provide you with a great experience:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Account Information:</strong> When you sign up via Firebase, we receive your email address and username.</li>
              <li><strong>App Data:</strong> If you are a developer, we store the apps, icons, and screenshots you upload.</li>
              <li><strong>Usage Data:</strong> We track download counts and ratings to help users discover great content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. How We Store Data</h2>
            <p>
              Your account details and app metadata are stored securely in <strong>MongoDB Atlas</strong>. All file assets (APKs, images) are stored in encrypted buckets on <strong>Backblaze B2</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Third-Party Services</h2>
            <p>We use reputable infrastructure providers to power Baqala:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Firebase:</strong> For secure authentication.</li>
              <li><strong>Backblaze B2:</strong> For reliable file storage.</li>
              <li><strong>Render:</strong> To host our backend API.</li>
              <li><strong>Vercel:</strong> To host our frontend application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information at any time. If you wish to delete your account or any apps you've uploaded, please use the settings in your dashboard or contact us directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please reach out to us at:
              <br />
              <a href="mailto:legal@baqala.com" className="text-accent-violet hover:underline font-bold mt-2 block italic">legal@baqala.com</a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
