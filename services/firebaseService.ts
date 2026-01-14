
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  enableIndexedDbPersistence,
  runTransaction,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  type User
} from "firebase/auth";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import type { TournamentState, TournamentMode, Team, Partner, ChatMessage } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCXZAvanJ8Ra-3oCRXvsaKBopGce4CPuXQ",
  authDomain: "wakaefootball.firebaseapp.com",
  projectId: "wakaefootball",
  storageBucket: "wakaefootball.firebasestorage.app",
  messagingSenderId: "521586554111",
  appId: "1:521586554111:web:aa9fa9caf44e06bbd848ca",
  measurementId: "G-CXXT1NJEWH"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); 
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(firestore).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Firestore persistence failed-precondition: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
      console.warn('Firestore persistence unimplemented');
    }
  });
}

const TOURNAMENT_COLLECTION = 'tournament';
const GLOBAL_CHAT_COLLECTION = 'global_chat';
const REGISTRATIONS_COLLECTION = 'registrations';

/**
 * Recursively cleans data for Firestore storage.
 * - Removes undefined values and functions
 * - Prevents circular reference crashes using a stack-based traversal
 * - Preserves Firestore-supported non-plain objects (like Timestamp or Date)
 * - Converts unknown class instances (like internal library objects) to strings to break potential hidden cycles
 */
const sanitizeData = (data: any, stack = new Set()): any => {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Cycle detection: Check if we've seen this exact object instance in our current recursion stack
  if (stack.has(data)) {
    console.warn('sanitizeData: Circular reference detected and broken.');
    return undefined;
  }

  if (Array.isArray(data)) {
    stack.add(data);
    const result = data.map(item => sanitizeData(item, stack)).filter(i => i !== undefined);
    stack.delete(data);
    return result;
  }

  // Only recurse into plain objects. 
  // We check proto to avoid recursing into library-specific class instances (like DocumentReference)
  const isPlainObject = Object.prototype.toString.call(data) === '[object Object]' && 
                        (Object.getPrototypeOf(data) === Object.prototype || Object.getPrototypeOf(data) === null);

  if (isPlainObject) {
    stack.add(data);
    const result = Object.keys(data).reduce((acc: any, key: string) => {
      const value = data[key];
      if (value !== undefined && typeof value !== 'function') {
        const sanitizedValue = sanitizeData(value, stack);
        if (sanitizedValue !== undefined) {
          acc[key] = sanitizedValue;
        }
      }
      return acc;
    }, {});
    stack.delete(data);
    return result;
  }

  // Allow specific Firestore-supported non-plain types
  if (data instanceof Date) return data;
  if (typeof data.toMillis === 'function') return data; // Potential Firestore Timestamp

  // For any other non-plain object (like a DocumentReference or a User instance),
  // return it as a string to ensure we don't carry internal library cycles into our clean state.
  return String(data);
};

// --- Registration Functions ---
export const submitNewTeamRegistration = async (teamData: Omit<Team, 'id'> & { preferredMode?: string }, userEmail: string) => {
    try {
        await addDoc(collection(firestore, REGISTRATIONS_COLLECTION), {
            ...teamData,
            submittedBy: userEmail,
            timestamp: Date.now(),
            status: 'pending'
        });
    } catch (error) {
        console.error("Error submitting registration:", error);
        throw error;
    }
};

export const subscribeToRegistrations = (callback: (registrations: any[]) => void) => {
    const q = query(
        collection(firestore, REGISTRATIONS_COLLECTION),
        orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const regs: any[] = [];
        snapshot.forEach((doc) => {
            regs.push({ id: doc.id, ...doc.data() });
        });
        callback(regs);
    });
};

export const deleteRegistration = async (regId: string) => {
    try {
        await deleteDoc(doc(firestore, REGISTRATIONS_COLLECTION, regId));
    } catch (error) {
        console.error("Error deleting registration:", error);
        throw error;
    }
};

// --- Global Chat Functions ---
export const subscribeToGlobalChat = (callback: (messages: ChatMessage[]) => void) => {
    const q = query(
        collection(firestore, GLOBAL_CHAT_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        callback(messages.reverse());
    });
};

export const sendGlobalChatMessage = async (text: string, user: User, isAdmin: boolean = false) => {
    if (!text.trim()) return;
    
    try {
        await addDoc(collection(firestore, GLOBAL_CHAT_COLLECTION), {
            text: text.trim(),
            userId: user.uid,
            userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            userPhoto: user.photoURL || null,
            timestamp: Date.now(),
            isAdmin
        });
    } catch (error) {
        console.error("Error sending chat:", error);
        throw error;
    }
};

