import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  HiCog, HiPhotograph, HiUpload, HiTrash, HiCheckCircle, 
  HiArrowLeft, HiDeviceMobile, HiPencil, HiCloudUpload as HiArrowUpTray 
} from 'react-icons/hi';

const EditApp = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [app, setApp] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    title: '', description: '', shortDescription: '', 
    tagline: '', category: '', platform: '', version: '', 
    developerName: '', tags: ''
  });
  
  const [files, setFiles] = useState({ newIcon: null, newScreenshots: [], newAppFile: null });

  useEffect(() => {
    loadApp();
  }, [id]);

  const loadApp = async () => {
    try {
      const { data } = await api.get(`/apps/${id}`);
      const appData = data.app;
      setApp(appData);
      setFormData({
        title: appData.title || '',
        description: appData.description || '',
        shortDescription: appData.shortDescription || '',
        tagline: appData.tagline || '',
        category: appData.category || '',
        platform: appData.platform || '',
        version: appData.version || '',
        developerName: appData.developerName || '',
        tags: Array.isArray(appData.tags) ? appData.tags.join(', ') : ''
      });
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load project details');
      navigate('/developer');
    }
  };

  const handleMetadataUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/apps/${id}`, formData);
      toast.success('Project metadata synchronized perfectly!');
    } catch (error) {
      toast.error('Failed to update metadata');
    } finally {
      setSaving(false);
    }
  };

  const handleIconUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const iconFormData = new FormData();
    iconFormData.append('icon', file);
    
    setSaving(true);
    try {
      const { data } = await api.post(`/apps/${id}/images`, iconFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setApp(data.app);
      toast.success('Neural Icon Updated!');
    } catch (error) {
      toast.error('Icon transmission failed');
    } finally {
      setSaving(false);
    }
  };

  const handleScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const ssFormData = new FormData();
    files.forEach(f => ssFormData.append('screenshots', f));
    
    setSaving(true);
    try {
      const { data } = await api.post(`/apps/${id}/images`, ssFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setApp(data.app);
      toast.success('Visual telemetry added!');
    } catch (error) {
      toast.error('Assets transmission failed');
    } finally {
      setSaving(false);
    }
  };

  const removeScreenshot = async (url) => {
    if (!window.confirm('Delete this visual asset?')) return;
    setSaving(true);
    try {
      const { data } = await api.delete(`/apps/${id}/screenshot`, { data: { screenshotUrl: url } });
      setApp(prev => ({ ...prev, screenshots: data.screenshots }));
      toast.success('Asset removed from cloud');
    } catch (error) {
      toast.error('Removal failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAppFileReplacement = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm('Replace existing payload? This will delete the old cloud binary.')) return;

    setSaving(true);
    setUploadProgress(0);
    const toastId = 'upload-edit';
    
    try {
      toast.loading('Initializing Neural Overwrite...', { id: toastId });
      
      const CHUNK_SIZE = 5 * 1024 * 1024;
      const totalPartCount = Math.ceil(file.size / CHUNK_SIZE);
      
      const initRes = await api.post('/apps/init-upload', { fileName: file.name, contentType: file.type });
      const { uploadId, filePath } = initRes.data;
      
      const parts = [];
      for (let i = 0; i < totalPartCount; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunk = file.slice(start, end);
        
        const chunkFormData = new FormData();
        chunkFormData.append('appFile', chunk);
        chunkFormData.append('chunkIndex', i);
        chunkFormData.append('uploadId', uploadId);
        chunkFormData.append('filePath', filePath);
        
        const chunkRes = await api.post('/apps/upload-chunk', chunkFormData);
        parts.push({ ETag: chunkRes.data.etag, PartNumber: chunkRes.data.partNumber });
        setUploadProgress((i + 1) / totalPartCount * 90);
      }
      
      const combineRes = await api.post('/apps/combine-chunks', { uploadId, filePath, parts, fileName: file.name });
      
      // Update the app record with the new binary URL
      await api.put(`/apps/${id}`, {
        fileUrl: combineRes.data.url,
        fileName: file.name,
        fileSize: file.size
      });

      setUploadProgress(100);
      toast.success('Payload overwritten successfully!', { id: toastId });
      loadApp();
    } catch (error) {
      toast.error('Payload overwrite failed', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-accent-neon border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-background-dark">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-violet/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent-neon/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent-violet to-accent-neon rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition" />
              <img src={app.icon} className="w-24 h-24 rounded-3xl object-cover relative z-10 border border-white/20 shadow-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">{app.title}</h1>
              <p className="text-accent-neon font-mono text-sm tracking-widest mt-1 uppercase">ARCHITECT EDIT MODE</p>
            </div>
          </div>
          <button onClick={() => navigate('/developer')} className="btn-secondary flex items-center gap-2">
            <HiArrowLeft /> Back to Dashboard
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 p-1.5 glass-panel rounded-2xl mb-8 w-fit mx-auto md:mx-0">
          {[
            { id: 'general', label: 'Metadata', icon: HiCog },
            { id: 'assets', label: 'Visual Assets', icon: HiPhotograph },
            { id: 'payload', label: 'Binary Payload', icon: HiUpload }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-accent-violet to-accent-neon text-white shadow-glow-violet' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <motion.div 
          key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 md:p-10 rounded-[2.5rem] border border-white/10"
        >
          {activeTab === 'general' && (
            <form onSubmit={handleMetadataUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Project Identity</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field shadow-none" placeholder="App Title" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Tagline</label>
                  <input type="text" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} className="input-field shadow-none" placeholder="Catchy Tagline" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Detailed Narrative</label>
                <textarea rows="5" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field shadow-none min-h-[150px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Classification</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="select-field">
                    {['Games', 'Social', 'Productivity', 'Tools', 'Entertainment', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Platform Matrix</label>
                  <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className="select-field">
                    {['Windows', 'Android', 'macOS', 'Linux', 'Cross-platform'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Version Index</label>
                  <input type="text" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="input-field shadow-none" />
                </div>
              </div>
              <div className="flex justify-end pt-6 border-t border-white/10">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-10">
                  {saving ? 'Synchronizing...' : <><HiCheckCircle /> Synchronize Metadata</>}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><HiPencil className="text-accent-violet" /> Neural Identity (Icon)</h3>
                  <div className="flex items-center gap-6 p-6 glass-panel rounded-3xl bg-white/5 border-dashed border-2 border-white/10">
                    <img src={app.icon} className="w-20 h-20 rounded-2xl object-cover shadow-2xl border border-white/20" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-3 font-medium">Resolution Optimized @ 80%</p>
                      <label className="btn-secondary text-xs px-4 py-2 cursor-pointer inline-flex items-center gap-2">
                        <HiArrowUpTray /> Replace Icon
                        <input type="file" className="hidden" onChange={handleIconUpdate} accept="image/*" />
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><HiPhotograph className="text-accent-emerald" /> Supplement Visuals</h3>
                  <label className="w-full h-[132px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group">
                    <HiUpload className="w-8 h-8 text-gray-500 group-hover:text-accent-emerald transition-colors" />
                    <span className="text-sm text-gray-500 font-bold mt-2">Add New Screenshots</span>
                    <input type="file" multiple className="hidden" onChange={handleScreenshotUpload} accept="image/*" />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6">Gallery Matrix</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {app.screenshots.map((ss, idx) => (
                    <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group shadow-glass">
                      <img src={ss} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => removeScreenshot(ss)} className="p-3 bg-rose-500/20 text-rose-400 rounded-full hover:bg-rose-500 hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0 shadow-glow-rose">
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {app.screenshots.length === 0 && (
                    <div className="col-span-full py-10 text-center text-gray-500 font-medium italic border border-white/5 rounded-2xl">
                      No visuals currently synchronized in the gallery.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payload' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-accent-neon/10 rounded-3xl mx-auto flex items-center justify-center mb-6 border border-accent-neon/20 shadow-glow-neon/20">
                <HiDeviceMobile className="w-10 h-10 text-accent-neon" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Project Payload</h3>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto">Current Binary: <span className="text-white font-mono">{app.fileName || 'app_payload'}</span></p>
              
              <div className="max-w-md mx-auto p-8 glass-panel rounded-[2rem] bg-white/5 border-white/10">
                <p className="text-sm text-gray-400 mb-6 font-medium">Initiating a NEW upload will automatically delete the old binary from the cloud matrix to optimize storage.</p>
                
                {saving && activeTab === 'payload' && (
                  <div className="mb-6">
                    <div className="w-full bg-dark-800 rounded-full h-2 mb-2">
                      <div className="bg-accent-neon h-2 rounded-full transition-all duration-300 shadow-glow-neon" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs font-bold text-accent-neon animate-pulse">{Math.round(uploadProgress)}% OVERWRITING PAYLOAD...</p>
                  </div>
                )}

                <label className="btn-primary flex items-center justify-center gap-2 cursor-pointer shadow-glow-violet disabled:opacity-50">
                  <HiArrowUpTray className="w-5 h-5" /> {saving ? 'Neural Link Active...' : 'Upload New Version'}
                  <input type="file" className="hidden" disabled={saving} onChange={handleAppFileReplacement} />
                </label>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EditApp;
