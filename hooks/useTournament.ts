
import { useReducer, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import type { Team, Group, Match, Standing, KnockoutStageRounds, KnockoutMatch, TournamentState as FullTournamentState, Partner, TournamentMode, MatchComment, SeasonHistory, NewsItem, Product, PlayerStat, MatchPlayerStats } from '../types';
import { generateSummary } from '../services/geminiService';
import { subscribeToTournamentData, saveTournamentData, sanitizeData } from '../services/firebaseService';
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
  visibleModes: ['league', 'wakacl', 'two_leagues']
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
    const hydratedKnockout = state.knockoutStage ? {
        'Play-offs': (state.knockoutStage['Play-offs'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
        'Round of 16': (state.knockoutStage['Round of 16'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
        'Quarter-finals': (state.knockoutStage['Quarter-finals'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
        'Semi-finals': (state.knockoutStage['Semi-finals'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
        'Final': (state.knockoutStage['Final'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null }))
    } : null;

    const hydratedHistory = (state.history || []).map(h => ({
        ...h,
        champion: getFullTeam(h.champion),
        runnerUp: h.runnerUp ? getFullTeam(h.runnerUp) : undefined
    }));

    return { 
        ...state, 
        groups: hydratedGroups, 
        matches: hydratedMatches, 
        knockoutStage: hydratedKnockout as any,
        history: hydratedHistory 
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
  | { type: 'ADD_HISTORY_ENTRY', payload: SeasonHistory }
  | { type: 'DELETE_HISTORY_ENTRY', payload: string }
  | { type: 'ADD_KNOCKOUT_MATCH'; payload: KnockoutMatch }
  | { type: 'DELETE_KNOCKOUT_MATCH'; payload: { round: keyof KnockoutStageRounds, id: string } }
  | { type: 'GENERATE_KNOCKOUT_BRACKET'; payload: KnockoutStageRounds }
  | { type: 'UPDATE_VISIBLE_MODES'; payload: TournamentMode[] }
  | { type: 'ADD_MATCH_COMMENT'; payload: { matchId: string, comment: MatchComment } };

const tournamentReducer = (state: FullTournamentState, action: Action): FullTournamentState => {
  let newState: FullTournamentState;
  switch (action.type) {
    case 'SET_STATE': newState = { ...state, ...action.payload }; break;
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
    case 'SET_REGISTRATION_STATUS': newState = { ...state, isRegistrationOpen: action.payload }; break;
    case 'SET_STATUS': newState = { ...state, status: action.payload }; break;
    case 'ADD_HISTORY_ENTRY': newState = { ...state, history: [action.payload, ...state.history] }; break;
    case 'DELETE_HISTORY_ENTRY': newState = { ...state, history: state.history.filter(h => h.seasonId !== action.payload) }; break;
    case 'UPDATE_VISIBLE_MODES': newState = { ...state, visibleModes: action.payload }; break;
    case 'ADD_MATCH_COMMENT': newState = { ...state, matches: state.matches.map(m => m.id === action.payload.matchId ? { ...m, comments: [...(m.comments || []), action.payload.comment] } : m) }; break;
    case 'RESET': {
        newState = { 
            ...createInitialState(state.mode),
            history: state.history,
            news: state.news,
            products: state.products,
            banners: state.banners,
            partners: state.partners,
            rules: state.rules,
            headerLogoUrl: state.headerLogoUrl,
            newsCategories: state.newsCategories,
            shopCategories: state.shopCategories,
            marqueeMessages: state.marqueeMessages,
            visibleModes: state.visibleModes,
            teams: [] 
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
            teams: keepTeams ? state.teams : []
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
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdatingFromServer = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToTournamentData(activeMode, (serverData) => {
        isUpdatingFromServer.current = true;
        dispatch({ type: 'SET_STATE', payload: serverData });
        setTimeout(() => { isUpdatingFromServer.current = false; setIsLoading(false); }, 100);
    });
    return () => unsubscribe();
  }, [activeMode]);

  useEffect(() => {
    if (isAdmin && !isLoading && !isUpdatingFromServer.current) {
       const hasGlobalData = (state.news && state.news.length > 0) || 
                            (state.products && state.products.length > 0) ||
                            (state.banners && state.banners.length > 0) ||
                            (state.marqueeMessages && state.marqueeMessages.length > 0) ||
                            (state.history && state.history.length > 0) ||
                            (state.visibleModes && state.visibleModes.length > 0);
                            
       if (!hasGlobalData) return;

       if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
       saveTimeoutRef.current = setTimeout(async () => { 
           setIsSyncing(true); 
           try { await saveTournamentData(activeMode, stateRef.current); } catch (e) { console.error(e); } 
           finally { setIsSyncing(false); }
       }, 2000); 
       return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }
  }, [state, isLoading, activeMode, isAdmin]);

  const generateKnockoutBracket = useCallback(() => {
    const topTeamsByGroup: { winner: Team | null, runnerUp: Team | null }[] = state.groups.map(group => {
        const sorted = [...group.standings].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
        return {
            winner: sorted[0]?.team || null,
            runnerUp: sorted[1]?.team || null
        };
    });

    if (topTeamsByGroup.some(g => !g.winner)) {
        return { success: false, message: "Pastikan semua grup memiliki pemenang sebelum membuat bracket." };
    }

    const newKnockout: KnockoutStageRounds = {
        'Play-offs': [], 'Round of 16': [], 'Quarter-finals': [], 'Semi-finals': [], 'Final': []
    };

    if (state.groups.length === 2) {
        const gA = topTeamsByGroup[0];
        const gB = topTeamsByGroup[1];
        newKnockout['Semi-finals'].push({
            id: `ko-sf-1`, round: 'Semi-finals', matchNumber: 1,
            teamA: gA.winner, teamB: gB.runnerUp, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null,
            winnerId: null, nextMatchId: 'ko-final-1', placeholderA: 'Winner A', placeholderB: 'Runner B'
        });
        newKnockout['Semi-finals'].push({
            id: `ko-sf-2`, round: 'Semi-finals', matchNumber: 2,
            teamA: gB.winner, teamB: gA.runnerUp, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null,
            winnerId: null, nextMatchId: 'ko-final-1', placeholderA: 'Winner B', placeholderB: 'Runner A'
        });
        newKnockout['Final'].push({
            id: `ko-final-1`, round: 'Final', matchNumber: 1,
            teamA: null, teamB: null, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null,
            winnerId: null, nextMatchId: null, placeholderA: 'Winner SF1', placeholderB: 'Winner SF2'
        });
    } 
    else {
        const topTeams: Team[] = [];
        topTeamsByGroup.forEach(g => {
            if (g.winner) topTeams.push(g.winner);
            if (g.runnerUp) topTeams.push(g.runnerUp);
        });
        if (topTeams.length < 2) return { success: false, message: "Minimal butuh 2 tim untuk membuat bracket." };
        const roundName = topTeams.length <= 4 ? 'Semi-finals' : topTeams.length <= 8 ? 'Quarter-finals' : 'Round of 16';
        for (let i = 0; i < topTeams.length; i += 2) {
            if (topTeams[i+1]) {
                newKnockout[roundName].push({
                    id: `ko-${Date.now()}-${i}`, round: roundName, matchNumber: (i/2) + 1,
                    teamA: topTeams[i], teamB: topTeams[i+1], scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null,
                    winnerId: null, nextMatchId: null, placeholderA: '', placeholderB: ''
                });
            }
        }
    }
    dispatch({ type: 'GENERATE_KNOCKOUT_BRACKET', payload: newKnockout });
    return { success: true };
  }, [state.groups]);

  const clubStats = useMemo(() => {
      const stats: Record<string, { team: Team, goals: number }> = {};
      state.teams.forEach(t => { if (t && t.id) stats[t.id] = { team: t, goals: 0 }; });
      const processMatch = (m: Match | KnockoutMatch) => {
          if (!m) return;
          if ('status' in m) {
              if (m.status !== 'finished') return;
              if (m.teamA?.id && stats[m.teamA.id]) stats[m.teamA.id].goals += (m.scoreA || 0);
              if (m.teamB?.id && stats[m.teamB.id]) stats[m.teamB.id].goals += (m.scoreB || 0);
          } 
          else {
              if (m.scoreA1 === null) return;
              if (m.teamA?.id && stats[m.teamA.id]) stats[m.teamA.id].goals += (m.scoreA1 || 0) + (m.scoreA2 || 0);
              if (m.teamB?.id && stats[m.teamB.id]) stats[m.teamB.id].goals += (m.scoreB1 || 0) + (m.scoreB2 || 0);
          }
      };
      state.matches.forEach(processMatch);
      if (state.knockoutStage) { 
        (Object.values(state.knockoutStage).flat() as KnockoutMatch[]).forEach(m => {
            if (m) processMatch(m);
        }); 
      }
      return Object.values(stats).sort((a, b) => b.goals - a.goals).filter(s => s.goals > 0);
  }, [state.matches, state.knockoutStage, state.teams]);

  const playerStats = useMemo(() => {
      // Removed Player Stats Calculation logic entirely
      return {
          topScorers: [],
          topAssists: [] 
      };
  }, []); // No dependencies needed

  return { 
      ...state, 
      isLoading, isSyncing, clubStats, playerStats,
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
      generateMatchesFromGroups: () => {
          const newMatches: Match[] = [];
          state.groups.forEach(g => {
              const teamsForScheduling = [...g.teams];
              if (teamsForScheduling.length < 2) return;
              if (teamsForScheduling.length % 2 !== 0) teamsForScheduling.push({ id: 'bye', name: 'BYE' } as Team);
              const n = teamsForScheduling.length;
              for (let round = 0; round < n - 1; round++) {
                  for (let i = 0; i < n / 2; i++) {
                      const tA = teamsForScheduling[i]; const tB = teamsForScheduling[n - 1 - i];
                      if (tA.id !== 'bye' && tB.id !== 'bye') {
                          newMatches.push({ id: `m-${g.id}-${round}-${i}`, teamA: tA, teamB: tB, scoreA: null, scoreB: null, status: 'finished' as const, group: g.id, leg: 1, matchday: round + 1 });
                      }
                  }
                  teamsForScheduling.splice(1, 0, teamsForScheduling.pop()!);
              }
          });
          dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups, matches: newMatches, knockoutStage: state.knockoutStage } });
      },
      addMatchComment: (matchId: string, userId: string, userName: string, userEmail: string, text: string, isAdmin: boolean = false) =>
        dispatch({ type: 'ADD_MATCH_COMMENT', payload: { matchId, comment: { id: `c${Date.now()}`, userId, userName, userEmail, text, timestamp: Date.now(), isAdmin } } }),
      generateSummary
  };
};
