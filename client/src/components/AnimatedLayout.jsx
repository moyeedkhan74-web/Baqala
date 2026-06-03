import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.2
};

const AnimatedLayout = ({ children, skipInitial = false }) => {
  return (
    <motion.div
      initial={skipInitial ? "in" : "initial"}
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default AnimatedLayout;
