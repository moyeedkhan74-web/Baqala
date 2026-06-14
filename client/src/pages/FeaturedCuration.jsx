import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  Star, 
  Plus, 
  Trash2, 
  Search,
  Image,
  X,
  Loader2,
  Trophy,
  MousePointer2,
  Upload,
  Eye
} from 'lucide-react';
import { cn } from '../utils/cn.js';
import api, { API_BASE_URL } from '../api/axios';
import toast from 'react-hot-toast';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/')) {
    const host = API_BASE_URL.replace(/\/api$/, '');
    return `${host}${url}`;
  }
  return url;
};

const FeaturedCuration = () => {
  const [allApps, setAllApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [uploadingBannerId, setUploadingBannerId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const bannerInputRef = useRef({});

  const fetchApps = async () => {
    try {
      const { data } = await api.get('/admin/apps');
      setAllApps(data.apps);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const featuredApps = allApps.filter(a => a.isFeatured);
  const availableApps = allApps.filter(a => !a.isFeatured && a.status === 'approved');
  const filteredAvailable = availableApps.filter(a => 
    a.title.toLowerCase().includes(addSearch.toLowerCase()) ||
    (typeof a.developer === 'object' && a.developer?.name?.toLowerCase().includes(addSearch.toLowerCase()))
  );

  const toggleFeatured = async (appId) => {
    setTogglingId(appId);
    try {
      const { data } = await api.patch(`/admin/apps/${appId}/featured`);
      setAllApps(prev => prev.map(a => a._id === appId ? { ...a, isFeatured: data.isFeatured } : a));
      toast.success(data.message);
      if (showAddModal && data.isFeatured) setShowAddModal(false);
    } catch (error) {
      toast.error('Failed to toggle featured status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleBannerUpload = async (appId, file) => {
    if (!file) return;
    setUploadingBannerId(appId);
    const formData = new FormData();
    formData.append('banner', file);
    try {
      const { data } = await api.post(`/apps/${appId}/images`, formData);
      setAllApps(prev => prev.map(a => a._id === appId ? { ...a, banner: data.app.banner } : a));
      toast.success('Banner uploaded!');
    } catch (error) {
      toast.error('Banner upload failed');
    } finally {
      setUploadingBannerId(null);
    }
  };

  const removeBanner = async (appId) => {
    if (!window.confirm('Remove this promotional banner?')) return;
    setUploadingBannerId(appId);
    try {
      await api.put(`/apps/${appId}`, { banner: '' });
      setAllApps(prev => prev.map(a => a._id === appId ? { ...a, banner: '' } : a));
      toast.success('Banner removed');
    } catch (error) {
      toast.error('Failed to remove banner');
    } finally {
      setUploadingBannerId(null);
    }
  };

  const appOfTheWeek = featuredApps.length > 0 ? featuredApps[0] : null;

  return (
    <AdminLayout title="Homepage Curation">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Featured List */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Featured Apps</h2>
                <p className="text-sm text-slate-500 font-bold">
                  {loading ? 'Loading...' : `${featuredApps.length} apps in the Hero Slider`}
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-accent-violet text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-accent-violet/20 hover:scale-105 transition-transform"
              >
                <Plus className="w-4 h-4" /> Add App
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-accent-violet animate-spin" />
              </div>
            ) : featuredApps.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold">No featured apps yet</p>
                <p className="text-sm mt-1">Click "Add App" to feature your first app on the home page.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {featuredApps.map((app, index) => (
                  <div key={app._id} className="bg-accent-violet/[0.03] dark:bg-accent-violet/[0.05] rounded-2xl border border-accent-violet/20 hover:border-accent-violet/50 transition-all overflow-hidden shadow-sm shadow-accent-violet/5">
                    {/* App Info Row */}
                    <div className="flex items-center gap-4 p-4">
                      <div className="text-xs font-black text-slate-400 w-6 text-center">{index + 1}</div>
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-center shrink-0">
                        <img 
                          src={getImageUrl(app.icon)} 
                          alt={app.title} 
                          className="w-8 h-8 object-contain" 
                          onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 dark:text-white truncate">{app.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                          {typeof app.developer === 'object' ? app.developer?.name : (app.developerName || 'Developer')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Banner Upload */}
                        <label 
                          className={cn(
                            "p-2.5 rounded-xl cursor-pointer transition-all",
                            app.banner 
                              ? "text-emerald-500 hover:bg-emerald-500/10" 
                              : "text-slate-400 hover:text-accent-violet hover:bg-accent-violet/10",
                            uploadingBannerId === app._id && "opacity-50 pointer-events-none"
                          )}
                          title={app.banner ? "Replace banner" : "Upload banner"}
                        >
                          {uploadingBannerId === app._id 
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <Image className="w-5 h-5" />
                          }
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleBannerUpload(app._id, e.target.files[0])}
                          />
                        </label>
                        {/* View App */}
                        <a 
                          href={`/app/${app._id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          title="View app page"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        {/* Remove from Featured */}
                        <button 
                          onClick={() => toggleFeatured(app._id)} 
                          disabled={togglingId === app._id}
                          className="p-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Remove from featured"
                        >
                          {togglingId === app._id 
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <Trash2 className="w-5 h-5" />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Banner Preview */}
                    {app.banner && (
                      <div className="mx-4 mb-4 relative rounded-xl overflow-hidden border border-white/10 group">
                        <img 
                          src={getImageUrl(app.banner)} 
                          alt={`${app.title} banner`}
                          className="w-full h-32 object-cover"
                          onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <label className="p-2 bg-white/20 text-white rounded-full hover:bg-accent-violet cursor-pointer transition-all">
                            <Upload className="w-4 h-4" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleBannerUpload(app._id, e.target.files[0])}
                            />
                          </label>
                          <button 
                            onClick={() => removeBanner(app._id)} 
                            className="p-2 bg-rose-500/20 text-rose-400 rounded-full hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/80 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                          Banner Active
                        </div>
                      </div>
                    )}
                    
                    {/* No Banner Notice */}
                    {!app.banner && (
                      <label className="mx-4 mb-4 h-20 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center gap-2 text-sm text-slate-400 cursor-pointer hover:bg-accent-violet/5 hover:border-accent-violet/30 transition-all">
                        <Upload className="w-4 h-4" /> Upload a promotional banner (1200×500)
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleBannerUpload(app._id, e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* App of the Week */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-4 border-accent-violet/20 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4">
              <Trophy className="w-12 h-12 text-accent-violet opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            </div>
            
            <div className="p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-violet text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-accent-violet/20">
                <Star className="w-3 h-3 fill-current" /> Top Featured
              </div>
              
              {appOfTheWeek ? (
                <>
                  <img 
                    src={getImageUrl(appOfTheWeek.icon)} 
                    alt={appOfTheWeek.title} 
                    className="w-32 h-32 mx-auto rounded-[2rem] bg-white dark:bg-white/5 p-4 shadow-2xl mb-6 hover:scale-110 transition-transform duration-500 border border-slate-100 dark:border-white/10 object-contain" 
                    onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png'; }}
                  />
                  <div className="text-center space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{appOfTheWeek.title}</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                      {typeof appOfTheWeek.developer === 'object' ? appOfTheWeek.developer?.name : (appOfTheWeek.developerName || 'Developer')}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <Star className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">No featured apps</p>
                </div>
              )}
            </div>
          </div>

          {/* Tip */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <div className="flex items-center gap-3 mb-6">
              <MousePointer2 className="text-accent-violet w-6 h-6" />
              <h2 className="text-lg font-black tracking-tight">Curation Tip</h2>
            </div>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">
              Featured apps see up to <span className="text-white">400% more downloads</span>. Upload promotional banners for maximum impact on the Hero Slider. Try to rotate featured apps every 3-4 days to keep the store fresh.
            </p>
          </div>
        </div>
      </div>

      {/* Add App Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Add to Featured</h3>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  {availableApps.length} approved apps available
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {/* Search */}
            <div className="px-6 py-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by name or developer..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-accent-violet/30 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* App List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
              {filteredAvailable.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="font-bold text-sm">No apps found</p>
                </div>
              ) : (
                filteredAvailable.map(app => (
                  <div 
                    key={app._id} 
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-center shrink-0">
                      <img 
                        src={getImageUrl(app.icon)} 
                        alt={app.title} 
                        className="w-7 h-7 object-contain" 
                        onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-900 dark:text-white truncate">{app.title}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">
                        {typeof app.developer === 'object' ? app.developer?.name : (app.developerName || 'Developer')}
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleFeatured(app._id)}
                      disabled={togglingId === app._id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-accent-violet text-white text-xs font-black uppercase tracking-wider rounded-xl opacity-0 group-hover:opacity-100 hover:scale-105 transition-all shadow-lg shadow-accent-violet/20 disabled:opacity-50"
                    >
                      {togglingId === app._id 
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Star className="w-3.5 h-3.5" />
                      }
                      Feature
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default FeaturedCuration;
