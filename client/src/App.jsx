// Baqala Deployment Trigger: CORS & Upload Final
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AnimatedLayout from './components/AnimatedLayout';
import LoadingScreen from './components/LoadingScreen';
import CookieBanner from './components/CookieBanner';
import GlobalAnnouncement from './components/GlobalAnnouncement';
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
            return new Promise((resolve) => setTimeout(() => api.get('/health'), 5000));
          }),
          api.get('/config').catch(() => ({ data: { config: null } })),
          new Promise((resolve) => setTimeout(resolve, 2000)) // Min splash time for branding
        ]);

        if (configRes.data.config) {
          setConfig(configRes.data.config);
        }

        // Check user role via local auth context (simplified for this check)
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (storedUser?.role === 'admin') setIsAdmin(true);

        setIsLoading(false);
      } catch (err) {
        console.error('Initialization warning:', err);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (!isLoading && config?.isMaintenanceMode && !isAdmin && location.pathname !== '/login') {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-rose-500 mb-8 border border-rose-500/20">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">System Maintenance</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
            {config.maintenanceMessage || "Baqala is currently under maintenance. We will be back shortly!"}
          </p>
          <div className="pt-8 flex flex-col gap-4">
             <Link to="/contact" className="text-accent-violet font-bold hover:underline">Contact Support</Link>
             <Link to="/login" className="text-slate-400 text-xs hover:text-white transition-colors">Admin Login</Link>
          </div>
        </div>
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
