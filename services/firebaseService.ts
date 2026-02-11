
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
  getDocs,
  updateDoc,
  arrayUnion,
  where,
  writeBatch
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
import type { TournamentState, TournamentMode, Team, Partner, ChatMessage, Group, Match, KnockoutMatch, NewsItem, Product, Notification } from '../types';

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
// initializeFirestore with settings prefers explicit imports over getFirestore() usually if we want cache
const firestore = initializeFirestore(app, { localCache: persistentLocalCache() });
const auth = getAuth(app);
const storage = getStorage(app); 

const TOURNAMENT_COLLECTION = 'tournament';
const SETTINGS_DOC = 'global_settings';
const CHAT_COLLECTION = 'global_chat';
const REGISTRATIONS_COLLECTION = 'registrations';
const NOTIFICATIONS_COLLECTION = 'notifications';

// --- CIRCULAR JSON FIX ---
// Uses WeakSet to track visited objects during deep copy/sanitization
export const sanitizeData = (data: any): any => {
    if (data === null || data === undefined) return null;
    
    // Primitives
    if (typeof data !== 'object') return data;
    
    // Handle Date objects
    if (data instanceof Date) return data.toISOString();

    // Use a custom replacer or deep copy function that handles circular refs
    const seen = new WeakSet();
    
    const deepCopy = (obj: any): any => {
        if (obj === null || typeof obj !== 'object') return obj;
        
        if (seen.has(obj)) {
            // Circular reference found, discard or return a marker
            return null; 
        }
        seen.add(obj);

        if (Array.isArray(obj)) {
            return obj.map(deepCopy);
        }

        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                // Filter out obviously non-data keys (like DOM elements or React internal props)
                if (key.startsWith('__') || key === 'nativeEvent') continue;
                newObj[key] = deepCopy(obj[key]);
            }
        }
        return newObj;
    };

    return deepCopy(data);
};

// --- AUTH FUNCTIONS ---
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
export const signOutUser = () => signOut(auth);
export const signInUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const registerUser = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};
export const updateUserProfile = async (user: User, displayName: string) => {
  await updateProfile(user, { displayName });
};

