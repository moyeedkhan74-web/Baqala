// Baqala Deployment Trigger: CORS & Upload Final
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AnimatedLayout from './components/AnimatedLayout';
import LoadingScreen from './components/LoadingScreen';
import CookieBanner from './components/CookieBanner';
import GlobalAnnouncement from './components/GlobalAnnouncement';
import { Shield, RefreshCw } from 'lucide-react';
const ParticlesBackground = lazy(() => import('./components/ParticlesBackground'));
import api from './api/axios';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AppAbout = lazy(() => import('./pages/AppAbout'));
const AppDetail = lazy(() => import('./pages/AppDetail'));
const DeveloperDashboard = lazy(() => import('./pages/DeveloperDashboard'));
const UploadApp = lazy(() => import('./pages/UploadApp'));
const EditApp = lazy(() => import('./pages/EditApp'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const RevenueShare = lazy(() => import('./pages/RevenueShare'));
const Contact = lazy(() => import('./pages/Contact'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const DeveloperProfile = lazy(() => import('./pages/DeveloperProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const About = lazy(() => import('./pages/About'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AppManagement = lazy(() => import('./pages/AppManagement'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ModerationQueue = lazy(() => import('./pages/ModerationQueue'));
const Analytics = lazy(() => import('./pages/Analytics'));
const FeaturedCuration = lazy(() => import('./pages/FeaturedCuration'));
const PlatformSettings = lazy(() => import('./pages/PlatformSettings'));

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [config, setConfig] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setError(null);
        
        // Parallelize static wait with backend ping for smooth transition
        const [healthRes, configRes] = await Promise.all([
          api.get('/health').catch(err => {
            console.warn('Backend waking up...', err);
            // Retry once after 5s and resolve properly with the retry result
            return new Promise((resolve) => setTimeout(() => resolve(api.get('/health')), 5000));
          }),
          api.get('/config').catch(() => ({ data: { config: null } })),
          new Promise((resolve) => setTimeout(resolve, 2000)) // Min splash time for branding
        ]);

        if (configRes.data.config) {
          console.log('✅ Config loaded:', configRes.data.config);
          console.log('📍 Maintenance mode:', configRes.data.config.isMaintenanceMode);
          console.log('📝 Maintenance message:', configRes.data.config.maintenanceMessage);
          setConfig(configRes.data.config);
        } else {
          console.warn('⚠️ Config is null or undefined, using defaults:', configRes.data);
          // Set default config if fetch fails
          setConfig({
            isMaintenanceMode: false,
            maintenanceMessage: 'Baqala is currently under maintenance.',
            maxApkSize: 500,
            maxImageSize: 5,
            announcement: { enabled: false, text: '', level: 'info' },
            sections: {
              trending: true,
              newReleases: true,
              categoryBrowsing: true,
              featuredCarousel: true
            }
          });
        }

        // Check user role via local auth context (simplified for this check)
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (storedUser?.role === 'admin') {
          console.log('👤 User is admin, bypassing maintenance check');
          setIsAdmin(true);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Initialization warning:', err);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (!isLoading && config && config.isMaintenanceMode && !isAdmin && location.pathname !== '/login') {
    console.log('🔒 MAINTENANCE MODE ACTIVE', {
      isLoading,
      isMaintenanceMode: config.isMaintenanceMode,
      isAdmin,
      pathname: location.pathname,
      message: config.maintenanceMessage
    });
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-violet/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-xl w-full"
        >
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl text-center">
            {/* Status Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-accent-violet/20 rounded-[2rem] flex items-center justify-center text-accent-violet border border-accent-violet/30">
                  <RefreshCw className="w-10 h-10 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white border-4 border-[#050505] shadow-xl">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              Platform Update
            </h1>
            
            <p className="text-slate-400 font-bold text-lg leading-relaxed mb-10 max-w-sm mx-auto">
              {config?.maintenanceMessage || "Baqala is currently updating to bring you a better experience. We'll be back shortly!"}
            </p>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-4 mb-10 text-center">
              <div className="bg-white/2 border border-white/5 p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Status</p>
                <p className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Updating
                </p>
              </div>
              <div className="bg-white/2 border border-white/5 p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Access</p>
                <p className="text-xs font-bold text-amber-500 flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Restricted
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/contact" className="px-8 py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all w-full sm:w-auto">
                Contact Support
              </Link>
              <Link to="/login" className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                Administrator Portal
              </Link>
            </div>

            <p className="mt-12 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
              Baqala Safety Council &bull; Systems Operations
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Safe Analytics Tracking
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: location.pathname,
        });
      }
    } catch (e) {
      // Silently catch ad-blocker errors
    }
    
    // Global Scroll To Top on navigation - Fixed as requested
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  };

  // Wait for config to load before rendering main app
  if (!config) {
    return <LoadingScreen isLoading={true} error={error} onRetry={handleRetry} />;
  }

  return (
    <>
      <LoadingScreen isLoading={isLoading} error={error} onRetry={handleRetry} />
      <CookieBanner />
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[1000] focus:bg-accent-violet focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-neon"
      >
        Skip to main content
      </a>
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-500">
        {/* Global interactive particles */}
        <Suspense fallback={null}>
          <ParticlesBackground />
        </Suspense>
        
        <div className="relative z-20 w-full flex flex-col flex-1">
          <GlobalAnnouncement config={config} />
          <Navbar />
          
          <main id="main-content" className="flex-1 w-full flex flex-col">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<AnimatedLayout skipInitial><Home /></AnimatedLayout>} />
                <Route path="/login" element={<AnimatedLayout><Login /></AnimatedLayout>} />
                <Route path="/register" element={<AnimatedLayout><Register /></AnimatedLayout>} />
                <Route path="/app/:id" element={<AnimatedLayout><AppDetail /></AnimatedLayout>} />
                <Route path="/app/:id/about" element={<AnimatedLayout><AppAbout /></AnimatedLayout>} />
                <Route path="/privacy-policy" element={<AnimatedLayout><PrivacyPolicy /></AnimatedLayout>} />
                <Route path="/terms-of-service" element={<AnimatedLayout><TermsOfService /></AnimatedLayout>} />
                <Route path="/cookie-policy" element={<AnimatedLayout><CookiePolicy /></AnimatedLayout>} />
                <Route path="/revenue-share" element={<AnimatedLayout><RevenueShare /></AnimatedLayout>} />
                <Route path="/contact" element={<AnimatedLayout><Contact /></AnimatedLayout>} />
                <Route path="/about" element={<AnimatedLayout><About /></AnimatedLayout>} />
                <Route path="/search" element={<AnimatedLayout><SearchResults /></AnimatedLayout>} />
                <Route path="/category/:name" element={<AnimatedLayout><CategoryPage /></AnimatedLayout>} />
                <Route path="/developer/:id" element={<AnimatedLayout><DeveloperProfile /></AnimatedLayout>} />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AnimatedLayout><Settings /></AnimatedLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/developer" element={
                  <ProtectedRoute>
                    <AnimatedLayout><DeveloperDashboard /></AnimatedLayout>
                  </ProtectedRoute>
                } />
                <Route path="/upload" element={
                  <ProtectedRoute>
                    <AnimatedLayout><UploadApp /></AnimatedLayout>
                  </ProtectedRoute>
                } />
                <Route path="/edit/:id" element={
                  <ProtectedRoute>
                    <AnimatedLayout><EditApp /></AnimatedLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute roles={['admin']}>
                    <AnimatedLayout><AdminDashboard /></AnimatedLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/apps" element={
                  <ProtectedRoute roles={['admin']}>
                    <AnimatedLayout><AppManagement /></AnimatedLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute roles={['admin']}>
                    <AnimatedLayout><UserManagement /></AnimatedLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/reviews" element={
                  <ProtectedRoute roles={['admin']}>
                    <AnimatedLayout><ModerationQueue /></AnimatedLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <ProtectedRoute roles={['admin']}>
                    <AnimatedLayout><Analytics /></AnimatedLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/featured" element={
                  <ProtectedRoute roles={['admin']}>
                    <AnimatedLayout><FeaturedCuration /></AnimatedLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute roles={['admin']}>
                    <AnimatedLayout><PlatformSettings /></AnimatedLayout>
                  </ProtectedRoute>
                } />
              </Routes>
            </AnimatePresence>
          </main>
          
          <Footer />
        </div>
      </div>
    </>
  );
}

export default App;
