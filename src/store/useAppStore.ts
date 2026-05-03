import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSameDay, startOfDay } from 'date-fns';
import { syncUserData } from '../lib/firestoreService';
import { auth } from '../lib/firebase';

export interface Message {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: number;
  status?: 'sending' | 'error' | 'sent';
}

export interface DebateMessage {
  id: string;
  mentorId: string; // 'system' for summary
  content: string;
}

export interface Debate {
  id: string;
  topic: string;
  participants: string[];
  messages: DebateMessage[];
  summary?: string;
  timestamp: number;
}

export interface BlueprintTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface BlueprintPhase {
  phase: string;
  tasks: BlueprintTask[];
}

export interface BlueprintHabit {
  title: string;
  description: string;
}

export interface BlueprintAdvice {
  mentorId: string;
  advice: string;
}

export interface BlueprintContent {
  mission: string;
  roadmap: BlueprintPhase[];
  habits: BlueprintHabit[];
  obstacles: string[];
  advice: BlueprintAdvice[];
  milestones: { title: string; description: string }[];
}

export interface Blueprint {
  id: string;
  goal: string;
  timeframe: string;
  participants: string[];
  content?: BlueprintContent;
  status: 'generating' | 'active' | 'completed';
  timestamp: number;
}

export interface MemoryNode {
  id: string;
  timestamp: number;
  mentorId: string;
  title: string;
  content: string;
  type: 'reflection' | 'insight';
}

export interface JudgmentVerdict {
  mentorId: string;
  verdict: 'Support' | 'Reject' | 'Conditional Support';
  reasoning: string;
}

export interface JudgmentQuestion {
  mentorId: string;
  question: string;
}

export interface JudgmentSession {
  id: string;
  decision: string;
  participants: string[];
  interrogations: JudgmentQuestion[];
  userDefense?: string;
  verdicts?: JudgmentVerdict[];
  consensus?: string;
  status: 'generating_interrogation' | 'awaiting_defense' | 'generating_verdicts' | 'completed';
  timestamp: number;
}

export interface VoiceSession {
  id: string;
  mentorId: string;
  transcript: { role: 'user' | 'mentor'; content: string }[];
  duration: number;
  timestamp: number;
}

export interface ChatHistory {
  [mentorId: string]: Message[];
}

interface AppState {
  questionsAskedToday: number;
  realityChecksToday: number;
  debatesStartedToday: number;
  blueprintsGeneratedToday: number;
  voiceDurationUsedToday: number; // in seconds
  judgmentsStartedThisWeek: number;
  lastResetDate: number | null;
  lastWeeklyResetDate: number | null;
  isPremium: boolean;
  chatHistory: ChatHistory;
  debates: Debate[];
  blueprints: Blueprint[];
  memories: MemoryNode[];
  judgments: JudgmentSession[];
  voiceSessions: VoiceSession[];
  lastReflectionDate: number | null;
  favoriteMentorId: string | null;
  userName: string;
  userAura: string;
  conversationStyle: string;
  mentorMemoryEnabled: boolean;
  adaptiveIntelligenceEnabled: boolean;
  ambientSound: string;
  ambientVolume: number;
  intelligenceLabSettings: {
    deeperAnalysis: boolean;
    longFormResponses: boolean;
    debateIntensity: number;
    reflectionPrompts: boolean;
  };
  updateUserName: (name: string) => void;
  updateUserAura: (aura: string) => void;
  updateConversationStyle: (style: string) => void;
  setMentorMemoryEnabled: (enabled: boolean) => void;
  setAdaptiveIntelligenceEnabled: (enabled: boolean) => void;
  updateAmbientSound: (sound: string) => void;
  updateAmbientVolume: (volume: number) => void;
  updateIntelligenceLab: (settings: Partial<AppState['intelligenceLabSettings']>) => void;
  incrementVoiceDuration: (seconds: number) => void;
  addMessage: (mentorId: string, message: Message) => void;
  updateMessage: (mentorId: string, messageId: string, updates: Partial<Message>) => void;
  incrementQuestionsCount: () => void;
  incrementRealityChecksCount: () => void;
  incrementDebatesCount: () => void;
  incrementBlueprintsCount: () => void;
  incrementJudgmentsCount: () => void;
  addVoiceSession: (session: VoiceSession) => void;
  addDebate: (debate: Debate) => void;
  updateDebate: (id: string, updates: Partial<Debate>) => void;
  addBlueprint: (blueprint: Blueprint) => void;
  updateBlueprint: (id: string, updates: Partial<Blueprint>) => void;
  updateBlueprintTaskStatus: (blueprintId: string, phaseIndex: number, taskId: string, completed: boolean) => void;
  addMemory: (memory: MemoryNode) => void;
  setLastReflectionDate: (date: number) => void;
  addJudgment: (judgment: JudgmentSession) => void;
  updateJudgment: (id: string, updates: Partial<JudgmentSession>) => void;
  checkAndResetDailyLimit: () => void;
  setPremium: (status: boolean) => void;
  setFavoriteMentor: (id: string | null) => void;
  clearChatHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      questionsAskedToday: 0,
      realityChecksToday: 0,
      debatesStartedToday: 0,
      blueprintsGeneratedToday: 0,
      voiceDurationUsedToday: 0,
      judgmentsStartedThisWeek: 0,
      lastResetDate: null,
      lastWeeklyResetDate: null,
      isPremium: false,
      chatHistory: {},
      debates: [],
      blueprints: [],
      memories: [],
      judgments: [],
      voiceSessions: [],
      lastReflectionDate: null,
      favoriteMentorId: null,
      userName: 'Seeker',
      userAura: 'Obsidian Gold',
      conversationStyle: 'Strategic Challenger',
      mentorMemoryEnabled: true,
      adaptiveIntelligenceEnabled: true,
      ambientSound: 'Silent',
      ambientVolume: 0.5,
      intelligenceLabSettings: {
        deeperAnalysis: false,
        longFormResponses: true,
        debateIntensity: 5,
        reflectionPrompts: true,
      },

