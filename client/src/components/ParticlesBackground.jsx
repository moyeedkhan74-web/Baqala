import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const ParticlesBackground = () => {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let particles = [];

    const COLORS_DARK  = ['#ec4899', '#8b5cf6', '#22d3ee', '#f59e0b', '#10b981'];
    const COLORS_LIGHT = ['#f472b6', '#a78bfa', '#67e8f9', '#fbbf24', '#34d399'];
    const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    class Particle {
      constructor() { this.reset(true); }

      reset(initial = false) {
        this.x  = Math.random() * canvas.width;
        this.y  = initial ? Math.random() * canvas.height : canvas.height + 10;
        this.r  = Math.random() * 2.5 + 1;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = -(Math.random() * 0.6 + 0.2);
        this.opacity = Math.random() * 0.5 + (isDark ? 0.2 : 0.4);
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.03 + 0.01;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += this.pulseSpeed;
        if (this.y < -10) this.reset();
      }

      draw() {
        const alpha = this.opacity * (0.7 + 0.3 * Math.sin(this.pulse));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }
    }

    const drawLinks = () => {
      const maxDist = 130;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (isDark ? 0.12 : 0.2);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = (isDark ? '#ffffff' : '#8b5cf6') +
              Math.round(alpha * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    };

    const init = () => {
      resize();
      particles = Array.from({ length: 60 }, () => new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLinks();
      particles.forEach(p => { p.update(); p.draw(); });
      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      resize();
      particles.forEach(p => {
        if (p.x > canvas.width)  p.x = Math.random() * canvas.width;
        if (p.y > canvas.height) p.y = Math.random() * canvas.height;
      });
    };

    init();
    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none w-full h-full"
      aria-hidden="true"
    />
  );
};

export default ParticlesBackground;
