
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  runTransaction,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
  getFirestore,
  where,
  writeBatch,
  arrayUnion
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

// --- INITIALIZATION ---
let app;
let firestore: any;
let auth: any;
let storage;

try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    firestore = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

const TOURNAMENT_COLLECTION = 'tournament';
const SETTINGS_DOC = 'global_settings';
const CHAT_COLLECTION = 'global_chat';
const MATCH_COMMENTS_COLLECTION = 'match_comments';
const REGISTRATIONS_COLLECTION = 'registrations';
const NOTIFICATIONS_COLLECTION = 'notifications';

// --- DATA SANITIZATION ---
export const deepClean = (input: any, stack = new WeakSet()): any => {
    if (input === null || typeof input !== 'object') return input;
    if (input instanceof Date) return input.toISOString();
    if (stack.has(input)) return undefined;
    
    if (
        (input as any).nodeType || 
        (input as any)._reactInternals || 
        (input as any).$$typeof ||
        ((input as any).nativeEvent && (input as any).target) || 
        (typeof (input as any).preventDefault === 'function' && typeof (input as any).stopPropagation === 'function')
    ) {
        return undefined;
    }

    stack.add(input);

    try {
        let res: any;
        if (Array.isArray(input)) {
            res = input.map(v => deepClean(v, stack)).filter(v => v !== undefined);
        } else {
            res = {};
            Object.keys(input).forEach(key => {
                if (key.startsWith('_') || key === 'view' || key === 'source' || key === 'target' || key === 'currentTarget') return;
                const cleanVal = deepClean(input[key], stack);
                if (cleanVal !== undefined) {
                    res[key] = cleanVal;
                }
            });
        }
        return res;
    } catch (e) {
        return undefined; 
    }
};

export const sanitizeData = (data: any): any => {
    try {
        const cleaned = deepClean(data);
        return cleaned;
    } catch (e) {
        console.error("SanitizeData Failed:", e);
        return null; 
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
export const getTournamentData = async (mode: TournamentMode): Promise<TournamentState | null> => {
  if (!firestore || !mode) return null;
  try {
    const modeDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const settingsDocRef = doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC);
    
    const [modeSnap, settingsSnap] = await Promise.all([
        getDoc(modeDocRef),
        getDoc(settingsDocRef)
    ]);

    if (!modeSnap.exists()) return null;

    const modeData = modeSnap.data();
    const globalData = settingsSnap.exists() ? settingsSnap.data() : {};
    
    const combinedHistory = (globalData.history && globalData.history.length > 0) 
        ? globalData.history 
        : (modeData.history || []);

    return { 
        ...modeData,
        teams: modeData.teams || [],
        groups: modeData.groups || [],
        matches: modeData.matches || [],
        news: globalData.news || [],
        products: globalData.products || [],
        newsCategories: globalData.newsCategories || ['Match', 'Info'],
        shopCategories: globalData.shopCategories || ['Coin'],
        marqueeMessages: globalData.marqueeMessages || [],
        history: combinedHistory, 
        visibleModes: globalData.visibleModes || ['league', 'wakacl', 'two_leagues'],
        banners: globalData.banners || [], 
        partners: globalData.partners || [], 
        rules: globalData.rules || '', 
        headerLogoUrl: globalData.headerLogoUrl || '' 
    } as unknown as TournamentState;
  } catch (error) { 
      console.error("Error fetching tournament data:", error); 
      return null;
  }
};

export const saveTournamentData = async (mode: TournamentMode, state: TournamentState) => {
  if (!firestore || !mode) return false;
  try {
    const dehydrateTeam = (t: any) => t?.id || null;
    const cleanMatches = (state.matches || []).map(m => ({
        ...m,
        teamA: dehydrateTeam(m.teamA),
        teamB: dehydrateTeam(m.teamB),
        playerStats: m.playerStats || null,
        comments: [] 
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
        mode: state.mode,
        scheduleSettings: state.scheduleSettings
    });

    if (!cleanState) return false;

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
        history: cleanHistory, 
        visibleModes: state.visibleModes || ['league', 'wakacl', 'two_leagues']
    });

    if (!globalData) return false;

    await Promise.all([
        setDoc(doc(firestore, TOURNAMENT_COLLECTION, mode), cleanState),
        setDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC), globalData)
    ]);
    return true;
  } catch (error) { 
      console.error("Error saving data:", error); 
      return false;
  }
};