// --- Storage Functions ---
export const uploadTeamLogo = async (file: File): Promise<string> => {
  try {
    const fileName = `logos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, fileName);
    const metadata = { contentType: file.type || 'image/jpeg' };
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error("Error uploading logo:", error);
    if (error.code === 'storage/unauthorized') {
        throw new Error("Izin ditolak: Anda harus login untuk mengupload gambar.");
    } else if (error.code === 'storage/canceled') {
        throw new Error("Upload dibatalkan.");
    }
    throw new Error("Gagal mengupload gambar. Silakan coba lagi.");
  }
};

// --- Database Functions ---
export const saveTournamentData = async (mode: TournamentMode, state: TournamentState) => {
  try {
    const tournamentDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const cleanData = sanitizeData(state);
    await setDoc(tournamentDocRef, cleanData);
  } catch (error: any) {
    if (error.code === 'permission-denied') return;
    console.error(`Firestore: Failed to save ${mode} data`, error);
  }
};

export const getTournamentData = async (mode: TournamentMode): Promise<TournamentState | null> => {
  try {
    const tournamentDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const docSnap = await getDoc(tournamentDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as TournamentState;
    }
    return null;
  } catch (error: any) {
    if (error.code === 'unavailable' || error.message.includes('offline')) return null;
    if (error.code === 'permission-denied') return null;
    console.error(`Firestore: Failed to get ${mode} data`, error);
    return null;
  }
};

export const getGlobalStats = async (
    overrideMode?: TournamentMode, 
    overrideData?: { teams: Team[], partners: Partner[] }
): Promise<{ teamCount: number; partnerCount: number }> => {
  try {
    const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
    const uniqueTeams = new Set<string>();
    const uniquePartners = new Set<string>();

    const promises = modes.map(mode => {
        if (mode === overrideMode && overrideData) {
            return Promise.resolve(null);
        }
        return getTournamentData(mode);
    });

    const results = await Promise.all(promises);

    results.forEach((data) => {
      if (data) {
        if (data.teams && Array.isArray(data.teams)) {
          data.teams.forEach((t: Team) => uniqueTeams.add(t.id));
        }
        if (data.partners && Array.isArray(data.partners)) {
          data.partners.forEach((p: Partner) => uniquePartners.add(p.id));
        }
      }
    });

    if (overrideData) {
        overrideData.teams.forEach(t => uniqueTeams.add(t.id));
        overrideData.partners.forEach(p => uniquePartners.add(p.id));
    }

    return { teamCount: uniqueTeams.size, partnerCount: uniquePartners.size };
  } catch (error) {
    console.error("Failed to get global stats:", error);
    return { teamCount: 0, partnerCount: 0 };
  }
};

export const submitTeamClaimRequest = async (mode: TournamentMode, teamId: string, userEmail: string) => {
  const tournamentDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
  try {
    await runTransaction(firestore, async (transaction) => {
      const docSnap = await transaction.get(tournamentDocRef);
      if (!docSnap.exists()) throw new Error("Data turnamen tidak ditemukan.");
      
      const data = docSnap.data() as TournamentState;
      const teams = data.teams || [];
      const teamIndex = teams.findIndex(t => t.id === teamId);
      if (teamIndex === -1) throw new Error("Tim tidak ditemukan.");
      
      const team = teams[teamIndex];
      if (team.ownerEmail) throw new Error("Tim ini sudah memiliki manager.");
      
      const updatedTeams = [...teams];
      updatedTeams[teamIndex] = { ...team, requestedOwnerEmail: userEmail };
      transaction.update(tournamentDocRef, { teams: updatedTeams });
    });
  } catch (e) {
    console.error("Claim Transaction failed: ", e);
    throw e;
  }
};

export const getUserTeams = async (userEmail: string): Promise<{ mode: TournamentMode, team: Team }[]> => {
    const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
    const userTeams: { mode: TournamentMode, team: Team }[] = [];
    try {
        const promises = modes.map(async (mode) => {
            const data = await getTournamentData(mode);
            if (data && data.teams) {
                const myTeam = data.teams.find(t => t.ownerEmail === userEmail);
                if (myTeam) return { mode, team: myTeam };
            }
            return null;
        });
        const results = await Promise.all(promises);
        results.forEach(res => { if (res) userTeams.push(res); });
        return userTeams;
    } catch (error) {
        console.error("Error fetching user teams:", error);
        return [];
    }
};

export const updateUserTeamData = async (mode: TournamentMode, teamId: string, updates: Partial<Team>) => {
    const tournamentDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    try {
        await runTransaction(firestore, async (transaction) => {
            const docSnap = await transaction.get(tournamentDocRef);
            if (!docSnap.exists()) throw new Error("Data not found");
            const data = docSnap.data() as TournamentState;
            const teams = data.teams;
            const teamIndex = teams.findIndex(t => t.id === teamId);
            if (teamIndex === -1) throw new Error("Team not found");

            const updatedTeam = { ...teams[teamIndex], ...updates };
            const updatedTeams = [...teams];
            updatedTeams[teamIndex] = updatedTeam;
            
            const groups = data.groups.map(g => ({
                ...g,
                teams: g.teams.map(t => t.id === teamId ? { ...t, ...updates } : t),
                standings: g.standings.map(s => s.team.id === teamId ? { ...s, team: { ...s.team, ...updates } } : s)
            }));

            const matches = data.matches.map(m => {
                let mUpdate = { ...m };
                if (m.teamA.id === teamId) mUpdate.teamA = { ...m.teamA, ...updates };
                if (m.teamB.id === teamId) mUpdate.teamB = { ...m.teamB, ...updates };
                return mUpdate;
            });

            transaction.update(tournamentDocRef, { 
                teams: updatedTeams,
                groups: groups,
                matches: matches
            });
        });
    } catch (error) {
        console.error("Failed to update team:", error);
        throw error;
    }
}

// --- Auth Functions ---
export const signInUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerUser = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
};

export const updateUserProfile = (user: User, displayName: string) => {
    return updateProfile(user, { displayName });
};

export const signOutUser = () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
