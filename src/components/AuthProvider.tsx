import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAppStore } from '../store/useAppStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isSuspended: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  
  const setPremium = useAppStore(state => state.setPremium);
  const updateUserName = useAppStore(state => state.updateUserName);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          const isAdminEmail = firebaseUser.email === 'dashrathsah987654@gmail.com';
          const newUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            joinDate: Date.now(),
            isPremium: false,
            isSuspended: false,
            isAdmin: isAdminEmail, // Bootstrap admin
            userName: firebaseUser.displayName || 'Seeker',
            userAura: 'Obsidian Gold',
            questionsAskedToday: 0,
            realityChecksToday: 0,
            debatesStartedToday: 0,
            blueprintsGeneratedToday: 0,
            voiceDurationUsedToday: 0,
            judgmentsStartedThisWeek: 0,
            lastResetDate: Date.now(),
          };
          await setDoc(userRef, newUser);
          setIsAdmin(isAdminEmail);
          setIsSuspended(false);
        } else {
          const data = userDoc.data();
          setIsAdmin(data.isAdmin || false);
          setIsSuspended(data.isSuspended || false);
          setPremium(data.isPremium || false);
          updateUserName(data.userName || data.displayName || 'Seeker');
          
          // Sync counts to store
          useAppStore.setState({
            questionsAskedToday: data.questionsAskedToday || 0,
            realityChecksToday: data.realityChecksToday || 0,
            debatesStartedToday: data.debatesStartedToday || 0,
            blueprintsGeneratedToday: data.blueprintsGeneratedToday || 0,
            voiceDurationUsedToday: data.voiceDurationUsedToday || 0,
            judgmentsStartedThisWeek: data.judgmentsStartedThisWeek || 0,
            lastResetDate: data.lastResetDate || null,
          });
        }

        // Real-time listener for user state (isPremium, isSuspended, isAdmin)
        const unsubUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setIsAdmin(data.isAdmin || false);
            setIsSuspended(data.isSuspended || false);
            setPremium(data.isPremium || false);
          }
        });

        setLoading(false);
        return () => unsubUser();
      } else {
        setIsAdmin(false);
        setIsSuspended(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setPremium, updateUserName]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuspended }}>
      {children}
    </AuthContext.Provider>
  );
};
