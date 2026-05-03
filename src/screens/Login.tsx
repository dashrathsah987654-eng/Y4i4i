import { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Sparkles, BrainCircuit } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/home');
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user');
        return;
      }
      
      console.error('Login failed:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black text-white relative overflow-hidden px-8">
      {/* Background Energy */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-primary-gold/10 to-transparent pointer-events-none block blur-3xl opacity-50" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="z-10 flex flex-col items-center text-center max-w-sm w-full"
      >
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="w-24 h-24 bg-premium-card border border-primary-gold/30 rounded-[40px] flex items-center justify-center mb-10 shadow-2xl relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary-gold/5 group-hover:bg-primary-gold/10 transition-colors" />
          <BrainCircuit size={44} className="text-primary-gold" />
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="font-serif text-5xl mb-4 tracking-tighter text-white"
        >
          MentorMind
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="font-sans text-[10px] uppercase font-bold tracking-[0.8em] text-primary-gold mb-20 opacity-80"
        >
          Private Audience
        </motion.p>

        <motion.button
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          onClick={handleLogin}
          disabled={loading}
          className="w-full group relative flex items-center justify-center gap-4 py-5 bg-primary-gold text-black rounded-3xl font-sans text-[11px] font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_50px_rgba(201,168,76,0.3)] disabled:opacity-50"
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={20} />
              Access with Google
            </>
          )}
        </motion.button>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-16 flex items-center gap-4 opacity-20"
        >
          <div className="h-px w-16 bg-white/40" />
          <Sparkles size={14} className="text-primary-gold" />
          <div className="h-px w-16 bg-white/40" />
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-12 text-[10px] text-white leading-relaxed max-w-[260px] font-medium"
        >
          Elite mentorship by invitation or authorized credentials. Synchronization required for chamber access.
        </motion.p>
      </motion.div>

      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-primary-gold/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary-gold/5 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
