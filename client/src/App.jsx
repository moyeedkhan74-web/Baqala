import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AnimatedLayout from './components/AnimatedLayout';
import ParticlesBackground from './components/ParticlesBackground';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AppDetail from './pages/AppDetail';
import DeveloperDashboard from './pages/DeveloperDashboard';
import UploadApp from './pages/UploadApp';
import AdminPanel from './pages/AdminPanel';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-500">
      {/* Global animated ambient background lights & interactive particles */}
      <ParticlesBackground />
      
      {/* Highly vibrant ambient background orbs */}
      <div className="glow-bg bg-accent-magenta/20 dark:bg-accent-magenta/15 top-[-10%] right-1/4 animate-pulse absolute z-0 w-[500px] h-[500px] pointer-events-none" style={{ animationDuration: '5s' }} />
      <div className="glow-bg bg-accent-violet/20 dark:bg-accent-violet/15 top-1/4 left-1/4 animate-pulse absolute z-0 w-[600px] h-[600px] pointer-events-none" style={{ animationDuration: '7s' }} />
      <div className="glow-bg bg-accent-neon/20 dark:bg-accent-neon/15 bottom-0 right-1/3 animate-pulse absolute z-0 w-[700px] h-[700px] pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="glow-bg bg-accent-sun/20 dark:bg-accent-sun/10 bottom-1/4 left-10 animate-pulse absolute z-0 w-[400px] h-[400px] pointer-events-none" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      
      <div className="relative z-20 w-full flex flex-col flex-1">
        <Navbar />
        
        <main className="flex-1 w-full flex flex-col">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<AnimatedLayout><Home /></AnimatedLayout>} />
              <Route path="/login" element={<AnimatedLayout><Login /></AnimatedLayout>} />
              <Route path="/register" element={<AnimatedLayout><Register /></AnimatedLayout>} />
              <Route path="/app/:id" element={<AnimatedLayout><AppDetail /></AnimatedLayout>} />
              
              <Route path="/developer" element={
                <ProtectedRoute roles={['developer','admin']}>
                  <AnimatedLayout><DeveloperDashboard /></AnimatedLayout>
                </ProtectedRoute>
              } />
              <Route path="/upload" element={
                <ProtectedRoute roles={['developer','admin']}>
                  <AnimatedLayout><UploadApp /></AnimatedLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}>
                  <AnimatedLayout><AdminPanel /></AnimatedLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </AnimatePresence>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

export default App;
