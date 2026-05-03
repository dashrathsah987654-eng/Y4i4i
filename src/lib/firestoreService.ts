import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  arrayUnion,
  increment,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Local cache for chat history to prevent redundant fetches
const chatHistoryCache = new Map<string, any[]>();

// User Actions
let userDataSyncTimeout: NodeJS.Timeout | null = null;
export const syncUserData = async (userId: string, updates: any) => {
  const path = `users/${userId}`;
  
  // Debounce sync to avoid rapid consecutive writes
  if (userDataSyncTimeout) clearTimeout(userDataSyncTimeout);
  
  return new Promise((resolve) => {
    userDataSyncTimeout = setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updates);
        resolve(true);
      } catch (error) {
        console.error("Delayed sync failed:", error);
        resolve(false);
      }
    }, 2000);
  });
};

// Chat Actions
export const saveChatMessage = async (userId: string, mentorId: string, message: any) => {
  const path = `users/${userId}/chatHistory/${mentorId}`;
  
  // Update local cache optimistically
  const current = chatHistoryCache.get(`${userId}_${mentorId}`) || [];
  chatHistoryCache.set(`${userId}_${mentorId}`, [...current, message]);

  try {
    const chatRef = doc(db, 'users', userId, 'chatHistory', mentorId);
    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
      await setDoc(chatRef, { messages: [message] });
    } else {
      await updateDoc(chatRef, {
        messages: arrayUnion(message)
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getChatHistory = (userId: string, mentorId: string, callback: (messages: any[]) => void) => {
  const cacheKey = `${userId}_${mentorId}`;
  const path = `users/${userId}/chatHistory/${mentorId}`;
  
  // Deliver cached messages immediately for instant UI
  if (chatHistoryCache.has(cacheKey)) {
    callback(chatHistoryCache.get(cacheKey)!);
  }

  return onSnapshot(doc(db, 'users', userId, 'chatHistory', mentorId), 
    (snapshot) => {
      if (snapshot.exists()) {
        const msgs = snapshot.data().messages || [];
        chatHistoryCache.set(cacheKey, msgs);
        callback(msgs);
      } else {
        chatHistoryCache.set(cacheKey, []);
        callback([]);
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
};

// Admin Actions
export const getAllUsersData = async () => {
  const path = 'users';
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    return usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

// Mentor Actions (Admin)
export const updateMentor = async (mentorId: string, updates: any) => {
  const path = `mentors/${mentorId}`;
  try {
    await updateDoc(doc(db, 'mentors', mentorId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// Admin Configs
export const updateAdminConfig = async (updates: any) => {
  const path = 'admin_configs/global';
  try {
    await setDoc(doc(db, 'admin_configs', 'global'), updates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
