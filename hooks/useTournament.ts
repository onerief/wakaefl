
import { useReducer, useCallback, useState, useEffect } from 'react';
import type { Team, Group, Match, Standing, KnockoutStageRounds, KnockoutMatch, TournamentState as FullTournamentState, Partner, TournamentMode, MatchComment, SeasonHistory } from '../types';
import { generateSummary } from '../services/geminiService';
import { getTournamentData, saveTournamentData } from '../services/firebaseService';
import { useToast } from '../components/shared/Toast';

export const SPECIAL_TEAM_ID = 't13';

const createInitialState = (mode: TournamentMode): FullTournamentState => ({
  teams: [],
  groups: [],
  matches: [],
  knockoutStage: null,
  rules: `General Rules:
- Pertandingan wajib direkam/disiarkan langsung.
- Dilarang keras menggunakan cheat, program ilegal, atau bug abuse.

Group Stage:
- Format: Round-robin.
- Poin: Menang = 3, Seri = 1, Kalah = 0.
- Tie-breaker: 1. Head-to-head, 2. Selisih gol, 3. Gol dicetak.`,
  banners: [],
  partners: [],
  mode: mode,
  isDoubleRoundRobin: true,
  status: 'active',
  history: [],
  isRegistrationOpen: true, 
  headerLogoUrl: '', 
});

type Action =
  | { type: 'SET_STATE'; payload: FullTournamentState }
  | { type: 'SET_MODE'; payload: TournamentMode }
  | { type: 'SET_ROUND_ROBIN'; payload: boolean }
  | { type: 'ADD_TEAM'; payload: Team }
  | { type: 'UPDATE_TEAM'; payload: Team }
  | { type: 'DELETE_TEAM'; payload: string }
  | { type: 'GENERATE_GROUPS'; payload: { groups: Group[], matches: Match[], knockoutStage: KnockoutStageRounds | null } }
  | { type: 'GENERATE_KNOCKOUT_BRACKET'; payload: { knockoutStage: KnockoutStageRounds } }
  | { type: 'UPDATE_MATCH_SCORE'; payload: { matchId: string; scoreA: number; scoreB: number; summary?: string | null, proofUrl?: string } }
  | { type: 'ADD_MATCH_COMMENT'; payload: { matchId: string; comment: MatchComment } }
  | { type: 'GENERATE_MATCHES_FROM_GROUPS', payload: { matches: Match[] } }
  | { type: 'RESET'; payload: FullTournamentState }
  | { type: 'START_NEW_SEASON' }
  | { type: 'UPDATE_RULES', payload: string }
  | { type: 'UPDATE_BANNERS', payload: string[] }
  | { type: 'UPDATE_PARTNERS', payload: Partner[] }
  | { type: 'UPDATE_KNOCKOUT_MATCH'; payload: KnockoutMatch }
  | { type: 'INITIALIZE_EMPTY_KNOCKOUT' }
  | { type: 'ADD_KNOCKOUT_MATCH'; payload: { round: keyof KnockoutStageRounds, match: KnockoutMatch } }
  | { type: 'DELETE_KNOCKOUT_MATCH'; payload: string }
  | { type: 'UPDATE_KNOCKOUT_MATCH_DETAILS'; payload: { matchId: string; teamAId: string | null; teamBId: string | null; placeholderA: string; placeholderB: string } }
  | { type: 'UPDATE_MATCH_SCHEDULE'; payload: { matchId: string; teamAId: string; teamBId: string } }
  | { type: 'MANUAL_ADD_GROUP'; payload: Group }
  | { type: 'MANUAL_DELETE_GROUP'; payload: string }
  | { type: 'MANUAL_ADD_TEAM_TO_GROUP'; payload: { teamId: string; groupId: string } }
  | { type: 'MANUAL_REMOVE_TEAM_FROM_GROUP'; payload: { teamId: string; groupId: string } }
  | { type: 'MOVE_TEAM'; payload: { teamId: string, sourceGroupId: string, destGroupId: string } }
  | { type: 'IMPORT_LEGACY_JSON'; payload: FullTournamentState }
  | { type: 'REQUEST_TEAM_CLAIM'; payload: { teamId: string; userEmail: string } }
  | { type: 'RESOLVE_TEAM_CLAIM'; payload: { teamId: string; approved: boolean } }
  | { type: 'FINALIZE_SEASON'; payload: SeasonHistory }
  | { type: 'SET_STATUS'; payload: 'active' | 'completed' }
  | { type: 'SET_REGISTRATION_STATUS'; payload: boolean }
  | { type: 'UPDATE_HEADER_LOGO'; payload: string }
  | { type: 'ADD_HISTORY_ENTRY'; payload: SeasonHistory }
  | { type: 'DELETE_HISTORY_ENTRY'; payload: string };

