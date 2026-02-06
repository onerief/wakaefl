
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  doc, 
  setDoc, 
  getDoc, 
  runTransaction,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
  initializeFirestore,
  persistentLocalCache,
  getFirestore
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
import type { TournamentState, TournamentMode, Team, Partner, ChatMessage, Group, Match, KnockoutMatch, NewsItem, Product } from '../types';

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
// Removed persistentMultipleTabManager to prevent connection locks between tabs which can cause data sync issues
const firestore = initializeFirestore(app, { localCache: persistentLocalCache() });
const auth = getAuth(app);
const storage = getStorage(app); 

const TOURNAMENT_COLLECTION = 'tournament';
const SETTINGS_DOC = 'global_settings';

export const sanitizeData = (data: any): any => {
    if (!data) return null;
    try { return JSON.parse(JSON.stringify(data)); } catch (e) { return data; }
};

export const saveTournamentData = async (mode: TournamentMode, state: TournamentState) => {
  try {
    const cleanState = {
        teams: sanitizeData(state.teams),
        groups: sanitizeData(state.groups),
        matches: sanitizeData(state.matches),
        knockoutStage: sanitizeData(state.knockoutStage),
        status: state.status || 'active',
        history: sanitizeData(state.history || []),
        isRegistrationOpen: state.isRegistrationOpen ?? true,
        mode: state.mode,
        news: sanitizeData(state.news || []),
        products: sanitizeData(state.products || []),
        newsCategories: sanitizeData(state.newsCategories || []),
        shopCategories: sanitizeData(state.shopCategories || [])
    };
    const globalData = {
        banners: state.banners || [],
        partners: state.partners || [],
        rules: state.rules || '',
        headerLogoUrl: state.headerLogoUrl || ''
    };
    await Promise.all([
        setDoc(doc(firestore, TOURNAMENT_COLLECTION, mode), cleanState),
        setDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC), globalData)
    ]);
    return true;
  } catch (error) { console.error(error); throw error; }
};

export const subscribeToTournamentData = (mode: TournamentMode, callback: (data: TournamentState) => void) => {
    const modeDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const settingsDocRef = doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC);
    
    // Initialize as undefined to track loading state separately for each doc
    let modeData: any = undefined; 
    let globalData: any = undefined;

    const emit = () => { 
        // Only emit when both documents have returned (either with data or null if missing)
        if (modeData !== undefined && globalData !== undefined) { 
            const safeModeData = modeData || {};
            const safeGlobalData = globalData || {};
            
            callback({ 
                ...safeModeData, 
                banners: safeGlobalData.banners || [], 
                partners: safeGlobalData.partners || [], 
                rules: safeGlobalData.rules || '', 
                headerLogoUrl: safeGlobalData.headerLogoUrl || '' 
            }); 
        } 
    };

    const unsubMode = onSnapshot(modeDocRef, (snap) => { 
        modeData = snap.exists() ? snap.data() : null; 
        emit(); 
    }, (error) => {
        console.error("Error subscribing to tournament mode:", error);
        // Handle error by assuming null data so app doesn't hang
        if (modeData === undefined) { modeData = null; emit(); }
    });

    const unsubGlobal = onSnapshot(settingsDocRef, (snap) => { 
        globalData = snap.exists() ? snap.data() : null; 
        emit(); 
    }, (error) => {
        console.error("Error subscribing to global settings:", error);
        if (globalData === undefined) { globalData = null; emit(); }
    });

    return () => { unsubMode(); unsubGlobal(); };
};

export const onAuthChange = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);
export const signOutUser = () => signOut(auth);
export const signInUser = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const registerUser = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);
export const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const updateUserProfile = (user: User, displayName: string) => updateProfile(user, { displayName });
export const getUserTeams = async (email: string) => { return []; }; 
export const getTournamentData = async (mode: TournamentMode) => { return null; };
export const getGlobalStats = async (mode: any, data: any) => { return { teamCount: 0, partnerCount: 0 }; };
export const uploadTeamLogo = async (file: File) => { return ""; };
export const submitNewTeamRegistration = async (data: any, email: string) => { return ""; };
export const deleteRegistration = async (id: string) => {};
export const subscribeToRegistrations = (cb: any, err: any) => { return () => {}; };
export const subscribeToGlobalChat = (cb: any) => { return () => {}; };
export const sendGlobalChatMessage = async (t: string, u: any, a: boolean) => {};
export const submitTeamClaimRequest = async (m: any, t: string, e: string) => {};
export const updateUserTeamData = async (m: any, t: string, u: any) => {};
