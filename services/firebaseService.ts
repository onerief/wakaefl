
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
  getFirestore,
  getDocs
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
const firestore = initializeFirestore(app, { localCache: persistentLocalCache() });
const auth = getAuth(app);
const storage = getStorage(app); 

const TOURNAMENT_COLLECTION = 'tournament';
const SETTINGS_DOC = 'global_settings';
const CHAT_COLLECTION = 'global_chat';
const REGISTRATIONS_COLLECTION = 'registrations';

export const sanitizeData = (data: any): any => {
    if (!data) return null;
    try { return JSON.parse(JSON.stringify(data)); } catch (e) { return data; }
};

export const saveTournamentData = async (mode: TournamentMode, state: TournamentState) => {
  try {
    // Dehydrate function to convert Team objects back to IDs
    const dehydrateTeam = (t: any) => {
        if (!t) return null;
        if (typeof t === 'string') return t;
        return t.id || null;
    };

    const cleanMatches = (state.matches || []).map(m => ({
        ...m,
        teamA: dehydrateTeam(m.teamA),
        teamB: dehydrateTeam(m.teamB)
    }));

    const cleanGroups = (state.groups || []).map(g => ({
        ...g,
        teams: (g.teams || []).map(t => dehydrateTeam(t)),
        standings: [] // Standings are derived, do not persist
    }));

    const cleanKnockout = state.knockoutStage ? {
        'Play-offs': (state.knockoutStage['Play-offs'] || []).map(m => ({ ...m, teamA: dehydrateTeam(m.teamA), teamB: dehydrateTeam(m.teamB) })),
        'Round of 16': (state.knockoutStage['Round of 16'] || []).map(m => ({ ...m, teamA: dehydrateTeam(m.teamA), teamB: dehydrateTeam(m.teamB) })),
        'Quarter-finals': (state.knockoutStage['Quarter-finals'] || []).map(m => ({ ...m, teamA: dehydrateTeam(m.teamA), teamB: dehydrateTeam(m.teamB) })),
        'Semi-finals': (state.knockoutStage['Semi-finals'] || []).map(m => ({ ...m, teamA: dehydrateTeam(m.teamA), teamB: dehydrateTeam(m.teamB) })),
        'Final': (state.knockoutStage['Final'] || []).map(m => ({ ...m, teamA: dehydrateTeam(m.teamA), teamB: dehydrateTeam(m.teamB) }))
    } : null;

    const cleanHistory = (state.history || []).map(h => ({
        ...h,
        champion: dehydrateTeam(h.champion),
        runnerUp: h.runnerUp ? dehydrateTeam(h.runnerUp) : undefined
    }));

    const cleanState = {
        teams: sanitizeData(state.teams), // Teams list is the source of truth
        groups: cleanGroups,
        matches: cleanMatches,
        knockoutStage: cleanKnockout,
        status: state.status || 'active',
        history: cleanHistory,
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
  } catch (error) { 
      console.error("Error saving tournament data:", error); 
      throw error; 
  }
};

export const subscribeToTournamentData = (mode: TournamentMode, callback: (data: TournamentState) => void) => {
    const modeDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const settingsDocRef = doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC);
    
    let modeData: any = undefined; 
    let globalData: any = undefined;

    const emit = () => { 
        if (modeData !== undefined && globalData !== undefined) { 
            const safeModeData = modeData || {};
            const safeGlobalData = globalData || {};
            
            callback({ 
                ...safeModeData,
                teams: safeModeData.teams || [],
                groups: safeModeData.groups || [],
                matches: safeModeData.matches || [],
                news: safeModeData.news || [],
                history: safeModeData.history || [],
                products: safeModeData.products || [],
                
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

export const getUserTeams = async (email: string) => { 
    if (!email) return [];
    const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
    const results: { mode: TournamentMode, team: Team }[] = [];

    try {
        for (const mode of modes) {
            const docRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                const teams = data.teams || [];
                const owned = teams.filter((t: any) => t.ownerEmail && t.ownerEmail.toLowerCase() === email.toLowerCase());
                results.push(...owned.map((t: any) => ({ mode, team: t })));
            }
        }
    } catch (error) {
        console.error("Error fetching user teams:", error);
    }
    return results;
};

export const getTournamentData = async (mode: TournamentMode) => { 
    try {
        const docRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
        const snap = await getDoc(docRef);
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error("Error getting tournament data:", error);
        return null;
    }
};

export const getGlobalStats = async () => { 
    try {
        const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
        const uniqueTeamIds = new Set<string>();
        
        // Fetch all mode documents to count unique teams
        for (const mode of modes) {
            const snap = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, mode));
            if (snap.exists()) {
                const data = snap.data();
                const teams = data.teams || [];
                teams.forEach((t: any) => { if (t.id) uniqueTeamIds.add(t.id); });
            }
        }

        // Fetch settings for partner count
        const settingsSnap = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC));
        const partnerCount = settingsSnap.exists() ? (settingsSnap.data().partners?.length || 0) : 0;

        return { 
            teamCount: uniqueTeamIds.size, 
            partnerCount: partnerCount 
        };
    } catch (error) {
        console.error("Error fetching global stats:", error);
        return { teamCount: 0, partnerCount: 0 };
    }
};