const calculateStandings = (teams: Team[], matches: Match[]): Standing[] => {
  const standings: { [key: string]: Standing } = teams.reduce((acc, team) => {
    acc[team.id] = { team, played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0, form: [] };
    return acc;
  }, {} as { [key: string]: Standing });

  matches.forEach(match => {
    if (match.status !== 'finished' || match.scoreA === null || match.scoreB === null) return;
    const { teamA, teamB, scoreA, scoreB } = match;
    if (standings[teamA.id]) {
      standings[teamA.id].played++;
      standings[teamA.id].goalDifference += scoreA - scoreB;
      if (scoreA > scoreB) { standings[teamA.id].wins++; standings[teamA.id].points += 3; }
      else if (scoreA === scoreB) { standings[teamA.id].draws++; standings[teamA.id].points += 1; }
      else { standings[teamA.id].losses++; }
    }
    if (standings[teamB.id]) {
      standings[teamB.id].played++;
      standings[teamB.id].goalDifference += scoreB - scoreA;
      if (scoreB > scoreA) { standings[teamB.id].wins++; standings[teamB.id].points += 3; }
      else if (scoreB === scoreA) { standings[teamB.id].draws++; standings[teamB.id].points += 1; }
      else { standings[teamB.id].losses++; }
    }
  });
  
  const sortedMatches = [...matches].sort((a, b) => a.id.localeCompare(b.id));
  teams.forEach(team => {
      if (!standings[team.id]) return;
      const teamMatches = sortedMatches.filter(m => m.status === 'finished' && (m.teamA.id === team.id || m.teamB.id === team.id));
      const recentMatches = teamMatches.slice(-5);
      standings[team.id].form = recentMatches.map(m => {
          const isTeamA = m.teamA.id === team.id;
          const scoreSelf = isTeamA ? m.scoreA! : m.scoreB!;
          const scoreOpp = isTeamA ? m.scoreB! : m.scoreA!;
          if (scoreSelf > scoreOpp) return 'W';
          if (scoreSelf === scoreOpp) return 'D';
          return 'L';
      });
  });

  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return 0;
  });
};

const determineKnockoutWinner = (match: KnockoutMatch): string | null => {
    if (!match.teamA || !match.teamB) return null;
    const isFinal = match.round === 'Final';
    const sA1 = match.scoreA1;
    const sB1 = match.scoreB1;
    const sA2 = match.scoreA2;
    const sB2 = match.scoreB2;
    if (isFinal) {
        if (sA1 === null || sB1 === null) return null;
        if (sA1 > sB1) return match.teamA.id;
        if (sB1 > sA1) return match.teamB.id;
        return null;
    } else {
        if (sA1 === null || sB1 === null || sA2 === null || sB2 === null) return null;
        const aggA = sA1 + sA2;
        const aggB = sB1 + sB2;
        if (aggA > aggB) return match.teamA.id;
        if (aggB > aggA) return match.teamB.id;
        const awayA = sA2;
        const awayB = sB1;
        if (awayA > awayB) return match.teamA.id;
        if (awayB > awayA) return match.teamB.id;
        return null;
    }
};

