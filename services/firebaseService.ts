
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  enableIndexedDbPersistence,
  runTransaction
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
import type { TournamentState, TournamentMode } from '../types';

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
