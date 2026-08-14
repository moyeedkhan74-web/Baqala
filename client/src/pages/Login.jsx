import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiMail, HiShieldCheck, HiArrowRight, HiPencilAlt, HiRefresh } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Cooldown countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email || !email.includes('@')) {
      return toast.error('Please enter a valid email address.');
    }

    setLoading(true);
    try {
      await sendOtp(email);
      toast.success('Verification code sent to your email!');
      setStep('otp');
      setResendCooldown(30);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send verification code';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      return toast.error('Please enter the 6-digit verification code.');
    }

    setLoading(true);
    try {
      await verifyOtp(email, otp.trim());
      toast.success('Authentication successful!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed';
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
    <div className="min-h-screen flex items-center justify-center relative px-4 overflow-hidden pt-20 pb-12">
      {/* Background ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-violet/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent-emerald/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-violet via-accent-neon to-accent-emerald" />
          
          <div className="text-center mb-6 flex flex-col items-center">
            <img src="/logo.png" alt="Baqala Logo" className="h-24 sm:h-32 w-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)] scale-125" />
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-2">Welcome Back</h2>
            <p className="text-gray-400 mt-2 text-sm">
              {step === 'email' ? 'Enter your email to receive a verification code' : `Enter code sent to ${email}`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiMail className="text-accent-neon h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-11 bg-dark-900/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex justify-center items-center gap-2 w-full py-4 text-lg mt-6 shadow-glow-violet"
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'} <HiArrowRight />
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span>Target Email: <strong className="text-white">{email}</strong></span>
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-accent-neon hover:underline flex items-center gap-1 font-semibold"
                    >
                      <HiPencilAlt className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiShieldCheck className="text-accent-emerald h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      placeholder="6-Digit Code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="input-field pl-11 bg-dark-900/50 tracking-[0.4em] font-mono text-lg text-center font-bold text-accent-emerald"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary flex justify-center items-center gap-2 w-full py-4 text-lg mt-6 shadow-glow-neon"
                >
                  {loading ? 'Verifying Code...' : 'Verify & Sign In'} <HiShieldCheck />
                </button>

                <div className="flex items-center justify-center pt-2">
                  {resendCooldown > 0 ? (
                    <span className="text-xs text-gray-400">
                      Resend code in <strong className="text-accent-neon">{resendCooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-xs text-accent-neon hover:text-white font-semibold flex items-center gap-1 transition-colors"
                    >
                      <HiRefresh className="w-3.5 h-3.5" /> Didn't receive code? Resend
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>

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
