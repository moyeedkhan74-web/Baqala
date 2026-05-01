import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const MagneticHover = ({ children, className = '', damping = 15, stiffness = 150 }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState([{ x: 0, y: 0 }]);

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    // Multiply by a smaller faction for subtle magnetism
    setPosition({ x: middleX * 0.15, y: middleY * 0.15 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      className={className}
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness, damping, mass: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

export default MagneticHover;
