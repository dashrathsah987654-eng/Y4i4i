import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Network, Sparkles } from 'lucide-react';
import MentorImage from '../components/MentorImage';
import { useAppStore, DebateMessage } from '../store/useAppStore';
import { mentors } from '../lib/mentors';
import { getMentorResponse } from '../lib/gemini';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';

export default function DebateActive() {
  const { debateId } = useParams<{ debateId: string }>();
  const navigate = useNavigate();
  const { debates, updateDebate } = useAppStore();
  
  const debate = debates.find(d => d.id === debateId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debate?.messages, currentSpeakerId]);

  useEffect(() => {
    if (!debate) return;
    
    const runDebate = async () => {
      if (isGeneratingRef.current) return;
      
      const currentMessages = debate.messages || [];
      
      // Parallelize Generation for all participants
      if (currentMessages.length === 0) {
        isGeneratingRef.current = true;
        setIsGenerating(true);
        setCurrentSpeakerId('all'); 
        
        try {
          const debatePromises = debate.participants.map(async (mId) => {
            const m = mentors.find(mnt => mnt.id === mId);
            if (!m) return null;

            const prompt = `Council Discourse: "${debate.topic}". 
            Respond concisely (2-3 sentences) in character as ${m.name}. 
            Be authoritative and profound.`;
            
            const response = await getMentorResponse(m.systemPrompt, prompt, [], false, true);
            return {
              id: uuidv4(),
              mentorId: m.id,
              content: response
            } as DebateMessage;
          });

          const results = await Promise.all(debatePromises);
          const validResults = results.filter((r): r is DebateMessage => r !== null);
          
          updateDebate(debate.id, { messages: validResults });
        } catch (e) {
          console.error("Parallel debate generation failed:", e);
        } finally {
          isGeneratingRef.current = false;
          setIsGenerating(false);
          setCurrentSpeakerId(null);
        }
      } 
      // Summary Generation
      else if (currentMessages.length === debate.participants.length && !debate.summary) {
        isGeneratingRef.current = true;
        setIsGenerating(true);
        setCurrentSpeakerId('system');
        
        let historyContext = currentMessages.map(msg => {
          const m = mentors.find(mnt => mnt.id === msg.mentorId);
          return `[${m?.name || 'Mentor'}]: ${msg.content}`;
        }).join('\n\n');

        const systemPrompt = `Summarize this discourse: "${debate.topic}"\nDialogue:\n${historyContext}\nProvide a "Synthesized Conclusion" (2 sentences max). Timeless & authoritative tone.`;

        let response = "The conclusion remains elusive.";
        try {
          response = await getMentorResponse(systemPrompt, 'Synthesize.', [], false, true);
        } catch(e) {
          console.error(e);
        }
        
        updateDebate(debate.id, { summary: response });
        isGeneratingRef.current = false;
        setIsGenerating(false);
        setCurrentSpeakerId(null);
      }
    };

    runDebate();
  }, [debate?.messages, debate?.summary]);


  if (!debate) return null;

  return (
    <div className="flex-1 flex flex-col relative w-full h-full bg-black overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-gold/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-30 flex px-8 pt-16 pb-6 bg-black/40 backdrop-blur-xl border-b border-white/5 items-start gap-6 shadow-2xl">
        <button onClick={() => navigate(-1)} className="p-3 rounded-2xl border border-white/10 bg-white/5 text-white/40 hover:text-primary-gold transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.5em] text-primary-gold/60 mb-2 flex items-center gap-2">
            <Network size={12} className="animate-pulse" /> Active Council
          </span>
          <h2 className="font-serif text-xl text-white leading-tight tracking-tight italic">"{debate.topic}"</h2>
        </div>
      </div>

      {/* Council Orbit */}
      <div className="relative h-72 shrink-0 flex items-center justify-center z-10 pt-10">
         {/* Thought Sphere */}
         <div className="relative w-48 h-48 flex items-center justify-center">
            <motion.div 
               className="absolute inset-0 bg-primary-gold/10 rounded-full blur-[60px]"
               animate={{ scale: isGenerating ? [1, 1.4, 1] : 1, opacity: isGenerating ? [0.3, 0.6, 0.3] : 0.1 }}
               transition={{ duration: 4, repeat: Infinity }}
            />
            
            {/* The Core */}
            <motion.div 
               className={clsx(
                 "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-1000 bg-black shadow-[0_0_40px_rgba(201,168,76,0.15)]",
                 isGenerating ? "border-primary-gold scale-110" : "border-white/10"
               )}
            >
               <Sparkles size={24} className={clsx("transition-colors duration-1000", isGenerating ? "text-primary-gold" : "text-white/10")} />
            </motion.div>
         </div>

         {/* Participants */}
         {debate.participants.map((pId, idx) => {
            const m = mentors.find(mnt => mnt.id === pId);
            const total = debate.participants.length;
            const angle = (idx / total) * 360;
            const distance = 110;
            const isSpeaking = currentSpeakerId === pId;

            return m ? (
              <motion.div
                key={pId}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: Math.cos((angle * Math.PI) / 180) * distance,
                  y: Math.sin((angle * Math.PI) / 180) * distance
                }}
                className="absolute z-20 flex flex-col items-center"
              >
                 <div className="relative">
                    <MentorImage 
                      src={m.imageUrl}
                      fallback={m.imageFallback}
                      alt={m.name}
                      size="sm"
                      containerClassName={clsx(
                        "w-14 h-14 rounded-2xl border-2 transition-all duration-500 overflow-hidden",
                        isSpeaking ? "border-primary-gold scale-125 shadow-[0_0_40px_rgba(201,168,76,0.3)] bg-black" : "border-white/10 grayscale opacity-40 bg-black"
                      )}
                    />
                    {isSpeaking && (
                       <motion.div 
                          className="absolute -inset-2 border-2 border-primary-gold/40 rounded-3xl"
                          animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                       />
                    )}
                 </div>
                 <span className={clsx(
                   "text-[9px] font-sans font-bold uppercase tracking-widest mt-3 transition-all",
                   isSpeaking ? "text-primary-gold opacity-100" : "text-white/20 opacity-0"
                 )}>
                   Speaking
                 </span>
              </motion.div>
            ) : null;
         })}
      </div>

      {/* Council Records Area */}
      <div className="flex-1 overflow-y-auto px-8 pt-12 pb-40 flex flex-col gap-12 relative z-10 custom-scrollbar">
        <div className="w-full flex items-center gap-6 mb-4">
           <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5" />
           <div className="px-6 py-2 border border-white/5 rounded-full bg-white/5 text-[9px] font-sans font-bold uppercase tracking-[0.4em] text-white/30">Chamber Synthesis Established</div>
           <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5" />
        </div>

        {debate.messages.map((msg, idx) => {
          const m = mentors.find(mentor => mentor.id === msg.mentorId);
          if (!m) return null;
          
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-5 border-l-2 border-primary-gold/10 pl-10 relative"
            >
              <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-primary-gold shadow-[0_0_10px_#C9A84C]" />
              
              <div className="flex flex-col">
                <span className="text-[10px] font-sans font-bold text-primary-gold/40 uppercase tracking-[0.3em] mb-1">Response Sequence: {idx + 1}</span>
                <span className="font-serif text-lg text-white font-medium italic tracking-widest uppercase">{m.name}</span>
              </div>
              
              <div className="bg-premium-card p-10 rounded-[48px] border border-white/5 relative overflow-hidden shadow-xl">
                 <p className="font-serif italic text-xl leading-relaxed text-white/80 relative z-10">
                  {msg.content}
                </p>
              </div>
            </motion.div>
          );
        })}

        {isGenerating && currentSpeakerId !== 'system' && currentSpeakerId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col gap-3 pl-10 border-l-2 border-primary-gold/20 ml-0.5"
          >
             <span className="text-[11px] font-sans font-bold text-primary-gold uppercase tracking-[0.4em] animate-pulse">Establishing Signal...</span>
          </motion.div>
        )}

        {debate.summary && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="mt-12 mb-20"
          >
            <div className="bg-primary-gold p-1.5 rounded-[56px] shadow-[0_25px_60px_rgba(201,168,76,0.3)]">
              <div className="bg-black p-12 md:p-16 rounded-[52px] border border-primary-gold/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-gold/5 blur-[100px] pointer-events-none" />
                
                <div className="flex items-center justify-center mb-10">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary-gold/20" />
                  <span className="px-8 text-[11px] font-sans font-bold text-primary-gold uppercase tracking-[0.6em]">Consensus Record</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary-gold/20" />
                </div>
                
                <p className="text-center font-serif text-2xl md:text-3xl leading-relaxed text-white italic tracking-tight relative z-10 px-6">
                  "{debate.summary}"
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {isGenerating && currentSpeakerId === 'system' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center mt-12">
             <div className="w-10 h-10 border-2 border-t-primary-gold border-white/5 rounded-full animate-spin mb-6" />
             <span className="text-[11px] font-sans font-bold text-primary-gold uppercase tracking-[0.5em] animate-pulse">Finalizing Consensus...</span>
           </motion.div>
        )}

        <div ref={messagesEndRef} className="h-32" />
      </div>
    </div>
  );
}
