import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Delay slightly for a smoother landing experience
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    // We treat decline as "don't show again this session" or just hide it
    // but in a strict sense, we still hide it to be non-intrusive.
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pointer-events-none"
        >
          <div 
            className="max-w-4xl mx-auto glass-panel p-4 md:p-6 rounded-2xl shadow-glass flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto border-accent-violet/20 overflow-hidden max-h-[130px] md:max-h-none"
            aria-live="polite"
          >
            <div className="text-[13px] md:text-sm text-slate-600 dark:text-gray-300 text-center md:text-left leading-tight">
              <p>
                We use cookies to ensure you get the best experience. 
                By clicking "Accept", you agree to our <Link to="/cookie-policy" className="text-accent-violet dark:text-accent-neon font-bold hover:underline">Cookie Policy</Link>.
              </p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={handleDecline}
                className="px-6 py-2 text-xs font-bold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors min-h-[44px]"
              >
                Decline
              </button>
              <button 
                onClick={handleAccept}
                className="bg-accent-violet hover:bg-accent-violet/90 text-white px-8 py-2 rounded-xl text-xs font-bold shadow-glow-violet transition-all active:scale-95 min-h-[44px]"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
