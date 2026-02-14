
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
  getFirestore,
  where
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
import type { TournamentState, TournamentMode, Team, ChatMessage, Notification, Match, MatchComment } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCXZAvanJ8Ra-3oCRXvsaKBopGce4CPuXQ",
  authDomain: "wakaefootball.firebaseapp.com",
  projectId: "wakaefootball",
  storageBucket: "wakaefootball.firebasestorage.app",
  messagingSenderId: "521586554111",
  appId: "1:521586554111:web:aa9fa9caf44e06bbd848ca",
  measurementId: "G-CXXT1NJEWH"
};

// --- INITIALIZATION (ROBUST V10 PATTERN) ---
let app;
let firestore;
let auth;
let storage;

try {
    // Check if app is already initialized to prevent hot-reload errors
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    firestore = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
} catch (error) {
    console.error("CRITICAL: Firebase Initialization Failed", error);
}

const TOURNAMENT_COLLECTION = 'tournament';
const SETTINGS_DOC = 'global_settings';
const CHAT_COLLECTION = 'global_chat';
const MATCH_COMMENTS_COLLECTION = 'match_comments';
const REGISTRATIONS_COLLECTION = 'registrations';
const NOTIFICATIONS_COLLECTION = 'notifications';

// --- DATA SANITIZATION ---
// Robust helper to strip circular references, DOM nodes, and undefined values
export const deepClean = (input: any, stack = new WeakSet()): any => {
    // 1. Handle primitives and null immediately
    if (input === null || typeof input !== 'object') return input;
    
    // 2. Handle Date objects
    if (input instanceof Date) return input.toISOString();
    
    // 3. Cycle Detection
    if (stack.has(input)) return undefined;
    
    // 4. Aggressive DOM Node and React Element Filtering
    // nodeType > 0 implies a DOM element. _reactInternals implies a React fiber.
    // Also check for minified React Event constructors (often have obscure names but standard props)
    if (
        input.nodeType || 
        input._reactInternals || 
        input.$$typeof ||
        // Duck typing for Event-like objects (React Synthetic or Native)
        (input.nativeEvent && input.target) || 
        (typeof input.preventDefault === 'function' && typeof input.stopPropagation === 'function')
    ) {
        return undefined;
    }

    stack.add(input);

    try {
        let res: any;
        if (Array.isArray(input)) {
            // Filter out undefineds from arrays to keep them clean
            res = input.map(v => deepClean(v, stack)).filter(v => v !== undefined);
        } else {
            res = {};
            Object.keys(input).forEach(key => {
                // Skip internal React keys or known problem keys
                if (key.startsWith('_') || key === 'view' || key === 'source' || key === 'target' || key === 'currentTarget') return;
                
                const cleanVal = deepClean(input[key], stack);
                if (cleanVal !== undefined) {
                    res[key] = cleanVal;
                }
            });
        }
        return res;
    } catch (e) {
        return undefined; // Safe fallback if iteration fails
    }
};

export const sanitizeData = (data: any): any => {
    try {
        const cleaned = deepClean(data);
        // Double check with JSON stringify to ensure it's absolutely safe
        // If this throws, we catch it and return null to prevent app crash
        JSON.stringify(cleaned); 
        return cleaned;
    } catch (e) {
        console.error("SanitizeData Failed:", e);
        return null; // Safe fallback
    }
};

// --- AUTH FUNCTIONS ---
export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};
export const signOutUser = () => auth ? signOut(auth) : Promise.resolve();
export const signInUser = (email, password) => auth ? signInWithEmailAndPassword(auth, email, password) : Promise.reject("Service unavailable");
export const registerUser = (email, password) => auth ? createUserWithEmailAndPassword(auth, email, password) : Promise.reject("Service unavailable");
export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Auth not initialized");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};
export const updateUserProfile = async (user: User, displayName: string) => {
  if(user) await updateProfile(user, { displayName });
};