const tournamentReducer = (state: FullTournamentState, action: Action): FullTournamentState => {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_ROUND_ROBIN':
      return { ...state, isDoubleRoundRobin: action.payload };
    case 'ADD_TEAM':
      return { ...state, teams: [...state.teams, action.payload] };
    case 'UPDATE_TEAM':
      const updatedTeam = action.payload;
      const updatedTeams = state.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
      const updatedGroups = state.groups.map(g => ({
          ...g,
          teams: g.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t),
          standings: g.standings.map(s => s.team.id === updatedTeam.id ? { ...s, team: updatedTeam } : s)
      }));
      const updatedMatches = state.matches.map(m => {
          if (m.teamA.id === updatedTeam.id) return { ...m, teamA: updatedTeam };
          if (m.teamB.id === updatedTeam.id) return { ...m, teamB: updatedTeam };
          return m;
      });
      return { ...state, teams: updatedTeams, groups: updatedGroups, matches: updatedMatches };
    case 'DELETE_TEAM':
      return { ...state, teams: state.teams.filter(t => t.id !== action.payload) };
    case 'UPDATE_RULES':
      return { ...state, rules: action.payload };
    case 'UPDATE_BANNERS':
      return { ...state, banners: action.payload };
    case 'UPDATE_PARTNERS':
      return { ...state, partners: action.payload };
    case 'GENERATE_GROUPS':
      return { ...state, ...action.payload };
    case 'GENERATE_MATCHES_FROM_GROUPS':
      return { ...state, matches: action.payload.matches };
    case 'GENERATE_KNOCKOUT_BRACKET':
        return { ...state, knockoutStage: action.payload.knockoutStage };
    case 'UPDATE_MATCH_SCORE': {
      const newMatches = state.matches.map(m => m.id === action.payload.matchId ? { ...m, ...action.payload, status: 'finished' as const } : m);
      return { ...state, matches: newMatches, groups: state.groups.map(g => ({ ...g, standings: calculateStandings(g.teams, newMatches.filter(m => m.group === g.name.split(' ')[1])) })) };
    }
    case 'ADD_MATCH_COMMENT': {
        const { matchId, comment } = action.payload;
        const newMatches = state.matches.map(m => {
            if (m.id === matchId) {
                const existingComments = m.comments || [];
                return { ...m, comments: [...existingComments, comment] };
            }
            return m;
        });
        return { ...state, matches: newMatches };
    }
    case 'RESET':
      return action.payload;
    case 'START_NEW_SEASON':
        return {
            ...createInitialState(state.mode),
            history: state.history,
            partners: state.partners,
            banners: state.banners,
            rules: state.rules,
            headerLogoUrl: state.headerLogoUrl,
            status: 'active'
        };
    case 'INITIALIZE_EMPTY_KNOCKOUT':
      return { ...state, knockoutStage: { 'Round of 16': [], 'Quarter-finals': [], 'Semi-finals': [], 'Final': [] } };
    case 'UPDATE_KNOCKOUT_MATCH': {
      if (!state.knockoutStage) return state;
      const { round } = action.payload;
      const updatedMatch = { ...action.payload };
      updatedMatch.winnerId = determineKnockoutWinner(updatedMatch);
      const newKnockout = { ...state.knockoutStage, [round]: state.knockoutStage[round].map(m => m.id === updatedMatch.id ? updatedMatch : m) };
      return { ...state, knockoutStage: newKnockout };
    }
    case 'DELETE_KNOCKOUT_MATCH': {
        if (!state.knockoutStage) return state;
        const round = Object.keys(state.knockoutStage).find(r => 
            state.knockoutStage![r as keyof KnockoutStageRounds].some(m => m.id === action.payload)
        ) as keyof KnockoutStageRounds | undefined;
        if (!round) return state;
        return { ...state, knockoutStage: { ...state.knockoutStage, [round]: state.knockoutStage[round].filter(m => m.id !== action.payload) } };
    }
    case 'UPDATE_KNOCKOUT_MATCH_DETAILS': {
        if (!state.knockoutStage) return state;
        const { matchId, teamAId, teamBId, placeholderA, placeholderB } = action.payload;
        const round = Object.keys(state.knockoutStage).find(r => 
            state.knockoutStage![r as keyof KnockoutStageRounds].some(m => m.id === matchId)
        ) as keyof KnockoutStageRounds | undefined;
        if (!round) return state;
        const updatedMatches = state.knockoutStage[round].map(m => {
            if (m.id !== matchId) return m;
            return {
                ...m,
                teamA: teamAId ? (state.teams.find(t => t.id === teamAId) || null) : null,
                teamB: teamBId ? (state.teams.find(t => t.id === teamBId) || null) : null,
                placeholderA, placeholderB,
                scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null
            };
        });
        return { ...state, knockoutStage: { ...state.knockoutStage, [round]: updatedMatches } };
    }
    case 'UPDATE_MATCH_SCHEDULE': {
        const { matchId, teamAId, teamBId } = action.payload;
        const newMatches = state.matches.map(m => {
            if (m.id === matchId) {
                return {
                    ...m,
                    teamA: state.teams.find(t => t.id === teamAId) || m.teamA,
                    teamB: state.teams.find(t => t.id === teamBId) || m.teamB,
                    scoreA: null, scoreB: null, status: 'scheduled' as const
                };
            }
            return m;
        });
        const targetGroups = state.groups.map(g => {
             const groupMatches = newMatches.filter(m => m.group === g.name.split(' ')[1]);
             return { ...g, standings: calculateStandings(g.teams, groupMatches) };
        });
        return { ...state, matches: newMatches, groups: targetGroups };
    }
    case 'MANUAL_ADD_GROUP':
      return { ...state, groups: [...state.groups, action.payload] };
    case 'MANUAL_DELETE_GROUP':
      return { ...state, groups: state.groups.filter(g => g.id !== action.payload) };
    case 'MANUAL_ADD_TEAM_TO_GROUP': {
      const team = state.teams.find(t => t.id === action.payload.teamId);
      if (!team) return state;
      return { ...state, groups: state.groups.map(g => g.id === action.payload.groupId ? { ...g, teams: [...g.teams, team], standings: calculateStandings([...g.teams, team], state.matches.filter(m => m.group === g.name.split(' ')[1])) } : g) };
    }
    case 'MANUAL_REMOVE_TEAM_FROM_GROUP':
      return { ...state, groups: state.groups.map(g => g.id === action.payload.groupId ? { ...g, teams: g.teams.filter(t => t.id !== action.payload.teamId), standings: calculateStandings(g.teams.filter(t => t.id !== action.payload.teamId), state.matches.filter(m => m.group === g.name.split(' ')[1])) } : g) };
    case 'IMPORT_LEGACY_JSON':
      return { ...action.payload };
    case 'REQUEST_TEAM_CLAIM': {
        const { teamId, userEmail } = action.payload;
        return { ...state, teams: state.teams.map(t => t.id === teamId ? { ...t, requestedOwnerEmail: userEmail } : t) };
    }
    case 'RESOLVE_TEAM_CLAIM': {
        const { teamId, approved } = action.payload;
        const updatedTeams = state.teams.map(t => {
            if (t.id === teamId) {
                if (approved) return { ...t, ownerEmail: t.requestedOwnerEmail, requestedOwnerEmail: undefined };
                else return { ...t, requestedOwnerEmail: undefined };
            }
            return t;
        });
        const updatedTeam = updatedTeams.find(t => t.id === teamId);
        if (!updatedTeam) return state;
        const updatedGroups = state.groups.map(g => ({
            ...g,
            teams: g.teams.map(t => t.id === teamId ? updatedTeam : t),
            standings: g.standings.map(s => s.team.id === teamId ? { ...s, team: updatedTeam } : s)
        }));
        const updatedMatches = state.matches.map(m => {
            if (m.teamA.id === teamId) return { ...m, teamA: updatedTeam };
            if (m.teamB.id === teamId) return { ...m, teamB: updatedTeam };
            return m;
        });
        return { ...state, teams: updatedTeams, groups: updatedGroups, matches: updatedMatches };
    }
    case 'FINALIZE_SEASON':
        return { ...state, status: 'completed', history: [...state.history, action.payload] };
    case 'SET_STATUS':
        return { ...state, status: action.payload };
    case 'SET_REGISTRATION_STATUS':
        return { ...state, isRegistrationOpen: action.payload };
    case 'UPDATE_HEADER_LOGO':
        return { ...state, headerLogoUrl: action.payload };
    case 'ADD_HISTORY_ENTRY':
        return { ...state, history: [action.payload, ...state.history] };
    case 'DELETE_HISTORY_ENTRY':
        return { ...state, history: state.history.filter(h => h.seasonId !== action.payload) };
    default:
      return state;
  }
};

