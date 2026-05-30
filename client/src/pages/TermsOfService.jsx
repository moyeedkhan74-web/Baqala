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
        <p className="text-slate-500 dark:text-gray-400 mb-8 font-medium italic">Last updated: June 2026</p>

        <div className="space-y-8 text-slate-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Scope of Service</h2>
            <p>
              Baqala is an independent app store designed to help developers showcase and distribute their digital software. By using our platform, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Developer Responsibilities</h2>
            <p>If you upload applications to Baqala, you represent and warrant that:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>You own or have the necessary rights to the software.</li>
              <li>The application does not contain malicious code, spyware, or viruses.</li>
              <li>The application does not infringe upon the intellectual property rights of others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Prohibited Content</h2>
            <p>We have a zero-tolerance policy for:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2 text-rose-600 dark:text-rose-400 font-medium">
              <li>Malware, Ransomware, or Phishing tools.</li>
              <li>Pirated software or unauthorized clones.</li>
              <li>Illegal content as defined by international laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Disclaimer of Liability</h2>
            <p>
              Baqala is provided "as is." We do not guarantee the safety or functionality of third-party apps. Users download and install software at their own risk. We are not liable for any damages to hardware or loss of data resulting from the use of apps found on this platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Takedown Policy</h2>
            <p>
              We reserve the right to remove any application from our store at our sole discretion, especially if it violates our prohibited content policy or receives valid DMCA takedown notices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <p className="text-xs italic text-slate-500 mt-10">
              For legal inquiries, please contact <a href="mailto:legal@baqala.com" className="text-accent-violet hover:underline">legal@baqala.com</a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsOfService;
