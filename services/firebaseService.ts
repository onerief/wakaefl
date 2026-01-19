
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
  persistentMultipleTabManager
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
import type { TournamentState, TournamentMode, Team, Partner, ChatMessage, Group, Match } from '../types';

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

const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const auth = getAuth(app);
const storage = getStorage(app); 
const googleProvider = new GoogleAuthProvider();

const TOURNAMENT_COLLECTION = 'tournament';
const GLOBAL_CHAT_COLLECTION = 'global_chat';
const REGISTRATIONS_COLLECTION = 'registrations';
const SETTINGS_DOC = 'global_settings';

/**
 * PEMBERSIH DATA (RECURSION SAFE)
 * Fungsi ini memastikan tidak ada referensi melingkar saat simpan ke Firestore.
 * Berbeda dengan sebelumnya, fungsi ini TIDAK MENGHAPUS field penting dari master list.
 */
export const sanitizeData = (data: any): any => {
    if (data === null || data === undefined) return null;
    
    // Primitive types
    if (typeof data !== 'object') return data;

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    // Handle Objects
    const result: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            
            // Khusus untuk teams/standings di DALAM grup, kita simpan ID saja untuk mencegah circular
            // Tapi untuk master list 'teams' di tingkat root, kita biarkan utuh.
            if ((key === 'teams' || key === 'team' || key === 'teamA' || key === 'teamB') && 
                value && typeof value === 'object' && value.id) {
                // Jika ini adalah nested reference (di dalam match atau grup), gunakan ID saja
                result[key] = { id: value.id, name: value.name || 'Unknown', logoUrl: value.logoUrl || '' };
            } else if (typeof value === 'object' && value !== null) {
                result[key] = sanitizeData(value);
            } else {
                result[key] = value;
            }
        }
    }
    return result;
};

