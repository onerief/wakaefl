
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User
} from "firebase/auth";
import type { TournamentState, TournamentMode } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBtj_YChCMkvsiUI_tMZ9TOqj_Qoampoz8",
  authDomain: "kanyeucl.firebaseapp.com",
  databaseURL: "https://kanyeucl-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kanyeucl",
  storageBucket: "kanyeucl.appspot.com",
  messagingSenderId: "77625357474",
  appId: "1:77625357474:web:5fdd65f1d43f997c66d3fb"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const auth = getAuth(app);

const TOURNAMENT_COLLECTION = 'tournament';

/**
 * Recursively removes all undefined values from an object.
 * Firestore does not support 'undefined' as a value and will throw errors.
 */
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
    if (error.code === 'permission-denied') {
      // Quietly ignore write failures for unauthorized users
      return;
    }
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
    if (error.code === 'permission-denied') {
      console.warn(`Firestore: Read permission denied for ${mode}. Check your security rules if this is unintended.`);
      return null;
    }
    console.error(`Firestore: Failed to get ${mode} data`, error);
    return null;
  }
};

// --- Auth Functions ---
export const signInUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
