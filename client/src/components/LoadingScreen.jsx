import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const LoadingScreen = ({ isLoading, error, onRetry }) => {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (!isLoading) return;

    const generateSparkles = () => {
      const newSparkles = [...Array(30)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 2,
      }));
      setSparkles(newSparkles);
    };

    generateSparkles();
  }, [isLoading]);

  // Animated rotating circles
  const RotatingCircles = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Outer circle */}
      <motion.div
        className="absolute w-48 h-48 border-2 border-transparent border-t-cyan-400 border-r-purple-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Middle circle */}
      <motion.div
        className="absolute w-32 h-32 border-2 border-transparent border-t-pink-400 border-r-cyan-500 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner circle */}
      <motion.div
        className="absolute w-16 h-16 border-2 border-transparent border-t-purple-400 border-r-pink-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Center glow */}
      <motion.div
        className="absolute w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );

  // Sparkle effect
  const Sparkles = () => (
    <div className="absolute inset-0 overflow-hidden">
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute w-1 h-1 bg-cyan-300 rounded-full"
          style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
          animate={{
            y: [0, -100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );

  // Error overlay
  const ErrorOverlay = () => (
    <AnimatePresence>
      {error && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-900 border border-red-500/30 rounded-2xl p-8 max-w-md mx-4"
            initial={{ scale: 0.5, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 20 }}
          >
            <h3 className="text-xl font-bold text-red-400 mb-4">Oops! Something went wrong</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={onRetry}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Try Again
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black z-50 flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated background grid */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(0deg, transparent 24%, rgba(124, 58, 250, 0.05) 25%, rgba(124, 58, 250, 0.05) 26%, transparent 27%, transparent 74%, rgba(124, 58, 250, 0.05) 75%, rgba(124, 58, 250, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(124, 58, 250, 0.05) 25%, rgba(124, 58, 250, 0.05) 26%, transparent 27%, transparent 74%, rgba(124, 58, 250, 0.05) 75%, rgba(124, 58, 250, 0.05) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px',
            }}
            animate={{ y: [0, 50] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />

          {/* Radial gradient orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-transparent rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, 40, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'ease-in-out' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-transparent rounded-full blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'ease-in-out' }}
          />

          {/* Sparkles */}
          <Sparkles />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-12">
            {/* Rotating circles */}
            <div className="w-64 h-64 flex items-center justify-center">
              <RotatingCircles />
            </div>

            {/* Text content */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <motion.h1
                className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6"
                animate={{ backgroundPosition: ['0%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Baqala
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl font-light text-gray-300 tracking-wide"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                The Future of App Discovery.
              </motion.p>
            </motion.div>

            {/* Loading indicator dots */}
            <motion.div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600"
                  animate={{ y: [0, -12, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Error overlay */}
          <ErrorOverlay />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