export const useTournament = (activeMode: TournamentMode, isAdmin: boolean) => {
  const [state, dispatch] = useReducer(tournamentReducer, createInitialState(activeMode));
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    dispatch({ type: 'RESET', payload: createInitialState(activeMode) });
    getTournamentData(activeMode).then(data => {
      if (data) {
        const safeData = { 
            ...data, 
            isRegistrationOpen: data.isRegistrationOpen ?? true, 
            headerLogoUrl: data.headerLogoUrl || '',
            history: data.history || []
        };
        dispatch({ type: 'SET_STATE', payload: safeData });
      }
      setIsLoading(false);
    }).catch(err => {
        console.error("Hook Error Fetching Data:", err);
        setIsLoading(false);
    });
  }, [activeMode]);

  useEffect(() => {
    if (!isLoading) {
       const debounce = setTimeout(() => saveTournamentData(activeMode, state), 2000);
       return () => clearTimeout(debounce);
    }
  }, [state, isLoading, activeMode]);

  const setMode = (mode: TournamentMode) => dispatch({ type: 'SET_MODE', payload: mode });
  const setRoundRobin = (isDouble: boolean) => dispatch({ type: 'SET_ROUND_ROBIN', payload: isDouble });
  const addTeam = (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => dispatch({ type: 'ADD_TEAM', payload: { id, name, logoUrl, manager, socialMediaUrl, whatsappNumber, ownerEmail } });
  const updateTeam = (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, isTopSeed?: boolean, ownerEmail?: string) => dispatch({ type: 'UPDATE_TEAM', payload: { id, name, logoUrl, manager, socialMediaUrl, whatsappNumber, isTopSeed, ownerEmail } });
  const deleteTeam = (id: string) => dispatch({ type: 'DELETE_TEAM', payload: id });
  const updateMatchScore = (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => dispatch({ type: 'UPDATE_MATCH_SCORE', payload: { matchId, scoreA, scoreB, proofUrl } });
  const addMatchComment = (matchId: string, userId: string, userName: string, userEmail: string, text: string, isAdmin: boolean = false) => {
      const comment: MatchComment = { id: `c${Date.now()}`, userId, userName, userEmail, text, timestamp: Date.now(), isAdmin };
      dispatch({ type: 'ADD_MATCH_COMMENT', payload: { matchId, comment } });
  }

  const generateMatchesFromGroups = useCallback(() => {
    const allMatches: Match[] = [];
    state.groups.forEach(group => {
      const teams = [...group.teams];
      if (teams.length < 2) return;
      if (teams.length % 2 !== 0) teams.push({ id: 'BYE', name: 'BYE' });
      const n = teams.length;
      for (let r = 0; r < n - 1; r++) {
        for (let i = 0; i < n / 2; i++) {
          const tA = teams[i];
          const tB = teams[n - 1 - i];
          if (tA.id !== 'BYE' && tB.id !== 'BYE') {
            allMatches.push({ id: `m-${group.id}-${tA.id}-${tB.id}-1`, teamA: tA, teamB: tB, scoreA: null, scoreB: null, status: 'scheduled', group: group.name.split(' ')[1], leg: 1, matchday: r + 1, comments: [] });
            if (state.isDoubleRoundRobin) {
              allMatches.push({ id: `m-${group.id}-${tB.id}-${tA.id}-2`, teamA: tB, teamB: tA, scoreA: null, scoreB: null, status: 'scheduled', group: group.name.split(' ')[1], leg: 2, matchday: r + 1, comments: [] });
            }
          }
        }
        teams.splice(1, 0, teams.pop()!);
      }
    });
    dispatch({ type: 'GENERATE_MATCHES_FROM_GROUPS', payload: { matches: allMatches } });
  }, [state.groups, state.isDoubleRoundRobin]);

  const generateKnockoutBracket = () => {
      if (state.mode === 'two_leagues') {
          const groupA = state.groups[0]; 
          const groupB = state.groups[1]; 
          if (!groupA || !groupB) return { success: false, message: "Groups not found for 2-League format." };
          const standingsA = [...groupA.standings].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
          const standingsB = [...groupB.standings].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
          if (standingsA.length < 2 || standingsB.length < 2) return { success: false, message: "Not enough teams in groups to form Semi-Finals." };
          const a1 = standingsA[0].team;
          const a2 = standingsA[1].team;
          const b1 = standingsB[0].team;
          const b2 = standingsB[1].team;
          const sfMatches: KnockoutMatch[] = [
              { id: 'sf-1', round: 'Semi-finals', matchNumber: 1, teamA: a1, teamB: b2, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'final', placeholderA: 'Winner A1/B2', placeholderB: 'Winner B1/A2' },
              { id: 'sf-2', round: 'Semi-finals', matchNumber: 2, teamA: b1, teamB: a2, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'final', placeholderA: 'Winner A1/B2', placeholderB: 'Winner B1/A2' }
          ];
          const finalMatch: KnockoutMatch = { id: 'final', round: 'Final', matchNumber: 3, teamA: null, teamB: null, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: null, placeholderA: 'Winner SF1', placeholderB: 'Winner SF2' };
          const newKnockoutStage: KnockoutStageRounds = { 'Round of 16': [], 'Quarter-finals': [], 'Semi-finals': sfMatches, 'Final': [finalMatch] };
          dispatch({ type: 'GENERATE_KNOCKOUT_BRACKET', payload: { knockoutStage: newKnockoutStage } });
          return { success: true };
      } else {
           return { success: false, message: "Knockout generation only implemented for Two Leagues mode currently." };
      }
  };

  const finalizeSeason = () => {
    let champion: Team | null = null;
    let runnerUp: Team | undefined;
    if (state.mode === 'league') {
        if (state.groups.length > 0) {
            const allStandings = state.groups.flatMap(g => g.standings).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
            if (allStandings.length > 0) {
                champion = allStandings[0].team;
                if (allStandings.length > 1) runnerUp = allStandings[1].team;
            }
        }
    } else {
        const finalMatch = state.knockoutStage?.['Final']?.[0];
        if (finalMatch && finalMatch.winnerId) {
             champion = state.teams.find(t => t.id === finalMatch.winnerId) || null;
             if (champion && finalMatch.teamA && finalMatch.teamB) {
                 runnerUp = finalMatch.teamA.id === champion.id ? finalMatch.teamB : finalMatch.teamA;
             }
        }
    }
    if (champion) {
        const historyEntry: SeasonHistory = {
            seasonId: `s-${Date.now()}`,
            seasonName: `Season ${state.history.length + 1} (${new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })})`,
            champion: champion,
            runnerUp: runnerUp,
            dateCompleted: Date.now(),
            mode: state.mode 
        };
        dispatch({ type: 'FINALIZE_SEASON', payload: historyEntry });
        return { success: true, message: `Season ended! Champion: ${champion.name}` };
    } else {
        dispatch({ type: 'SET_STATUS', payload: 'completed' });
        return { success: false, message: "Musim berakhir, tapi JUARA tidak terdeteksi." };
    }
  };

  const addHistoryEntry = (entry: SeasonHistory) => dispatch({ type: 'ADD_HISTORY_ENTRY', payload: entry });
  const deleteHistoryEntry = (id: string) => dispatch({ type: 'DELETE_HISTORY_ENTRY', payload: id });

  return { 
      ...state, isLoading, setMode, setRoundRobin, addTeam, updateTeam, deleteTeam, updateMatchScore, addMatchComment, generateMatchesFromGroups, generateKnockoutBracket, finalizeSeason, addHistoryEntry, deleteHistoryEntry,
      startNewSeason: () => dispatch({ type: 'START_NEW_SEASON' }),
      resumeSeason: () => dispatch({ type: 'SET_STATUS', payload: 'active' }),
      resetTournament: () => dispatch({ type: 'RESET', payload: createInitialState(activeMode) }), 
      manualAddGroup: (name: string) => dispatch({ type: 'MANUAL_ADD_GROUP', payload: { id: `g${Date.now()}`, name, teams: [], standings: [] } }), 
      manualDeleteGroup: (id: string) => dispatch({ type: 'MANUAL_DELETE_GROUP', payload: id }), 
      manualAddTeamToGroup: (tId: string, gId: string) => dispatch({ type: 'MANUAL_ADD_TEAM_TO_GROUP', payload: { teamId: tId, groupId: gId } }), 
      manualRemoveTeamFromGroup: (tId: string, gId: string) => dispatch({ type: 'MANUAL_REMOVE_TEAM_FROM_GROUP', payload: { teamId: tId, groupId: gId } }), 
      updateRules: (r: string) => dispatch({ type: 'UPDATE_RULES', payload: r }), 
      updateBanners: (b: string[]) => dispatch({ type: 'UPDATE_BANNERS', payload: b }), 
      updatePartners: (p: Partner[]) => dispatch({ type: 'UPDATE_PARTNERS', payload: p }),
      updateKnockoutMatch: (id: string, match: KnockoutMatch) => dispatch({ type: 'UPDATE_KNOCKOUT_MATCH', payload: match }),
      initializeEmptyKnockoutStage: () => dispatch({ type: 'INITIALIZE_EMPTY_KNOCKOUT' }),
      setTournamentState: (state: FullTournamentState) => dispatch({ type: 'SET_STATE', payload: state }),
      addKnockoutMatch: (round: keyof KnockoutStageRounds, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string) => {
          const match: KnockoutMatch = { id: `km-${Date.now()}`, round, matchNumber: (state.knockoutStage?.[round].length || 0) + 1, teamA: state.teams.find(t => t.id === teamAId) || null, teamB: state.teams.find(t => t.id === teamBId) || null, placeholderA, placeholderB, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: null };
          dispatch({ type: 'ADD_KNOCKOUT_MATCH', payload: { round, match } });
      },
      requestTeamClaim: (teamId: string, userEmail: string) => dispatch({ type: 'REQUEST_TEAM_CLAIM', payload: { teamId, userEmail } }),
      resolveTeamClaim: (teamId: string, approved: boolean) => dispatch({ type: 'RESOLVE_TEAM_CLAIM', payload: { teamId, approved } }),
      setRegistrationStatus: (isOpen: boolean) => dispatch({ type: 'SET_REGISTRATION_STATUS', payload: isOpen }),
      deleteKnockoutMatch: (id: string) => dispatch({ type: 'DELETE_KNOCKOUT_MATCH', payload: id }),
      updateKnockoutMatchDetails: (matchId: string, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string) => dispatch({ type: 'UPDATE_KNOCKOUT_MATCH_DETAILS', payload: { matchId, teamAId, teamBId, placeholderA, placeholderB } }),
      updateMatchSchedule: (matchId: string, teamAId: string, teamBId: string) => dispatch({ type: 'UPDATE_MATCH_SCHEDULE', payload: { matchId, teamAId, teamBId } }),
      updateHeaderLogo: (url: string) => dispatch({ type: 'UPDATE_HEADER_LOGO', payload: url })
  };
};