// --- STORAGE FUNCTIONS ---
export const uploadTeamLogo = async (file: File): Promise<string> => {
  if (!storage) throw new Error("Storage not initialized");
  const storageRef = ref(storage, `logos/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// --- DATA FETCHING ---
export const saveTournamentData = async (mode: TournamentMode, state: TournamentState) => {
  if (!firestore) return false;
  try {
    const dehydrateTeam = (t: any) => t?.id || null;

    const cleanMatches = (state.matches || []).map(m => ({
        ...m,
        teamA: dehydrateTeam(m.teamA),
        teamB: dehydrateTeam(m.teamB),
        playerStats: m.playerStats || null,
        comments: [] // Don't save comments to main structure, they are in subcollection
    }));

    const cleanGroups = (state.groups || []).map(g => ({
        ...g,
        teams: (g.teams || []).map(t => dehydrateTeam(t)),
        standings: []
    }));

    const cleanKnockout = state.knockoutStage ? sanitizeData(state.knockoutStage) : null;
    const cleanHistory = sanitizeData(state.history || []);

    const cleanState = sanitizeData({
        teams: state.teams,
        groups: cleanGroups,
        matches: cleanMatches,
        knockoutStage: cleanKnockout,
        status: state.status || 'active',
        isRegistrationOpen: state.isRegistrationOpen ?? true,
        mode: state.mode
    });

    if (!cleanState) {
        console.error("Critical: Failed to sanitize tournament state. Data not saved to prevent corruption.");
        return false;
    }

    const globalData = sanitizeData({
        banners: state.banners || [],
        partners: state.partners || [],
        rules: state.rules || '',
        headerLogoUrl: state.headerLogoUrl || '',
        news: state.news || [],
        products: state.products || [],
        newsCategories: state.newsCategories || [],
        shopCategories: state.shopCategories || [],
        marqueeMessages: state.marqueeMessages || [],
        history: cleanHistory, // IMPORTANT: Save history to global settings
        visibleModes: state.visibleModes || ['league', 'wakacl', 'two_leagues']
    });

    if (!globalData) {
        console.error("Critical: Failed to sanitize global settings.");
        return false;
    }

    await Promise.all([
        setDoc(doc(firestore, TOURNAMENT_COLLECTION, mode), cleanState),
        setDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC), globalData)
    ]);
    return true;
  } catch (error) { 
      console.error("Error saving data:", error); 
      // Do not throw, just log, to prevent app crash loop
      return false;
  }
};

export const getTournamentData = async (mode: TournamentMode): Promise<TournamentState | null> => {
  if (!firestore) return null;
  try {
      const d = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, mode));
      return d.exists() ? d.data() as TournamentState : null;
  } catch (e) {
      console.error("Failed to fetch data:", e);
      return null;
  }
};

// --- DATA SUBSCRIPTION (FIX FOR LEGEND MENU) ---
export const subscribeToTournamentData = (mode: TournamentMode, callback: (data: TournamentState) => void) => {
    if (!firestore) return () => {};
    
    const modeDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const settingsDocRef = doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC);
    
    let modeData: any = undefined; 
    let globalData: any = undefined;

    const emit = () => { 
        if (modeData !== undefined && globalData !== undefined) { 
            const safeMode = modeData || {};
            const safeGlobal = globalData || {};

            // Prioritize global history if available to fix Legend menu blankness
            const combinedHistory = (safeGlobal.history && safeGlobal.history.length > 0) 
                ? safeGlobal.history 
                : (safeMode.history || []);

            callback({ 
                ...safeMode,
                // Ensure arrays are initialized
                teams: safeMode.teams || [],
                groups: safeMode.groups || [],
                matches: safeMode.matches || [],
                // Merge Global Data
                news: safeGlobal.news || [],
                products: safeGlobal.products || [],
                newsCategories: safeGlobal.newsCategories || ['Match', 'Info'],
                shopCategories: safeGlobal.shopCategories || ['Coin'],
                marqueeMessages: safeGlobal.marqueeMessages || [],
                history: combinedHistory, 
                visibleModes: safeGlobal.visibleModes || ['league', 'wakacl', 'two_leagues'],
                banners: safeGlobal.banners || [], 
                partners: safeGlobal.partners || [], 
                rules: safeGlobal.rules || '', 
                headerLogoUrl: safeGlobal.headerLogoUrl || '' 
            }); 
        } 
    };

    const unsubMode = onSnapshot(modeDocRef, (snap) => { 
        modeData = snap.exists() ? snap.data() : null; 
        emit(); 
    });
    const unsubGlobal = onSnapshot(settingsDocRef, (snap) => { 
        globalData = snap.exists() ? snap.data() : null; 
        emit(); 
    });
    return () => { unsubMode(); unsubGlobal(); };
};

// --- GLOBAL BACKUP FUNCTIONS ---
export const getFullSystemBackup = async () => {
    if (!firestore) throw new Error("Service unavailable");
    const [league, wakacl, two_leagues, settings] = await Promise.all([
        getDoc(doc(firestore, TOURNAMENT_COLLECTION, 'league')),
        getDoc(doc(firestore, TOURNAMENT_COLLECTION, 'wakacl')),
        getDoc(doc(firestore, TOURNAMENT_COLLECTION, 'two_leagues')),
        getDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC))
    ]);

    return {
        backupType: 'FULL_SYSTEM',
        timestamp: Date.now(),
        data: deepClean({
            league: league.data(),
            wakacl: wakacl.data(),
            two_leagues: two_leagues.data(),
            global_settings: settings.data()
        })
    };
};

export const restoreFullSystem = async (backupData: any) => {
    if (!firestore) throw new Error("Service unavailable");
    const { league, wakacl, two_leagues, global_settings } = backupData.data;
    const promises = [];
    if (league) promises.push(setDoc(doc(firestore, TOURNAMENT_COLLECTION, 'league'), sanitizeData(league)));
    if (wakacl) promises.push(setDoc(doc(firestore, TOURNAMENT_COLLECTION, 'wakacl'), sanitizeData(wakacl)));
    if (two_leagues) promises.push(setDoc(doc(firestore, TOURNAMENT_COLLECTION, 'two_leagues'), sanitizeData(two_leagues)));
    if (global_settings) promises.push(setDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC), sanitizeData(global_settings)));
    await Promise.all(promises);
};

// --- STATS & TEAMS ---
export const getGlobalStats = async () => {
    if (!firestore) return { teamCount: 0, partnerCount: 0 };
    try {
        // Lightweight check
        const settings = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC));
        const partnerCount = settings.exists() ? (settings.data().partners || []).length : 0;
        return { teamCount: 0, partnerCount }; 
    } catch {
        return { teamCount: 0, partnerCount: 0 };
    }
};

export const getAllGlobalTeams = async (): Promise<Team[]> => {
    if (!firestore) return [];
    try {
        const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
        const uniqueTeams = new Map<string, Team>();
        await Promise.all(modes.map(async (mode) => {
            const d = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, mode));
            if (d.exists()) {
                const teams = (d.data().teams || []) as Team[];
                teams.forEach(t => { 
                    if(t && t.id && t.name !== 'TBD') uniqueTeams.set(t.name.toLowerCase(), t); 
                });
            }
        }));
        return Array.from(uniqueTeams.values());
    } catch (e) {
        console.error("Error getting global teams:", e);
        return [];
    }
};

export const getUserTeams = async (email: string) => {
    if (!firestore || !email) return [];
    try {
        const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
        const owned: { mode: TournamentMode, team: Team }[] = [];
        const normalizedEmail = email.toLowerCase();
        
        for (const mode of modes) {
            const d = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, mode));
            if (d.exists()) {
                const teams = (d.data().teams || []) as Team[];
                teams.forEach(team => {
                    if (team && team.ownerEmail?.toLowerCase() === normalizedEmail) {
                        owned.push({ mode, team });
                    }
                });
            }
        }
        return owned;
    } catch (e) {
        return [];
    }
};

// --- REGISTRATIONS ---
export const subscribeToRegistrations = (callback: (regs: any[]) => void, errorCallback?: (err: any) => void) => {
  if (!firestore) return () => {};
  const q = query(collection(firestore, REGISTRATIONS_COLLECTION), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, errorCallback);
};
export const deleteRegistration = (id: string) => {
    if(!firestore) return Promise.reject("No service");
    return deleteDoc(doc(firestore, REGISTRATIONS_COLLECTION, id));
};
export const submitNewTeamRegistration = async (data: any, email: string) => {
  if(!firestore) throw new Error("No service");
  return addDoc(collection(firestore, REGISTRATIONS_COLLECTION), { ...data, ownerEmail: email, timestamp: Date.now() });
};

// --- TEAM MANAGEMENT ---
export const addApprovedTeamToFirestore = async (mode: TournamentMode, team: Team) => {
  if(!firestore) throw new Error("No service");
  const modeRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
  await runTransaction(firestore, async (transaction) => {
    const snap = await transaction.get(modeRef);
    const data = snap.exists() ? snap.data() : { teams: [] };
    const teams = data.teams || [];
    transaction.set(modeRef, { ...data, teams: [...teams, team] }, { merge: true });
  });
};
export const updateUserTeamData = async (mode: TournamentMode, teamId: string, updates: Partial<Team>) => {
  if(!firestore) throw new Error("No service");
  const modeRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
  await runTransaction(firestore, async (transaction) => {
    const snap = await transaction.get(modeRef);
    if (!snap.exists()) return;
    const teams = (snap.data().teams || []) as Team[];
    const updatedTeams = teams.map(t => t.id === teamId ? { ...t, ...updates } : t);
    transaction.update(modeRef, { teams: updatedTeams });
  });
};
export const submitTeamClaimRequest = async (mode: TournamentMode, teamId: string, email: string) => {
  if(!firestore) throw new Error("No service");
  const modeRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
  await runTransaction(firestore, async (transaction) => {
    const snap = await transaction.get(modeRef);
    if (!snap.exists()) return;
    const teams = (snap.data().teams || []) as Team[];
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex !== -1) {
        teams[teamIndex].requestedOwnerEmail = email;
        transaction.update(modeRef, { teams: teams });
    }
  });
};

// --- MATCH MANAGEMENT ---
export const addMatchCommentToFirestore = async (mode: TournamentMode, matchId: string, comment: MatchComment) => {
  if(!firestore) throw new Error("No service");
  // Write to a separate collection to allow public writes even if main doc is locked
  return addDoc(collection(firestore, MATCH_COMMENTS_COLLECTION), {
      ...comment,
      matchId,
      tournamentMode: mode
  });
};

export const subscribeToMatchComments = (mode: TournamentMode, callback: (commentsMap: Record<string, MatchComment[]>) => void) => {
  if (!firestore) return () => {};
  const q = query(collection(firestore, MATCH_COMMENTS_COLLECTION), where("tournamentMode", "==", mode), orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snap) => {
    const commentsMap: Record<string, MatchComment[]> = {};
    snap.docs.forEach(doc => {
        const data = doc.data();
        const mId = data.matchId;
        if (!commentsMap[mId]) commentsMap[mId] = [];
        commentsMap[mId].push({ id: doc.id, ...data } as MatchComment);
    });
    callback(commentsMap);
  });
};

// --- CHAT ---
export const subscribeToGlobalChat = (callback: (messages: ChatMessage[]) => void) => {
  if (!firestore) return () => {};
  const q = query(collection(firestore, CHAT_COLLECTION), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
    callback(messages);
  });
};
export const sendGlobalChatMessage = async (text: string, user: User, isAdmin: boolean, teamName?: string) => {
  if (!firestore) throw new Error("No service");
  return addDoc(collection(firestore, CHAT_COLLECTION), {
    text, userId: user.uid, userName: user.displayName || 'Anonymous', userTeamName: teamName || null, userPhoto: user.photoURL || null, timestamp: Date.now(), isAdmin: !!isAdmin
  });
};

// --- NOTIFICATIONS ---
export const sendNotification = async (email: string, title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    if (!firestore) return;
    try {
        await addDoc(collection(firestore, NOTIFICATIONS_COLLECTION), { email, title, message, timestamp: Date.now(), read: false, type });
    } catch (e) { console.error(e); }
};
export const subscribeToNotifications = (email: string, callback: (notifs: Notification[]) => void) => {
    if (!firestore) return () => {};
    const q = query(collection(firestore, NOTIFICATIONS_COLLECTION), where("email", "==", email));
    return onSnapshot(q, (snap) => {
        const notifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        notifs.sort((a, b) => b.timestamp - a.timestamp);
        callback(notifs);
    });
};
export const deleteNotification = (id: string) => {
    if(!firestore) return Promise.reject("No service");
    return deleteDoc(doc(firestore, NOTIFICATIONS_COLLECTION, id));
};
