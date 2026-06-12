import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  Star, 
  GripVertical, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Search,
  Layout,
  MousePointer2,
  Trophy
} from 'lucide-react';
import { cn } from '../utils/cn';

const FeaturedCuration = () => {
  const [featuredApps, setFeaturedApps] = useState([
    { id: '1', title: 'PhotoEdit Pro', developer: 'Alice Dev', icon: 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png' },
    { id: '2', title: 'Zombie Rush', developer: 'GameStudio X', icon: 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png' },
    { id: '3', title: 'TaskMaster', developer: 'Charlie Tools', icon: 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png' },
  ]);

  const [appOfTheWeek, setAppOfTheWeek] = useState(featuredApps[0]);

  return (
    <AdminLayout title="Homepage Curation">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Featured List */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Featured Apps</h2>
                <p className="text-sm text-slate-500 font-bold">Currently displayed in the top hero slider</p>
              </div>
              <button className="flex items-center gap-2 bg-accent-violet text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-accent-violet/20 hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" /> Add App
              </button>
            </div>

            <div className="space-y-4">
              {featuredApps.map((app, index) => (
                <div key={app.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-accent-violet/30 transition-all group">
                  <div className="cursor-grab active:cursor-grabbing text-slate-400">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-black text-slate-400 w-6">{index + 1}</div>
                  <img src={app.icon} alt="" className="w-10 h-10 rounded-xl object-contain bg-white p-1" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 dark:text-white truncate">{app.title}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{app.developer}</p>
                  </div>
                  <button className="p-2.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm p-8">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Section Controls</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Trending Section', active: true, desc: 'Sort by downloads count' },
                { name: 'New Releases', active: true, desc: 'Sort by submission date' },
                { name: 'Category Browsing', active: true, desc: 'Pill-based exploration' },
                { name: 'Promotional Banner', active: false, desc: 'Global site alerts' },
              ].map(section => (
                <div key={section.name} className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-between border border-transparent hover:border-white/10 transition-all">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{section.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{section.desc}</p>
                  </div>
                  <div className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                    section.active ? "bg-accent-violet" : "bg-slate-300 dark:bg-slate-700"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                      section.active ? "right-1" : "left-1"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* App of the Week Sidebar */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-4 border-accent-violet/20 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4">
              <Trophy className="w-12 h-12 text-accent-violet opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            </div>
            
            <div className="p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-violet text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-accent-violet/20">
                <Star className="w-3 h-3 fill-current" /> App of the Week
              </div>
              
              <img src={appOfTheWeek.icon} alt="" className="w-32 h-32 mx-auto rounded-[2rem] bg-white p-4 shadow-2xl mb-6 hover:scale-110 transition-transform duration-500 border border-slate-100" />
              
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{appOfTheWeek.title}</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{appOfTheWeek.developer}</p>
              </div>

              <button className="w-full mt-8 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-700 dark:text-white font-black text-xs uppercase tracking-widest hover:bg-accent-violet hover:text-white transition-all shadow-sm">
                Change Selection
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <div className="flex items-center gap-3 mb-6">
              <MousePointer2 className="text-accent-violet w-6 h-6" />
              <h2 className="text-lg font-black tracking-tight">Curation Tip</h2>
            </div>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">
              Featured apps see up to <span className="text-white">400% more downloads</span>. Try to rotate these apps every 3-4 days to keep the store fresh for returning users.
            </p>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default FeaturedCuration;
