import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Sparkles, Check, Lock, Headphones } from 'lucide-react';
import MentorImage from '../components/MentorImage';
import { useAppStore } from '../store/useAppStore';
import { mentors, MentorCategory } from '../lib/mentors';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';

const categories: (MentorCategory | 'All')[] = ['All', 'Science', 'Business', 'Philosophy', 'Strategy', 'Creativity'];

export default function DebateSetup() {
  const navigate = useNavigate();
  const { debatesStartedToday, isPremium, setPremium, incrementDebatesCount, addDebate, debates } = useAppStore();
  const [topic, setTopic] = useState('');
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MentorCategory | 'All'>('All');

  const filteredMentors = useMemo(() => mentors.filter(m => 
    selectedCategory === 'All' || m.category === selectedCategory
  ), [selectedCategory]);

  const limit = 1;
  const debatesLeft = Math.max(0, limit - debatesStartedToday);

  const toggleMentor = (id: string) => {
    setSelectedMentors(prev => {
      if (prev.includes(id)) return prev.filter(m => m !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const startDebate = () => {
    if (!topic.trim() || selectedMentors.length < 2) return;

    if (!isPremium && debatesStartedToday >= limit) {
      setShowPaywall(true);
      return;
    }

    if (!isPremium) {
      incrementDebatesCount();
    }

    const newDebate = {
      id: uuidv4(),
      topic: topic.trim(),
      participants: selectedMentors,
      messages: [],
      timestamp: Date.now(),
    };

    addDebate(newDebate);
    navigate(`/debate/${newDebate.id}`);
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
            <Network size={14} className="text-primary-gold animate-pulse" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-primary-gold/60">Intellectual Council</span>
          </div>
          <h1 className="font-serif text-4xl text-white tracking-tight mb-2">
            Council Assembly
          </h1>
          <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-[0.2em] pl-1">
            Convene the brightest minds for synthesis
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-48 z-10 flex flex-col custom-scrollbar">
        
        {/* Input Chamber */}
        <div className="mb-12 px-2">
          <label className="text-white/40 text-[10px] font-sans font-bold uppercase tracking-[0.5em] pl-1 mb-5 block">1. Inquiry Vector</label>
          <div className="bg-premium-card p-1 rounded-[40px] border border-white/5 shadow-2xl focus-within:border-primary-gold/40 transition-all relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary-gold/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Inscribe your inquiry for the council..."
              className="w-full bg-transparent text-white px-8 py-8 outline-none resize-none placeholder:text-white/10 font-serif text-lg min-h-[160px] relative z-10"
            />
          </div>
        </div>

        {/* Mentor Selection */}
        <div className="mb-12 px-2">
          <div className="flex justify-between items-end mb-6">
            <label className="text-white/40 text-[10px] font-sans font-bold uppercase tracking-[0.5em] pl-1 block">2. Summon Masters (2-4)</label>
            <span className="text-[10px] font-sans font-bold text-primary-gold tracking-widest">{selectedMentors.length}/4</span>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-6 overflow-x-auto hide-scrollbar mb-10 pb-2 border-b border-white/5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  "pb-4 text-[10px] font-sans font-bold uppercase tracking-[0.3em] transition-all relative shrink-0",
                  selectedCategory === cat 
                    ? "text-primary-gold" 
                    : "text-white/20 hover:text-white/40"
                )}
              >
                {cat}
                {selectedCategory === cat && (
                  <motion.div layoutId="setup-cat-underl" className="absolute bottom-0 inset-x-0 h-[3px] bg-primary-gold shadow-[0_5px_15px_rgba(201,168,76,0.5)]" />
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
                    "p-7 rounded-[48px] border transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden group shadow-xl",
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
                        className="absolute -top-2 -right-2 w-8 h-8 bg-primary-gold rounded-xl flex items-center justify-center z-20 shadow-xl text-black"
                      >
                        <Check size={16} strokeWidth={4} />
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

        {/* Action Ritual */}
        <div className="mt-8 mb-16 flex flex-col items-center px-2">
          {!isPremium && (
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 rounded-full bg-primary-gold animate-pulse" />
              <p className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-[0.4em]">
                {debatesLeft} ASSEMBLY CHARGE{debatesLeft !== 1 ? 'S' : ''} REMAINING
              </p>
            </div>
          )}
          
          <button 
            onClick={startDebate}
            disabled={!topic.trim() || selectedMentors.length < 2 || selectedMentors.length > 4}
            className="w-full py-6 bg-primary-gold text-black text-[11px] font-sans font-bold uppercase tracking-[0.4em] rounded-[32px] shadow-[0_20px_40px_rgba(201,168,76,0.3)] transition-all disabled:opacity-20 disabled:grayscale active:scale-[0.98]"
          >
            Convene General Council
          </button>
        </div>

        {/* Past Councils (History) */}
        {debates.length > 0 && (
          <div className="mt-12 mb-12 px-2">
             <div className="flex items-center gap-4 mb-8">
                <label className="text-white/20 text-[10px] font-sans font-bold uppercase tracking-[0.5em] shrink-0">Past Councils</label>
                <div className="flex-1 border-t border-white/5" />
             </div>
            <div className="space-y-4">
              {debates.map((debate) => (
                <div 
                  key={debate.id}
                  onClick={() => navigate(`/debate/${debate.id}`)}
                  className="bg-premium-card p-8 rounded-[40px] border border-white/5 hover:border-primary-gold/20 cursor-pointer transition-all group relative overflow-hidden shadow-xl"
                >
                  <h4 className="font-serif text-base text-white/80 mb-6 group-hover:text-white transition-colors leading-relaxed italic">"{debate.topic}"</h4>
                  <div className="flex gap-4">
                    {debate.participants.map(pId => {
                      const m = mentors.find(mnt => mnt.id === pId);
                      return m ? (
                        <MentorImage 
                          key={pId}
                          src={m.imageUrl}
                          fallback={m.imageFallback}
                          alt={m.name}
                          size="sm"
                          containerClassName="w-10 h-10 rounded-2xl border-2 border-white/10 bg-black group-hover:border-primary-gold/40 grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 transition-all overflow-hidden"
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
                <Network size={32} className="text-primary-gold" />
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-3xl text-white tracking-tight">Council Access Limit</h2>
                <p className="text-[11px] font-sans font-medium text-white/40 leading-relaxed uppercase tracking-widest">
                   The collective logic of the masters requires significant energy. Upgrade to Sovereign for unlimited council convenings.
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
