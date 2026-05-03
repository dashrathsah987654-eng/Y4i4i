import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { mentors } from '../lib/mentors';
import { getMentorResponse } from '../lib/gemini';
import { ShieldAlert, ArrowLeft, SendHorizontal, Target } from 'lucide-react';
import MentorImage from '../components/MentorImage';
import clsx from 'clsx';

export default function JudgmentActive() {
  const { judgmentId } = useParams();
  const navigate = useNavigate();
  const { judgments, updateJudgment } = useAppStore();
  const session = judgments.find(j => j.id === judgmentId);

  const [input, setInput] = useState('');

  useEffect(() => {
    if (!session) navigate('/judgment');
  }, [session, navigate]);

  if (!session) return null;

  const sessionMentors = session.participants.map(id => mentors.find(m => m.id === id)).filter(Boolean) as typeof mentors;

  useEffect(() => {
    if (session.status === 'generating_interrogation') {
      generateInterrogations();
    } else if (session.status === 'generating_verdicts') {
      generateVerdicts();
    }
  }, [session.status]);

  const generateInterrogations = async () => {
    try {
      const q = [...session.interrogations];
      if (q.length > 0) return;

      const promises = sessionMentors.map(async (mentor) => {
        const prompt = `Interrogate logic: "${session.decision}". 
        Ask ONE piercing, concise question (1 sentence). No advice. 
        Persona: ${mentor.name}.`;
        
        try {
          const response = await getMentorResponse(mentor.systemPrompt, prompt, [], false, true);
          return { mentorId: mentor.id, question: response };
        } catch(e) { 
          console.error(e);
          return { mentorId: mentor.id, question: "Are you prepared for the collapse of this logic?" };
        }
      });

      const results = await Promise.all(promises);
      updateJudgment(session.id, { interrogations: results, status: 'awaiting_defense' });
    } catch (e) {
      console.error(e);
      updateJudgment(session.id, { status: 'awaiting_defense' });
    }
  };

  const handleDefenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    updateJudgment(session.id, { userDefense: input, status: 'generating_verdicts' });
    setInput('');
  };

  const generateVerdicts = async () => {
    try {
      const verdictsResult: any[] = [];

      const verdictPromises = sessionMentors.map(async (mentor) => {
        const theirQuestion = session.interrogations.find(x => x.mentorId === mentor.id)?.question;

        const prompt = `Logic: "${session.decision}"\nChallenge: "${theirQuestion}"\nDefense: "${session.userDefense}"
        JSON Verdict:
        {
          "reasoning": "2-sentence critique.",
          "verdict": "Support" | "Reject" | "Conditional Support"
        }`;

        try {
          const responseText = await getMentorResponse(mentor.systemPrompt, prompt, [], true, true);
          const parsed = JSON.parse(responseText.replace(/^```json/, '').replace(/```$/, '').trim());
          return { mentorId: mentor.id, ...parsed };
        } catch(e) { 
          console.error(e);
          return { mentorId: mentor.id, reasoning: "Signal lost.", verdict: "Conditional Support" };
        }
      });

      const verdicts = await Promise.all(verdictPromises);
      
      const consensusPrompt = `Ambition: "${session.decision}".
      Verdicts:
      ${verdicts.map(v => `${mentors.find(m=>m.id===v.mentorId)?.name}: [${v.verdict}] ${v.reasoning}`).join('\n')}
      Synthesize consensus (2 sentences). Timeless and profound.`;

      let consensusData = "The masters whisper of both paths.";
      try {
        consensusData = await getMentorResponse(consensusPrompt, 'Consensus.', [], false, true);
      } catch(e) { console.error(e); }
      
      updateJudgment(session.id, { verdicts, consensus: consensusData, status: 'completed' });

    } catch(e) {
      console.error(e);
      updateJudgment(session.id, { status: 'completed' });
    }
  };

  return (
    <motion.div 
      className="flex-1 flex flex-col bg-black text-white relative overflow-hidden h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Cinematic Background Effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary-gold/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-40 pt-16 px-8 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-white/5 pb-6 shadow-2xl">
        <button 
          onClick={() => navigate('/judgment')}
          className="p-3 rounded-2xl border border-white/10 bg-white/5 text-white/40 hover:text-primary-gold transition-all flex items-center gap-2 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em]">Retreat</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-red-500">Chamber Active</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto z-10 custom-scrollbar pb-40">
        
        {/* Subject Ambition */}
        <div className="w-full max-w-2xl mx-auto px-8 pt-16 text-center mb-28 relative">
          <span className="text-[10px] font-sans font-bold text-primary-gold/40 uppercase tracking-[0.6em] mb-6 block">Ambitious Trajectory</span>
          <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight tracking-tight italic">
            "{session.decision}"
          </h2>
          <div className="mt-10 flex justify-center opacity-10"><Target size={32} /></div>
        </div>

        {/* The Council Corridor */}
        <div className="w-full max-w-2xl mx-auto px-8 space-y-32 relative mb-24">
          
          <AnimatePresence mode="popLayout">
            {session.interrogations.map((interrogation) => {
              const mentor = mentors.find(m => m.id === interrogation.mentorId);
              return (
                <motion.div
                  key={interrogation.mentorId}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-10 text-center"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                       <MentorImage 
                        src={mentor?.imageUrl}
                        fallback={mentor?.imageFallback || ''}
                        alt={mentor?.name || ''}
                        size="md"
                        containerClassName="border-2 border-primary-gold/40 bg-black shadow-2xl relative z-10 rounded-[32px] overflow-hidden"
                      />
                    </div>
                    <span className="text-[10px] font-sans font-bold text-primary-gold uppercase tracking-[0.4em]">{mentor?.name}</span>
                  </div>
                  
                  <div className="px-6 md:px-16 relative">
                    <p className="font-serif text-2xl md:text-3xl text-white leading-relaxed italic tracking-tight">
                      {interrogation.question}
                    </p>
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[1px] h-12 bg-gradient-to-b from-primary-gold/20 to-transparent group-last:hidden" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Defense Input */}
          {session.status === 'awaiting_defense' && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-32 w-full bg-premium-card border border-white/5 rounded-[48px] p-12 relative overflow-hidden shadow-2xl"
            >
              <label className="text-center block text-[10px] font-sans font-bold text-primary-gold/60 uppercase tracking-[0.5em] mb-10">Disciple Defense</label>
              <form onSubmit={handleDefenseSubmit} className="relative z-10">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Inscribe your final defense..."
                  className="w-full bg-black/60 border border-white/10 rounded-[32px] p-10 text-white placeholder:text-white/10 focus:border-primary-gold/40 transition-all outline-none resize-none font-serif text-xl min-h-[220px]"
                />
                <button 
                  type="submit"
                  disabled={input.trim().length === 0}
                  className="mt-8 w-full py-6 bg-primary-gold text-black rounded-[24px] font-sans text-[11px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:shadow-[0_15px_30px_rgba(201,168,76,0.3)] transition-all active:scale-[0.98] disabled:opacity-20 shadow-xl"
                >
                  <SendHorizontal size={18} /> Deliver Defense
                </button>
              </form>
            </motion.div>
          )}

          {session.userDefense && (
             <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-20 w-full bg-white/5 border border-white/10 rounded-[48px] p-12 relative overflow-hidden text-center shadow-xl"
            >
              <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-[0.5em] mb-6 block">Recorded Defense Trace</span>
              <p className="font-serif text-xl text-white/70 leading-relaxed italic tracking-tight">"{session.userDefense}"</p>
            </motion.div>
          )}
          
          {/* Verdicts */}
          {session.verdicts && session.verdicts.length > 0 && (
            <div className="pt-32 space-y-20">
               <div className="flex items-center gap-6 mb-20">
                  <div className="flex-1 border-t-2 border-white/5" />
                  <h3 className="text-[11px] font-sans font-bold text-primary-gold uppercase tracking-[0.8em]">The Registry of Judgments</h3>
                  <div className="flex-1 border-t-2 border-white/5" />
               </div>
               
               {session.verdicts.map((verdict) => {
                 const mentor = mentors.find(m => m.id === verdict.mentorId);
                 
                 let statusColor = "text-white/40 border-white/10";
                 if (verdict.verdict === 'Support') statusColor = "text-green-500 border-green-500/30 bg-green-500/5";
                 if (verdict.verdict === 'Reject') statusColor = "text-red-500 border-red-500/30 bg-red-500/5";
                 if (verdict.verdict === 'Conditional Support') statusColor = "text-primary-gold border-primary-gold/30 bg-primary-gold/5";

                 return (
                   <motion.div
                    key={verdict.mentorId}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="flex flex-col md:flex-row gap-12 items-start"
                   >
                     <div className="flex flex-col items-center gap-4 shrink-0">
                        <MentorImage 
                          src={mentor?.imageUrl}
                          fallback={mentor?.imageFallback || ''}
                          alt={mentor?.name || ''}
                          size="md"
                          containerClassName="border-2 border-white/10 bg-black rounded-[32px] overflow-hidden shadow-2xl"
                        />
                        <span className="text-[9px] font-sans font-bold text-white/30 uppercase tracking-[0.3em]">{mentor?.name}</span>
                      </div>
                     
                     <div className="flex-1 bg-premium-card border border-white/5 rounded-[48px] p-10 md:p-14 relative overflow-hidden group shadow-2xl">
                        <div className={clsx("inline-flex items-center px-6 py-2 rounded-2xl text-[10px] font-sans font-bold uppercase tracking-[0.3em] mb-8 border", statusColor)}>
                          {verdict.verdict}
                        </div>
                        <p className="font-serif text-xl text-white/80 leading-relaxed italic tracking-tight">
                          {verdict.reasoning}
                        </p>
                     </div>
                   </motion.div>
                 )
               })}
            </div>
          )}

          {/* Consensus */}
          {session.consensus && (
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.5 }}
              className="mt-40 relative"
            >
              <div className="absolute -inset-10 bg-primary-gold/10 blur-[120px] rounded-full" />
              <div className="bg-black border border-primary-gold/30 rounded-[64px] p-16 md:p-24 text-center relative overflow-hidden shadow-[0_0_60px_rgba(201,168,76,0.15)]">
                <Target size={48} className="text-primary-gold mx-auto mb-12 animate-pulse" />
                <h3 className="text-[12px] font-sans font-bold text-primary-gold uppercase tracking-[1em] mb-14 underline decoration-primary-gold/20 underline-offset-8">Chamber Consensus</h3>
                <div className="font-serif text-3xl md:text-4xl text-white italic leading-relaxed tracking-tight relative z-10 px-6">
                  "{session.consensus}"
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </div>

    </motion.div>
  );
}
