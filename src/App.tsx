/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAppStore } from './store/useAppStore';
import { AuthProvider, useAuth } from './components/AuthProvider';

import Splash from './screens/Splash';
import Login from './screens/Login';
import Home from './screens/Home';
import Chat from './screens/Chat';
import Profile from './screens/Profile';
import MainLayout from './components/MainLayout';
import DebateSetup from './screens/DebateSetup';
import DebateActive from './screens/DebateActive';
import BlueprintSetup from './screens/BlueprintSetup';
import BlueprintDashboard from './screens/BlueprintDashboard';
import MemoryVault from './screens/MemoryVault';
import JudgmentSetup from './screens/JudgmentSetup';
import JudgmentActive from './screens/JudgmentActive';
import Settings from './screens/Settings';
import LiveSession from './screens/LiveSession';
import AdminPanel from './screens/AdminPanel';

import { mentors } from './lib/mentors';
import { soundEngine } from './lib/SoundEngine';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, loading, isSuspended, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black gap-6">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border border-primary-gold/20 rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 border border-primary-gold/10 rounded-full border-t-transparent"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-primary-gold rounded-full animate-pulse shadow-[0_0_10px_rgba(201,168,76,1)]" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-primary-gold/40">Synchronizing</p>
          <p className="text-[8px] font-sans font-bold uppercase tracking-[0.2em] text-white/20">Temporal Chamber Logic</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isSuspended) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black p-8 text-center">
        <h2 className="text-red-500 font-serif text-2xl mb-4">Access Restricted</h2>
        <p className="text-white/40 text-sm">Your connection to the Inner Chamber has been suspended.</p>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const checkAndResetDailyLimit = useAppStore(state => state.checkAndResetDailyLimit);
  const userAura = useAppStore(state => state.userAura);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    checkAndResetDailyLimit();
    soundEngine.startAmbient();
    
    // Preload mentor images
    mentors.forEach(mentor => {
      if (mentor.imageUrl) {
        const img = new Image();
        img.src = mentor.imageUrl;
      }
    });
    
    const interval = setInterval(checkAndResetDailyLimit, 60000); 
    return () => clearInterval(interval);
  }, [checkAndResetDailyLimit]);

  const activeColor = '#C9A84C'; // Gold

  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>} />
        <Route path="*" element={
          <div className="flex bg-[#000000] text-white font-sans h-screen w-full justify-center items-center overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none transition-colors duration-1000 shadow-[inset_0_0_100px_rgba(201,168,76,0.05)]" style={{ backgroundImage: `radial-gradient(circle at 50% -20%, ${activeColor} 0%, transparent 60%)` }} />
            
            {/* Premium Chamber Frame */}
            <div 
              className="w-full h-full sm:w-[380px] sm:h-[800px] sm:max-h-[90vh] sm:rounded-[60px] sm:border border-white/5 relative bg-[#050505] overflow-hidden flex flex-col z-10 transition-all duration-1000 shadow-[0_0_100px_rgba(0,0,0,1)]"
              style={{ 
                boxShadow: `0 0 100px rgba(0,0,0,1), 0 0 40px ${activeColor}08` 
              }}
            >
              <Routes>
                <Route path="/" element={<Splash />} />
                <Route path="/login" element={<Login />} />
                
                <Route path="/home" element={<ProtectedRoute><MainLayout><Home /></MainLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
                <Route path="/debate" element={<ProtectedRoute><MainLayout><DebateSetup /></MainLayout></ProtectedRoute>} />
                <Route path="/debate/:debateId" element={<ProtectedRoute><DebateActive /></ProtectedRoute>} />
                <Route path="/blueprint" element={<ProtectedRoute><MainLayout><BlueprintSetup /></MainLayout></ProtectedRoute>} />
                <Route path="/blueprint/:blueprintId" element={<ProtectedRoute><BlueprintDashboard /></ProtectedRoute>} />
                <Route path="/memory" element={<ProtectedRoute><MainLayout><MemoryVault /></MainLayout></ProtectedRoute>} />
                <Route path="/judgment" element={<ProtectedRoute><MainLayout><JudgmentSetup /></MainLayout></ProtectedRoute>} />
                <Route path="/judgment/:judgmentId" element={<ProtectedRoute><JudgmentActive /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
                <Route path="/live/:mentorId" element={<ProtectedRoute><MainLayout><LiveSession /></MainLayout></ProtectedRoute>} />
                <Route path="/chat/:mentorId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

