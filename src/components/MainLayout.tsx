import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { motion } from 'motion/react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { name: 'Home', path: '/home' },
    { name: 'Debate', path: '/debate' },
    { name: 'Plan', path: '/blueprint' },
    { name: 'Chamber', path: '/judgment' },
    { name: 'Mem', path: '/memory' },
  ];

  return (
    <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-black text-white">
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      <footer className="absolute bottom-6 w-full flex justify-center z-20 pb-safe">
        <div className="flex items-center gap-3 sm:gap-4 text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] font-light bg-black/80 backdrop-blur-md px-4 py-3 rounded-full border border-white/10 shadow-[0_0_20px_rgba(201,168,76,0.1)]">
          {tabs.map((tab, i) => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <div key={tab.name} className="flex items-center gap-3 sm:gap-4">
                <span 
                  onClick={() => navigate(tab.path)}
                  className={clsx(
                    "cursor-pointer transition-colors relative flex items-center justify-center min-w-[36px]",
                    isActive ? "text-[#C9A84C]" : "text-white/40 hover:text-white/80"
                  )}
                >
                  {tab.name}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#C9A84C] rounded-full shadow-[0_0_5px_#C9A84C]"
                    />
                  )}
                </span>
                {i < tabs.length - 1 && (
                  <div className="w-0.5 h-0.5 bg-white/20 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
