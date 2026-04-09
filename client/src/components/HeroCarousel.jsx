import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiStar, HiDownload, HiArrowRight } from 'react-icons/hi';

const HeroCarousel = ({ apps }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Create an array of featured apps (e.g. top 4 by rating, or just fallback to newest)
  const featuredApps = apps && apps.length > 0 
    ? [...apps].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 4)
    : [];

  useEffect(() => {
    if (featuredApps.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredApps.length);
    }, 5000); // 5 seconds auto-scroll
    
    return () => clearInterval(interval);
  }, [featuredApps.length]);

  if (featuredApps.length === 0) return null;

  const currentApp = featuredApps[currentIndex];

  return (
    <div className="w-full relative overflow-hidden rounded-[2.5rem] mb-12 group glass-panel border border-white/10 shadow-glass">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full h-[400px] md:h-[500px]"
        >
          {/* Background Gradient / Blur of the app icon */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 dark:opacity-20 scale-150"
              style={{ backgroundImage: `url(${currentApp?.iconUrl || currentApp?.icon || 'https://via.placeholder.com/150'})` }}
            />
            {/* Overlay Gradient to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark via-transparent to-transparent opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-background-light dark:from-background-dark via-background-light/80 dark:via-background-dark/80 to-transparent w-full md:w-3/4" />
          </div>

          <div className="relative z-10 h-full flex flex-col md:flex-row items-center p-8 md:p-16 gap-8 text-dark-800 dark:text-white">
            
            {/* App Icon */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0"
              onClick={() => navigate(`/app/${currentApp._id}`)}
            >
              <img 
                src={currentApp?.iconUrl || currentApp?.icon} 
                className="w-full h-full object-cover rounded-3xl shadow-glow-violet md:shadow-[0_0_40px_-10px_rgba(139,92,246,0.6)] border border-white/20 cursor-pointer transform hover:scale-105 transition-transform" 
                alt={currentApp.title} 
              />
            </motion.div>

            {/* App Details */}
            <div className="flex-1 flex flex-col items-start justify-center text-left">
              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="flex items-center gap-3 mb-3"
              >
                <span className="badge-neon py-1 px-3 text-sm">{currentApp.category}</span>
                <div className="flex items-center gap-1 text-yellow-500 font-bold bg-white/50 dark:bg-dark-900/50 px-3 py-1 rounded-full text-sm">
                  <HiStar /> {(currentApp?.averageRating || 0).toFixed(1)}
                </div>
              </motion.div>

              <motion.h2 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl font-extrabold mb-4 hover:text-accent-magenta cursor-pointer transition-colors line-clamp-1"
                onClick={() => navigate(`/app/${currentApp._id}`)}
              >
                {currentApp.title}
              </motion.h2>

              <motion.p 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-lg text-dark-600 dark:text-gray-300 mb-8 line-clamp-2 md:line-clamp-3 max-w-2xl"
              >
                {currentApp.shortDescription || currentApp.description}
              </motion.p>
              
              <motion.button 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                onClick={() => navigate(`/app/${currentApp._id}`)}
                className="btn-primary flex items-center gap-2 group/btn"
              >
                Get App <HiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {featuredApps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${currentIndex === idx ? 'w-8 h-2 bg-accent-magenta' : 'w-2 h-2 bg-dark-400 dark:bg-gray-500 hover:bg-dark-200 dark:hover:bg-gray-400'}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
