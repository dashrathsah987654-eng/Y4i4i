import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  User, 
  Crown, 
  Flame, 
  Heart, 
  Headphones, 
  Lock, 
  Trash2, 
  Download, 
  RefreshCcw, 
  Fingerprint, 
  Box, 
  Zap, 
  History, 
  Clock, 
  BarChart3, 
  Info,
  Volume2,
  Check,
  Sparkles,
  Cpu
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { mentors } from '../lib/mentors';
import MentorImage from '../components/MentorImage';
import clsx from 'clsx';

const EXPERIENCE_MODES = [
  { id: 'Obsidian Gold', name: 'Obsidian Gold', description: 'Deep space black with liquid gold accents', colors: 'from-black via-[#111] to-[#0A0B1A]', accent: '#C9A84C' },
  { id: 'Cosmic Scholar', name: 'Cosmic Scholar', description: 'Stellar blue nebula with diamond highlights', colors: 'from-black via-[#000510] to-[#000A20]', accent: '#4C8DC9' },
  { id: 'Stoic Marble', name: 'Stoic Marble', description: 'Cool grey stone of classic philosophy', colors: 'from-black via-[#151515] to-[#252525]', accent: '#A8A8A8' },
  { id: 'Renaissance Ink', name: 'Renaissance Ink', description: 'Dark aged parchment and deep sepia', colors: 'from-[#050505] via-[#100D0A] to-[#1A1510]', accent: '#C98C4C' }
];

const CONVERSATION_STYLES = [
  'Gentle Guide', 'Strategic Challenger', 'Brutally Honest', 'Philosophical'
];

const AMBIENT_SOUNDS = [
  'Silent', 'Library Ambience', 'Cosmic Hum', 'Rain', 'Ancient Chamber'
];

