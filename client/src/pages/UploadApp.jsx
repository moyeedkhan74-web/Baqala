import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiUpload, HiDocumentText, HiPhotograph, HiCheckCircle, HiArrowRight, HiArrowLeft, HiOutlineSparkles } from 'react-icons/hi';

const UploadApp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({ title: '', description: '', tagline: '', category: 'Games', version: '1.0.0', platform: 'Windows', developerName: '' });
  const [files, setFiles] = useState({ appFile: null, icon: null, screenshots: [] });

  const categories = ['Games', 'Productivity', 'Social', 'Entertainment', 'Tools', 'Education'];
  const platforms = ['Windows', 'macOS', 'Linux', 'Android', 'Cross-platform'];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.appFile || !files.icon) return toast.error('App file and icon are required.');
    
    setLoading(true);
    setUploadProgress(0);
    try {
      const { uploadFileDirectly } = await import('../supabase');
      const timestamp = Date.now();
      const bucket = 'Baqala'; // Case-sensitive bucket name

      // 1. Upload App Binary Direct to Cloud
      toast.loading('Deploying Project Binary to Global Cloud...', { id: 'upload' });
      const safeAppName = files.appFile.name.replace(/\s+/g, '_');
      const appPath = `apps/${timestamp}_${safeAppName}`;
      const appUrl = await uploadFileDirectly(bucket, appPath, files.appFile);
      setUploadProgress(40);

      // 2. Upload Icon Direct to Cloud
      toast.loading('Synchronizing Visual Assets...', { id: 'upload' });
      const safeIconName = files.icon.name.replace(/\s+/g, '_');
      const iconPath = `icons/${timestamp}_${safeIconName}`;
      const iconUrl = await uploadFileDirectly(bucket, iconPath, files.icon);
      setUploadProgress(60);

      // 3. Upload Screenshots Direct to Cloud
      const screenshotUrls = [];
      for (let i = 0; i < files.screenshots.length; i++) {
        const s = files.screenshots[i];
        const safeScreenshotName = s.name.replace(/\s+/g, '_');
        const sPath = `screenshots/${timestamp}_${i}_${safeScreenshotName}`;
        const sUrl = await uploadFileDirectly(bucket, sPath, s);
        screenshotUrls.push(sUrl);
        setUploadProgress(60 + ((i + 1) / files.screenshots.length) * 20);
      }

      // 4. Final Metadata Registration to Local Backend
      toast.loading('Finalizing Metadata Sync...', { id: 'upload' });
      const submissionData = {
        ...formData,
        fileUrl: appUrl,
        fileName: files.appFile.name,
        fileSize: files.appFile.size,
        icon: iconUrl,
        screenshots: screenshotUrls
      };

      await api.post('/apps', submissionData);

      setUploadProgress(100);
      toast.success('Project deployed PERFECTLY! Verified on Global Cloud.', { id: 'upload' });
      navigate('/developer');
    } catch (e) {
      console.error('Deployment Crash:', e);
      // If it fails here, it is likely a Supabase Permission issue
      const errorMsg = e.message || 'Direct cloud upload failed. Check your Supabase bucket permissions.';
      toast.error(errorMsg, { id: 'upload' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Identity', icon: HiDocumentText },
    { num: 2, title: 'Assets', icon: HiPhotograph },
    { num: 3, title: 'Deploy', icon: HiCheckCircle },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-accent-violet/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        <h1 className="text-4xl font-extrabold text-white text-center tracking-tight mb-2">Deploy New Project</h1>
        <p className="text-gray-400 text-center mb-10">Initialize your creation and transmit to the network.</p>

        {/* Stepper */}
        <div className="flex justify-between items-center mb-10 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-10 -translate-y-1/2 rounded-full" />
          <div className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-accent-violet to-accent-neon -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step >= s.num ? 'bg-gradient-to-r from-accent-violet to-accent-neon text-white shadow-glow-violet' : 'bg-dark-800 text-gray-500 border border-white/10'}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>{s.title}</span>
            </div>
          ))}
        </div>

        <motion.div 
          key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
          className="glass-panel p-8 md:p-10 rounded-[2.5rem] border border-white/10"
        >
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-white mb-6">Project Metadata</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Project Title</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field shadow-none" placeholder="Enter title..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Description</label>
                  <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field shadow-none min-h-[120px]" placeholder="Detail the experience..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Tagline <span className="text-gray-500 text-xs">(Brief catchphrase, max 100 chars)</span></label>
                  <input type="text" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} maxLength="100" className="input-field shadow-none" placeholder="e.g., 'The Future of App Discovery.'..." />
                  <p className="text-xs text-gray-500 mt-1">{formData.tagline.length}/100</p>
                </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Developer / Author Name</label>
                    <input type="text" required value={formData.developerName} onChange={e => setFormData({...formData, developerName: e.target.value})} className="input-field shadow-none" placeholder="Enter your display name..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Category</label>
                    <div className="relative">
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="select-field">
                        {categories.map(c => <option key={c} value={c} className="bg-dark-900">{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Platform</label>
                    <div className="relative">
                      <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className="select-field">
                        {platforms.map(p => <option key={p} value={p} className="bg-dark-900">{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Version</label>
                    <input type="text" required value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="input-field shadow-none" placeholder="1.0.0" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Visual Assets & Payload</h2>
                
                {/* File Uploads styled as clean drop zones */}
                <div className="p-6 border-2 border-dashed border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-accent-neon/50 transition-colors text-center relative">
                  <input type="file" required={!files.appFile} onChange={e => setFiles({...files, appFile: e.target.files[0]})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".apk,.exe,.zip,.rar" />
                  <HiUpload className="w-10 h-10 text-accent-neon mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">Payload Binary (Max 200MB)</p>
                  <p className="text-gray-400 text-sm">{files.appFile ? files.appFile.name : 'Drag & drop or click to select (.exe, .apk, .zip)'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border-2 border-dashed border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-accent-violet/50 transition-colors text-center relative">
                    <input type="file" required={!files.icon} onChange={e => setFiles({...files, icon: e.target.files[0]})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" />
                    <HiPhotograph className="w-8 h-8 text-accent-violet mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">App Icon</p>
                    <p className="text-gray-400 text-sm overflow-hidden text-ellipsis">{files.icon ? files.icon.name : 'PNG/JPG'}</p>
                  </div>
                  <div className="p-6 border-2 border-dashed border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-accent-emerald/50 transition-colors text-center relative">
                    <input type="file" multiple onChange={e => setFiles({...files, screenshots: Array.from(e.target.files)})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" />
                    <HiPhotograph className="w-8 h-8 text-accent-emerald mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Screenshots</p>
                    <p className="text-gray-400 text-sm">{files.screenshots?.length ? `${files.screenshots.length} visual(s) selected` : 'Multiple allowed'}</p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-10">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-accent-emerald to-accent-neon rounded-full flex items-center justify-center p-1 mb-6 shadow-glow-emerald animate-pulse">
                  <div className="w-full h-full bg-dark-900 rounded-full flex items-center justify-center">
                    <HiCheckCircle className="w-12 h-12 text-accent-emerald" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Ready for Transmission</h2>
                <p className="text-gray-400 max-w-sm mx-auto mb-8">Your project "{formData.title}" is ready to be deployed to the Baqala moderation queue.</p>
                
                <div className="glass-panel p-6 rounded-2xl text-left bg-dark-900/50 border-white/5 max-w-md mx-auto mb-8 transition-all">
                  <p className="text-sm text-gray-400 flex justify-between mb-2"><span>Category:</span> <span className="text-white font-medium">{formData.category}</span></p>
                  <p className="text-sm text-gray-400 flex justify-between mb-2"><span>Platform:</span> <span className="text-white font-medium">{formData.platform}</span></p>
                  <p className="text-sm text-gray-400 flex justify-between mb-6"><span>Files:</span> <span className="text-white font-medium">Binary + {1 + files.screenshots.length} Images</span></p>
                  
                  {/* Real-time Progress Bar */}
                  {loading && (
                    <div className="w-full bg-dark-800 rounded-full h-3 mb-2 overflow-hidden border border-white/10 relative">
                      <div 
                        className="bg-gradient-to-r from-accent-violet to-accent-neon h-3 rounded-full transition-all duration-300 shadow-glow-violet" 
                        style={{ width: `${Math.round(uploadProgress)}%` }}
                      ></div>
                      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none"></div>
                    </div>
                  )}
                  {loading && (
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-accent-neon animate-pulse">Transmitting Payload...</span>
                      <span className="text-white">{Math.round(uploadProgress)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stepper Controls */}
            <div className="mt-10 flex justify-between pt-6 border-t border-white/10">
              {step > 1 ? (
                <button type="button" onClick={handleBack} disabled={loading} className="btn-secondary flex items-center gap-2">
                  <HiArrowLeft /> Previous
                </button>
              ) : <div/>}

              {step < 3 ? (
                <button type="button" onClick={() => {
                  if (step === 1 && !formData.title) return toast.error('Title is required');
                  if (step === 1 && !formData.description) return toast.error('Description is required');
                  if (step === 2 && !files.appFile) return toast.error('Payload binary required');
                  if (step === 2 && !files.icon) return toast.error('Icon required');
                  handleNext();
                }} className="btn-primary flex items-center gap-2 px-8">
                  Next Sequence <HiArrowRight />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="btn-success flex items-center gap-2 px-10 shadow-glow-emerald active:scale-95">
                  {loading ? 'Transmitting...' : 'Deploy Now'} <HiOutlineSparkles />
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default UploadApp;
