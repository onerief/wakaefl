
import { useReducer, useCallback, useState, useEffect } from 'react';
import type { Team, Group, Match, Standing, KnockoutStageRounds, KnockoutMatch, TournamentState as FullTournamentState, Partner, TournamentMode, MatchComment } from '../types';
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
});

type Action =
  | { type: 'SET_STATE'; payload: FullTournamentState }
  | { type: 'SET_MODE'; payload: TournamentMode }
  | { type: 'SET_ROUND_ROBIN'; payload: boolean }
  | { type: 'ADD_TEAM'; payload: Team }
  | { type: 'UPDATE_TEAM'; payload: Team }
  | { type: 'DELETE_TEAM'; payload: string }
  | { type: 'GENERATE_GROUPS'; payload: { groups: Group[], matches: Match[], knockoutStage: KnockoutStageRounds | null } }
  | { type: 'UPDATE_MATCH_SCORE'; payload: { matchId: string; scoreA: number; scoreB: number; summary?: string | null, proofUrl?: string } }
  | { type: 'ADD_MATCH_COMMENT'; payload: { matchId: string; comment: MatchComment } }
  | { type: 'GENERATE_MATCHES_FROM_GROUPS', payload: { matches: Match[] } }
  | { type: 'RESET'; payload: FullTournamentState }
  | { type: 'UPDATE_RULES', payload: string }
  | { type: 'UPDATE_BANNERS', payload: string[] }
  | { type: 'UPDATE_PARTNERS', payload: Partner[] }
  | { type: 'UPDATE_KNOCKOUT_MATCH'; payload: KnockoutMatch }
  | { type: 'INITIALIZE_EMPTY_KNOCKOUT' }
  | { type: 'ADD_KNOCKOUT_MATCH'; payload: { round: keyof KnockoutStageRounds, match: KnockoutMatch } }
  | { type: 'DELETE_KNOCKOUT_MATCH'; payload: string }
  | { type: 'UPDATE_KNOCKOUT_MATCH_DETAILS'; payload: { matchId: string; teamAId: string | null; teamBId: string | null; placeholderA: string; placeholderB: string } }
  | { type: 'MANUAL_ADD_GROUP'; payload: Group }
  | { type: 'MANUAL_DELETE_GROUP'; payload: string }
  | { type: 'MANUAL_ADD_TEAM_TO_GROUP'; payload: { teamId: string; groupId: string } }
  | { type: 'MANUAL_REMOVE_TEAM_FROM_GROUP'; payload: { teamId: string; groupId: string } }
  | { type: 'MOVE_TEAM'; payload: { teamId: string, sourceGroupId: string, destGroupId: string } };

const calculateStandings = (teams: Team[], matches: Match[]): Standing[] => {
  const standings: { [key: string]: Standing } = teams.reduce((acc, team) => {
    acc[team.id] = { team, played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 };
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

  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return 0;
  });
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
      // When updating a team, we must also update the team details inside Groups and Matches to keep data consistent
      const updatedTeam = action.payload;
      const updatedTeams = state.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
      
      const updatedGroups = state.groups.map(g => ({
          ...g,
          teams: g.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t),
          // Recalculate standings standings references updated team
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
    case 'INITIALIZE_EMPTY_KNOCKOUT':
      return { ...state, knockoutStage: { 'Round of 16': [], 'Quarter-finals': [], 'Semi-finals': [], 'Final': [] } };
    case 'UPDATE_KNOCKOUT_MATCH': {
      if (!state.knockoutStage) return state;
      const { round } = action.payload;
      const newKnockout = { ...state.knockoutStage, [round]: state.knockoutStage[round].map(m => m.id === action.payload.id ? action.payload : m) };
      return { ...state, knockoutStage: newKnockout };
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
    default:
      return state;
  }
};

export const useTournament = (activeMode: TournamentMode, isAdmin: boolean) => {
  const [state, dispatch] = useReducer(tournamentReducer, createInitialState(activeMode));
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  // Load data when activeMode changes
  useEffect(() => {
    setIsLoading(true);
    // Bersihkan state lama segera agar pengguna tidak bingung melihat data mode sebelumnya
    dispatch({ type: 'RESET', payload: createInitialState(activeMode) });

    getTournamentData(activeMode).then(data => {
      if (data) {
        dispatch({ type: 'SET_STATE', payload: data });
      } else {
        // Biarkan default state jika database kosong
      }
      setIsLoading(false);
    }).catch(err => {
        console.error("Hook Error Fetching Data:", err);
        setIsLoading(false);
    });
  }, [activeMode]);

  // Save data only if the user is an admin and the state has loaded
  // NOTE: In a real app with user comments, you would want comments to write directly to DB 
  // without waiting for admin action. For this proto, we will assume admin controls or open access writes.
  useEffect(() => {
    if (!isLoading) {
       // Save automatically on state change for both Admin and User actions (like comments)
       // Requires Firestore rules to be open or correctly set for "write"
       const debounce = setTimeout(() => saveTournamentData(activeMode, state), 2000);
       return () => clearTimeout(debounce);
    }
  }, [state, isLoading, activeMode]);

  const setMode = (mode: TournamentMode) => dispatch({ type: 'SET_MODE', payload: mode });
  const setRoundRobin = (isDouble: boolean) => dispatch({ type: 'SET_ROUND_ROBIN', payload: isDouble });

  const addTeam = (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => 
    dispatch({ type: 'ADD_TEAM', payload: { id, name, logoUrl, manager, socialMediaUrl, whatsappNumber, ownerEmail } });
  
  const updateTeam = (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, isTopSeed?: boolean, ownerEmail?: string) => 
    dispatch({ type: 'UPDATE_TEAM', payload: { id, name, logoUrl, manager, socialMediaUrl, whatsappNumber, isTopSeed, ownerEmail } });
  
  const deleteTeam = (id: string) => dispatch({ type: 'DELETE_TEAM', payload: id });

  const updateMatchScore = (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => 
    dispatch({ type: 'UPDATE_MATCH_SCORE', payload: { matchId, scoreA, scoreB, proofUrl } });

  const addMatchComment = (matchId: string, userId: string, userName: string, userEmail: string, text: string, isAdmin: boolean = false) => {
      const comment: MatchComment = {
          id: `c${Date.now()}`,
          userId,
          userName,
          userEmail,
          text,
          timestamp: Date.now(),
          isAdmin
      };
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

  return { 
      ...state, 
      isLoading,
      setMode, 
      setRoundRobin, 
      addTeam, 
      updateTeam, 
      deleteTeam, 
      updateMatchScore, 
      addMatchComment,
      generateMatchesFromGroups, 
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
          const match: KnockoutMatch = {
              id: `km-${Date.now()}`,
              round,
              matchNumber: (state.knockoutStage?.[round].length || 0) + 1,
              teamA: state.teams.find(t => t.id === teamAId) || null,
              teamB: state.teams.find(t => t.id === teamBId) || null,
              placeholderA,
              placeholderB,
              scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: null
          };
          dispatch({ type: 'ADD_KNOCKOUT_MATCH', payload: { round, match } });
      }
  };
};
