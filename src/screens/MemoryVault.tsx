import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Sparkles, BrainCircuit, Lock, Headphones, Clock, ChevronRight } from 'lucide-react';
import { useAppStore, VoiceSession } from '../store/useAppStore';
import { mentors } from '../lib/mentors';
import MentorImage from '../components/MentorImage';
import { getMentorResponse } from '../lib/gemini';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';

export default function MemoryVault() {
  const { memories, voiceSessions, isPremium, addMemory, chatHistory, setLastReflectionDate, setPremium } = useAppStore();
  const [activeTab, setActiveTab] = useState<'insights' | 'sessions'>('insights');
  const [selectedSession, setSelectedSession] = useState<VoiceSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  
  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => b.timestamp - a.timestamp);
  }, [memories]);

  const canGenerate = Object.values(chatHistory).some(history => history.length > 0);

  const generateReflection = async () => {
    if (!isPremium && sortedMemories.length >= 1) {
      setShowPaywall(true);
      return;
    }

    setIsGenerating(true);

    try {
      let maxMsg = 0;
      let primaryMentorId = mentors[0].id;
      for (const [mId, msgs] of Object.entries(chatHistory)) {
        if (msgs.length > maxMsg) {
          maxMsg = msgs.length;
          primaryMentorId = mId;
        }
      }
      
      const pMentor = mentors.find(m => m.id === primaryMentorId) || mentors[0];

      let context = '';
      Object.entries(chatHistory).forEach(([mId, msgs]) => {
         const mentor = mentors.find(m => m.id === mId);
         if (!mentor || msgs.length === 0) return;
         context += `\nConversation with ${mentor.name}:\n`;
         msgs.slice(-10).forEach(msg => {
            context += `[${msg.role === 'user' ? 'Subject' : mentor.name}]: ${msg.content}\n`;
         });
      });

      const systemPrompt = `You are the High Elder of the MentorMind Chamber. You are reviewing the growth and patterns of an elite disciple.
      Based on this history:
      ${context}

      Synthesize a "Chamber Realization":
      1. Define their current mastery phase.
      2. Analyze their primary intellectual vector.
      3. Project wisdom in the refined voice of ${pMentor.name}.

      Format strictly as JSON:
      {
        "title": "A sophisticated 3-4 word phase title",
        "content": "A 2-3 sentence realization in the voice of ${pMentor.name}."
      }`;

      let parsed = { title: "Chamber Silence", content: "The current discourse patterns are insufficient for a deep synthesis." };
      try {
        const responseText = await getMentorResponse(systemPrompt, 'Synthesize chamber insights.', [], true);
        parsed = JSON.parse(responseText.replace(/^```json/, '').replace(/```$/, '').trim());
      } catch (e) { console.error(e); }

      addMemory({
        id: uuidv4(),
        timestamp: Date.now(),
        mentorId: pMentor.id,
        title: parsed.title,
        content: parsed.content,
        type: 'reflection'
      });
      
      setLastReflectionDate(Date.now());
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
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
            <BrainCircuit size={14} className="text-primary-gold animate-pulse" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-primary-gold/60">Intelligence Registry</span>
          </div>
          <h1 className="font-serif text-4xl text-white tracking-tight mb-2">
            The Journey Archive
          </h1>
          <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-[0.2em] pl-1">
            Persistent wisdom & session records
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 mt-10 mb-8 z-10 flex p-1.5 bg-white/5 border border-white/5 rounded-2xl mx-8 shadow-inner">
        <button 
          onClick={() => setActiveTab('insights')}
          className={clsx(
            "flex-1 py-3.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest transition-all",
            activeTab === 'insights' ? "bg-primary-gold text-black shadow-lg" : "text-white/40 hover:text-white/60"
          )}
        >
          Insights
        </button>
        <button 
          onClick={() => setActiveTab('sessions')}
          className={clsx(
            "flex-1 py-3.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-widest transition-all",
            activeTab === 'sessions' ? "bg-primary-gold text-black shadow-lg" : "text-white/40 hover:text-white/60"
          )}
        >
          Live Logs
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-32 z-10 flex flex-col custom-scrollbar relative">
        {activeTab === 'insights' ? (
          <div className="max-w-xl mx-auto w-full">
            <div className="mb-12 flex justify-center">
              <button 
                onClick={generateReflection}
                disabled={isGenerating || !canGenerate}
                className="group relative px-10 py-5 bg-black border border-primary-gold/20 hover:border-primary-gold/60 rounded-2xl text-primary-gold text-[10px] font-bold uppercase tracking-[0.3em] transition-all disabled:opacity-20 flex items-center gap-3 overflow-hidden shadow-[0_15px_30px_rgba(201,168,76,0.15)]"
              >
                {isGenerating ? (
                   <span className="w-4 h-4 border-2 border-t-primary-gold border-white/5 rounded-full animate-spin" />
                ) : (
                  <Sparkles size={16} className="animate-pulse" />
                )}
                {isGenerating ? "Synthesizing..." : "Generate Insights"}
              </button>
            </div>

            {sortedMemories.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center opacity-10 mt-10">
                <BrainCircuit size={60} className="mb-8" />
                <h3 className="font-serif text-2xl text-white mb-4 uppercase tracking-[0.2em]">Archive Empty</h3>
                <p className="text-[10px] font-sans font-bold tracking-[0.4em] uppercase">No intelligence traces found.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-white/5 ml-4 pl-10 space-y-16 mt-8">
                {sortedMemories.map((memory, index) => {
                  const mentor = mentors.find(m => m.id === memory.mentorId);
                  const date = new Date(memory.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  
                  return (
                    <motion.div 
                      key={memory.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      className="relative"
                    >
                      <div className="absolute w-4 h-4 bg-black border-2 border-primary-gold rounded-full -left-[49px] top-1.5 shadow-[0_0_15px_#C9A84C]" />
                      
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-primary-gold pl-1">{date}</span>
                        <div className="flex-1 border-t border-white/5 opacity-50" />
                        <span className="text-[9px] font-sans font-bold text-white/10 uppercase tracking-widest">Entry #{sortedMemories.length - index}</span>
                      </div>
                      
                      <div className="bg-premium-card p-10 rounded-[48px] border border-white/5 group hover:border-primary-gold/20 transition-all shadow-2xl relative overflow-hidden">
                        <h3 className="font-serif text-2xl text-white mb-6 italic tracking-tight group-hover:text-primary-gold transition-colors">"{memory.title}"</h3>
                        <p className="font-serif text-lg text-white/70 leading-relaxed italic border-l-2 border-primary-gold/20 pl-8 mb-8">
                           {memory.content}
                        </p>
                        
                        <div className="flex justify-between items-center pt-8 border-t border-white/5">
                           <div className="flex items-center gap-4">
                            <MentorImage 
                              src={mentor?.imageUrl}
                              fallback={mentor?.imageFallback || ''}
                              alt={mentor?.name || ''}
                              size="sm"
                              containerClassName="border-2 border-primary-gold/20 bg-black rounded-2xl overflow-hidden"
                            />
                            <div className="flex flex-col">
                               <span className="text-[9px] font-sans font-bold text-primary-gold/40 uppercase tracking-[0.3em]">Attributed To</span>
                               <span className="font-serif text-base text-white tracking-widest">{mentor?.name}</span>
                            </div>
                           </div>
                           <div className="opacity-10 group-hover:opacity-30 transition-opacity"><Clock size={20} /></div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-xl mx-auto w-full">
            {voiceSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center opacity-10 mt-10">
                <Headphones size={60} className="mb-8" />
                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.5em]">No voice logs established.</p>
              </div>
            ) : (
              voiceSessions.map((session) => {
                const mentor = mentors.find(m => m.id === session.mentorId);
                return (
                  <motion.button 
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="w-full bg-premium-card border border-white/5 hover:border-primary-gold/40 p-8 rounded-[40px] flex items-center gap-8 group transition-all text-left relative shadow-xl"
                  >
                    <MentorImage 
                      src={mentor?.imageUrl}
                      fallback={mentor?.imageFallback || ''}
                      alt={mentor?.name || ''}
                      size="md"
                      containerClassName="border-2 border-white/10 group-hover:border-primary-gold/40 transition-colors bg-black rounded-[24px] overflow-hidden"
                    />
                    <div className="flex-1">
                      <h4 className="font-serif text-white text-xl tracking-tight mb-2 group-hover:text-primary-gold transition-colors">{mentor?.name}</h4>
                      <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                           <Clock size={12} className="text-primary-gold/40" />
                           <span className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-widest">
                             {new Date(session.timestamp).toLocaleDateString()}
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Headphones size={12} className="text-primary-gold/40" />
                           <span className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-widest">
                             {Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}
                           </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-white/10 group-hover:text-primary-gold transition-colors group-hover:translate-x-1" />
                  </motion.button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Session Details Overlay */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col pt-12"
          >
            <div className="px-8 py-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-1 rounded-2xl border-2 border-primary-gold/40 bg-black overflow-hidden">
                   <MentorImage 
                    src={mentors.find(m => m.id === selectedSession.mentorId)?.imageUrl}
                    fallback={mentors.find(m => m.id === selectedSession.mentorId)?.imageFallback || ''}
                    alt="Mentor"
                    size="sm"
                  />
                </div>
                <div>
                  <h3 className="font-serif text-white tracking-widest uppercase text-base">Enlightenment Trace</h3>
                  <p className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-primary-gold/60">
                    Chamber Session: {new Date(selectedSession.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                className="p-4 rounded-3xl border border-white/10 bg-white/5 text-white/40 hover:text-white transition-all transform rotate-90"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 py-12 space-y-12 z-10 custom-scrollbar">
              <div className="max-w-2xl mx-auto pb-20">
                {selectedSession.transcript.map((log, i) => (
                  <div key={i} className={clsx("mb-12 flex", log.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={clsx(
                      "max-w-[85%] p-10 rounded-[48px] border transition-all shadow-2xl",
                      log.role === 'user' ? "bg-white/5 border-white/10" : "bg-premium-card border-primary-gold/20"
                    )}>
                      <span className={clsx(
                        "text-[10px] font-sans font-bold uppercase tracking-[0.3em] mb-4 block",
                        log.role === 'user' ? "text-white/30" : "text-primary-gold"
                      )}>
                        {log.role === 'user' ? 'Disciple' : mentors.find(m => m.id === selectedSession.mentorId)?.name}
                      </span>
                      <p className={clsx(
                        "font-serif text-lg leading-relaxed italic tracking-tight",
                        log.role === 'user' ? "text-white/60" : "text-white"
                      )}>
                        {log.role === 'user' ? `"${log.content}"` : log.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  Unlock the full historical vault and unlimited synthesis logic.
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