export const uploadTeamLogo = async (file: File): Promise<string> => {
  try {
    const fileName = `logos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error: any) {
    console.error("Error uploading logo:", error);
    throw new Error("Gagal mengupload gambar.");
  }
};

export const saveTournamentData = async (mode: TournamentMode, state: TournamentState) => {
  try {
    // 1. Siapkan Master Teams (Data Lengkap)
    const masterTeams = (state.teams || []).map(t => ({
        id: t.id,
        name: t.name || 'TBD',
        logoUrl: t.logoUrl || '',
        manager: t.manager || '',
        ownerEmail: t.ownerEmail || '',
        whatsappNumber: t.whatsappNumber || '',
        socialMediaUrl: t.socialMediaUrl || '',
        isTopSeed: !!t.isTopSeed,
        squadPhotoUrl: t.squadPhotoUrl || ''
    }));

    // 2. Siapkan Grup & Matches (ID Only references)
    const cleanState = {
        teams: masterTeams,
        groups: (state.groups || []).map(g => ({
            ...g,
            teams: g.teams.map(t => ({ id: t.id })),
            standings: g.standings.map(s => ({ ...s, team: { id: s.team.id } }))
        })),
        matches: (state.matches || []).map(m => ({
            ...m,
            teamA: { id: m.teamA.id },
            teamB: { id: m.teamB.id }
        })),
        knockoutStage: state.knockoutStage ? sanitizeData(state.knockoutStage) : null,
        status: state.status || 'active',
        history: sanitizeData(state.history || []),
        isRegistrationOpen: state.isRegistrationOpen ?? true,
        isDoubleRoundRobin: state.isDoubleRoundRobin ?? true,
        mode: state.mode
    };

    const globalData = {
        banners: state.banners || [],
        partners: state.partners || [],
        rules: state.rules || '',
        headerLogoUrl: state.headerLogoUrl || ''
    };

    const modeDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const settingsDocRef = doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC);

    // Gunakan setDoc tanpa pembersihan tambahan karena kita sudah membersihkannya di atas secara manual
    await Promise.all([
        setDoc(modeDocRef, cleanState),
        setDoc(settingsDocRef, globalData)
    ]);
    
    console.log(`Success: Data ${mode} saved to cloud.`);
  } catch (error: any) {
    console.error(`Firestore Error: Gagal menyimpan data`, error);
    throw error;
  }
};

export const getTournamentData = async (mode: TournamentMode): Promise<TournamentState | null> => {
  try {
    const modeDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const settingsDocRef = doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC);

    const [modeSnap, settingsSnap] = await Promise.all([
        getDoc(modeDocRef),
        getDoc(settingsDocRef)
    ]);

    const globalData = settingsSnap.exists() ? settingsSnap.data() : {};
    const modeData = modeSnap.exists() ? modeSnap.data() : {
        teams: [], groups: [], matches: [], knockoutStage: null, status: 'active', history: [], isRegistrationOpen: true, isDoubleRoundRobin: true, mode: mode
    };

    return {
        ...modeData,
        banners: globalData.banners || [],
        partners: globalData.partners || [],
        rules: globalData.rules || modeData.rules || '',
        headerLogoUrl: globalData.headerLogoUrl || modeData.headerLogoUrl || '',
    } as TournamentState;
  } catch (error: any) {
    console.warn(`Firestore: Gagal mengambil data`, error);
    return null;
  }
};

export const subscribeToTournamentData = (mode: TournamentMode, callback: (data: TournamentState) => void) => {
    const modeDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const settingsDocRef = doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC);
    
    let modeData: any = null;
    let globalData: any = null;

    const emit = () => {
        if (modeData && globalData) {
            callback({
                ...modeData,
                banners: globalData.banners || [],
                partners: globalData.partners || [],
                rules: globalData.rules || modeData.rules || '',
                headerLogoUrl: globalData.headerLogoUrl || modeData.headerLogoUrl || '',
            });
        }
    };

    const unsubMode = onSnapshot(modeDocRef, (snap) => {
        if (snap.exists()) {
            modeData = snap.data();
            emit();
        }
    });

    const unsubGlobal = onSnapshot(settingsDocRef, (snap) => {
        if (snap.exists()) {
            globalData = snap.data();
            emit();
        }
    });

    return () => { unsubMode(); unsubGlobal(); };
};

export const onAuthChange = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);
export const signOutUser = () => signOut(auth);
export const signInUser = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const registerUser = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const updateUserProfile = (user: User, displayName: string) => updateProfile(user, { displayName });

export const submitNewTeamRegistration = async (teamData: any, userEmail: string) => {
    await addDoc(collection(firestore, REGISTRATIONS_COLLECTION), {
        ...teamData,
        submittedBy: userEmail,
        timestamp: Date.now(),
        status: 'pending'
    });
};

export const subscribeToRegistrations = (callback: (registrations: any[]) => void) => {
    const q = query(collection(firestore, REGISTRATIONS_COLLECTION), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const regs: any[] = [];
        snapshot.forEach((doc) => regs.push({ id: doc.id, ...doc.data() }));
        callback(regs);
    });
};

export const deleteRegistration = async (regId: string) => deleteDoc(doc(firestore, REGISTRATIONS_COLLECTION, regId));

export const subscribeToGlobalChat = (callback: (messages: ChatMessage[]) => void) => {
    const q = query(collection(firestore, GLOBAL_CHAT_COLLECTION), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => messages.push({ id: doc.id, ...doc.data() } as ChatMessage));
        callback(messages.reverse());
    });
};

export const sendGlobalChatMessage = async (text: string, user: User, isAdmin: boolean = false) => {
    if (!text.trim()) return;
    await addDoc(collection(firestore, GLOBAL_CHAT_COLLECTION), {
        text: text.trim(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.photoURL || null,
        timestamp: Date.now(),
        isAdmin
    });
};

export const getGlobalStats = async (overrideMode?: TournamentMode, overrideData?: any) => {
    const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
    const uniqueTeams = new Set<string>();
    const results = await Promise.all(modes.map(m => getTournamentData(m)));
    results.forEach(data => {
        if (data?.teams) data.teams.forEach(t => uniqueTeams.add(t.id));
    });
    const partnerCount = results.find(r => r)?.partners?.length || 0;
    return { teamCount: uniqueTeams.size, partnerCount };
};

export const submitTeamClaimRequest = async (mode: TournamentMode, teamId: string, userEmail: string) => {
    const tournamentDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    await runTransaction(firestore, async (transaction) => {
        const docSnap = await transaction.get(tournamentDocRef);
        if (!docSnap.exists()) throw new Error("Data turnamen tidak ditemukan.");
        const data = docSnap.data();
        const teams = data.teams || [];
        const teamIndex = teams.findIndex((t: any) => t.id === teamId);
        if (teamIndex === -1) throw new Error("Tim tidak ditemukan.");
        if (teams[teamIndex].ownerEmail) throw new Error("Tim ini sudah memiliki manager.");
        const updatedTeams = [...teams];
        updatedTeams[teamIndex] = { ...teams[teamIndex], requestedOwnerEmail: userEmail };
        transaction.update(tournamentDocRef, { teams: updatedTeams });
    });
};

export const getUserTeams = async (userEmail: string) => {
    const modes: TournamentMode[] = ['league', 'wakacl', 'two_leagues'];
    const userTeams: any[] = [];
    const results = await Promise.all(modes.map(m => getTournamentData(m)));
    results.forEach((data, idx) => {
        if (data?.teams) {
            const myTeam = data.teams.find(t => t.ownerEmail === userEmail);
            if (myTeam) userTeams.push({ mode: modes[idx], team: myTeam });
        }
    });
    return userTeams;
};

export const updateUserTeamData = async (mode: TournamentMode, teamId: string, updates: Partial<Team>) => {
    const tournamentDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    await runTransaction(firestore, async (transaction) => {
        const docSnap = await transaction.get(tournamentDocRef);
        if (!docSnap.exists()) throw new Error("Data not found");
        const data = docSnap.data() as TournamentState;
        const teams = data.teams;
        const teamIndex = teams.findIndex(t => t.id === teamId);
        if (teamIndex === -1) throw new Error("Team not found");
        const updatedTeams = [...teams];
        updatedTeams[teamIndex] = { ...teams[teamIndex], ...updates };
        
        transaction.update(tournamentDocRef, { teams: updatedTeams });
    });
};
