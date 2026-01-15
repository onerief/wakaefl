
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

const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true,
});

const auth = getAuth(app);
const storage = getStorage(app); 
const googleProvider = new GoogleAuthProvider();

const TOURNAMENT_COLLECTION = 'tournament';
const GLOBAL_CHAT_COLLECTION = 'global_chat';
const REGISTRATIONS_COLLECTION = 'registrations';
const SETTINGS_DOC = 'global_settings';

const isPlainObject = (obj: any): boolean => {
  if (typeof obj !== 'object' || obj === null) return false;
  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
};

export const sanitizeData = (data: any, seen = new WeakSet()): any => {
  if (data === null || typeof data !== 'object') return data;
  if (seen.has(data)) return "[Circular]"; 
  if (Array.isArray(data)) {
    seen.add(data);
    return data.map(item => sanitizeData(item, seen));
  }
  if (data instanceof Date) return data.toISOString();
  if (!isPlainObject(data)) {
      if (data.constructor && data.constructor.name === 'Timestamp') {
          return data.toMillis();
      }
      return String(data);
  }
  seen.add(data);
  const result: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (typeof value !== 'function' && value !== undefined) {
        result[key] = sanitizeData(value, seen);
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

export const uploadMatchProof = async (file: File): Promise<string> => {
  try {
    const fileName = `proofs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error: any) {
    console.error("Error uploading proof:", error);
    throw new Error("Gagal mengupload bukti pertandingan.");
  }
};

export const saveTournamentData = async (mode: TournamentMode, state: TournamentState) => {
  try {
    const modeData = {
        teams: state.teams,
        groups: state.groups,
        matches: state.matches,
        knockoutStage: state.knockoutStage,
        status: state.status,
        history: state.history,
        isRegistrationOpen: state.isRegistrationOpen,
        isDoubleRoundRobin: state.isDoubleRoundRobin,
        mode: state.mode
    };

    const globalData = {
        banners: state.banners,
        partners: state.partners,
        rules: state.rules,
        headerLogoUrl: state.headerLogoUrl
    };

    const modeDocRef = doc(firestore, TOURNAMENT_COLLECTION, mode);
    const settingsDocRef = doc(firestore, TOURNAMENT_COLLECTION, SETTINGS_DOC);

    await setDoc(modeDocRef, sanitizeData(modeData));
    await setDoc(settingsDocRef, sanitizeData(globalData));
    
  } catch (error: any) {
    if (error.code === 'permission-denied') return;
    console.warn(`Firestore: Could not save data`, error);
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
    
    // Jika modeSnap tidak ada, kita tetap kirimkan data default + data global
    // agar data global tidak terhapus di useTournament state
    const modeData = modeSnap.exists() ? modeSnap.data() : {
        teams: [],
        groups: [],
        matches: [],
        knockoutStage: null,
        status: 'active',
        history: [],
        isRegistrationOpen: true,
        isDoubleRoundRobin: true,
        mode: mode
    };

    return {
        ...modeData,
        banners: globalData.banners || [],
        partners: globalData.partners || [],
        rules: globalData.rules || modeData.rules || '',
        headerLogoUrl: globalData.headerLogoUrl || modeData.headerLogoUrl || '',
    } as TournamentState;

  } catch (error: any) {
    console.warn(`Firestore: Failed to get data`, error);
    return null;
  }
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
        const groups = (data.groups || []).map(g => ({
            ...g,
            teams: g.teams.map(t => t.id === teamId ? { ...t, ...updates } : t),
            standings: g.standings.map(s => s.team.id === teamId ? { ...s, team: { ...s.team, ...updates } } : s)
        }));
        const matches = (data.matches || []).map(m => {
            const mUpdate = { ...m };
            if (m.teamA.id === teamId) mUpdate.teamA = { ...m.teamA, ...updates };
            if (m.teamB.id === teamId) mUpdate.teamB = { ...m.teamB, ...updates };
            return mUpdate;
        });
        transaction.update(tournamentDocRef, { teams: updatedTeams, groups, matches });
    });
};
