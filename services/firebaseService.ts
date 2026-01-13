
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
const storage = getStorage(app); // Initialize Storage
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

const sanitizeData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  } else if (data !== null && typeof data === 'object') {
    return Object.keys(data).reduce((acc: any, key: string) => {
      const value = data[key];
      if (value !== undefined) {
        acc[key] = sanitizeData(value);
      }
      return acc;
    }, {});
  }
  return data;
};

// --- Registration Functions ---
export const submitNewTeamRegistration = async (teamData: Omit<Team, 'id'>, userEmail: string) => {
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
        // Return reversed so oldest is at top for chat UI
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
    // Create a unique filename: logos/<timestamp>_<filename>
    const fileName = `logos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, fileName);
    
    // Add metadata so the browser knows this is an image
    const metadata = {
        contentType: file.type || 'image/jpeg'
    };
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // Get the public URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error("Error uploading logo:", error);
    
    // Handle specific Firebase Storage errors
    if (error.code === 'storage/unauthorized') {
        throw new Error("Izin ditolak: Anda harus login untuk mengupload gambar.");
    } else if (error.code === 'storage/canceled') {
        throw new Error("Upload dibatalkan.");
    } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error("Gagal mengupload: Batas waktu terlampaui.");
    } else if (error.code === 'storage/invalid-checksum') {
        throw new Error("File rusak saat upload. Silakan coba lagi.");
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

export const getGlobalStats = async (): Promise<{ teamCount: number; partnerCount: number }> => {
  try {
    const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
    const uniqueTeams = new Set<string>();
    const uniquePartners = new Set<string>();

    const promises = modes.map(mode => getTournamentData(mode));
    const results = await Promise.all(promises);

    results.forEach(data => {
      if (data) {
        if (data.teams && Array.isArray(data.teams)) {
          data.teams.forEach((t: Team) => uniqueTeams.add(t.id));
        }
        if (data.partners && Array.isArray(data.partners)) {
          data.partners.forEach((p: Partner) => uniquePartners.add(p.id));
        }
      }
    });

    return {
      teamCount: uniqueTeams.size,
      partnerCount: uniquePartners.size
    };
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
      if (!docSnap.exists()) {
        throw new Error("Data turnamen tidak ditemukan.");
      }
      
      const data = docSnap.data() as TournamentState;
      const teams = data.teams || [];
      
      // Check if team exists
      const teamIndex = teams.findIndex(t => t.id === teamId);
      if (teamIndex === -1) throw new Error("Tim tidak ditemukan.");
      
      const team = teams[teamIndex];
      if (team.ownerEmail) throw new Error("Tim ini sudah memiliki manager.");
      
      // Optional: Check if user already owns a team in this mode
      const existingTeam = teams.find(t => t.ownerEmail === userEmail);
      if (existingTeam) throw new Error(`Anda sudah menjadi manager tim ${existingTeam.name} di mode ini.`);
      
      // Optional: Check if user already has a pending request
      const existingRequest = teams.find(t => t.requestedOwnerEmail === userEmail);
      if (existingRequest && existingRequest.id !== teamId) {
        throw new Error(`Anda masih memiliki request pending untuk tim ${existingRequest.name}.`);
      }

      // Update specific team
      const updatedTeams = [...teams];
      updatedTeams[teamIndex] = {
        ...team,
        requestedOwnerEmail: userEmail
      };
      
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
                if (myTeam) {
                    return { mode, team: myTeam };
                }
            }
            return null;
        });

        const results = await Promise.all(promises);
        results.forEach(res => {
            if (res) userTeams.push(res);
        });

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
