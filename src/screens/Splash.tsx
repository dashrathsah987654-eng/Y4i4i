import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Brain } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div 
      className="flex-1 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-8">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ rotate: { duration: 30, repeat: Infinity, ease: 'linear' }, scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
            className="absolute -inset-8 rounded-full border border-primary-gold/10"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-12 rounded-full border border-primary-gold/5 border-dashed"
          />
          <div className="relative z-10 w-24 h-24 rounded-full bg-black border border-primary-gold/20 flex items-center justify-center cinematic-glow">
            <Brain size={40} className="text-primary-gold" strokeWidth={1} />
          </div>
          {/* Deep glow behind logo */}
          <div className="absolute inset-0 bg-primary-gold rounded-full blur-[60px] opacity-10" />
        </div>
        
        <h1 className="font-serif text-5xl font-light text-white mb-4 tracking-tighter text-glow-gold">
          MentorMind
        </h1>
        <div className="h-px w-12 bg-primary-gold/30 mb-6" />
        <p className="text-primary-gold/40 uppercase tracking-[0.5em] text-[8px] text-center max-w-[300px] leading-loose">
          Inhabiting the minds of the immortals
        </p>
      </motion.div>
    </motion.div>
  );
}