export const subscribeToTournamentData = (
    mode: TournamentMode, 
    callback: (data: TournamentState) => void,
    errorCallback?: (err: any) => void
) => {
    if (!firestore || !mode) {
        if (errorCallback) errorCallback("Firestore not initialized or mode missing");
        return () => {};
    }
    
    const modeDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const settingsDocRef = doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC);
    
    let modeData: any = undefined; 
    let globalData: any = undefined;

    const emit = () => { 
        if (modeData !== undefined && globalData !== undefined) { 
            const safeMode = modeData || {};
            const safeGlobal = globalData || {};
            const combinedHistory = (safeGlobal.history && safeGlobal.history.length > 0) 
                ? safeGlobal.history 
                : (safeMode.history || []);

            callback({ 
                ...safeMode,
                teams: safeMode.teams || [],
                groups: safeMode.groups || [],
                matches: safeMode.matches || [],
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
            } as unknown as TournamentState);
        }
    };

    const unsubMode = onSnapshot(modeDocRef, (snap) => {
        modeData = snap.exists() ? snap.data() : null;
        emit();
    }, errorCallback);

    const unsubGlobal = onSnapshot(settingsDocRef, (snap) => {
        globalData = snap.exists() ? snap.data() : null;
        emit();
    }, errorCallback);

    return () => { unsubMode(); unsubGlobal(); };
};

export const getGlobalStats = async () => {
    if (!firestore) return { teamCount: 0, partnerCount: 0 };
    try {
        const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
        let teamCount = 0;
        for (const mode of modes) {
            const snap = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, mode));
            if (snap.exists()) {
                teamCount += (snap.data().teams || []).length;
            }
        }
        const settingsSnap = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC));
        const partnerCount = settingsSnap.exists() ? (settingsSnap.data().partners || []).length : 0;
        return { teamCount, partnerCount };
    } catch (e) {
        console.error("getGlobalStats error:", e);
        return { teamCount: 0, partnerCount: 0 };
    }
};

export const getUserTeams = async (email: string) => {
    if (!firestore || !email) return [];
    try {
        const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
        const owned: { mode: TournamentMode, team: Team }[] = [];
        for (const m of modes) {
            const snap = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, m));
            if (snap.exists()) {
                const teams = snap.data().teams || [];
                teams.forEach((t: Team) => {
                    if (t.ownerEmail?.toLowerCase() === email.toLowerCase()) {
                        owned.push({ mode: m, team: t });
                    }
                });
            }
        }
        return owned;
    } catch (e) {
        console.error("getUserTeams error:", e);
        return [];
    }
};

export const addMatchCommentToFirestore = async (mode: TournamentMode, matchId: string, comment: MatchComment) => {
    if (!firestore || !mode || !matchId) return;
    try {
        const colRef = collection(firestore, TOURNAMENT_COLLECTION, mode, MATCH_COMMENTS_COLLECTION);
        await addDoc(colRef, { ...comment, matchId });
    } catch (e) {
        console.error("addMatchCommentToFirestore error:", e);
    }
};

export const subscribeToMatchComments = (mode: TournamentMode, callback: (comments: Record<string, MatchComment[]>) => void) => {
    if (!firestore || !mode) return () => {};
    try {
        const colRef = collection(firestore, TOURNAMENT_COLLECTION, mode, MATCH_COMMENTS_COLLECTION);
        const q = query(colRef, orderBy('timestamp', 'asc'));
        
        return onSnapshot(q, (snap) => {
            const commentsMap: Record<string, MatchComment[]> = {};
            snap.forEach(docSnap => {
                const data = docSnap.data();
                const mId = data.matchId;
                if (!commentsMap[mId]) commentsMap[mId] = [];
                commentsMap[mId].push({ ...data, id: docSnap.id } as MatchComment);
            });
            callback(commentsMap);
        }, (err: any) => {
            // SANGAT PENTING: Cek link di console Anda
            if (err.message && err.message.includes('index')) {
                console.error("PENTING: KLIK LINK INI UNTUK AKTIFKAN FITUR CHAT:");
                console.error(err.message.split('here: ')[1]);
            } else {
                console.error("subscribeToMatchComments error:", err);
            }
        });
    } catch (e) {
        console.error("Critical error in subscribeToMatchComments:", e);
        return () => {};
    }
};

export const subscribeToRegistrations = (callback: (regs: any[]) => void, errorCallback?: (err: any) => void) => {
    if (!firestore) {
        if (errorCallback) errorCallback("Firestore not initialized");
        return () => {};
    }
    const colRef = collection(firestore, REGISTRATIONS_COLLECTION);
    return onSnapshot(query(colRef, orderBy('timestamp', 'desc')), (snap) => {
        const regs: any[] = [];
        snap.forEach(doc => regs.push({ ...doc.data(), id: doc.id }));
        callback(regs);
    }, errorCallback);
};

export const deleteRegistration = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, REGISTRATIONS_COLLECTION, id));
};

