import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiUser, HiMail, HiShieldCheck, HiUserGroup, HiCode, HiArrowRight, HiPencilAlt, HiRefresh } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('info'); // 'info' | 'otp'
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

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
    if (!formData.name.trim()) {
      return toast.error('Please enter your name/designation.');
    }
    if (!formData.email || !formData.email.includes('@')) {
      return toast.error('Please enter a valid email address.');
    }

    setLoading(true);
    try {
      await sendOtp(formData.email);
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

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      return toast.error('Please enter the 6-digit verification code.');
    }

    setLoading(true);
    try {
      await verifyOtp(formData.email, otp.trim(), formData.name.trim(), formData.role);
      toast.success('Identity initialized! Welcome to Baqala.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await loginWithGoogle(formData.role);
      toast.success('Google Identity Verified. Welcome to the network.');
      navigate('/');
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
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-accent-neon/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} />
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-accent-violet/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-panel p-10 md:p-12 rounded-[2.5rem] relative overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-emerald/10 blur-3xl rounded-full" />
          
          <div className="text-center mb-6 relative z-10 flex flex-col items-center">
            <img src="/logo.png" alt="Baqala Logo" className="h-24 sm:h-32 w-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-125" />
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-2">Join the Network</h2>
            <p className="text-gray-400 mt-2 text-sm">
              {step === 'info' ? 'Initialize your digital identity with OTP verification' : `Enter code sent to ${formData.email}`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'info' ? (
              <motion.form
                key="info-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp}
                className="space-y-6 relative z-10"
              >
                {/* Role Switcher */}
                <div className="flex bg-dark-900/50 p-1.5 rounded-2xl glass-panel border-white/5 relative">
                  <div 
                    className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-accent-violet to-accent-neon rounded-xl transition-transform duration-300 ease-in-out shadow-glow-violet"
                    style={{ transform: formData.role === 'user' ? 'translateX(6px)' : 'translateX(calc(100% + 6px))' }}
                  />
                  <button 
                    type="button" onClick={() => setFormData({ ...formData, role: 'user' })}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-colors relative z-10 ${formData.role === 'user' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <HiUserGroup className="w-5 h-5" /> Explorer
                  </button>
                  <button 
                    type="button" onClick={() => setFormData({ ...formData, role: 'developer' })}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-colors relative z-10 ${formData.role === 'developer' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <HiCode className="w-5 h-5" /> Architect
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiUser className="text-accent-neon h-5 w-5" />
                    </div>
                    <input
                      type="text" required placeholder="Designation (Name)"
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="input-field pl-11 bg-dark-900/50"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiMail className="text-accent-neon h-5 w-5" />
                    </div>
                    <input
                      type="email" required placeholder="Communication Protocol (Email)"
                      value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="input-field pl-11 bg-dark-900/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex justify-center items-center gap-2 w-full py-4 text-lg mt-8 shadow-glow-neon"
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
                onSubmit={handleVerifyAndRegister}
                className="space-y-6 relative z-10"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span>Account: <strong className="text-white">{formData.name}</strong> ({formData.email})</span>
                    <button
                      type="button"
                      onClick={() => setStep('info')}
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
                  className="btn-primary flex justify-center items-center gap-2 w-full py-4 text-lg mt-8 shadow-glow-neon"
                >
                  {loading ? 'Verifying & Initializing...' : 'Verify & Initialize Identity'} <HiShieldCheck />
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

          <div className="relative my-8 z-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-200/50 dark:border-white/10" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white/70 dark:bg-surface-dark text-dark-500 font-bold">Or authenticate via</span></div>
          </div>

          <div className="flex justify-center w-full relative z-20">
            <button
              onClick={handleGoogleRegister}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full max-w-[300px] py-3.5 px-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <FcGoogle className="w-5 h-5" />
              <span className="text-white/90 font-semibold text-sm group-hover:text-white transition-colors">
                Sign up with Google
              </span>
            </button>
          </div>

          <p className="mt-8 text-center text-gray-400 text-sm relative z-10">
            Existing identity found?{' '}
            <Link to="/login" className="text-accent-emerald hover:text-white font-semibold transition-colors">
              Authenticate
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