// --- STORAGE FUNCTIONS ---
export const uploadTeamLogo = async (file: File): Promise<string> => {
  const storageRef = ref(storage, `logos/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// --- DATA FETCHING ---
export const saveTournamentData = async (mode: TournamentMode, state: TournamentState) => {
  try {
    const dehydrateTeam = (t: any) => {
        if (!t) return null;
        if (typeof t === 'string') return t;
        return t.id || null;
    };

    const cleanMatches = (state.matches || []).map(m => ({
        ...m,
        teamA: dehydrateTeam(m.teamA),
        teamB: dehydrateTeam(m.teamB),
        playerStats: m.playerStats || null
    }));

    const cleanGroups = (state.groups || []).map(g => ({
        ...g,
        teams: (g.teams || []).map(t => dehydrateTeam(t)),
        standings: []
    }));

    const cleanKnockout = state.knockoutStage ? {
        'Play-offs': (state.knockoutStage['Play-offs'] || []).map(m => ({ ...m, teamA: dehydrateTeam(m.teamA), teamB: dehydrateTeam(m.teamB), playerStats: m.playerStats || null })),
        'Round of 16': (state.knockoutStage['Round of 16'] || []).map(m => ({ ...m, teamA: dehydrateTeam(m.teamA), teamB: dehydrateTeam(m.teamB), playerStats: m.playerStats || null })),
        'Quarter-finals': (state.knockoutStage['Quarter-finals'] || []).map(m => ({ ...m, teamA: dehydrateTeam(m.teamA), teamB: dehydrateTeam(m.teamB), playerStats: m.playerStats || null })),
        'Semi-finals': (state.knockoutStage['Semi-finals'] || []).map(m => ({ ...m, teamA: dehydrateTeam(m.teamA), teamB: dehydrateTeam(m.teamB), playerStats: m.playerStats || null })),
        'Final': (state.knockoutStage['Final'] || []).map(m => ({ ...m, teamA: dehydrateTeam(m.teamA), teamB: dehydrateTeam(m.teamB), playerStats: m.playerStats || null }))
    } : null;

    const cleanHistory = (state.history || []).map(h => ({
        ...h,
        champion: sanitizeData(h.champion),
        runnerUp: h.runnerUp ? sanitizeData(h.runnerUp) : undefined
    }));

    // Apply sanitization to ensure no circular structures are saved
    const cleanState = {
        teams: sanitizeData(state.teams),
        groups: cleanGroups,
        matches: cleanMatches,
        knockoutStage: cleanKnockout,
        status: state.status || 'active',
        isRegistrationOpen: state.isRegistrationOpen ?? true,
        mode: state.mode
    };

    const globalData = {
        banners: state.banners || [],
        partners: state.partners || [],
        rules: state.rules || '',
        headerLogoUrl: state.headerLogoUrl || '',
        news: sanitizeData(state.news || []),
        products: sanitizeData(state.products || []),
        newsCategories: sanitizeData(state.newsCategories || []),
        shopCategories: sanitizeData(state.shopCategories || []),
        marqueeMessages: sanitizeData(state.marqueeMessages || []),
        history: cleanHistory,
        visibleModes: state.visibleModes || ['league', 'wakacl', 'two_leagues']
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

export const getTournamentData = async (mode: TournamentMode): Promise<TournamentState | null> => {
  try {
      const d = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, mode));
      if (!d.exists()) return null;
      return d.data() as TournamentState;
  } catch (e) {
      console.error("Failed to fetch tournament data:", e);
      return null;
  }
};

// --- GLOBAL BACKUP FUNCTIONS ---
export const getFullSystemBackup = async () => {
    try {
        const [league, wakacl, two_leagues, settings] = await Promise.all([
            getDoc(doc(firestore, TOURNAMENT_COLLECTION, 'league')),
            getDoc(doc(firestore, TOURNAMENT_COLLECTION, 'wakacl')),
            getDoc(doc(firestore, TOURNAMENT_COLLECTION, 'two_leagues')),
            getDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC))
        ]);

        return {
            backupType: 'FULL_SYSTEM',
            timestamp: Date.now(),
            data: {
                league: league.exists() ? league.data() : null,
                wakacl: wakacl.exists() ? wakacl.data() : null,
                two_leagues: two_leagues.exists() ? two_leagues.data() : null,
                global_settings: settings.exists() ? settings.data() : null
            }
        };
    } catch (e) {
        console.error("Backup failed:", e);
        throw e;
    }
};

export const restoreFullSystem = async (backupData: any) => {
    if (backupData.backupType !== 'FULL_SYSTEM' || !backupData.data) {
        throw new Error("Format file backup tidak valid.");
    }

    const { league, wakacl, two_leagues, global_settings } = backupData.data;
    const promises = [];

    if (league) promises.push(setDoc(doc(firestore, TOURNAMENT_COLLECTION, 'league'), league));
    if (wakacl) promises.push(setDoc(doc(firestore, TOURNAMENT_COLLECTION, 'wakacl'), wakacl));
    if (two_leagues) promises.push(setDoc(doc(firestore, TOURNAMENT_COLLECTION, 'two_leagues'), two_leagues));
    if (global_settings) promises.push(setDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC), global_settings));

    await Promise.all(promises);
    return true;
};

export const getGlobalStats = async () => {
  try {
    const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
    const teamIds = new Set<string>();
    await Promise.all(modes.map(async (mode) => {
        const d = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, mode));
        if (d.exists()) {
            const teams = d.data().teams || [];
            teams.forEach((t: any) => { if(t && t.id) teamIds.add(t.id); });
        }
    }));
    const settings = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC));
    const partnerCount = settings.exists() ? (settings.data().partners || []).length : 0;
    return { teamCount: teamIds.size, partnerCount };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return { teamCount: 0, partnerCount: 0 };
  }
};

export const getAllGlobalTeams = async (): Promise<Team[]> => {
    try {
        const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
        const uniqueTeams = new Map<string, Team>();

        await Promise.all(modes.map(async (mode) => {
            const d = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, mode));
            if (d.exists()) {
                const teams = (d.data().teams || []) as Team[];
                teams.forEach(t => {
                    if (t && t.id && t.name && t.name !== 'TBD' && t.name !== 'BYE') {
                        uniqueTeams.set(t.name.toLowerCase(), t); 
                    }
                });
            }
        }));
        
        return Array.from(uniqueTeams.values());
    } catch (e) {
        console.error("Failed to fetch global teams:", e);
        return [];
    }
};

export const getUserTeams = async (email: string) => {
  try {
      const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
      const owned: { mode: TournamentMode, team: Team }[] = [];
      const normalizedEmail = (email || '').toLowerCase();
      if (!normalizedEmail) return [];

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
      console.error("Failed to fetch user teams:", e);
      return [];
  }
};

export const subscribeToTournamentData = (mode: TournamentMode, callback: (data: TournamentState) => void) => {
    const modeDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const leagueDocRef = doc(firestore, TOURNAMENT_COLLECTION, 'league'); 
    const settingsDocRef = doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC);
    
    let modeData: any = undefined; 
    let globalData: any = undefined;
    let leagueData: any = undefined;

    const emit = () => { 
        if (modeData !== undefined && globalData !== undefined && leagueData !== undefined) { 
            const safeModeData = modeData || {};
            const safeGlobalData = globalData || {};
            const safeLeagueData = leagueData || {};
            
            const news = (safeGlobalData.news && safeGlobalData.news.length > 0) 
                ? safeGlobalData.news 
                : (safeLeagueData.news && safeLeagueData.news.length > 0)
                    ? safeLeagueData.news
                    : (safeModeData.news || []);

            const products = (safeGlobalData.products && safeGlobalData.products.length > 0)
                ? safeGlobalData.products
                : (safeLeagueData.products && safeLeagueData.products.length > 0)
                    ? safeLeagueData.products
                    : (safeModeData.products || []);

            const newsCategories = (safeGlobalData.newsCategories && safeGlobalData.newsCategories.length > 0)
                ? safeGlobalData.newsCategories
                : (safeLeagueData.newsCategories || ['Match', 'Transfer', 'Info', 'Interview']);

            const shopCategories = (safeGlobalData.shopCategories && safeGlobalData.shopCategories.length > 0)
                ? safeGlobalData.shopCategories
                : (safeLeagueData.shopCategories || ['Coin', 'Account', 'Jasa', 'Merch']);

            const marqueeMessages = (safeGlobalData.marqueeMessages && safeGlobalData.marqueeMessages.length > 0)
                ? safeGlobalData.marqueeMessages
                : (safeLeagueData.marqueeMessages || [
                    "SELAMAT DATANG DI WAKAEFL HUB - TURNAMEN EFOOTBALL TERGOKIL SE-WAY KANAN!",
                    "SIAPKAN STRATEGI TERBAIKMU DAN RAIH GELAR JUARA!",
                    "WAKAEFL SEASON 1: THE GLORY AWAITS...",
                    "MAINKAN DENGAN SPORTIF, MENANG DENGAN ELEGAN!",
                    "UPDATE SKOR DAN KLASEMEN SECARA REAL-TIME DI SINI!"
                  ]);

            const history = safeGlobalData.history || safeLeagueData.history || safeModeData.history || [];
            const visibleModes = safeGlobalData.visibleModes || safeLeagueData.visibleModes || ['league', 'wakacl', 'two_leagues'];

            callback({ 
                ...safeModeData,
                teams: safeModeData.teams || [],
                groups: safeModeData.groups || [],
                matches: safeModeData.matches || [],
                news,
                products,
                newsCategories,
                shopCategories,
                marqueeMessages,
                history,
                visibleModes,
                banners: safeGlobalData.banners || safeLeagueData.banners || safeModeData.banners || [], 
                partners: safeGlobalData.partners || safeLeagueData.partners || safeModeData.partners || [], 
                rules: safeGlobalData.rules || safeModeData.rules || '', 
                headerLogoUrl: safeGlobalData.headerLogoUrl || safeModeData.headerLogoUrl || '' 
            }); 
        } 
    };

    const unsubMode = onSnapshot(modeDocRef, (snap) => { 
        modeData = snap.exists() ? snap.data() : null; 
        emit(); 
    }, () => { if (modeData === undefined) { modeData = null; emit(); } });
    const unsubLeague = onSnapshot(leagueDocRef, (snap) => {
        leagueData = snap.exists() ? snap.data() : null;
        emit();
    }, () => { if (leagueData === undefined) { leagueData = null; emit(); } });
    const unsubGlobal = onSnapshot(settingsDocRef, (snap) => { 
        globalData = snap.exists() ? snap.data() : null; 
        emit(); 
    }, () => { if (globalData === undefined) { globalData = null; emit(); } });
    return () => { unsubMode(); unsubLeague(); unsubGlobal(); };
};

// --- REGISTRATIONS ---
export const subscribeToRegistrations = (callback: (regs: any[]) => void, errorCallback?: (err: any) => void) => {
  const q = query(collection(firestore, REGISTRATIONS_COLLECTION), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    const regs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(regs);
  }, (err) => {
      console.warn("Snapshot index might not be ready yet:", err);
      if (errorCallback) errorCallback(err);
  });
};
export const deleteRegistration = (id: string) => deleteDoc(doc(firestore, REGISTRATIONS_COLLECTION, id));
export const submitNewTeamRegistration = async (data: any, email: string) => {
  return addDoc(collection(firestore, REGISTRATIONS_COLLECTION), {
    ...data,
    ownerEmail: email,
    timestamp: Date.now()
  });
};

// --- TEAM MANAGEMENT ---
export const addApprovedTeamToFirestore = async (mode: TournamentMode, team: Team) => {
  const modeRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
  await runTransaction(firestore, async (transaction) => {
    const snap = await transaction.get(modeRef);
    const data = snap.exists() ? snap.data() : { teams: [], matches: [], groups: [], knockoutStage: null };
    const teams = data.teams || [];
    transaction.set(modeRef, { ...data, teams: [...teams, team] });
  });
};
export const updateUserTeamData = async (mode: TournamentMode, teamId: string, updates: Partial<Team>) => {
  const modeRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
  await runTransaction(firestore, async (transaction) => {
    const snap = await transaction.get(modeRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const teams = (data.teams || []) as Team[];
    const updatedTeams = teams.map(t => t.id === teamId ? { ...t, ...updates } : t);
    transaction.update(modeRef, { teams: updatedTeams });
  });
};
export const submitTeamClaimRequest = async (mode: TournamentMode, teamId: string, email: string) => {
  const modeRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
  await runTransaction(firestore, async (transaction) => {
    const snap = await transaction.get(modeRef);
    if (!snap.exists()) throw new Error("Mode data not found.");
    const data = snap.data();
    const teams = (data.teams || []) as Team[];
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) throw new Error("Team not found.");
    if (teams[teamIndex].ownerEmail) throw new Error("Team already has an owner.");
    teams[teamIndex].requestedOwnerEmail = email;
    transaction.update(modeRef, { teams: teams });
  });
};

// --- CHAT ---
export const subscribeToGlobalChat = (callback: (messages: ChatMessage[]) => void) => {
  // Use 'desc' to get the latest messages, then reverse them for display
  const q = query(collection(firestore, CHAT_COLLECTION), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
    callback(messages);
  }, (e) => console.error("Global Chat Sub Failed:", e));
};

export const sendGlobalChatMessage = async (text: string, user: User, isAdmin: boolean, teamName?: string) => {
  return addDoc(collection(firestore, CHAT_COLLECTION), {
    text,
    userId: user.uid,
    userName: user.displayName || 'Anonymous',
    userTeamName: teamName || null,
    userPhoto: user.photoURL || null,
    timestamp: Date.now(),
    isAdmin: !!isAdmin
  });
};

// --- NOTIFICATIONS ---
export const sendNotification = async (email: string, title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    try {
        await addDoc(collection(firestore, NOTIFICATIONS_COLLECTION), {
            email,
            title,
            message,
            timestamp: Date.now(),
            read: false,
            type
        });
    } catch (e) {
        console.error("Error sending notification:", e);
    }
};

// FIX: REMOVED orderBy to prevent composite index error. Sorting happens client-side.
export const subscribeToNotifications = (email: string, callback: (notifs: Notification[]) => void) => {
    if (!email) return () => {};
    
    // Only filter by email to use single-field index
    const q = query(
        collection(firestore, NOTIFICATIONS_COLLECTION), 
        where("email", "==", email)
    );

    return onSnapshot(q, (snap) => {
        const notifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        // Sort client-side
        notifs.sort((a, b) => b.timestamp - a.timestamp);
        // Limit client-side
        callback(notifs.slice(0, 20));
    }, (error) => {
        console.error("Notification subscription error:", error);
    });
};

export const deleteNotification = async (id: string) => {
    await deleteDoc(doc(firestore, NOTIFICATIONS_COLLECTION, id));
};
