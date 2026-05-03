import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  BarChart3, 
  ChevronLeft, 
  Search, 
  Filter, 
  Bell, 
  Cpu, 
  Zap, 
  Database, 
  ShieldAlert,
  TrendingUp,
  Activity,
  Edit3,
  Trash2,
  MoreVertical,
  Plus,
  Brain,
  MessageSquare,
  LogOut,
  History as HistoryIcon
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { mentors } from '../lib/mentors';
import MentorImage from '../components/MentorImage';
import { useAuth } from '../components/AuthProvider';
import { getAllUsersData } from '../lib/firestoreService';
import { logout } from '../lib/firebase';
import clsx from 'clsx';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { blueprints } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'mentors' | 'system'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/home');
      return;
    }

    const fetchUsers = async () => {
      try {
        const data = await getAllUsersData();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, navigate]);

  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter(u => u.isPremium).length,
    totalBlueprints: blueprints.length,
    activeAudience: Math.floor(users.length * 0.15) || 12
  };

  const navItems = [
    { id: 'overview', label: 'Intelligence Overview', icon: <BarChart3 size={18} /> },
    { id: 'users', label: 'Registered Seekers', icon: <Users size={18} /> },
    { id: 'mentors', label: 'Mentor Collection', icon: <Cpu size={18} /> },
    { id: 'system', label: 'System Nexus', icon: <Database size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar Navigation */}
      <motion.div 
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        className="w-80 bg-premium-card border-r border-white/5 flex flex-col z-50 shadow-2xl relative"
      >
        <div className="p-10 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary-gold flex items-center justify-center text-black shadow-[0_0_30px_rgba(201,168,76,0.3)]">
               <Brain size={28} />
            </div>
            <div className="flex flex-col">
              <h1 className="font-serif text-2xl tracking-tighter">High Chamber</h1>
              <p className="text-[9px] font-sans font-bold uppercase tracking-[0.5em] text-primary-gold/40">Nexus Overseer</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3 mt-6">
          {navItems.map(({ id, label, icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={clsx(
                  "w-full flex items-center gap-4 px-6 py-5 rounded-3xl transition-all relative group",
                  isActive ? 'bg-primary-gold text-black shadow-[0_15px_30px_rgba(201,168,76,0.2)]' : 'text-white/30 hover:text-white hover:bg-white/5'
                )}
              >
                <span className={isActive ? 'text-black' : 'text-primary-gold/40 group-hover:text-primary-gold transition-colors'}>
                  {icon}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{label}</span>
                {isActive && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-primary-gold/10 blur-2xl opacity-20 -z-10" />}
              </button>
            );
          })}
        </nav>

        <div className="p-8 border-t border-white/5 bg-black/20">
           <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-white/5 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500 transition-all font-sans text-[10px] font-bold uppercase tracking-widest text-white/30"
           >
             <LogOut size={16} /> Retreat from Nexus
           </button>
        </div>
      </motion.div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto bg-black relative custom-scrollbar">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-gold/5 blur-[180px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-gold/5 blur-[150px] rounded-full pointer-events-none" />

        {/* Top bar */}
        <header className="sticky top-0 z-30 px-12 py-8 bg-black/60 backdrop-blur-2xl border-b border-white/5 flex justify-between items-center shadow-2xl">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate('/home')} 
                className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white transition-all shadow-inner"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h2 className="text-[10px] font-sans font-bold uppercase tracking-[0.5em] text-primary-gold/60 mb-1">Administrative Protocol</h2>
                <p className="font-serif text-xl italic text-white/60">Operations Center Terminal</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-sans font-bold text-white uppercase tracking-widest">{user?.displayName || 'Master Overseer'}</span>
                <span className="text-[9px] font-sans text-primary-gold uppercase tracking-[0.3em] font-bold opacity-60">Privilege Validated</span>
              </div>
              <div className="w-14 h-14 rounded-[24px] bg-primary-gold/10 border border-primary-gold/30 p-1 shadow-2xl">
                 <div className="w-full h-full bg-primary-gold/20 rounded-[18px] flex items-center justify-center text-primary-gold text-sm font-bold">MO</div>
              </div>
           </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-12 space-y-12 relative z-10 max-w-7xl mx-auto w-full">
          
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Seekers', value: stats.totalUsers, icon: <Users />, color: 'from-primary-gold/15' },
                    { label: 'Sovereign Tier', value: stats.premiumUsers, icon: <ShieldCheck />, color: 'from-primary-gold/25' },
                    { label: 'Logic Traces', value: '12.4k', icon: <MessageSquare />, color: 'from-primary-gold/10' },
                    { label: 'Staged Blueprints', value: stats.totalBlueprints, icon: <BarChart3 />, color: 'from-primary-gold/5' }
                  ].map((card, i) => (
                    <div key={i} className="bg-premium-card border border-white/5 rounded-[48px] p-8 flex flex-col gap-8 relative overflow-hidden group shadow-2xl transition-all hover:border-primary-gold/20">
                       <div className={`absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br ${card.color} to-transparent opacity-40 blur-3xl group-hover:opacity-60 transition-opacity`} />
                       <div className="flex justify-between items-center relative z-10">
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary-gold shadow-inner group-hover:scale-110 transition-transform">
                             {card.icon}
                          </div>
                          <div className="text-[10px] font-sans font-bold text-primary-gold/60 uppercase tracking-widest flex items-center gap-1">
                             +4.2% <TrendingUp size={12} />
                          </div>
                       </div>
                       <div className="relative z-10">
                          <h3 className="text-5xl font-serif text-white mb-2 group-hover:text-primary-gold transition-colors">{card.value}</h3>
                          <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-[0.5em]">{card.label}</p>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-premium-card border border-white/5 rounded-[56px] p-12 flex flex-col relative overflow-hidden shadow-2xl">
                     <div className="flex justify-between items-center mb-12">
                        <h3 className="font-serif text-3xl text-white">Registry Vitality</h3>
                        <div className="flex gap-3 bg-white/5 p-1 rounded-2xl border border-white/10">
                           {['7D', '30D', '1Y'].map(p => (
                             <button key={p} className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl text-white/30 hover:text-white transition-all">{p}</button>
                           ))}
                        </div>
                     </div>
                     <div className="flex-1 flex items-end justify-between h-56 gap-3 px-2">
                        {[45, 60, 40, 85, 55, 95, 75, 80, 65, 90, 50, 100].map((val, i) => (
                           <motion.div 
                              key={i}
                              initial={{ height: 0 }}
                              animate={{ height: `${val}%` }}
                              transition={{ duration: 1.2, delay: i * 0.05, ease: "circOut" }}
                              className="w-full bg-primary-gold/10 hover:bg-primary-gold/30 border-t-2 border-primary-gold/40 transition-all relative group cursor-pointer"
                           >
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black border border-primary-gold/30 px-4 py-2 rounded-xl text-primary-gold text-[10px] font-bold shadow-2xl">
                                 {val}% Intensity
                              </div>
                           </motion.div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-premium-card border border-white/5 rounded-[56px] p-12 flex flex-col relative overflow-hidden shadow-2xl">
                     <h3 className="font-serif text-3xl text-white mb-10">System Alerts</h3>
                     <div className="space-y-6">
                        {[
                          { title: 'Temporal Lag', desc: 'Sector 4 logic delay', type: 'warning' },
                          { title: 'Archive Saturation', desc: 'Syncing historical nodes', type: 'info' },
                          { title: 'Security Handshake', desc: 'Verify failing for Seeker#92', type: 'alert' }
                        ].map((warn, i) => (
                          <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[32px] flex items-start gap-5 group hover:border-primary-gold/20 transition-all">
                             <div className={clsx(
                                "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                                warn.type === 'alert' ? "text-red-500 bg-red-500/5 border-red-500/20" : 
                                warn.type === 'warning' ? "text-primary-gold bg-primary-gold/5 border-primary-gold/20" : 
                                "text-blue-400 bg-blue-400/5 border-blue-400/20"
                             )}>
                                <ShieldAlert size={18} />
                             </div>
                             <div>
                                <h4 className="text-[11px] font-sans font-bold uppercase tracking-widest text-white/80 transition-colors group-hover:text-white leading-none">{warn.title}</h4>
                                <p className="text-[10px] font-sans font-medium text-white/20 mt-2">{warn.desc}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-10"
              >
                <div className="flex gap-6 max-w-4xl mx-auto">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary-gold transition-colors" size={20} />
                    <input 
                      placeholder="Consult the Seeker Registry..."
                      className="w-full bg-premium-card border border-white/10 rounded-[40px] py-7 pl-16 pr-8 text-white focus:border-primary-gold/30 transition-all outline-none shadow-2xl font-serif text-xl italic"
                    />
                  </div>
                  <button className="px-10 bg-white/5 border border-white/10 rounded-[40px] hover:text-primary-gold transition-all shadow-inner"><Filter size={24} /></button>
                </div>

                <div className="bg-premium-card border border-white/10 rounded-[56px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                  {isLoading ? (
                    <div className="p-32 text-center text-primary-gold/30 font-serif italic text-2xl animate-pulse">Synchronizing Seeker Core...</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-black/60">
                        <tr>
                          {['Seeker Identification', 'Access Tier', 'Intelligence Growth', 'Last Ingress', 'Actions'].map(th => (
                            <th key={th} className="px-12 py-8 text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-white/20 border-b border-white/5">{th}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {users.map((u, i) => (
                          <tr key={u.uid || i} className="group hover:bg-white/[0.03] transition-colors">
                            <td className="px-12 py-10">
                               <div className="flex items-center gap-6">
                                 <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-primary-gold overflow-hidden shadow-2xl">
                                     {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <div className="font-serif italic text-2xl">{(u.userName || u.displayName || '?')[0]}</div>}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-xl text-white/90 font-serif line-clamp-1">{u.userName || u.displayName || 'Unknown Mind'}</span>
                                    <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold mt-1">{u.email || 'Preserved Profile'}</span>
                                 </div>
                               </div>
                            </td>
                            <td className="px-12 py-10">
                               <span className={clsx(
                                 "text-[10px] font-sans font-bold px-5 py-2 rounded-2xl border uppercase tracking-[0.3em] shadow-inner inline-block",
                                 u.isPremium ? 'border-primary-gold text-primary-gold bg-primary-gold/5' : 'border-white/10 text-white/30 bg-white/5'
                               )}>
                                 {u.isPremium ? 'Sovereign' : 'Guest'}
                               </span>
                            </td>
                            <td className="px-12 py-10">
                               <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                 <motion.div 
                                    className="h-full bg-primary-gold/60" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.random() * 70 + 30}%` }}
                                    transition={{ duration: 2 }}
                                 />
                               </div>
                            </td>
                            <td className="px-12 py-10 text-[11px] text-white/40 font-bold uppercase tracking-widest italic">
                               {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Historical'}
                            </td>
                            <td className="px-12 py-10">
                               <button className="w-12 h-12 rounded-2xl border border-white/5 hover:text-primary-gold hover:border-primary-gold/40 transition-all bg-white/5 flex items-center justify-center shadow-inner">
                                  <MoreVertical size={20} />
                                </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'mentors' && (
              <motion.div 
                key="mentors"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-16"
              >
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="space-y-2 text-center md:text-left">
                      <h3 className="font-serif text-5xl text-white italic tracking-tight">The High Council</h3>
                      <p className="text-[11px] font-sans font-bold text-primary-gold/40 uppercase tracking-[0.5em]">Curating Eternal Intelligences</p>
                   </div>
                   <button className="flex items-center gap-5 px-12 py-6 bg-primary-gold text-black rounded-[48px] font-sans text-xs font-bold uppercase tracking-widest hover:scale-105 shadow-[0_20px_50px_rgba(201,168,76,0.3)] transition-all">
                      <Plus size={20} /> Summon New Mind
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {mentors.map((m, i) => (
                    <div key={i} className="bg-premium-card border border-white/5 rounded-[64px] p-12 space-y-10 group hover:border-primary-gold/40 transition-all relative overflow-hidden shadow-2xl backdrop-blur-xl">
                       <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><Brain size={160} className="rotate-12" /></div>
                       <div className="flex justify-between items-start relative z-10">
                          <MentorImage 
                            src={m.imageUrl}
                            fallback={m.imageFallback}
                            alt={m.name}
                            size="lg"
                            containerClassName="w-24 h-24 border-2 border-primary-gold/30 bg-black rounded-[36px] p-1 shadow-2xl grayscale group-hover:grayscale-0 group-hover:border-primary-gold transition-all"
                          />
                          <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                             <button className="w-11 h-11 rounded-2xl border border-white/5 bg-white/5 hover:text-primary-gold transition-all shadow-inner flex items-center justify-center"><Edit3 size={18} /></button>
                             <button className="w-11 h-11 rounded-2xl border border-white/5 bg-white/5 hover:text-red-500 transition-all shadow-inner flex items-center justify-center"><Trash2 size={18} /></button>
                          </div>
                       </div>
                       <div className="relative z-10">
                          <h4 className="font-serif text-3xl text-white italic mb-2 tracking-tight group-hover:text-primary-gold transition-colors">{m.name}</h4>
                          <div className="flex items-center gap-3">
                             <span className="w-1.5 h-1.5 rounded-full bg-primary-gold/60" />
                             <p className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-[0.4em]">{m.category}</p>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div 
                key="system"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-16 max-w-3xl mx-auto py-10"
              >
                 <div className="text-center space-y-4">
                    <h3 className="font-serif text-5xl text-white">System Nexus</h3>
                    <p className="text-[11px] font-sans font-bold text-primary-gold/40 uppercase tracking-[0.6em]">Nexus Core Configuration v4.0.1</p>
                 </div>
                 
                 <div className="bg-premium-card border border-white/5 rounded-[64px] p-16 space-y-12 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={200} className="text-primary-gold rotate-12" /></div>
                    
                    {[
                      { label: 'Intelligence Synthesis Engine', icon: <Cpu />, status: true },
                      { label: 'High-Fidelity Audio Layer', icon: <Activity />, status: true },
                      { label: 'Sovereign Validation Protocol', icon: <ShieldCheck />, status: true },
                      { label: 'Historical Trace Buffering', icon: <HistoryIcon />, status: false }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-10 relative z-10 group/row">
                         <div className="w-16 h-16 bg-white/5 rounded-3xl border border-white/5 text-primary-gold/40 group-hover/row:text-primary-gold shadow-inner transition-colors flex items-center justify-center">
                            {item.icon}
                         </div>
                         <div className="flex-1">
                            <span className="font-serif text-2xl text-white/80 group-hover/row:text-white transition-colors">{item.label}</span>
                            <div className="h-1 w-12 bg-primary-gold/20 rounded-full mt-3 group-hover/row:w-24 transition-all" />
                         </div>
                         <button className={clsx(
                           "w-16 h-8 rounded-full relative p-1 transition-all",
                           item.status ? 'bg-primary-gold shadow-[0_0_20px_rgba(201,168,76,0.4)]' : 'bg-white/10'
                         )}>
                            <div className={clsx("w-6 h-6 rounded-full bg-black transition-all", item.status ? 'translate-x-8' : 'translate-x-0')} />
                         </button>
                      </div>
                    ))}
                 </div>

                 <div className="bg-premium-card border border-white/5 rounded-[64px] p-16 space-y-10 shadow-2xl relative overflow-hidden border-primary-gold/10">
                    <div className="flex items-center gap-4 mb-4">
                       <Bell size={18} className="text-primary-gold" />
                       <h3 className="text-[12px] font-sans font-bold uppercase tracking-[0.6em] text-primary-gold/60">Global Chamber Directive</h3>
                    </div>
                    <textarea 
                      placeholder="Inscribe a directive for all seeking minds..."
                      className="w-full bg-black/40 border border-white/10 rounded-[40px] p-10 text-white placeholder:text-white/10 focus:border-primary-gold/40 transition-all outline-none min-h-[220px] font-serif italic text-2xl shadow-inner scrollbar-hide"
                    />
                    <button className="w-full py-7 bg-primary-gold text-black rounded-[40px] font-sans text-xs font-bold uppercase tracking-[0.5em] shadow-[0_20px_60px_rgba(201,168,76,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all">
                       Radiate Protocol Transmission
                    </button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