export const addApprovedTeamToFirestore = async (mode: TournamentMode, team: Team) => {
    if (!firestore || !mode) return;
    const docRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    await runTransaction(firestore, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) throw new Error("Mode document does not exist");
        const teams = snap.data().teams || [];
        transaction.update(docRef, { teams: [...teams, team] });
    });
};

export const sendNotification = async (email: string, title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    if (!firestore) return;
    await addDoc(collection(firestore, NOTIFICATIONS_COLLECTION), {
        email, title, message, type, timestamp: Date.now(), read: false
    });
};

export const getAllGlobalTeams = async (): Promise<Team[]> => {
    if (!firestore) return [];
    const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
    const allTeams: Team[] = [];
    const seenNames = new Set<string>();
    for (const m of modes) {
        const snap = await getDoc(doc(firestore, TOURNAMENT_COLLECTION, m));
        if (snap.exists()) {
            (snap.data().teams || []).forEach((t: Team) => {
                if (!seenNames.has(t.name.toLowerCase())) {
                    allTeams.push(t);
                    seenNames.add(t.name.toLowerCase());
                }
            });
        }
    }
    return allTeams;
};

export const submitTeamClaimRequest = async (mode: TournamentMode, teamId: string, email: string) => {
    if (!firestore || !mode) return;
    const docRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    await runTransaction(firestore, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) throw new Error("Mode doc not found");
        const teams = snap.data().teams || [];
        const index = teams.findIndex((t: any) => t.id === teamId);
        if (index === -1) throw new Error("Team not found");
        if (teams[index].ownerEmail) throw new Error("Team already has an owner");
        teams[index].requestedOwnerEmail = email;
        transaction.update(docRef, { teams });
    });
};

export const updateUserTeamData = async (mode: TournamentMode, teamId: string, updates: Partial<Team>) => {
    if (!firestore || !mode) return;
    const docRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    await runTransaction(firestore, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) throw new Error("Mode doc not found");
        const teams = snap.data().teams || [];
        const index = teams.findIndex((t: any) => t.id === teamId);
        if (index === -1) throw new Error("Team not found");
        teams[index] = { ...teams[index], ...updates };
        transaction.update(docRef, { teams });
    });
};

export const subscribeToNotifications = (email: string, callback: (notifs: Notification[]) => void) => {
    if (!firestore || !email) return () => {};
    const colRef = collection(firestore, NOTIFICATIONS_COLLECTION);
    const q = query(colRef, where('email', '==', email), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
        const notifs: Notification[] = [];
        snap.forEach(docSnap => notifs.push({ ...docSnap.data(), id: docSnap.id } as Notification));
        callback(notifs);
    });
};

export const deleteNotification = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, NOTIFICATIONS_COLLECTION, id));
};

export const subscribeToGlobalChat = (callback: (messages: ChatMessage[]) => void) => {
    if (!firestore) return () => {};
    const colRef = collection(firestore, CHAT_COLLECTION);
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
        const msgs: ChatMessage[] = [];
        snap.forEach(docSnap => msgs.push({ ...docSnap.data(), id: docSnap.id } as ChatMessage));
        callback(msgs.reverse());
    });
};

export const sendGlobalChatMessage = async (text: string, user: User, isAdmin: boolean, teamName?: string) => {
    if (!firestore || !user) return;
    await addDoc(collection(firestore, CHAT_COLLECTION), {
        text,
        userId: user.uid,
        userName: user.displayName || 'User',
        userPhoto: user.photoURL,
        userTeamName: teamName || null,
        isAdmin,
        timestamp: Date.now()
    });
};

export const submitNewTeamRegistration = async (data: any, email: string) => {
    if (!firestore) return;
    await addDoc(collection(firestore, REGISTRATIONS_COLLECTION), {
        ...data,
        ownerEmail: email,
        timestamp: Date.now(),
        status: 'pending'
    });
};

export const getFullSystemBackup = async () => {
    if (!firestore) return null;
    try {
        const backup: any = {};
        const collectionNames = [TOURNAMENT_COLLECTION, CHAT_COLLECTION, REGISTRATIONS_COLLECTION, NOTIFICATIONS_COLLECTION];
        
        for (const colName of collectionNames) {
            const snap = await getDocs(collection(firestore, colName));
            backup[colName] = {};
            snap.forEach(docSnap => {
                backup[colName][docSnap.id] = docSnap.data();
            });
        }
        return deepClean(backup);
    } catch (e) {
        console.error("getFullSystemBackup error:", e);
        return null;
    }
};

export const restoreFullSystem = async (data: any) => {
    if (!firestore || !data) return;
    const batch = writeBatch(firestore);
    
    for (const colName in data) {
        for (const docId in data[colName]) {
            const docRef = doc(firestore, colName, docId);
            batch.set(docRef, data[colName][docId]);
        }
    }
    await batch.commit();
};
