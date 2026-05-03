import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircle, Sparkles, Settings, Headphones, Shield } from 'lucide-react';
import { mentors, MentorCategory } from '../lib/mentors';
import MentorImage from '../components/MentorImage';
import { useAuth } from '../components/AuthProvider';
import { getChatHistory } from '../lib/firestoreService';
import clsx from 'clsx';

const categories: (MentorCategory | 'All')[] = ['All', 'Science', 'Business', 'Philosophy', 'Strategy', 'Creativity'];

export default function Home() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<MentorCategory | 'All'>('All');

  const filteredMentors = mentors.filter(m => 
    selectedCategory === 'All' || m.category === selectedCategory
  );

  const preloadMentor = useCallback((mentorId: string) => {
    if (user) {
      // Background fetch to prime cache
      const unsub = getChatHistory(user.uid, mentorId, () => {});
      // Unsubscribe after a few seconds - we just want it in cache
      setTimeout(unsub, 5000);
    }
  }, [user]);

  return (
    <motion.div 
      className="flex-1 flex flex-col bg-black relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Cinematic Lighting */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-primary-gold/5 to-transparent pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary-gold/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="pt-16 pb-6 px-10 flex justify-between items-end z-20">
        <div className="space-y-1">
          <p className="text-[10px] font-sans font-medium uppercase tracking-[0.4em] text-primary-gold/60">Inner Chamber</p>
          <h1 className="font-serif text-3xl text-white tracking-tight">The Hall of Minds</h1>
        </div>
        <div className="flex gap-4">
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')}
              className="w-10 h-10 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center hover:border-primary-gold/30 hover:bg-primary-gold/10 transition-all group"
            >
              <Shield size={18} className="text-primary-gold group-hover:scale-110 transition-transform" />
            </button>
          )}
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center hover:border-primary-gold/30 hover:bg-primary-gold/10 transition-all group"
          >
            <Settings size={18} className="text-white/40 group-hover:text-primary-gold transition-colors" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-10 mb-8 z-20 flex gap-6 overflow-x-auto hide-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={clsx(
              "text-[10px] font-bold uppercase tracking-[0.2em] transition-all shrink-0 pb-1 border-b-[1.5px]",
              selectedCategory === cat 
                ? "text-primary-gold border-primary-gold" 
                : "text-white/20 border-transparent hover:text-white/40"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Horizontal Carousel */}
      <div className="flex-1 w-full overflow-x-auto items-center pb-24 px-10 snap-x snap-mandatory flex gap-8 hide-scrollbar relative z-10">
        <AnimatePresence mode="popLayout">
          {filteredMentors.map((mentor, i) => (
            <motion.div
              key={mentor.id}
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              whileHover={{ y: -8 }}
              onMouseEnter={() => preloadMentor(mentor.id)}
              onClick={() => navigate(`/chat/${mentor.id}`)}
              className="snap-center shrink-0 group relative cursor-pointer"
            >
              {/* Premium Card */}
              <div className="w-[300px] h-[480px] rounded-[40px] bg-premium-card border border-white/5 flex flex-col relative overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] group-hover:border-primary-gold/30 transition-all duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(201,168,76,0.05),transparent)]">
                {/* Background Shadow Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                
                {/* Mentor Portrait */}
                <div className="absolute inset-0 w-full h-[85%] overflow-hidden pointer-events-none">
                  <MentorImage 
                    src={mentor.imageUrl}
                    fallback={mentor.imageFallback}
                    alt={mentor.name}
                    size="full"
                    isAnimated={true}
                    className="object-top scale-100 group-hover:scale-105 transition-transform duration-[3s] ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-premium-card via-premium-card/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="mt-auto p-10 relative z-20 space-y-2">
                   <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-gold animate-pulse" />
                      <span className="text-[8px] font-bold text-primary-gold uppercase tracking-[0.3em] opacity-80">{mentor.category}</span>
                   </div>
                   <h2 className="font-serif text-3xl text-white tracking-normal group-hover:text-secondary-gold transition-colors">{mentor.name}</h2>
                   <p className="text-[10px] font-sans font-medium text-white/40 uppercase tracking-[0.2em]">{mentor.descriptor}</p>
                </div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>

              {/* Live Link Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/live/${mentor.id}`);
                }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-primary-gold text-black flex items-center justify-center shadow-[0_10px_30px_rgba(201,168,76,0.3)] hover:scale-110 active:scale-95 transition-all z-20 group/btn"
              >
                <Headphones size={20} className="group-hover/btn:rotate-12 transition-transform" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Carousel Padder */}
        <div className="w-[100px] shrink-0" />
      </div>

      {/* Footer Instructions */}
      <div className="pb-10 text-center opacity-20">
         <p className="text-[8px] font-sans uppercase tracking-[0.5em]">Scroll to chamber audience</p>
      </div>
    </motion.div>
  );
}
