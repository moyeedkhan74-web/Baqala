import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { useTheme } from '../context/ThemeContext';

const ParticlesBackground = () => {
  const { isDark } = useTheme();

  const particlesInit = useCallback(async (engine) => {
    // loadSlim ensures we only load the required core components from tsparticles
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      className="absolute inset-0 z-0 pointer-events-none"
      options={{
        background: { color: { value: 'transparent' } },
        fpsLimit: 120,
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'repulse' },
            resize: true,
          },
          modes: { repulse: { distance: 120, duration: 0.4 } },
        },
        particles: {
          color: { value: isDark ? ['#ec4899', '#8b5cf6', '#22d3ee', '#f59e0b'] : ['#f472b6', '#a78bfa', '#67e8f9', '#fbbf24'] },
          links: {
            color: isDark ? '#ffffff' : '#8b5cf6',
            distance: 160,
            enable: true,
            opacity: isDark ? 0.15 : 0.25,
            width: 1.5,
          },
          move: {
            direction: 'none',
            enable: true,
            outModes: { default: 'bounce' },
            random: true,
            speed: 0.8,
            straight: false,
          },
          number: {
            density: { enable: true, area: 800 },
            value: 60,
          },
          opacity: { value: isDark ? 0.4 : 0.7 },
          shape: { type: 'circle' },
          size: { value: { min: 2, max: 5 } },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticlesBackground;
