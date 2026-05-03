import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  FileText, 
  Sparkles,
  Clock,
  ShieldAlert,
  Headphones
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { mentors } from '../lib/mentors';
import { getMentorResponse } from '../lib/gemini';
import MentorImage from '../components/MentorImage';
import clsx from 'clsx';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const MAX_FREE_DURATION = 180; // 3 minutes in seconds

export default function LiveSession() {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const mentor = mentors.find(m => m.id === mentorId);
  
  const { 
    isPremium, 
    voiceDurationUsedToday, 
    incrementVoiceDuration,
    addVoiceSession,
  } = useAppStore();

  const [sessionDuration, setSessionDuration] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState<{ role: 'user' | 'mentor'; content: string }[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [isDeepMode, setIsDeepMode] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            handleUserVoiceInput(event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setCurrentSpeech(interimTranscript);
      };

      recognitionRef.current.onend = () => {
        if (isListening) recognitionRef.current.start();
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, [isListening]);

  // Session Timer
  useEffect(() => {
    if (isListening || isSpeaking || isThinking) {
      timerRef.current = setInterval(() => {
        setSessionDuration(prev => {
          const next = prev + 1;
          if (!isPremium && (voiceDurationUsedToday + next) >= MAX_FREE_DURATION) {
            handleEndSession();
            setShowPaywall(true);
            return prev;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening, isSpeaking, isThinking, isPremium, voiceDurationUsedToday]);

  const handleToggleListening = () => {
    if (!isListening) {
      setIsListening(true);
      setCurrentSpeech("");
      recognitionRef.current?.start();
    } else {
      setIsListening(false);
      recognitionRef.current?.stop();
    }
  };

  const handleUserVoiceInput = async (text: string) => {
    if (!text.trim()) return;
    
    setTranscript(prev => [...prev, { role: 'user', content: text }]);
    setIsListening(false);
    recognitionRef.current?.stop();
    setIsThinking(true);

    // Realistic thinking pause
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    const systemPrompt = `Mentor: ${mentor?.name}. Live Voice Protocol.
    Be natural and concise (2 sentences).
    Persona: ${mentor?.descriptor}`;

    const response = await getMentorResponse(systemPrompt, text, transcript, false, !isDeepMode);
    
    setIsThinking(false);
    handleMentorVoiceOutput(response);
    setTranscript(prev => [...prev, { role: 'mentor', content: response }]);
  };

  const handleMentorVoiceOutput = (text: string) => {
    if (isMuted) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    if (mentor?.id === 'einstein') { utterance.rate = 0.85; utterance.pitch = 0.9; }
    if (mentor?.id === 'musk') { utterance.rate = 1.05; utterance.pitch = 1.0; }
    if (mentor?.id === 'curie') { utterance.rate = 0.95; utterance.pitch = 1.1; }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsListening(true);
      recognitionRef.current?.start();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleEndSession = () => {
    setIsListening(false);
    setIsSpeaking(false);
    setIsThinking(false);
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    
    if (sessionDuration > 5 && mentor) {
      addVoiceSession({
        id: crypto.randomUUID(),
        mentorId: mentor.id,
        transcript,
        duration: sessionDuration,
        timestamp: Date.now()
      });
      incrementVoiceDuration(sessionDuration);
    }
    
    if (!showPaywall) navigate('/home');
  };

  if (!mentor) return null;

  const totalUsed = voiceDurationUsedToday + sessionDuration;
  const remaining = Math.max(0, MAX_FREE_DURATION - totalUsed);

  return (
    <motion.div 
      className="flex-1 flex flex-col bg-black relative overflow-hidden h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Cinematic Aura */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-gold/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-gold/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-30 px-6 pt-16 pb-6 flex items-center justify-between">
        <button 
          onClick={handleEndSession}
          className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all shadow-inner"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          <p className="text-[9px] font-sans font-bold uppercase tracking-[0.4em] text-primary-gold mb-1">Live Audience</p>
          <h2 className="font-serif text-white text-xl tracking-tight leading-none">{mentor.name}</h2>
        </div>

        <button 
          onClick={() => setShowTranscript(!showTranscript)}
          className={clsx(
            "p-3 rounded-2xl border transition-all shadow-inner",
            showTranscript ? "bg-primary-gold text-black border-primary-gold" : "bg-white/5 border-white/5 text-white/40"
          )}
        >
          <FileText size={20} />
        </button>
      </div>

      {/* Experience Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center px-10 pb-20">
        
        {/* Breathing Portrait */}
        <div className="relative mb-12">
          {/* Animated Gold Ring */}
          <motion.div 
            className="absolute -inset-8 border border-primary-gold/20 rounded-full"
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -inset-4 border border-primary-gold/10 rounded-full"
            animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          
          <motion.div
            className="relative z-10 p-1.5 rounded-full border-2 border-primary-gold/20 bg-black shadow-[0_0_100px_rgba(201,168,76,0.1)]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <MentorImage 
              src={mentor.imageUrl}
              fallback={mentor.imageFallback}
              alt={mentor.name}
              size="lg"
              className="w-44 h-44 rounded-full contrast-125 brightness-110"
              containerClassName="w-44 h-44 rounded-full overflow-hidden"
              layoutId={`mentor-image-${mentor.id}`}
            />
          </motion.div>

          <AnimatePresence>
            {(isThinking || isSpeaking) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary-gold text-black px-4 py-1.5 rounded-full text-[8px] font-bold tracking-[0.2em] whitespace-nowrap shadow-xl z-20"
              >
                {isThinking ? (
                  isDeepMode ? "PROBING DEPTHS..." : "CONSIDERING..."
                ) : (
                  "REPLAYING..."
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Text */}
        <div className="text-center h-8 flex flex-col justify-center mb-10">
          <AnimatePresence mode="wait">
            {isSpeaking ? (
              <motion.span 
                key="responding"
                initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
                className="text-[10px] font-mono tracking-[0.4em] text-primary-gold"
              >
                UPLINK ACTIVE
              </motion.span>
            ) : isListening ? (
              <motion.span 
                key="listening"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] font-mono tracking-[0.4em] text-white/30"
              >
                LISTENING...
              </motion.span>
            ) : (
              <motion.span 
                key="ready"
                initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }}
                className="text-[10px] font-mono tracking-[0.4em] text-white"
              >
                STANDBY
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Waveform */}
        <div className="h-20 flex items-center justify-center gap-2 w-full max-w-[200px] px-6">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className={clsx(
                "w-1 rounded-full transition-colors duration-500",
                isSpeaking ? "bg-primary-gold" : isListening ? "bg-primary-gold/40" : "bg-white/10"
              )}
              animate={{
                height: (isSpeaking || isListening) 
                  ? [10, 10 + Math.random() * (isSpeaking ? 60 : 20), 10] 
                  : 6
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Interim Text */}
        <AnimatePresence>
          {currentSpeech && isListening && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               className="mt-12 px-8 py-5 rounded-[32px] bg-white/[0.03] border border-white/5 backdrop-blur-3xl text-white/80 font-serif italic text-sm text-center max-w-sm"
            >
               "{currentSpeech}"
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Overlay */}
      <div className="relative z-30 pb-20 px-10 flex flex-col items-center gap-10">
        
        {/* Timer Visualization */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-primary-gold animate-pulse" />
              <span className="text-[14px] font-mono text-white/80 tracking-widest font-medium">
                  {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            
            <button 
              onClick={() => setIsDeepMode(!isDeepMode)}
              className={clsx(
                "px-4 py-1.5 rounded-full border text-[9px] font-sans font-bold uppercase tracking-widest transition-all",
                isDeepMode ? "bg-primary-gold/10 border-primary-gold text-primary-gold" : "bg-white/5 border-white/5 text-white/40"
              )}
            >
              {isDeepMode ? "Deep Response" : "Fast Mode"}
            </button>
          </div>
          {!isPremium && (
             <p className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-white/20">
               Time Remaining: {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
             </p>
          )}
        </div>

        <div className="flex items-center gap-10">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={clsx(
              "w-16 h-16 rounded-3xl border flex items-center justify-center transition-all bg-white/5 shadow-inner",
              isMuted ? "border-red-500/20 text-red-500 bg-red-500/5 rotate-12" : "border-white/5 text-white/40 hover:text-white"
            )}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>

          <button 
            onClick={handleToggleListening}
            className={clsx(
              "w-28 h-28 rounded-[40px] flex items-center justify-center transition-all relative group",
              isListening 
                ? "bg-primary-gold text-black shadow-[0_20px_50px_rgba(201,168,76,0.3)]" 
                : "bg-white/5 border border-white/10 text-primary-gold hover:border-primary-gold/40"
            )}
          >
            <div className="relative z-10">
              {isListening ? <Mic size={44} /> : <MicOff size={44} />}
            </div>
            {isListening && (
              <motion.div 
                 className="absolute inset-0 border-2 border-primary-gold rounded-[40px]"
                 animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                 transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </button>

          <button 
            onClick={handleEndSession}
            className="w-16 h-16 rounded-3xl border border-white/5 bg-white/5 text-white/40 hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/5 transition-all flex items-center justify-center shadow-inner"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Transcript Layer */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 40, stiffness: 400 }}
            className="absolute inset-x-0 bottom-0 top-[120px] z-[120] bg-black border-t border-white/10 rounded-t-[50px] shadow-[0_-50px_100px_rgba(0,0,0,1)] flex flex-col"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-6 mb-8" />
            
            <div className="px-10 flex items-center justify-between mb-10">
              <div>
                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-primary-gold mb-1">Session Transcript</p>
                <h3 className="font-serif text-white text-2xl tracking-tight">Preserved Dialogues</h3>
              </div>
              <button 
                onClick={() => setShowTranscript(false)} 
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-32 space-y-10 custom-scrollbar">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-4">
                  <FileText size={64} />
                  <p className="font-serif italic text-lg max-w-[200px]">
                    "History is yet to be recorded for this session."
                  </p>
                </div>
              ) : (
                transcript.map((log, i) => (
                  <div key={i} className={clsx("flex flex-col", log.role === 'user' ? "items-end" : "items-start")}>
                    <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-white/20 mb-3 px-2">
                       {log.role === 'user' ? 'GUEST INQUIRY' : mentor.name}
                    </p>
                    <div className={clsx(
                      "px-7 py-5 rounded-[32px] font-serif text-base leading-[1.6] max-w-[90%]",
                      log.role === 'user' 
                        ? "bg-[#222222] text-white/90 italic" 
                        : "bg-premium-card border-l-2 border-primary-gold text-white"
                    )}>
                      {log.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Luxury Paywall */}
      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-premium-card border border-primary-gold/30 rounded-[40px] p-10 text-center space-y-8 max-w-sm"
            >
              <div className="w-20 h-20 rounded-[32px] bg-primary-gold/10 flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={32} className="text-primary-gold" />
              </div>
              <div className="space-y-4">
                <h3 className="font-serif text-3xl text-white tracking-tight">Access Revoked</h3>
                <p className="text-[11px] font-sans font-medium text-white/40 leading-relaxed uppercase tracking-[0.1em]">
                  Your complimentary temporal link has dissolved. Establish a permanent connection to remain in audience.
                </p>
              </div>
              <div className="pt-8 space-y-4">
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full bg-primary-gold text-black py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(201,168,76,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  UPGRADE CLEARANCE
                </button>
                <button 
                  onClick={() => { setShowPaywall(false); navigate('/home'); }}
                  className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                >
                  SEVER LINK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