export const uploadTeamLogo = async (file: File) => {
    try {
        const storageRef = ref(storage, `team-logos/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading logo:", error);
        throw error;
    }
};

export const submitNewTeamRegistration = async (data: any, email: string) => {
    try {
        const docRef = await addDoc(collection(firestore, REGISTRATIONS_COLLECTION), {
            ...data,
            submittedBy: email,
            timestamp: Date.now(),
            status: 'pending'
        });
        return docRef.id;
    } catch (error) {
        console.error("Error submitting registration:", error);
        throw error;
    }
};

export const deleteRegistration = async (id: string) => {
    try {
        await deleteDoc(doc(firestore, REGISTRATIONS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting registration:", error);
        throw error;
    }
};

export const subscribeToRegistrations = (callback: (regs: any[]) => void, onError: (error: any) => void) => {
    const q = query(collection(firestore, REGISTRATIONS_COLLECTION), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(regs);
    }, onError);
};

export const subscribeToGlobalChat = (callback: (messages: ChatMessage[]) => void) => {
    const q = query(
        collection(firestore, CHAT_COLLECTION), 
        orderBy("timestamp", "desc"), 
        limit(50)
    );
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
        callback(messages);
    }, (error) => {
        console.error("Chat subscription error:", error);
    });
};

export const sendGlobalChatMessage = async (text: string, user: User, isAdmin: boolean) => {
    try {
        await addDoc(collection(firestore, CHAT_COLLECTION), {
            text,
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userPhoto: user.photoURL,
            timestamp: Date.now(),
            isAdmin
        });
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

export const submitTeamClaimRequest = async (mode: TournamentMode, teamId: string, email: string) => {
    const docRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    await runTransaction(firestore, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) throw new Error("Tournament data not found");
        
        const data = docSnap.data();
        const teams = data.teams || [];
        const teamIndex = teams.findIndex((t: any) => t.id === teamId);
        
        if (teamIndex === -1) throw new Error("Team not found");
        if (teams[teamIndex].ownerEmail) throw new Error("Team is already owned");
        
        teams[teamIndex] = { ...teams[teamIndex], requestedOwnerEmail: email };
        transaction.update(docRef, { teams });
    });
};

export const updateUserTeamData = async (mode: TournamentMode, teamId: string, updates: Partial<Team>) => {
    const docRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    await runTransaction(firestore, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) throw new Error("Tournament data not found");
        
        const data = docSnap.data();
        const teams = data.teams || [];
        const teamIndex = teams.findIndex((t: any) => t.id === teamId);
        
        if (teamIndex === -1) throw new Error("Team not found");
        
        // Merge updates securely
        teams[teamIndex] = { ...teams[teamIndex], ...updates };
        transaction.update(docRef, { teams });
    });
};
