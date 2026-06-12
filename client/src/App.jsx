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
const ParticlesBackground = lazy(() => import('./components/ParticlesBackground'));
import api from './api/axios';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AppAbout = lazy(() => import('./pages/AppAbout'));
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

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setError(null);
        
        // Parallelize static wait with backend ping for smooth transition
        const [healthRes] = await Promise.all([
          api.get('/health').catch(err => {
            console.warn('Backend waking up...', err);
            // If it fails once, we can retry or just wait a bit longer
            return new Promise((resolve) => setTimeout(() => api.get('/health'), 5000));
          }),
          new Promise((resolve) => setTimeout(resolve, 2000)) // Min splash time for branding
        ]);

        setIsLoading(false);
      } catch (err) {
        // Even if health check fails after retry, we show the app 
        // and let page-level loaders/errors handle it
        console.error('Initialization warning:', err);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

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
