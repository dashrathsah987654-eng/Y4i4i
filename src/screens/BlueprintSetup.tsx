import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Sparkles, Check, Lock, ChevronDown, Headphones } from 'lucide-react';
import MentorImage from '../components/MentorImage';
import { useAppStore } from '../store/useAppStore';
import { mentors, MentorCategory } from '../lib/mentors';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';

const categories: (MentorCategory | 'All')[] = ['All', 'Science', 'Business', 'Philosophy', 'Strategy', 'Creativity'];

export default function BlueprintSetup() {
  const navigate = useNavigate();
  const { blueprintsGeneratedToday, isPremium, setPremium, incrementBlueprintsCount, addBlueprint, blueprints } = useAppStore();
  const [goal, setGoal] = useState('');
  const [timeframe, setTimeframe] = useState<'30 Days' | '90 Days' | '1 Year'>('30 Days');
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MentorCategory | 'All'>('All');

  const filteredMentors = useMemo(() => mentors.filter(m => 
    selectedCategory === 'All' || m.category === selectedCategory
  ), [selectedCategory]);

  const limit = 1;
  const blueprintsLeft = Math.max(0, limit - blueprintsGeneratedToday);

  const toggleMentor = (id: string) => {
    setSelectedMentors(prev => {
      if (prev.includes(id)) return prev.filter(m => m !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const startBlueprint = () => {
    if (!goal.trim() || selectedMentors.length < 1) return;

    if (!isPremium && blueprintsGeneratedToday >= limit) {
      setShowPaywall(true);
      return;
    }

    if (!isPremium) {
      incrementBlueprintsCount();
    }

    const newBlueprint = {
      id: uuidv4(),
      goal: goal.trim(),
      timeframe,
      participants: selectedMentors,
      status: 'generating' as const,
      timestamp: Date.now(),
    };

    addBlueprint(newBlueprint);
    navigate(`/blueprint/${newBlueprint.id}`);
  };

  return (
    <motion.div 
      className="flex-1 flex flex-col bg-black relative overflow-hidden h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-gold/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="pt-16 pb-8 px-8 flex justify-between items-start z-20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-primary-gold animate-pulse" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-primary-gold/60">Strategic Mastery</span>
          </div>
          <h1 className="font-serif text-4xl text-white tracking-tight mb-2">
            Personal Blueprint
          </h1>
          <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-[0.2em] pl-1">
            Design your custom path to excellence
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32 z-10 flex flex-col custom-scrollbar">
        
        {/* Goal Input */}
        <div className="mb-10 px-2">
          <label className="text-white/40 text-[10px] font-sans font-bold uppercase tracking-[0.3em] pl-1 mb-4 block">Primary Ambition</label>
          <div className="bg-premium-card p-1 rounded-[32px] border border-white/5 shadow-2xl focus-within:border-primary-gold/40 transition-all relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary-gold/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What specifically would you like to master?"
              className="w-full bg-transparent text-white px-8 py-8 outline-none resize-none placeholder:text-white/10 font-serif text-xl min-h-[140px] relative z-10"
            />
          </div>
        </div>

        {/* Timeframe */}
        <div className="mb-12 px-2">
          <label className="text-white/40 text-[10px] font-sans font-bold uppercase tracking-[0.3em] pl-1 mb-4 block">Strategic Horizon</label>
          <div className="flex gap-2 bg-white/5 p-2 rounded-[28px] border border-white/5 shadow-inner">
             {['30 Days', '90 Days', '1 Year'].map(t => (
               <button
                 key={t}
                 onClick={() => setTimeframe(t as any)}
                 className={clsx(
                   "flex-1 py-4 rounded-[22px] text-[10px] font-sans font-bold uppercase tracking-[0.2em] transition-all relative",
                   timeframe === t 
                     ? "bg-primary-gold text-black shadow-[0_10px_25px_rgba(201,168,76,0.2)]" 
                     : "text-white/20 hover:bg-white/5 hover:text-white/40"
                 )}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>

        {/* Mentor Selection */}
        <div className="mb-12 px-2">
          <div className="flex justify-between items-end mb-6">
            <label className="text-white/40 text-[10px] font-sans font-bold uppercase tracking-[0.3em] pl-1 block">The Council (1-3 Selected)</label>
            <span className="text-[10px] font-sans font-bold text-primary-gold tracking-widest">{selectedMentors.length}/3</span>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-5 overflow-x-auto hide-scrollbar mb-8 pb-3 border-b border-white/5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  "pb-2 text-[10px] font-sans font-bold uppercase tracking-[0.3em] transition-all relative shrink-0",
                  selectedCategory === cat 
                    ? "text-primary-gold" 
                    : "text-white/20 hover:text-white/40"
                )}
              >
                {cat}
                {selectedCategory === cat && (
                  <motion.div layoutId="bp-cat-underl" className="absolute bottom-[-2px] inset-x-0 h-[2px] bg-primary-gold shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                )}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {filteredMentors.map((mentor) => {
              const isSelected = selectedMentors.includes(mentor.id);
              return (
                <div 
                  key={mentor.id}
                  onClick={() => toggleMentor(mentor.id)}
                  className={clsx(
                    "p-6 rounded-[40px] border transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden group",
                    isSelected 
                      ? "bg-primary-gold/5 border-primary-gold/40 shadow-2xl scale-[0.98]" 
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
                        className="absolute -top-2 -right-2 w-7 h-7 bg-primary-gold rounded-xl flex items-center justify-center z-20 shadow-xl text-black"
                      >
                        <Check size={14} strokeWidth={4} />
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

        {/* Start Button */}
        <div className="mt-8 flex flex-col items-center px-2">
          {!isPremium && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-primary-gold animate-pulse" />
              <p className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-[0.3em]">
                {blueprintsLeft} Iteration Available Today
              </p>
            </div>
          )}
          
          <button 
            onClick={startBlueprint}
            disabled={!goal.trim() || selectedMentors.length < 1 || selectedMentors.length > 3}
            className="w-full py-6 bg-primary-gold text-black text-[11px] font-sans font-bold uppercase tracking-[0.4em] rounded-3xl shadow-[0_15px_40px_rgba(201,168,76,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 disabled:grayscale disabled:scale-100"
          >
            Construct Personal Blueprint
          </button>
        </div>

        {/* Blueprint History */}
        {blueprints.length > 0 && (
          <div className="mt-24 mb-16 px-2">
             <div className="flex items-center gap-4 mb-8">
               <div className="h-px bg-white/10 flex-1" />
               <label className="text-white/20 text-[10px] font-sans font-bold uppercase tracking-[0.4em]">Previous Blueprints</label>
               <div className="h-px bg-white/10 flex-1" />
            </div>
            <div className="space-y-4">
              {blueprints.map((bp) => (
                <div 
                  key={bp.id}
                  onClick={() => navigate(`/blueprint/${bp.id}`)}
                  className="bg-premium-card p-8 rounded-[40px] border border-white/5 hover:border-primary-gold/20 cursor-pointer transition-all flex flex-col gap-6 group"
                >
                  <div className="flex-1">
                    <h4 className="font-serif text-lg text-white/90 mb-2 group-hover:text-white transition-colors leading-relaxed">"{bp.goal}"</h4>
                    <span className="text-[9px] font-sans font-bold text-primary-gold/60 uppercase tracking-widest">{bp.timeframe} Strategy</span>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    {bp.participants.map(pId => {
                      const m = mentors.find(mnt => mnt.id === pId);
                      return m ? (
                        <MentorImage 
                          key={pId}
                          src={m.imageUrl}
                          fallback={m.imageFallback}
                          alt={m.name}
                          size="sm"
                          containerClassName="w-10 h-10 rounded-xl border border-white/10 grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 transition-all"
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                <Lock size={32} className="text-primary-gold" />
              </div>
              <div className="space-y-4">
                <h2 className="font-serif text-3xl text-white tracking-tight">Sovereign Access Required</h2>
                <p className="text-[11px] font-sans font-medium text-white/40 leading-relaxed uppercase tracking-widest">
                  Maximum complimentary blueprints generated. Upgrade to unlimited strategic mapping.
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
