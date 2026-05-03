import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

interface MentorImageProps {
  src?: string;
  fallback: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  loadingClassName?: string;
  layoutId?: string;
}

export default function MentorImage({ 
  src, 
  fallback, 
  alt, 
  className, 
  containerClassName,
  size = 'md',
  loadingClassName,
  layoutId,
  isAnimated = true
}: MentorImageProps & { isAnimated?: boolean }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(true);
  }, [src]);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    full: 'w-full h-full'
  };

  return (
    <div className={clsx(
      "relative overflow-hidden flex items-center justify-center shrink-0",
      containerClassName,
      size !== 'full' && sizeClasses[size]
    )}>
      <AnimatePresence mode="wait">
        {!isLoaded && !error && (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={clsx("absolute inset-0 bg-white/5 flex items-center justify-center", loadingClassName)}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                 <motion.div 
                   key={i}
                   animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                   transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                   className="w-1 h-1 bg-primary-gold rounded-full"
                 />
              ))}
            </div>
          </motion.div>
        )}

        {error ? (
          <motion.div 
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex items-center justify-center bg-zinc-900 border border-primary-gold/10 rounded-inherit relative overflow-hidden"
          >
             {/* Subtle gold glow for fallback */}
            <div className="absolute inset-0 bg-primary-gold/5" />
            <span className="font-serif text-primary-gold/60 relative z-10 select-none italic" style={{ fontSize: size === 'full' ? '4rem' : '1.25rem' }}>
              {fallback}
            </span>
          </motion.div>
        ) : (
          <div className="relative w-full h-full overflow-hidden">
            <motion.div
              animate={isAnimated && isLoaded ? {
                scale: [1, 1.02, 1],
                y: [0, -1, 0],
              } : {}}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-full h-full"
            >
              <motion.img
                key="image"
                layoutId={layoutId}
                src={src}
                alt={alt}
                animate={isAnimated && isLoaded ? {
                   filter: [
                     "grayscale(100%) brightness(0.8) contrast(1.1)",
                     "grayscale(100%) brightness(0.82) contrast(1.1)",
                     "grayscale(100%) brightness(0.8) contrast(1.1)"
                   ]
                } : {}}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className={clsx(
                  "w-full h-full object-cover grayscale brightness-[0.8] contrast-[1.1]",
                  className,
                  isLoaded ? "opacity-100" : "opacity-0"
                )}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              
              {/* Blink Overlay (Subtle eye focus shift simulation) */}
              {isAnimated && isLoaded && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 0, 0.4, 0, 0, 0, 0, 0, 0.3, 0] 
                  }}
                  transition={{ 
                    duration: 10, 
                    repeat: Infinity,
                    times: [0, 0.4, 0.41, 0.42, 0.6, 0.8, 0.81, 0.82, 0.83, 1]
                  }}
                  className="absolute inset-0 bg-black pointer-events-none mix-blend-overlay"
                />
              )}
            </motion.div>

            {/* Premium Gold Glow Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-primary-gold/10 via-transparent to-transparent opacity-40" />
            
            {/* Subtle Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,black_100%)] opacity-50" />
            
            {/* Scanlines / Texture (Realistic screen feel) */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_2px,3px_100%] opacity-20" />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
