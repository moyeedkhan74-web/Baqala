import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import SEOHead from '../components/SEOHead';
import { motion } from 'framer-motion';
import { HiUser, HiCloudUpload, HiCheckCircle, HiExclamationCircle, HiPencilAlt, HiLockClosed } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    tagline: user?.tagline || '',
    specialization: user?.specialization || ''
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Avatar must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let avatarUrl = user.avatar;

      // 1. If there's a new avatar file, upload it first
      if (avatarFile) {
        const uploadData = new FormData();
        uploadData.append('file', avatarFile);
        uploadData.append('folder', 'avatars');
        
        const uploadRes = await api.post('/apps/upload-temp', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        avatarUrl = uploadRes.data.url;
      }

      // 2. Update user profile
      const res = await api.put('/auth/profile', {
        ...formData,
        avatar: avatarUrl
      });

      updateUser(res.data.user);
      toast.success('Profile updated successfully!', {
        icon: '🚀',
        style: { borderRadius: '15px', background: '#333', color: '#fff' }
      });
      setAvatarFile(null);
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SEOHead 
        title="Settings & Profile | Baqala"
        description="Manage your Baqala account, update your primary avatar, and edit your developer bio."
      />

      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-accent-violet/10 dark:bg-white/5 flex items-center justify-center text-accent-violet">
            <HiUser className="w-6 h-6" />
          </span>
          Account <span className="gradient-text">Settings</span>
        </h1>
        <p className="mt-2 text-slate-500 dark:text-gray-400 font-medium">
          Personalize your public profile and developer presence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Avatar & Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 text-center">
            <div className="relative inline-block group mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent-violet to-accent-neon rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-dark-800 bg-slate-100 dark:bg-dark-900 shadow-xl">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <HiUser className="w-16 h-16" />
                  </div>
                )}
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="absolute inset-x-0 bottom-0 py-2 bg-black/60 text-white text-[10px] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Change
                </button>
              </div>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                onChange={handleAvatarChange}
                accept="image/*"
              />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{formData.name || user?.name}</h3>
            {formData.specialization && (
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                {formData.specialization}
              </h4>
            )}
            {formData.tagline && (
              <span className="text-[11px] font-black uppercase tracking-widest text-accent-violet dark:text-accent-neon mt-1">
                {formData.tagline}
              </span>
            )}
            <div className="w-full h-[1px] bg-slate-200 dark:bg-white/10 my-6" />
            <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed italic line-clamp-4">
              {formData.bio || 'Your story will appear here. Talk about your passion, your experience, and what you build.'}
            </p>
            
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
               <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase">Status</span>
                  <span className="flex items-center gap-1 text-accent-emerald">
                     <HiCheckCircle /> Online
                  </span>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleProfileUpdate} className="glass-panel p-8 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <HiPencilAlt className="text-accent-violet w-5 h-5" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Public Identity</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Display Name</label>
                <input 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field py-3 text-base"
                  placeholder="Your name as it appears in the store"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  placeholder="e.g. Android Developer"
                  className="input-field"
                  maxLength={100}
                />
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight italic">Shown on your developer profile page (short professional title)</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">
                  Specialization / Tagline (Meta detail)
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="e.g. Android Enthusiast • Indie Game Dev"
                  className="input-field"
                  maxLength={100}
                />
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight italic">Shown on app cards & search results (keep it short)</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">
                  Full Biography
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell your story..."
                  className="input-field min-h-[150px] py-3"
                  maxLength={500}
                />
                <p className="mt-1 text-[10px] text-slate-500 italic">Shown only on your public profile page.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary py-3 px-10"
              >
                {loading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </form>

          {/* Security */}
          <div className="glass-panel p-8 opacity-60 rounded-3xl">
             <div className="flex items-center gap-2 mb-6">
                <HiLockClosed className="text-rose-500 w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Password</h2>
             </div>
             <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                <HiExclamationCircle className="text-amber-500" />
                Passwords managed via {user?.googleId ? 'Google/Firebase Auth' : 'Baqala Auth System'}.
             </p>
             <button disabled className="btn-secondary py-2 px-6 text-sm">Reset Password</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