      updateUserName: (name) => {
        set({ userName: name });
        const uid = auth.currentUser?.uid;
        if (uid) syncUserData(uid, { userName: name });
      },
      updateUserAura: (aura) => {
        set({ userAura: aura });
        const uid = auth.currentUser?.uid;
        if (uid) syncUserData(uid, { userAura: aura });
      },
      updateConversationStyle: (style) => {
        set({ conversationStyle: style });
        const uid = auth.currentUser?.uid;
        if (uid) syncUserData(uid, { conversationStyle: style });
      },
      setMentorMemoryEnabled: (enabled) => {
        set({ mentorMemoryEnabled: enabled });
        const uid = auth.currentUser?.uid;
        if (uid) syncUserData(uid, { mentorMemoryEnabled: enabled });
      },
      setAdaptiveIntelligenceEnabled: (enabled) => {
        set({ adaptiveIntelligenceEnabled: enabled });
        const uid = auth.currentUser?.uid;
        if (uid) syncUserData(uid, { adaptiveIntelligenceEnabled: enabled });
      },
      updateAmbientSound: (sound) => {
        set({ ambientSound: sound });
        const uid = auth.currentUser?.uid;
        if (uid) syncUserData(uid, { ambientSound: sound });
      },
      updateAmbientVolume: (volume) => {
        set({ ambientVolume: volume });
        const uid = auth.currentUser?.uid;
        if (uid) syncUserData(uid, { ambientVolume: volume });
      },
      updateIntelligenceLab: (settings) => set((state) => {
        const newSettings = { ...state.intelligenceLabSettings, ...settings };
        const uid = auth.currentUser?.uid;
        if (uid) syncUserData(uid, { intelligenceLabSettings: newSettings });
        return { intelligenceLabSettings: newSettings };
      }),
      
      incrementVoiceDuration: (seconds) => set((state) => {
        const newVal = state.voiceDurationUsedToday + seconds;
        const uid = auth.currentUser?.uid;
        if (uid) syncUserData(uid, { voiceDurationUsedToday: newVal });
        return { voiceDurationUsedToday: newVal };
      }),

      addMessage: (mentorId, message) =>
        set((state) => {
          const mentorHistory = state.chatHistory[mentorId] || [];
          return {
            chatHistory: {
              ...state.chatHistory,
              [mentorId]: [...mentorHistory, message],
            },
          };
        }),

