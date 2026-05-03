import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Send, Lock, Sparkles, RotateCcw, Headphones, ShieldAlert, Zap, Target, AlertTriangle } from 'lucide-react';
import MentorImage from '../components/MentorImage';
import { useAppStore, Message } from '../store/useAppStore';
import { mentors } from '../lib/mentors';
import { streamMentorResponse } from '../lib/gemini';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../components/AuthProvider';
import { saveChatMessage } from '../lib/firestoreService';
import clsx from 'clsx';
import Markdown from 'react-markdown';

export default function Chat() {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mentor = mentors.find(m => m.id === mentorId);
  
  const { 
    chatHistory, addMessage, updateMessage, questionsAskedToday, realityChecksToday,
    incrementQuestionsCount, incrementRealityChecksCount, isPremium, setPremium 
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [isDeepMode, setIsDeepMode] = useState(false);
  const [isRealityCheck, setIsRealityCheck] = useState(false);
  const [realityCheckStats, setRealityCheckStats] = useState<{ truth: number; risk: number; clarity: number } | null>(null);
  const memoryContextRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const history = chatHistory[mentorId || ''] || [];
  const limit = isPremium ? 100 : 3;
  const rcLimit = isPremium ? 100 : 1;
  const questionsLeft = Math.max(0, limit - questionsAskedToday);
  const rcLeft = Math.max(0, rcLimit - realityChecksToday);

  // Pre-calculate minimal memory context for latency reduction
  useEffect(() => {
    const mems = useAppStore.getState().memories.filter(m => m.mentorId === mentorId);
    memoryContextRef.current = mems.slice(-3).map(m => m.title).join(', ');
  }, [mentorId]);

  // Apply memory limits based on tier
  const memoryLimitMs = isPremium ? Infinity : 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const activeHistory = history.filter(m => (now - m.timestamp) <= memoryLimitMs);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  if (!mentor) return null;

  const performAIRequest = async (userMsg: Message, isRC: boolean) => {
    setIsTyping(true);
    setStreamingContent('');
    setRealityCheckStats(null);
    
    // Simulate initial 'Thinking' delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    try {
      const priorHistory = activeHistory.slice(-8).filter(m => m.id !== userMsg.id).map(m => ({ role: m.role, content: m.content }));
      const memoryContext = memoryContextRef.current;
      
      let basePrompt = isRC ? mentor.realityCheckPrompt : mentor.systemPrompt;
      basePrompt += " Respond: concise.";
      
      if (isRC) {
        basePrompt += "\n\nCRITICAL: At the very end of your response, you MUST include a bracketed JSON-like block for stats: [STATS:{\"truth\":X, \"risk\":Y, \"clarity\":Z}] where X, Y, Z are scores 1-100 based on the user's inquiry.";
      }

      const enhancedPrompt = memoryContext 
        ? `${basePrompt} Context: ${memoryContext}`
        : basePrompt;

      let currentStreamText = '';
      let displayedText = '';
      const typingIntervalRef = { current: null as NodeJS.Timeout | null };

      const processTyping = () => {
        if (displayedText.length < currentStreamText.length) {
          displayedText += currentStreamText[displayedText.length];
          setStreamingContent(displayedText);
          const nextChar = currentStreamText[displayedText.length];
          const delay = nextChar === '.' || nextChar === '?' || nextChar === '!' ? 300 : 15 + Math.random() * 25;
          typingIntervalRef.current = setTimeout(processTyping, delay);
        }
      };

      await streamMentorResponse(
        enhancedPrompt, 
        userMsg.content, 
        priorHistory,
        async (chunk) => {
          setIsTyping(false); // Stop showing general typing dots
          currentStreamText += chunk;
          if (!typingIntervalRef.current) {
            processTyping();
          }
        },
        !isDeepMode // Concise mode if not in deep mode
      );

      // Wait for typing to finish or timeout if taking too long
      const startWait = Date.now();
      while (displayedText.length < currentStreamText.length && (Date.now() - startWait < 30000)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (typingIntervalRef.current) clearTimeout(typingIntervalRef.current);

      // Post-process stats if in RC mode
      let cleanText = currentStreamText;
      if (isRC) {
        const statsMatch = cleanText.match(/\[STATS:(.*?)\]/);
        if (statsMatch) {
          try {
            const stats = JSON.parse(statsMatch[1]);
            setRealityCheckStats(stats);
            cleanText = cleanText.replace(/\[STATS:.*?\]/, '').trim();
          } catch (e) {
            console.error("Failed to parse RC stats", e);
          }
        }
      }

      updateMessage(mentor.id, userMsg.id, { status: 'sent' });

      // Add mentor message
      const mentorMsg: Message = { id: crypto.randomUUID(), role: 'mentor', content: cleanText, timestamp: Date.now() };
      addMessage(mentor.id, mentorMsg);
      setStreamingContent('');
      
      if (user) {
        await saveChatMessage(user.uid, mentor.id, mentorMsg);
      }
    } catch (error) {
      console.error("Mentor response failed:", error);
      updateMessage(mentor.id, userMsg.id, { status: 'error' });
    } finally {
      setIsTyping(false);
      setStreamingContent('');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!isPremium && questionsAskedToday >= limit) {
      setShowPaywall(true);
      return;
    }

    if (isRealityCheck && !isPremium && realityChecksToday >= rcLimit) {
      setShowPaywall(true);
      return;
    }

    const userText = input.trim();
    setInput('');
    const currentIsRC = isRealityCheck;
    
    // Add user message
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: userText, timestamp: Date.now(), status: 'sending' };
    addMessage(mentor.id, userMsg);
    
    if (user) {
      await saveChatMessage(user.uid, mentor.id, userMsg);
    }

    if (!isPremium) {
      incrementQuestionsCount();
      if (currentIsRC) {
        incrementRealityChecksCount();
      }
    }

    await performAIRequest(userMsg, currentIsRC);
  };

  const handleRetry = async (msg: Message) => {
    updateMessage(mentor.id, msg.id, { status: 'sending' });
    await performAIRequest(msg, isRealityCheck);
  };

  return (
    <div className={clsx(
      "flex-1 flex flex-col relative w-full h-full transition-all duration-700 overflow-hidden",
      isRealityCheck ? "bg-[#050505]" : "bg-black"
    )}>
      {/* Reality Check Overlay */}
      <AnimatePresence>
        {isRealityCheck && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          >
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,215,0,0.03)_0%,_transparent_70%)]" />
             <div className="absolute inset-0 backdrop-grayscale-[0.3]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Header */}
      <div className={clsx(
        "relative z-30 flex items-center px-6 py-6 border-b backdrop-blur-xl gap-4 transition-colors duration-500",
        isRealityCheck ? "border-primary-gold/20 bg-black/90" : "border-white/5 bg-black/80"
      )}>
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-white/40 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        
        <div className="relative">
          <MentorImage 
            src={mentor.imageUrl}
            fallback={mentor.imageFallback}
            alt={mentor.name}
            containerClassName={clsx(
              "w-12 h-12 rounded-full border bg-premium-card overflow-hidden transition-all",
              isRealityCheck ? "border-primary-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]" : "border-primary-gold/30"
            )}
          />
          <div className={clsx(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black flex items-center justify-center transition-colors",
            isRealityCheck ? "bg-red-500" : "bg-primary-gold"
          )}>
             <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg text-white leading-tight tracking-tight">{mentor.name}</h2>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setIsDeepMode(!isDeepMode)}
                className={clsx(
                  "px-2 py-0.5 rounded-full border text-[7px] font-sans font-bold uppercase tracking-widest transition-all",
                  isDeepMode ? "bg-primary-gold/10 border-primary-gold text-primary-gold" : "bg-white/5 border-white/5 text-white/40"
                )}
              >
                {isDeepMode ? "Deep" : "Fast"}
              </button>
              <button 
                onClick={() => setIsRealityCheck(!isRealityCheck)}
                className={clsx(
                  "px-2 py-0.5 rounded-full border text-[7px] font-sans font-bold uppercase tracking-widest transition-all flex items-center gap-1",
                  isRealityCheck ? "bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-white/5 border-white/5 text-white/40"
                )}
              >
                <ShieldAlert size={8} />
                Reality Check
              </button>
            </div>
          </div>
          <p className="text-[9px] font-sans font-medium uppercase tracking-[0.2em] text-primary-gold/60">{mentor.descriptor}</p>
        </div>

        <button 
          onClick={() => navigate(`/live/${mentor.id}`)}
          className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-primary-gold hover:border-primary-gold/40 transition-all"
        >
          <Headphones size={20} />
        </button>
      </div>

      {/* Reality Check Banner */}
      <AnimatePresence>
        {isRealityCheck && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-red-500/10 border-b border-red-500/20"
          >
            <div className="px-6 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-red-500" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Reality Check Active</span>
              </div>
              <span className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">
                No Fluff. Only Truth.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Limit Banner */}
      {!isPremium && (
        <div className="absolute top-[120px] left-0 right-0 z-20 flex justify-center pointer-events-none">
          <motion.div 
             initial={{ y: -10, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="flex flex-col items-center gap-2"
          >
            <div className="bg-primary-gold/10 backdrop-blur-md border border-primary-gold/20 px-4 py-1.5 rounded-full">
              <p className="text-[9px] font-bold text-primary-gold uppercase tracking-[0.2em]">
                {questionsLeft} Daily Audiences Left
              </p>
            </div>
            {isRealityCheck && (
              <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 px-4 py-1.5 rounded-full">
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-[0.2em]">
                  {rcLeft} Reality Checks Remaining
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 pt-12 pb-6 flex flex-col gap-6 hide-scrollbar">
        {history.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-20">
             <MentorImage 
              src={mentor.imageUrl}
              fallback={mentor.imageFallback}
              alt={mentor.name}
              size="lg"
              className="grayscale opacity-50 contrast-125 brightness-75 scale-125"
            />
            <p className="text-sm font-serif italic mt-12 max-w-[200px]">
              "Speak, my friend. Time is but an illusion in this chamber."
            </p>
          </div>
        )}

        {history.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isLastMessage = idx === history.length - 1;
          
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                "group relative max-w-[85%]",
                isUser ? "self-end" : "self-start"
              )}
            >
              <div className={clsx(
                "px-5 py-4 rounded-3xl text-[13px] leading-[1.6] relative overflow-hidden",
                isUser 
                  ? "bg-[#222222] text-white/90 font-sans" 
                  : "bg-premium-card border-l-2 border-primary-gold text-white font-serif"
              )}>
                {!isUser && isRealityCheck && (
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <ShieldAlert size={40} className="text-red-500" />
                  </div>
                )}
                <div className="prose prose-invert prose-p:my-1 prose-ul:my-1 max-w-none">
                    {isUser ? msg.content : <Markdown>{msg.content}</Markdown>}
                </div>
              </div>

              {!isUser && isLastMessage && realityCheckStats && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 grid grid-cols-3 gap-3"
                >
                  {[
                    { label: 'Truth Score', value: realityCheckStats.truth, icon: Zap, color: 'text-yellow-400' },
                    { label: 'Assumption Risk', value: realityCheckStats.risk, icon: AlertTriangle, color: 'text-red-400' },
                    { label: 'Action Clarity', value: realityCheckStats.clarity, icon: Target, color: 'text-green-400' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-2">
                       <div className="flex items-center justify-between">
                         <stat.icon size={12} className={stat.color} />
                         <span className="text-[10px] font-bold text-white/80">{stat.value}%</span>
                       </div>
                       <p className="text-[7px] font-bold uppercase tracking-widest text-white/40">{stat.label}</p>
                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.value}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            className={clsx("h-full", stat.color.replace('text', 'bg'))}
                          />
                       </div>
                    </div>
                  ))}
                </motion.div>
              )}

              <div className={clsx(
                "mt-1.5 flex items-center gap-2 opacity-0 group-hover:opacity-40 transition-opacity px-2",
                isUser ? "justify-end" : "justify-start"
              )}>
                <span className="text-[8px] font-bold uppercase tracking-widest text-white">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          );
        })}

        {streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-start max-w-[85%] group relative"
          >
            <div className="px-5 py-4 rounded-3xl text-[13px] leading-[1.6] bg-premium-card border-l-2 border-primary-gold text-white font-serif shadow-2xl">
              <div className="prose prose-invert prose-p:my-1 prose-ul:my-1 max-w-none">
                <Markdown>{streamingContent}</Markdown>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-2 px-2">
               <div className="w-1.5 h-1.5 bg-primary-gold rounded-full animate-pulse" />
               <span className="text-[8px] font-bold uppercase tracking-widest text-primary-gold/40">Inscribing...</span>
            </div>
          </motion.div>
        )}

        {isTyping && (
          <div className="self-start flex flex-col gap-3 px-6 py-4 bg-premium-card rounded-3xl border-l-2 border-primary-gold shadow-xl">
            <div className="flex gap-1.5">
              {[0, 0.2, 0.4].map((delay) => (
                <motion.div 
                  key={delay}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.6, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay }}
                  className="w-1.5 h-1.5 bg-primary-gold rounded-full" 
                />
              ))}
            </div>
            <p className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-primary-gold/40">
              {isRealityCheck ? "Analyzing Vulnerabilities..." : "Synthesizing Wisdom..."}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="p-6 bg-black border-t border-white/5">
        <div className="flex items-end gap-3 bg-premium-card rounded-[28px] border border-white/5 p-2 transition-all focus-within:border-primary-gold/30">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Approach the mind..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent text-white px-4 py-3 outline-none resize-none placeholder:text-white/20 text-sm font-light"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 shrink-0 rounded-full bg-primary-gold text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-20 transition-all"
          >
            <Send size={18} className="translate-x-[1px]" />
          </button>
        </div>
      </div>

      {/* Paywall Overlay */}
      <AnimatePresence>
        {showPaywall && (
          <div className="absolute inset-0 z-[100] bg-black/95 flex items-center justify-center p-8">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-premium-card border border-primary-gold/20 rounded-[40px] p-10 text-center space-y-8 max-w-sm w-full"
             >
                <div className="w-20 h-20 rounded-full bg-primary-gold/10 flex items-center justify-center mx-auto border border-primary-gold/30">
                   <Lock size={32} className="text-primary-gold outline-none" />
                </div>
                <div className="space-y-2">
                   <h2 className="font-serif text-3xl text-white">Full Audience</h2>
                   <p className="text-[10px] font-bold text-primary-gold uppercase tracking-[0.3em]">Access Privilege Depleted</p>
                </div>
                <ul className="text-left space-y-4">
                  {['Unlimited Wisdom Exchange', 'Historical Insight Pulse', 'Direct Priority Channel'].map((f, i) => (
                    <li key={i} className="flex items-center text-[10px] uppercase font-bold tracking-widest text-white/40">
                       <Sparkles size={14} className="text-primary-gold mr-4" />
                       {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => { setPremium(true); setShowPaywall(false); }}
                  className="w-full bg-primary-gold text-black py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                   Ascend to Premium
                </button>
                <button onClick={() => setShowPaywall(false)} className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                   Remain in Silence
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
