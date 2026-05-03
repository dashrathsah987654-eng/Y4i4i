import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Crown, Bell, Moon, RefreshCw, LogOut, Shield } from 'lucide-react';
import MentorImage from '../components/MentorImage';
import { useAppStore } from '../store/useAppStore';
import { mentors } from '../lib/mentors';
import { useAuth } from '../components/AuthProvider';
import { logout } from '../lib/firebase';
import clsx from 'clsx';

export default function Profile() {
  const navigate = useNavigate();
  const { questionsAskedToday, debatesStartedToday, isPremium, chatHistory, favoriteMentorId, setPremium } = useAppStore();
  const { isAdmin } = useAuth();

  const totalInteractions = Object.values(chatHistory).reduce((acc, curr) => acc + curr.length, 0);
  
  let favoriteMentor = mentors.find(m => m.id === favoriteMentorId);
  if (!favoriteMentor) {
    let maxMsg = 0;
    let fallbackId = mentors[0].id;
    for (const [mId, msgs] of Object.entries(chatHistory)) {
      if (msgs.length > maxMsg) {
        maxMsg = msgs.length;
        fallbackId = mId;
      }
    }
    favoriteMentor = mentors.find(m => m.id === fallbackId);
  }

  return (
    <motion.div 
      className="flex-1 flex flex-col bg-black relative overflow-hidden h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Cinematic Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-gold/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-40 pt-16 px-8 flex justify-between items-center pb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all flex items-center gap-2 group shadow-inner"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] pr-1">Back</span>
        </button>
        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-primary-gold">Subject Portrait</span>
      </div>

      <div className="px-8 flex-1 overflow-y-auto pb-40 z-10 custom-scrollbar pt-12">
        {/* Profile Status Card */}
        <div className="bg-premium-card border border-primary-gold/20 rounded-[48px] p-12 relative overflow-hidden mb-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Crown size={120} className="text-primary-gold -rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto rounded-[32px] bg-black border-2 border-primary-gold/30 flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <Crown size={44} className={isPremium ? "text-primary-gold animate-pulse" : "text-white/10"} />
            </div>
            
            <h3 className="font-serif text-3xl text-white mb-3 tracking-tight">
              {isPremium ? 'Elite Member' : 'Standard Guest'}
            </h3>
            <p className="text-[10px] font-sans text-primary-gold font-bold leading-none uppercase tracking-[0.3em] opacity-60">
              Clearance Level: {isPremium ? "Sovereign" : "Standard"}
            </p>
          </div>

          <div className="mt-16 space-y-6 relative z-10 text-left">
            <div className="flex justify-between items-center py-5 border-b border-white/5">
              <span className="text-[10px] font-sans text-white/30 uppercase tracking-[0.2em] font-bold">Strongest Resonance</span>
              <div className="flex items-center gap-3">
                {favoriteMentor && (
                  <MentorImage 
                    src={favoriteMentor.imageUrl}
                    fallback={favoriteMentor.imageFallback}
                    alt={favoriteMentor.name}
                    size="sm"
                    containerClassName="rounded-full border border-primary-gold/20"
                  />
                )}
                <span className="text-sm font-serif text-white/80">{favoriteMentor?.name || "None"}</span>
              </div>
            </div>
            {[
              { label: 'Insights Remaining', value: isPremium ? 'Unlimited' : Math.max(0, 5 - questionsAskedToday), color: 'text-primary-gold' },
              { label: 'Debates Remaining', value: isPremium ? 'Unlimited' : Math.max(0, 2 - debatesStartedToday), color: 'text-primary-gold' },
              { label: 'Total Interactions', value: totalInteractions, color: 'text-white/80' },
            ].map((stat, i) => (
              <div key={i} className="flex justify-between items-center py-5 border-b border-white/5 last:border-0">
                <span className="text-[10px] font-sans text-white/30 uppercase tracking-[0.2em] font-bold">{stat.label}</span>
                <span className={clsx("text-sm font-serif", stat.color)}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => !isPremium && setPremium(true)}
            className="w-full mt-16 py-6 bg-primary-gold text-black rounded-2xl font-bold text-[11px] uppercase tracking-[0.3em] shadow-[0_15px_35px_rgba(201,168,76,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isPremium ? 'Manage Subscription' : 'Upgrade to Sovereign'}
          </button>
        </div>

        {/* Global Settings List */}
        <div className="space-y-6">
          <h3 className="text-[11px] font-sans text-white/20 uppercase tracking-[0.4em] pl-4 mb-6 font-bold">Chamber Settings</h3>
          <div className="bg-premium-card border border-white/5 rounded-[40px] overflow-hidden divide-y divide-white/5 shadow-2xl">
            
            <div className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 flex items-center justify-center bg-black rounded-2xl border border-white/5 text-primary-gold/40">
                  <Moon size={20} />
                </div>
                <div>
                   <span className="text-[15px] text-white font-serif block tracking-wide">Dark Mode</span>
                   <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-widest mt-1">Permanently Optimized</span>
                </div>
              </div>
              <div className="px-5 py-2 bg-primary-gold/10 border border-primary-gold/30 text-primary-gold text-[9px] font-bold uppercase tracking-widest rounded-xl">Enabled</div>
            </div>

            <div className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 flex items-center justify-center bg-black rounded-2xl border border-white/5 text-white/20 group-hover:text-primary-gold/60 transition-colors">
                  <Bell size={20} />
                </div>
                <div>
                  <span className="text-[15px] text-white font-serif block tracking-wide">Daily Wisdom</span>
                  <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-widest mt-1">Push Notifications</span>
                </div>
              </div>
               <div className="w-12 h-6 bg-black border border-primary-gold/40 rounded-full relative p-1 shadow-inner">
                 <div className="absolute right-1 w-4 h-4 bg-primary-gold rounded-full shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
               </div>
            </div>

            {isAdmin && (
              <Link 
                to="/admin"
                className="p-8 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 flex items-center justify-center bg-black rounded-2xl border border-white/5 text-primary-gold/60">
                    <Shield size={20} />
                  </div>
                  <div>
                    <span className="text-[15px] text-primary-gold font-serif block tracking-wide">Nexus Control</span>
                    <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-widest mt-1">Admin Dashboard</span>
                  </div>
                </div>
              </Link>
            )}

            <div 
              onClick={() => { logout(); navigate('/login'); }}
              className="p-8 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 flex items-center justify-center bg-black rounded-2xl border border-white/5 text-red-500/40 group-hover:text-red-500 transition-colors">
                  <LogOut size={20} />
                </div>
                <div>
                  <span className="text-[15px] text-red-500 font-serif block tracking-wide">Logout</span>
                  <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-widest mt-1">End Current Session</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
