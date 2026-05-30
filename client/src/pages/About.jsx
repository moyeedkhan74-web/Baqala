import { motion } from 'framer-motion';
import { HiOutlineCode, HiOutlineGlobe, HiOutlineSparkles, HiOutlineCube, HiOutlineShieldCheck, HiOutlineCpuChip } from 'react-icons/hi2';
import { HiStar, HiRocketLaunch, HiCpuChip, HiCircleStack, HiGlobeAmericas, HiCommandLine } from 'react-icons/hi2';
import SEOHead from '../components/SEOHead';

const TechCard = ({ icon: Icon, name, description }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center group border-white/10"
  >
    <div className="w-12 h-12 rounded-xl bg-accent-violet/10 flex items-center justify-center mb-4 group-hover:bg-accent-violet group-hover:text-white transition-colors">
      <Icon className="w-6 h-6" />
    </div>
    <h4 className="font-bold text-slate-900 dark:text-white mb-1">{name}</h4>
    <p className="text-xs text-slate-500 dark:text-gray-400">{description}</p>
  </motion.div>
);

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 overflow-hidden relative">
      <SEOHead 
        title="About Baqala - The Open App Universe" 
        description="Learn about our mission to democratize app sharing and the cutting-edge tech stack behind Baqala."
      />

      {/* Hero Section */}
      <section className="relative px-4 mb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto text-center"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent-violet/10 text-accent-violet text-xs font-black uppercase tracking-[0.3em] mb-6 border border-accent-violet/20">
            Our Story
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-tight">
            Building the <span className="bg-gradient-to-r from-accent-violet via-accent-magenta to-accent-neon bg-clip-text text-transparent">Future of Open Discovery</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto font-medium">
            Baqala is more than just an app store; it's a movement to return the power of digital distribution back to the community.
          </p>
        </motion.div>
      </section>

      {/* Concept Grid */}
      <section className="max-w-7xl mx-auto px-4 mb-32">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <motion.div variants={itemVariants} className="glass-panel p-10 rounded-[2.5rem] border-white/20 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5">
            <HiOutlineGlobe className="w-12 h-12 text-accent-emerald mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">What is Baqala?</h3>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
              Baqala is a free, decentralized-style app marketplace designed for developers and power users. No gatekeeping, no hidden fees—just pure, unrestricted access to the best APKs and tools.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-10 rounded-[2.5rem] border-white/20 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5">
            <HiOutlineSparkles className="w-12 h-12 text-accent-sun mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">The Mission</h3>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
              Our mission is to make app sharing as simple as a handshake. We believe in high-speed downloads, verified identities, and a visual experience that feels like the premium store you deserve.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-10 rounded-[2.5rem] border-white/20 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 shadow-2xl shadow-accent-violet/5">
            <HiOutlineCode className="w-12 h-12 text-accent-violet mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Dev-First Values</h3>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
              Built by a developer for developers. We offer robust analytics, custom bio pages, and full control over your releases without the usual corporate friction.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Tech Stack Section */}
      <section className="bg-slate-900/5 dark:bg-white/5 py-32 mb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 opacity-10 blur-3xl rounded-full bg-accent-violet/30 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">The Stack Behind the Magic</h2>
            <p className="text-slate-500 dark:text-gray-400">Engineered with modern tools for ultimate performance and reliability.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            <TechCard name="React" description="Frontend Master" icon={HiOutlineCpuChip} />
            <TechCard name="Node.js" description="Fast Runtime" icon={HiCommandLine} />
            <TechCard name="MongoDB" description="NoSQL Core" icon={HiCircleStack} />
            <TechCard name="Firebase" description="Auth System" icon={HiOutlineShieldCheck} />
            <TechCard name="Backblaze B2" description="S3 Storage" icon={HiOutlineCube} />
            <TechCard name="Supabase" description="Review Data" icon={HiStar} />
            <TechCard name="Vercel" description="Edge Hosting" icon={HiOutlineGlobe} />
            <TechCard name="Render" description="Backend Engine" icon={HiRocketLaunch} />
          </div>
        </div>
      </section>

      {/* Development Journey / Hurdles */}
      <section className="max-w-4xl mx-auto px-4 mb-32">
        <div className="glass-panel p-12 rounded-[3rem] border-white/30 relative flex flex-col md:flex-row gap-12 items-center overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent-neon opacity-10 blur-[100px]" />
          <div className="flex-1">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6">Overcoming the Hurdles</h2>
            <div className="space-y-6 text-slate-600 dark:text-gray-400 font-medium">
              <p>
                Developing Baqala was an intense journey of solving engineering puzzles. From tackling complex <span className="text-accent-violet">CORS configuration</span> across diverse cloud providers to building a seamless file-proxy for cross-origin downloads, we never backed down.
              </p>
              <p>
                One of our biggest triumphs was migrating our high-traffic feedback system to <span className="text-accent-emerald text-sm uppercase font-black tracking-tighter">Supabase</span> within hours to ensure data integrity, while maintaining a perfectly synced relationship with our MongoDB core.
              </p>
              <p>
                Deployment on <span className="text-accent-sun italic">Render</span> and <span className="text-accent-neon font-bold">Vercel</span> required fine-tuning our static builds and edge workers to achieve the "lightning fast" feel Baqala has today.
              </p>
            </div>
          </div>
          <div className="w-full md:w-1/3 flex flex-col items-center">
             <div className="w-16 h-1 bg-accent-violet mb-6 rounded-full" />
             <div className="w-16 h-1 bg-accent-sun mb-6 rounded-full opacity-50" />
             <div className="w-16 h-1 bg-accent-neon mb-6 rounded-full opacity-20" />
          </div>
        </div>
      </section>

      {/* Built By Section */}
      <section className="max-w-7xl mx-auto px-4 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel p-1 text-center rounded-[3.5rem] overflow-hidden group shadow-2xl shadow-accent-violet/10"
        >
          <div className="bg-gradient-to-br from-white to-transparent dark:from-white/10 p-12 lg:p-20 rounded-[3.4rem]">
            <div className="relative inline-block mb-10">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent-violet to-accent-neon rounded-full blur-2xl opacity-20 animate-pulse" />
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-white/20 bg-slate-200 mx-auto relative z-10 shadow-xl">
                 {/* Placeholder for Khan_Sahab image */}
                 <div className="w-full h-full flex items-center justify-center bg-slate-900 text-6xl text-white font-black">
                   K
                 </div>
              </div>
            </div>
            
            <h2 className="text-sm font-black text-accent-violet uppercase tracking-[0.4em] mb-4">The Architect</h2>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Khan_Sahab</h3>
            
            <p className="text-lg text-slate-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed mb-12">
              Passionate full-stack developer committed to open-source and digital freedom. Built every line of Baqala to serve the developer community.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              <a 
                href="https://github.com/moyeedkhan74-web" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary px-10 py-4 text-lg flex items-center gap-3 shadow-glow-violet"
              >
                <HiOutlineCode className="w-6 h-6" /> Explore GitHub
              </a>
              <Link to="/contact" className="btn-secondary px-10 py-4 text-lg">
                Get in Touch
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-accent-violet/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent-neon/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </div>
  );
};

export default About;
