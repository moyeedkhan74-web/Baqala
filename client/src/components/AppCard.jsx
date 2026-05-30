import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { HiDownload, HiStar } from 'react-icons/hi';
import { API_BASE_URL } from '../api/axios';
import MagneticHover from './MagneticHover';

const AppCard = memo(({ app, featured = false }) => {
  const navigate = useNavigate();
  const getImageUrl = (url) => {
    if (!url) return '';
    // If it's already a full CDN or B2 URL, return it
    if (url.startsWith('http')) return url;
    
    // If it's a proxy path, redirect to CDN
    if (url.startsWith('/api/assets/')) {
      const path = url.replace('/api/assets/', '');
      return `https://cdn.baqala.com/file/baqalaaa/${path}`;
    }

    if (url.startsWith('/')) {
      // Remove /api from the end of API_BASE_URL if it exists to match the proxy path
      const host = API_BASE_URL.replace(/\/api$/, '');
      return `${host}${url}`;
    }
    return url;
  };

  const fallbackIcon = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(app.title) + '&background=random';
  
  if (featured) {
    return (
      <motion.article 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full"
      >
        <MagneticHover damping={20} stiffness={100} className="relative p-8 md:p-12 rounded-3xl glass-panel overflow-hidden group border-dark-200/50 dark:border-white/20">
          <div className="absolute inset-0 bg-hero-glow opacity-10 dark:opacity-30 group-hover:opacity-30 dark:group-hover:opacity-50 transition-opacity duration-1000 blur-3xl z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-accent-violet/5 to-accent-emerald/5 dark:from-accent-violet/10 dark:to-accent-emerald/10 z-0" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 relative"
            >
              <div className="absolute inset-0 bg-accent-neon blur-2xl opacity-20 dark:opacity-40 group-hover:opacity-50 dark:group-hover:opacity-70 transition-opacity duration-500 rounded-full" />
              <img 
                src={getImageUrl(app.icon)} 
                alt={`${app.title} app icon`}
                className="w-full h-full object-cover rounded-3xl shadow-glass relative z-10 border border-white/50 dark:border-white/20 bg-white dark:bg-dark-800" 
                onError={(e) => { e.target.src = fallbackIcon; }}
              />
            </motion.div>
            
            <div className="flex-1 text-center md:text-left min-w-0">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-dark-900 dark:text-white mb-2 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent-violet group-hover:to-accent-neon transition-all duration-300 truncate">
                {app.title}
              </h2>
              {app.tagline && <p className="text-lg text-gray-700 dark:text-gray-300 font-bold mb-2">{app.tagline}</p>}
              <div className="flex flex-col mb-4">
                <Link to={`/developer/${app.developer?._id || app.developer}`} className="inline-block text-lg text-accent-violet dark:text-accent-neon font-bold hover:underline transition-all">
                  {app.developerName || app.developer?.name || 'Unknown'}
                </Link>
              </div>
              <p className="text-dark-600 dark:text-gray-400 max-w-xl mb-6 line-clamp-2 md:line-clamp-3 leading-relaxed font-medium">
                {app.description}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
                <span className="badge-primary text-sm px-4 py-1.5" aria-label={`Rating: ${app.averageRating?.toFixed(1) || '0.0'} stars`}><HiStar className="inline mr-1 text-yellow-500" aria-hidden="true" /> {app.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="badge-neon text-sm px-4 py-1.5" aria-label={`Category: ${app.category}`}>{app.category}</span>
                <span className="badge-success text-sm px-4 py-1.5" aria-label={`${((app.totalDownloads || 0) / 1000).toFixed(1)}k plus downloads`}><HiDownload className="inline mr-1" aria-hidden="true" /> {((app.totalDownloads || 0) / 1000).toFixed(1)}k+</span>
              </div>
              
              <Link to={`/app/${app._id}`} className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4 w-full md:w-auto justify-center" aria-label={`Install ${app.title} Now`}>
                <HiDownload className="w-6 h-6" aria-hidden="true" /> Install Now
              </Link>
            </div>
          </div>
        </MagneticHover>
      </motion.article>
    );
  }

  return (
    <MagneticHover damping={15} stiffness={150} className="h-full">
      <div 
        onClick={() => navigate(`/app/${app._id}`)}
        className="block h-full group cursor-pointer" 
        aria-label={`View details for ${app.title}`}
      >
        <motion.article 
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative p-3 sm:p-5 rounded-2xl glass-panel overflow-hidden h-full flex flex-col hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)] dark:hover:shadow-[0_8px_32px_rgba(139,92,246,0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-violet/5 to-accent-emerald/5 dark:from-accent-violet/10 dark:to-accent-emerald/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 relative z-10 items-center sm:items-start text-center sm:text-left">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-accent-neon blur-xl opacity-0 group-hover:opacity-30 dark:group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
              <img 
                src={getImageUrl(app.icon)} 
                alt={`${app.title} app icon`}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-[12px] sm:rounded-2xl object-cover border border-white/50 dark:border-white/10 shadow-glass relative z-10 bg-white dark:bg-dark-800" 
                onError={(e) => { e.target.src = fallbackIcon; }}
              />
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col w-full justify-center">
              <h3 className="text-[13px] sm:text-lg leading-tight sm:leading-normal font-bold text-dark-900 dark:text-white tracking-tight truncate group-hover:text-accent-violet dark:group-hover:text-accent-neon transition-colors">
                {app.title}
              </h3>
              {app.tagline && <p className="hidden sm:block text-xs text-dark-600 dark:text-gray-400 font-semibold truncate">{app.tagline}</p>}
              <Link 
                to={`/developer/${app.developer?._id || app.developer}`} 
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] sm:text-sm text-dark-500 dark:text-gray-400 font-semibold truncate mt-0.5 sm:mt-0 hover:text-accent-violet dark:hover:text-accent-neon transition-colors relative z-20"
              >
                {app.developerName || app.developer?.name || 'Unknown'}
              </Link>
            </div>
          </div>

          <div className="mt-auto pt-3 sm:pt-5 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
                <div className="flex items-center gap-0.5 sm:gap-1" aria-label={`Rating: ${app.averageRating?.toFixed(1) || '0.0'} stars`}>
                  <HiStar className="text-yellow-500 w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                  <span className="text-[11px] sm:text-sm font-bold text-dark-800 dark:text-white">{app.averageRating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="h-3 w-[1px] bg-dark-200 dark:bg-white/10 sm:hidden"></div>
                <span className="text-[9px] sm:text-xs uppercase tracking-wider font-bold text-dark-400 dark:text-gray-500 truncate max-w-[70px] sm:max-w-none" aria-label={`Category: ${app.category}`}>
                  {app.category}
                </span>
              </div>
              <div 
                className="w-full sm:w-auto justify-center bg-dark-100 dark:bg-white/5 hover:bg-dark-200 dark:hover:bg-white/15 text-dark-700 dark:text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold transition-colors flex items-center gap-1 border border-dark-200 dark:border-white/10 group-hover:border-accent-violet/30 dark:group-hover:border-accent-neon/50"
              >
                Get
              </div>
            </div>
          </div>
        </motion.article>
      </div>
    </MagneticHover>
  );
});

export default AppCard;
