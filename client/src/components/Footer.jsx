import { Link } from 'react-router-dom';
import { HiOutlineSparkles } from 'react-icons/hi';

const Footer = ({ className = '' }) => {
  return (
    <footer className={`border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-dark-900 mt-auto py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mb-12 pb-12 border-b border-slate-200 dark:border-white/5">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <img src="/logo.png" alt="Baqala Logo" className="h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
            </Link>
            <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed max-w-xs">
              The premium destination to discover, download, and share the most innovative digital experiences.
            </p>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-slate-900 dark:text-white font-black tracking-[0.2em] uppercase text-[10px] mb-6">Platform</h3>
            <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-gray-400">
              <li><Link to="/about" className="hover:text-accent-violet transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-accent-violet transition-colors">Explore Apps</Link></li>
              <li><a href="#" className="hover:text-accent-violet transition-colors">Top Charts</a></li>
            </ul>
          </div>
 
          <div className="col-span-1">
            <h3 className="text-slate-900 dark:text-white font-black tracking-[0.2em] uppercase text-[10px] mb-6">Developers</h3>
            <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-gray-400">
              <li><Link to="/upload" className="hover:text-accent-violet transition-colors">Publish App</Link></li>
              <li><Link to="/developer" className="hover:text-accent-violet transition-colors">Dashboard</Link></li>
              <li><Link to="/revenue-share" className="hover:text-accent-violet transition-colors">Revenue</Link></li>
            </ul>
          </div>
 
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-slate-900 dark:text-white font-black tracking-[0.2em] uppercase text-[10px] mb-6">Legal & Support</h3>
            <div className="grid grid-cols-2 gap-4">
              <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-gray-400">
                <li><Link to="/privacy-policy" className="hover:text-accent-violet transition-colors">Privacy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-accent-violet transition-colors">Terms</Link></li>
              </ul>
              <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-gray-400">
                <li><Link to="/cookie-policy" className="hover:text-accent-violet transition-colors">Cookies</Link></li>
                <li><Link to="/contact" className="hover:text-accent-violet transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} Baqala Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span>Designed for the Future</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse shadow-glow-neon" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