export default function Settings() {
  const navigate = useNavigate();
  const [isEntering, setIsEntering] = useState(true);
  
  const { 
    userName, updateUserName,
    userAura, updateUserAura,
    conversationStyle, updateConversationStyle,
    mentorMemoryEnabled, setMentorMemoryEnabled,
    adaptiveIntelligenceEnabled, setAdaptiveIntelligenceEnabled,
    ambientSound, updateAmbientSound,
    ambientVolume, updateAmbientVolume,
    intelligenceLabSettings, updateIntelligenceLab,
    isPremium, setPremium,
    favoriteMentorId,
    questionsAskedToday,
    voiceDurationUsedToday,
    clearChatHistory
  } = useAppStore();

  const favoriteMentor = mentors.find(m => m.id === favoriteMentorId);

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isEntering) {
    return (
      <motion.div 
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="relative w-48 h-48 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 border border-primary-gold/20 rounded-full"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="w-full h-full border border-primary-gold/40 rounded-full flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-xl z-20">
            <Sparkles size={40} className="text-primary-gold mb-4 animate-pulse" />
            <span className="text-[10px] text-primary-gold font-bold uppercase tracking-[0.5em] text-center">Configuring Chamber</span>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex-1 flex flex-col bg-black relative h-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-gold/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-30 px-8 pt-16 pb-12 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-premium-card border border-primary-gold/20 flex items-center justify-center mb-6 shadow-2xl relative group overflow-hidden">
             <div className="absolute inset-0 bg-primary-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <User size={28} className="text-primary-gold" />
          </div>
          <h1 className="font-serif text-3xl text-white mb-1 tracking-tight">Personal Chamber</h1>
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-primary-gold/40">Refinement & Identity Controls</p>
        </motion.div>

        <button 
          onClick={() => navigate('/home')}
          className="absolute left-6 top-16 p-3 rounded-2xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all shadow-inner"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 relative z-20 space-y-12 pb-32 custom-scrollbar">
        
        {/* 1. Identity section */}
        <section className="space-y-6">
          <SectionTitle icon={<User size={16} />} title="Identity & Aura" />
          <SettingsCard>
            <div className="flex items-center gap-6 mb-8 group">
              <div className="w-20 h-20 rounded-[32px] border border-primary-gold/30 p-1 bg-black shadow-2xl relative overflow-hidden flex items-center justify-center">
                <User size={32} className="text-primary-gold/50" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-primary-gold mb-1">Elite Designation</p>
                <input 
                  value={userName}
                  onChange={(e) => updateUserName(e.target.value)}
                  className="bg-transparent border-none font-serif text-2xl text-white focus:outline-none w-full p-0"
                  placeholder="Your Name..."
                />
                <div className="mt-2 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-primary-gold shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                   <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-[0.2em]">{isPremium ? 'Elite Subscription' : 'Standard Guest'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatItem label="Days Joined" value="12" icon={<Flame size={14} className="text-primary-gold" />} />
              <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-[0.3em]">Deep Connection</span>
                  <Heart size={14} className="text-primary-gold/40" />
                </div>
                <div className="flex items-center gap-3">
                  {favoriteMentor && (
                    <MentorImage 
                      src={favoriteMentor.imageUrl}
                      fallback={favoriteMentor.imageFallback}
                      alt={favoriteMentor.name}
                      size="sm"
                      containerClassName="w-8 h-8 rounded-xl border border-primary-gold/20"
                    />
                  )}
                  <p className="font-serif text-base text-white/90">{favoriteMentor?.name || 'Exploring'}</p>
                </div>
              </div>
            </div>
          </SettingsCard>
        </section>

        {/* 2. Intelligence logic */}
        <section className="space-y-6">
          <SectionTitle icon={<Sparkles size={16} />} title="Intelligence Logic" />
          <SettingsCard className="space-y-8">
            <div>
              <label className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-[0.4em] block mb-5 pl-1">Conversational Style</label>
              <div className="grid grid-cols-2 gap-4">
                {CONVERSATION_STYLES.map(style => (
                  <button
                    key={style}
                    onClick={() => updateConversationStyle(style)}
                    className={clsx(
                      "px-5 py-4 rounded-2xl text-[11px] font-bold tracking-widest transition-all text-left flex items-center justify-between border uppercase",
                      conversationStyle === style 
                        ? "bg-primary-gold/10 border-primary-gold text-primary-gold" 
                        : "bg-white/5 border-white/5 text-white/30 hover:border-white/10"
                    )}
                  >
                    {style}
                    {conversationStyle === style && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow 
              icon={<History size={18} />} 
              label="Mentor Long-term Memory" 
              description="Allow mentors to remember previous insights and growth" 
              isActive={mentorMemoryEnabled}
              onToggle={() => setMentorMemoryEnabled(!mentorMemoryEnabled)}
            />

            <ToggleRow 
              icon={<Zap size={18} />} 
              label="Adaptive Intelligence" 
              description="Real-time adjustment of response depth based on context" 
              isActive={adaptiveIntelligenceEnabled}
              onToggle={() => setAdaptiveIntelligenceEnabled(!adaptiveIntelligenceEnabled)}
            />
          </SettingsCard>
        </section>

        {/* 3. Usage & Limits */}
        <section className="space-y-6">
          <SectionTitle icon={<BarChart3 size={16} />} title="Subscription Insights" />
          <SettingsCard className="space-y-8">
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                 <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-[0.3em]">Daily Insight Limit</span>
                 <span className="text-xl font-serif text-primary-gold tracking-tight">{isPremium ? 'Unlimited' : `${Math.max(0, 10 - questionsAskedToday)} / 10`}</span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                     className="h-full bg-primary-gold shadow-[0_0_15px_rgba(201,168,76,0.5)]"
                     initial={{ width: 0 }}
                     animate={{ width: isPremium ? '100%' : `${(Math.max(0, 10 - questionsAskedToday) / 10) * 100}%` }}
                     transition={{ duration: 1.5 }}
                  />
               </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
               <div className="flex justify-between items-end">
                 <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-[0.3em]">Live Audio Uplink</span>
                 <span className="text-xl font-serif text-primary-gold tracking-tight">
                   {isPremium ? 'Infinite' : `${Math.floor(Math.max(0, 180 - voiceDurationUsedToday) / 60)}m ${Math.max(0, 180 - voiceDurationUsedToday) % 60}s`}
                 </span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                     className="h-full bg-primary-gold/40 shadow-[0_0_15px_rgba(201,168,76,0.2)]"
                     initial={{ width: 0 }}
                     animate={{ width: isPremium ? '100%' : `${(Math.max(0, 180 - voiceDurationUsedToday) / 180) * 100}%` }}
                     transition={{ duration: 1.5 }}
                  />
               </div>
            </div>
            <p className="text-center text-[8px] font-sans font-bold text-white/10 uppercase tracking-[0.5em] pt-4 italic">Next limit reset in approximately 8 hours</p>
          </SettingsCard>
        </section>

        {/* 4. Privacy */}
        <section className="space-y-6">
          <SectionTitle icon={<Lock size={16} />} title="Privacy & Security" />
          <SettingsCard className="divide-y divide-white/5">
            <ActionRow 
              icon={<Trash2 size={18} className="text-red-500/60" />} 
              label="Clear Conversation History" 
              onClick={() => {
                if (confirm('Permanently delete all stored conversations? This cannot be undone.')) {
                  clearChatHistory();
                }
              }}
            />
            <ActionRow icon={<Download size={18} />} label="Export Personal Insights" onClick={() => {}} />
            <ActionRow icon={<Fingerprint size={18} />} label="Biometric Protection" hasToggle={true} isActive={false} onToggle={() => {}} />
          </SettingsCard>
        </section>

        {/* Footer */}
        <div className="pt-10 flex flex-col items-center space-y-4 opacity-10 pb-24">
           <div className="w-12 h-1 bg-primary-gold/40 rounded-full" />
           <p className="text-[10px] font-sans font-bold uppercase tracking-[0.6em] text-center">
             MentorMind Intelligence Framework<br/>
             v3.0.2 Premium Edition
           </p>
        </div>

      </div>
    </motion.div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-1 border-l-2 border-primary-gold/40">
      <span className="text-primary-gold">{icon}</span>
      <h2 className="text-[11px] font-sans font-bold uppercase tracking-[0.4em] text-white/40">{title}</h2>
    </div>
  );
}

function SettingsCard({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={clsx("bg-premium-card border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <Sparkles size={80} className="text-primary-gold -mr-10 -mt-10 rotate-12" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-[0.3em]">{label}</span>
        {icon}
      </div>
      <p className="font-serif text-lg text-white/90">{value}</p>
    </div>
  );
}

function ToggleRow({ icon, label, description, isActive, onToggle }: { 
  icon: React.ReactNode, 
  label: string, 
  description: string, 
  isActive: boolean,
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
        <span className="text-primary-gold/60">{icon}</span>
      </div>
      <div className="flex-1">
        <h4 className="text-[11px] uppercase font-sans font-bold tracking-widest text-white/80 leading-tight">{label}</h4>
        <p className="text-[10px] font-sans font-medium text-white/30 leading-snug mt-1.5">{description}</p>
      </div>
      <button 
        onClick={onToggle}
        className={clsx(
          "w-12 h-6 rounded-full relative transition-all",
          isActive ? "bg-primary-gold" : "bg-white/10"
        )}
      >
        <motion.div 
          className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black shadow-sm"
          animate={{ x: isActive ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function ActionRow({ icon, label, onClick, className, hasToggle, isActive, onToggle }: { 
  icon: React.ReactNode, 
  label: string, 
  onClick?: () => void,
  className?: string,
  hasToggle?: boolean,
  isActive?: boolean,
  onToggle?: () => void
}) {
  return (
    <div 
      className={clsx(
        "flex items-center gap-5 py-6 cursor-pointer hover:bg-white/[0.02] transition-colors",
        className
      )}
      onClick={!hasToggle ? onClick : undefined}
    >
      <div className="w-10 h-10 flex items-center justify-center text-primary-gold/40">
        {icon}
      </div>
      <span className="flex-1 text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-white/60">{label}</span>
      {hasToggle ? (
        <button 
          onClick={onToggle}
          className={clsx(
            "w-12 h-6 rounded-full relative transition-all shrink-0",
            isActive ? "bg-primary-gold" : "bg-white/10"
          )}
        >
          <motion.div 
            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black"
            animate={{ x: isActive ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      ) : (
        <div className="text-white/20">
           <ChevronLeft size={16} className="transform rotate-180" />
        </div>
      )}
    </div>
  );
}
