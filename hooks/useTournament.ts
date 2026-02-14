import { useReducer, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import type { Team, Group, Match, Standing, KnockoutStageRounds, KnockoutMatch, TournamentState as FullTournamentState, Partner, TournamentMode, MatchComment, SeasonHistory, NewsItem, Product, PlayerStat, MatchPlayerStats, ScheduleSettings } from '../types';
import { generateSummary } from '../services/geminiService';
import { subscribeToTournamentData, subscribeToMatchComments, saveTournamentData, sanitizeData } from '../services/firebaseService';
import { useToast } from '../components/shared/Toast';

export const SPECIAL_TEAM_ID = 't13';

const createInitialState = (mode: TournamentMode): FullTournamentState => ({
  teams: [],
  groups: [],
  matches: [],
  knockoutStage: null,
  rules: '',
  banners: [],
  partners: [],
  mode: mode,
  isDoubleRoundRobin: true,
  status: 'active',
  history: [],
  isRegistrationOpen: true, 
  headerLogoUrl: '',
  pwaIconUrl: '', 
  news: [],
  products: [],
  newsCategories: ['Match', 'Transfer', 'Info', 'Interview'],
  shopCategories: ['Coin', 'Account', 'Jasa', 'Merch'],
  marqueeMessages: [
    "SELAMAT DATANG DI WAKAEFL HUB - TURNAMEN EFOOTBALL TERGOKIL SE-WAY KANAN!",
    "SIAPKAN STRATEGI TERBAIKMU DAN RAIH GELAR JUARA!",
    "WAKAEFL SEASON 1: THE GLORY AWAITS...",
    "MAINKAN DENGAN SPORTIF, MENANG DENGAN ELEGAN!",
    "UPDATE SKOR DAN KLASEMEN SECARA REAL-TIME DI SINI!"
  ],
  visibleModes: ['league', 'wakacl', 'two_leagues'],
  scheduleSettings: {
      isActive: false,
      currentMatchday: 1,
      matchdayStartTime: null,
      matchdayDurationHours: 24,
      autoProcessEnabled: false
  },
  matchComments: {}
});

const calculateStandings = (teams: Team[], matches: Match[], groupId: string, groupName: string): Standing[] => {
  const standings: { [key: string]: Standing } = {};
  teams.forEach(team => {
      if (team && team.id) {
        standings[team.id] = { team: { ...team }, played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0, form: [] };
      }
  });
  const groupLetter = (groupName || '').replace('Group ', '').trim();
  matches.forEach(match => {
    if (!match || !match.teamA || !match.teamB) return;
    const isMatchInGroup = match.group === groupId || match.group === groupLetter || match.group === groupName;
    if (!isMatchInGroup || match.status !== 'finished' || match.scoreA === null || match.scoreB === null) return;
    const idA = match.teamA?.id;
    const idB = match.teamB?.id;
    if (idA && standings[idA]) {
      const s = standings[idA]; s.played++; s.goalDifference += (match.scoreA! - match.scoreB!);
      if (match.scoreA! > match.scoreB!) { s.wins++; s.points += 3; }
      else if (match.scoreA! === match.scoreB!) { s.draws++; s.points += 1; }
      else { s.losses++; }
    }
    if (idB && standings[idB]) {
      const s = standings[idB]; s.played++; s.goalDifference += (match.scoreB! - match.scoreA!);
      if (match.scoreB! > match.scoreA!) { s.wins++; s.points += 3; }
      else if (match.scoreB! === match.scoreA!) { s.draws++; s.points += 1; }
      else { s.losses++; }
    }
  });
  return Object.values(standings).sort((a, b) => (b.points - a.points) || (b.goalDifference - a.goalDifference));
};

const hydrateTournamentData = (state: FullTournamentState): FullTournamentState => {
    if (!state || !state.teams || state.teams.length === 0) return state;
    const teamMap = new Map<string, Team>();
    state.teams.forEach(t => { if (t && t.id) teamMap.set(t.id, t); });
    
    const getFullTeam = (val: any): Team => {
        if (val && typeof val === 'object' && val.name && val.name !== 'TBD') {
            return val;
        }
        const id = (val && typeof val === 'object') ? val.id : val;
        if (!id) return { id: 'tbd', name: 'TBD' } as Team;
        return teamMap.get(id) || { id, name: 'TBD' } as Team;
    };

    const hydratedMatches = (state.matches || []).map(m => ({ ...m, teamA: getFullTeam(m.teamA), teamB: getFullTeam(m.teamB) }));
    const hydratedGroups = (state.groups || []).map(g => {
        const groupTeams = (g.teams || []).map(t => getFullTeam(t));
        return { ...g, teams: groupTeams, standings: calculateStandings(groupTeams, hydratedMatches, g.id, g.name) };
    });
    // Ensure scheduleSettings exists (migration for old data)
    const hydratedSettings = state.scheduleSettings || createInitialState(state.mode).scheduleSettings;

    return { 
        ...state, 
        groups: hydratedGroups, 
        matches: hydratedMatches, 
        scheduleSettings: hydratedSettings,
        history: (state.history || []).map(h => ({
            ...h, champion: getFullTeam(h.champion), runnerUp: h.runnerUp ? getFullTeam(h.runnerUp) : undefined
        })),
        knockoutStage: state.knockoutStage ? {
            'Play-offs': (state.knockoutStage['Play-offs'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
            'Round of 16': (state.knockoutStage['Round of 16'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
            'Quarter-finals': (state.knockoutStage['Quarter-finals'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
            'Semi-finals': (state.knockoutStage['Semi-finals'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
            'Final': (state.knockoutStage['Final'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null }))
        } : null
    };
};

type Action =
  | { type: 'SET_STATE'; payload: FullTournamentState }
  | { type: 'SET_MODE'; payload: TournamentMode }
  | { type: 'ADD_TEAM'; payload: Team }
  | { type: 'UPDATE_TEAM'; payload: Team }
  | { type: 'DELETE_TEAM'; payload: string }
  | { type: 'GENERATE_GROUPS'; payload: { groups: Group[], matches: Match[], knockoutStage: KnockoutStageRounds | null } }
  | { type: 'UPDATE_MATCH_SCORE'; payload: { matchId: string; scoreA: number; scoreB: number; proofUrl?: string; playerStats?: MatchPlayerStats } }
  | { type: 'UPDATE_MATCH'; payload: { matchId: string; updates: Partial<Match> } }
  | { type: 'UPDATE_KNOCKOUT_MATCH'; payload: KnockoutMatch }
  | { type: 'UPDATE_NEWS'; payload: NewsItem[] }
  | { type: 'UPDATE_PRODUCTS'; payload: Product[] }
  | { type: 'UPDATE_NEWS_CATEGORIES'; payload: string[] }
  | { type: 'UPDATE_SHOP_CATEGORIES'; payload: string[] }
  | { type: 'UPDATE_MARQUEE'; payload: string[] }
  | { type: 'RESET'; payload: FullTournamentState }
  | { type: 'ARCHIVE_SEASON'; payload: { historyEntry: SeasonHistory, keepTeams: boolean } }
  | { type: 'SET_STATUS'; payload: 'active' | 'completed' }
  | { type: 'UPDATE_RULES', payload: string }
  | { type: 'UPDATE_BANNERS', payload: string[] }
  | { type: 'UPDATE_PARTNERS', payload: Partner[] }
  | { type: 'SET_REGISTRATION_STATUS', payload: boolean }
  | { type: 'UPDATE_HEADER_LOGO', payload: string }
  | { type: 'UPDATE_PWA_ICON', payload: string }
  | { type: 'ADD_HISTORY_ENTRY', payload: SeasonHistory }
  | { type: 'DELETE_HISTORY_ENTRY', payload: string }
  | { type: 'ADD_KNOCKOUT_MATCH'; payload: KnockoutMatch }
  | { type: 'DELETE_KNOCKOUT_MATCH'; payload: { round: keyof KnockoutStageRounds, id: string } }
  | { type: 'GENERATE_KNOCKOUT_BRACKET'; payload: KnockoutStageRounds }
  | { type: 'UPDATE_VISIBLE_MODES'; payload: TournamentMode[] }
  | { type: 'ADD_MATCH_COMMENT'; payload: { matchId: string, comment: MatchComment } }
  | { type: 'UPDATE_SCHEDULE_SETTINGS'; payload: Partial<ScheduleSettings> }
  | { type: 'PROCESS_AUTO_WO'; payload: Match[] }
  | { type: 'SET_COMMENTS'; payload: Record<string, MatchComment[]> };

const tournamentReducer = (state: FullTournamentState, action: Action): FullTournamentState => {
  let newState: FullTournamentState;
  
  const mergeCommentsIntoMatches = (matches: Match[], commentsMap: Record<string, MatchComment[]>) => {
      return matches.map(m => ({
          ...m,
          comments: commentsMap[m.id] || []
      }));
  };

  const mergeCommentsIntoKnockout = (stage: KnockoutStageRounds | null, commentsMap: Record<string, MatchComment[]>) => {
      if (!stage) return null;
      const newStage = { ...stage };
      (Object.keys(newStage) as Array<keyof KnockoutStageRounds>).forEach(key => {
          newStage[key] = newStage[key].map(m => ({ ...m, comments: commentsMap[m.id] || [] }));
      });
      return newStage;
  };

  switch (action.type) {
    case 'SET_STATE': {
        const rawState = action.payload;
        const currentComments = state.matchComments || {};
        // Preserve comments from separate collection
        const matchesWithComments = mergeCommentsIntoMatches(rawState.matches || [], currentComments);
        const knockoutWithComments = mergeCommentsIntoKnockout(rawState.knockoutStage, currentComments);
        
        newState = { ...state, ...rawState, matches: matchesWithComments, knockoutStage: knockoutWithComments, matchComments: currentComments };
        break;
    }
    case 'SET_COMMENTS': {
        const commentsMap = action.payload;
        const updatedMatches = mergeCommentsIntoMatches(state.matches, commentsMap);
        const updatedKnockout = mergeCommentsIntoKnockout(state.knockoutStage, commentsMap);
        newState = { ...state, matchComments: commentsMap, matches: updatedMatches, knockoutStage: updatedKnockout };
        break;
    }
    case 'SET_MODE': newState = { ...state, mode: action.payload }; break;
    case 'ADD_TEAM': newState = { ...state, teams: [...state.teams, action.payload] }; break;
    case 'UPDATE_TEAM': newState = { ...state, teams: state.teams.map(t => t.id === action.payload.id ? action.payload : t) }; break;
    case 'DELETE_TEAM': newState = { ...state, teams: state.teams.filter(t => t.id !== action.payload) }; break;
    case 'GENERATE_GROUPS': newState = { ...state, ...action.payload }; break;
    case 'UPDATE_MATCH_SCORE': newState = { ...state, matches: state.matches.map(m => m.id === action.payload.matchId ? { ...m, ...action.payload, status: 'finished' as const } : m) }; break;
    case 'UPDATE_MATCH': newState = { ...state, matches: state.matches.map(m => m.id === action.payload.matchId ? { ...m, ...action.payload.updates } : m) }; break;
    case 'UPDATE_KNOCKOUT_MATCH': {
        if (!state.knockoutStage) return state;
        const ks = { ...state.knockoutStage };
        ks[action.payload.round] = ks[action.payload.round].map(m => m.id === action.payload.id ? action.payload : m);
        newState = { ...state, knockoutStage: ks };
        break;
    }
    case 'ADD_KNOCKOUT_MATCH': {
        const ks = state.knockoutStage || { 'Play-offs': [], 'Round of 16': [], 'Quarter-finals': [], 'Semi-finals': [], 'Final': [] };
        ks[action.payload.round] = [...(ks[action.payload.round] || []), action.payload];
        newState = { ...state, knockoutStage: { ...ks } };
        break;
    }
    case 'DELETE_KNOCKOUT_MATCH': {
        if (!state.knockoutStage) return state;
        const ks = { ...state.knockoutStage };
        ks[action.payload.round] = (ks[action.payload.round] || []).filter(m => m.id !== action.payload.id);
        newState = { ...state, knockoutStage: ks };
        break;
    }
    case 'GENERATE_KNOCKOUT_BRACKET': newState = { ...state, knockoutStage: action.payload }; break;
    case 'UPDATE_NEWS': newState = { ...state, news: action.payload }; break;
    case 'UPDATE_PRODUCTS': newState = { ...state, products: action.payload }; break;
    case 'UPDATE_NEWS_CATEGORIES': newState = { ...state, newsCategories: action.payload }; break;
    case 'UPDATE_SHOP_CATEGORIES': newState = { ...state, shopCategories: action.payload }; break;
    case 'UPDATE_MARQUEE': newState = { ...state, marqueeMessages: action.payload }; break;
    case 'UPDATE_RULES': newState = { ...state, rules: action.payload }; break;
    case 'UPDATE_BANNERS': newState = { ...state, banners: action.payload }; break;
    case 'UPDATE_PARTNERS': newState = { ...state, partners: action.payload }; break;
    case 'UPDATE_HEADER_LOGO': newState = { ...state, headerLogoUrl: action.payload }; break;
    case 'UPDATE_PWA_ICON': newState = { ...state, pwaIconUrl: action.payload }; break; 
    case 'SET_REGISTRATION_STATUS': newState = { ...state, isRegistrationOpen: action.payload }; break;
    case 'SET_STATUS': newState = { ...state, status: action.payload }; break;
    case 'ADD_HISTORY_ENTRY': newState = { ...state, history: [action.payload, ...state.history] }; break;
    case 'DELETE_HISTORY_ENTRY': newState = { ...state, history: state.history.filter(h => h.seasonId !== action.payload) }; break;
    case 'UPDATE_VISIBLE_MODES': newState = { ...state, visibleModes: action.payload }; break;
    case 'ADD_MATCH_COMMENT': {
        const { matchId, comment } = action.payload;
        // Optimistic update for both matches and knockout
        const newCommentsMap = { ...(state.matchComments || {}) };
        newCommentsMap[matchId] = [...(newCommentsMap[matchId] || []), comment];
        
        const newMatches = mergeCommentsIntoMatches(state.matches, newCommentsMap);
        const newKnockout = mergeCommentsIntoKnockout(state.knockoutStage, newCommentsMap);
        
        newState = { ...state, matches: newMatches, knockoutStage: newKnockout, matchComments: newCommentsMap };
        break;
    }
    case 'UPDATE_SCHEDULE_SETTINGS': newState = { ...state, scheduleSettings: { ...state.scheduleSettings, ...action.payload } }; break;
    case 'PROCESS_AUTO_WO': {
        const updatedMatchIds = new Set(action.payload.map(m => m.id));
        const newMatches = state.matches.map(m => updatedMatchIds.has(m.id) ? (action.payload.find(up => up.id === m.id) || m) : m);
        newState = { ...state, matches: newMatches };
        break;
    }
    case 'RESET': {
        newState = { 
            ...createInitialState(state.mode),
            history: state.history,
        }; 
        break;
    }
    case 'ARCHIVE_SEASON': {
        const { historyEntry, keepTeams } = action.payload;
        newState = {
            ...state,
            history: [historyEntry, ...state.history],
            matches: [],
            groups: [],
            knockoutStage: null,
            status: 'active',
            scheduleSettings: createInitialState(state.mode).scheduleSettings, 
            teams: keepTeams ? state.teams : [],
            matchComments: {} // Clear comments for new season
        };
        break;
    }
    default: return state;
  }
  return hydrateTournamentData(newState);
};

export const useTournament = (activeMode: TournamentMode, isAdmin: boolean) => {
  const [state, dispatch] = useReducer(tournamentReducer, createInitialState(activeMode));
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const isUpdatingFromServer = useRef(false);
  const hasPendingChanges = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => { 
      stateRef.current = state;
      if (!isUpdatingFromServer.current && !isLoading) {
          hasPendingChanges.current = true;
          setHasUnsavedChanges(true);
      }
  }, [state, isLoading]);

  useEffect(() => {
    setIsLoading(true);
    // Subscribe to Main Data
    const unsubscribeTournament = subscribeToTournamentData(activeMode, (serverData) => {
        isUpdatingFromServer.current = true;
        dispatch({ type: 'SET_STATE', payload: serverData });
        hasPendingChanges.current = false;
        setHasUnsavedChanges(false);
        
        setTimeout(() => { 
            isUpdatingFromServer.current = false; 
            setIsLoading(false); 
        }, 100);
    });

    // Subscribe to Comments
    const unsubscribeComments = subscribeToMatchComments(activeMode, (commentsMap) => {
        isUpdatingFromServer.current = true;
        dispatch({ type: 'SET_COMMENTS', payload: commentsMap });
        
        setTimeout(() => { 
            isUpdatingFromServer.current = false; 
        }, 100);
    });

    return () => { unsubscribeTournament(); unsubscribeComments(); };
  }, [activeMode]);

  const forceSave = useCallback(async () => {
      if (!isAdmin) return;
      setIsSyncing(true);
      try {
          console.log(`[ForceSave] Saving data for ${activeMode}...`);
          await saveTournamentData(activeMode, stateRef.current);
          hasPendingChanges.current = false;
          setHasUnsavedChanges(false);
      } catch (e) {
          console.error("[ForceSave] Error:", e);
      } finally {
          setIsSyncing(false);
      }
  }, [activeMode, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const autoSaveInterval = setInterval(async () => {
        if (hasPendingChanges.current && !isLoading && !isSyncing) {
            await forceSave();
        }
    }, 5000); 
    return () => clearInterval(autoSaveInterval);
  }, [isAdmin, isLoading, isSyncing, forceSave]);

  // SMART SCHEDULE LOGIC
  const processMatchdayTimeouts = useCallback(() => {
      const settings = state.scheduleSettings;
      if (!settings.isActive || !settings.matchdayStartTime) return { processedCount: 0, message: 'Jadwal tidak aktif.' };

      const now = Date.now();
      const deadline = settings.matchdayStartTime + (settings.matchdayDurationHours * 3600000);
      
      if (now < deadline) return { processedCount: 0, message: 'Waktu matchday belum habis.' };

      const currentMatches = state.matches.filter(m => 
          (m.matchday === settings.currentMatchday) && (m.status !== 'finished')
      );

      const updatedMatches: Match[] = [];

      currentMatches.forEach(match => {
          const comments = match.comments || [];
          
          const teamAEmail = match.teamA.ownerEmail?.toLowerCase();
          const teamBEmail = match.teamB.ownerEmail?.toLowerCase();

          const teamAActive = comments.some(c => c.userEmail.toLowerCase() === teamAEmail);
          const teamBActive = comments.some(c => c.userEmail.toLowerCase() === teamBEmail);

          let newMatch = { ...match };
          let changed = false;

          if (teamAActive && !teamBActive) {
              newMatch.scoreA = 3; newMatch.scoreB = 0; newMatch.status = 'finished'; newMatch.summary = 'Menang WO (Otomatis oleh Sistem)'; changed = true;
          } else if (!teamAActive && teamBActive) {
              newMatch.scoreA = 0; newMatch.scoreB = 3; newMatch.status = 'finished'; newMatch.summary = 'Menang WO (Otomatis oleh Sistem)'; changed = true;
          } else if (!teamAActive && !teamBActive) {
              newMatch.scoreA = 0; newMatch.scoreB = 0; newMatch.status = 'finished'; newMatch.summary = 'Imbang WO (Tidak ada aktivitas)'; changed = true;
          }

          if (changed) updatedMatches.push(newMatch);
      });

      if (updatedMatches.length > 0) {
          dispatch({ type: 'PROCESS_AUTO_WO', payload: updatedMatches });
          dispatch({ type: 'UPDATE_SCHEDULE_SETTINGS', payload: { isActive: false } }); 
          return { processedCount: updatedMatches.length, message: `${updatedMatches.length} pertandingan diproses WO otomatis.` };
      }

      return { processedCount: 0, message: 'Tidak ada pertandingan yang memenuhi syarat WO.' };

  }, [state.scheduleSettings, state.matches]);

  const startMatchday = (duration: number) => {
      dispatch({ 
          type: 'UPDATE_SCHEDULE_SETTINGS', 
          payload: { isActive: true, matchdayStartTime: Date.now(), matchdayDurationHours: duration } 
      });
  };

  const pauseSchedule = () => {
      dispatch({ type: 'UPDATE_SCHEDULE_SETTINGS', payload: { isActive: false } });
  };

  const setMatchday = (day: number) => {
      dispatch({ type: 'UPDATE_SCHEDULE_SETTINGS', payload: { currentMatchday: day, isActive: false, matchdayStartTime: null } });
  };

  const generateKnockoutBracket = useCallback(() => {
    const topTeamsByGroup: { winner: Team | null, runnerUp: Team | null }[] = state.groups.map(group => {
        const sorted = [...group.standings].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
        return { winner: sorted[0]?.team || null, runnerUp: sorted[1]?.team || null };
    });

    if (topTeamsByGroup.some(g => !g.winner)) return { success: false, message: "Pastikan semua grup memiliki pemenang." };

    const newKnockout: KnockoutStageRounds = { 'Play-offs': [], 'Round of 16': [], 'Quarter-finals': [], 'Semi-finals': [], 'Final': [] };

    if (state.groups.length === 2) {
        const gA = topTeamsByGroup[0];
        const gB = topTeamsByGroup[1];
        newKnockout['Semi-finals'].push({ id: `ko-sf-1`, round: 'Semi-finals', matchNumber: 1, teamA: gA.winner, teamB: gB.runnerUp, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'ko-final-1', placeholderA: 'Winner A', placeholderB: 'Runner B' });
        newKnockout['Semi-finals'].push({ id: `ko-sf-2`, round: 'Semi-finals', matchNumber: 2, teamA: gB.winner, teamB: gA.runnerUp, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'ko-final-1', placeholderA: 'Winner B', placeholderB: 'Runner A' });
        newKnockout['Final'].push({ id: `ko-final-1`, round: 'Final', matchNumber: 1, teamA: null, teamB: null, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: null, placeholderA: 'Winner SF1', placeholderB: 'Winner SF2' });
    } 
    else {
        const topTeams: Team[] = [];
        topTeamsByGroup.forEach(g => { if (g.winner) topTeams.push(g.winner); if (g.runnerUp) topTeams.push(g.runnerUp); });
        if (topTeams.length < 2) return { success: false, message: "Minimal butuh 2 tim." };
        const roundName = topTeams.length <= 4 ? 'Semi-finals' : topTeams.length <= 8 ? 'Quarter-finals' : 'Round of 16';
        for (let i = 0; i < topTeams.length; i += 2) {
            if (topTeams[i+1]) {
                newKnockout[roundName].push({ id: `ko-${Date.now()}-${i}`, round: roundName, matchNumber: (i/2) + 1, teamA: topTeams[i], teamB: topTeams[i+1], scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: null, placeholderA: '', placeholderB: '' });
            }
        }
    }
    dispatch({ type: 'GENERATE_KNOCKOUT_BRACKET', payload: newKnockout });
    return { success: true };
  }, [state.groups]);

  const autoGenerateGroups = useCallback((numberOfGroups: number) => {
      const shuffled = [...state.teams].sort(() => Math.random() - 0.5);
      const newGroups: Group[] = [];
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (let i = 0; i < numberOfGroups; i++) {
          newGroups.push({ id: `g-${Date.now()}-${i}`, name: `Group ${alphabet[i] || (i + 1)}`, teams: [], standings: [] });
      }
      shuffled.forEach((team, index) => { newGroups[index % numberOfGroups].teams.push(team); });
      dispatch({ type: 'GENERATE_GROUPS', payload: { groups: newGroups, matches: [], knockoutStage: null } });
  }, [state.teams]);

  const initializeLeague = useCallback(() => {
      const leagueGroup: Group = { id: 'league-season', name: 'Regular Season', teams: [...state.teams], standings: [] };
      const newMatches: Match[] = [];
      const teams = [...leagueGroup.teams];
      if (teams.length < 2) { dispatch({ type: 'GENERATE_GROUPS', payload: { groups: [leagueGroup], matches: [], knockoutStage: null } }); return; }
      const dummyTeam: Team = { id: 'bye', name: 'BYE' } as Team;
      if (teams.length % 2 !== 0) teams.push(dummyTeam); 
      const numRounds = (teams.length - 1) * 2; 
      const numMatchesPerRound = teams.length / 2;
      for (let round = 0; round < numRounds; round++) {
          for (let i = 0; i < numMatchesPerRound; i++) {
              const home = teams[i]; const away = teams[teams.length - 1 - i];
              if (home.id !== 'bye' && away.id !== 'bye') {
                  const isSecondLeg = round >= (numRounds / 2);
                  const teamA = isSecondLeg ? away : home; const teamB = isSecondLeg ? home : away;
                  newMatches.push({ id: `m-league-${round + 1}-${i}`, teamA, teamB, scoreA: null, scoreB: null, status: 'scheduled', group: 'league-season', leg: isSecondLeg ? 2 : 1, matchday: round + 1 });
              }
          }
          teams.splice(1, 0, teams.pop()!);
      }
      dispatch({ type: 'GENERATE_GROUPS', payload: { groups: [leagueGroup], matches: newMatches, knockoutStage: null } });
  }, [state.teams]);

  const clubStats = useMemo(() => {
      const stats: Record<string, { team: Team, goals: number }> = {};
      state.teams.forEach(t => { if (t && t.id) stats[t.id] = { team: t, goals: 0 }; });
      const processMatch = (m: Match | KnockoutMatch) => {
          if (!m) return;
          if ('status' in m) {
              if (m.status !== 'finished') return;
              if (m.teamA?.id && stats[m.teamA.id]) stats[m.teamA.id].goals += (m.scoreA || 0);
              if (m.teamB?.id && stats[m.teamB.id]) stats[m.teamB.id].goals += (m.scoreB || 0);
          } else {
              if (m.scoreA1 === null) return;
              if (m.teamA?.id && stats[m.teamA.id]) stats[m.teamA.id].goals += (m.scoreA1 || 0) + (m.scoreA2 || 0);
              if (m.teamB?.id && stats[m.teamB.id]) stats[m.teamB.id].goals += (m.scoreB1 || 0) + (m.scoreB2 || 0);
          }
      };
      state.matches.forEach(processMatch);
      if (state.knockoutStage) { (Object.values(state.knockoutStage).flat() as KnockoutMatch[]).forEach(m => { if (m) processMatch(m); }); }
      return Object.values(stats).sort((a, b) => b.goals - a.goals).filter(s => s.goals > 0);
  }, [state.matches, state.knockoutStage, state.teams]);

  const playerStats = useMemo(() => { return { topScorers: [], topAssists: [] }; }, []);

  return { 
      ...state, 
      isLoading, isSyncing, clubStats, playerStats, hasUnsavedChanges, forceSave,
      updateNews: (news: NewsItem[]) => dispatch({ type: 'UPDATE_NEWS', payload: news }),
      updateProducts: (products: Product[]) => dispatch({ type: 'UPDATE_PRODUCTS', payload: products }),
      updateNewsCategories: (cats: string[]) => dispatch({ type: 'UPDATE_NEWS_CATEGORIES', payload: cats }),
      updateShopCategories: (cats: string[]) => dispatch({ type: 'UPDATE_SHOP_CATEGORIES', payload: cats }),
      updateMarqueeMessages: (msgs: string[]) => dispatch({ type: 'UPDATE_MARQUEE', payload: msgs }),
      addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => 
        dispatch({ type: 'ADD_TEAM', payload: { id, name, logoUrl, manager, socialMediaUrl, whatsappNumber, ownerEmail } }),
      updateTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, isTopSeed?: boolean, ownerEmail?: string) => 
        dispatch({ type: 'UPDATE_TEAM', payload: { id, name, logoUrl, manager, socialMediaUrl, whatsappNumber, isTopSeed, ownerEmail } }),
      deleteTeam: (id: string) => dispatch({ type: 'DELETE_TEAM', payload: id }),
      updateMatchScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string, playerStats?: MatchPlayerStats) => 
        dispatch({ type: 'UPDATE_MATCH_SCORE', payload: { matchId, scoreA, scoreB, proofUrl, playerStats } }),
      updateMatch: (matchId: string, updates: Partial<Match>) => dispatch({ type: 'UPDATE_MATCH', payload: { matchId, updates } }),
      updateKnockoutMatch: (id: string, m: KnockoutMatch) => dispatch({ type: 'UPDATE_KNOCKOUT_MATCH', payload: m }),
      addKnockoutMatch: (round: keyof KnockoutStageRounds, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string, matchNumber: number) => {
          const teamA = state.teams.find(t => t.id === teamAId) || null;
          const teamB = state.teams.find(t => t.id === teamBId) || null;
          dispatch({ type: 'ADD_KNOCKOUT_MATCH', payload: { id: `ko-${Date.now()}`, round, matchNumber, teamA, teamB, placeholderA, placeholderB, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: null } });
      },
      deleteKnockoutMatch: (round: keyof KnockoutStageRounds, id: string) => dispatch({ type: 'DELETE_KNOCKOUT_MATCH', payload: { round, id } }),
      generateKnockoutBracket,
      initializeEmptyKnockoutStage: () => dispatch({ type: 'GENERATE_KNOCKOUT_BRACKET', payload: { 'Play-offs': [], 'Round of 16': [], 'Quarter-finals': [], 'Semi-finals': [], 'Final': [] } }),
      updateRules: (r: string) => dispatch({ type: 'UPDATE_RULES', payload: r }),
      updateBanners: (b: string[]) => dispatch({ type: 'UPDATE_BANNERS', payload: b }),
      updatePartners: (p: Partner[]) => dispatch({ type: 'UPDATE_PARTNERS', payload: p }),
      updateHeaderLogo: (url: string) => dispatch({ type: 'UPDATE_HEADER_LOGO', payload: url }),
      updatePwaIcon: (url: string) => dispatch({ type: 'UPDATE_PWA_ICON', payload: url }),
      setRegistrationOpen: (open: boolean) => dispatch({ type: 'SET_REGISTRATION_STATUS', payload: open }),
      setTournamentStatus: (status: 'active' | 'completed') => dispatch({ type: 'SET_STATUS', payload: status }),
      addHistoryEntry: (entry: SeasonHistory) => dispatch({ type: 'ADD_HISTORY_ENTRY', payload: entry }),
      deleteHistoryEntry: (id: string) => dispatch({ type: 'DELETE_HISTORY_ENTRY', payload: id }),
      setTournamentState: (s: FullTournamentState) => dispatch({ type: 'SET_STATE', payload: s }),
      updateVisibleModes: (modes: TournamentMode[]) => dispatch({ type: 'UPDATE_VISIBLE_MODES', payload: modes }),
      resetTournament: () => dispatch({ type: 'RESET', payload: createInitialState(state.mode) }),
      archiveSeason: (historyEntry: SeasonHistory, keepTeams: boolean) => dispatch({ type: 'ARCHIVE_SEASON', payload: { historyEntry, keepTeams } }),
      manualAddGroup: (n: string) => dispatch({ type: 'GENERATE_GROUPS', payload: { groups: [...state.groups, { id: `g${Date.now()}`, name: n, teams: [], standings: [] }], matches: state.matches, knockoutStage: state.knockoutStage } }),
      manualDeleteGroup: (id: string) => dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups.filter(g => g.id !== id), matches: state.matches, knockoutStage: state.knockoutStage } }),
      manualAddTeamToGroup: (tid: string, gid: string) => {
          const t = state.teams.find(x => x.id === tid);
          if (!t) return;
          const newGroups = state.groups.map(g => g.id === gid ? { ...g, teams: [...g.teams, t] } : g);
          dispatch({ type: 'GENERATE_GROUPS', payload: { groups: newGroups, matches: state.matches, knockoutStage: state.knockoutStage } });
      },
      manualRemoveTeamFromGroup: (tid: string, gid: string) => {
          const newGroups = state.groups.map(g => g.id === gid ? { ...g, teams: g.teams.filter(x => x.id !== tid) } : g);
          dispatch({ type: 'GENERATE_GROUPS', payload: { groups: newGroups, matches: state.matches, knockoutStage: state.knockoutStage } });
      },
      generateMatchesFromGroups: (roundRobinType: 'single' | 'double' = 'single') => {
          const newMatches: Match[] = [];
          state.groups.forEach(g => {
              const teamsForScheduling = [...g.teams];
              if (teamsForScheduling.length < 2) return;
              if (teamsForScheduling.length % 2 !== 0) teamsForScheduling.push({ id: 'bye', name: 'BYE' } as Team);
              const n = teamsForScheduling.length;
              const roundsPerLeg = n - 1;
              const matchesPerRound = n / 2;
              for (let round = 0; round < roundsPerLeg; round++) {
                  for (let i = 0; i < matchesPerRound; i++) {
                      const tA = teamsForScheduling[i]; const tB = teamsForScheduling[n - 1 - i];
                      if (tA.id !== 'bye' && tB.id !== 'bye') {
                          const isHome = round % 2 === 0 ? i === 0 : i !== 0; const home = isHome ? tA : tB; const away = isHome ? tB : tA;
                          newMatches.push({ id: `m-${g.id}-L1-R${round + 1}-${i}`, teamA: home, teamB: away, scoreA: null, scoreB: null, status: 'scheduled', group: g.id, leg: 1, matchday: round + 1 });
                      }
                  }
                  teamsForScheduling.splice(1, 0, teamsForScheduling.pop()!);
              }
              if (roundRobinType === 'double') {
                  const leg1Matches = newMatches.filter(m => m.group === g.id && m.leg === 1);
                  leg1Matches.forEach(m => {
                      newMatches.push({ id: `m-${g.id}-L2-R${(m.matchday || 0) + roundsPerLeg}-${m.id.split('-').pop()}`, teamA: m.teamB, teamB: m.teamA, scoreA: null, scoreB: null, status: 'scheduled', group: g.id, leg: 2, matchday: (m.matchday || 0) + roundsPerLeg });
                  });
              }
          });
          dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups, matches: newMatches, knockoutStage: state.knockoutStage } });
      },
      addMatchComment: (matchId: string, userId: string, userName: string, userEmail: string, text: string, isAdmin: boolean = false) =>
        dispatch({ type: 'ADD_MATCH_COMMENT', payload: { matchId, comment: { id: `c${Date.now()}`, userId, userName, userEmail, text, timestamp: Date.now(), isAdmin } } }),
      autoGenerateGroups,
      initializeLeague,
      generateSummary,
      startMatchday,
      pauseSchedule,
      setMatchday,
      processMatchdayTimeouts
  };
};