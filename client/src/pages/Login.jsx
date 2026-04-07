import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiMail, HiLockClosed, HiOutlineSparkles, HiArrowRight } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Authentication successful');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Google Authentication successful');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google Auth failed';
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 overflow-hidden pt-20">
      {/* Background ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-violet/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent-emerald/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-violet via-accent-neon to-accent-emerald" />
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-neon shadow-glow-violet mb-6">
              <HiOutlineSparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
            <p className="text-gray-400 mt-2">Access your digital ecosystem</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiMail className="text-accent-neon h-5 w-5" />
                </div>
                <input
                  type="email" required placeholder="Email Address"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-11 bg-dark-900/50"
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiLockClosed className="text-accent-neon h-5 w-5" />
                </div>
                <input
                  type="password" required placeholder="Password" minLength="6"
                  value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-11 bg-dark-900/50"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex justify-center items-center gap-2 w-full py-4 text-lg mt-8">
              {loading ? 'Authenticating...' : 'Sign In'} <HiArrowRight />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-200/50 dark:border-white/10" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white/70 dark:bg-surface-dark text-dark-500 font-bold">Or continue with</span></div>
          </div>

          <div className="flex justify-center w-full relative z-20">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full max-w-[300px] py-3.5 px-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <FcGoogle className="w-5 h-5" />
              <span className="text-white/90 font-semibold text-sm group-hover:text-white transition-colors">
                Sign in with Google
              </span>
            </button>
          </div>

          <p className="mt-8 text-center text-gray-400 text-sm">
            Unregistered identity?{' '}
            <Link to="/register" className="text-accent-neon hover:text-white font-semibold transition-colors">
              Initialize Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
