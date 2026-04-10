import { Link } from 'react-router-dom';
import { HiOutlineSparkles } from 'react-icons/hi';

const Footer = ({ className = '' }) => {
  return (
    <footer className={`border-t border-white/5 bg-background-dark/80 backdrop-blur-xl mt-auto py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-white/5">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <img src="/logo.png" alt="Baqala Logo" className="h-12 sm:h-16 w-auto object-contain transition-transform duration-500 group-hover:scale-110 scale-125 origin-left" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              The premium destination to discover, download, and share the most innovative digital experiences.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold tracking-wide uppercase text-xs mb-4">Platform</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-accent-neon transition-colors">Explore Apps</Link></li>
              <li><a href="#" className="hover:text-accent-neon transition-colors">Top Charts</a></li>
              <li><a href="#" className="hover:text-accent-neon transition-colors">New Releases</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold tracking-wide uppercase text-xs mb-4">Developers</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/upload" className="hover:text-accent-neon transition-colors">Publish an App</Link></li>
              <li><Link to="/developer" className="hover:text-accent-neon transition-colors">Dashboard</Link></li>
              <li><a href="#" className="hover:text-accent-neon transition-colors">Revenue Share</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold tracking-wide uppercase text-xs mb-4">Legal</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-accent-neon transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent-neon transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-accent-neon transition-colors">Cookie Policy</a></li>
            </ul>
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
