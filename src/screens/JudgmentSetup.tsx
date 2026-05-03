import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Gavel, ArrowRight, UserX, UserCheck, Lock, Headphones } from 'lucide-react';
import MentorImage from '../components/MentorImage';
import { mentors } from '../lib/mentors';
import { useAppStore } from '../store/useAppStore';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';

export default function JudgmentSetup() {
  const navigate = useNavigate();
  const [decision, setDecision] = useState('');
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const { isPremium, judgmentsStartedThisWeek, incrementJudgmentsCount, addJudgment, setPremium } = useAppStore();
  const [showPaywall, setShowPaywall] = useState(false);

  // Free: 1 chamber session per week
  const isLimitReached = !isPremium && judgmentsStartedThisWeek >= 1;

  const toggleMentor = (id: string) => {
    setSelectedMentors(curr => 
      curr.includes(id) 
        ? curr.filter(m => m !== id)
        : curr.length < 5 ? [...curr, id] : curr
    );
  };

  const handleStart = () => {
    if (isLimitReached) {
      setShowPaywall(true);
      return;
    }

    if (decision.trim().length > 10 && selectedMentors.length >= 3) {
      const sessionId = uuidv4();
      
      addJudgment({
        id: sessionId,
        decision,
        participants: selectedMentors,
        interrogations: [],
        status: 'generating_interrogation',
        timestamp: Date.now()
      });

      incrementJudgmentsCount();
      navigate(`/judgment/${sessionId}`);
    }
  };

  return (
    <motion.div 
      className="flex-1 flex flex-col bg-black relative overflow-hidden h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary-gold/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="pt-16 pb-8 px-8 flex justify-between items-start z-20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gavel size={14} className="text-primary-gold animate-pulse" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-primary-gold/60">Tribunal Protocol</span>
          </div>
          <h1 className="font-serif text-4xl text-white tracking-tight mb-2">
            The Judgment Chamber
          </h1>
          <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-[0.2em] pl-1">
            Defend your trajectory before a council of masters
          </p>
        </div>
      </div>

      {/* Limit Status */}
      {!isPremium && (
        <div className="mx-8 mt-10 bg-premium-card border border-white/5 rounded-3xl p-5 flex justify-between items-center z-10 shrink-0 shadow-lg">
          <span className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-[0.3em]">Weekly Session Allocation</span>
          <div className="flex items-center gap-3">
            <div className={clsx("w-2 h-2 rounded-full animate-pulse", isLimitReached ? "bg-red-500" : "bg-primary-gold")} />
            <span className="text-[11px] font-serif text-primary-gold">{isLimitReached ? 0 : 1} / 1 Remaining</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-48 z-10 flex flex-col custom-scrollbar">
        
        {/* Dilemma Input */}
        <div className="mb-12 px-2">
          <label className="text-white/40 text-[10px] font-sans font-bold uppercase tracking-[0.4em] pl-1 mb-5 block">1. The Dilemma</label>
          <div className="bg-premium-card p-1 rounded-[40px] border border-white/5 shadow-2xl focus-within:border-primary-gold/40 transition-all relative group overflow-hidden">
             <div className="absolute inset-0 bg-primary-gold/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <textarea
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="Inscribe the truth of your conflict..."
              className="w-full bg-transparent text-white px-8 py-8 outline-none resize-none placeholder:text-white/10 font-serif text-lg min-h-[160px] relative z-10"
            />
          </div>
        </div>

        {/* Tribunal Selection */}
        <div className="mb-10 px-2">
          <div className="flex justify-between items-end mb-6">
            <label className="text-white/40 text-[10px] font-sans font-bold uppercase tracking-[0.4em] pl-1 block">2. Assemble The Council (3-5)</label>
            <span className="text-[10px] font-sans font-bold text-primary-gold tracking-widest">{selectedMentors.length}/5</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {mentors.map(mentor => {
              const isSelected = selectedMentors.includes(mentor.id);
              const isDisabled = !isSelected && selectedMentors.length >= 5;
              
              return (
                <div 
                  key={mentor.id}
                  onClick={() => !isDisabled && toggleMentor(mentor.id)}
                  className={clsx(
                    "p-7 rounded-[48px] border transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden group shadow-xl",
                    isSelected 
                      ? "bg-primary-gold/5 border-primary-gold/40 shadow-2xl scale-[0.98]" 
                      : isDisabled
                        ? "bg-black/80 border-white/5 opacity-20 cursor-not-allowed grayscale"
                        : "bg-premium-card border-white/5 hover:border-white/10 opacity-80 hover:opacity-100"
                  )}
                >
                  <div className="relative mb-5">
                    <MentorImage 
                      src={mentor.imageUrl}
                      fallback={mentor.imageFallback}
                      alt={mentor.name}
                      containerClassName={clsx(
                        "w-20 h-20 rounded-3xl border-2 transition-all shadow-2xl overflow-hidden",
                        isSelected ? "border-primary-gold scale-105" : "border-white/10"
                      )}
                    />
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-primary-gold rounded-xl flex items-center justify-center z-20 shadow-xl text-black"
                      >
                        <UserCheck size={16} strokeWidth={4} />
                      </motion.div>
                    )}
                  </div>

                  <h3 className="font-serif text-base text-white mb-1 tracking-tight">{mentor.name}</h3>
                  <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-white/30 line-clamp-1">{mentor.descriptor}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="absolute bottom-10 left-10 right-10 z-40 bg-black/80 backdrop-blur-md p-2 rounded-[40px] border border-white/10 shadow-2xl">
        <button
          onClick={handleStart}
          disabled={decision.length <= 10 || selectedMentors.length < 3}
          className="w-full py-6 bg-primary-gold text-black text-[11px] font-sans font-bold tracking-[0.4em] uppercase rounded-[32px] shadow-[0_20px_40px_rgba(201,168,76,0.3)] transition-all flex items-center justify-center gap-3 group disabled:opacity-20 disabled:grayscale active:scale-[0.98]"
        >
           {isLimitReached ? <Lock size={16} /> : null}
           Commence Trial
           <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Paywall */}
      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-premium-card border border-primary-gold/30 rounded-[48px] p-12 text-center space-y-10 max-w-sm"
            >
              <div className="w-20 h-20 rounded-[32px] bg-primary-gold/10 flex items-center justify-center mx-auto mb-4">
                <Gavel size={32} className="text-primary-gold" />
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-3xl text-white tracking-tight">Sovereign Protocol Locked</h2>
                <p className="text-[11px] font-sans font-medium text-white/40 leading-relaxed uppercase tracking-widest">
                   Weekly judgment allocation exceeded. Upgrade for unlimited high-level chamber analysis.
                </p>
              </div>

              <div className="pt-6 space-y-4">
                <button 
                  onClick={() => {
                    setPremium(true);
                    setShowPaywall(false);
                  }}
                  className="w-full py-6 rounded-2xl bg-primary-gold text-black text-[11px] font-bold tracking-[0.2em] uppercase shadow-[0_15px_30px_rgba(201,168,76,0.3)] active:scale-[0.98] transition-transform"
                >
                  Ascend to Sovereign
                </button>
                <button 
                  onClick={() => setShowPaywall(false)}
                  className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                >
                  Return to Surface
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