      updateMessage: (mentorId, messageId, updates) =>
        set((state) => {
          const mentorHistory = state.chatHistory[mentorId] || [];
          return {
            chatHistory: {
              ...state.chatHistory,
              [mentorId]: mentorHistory.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg),
            },
          };
        }),

      incrementQuestionsCount: () =>
        set((state) => {
          const newVal = state.questionsAskedToday + 1;
          const uid = auth.currentUser?.uid;
          if (uid) syncUserData(uid, { questionsAskedToday: newVal });
          return { questionsAskedToday: newVal };
        }),

      incrementRealityChecksCount: () =>
        set((state) => {
          const newVal = state.realityChecksToday + 1;
          const uid = auth.currentUser?.uid;
          if (uid) syncUserData(uid, { realityChecksToday: newVal });
          return { realityChecksToday: newVal };
        }),

      incrementDebatesCount: () =>
        set((state) => {
          const newVal = state.debatesStartedToday + 1;
          const uid = auth.currentUser?.uid;
          if (uid) syncUserData(uid, { debatesStartedToday: newVal });
          return { debatesStartedToday: newVal };
        }),
        
      incrementBlueprintsCount: () =>
        set((state) => {
          const newVal = state.blueprintsGeneratedToday + 1;
          const uid = auth.currentUser?.uid;
          if (uid) syncUserData(uid, { blueprintsGeneratedToday: newVal });
          return { blueprintsGeneratedToday: newVal };
        }),

      incrementJudgmentsCount: () =>
        set((state) => {
          const newVal = state.judgmentsStartedThisWeek + 1;
          const uid = auth.currentUser?.uid;
          if (uid) syncUserData(uid, { judgmentsStartedThisWeek: newVal });
          return { judgmentsStartedThisWeek: newVal };
        }),

      addVoiceSession: (session) =>
        set((state) => ({
          voiceSessions: [session, ...state.voiceSessions],
        })),

      addDebate: (debate) =>
        set((state) => ({
          debates: [debate, ...state.debates],
        })),

      updateDebate: (id, updates) =>
        set((state) => ({
          debates: state.debates.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),

      addBlueprint: (blueprint) =>
        set((state) => ({
          blueprints: [blueprint, ...state.blueprints],
        })),

      updateBlueprint: (id, updates) =>
        set((state) => ({
          blueprints: state.blueprints.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      updateBlueprintTaskStatus: (blueprintId, phaseIndex, taskId, completed) =>
        set((state) => ({
          blueprints: state.blueprints.map((b) => {
            if (b.id === blueprintId && b.content) {
              const newRoadmap = [...b.content.roadmap];
              const phase = { ...newRoadmap[phaseIndex] };
              phase.tasks = phase.tasks.map((t) => (t.id === taskId ? { ...t, completed } : t));
              newRoadmap[phaseIndex] = phase;
              return { ...b, content: { ...b.content, roadmap: newRoadmap } };
            }
            return b;
          }),
        })),

      addMemory: (memory) =>
        set((state) => ({
          memories: [memory, ...state.memories],
        })),

      setLastReflectionDate: (date) => set({ lastReflectionDate: date }),

      addJudgment: (judgment) =>
        set((state) => ({
          judgments: [judgment, ...state.judgments],
        })),

      updateJudgment: (id, updates) =>
        set((state) => ({
          judgments: state.judgments.map((j) => (j.id === id ? { ...j, ...updates } : j)),
        })),

      checkAndResetDailyLimit: () => {
        const state = get();
        const now = Date.now();
        const uid = auth.currentUser?.uid;

        if (!state.lastResetDate || !isSameDay(now, state.lastResetDate)) {
          const newState = { 
            lastResetDate: startOfDay(now).getTime(), 
            questionsAskedToday: 0, 
            realityChecksToday: 0, 
            debatesStartedToday: 0, 
            blueprintsGeneratedToday: 0, 
            voiceDurationUsedToday: 0 
          };
          set(newState);
          if (uid) syncUserData(uid, newState);
        }

        // Handle weekly reset approximately
        if (!state.lastWeeklyResetDate || (now - state.lastWeeklyResetDate > 7 * 24 * 60 * 60 * 1000)) {
          const newState = { 
            lastWeeklyResetDate: startOfDay(now).getTime(), 
            judgmentsStartedThisWeek: 0 
          };
          set(newState);
          if (uid) syncUserData(uid, newState);
        }
      },

      setPremium: (status) => set({ isPremium: status }),
      
      setFavoriteMentor: (id) => set({ favoriteMentorId: id }),

      clearChatHistory: () => set({ chatHistory: {}, debates: [] }),
    }),
    {
      name: 'mentormind-storage', // unique name
    }
  )
);
