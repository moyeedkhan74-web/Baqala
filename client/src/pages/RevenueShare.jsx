import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiLightningBolt, HiCurrencyDollar, HiChartBar, HiArrowRight, HiShieldCheck } from 'react-icons/hi';
import SEOHead from '../components/SEOHead';

const RevenueShare = () => {
  const steps = [
    {
      icon: <HiLightningBolt className="w-8 h-8 text-accent-sun" />,
      title: "Upload Your App",
      desc: "Publish your Android or Desktop applications through our easy-to-use developer dashboard."
    },
    {
      icon: <HiChartBar className="w-8 h-8 text-accent-violet" />,
      title: "Gain Visibility",
      desc: "Our platform highlights high-quality apps, giving you exposure to a global audience of tech enthusiasts."
    },
    {
      icon: <HiCurrencyDollar className="w-8 h-8 text-accent-emerald" />,
      title: "Earn Revenue",
      desc: "Monetize your hard work through direct downloads, subscriptions, or specialized licenses."
    }
  ];

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SEOHead 
        title="Revenue Share | Baqala Developer Program"
        description="Learn how to monetize your apps and join the Baqala developer ecosystem."
      />

      {/* Hero Section */}
      <div className="text-center mb-20">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight"
        >
          Build. Share. <span className="gradient-text">Prosper.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
        >
          We believe developers are the heart of the digital world. Our mission is to provide you with the fairest revenue model in the industry.
        </motion.p>
      </div>

      {/* How it Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center shadow-glass mb-6">
              {step.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{step.title}</h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* The Model Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="relative overflow-hidden glass-panel p-10 md:p-16 rounded-[40px] mb-24"
      >
        <div className="absolute top-0 right-0 p-8">
           <span className="badge-neon px-4 py-2 text-sm">Coming Soon</span>
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            An <span className="text-accent-emerald">88 / 12</span> Revenue Split
          </h2>
          <p className="text-lg text-slate-600 dark:text-gray-300 mb-8 leading-relaxed">
            While we are currently fine-tuning our payment processing system, our commitment is clear: **Developers keep 88% of every sale.** 
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <HiShieldCheck className="w-6 h-6 text-accent-neon shrink-0 mt-1" />
              <p className="text-slate-600 dark:text-gray-400"><strong>Transparent Support:</strong> The remaining 12% is reinvested into the platform to cover global hosting, security, and transaction fees.</p>
            </div>
            <div className="flex items-start gap-3">
              <HiShieldCheck className="w-6 h-6 text-accent-neon shrink-0 mt-1" />
              <p className="text-slate-600 dark:text-gray-400"><strong>Global Payouts:</strong> We are working on integrating multiple payment gateways to support developers worldwide.</p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent-emerald/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-accent-violet/20 blur-[100px] rounded-full pointer-events-none" />
      </motion.div>

      {/* Benefits CTA */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Ready to grow with us?</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/upload" className="btn-primary px-10 py-4 text-lg flex items-center gap-2 group">
            Publish My First App <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="mailto:devs@baqala.com" className="btn-secondary px-10 py-4 text-lg">
            Contact Partnerships
          </a>
        </div>
        <p className="text-xs text-slate-500 mt-8">
          Have questions? Check our <Link to="/terms-of-service" className="underline hover:text-accent-violet">Developer Terms</Link> for more details.
        </p>
      </div>
    </div>
  );
};

export default RevenueShare;
