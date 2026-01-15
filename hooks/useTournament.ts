
import { useReducer, useCallback, useState, useEffect, useRef } from 'react';
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
  rules: '',
  banners: [],
  partners: [],
  mode: mode,
  isDoubleRoundRobin: true,
  status: 'active',
  history: [],
  isRegistrationOpen: true, 
  headerLogoUrl: '', 
});

/**
 * SOURCE OF TRUTH FIX:
 * Memastikan setiap referensi tim di manapun (Grup, Klasemen, Jadwal) 
 * selalu mengambil data terbaru (Nama & Logo) dari master state.teams.
 */
const hydrateTournamentData = (state: FullTournamentState): FullTournamentState => {
    const teamMap = new Map(state.teams.map(t => [t.id, t]));
    
    const getLatestTeam = (team: Team | null | undefined): Team | null => {
        if (!team || !team.id) return null;
        const master = teamMap.get(team.id);
        return master ? { ...master } : { ...team };
    };

    return {
        ...state,
        groups: (state.groups || []).map(g => ({
            ...g,
            teams: (g.teams || []).map(t => getLatestTeam(t) || t),
            standings: (g.standings || []).map(s => ({
                ...s,
                team: getLatestTeam(s.team) || s.team
            }))
        })),
        matches: (state.matches || []).map(m => ({
            ...m,
            teamA: getLatestTeam(m.teamA) || m.teamA,
            teamB: getLatestTeam(m.teamB) || m.teamB
        })),
        knockoutStage: state.knockoutStage ? {
            'Round of 16': (state.knockoutStage['Round of 16'] || []).map(m => ({ ...m, teamA: getLatestTeam(m.teamA), teamB: getLatestTeam(m.teamB) })),
            'Quarter-finals': (state.knockoutStage['Quarter-finals'] || []).map(m => ({ ...m, teamA: getLatestTeam(m.teamA), teamB: getLatestTeam(m.teamB) })),
            'Semi-finals': (state.knockoutStage['Semi-finals'] || []).map(m => ({ ...m, teamA: getLatestTeam(m.teamA), teamB: getLatestTeam(m.teamB) })),
            'Final': (state.knockoutStage['Final'] || []).map(m => ({ ...m, teamA: getLatestTeam(m.teamA), teamB: getLatestTeam(m.teamB) }))
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
  | { type: 'UPDATE_MATCH_SCORE'; payload: { matchId: string; scoreA: number; scoreB: number; proofUrl?: string } }
  | { type: 'ADD_MATCH_COMMENT'; payload: { matchId: string; comment: MatchComment } }
  | { type: 'UPDATE_KNOCKOUT_MATCH'; payload: KnockoutMatch }
  | { type: 'RESET'; payload: FullTournamentState }
  | { type: 'START_NEW_SEASON' }
  | { type: 'FINALIZE_SEASON'; payload: SeasonHistory }
  | { type: 'SET_STATUS'; payload: 'active' | 'completed' }
  | { type: 'UPDATE_RULES', payload: string }
  | { type: 'UPDATE_BANNERS', payload: string[] }
  | { type: 'UPDATE_PARTNERS', payload: Partner[] }
  | { type: 'SET_REGISTRATION_STATUS'; payload: boolean }
  | { type: 'UPDATE_HEADER_LOGO'; payload: string }
  | { type: 'DELETE_HISTORY_ENTRY'; payload: string };

const calculateStandings = (teams: Team[], matches: Match[], groupId: string, groupName: string): Standing[] => {
  const standings: { [key: string]: Standing } = teams.reduce((acc, team) => {
    acc[team.id] = { team, played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0, form: [] };
    return acc;
  }, {} as { [key: string]: Standing });

  const groupLetter = groupName.replace('Group ', '').trim();

  matches.forEach(match => {
    // Filter match milik grup ini
    const isMatchInGroup = match.group === groupId || match.group === groupLetter || match.group === groupName;
    if (!isMatchInGroup || match.status !== 'finished' || match.scoreA === null || match.scoreB === null) return;
    
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

  return Object.values(standings).sort((a, b) => (b.points - a.points) || (b.goalDifference - a.goalDifference));
};

const tournamentReducer = (state: FullTournamentState, action: Action): FullTournamentState => {
  let newState: FullTournamentState;

  switch (action.type) {
    case 'SET_STATE':
      newState = { ...state, ...action.payload };
      break;
    case 'SET_MODE':
      newState = { ...state, mode: action.payload };
      break;
    case 'ADD_TEAM':
      newState = { ...state, teams: [...state.teams, action.payload] };
      break;
    case 'UPDATE_TEAM':
      newState = { ...state, teams: state.teams.map(t => t.id === action.payload.id ? action.payload : t) };
      break;
    case 'DELETE_TEAM':
      newState = { ...state, teams: state.teams.filter(t => t.id !== action.payload) };
      break;
    case 'GENERATE_GROUPS':
      newState = { ...state, ...action.payload };
      break;
    case 'UPDATE_MATCH_SCORE': {
      const updatedMatches = state.matches.map(m => m.id === action.payload.matchId ? { ...m, ...action.payload, status: 'finished' as const } : m);
      newState = { 
          ...state, 
          matches: updatedMatches, 
          groups: state.groups.map(g => ({ 
              ...g, 
              standings: calculateStandings(g.teams, updatedMatches, g.id, g.name) 
          })) 
      };
      break;
    }
    case 'ADD_MATCH_COMMENT': {
        const { matchId, comment } = action.payload;
        newState = {
            ...state,
            matches: state.matches.map(m => m.id === matchId ? { ...m, comments: [...(m.comments || []), comment] } : m),
            knockoutStage: state.knockoutStage ? {
                ...state.knockoutStage,
                'Round of 16': state.knockoutStage['Round of 16'].map(km => km.id === matchId ? { ...km, comments: [...(km.comments || []), comment] } : km),
                'Quarter-finals': state.knockoutStage['Quarter-finals'].map(km => km.id === matchId ? { ...km, comments: [...(km.comments || []), comment] } : km),
                'Semi-finals': state.knockoutStage['Semi-finals'].map(km => km.id === matchId ? { ...km, comments: [...(km.comments || []), comment] } : km),
                'Final': state.knockoutStage['Final'].map(km => km.id === matchId ? { ...km, comments: [...(km.comments || []), comment] } : km),
            } : state.knockoutStage
        };
        break;
    }
    case 'UPDATE_KNOCKOUT_MATCH': {
        if (!state.knockoutStage) return state;
        const round = action.payload.round;
        newState = { ...state, knockoutStage: { ...state.knockoutStage, [round]: state.knockoutStage[round].map(m => m.id === action.payload.id ? action.payload : m) } };
        break;
    }
    case 'UPDATE_RULES': newState = { ...state, rules: action.payload }; break;
    case 'UPDATE_BANNERS': newState = { ...state, banners: action.payload }; break;
    case 'UPDATE_PARTNERS': newState = { ...state, partners: action.payload }; break;
    case 'RESET': newState = action.payload; break;
    case 'START_NEW_SEASON': newState = { ...createInitialState(state.mode), history: state.history, partners: state.partners, banners: state.banners, rules: state.rules, headerLogoUrl: state.headerLogoUrl }; break;
    case 'FINALIZE_SEASON': newState = { ...state, status: 'completed', history: [action.payload, ...state.history] }; break;
    case 'SET_STATUS': newState = { ...state, status: action.payload }; break;
    case 'SET_REGISTRATION_STATUS': newState = { ...state, isRegistrationOpen: action.payload }; break;
    case 'UPDATE_HEADER_LOGO': newState = { ...state, headerLogoUrl: action.payload }; break;
    case 'DELETE_HISTORY_ENTRY': newState = { ...state, history: state.history.filter(h => h.seasonId !== action.payload) }; break;
    default: return state;
  }

  return hydrateTournamentData(newState);
};

export const useTournament = (activeMode: TournamentMode, isAdmin: boolean) => {
  const [state, dispatch] = useReducer(tournamentReducer, createInitialState(activeMode));
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getTournamentData(activeMode).then(data => {
      if (data) dispatch({ type: 'SET_STATE', payload: data });
      setIsLoading(false);
    });
  }, [activeMode]);

  useEffect(() => {
    if (!isLoading) {
       if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
       saveTimeoutRef.current = setTimeout(() => { saveTournamentData(activeMode, state); }, 2000);
       return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }
  }, [state, isLoading, activeMode]);

  return { 
      ...state, 
      isLoading,
      setMode: (m: TournamentMode) => dispatch({ type: 'SET_MODE', payload: m }),
      addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => 
        dispatch({ type: 'ADD_TEAM', payload: { id, name, logoUrl, manager, socialMediaUrl, whatsappNumber, ownerEmail } }),
      updateTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, isTopSeed?: boolean, ownerEmail?: string) => 
        dispatch({ type: 'UPDATE_TEAM', payload: { id, name, logoUrl, manager, socialMediaUrl, whatsappNumber, isTopSeed, ownerEmail } }),
      deleteTeam: (id: string) => dispatch({ type: 'DELETE_TEAM', payload: id }),
      updateMatchScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => 
        dispatch({ type: 'UPDATE_MATCH_SCORE', payload: { matchId, scoreA, scoreB, proofUrl } }),
      addMatchComment: (matchId: string, userId: string, userName: string, userEmail: string, text: string, isAdmin: boolean = false) =>
        dispatch({ type: 'ADD_MATCH_COMMENT', payload: { matchId, comment: { id: `c${Date.now()}`, userId, userName, userEmail, text, timestamp: Date.now(), isAdmin } } }),
      updateKnockoutMatch: (id: string, m: KnockoutMatch) => dispatch({ type: 'UPDATE_KNOCKOUT_MATCH', payload: m }),
      generateSummary,
      setTournamentState: (s: FullTournamentState) => dispatch({ type: 'SET_STATE', payload: s }),
      resetTournament: () => dispatch({ type: 'RESET', payload: createInitialState(activeMode) }),
      updateRules: (r: string) => dispatch({ type: 'UPDATE_RULES', payload: r }),
      updateBanners: (b: string[]) => dispatch({ type: 'UPDATE_BANNERS', payload: b }),
      updatePartners: (p: Partner[]) => dispatch({ type: 'UPDATE_PARTNERS', payload: p }),
      setRegistrationStatus: (o: boolean) => dispatch({ type: 'SET_REGISTRATION_STATUS', payload: o }),
      updateHeaderLogo: (u: string) => dispatch({ type: 'UPDATE_HEADER_LOGO', payload: u }),
      finalizeSeason: () => {
          const champ = state.teams[0];
          if (champ) {
              const entry: SeasonHistory = { seasonId: `s-${Date.now()}`, seasonName: `Season ${state.history.length+1}`, champion: champ, dateCompleted: Date.now(), mode: state.mode };
              dispatch({ type: 'FINALIZE_SEASON', payload: entry });
              return { success: true, message: 'Season Ended' };
          }
          return { success: false, message: 'No Champion' };
      },
      resumeSeason: () => dispatch({ type: 'SET_STATUS', payload: 'active' }),
      startNewSeason: () => dispatch({ type: 'START_NEW_SEASON' }),
      addHistoryEntry: (e: SeasonHistory) => dispatch({ type: 'FINALIZE_SEASON', payload: e }),
      deleteHistoryEntry: (id: string) => dispatch({ type: 'DELETE_HISTORY_ENTRY', payload: id }),
      manualAddGroup: (n: string) => dispatch({ type: 'GENERATE_GROUPS', payload: { groups: [...state.groups, { id: `g${Date.now()}`, name: n, teams: [], standings: [] }], matches: state.matches, knockoutStage: state.knockoutStage } }),
      manualDeleteGroup: (id: string) => dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups.filter(g => g.id !== id), matches: state.matches, knockoutStage: state.knockoutStage } }),
      manualAddTeamToGroup: (tid: string, gid: string) => {
          const t = state.teams.find(x => x.id === tid);
          if (!t) return;
          const newGroups = state.groups.map(g => g.id === gid ? { ...g, teams: [...g.teams, t] } : g);
          dispatch({ type: 'GENERATE_GROUPS', payload: { 
              groups: newGroups.map(g => ({ ...g, standings: calculateStandings(g.teams, state.matches, g.id, g.name) })), 
              matches: state.matches, 
              knockoutStage: state.knockoutStage 
          }});
      },
      manualRemoveTeamFromGroup: (tid: string, gid: string) => {
          const newGroups = state.groups.map(g => g.id === gid ? { ...g, teams: g.teams.filter(x => x.id !== tid) } : g);
          dispatch({ type: 'GENERATE_GROUPS', payload: { 
              groups: newGroups.map(g => ({ ...g, standings: calculateStandings(g.teams, state.matches, g.id, g.name) })), 
              matches: state.matches, 
              knockoutStage: state.knockoutStage 
          }});
      },
      generateMatchesFromGroups: () => {
          const newMatches: Match[] = [];
          state.groups.forEach(g => {
              const groupID = g.id;
              const groupLetter = g.name.replace('Group ', '').trim();
              for (let i = 0; i < g.teams.length; i++) {
                  for (let j = i+1; j < g.teams.length; j++) {
                      newMatches.push({
                          id: `m-${g.id}-${i}-${j}-1`, teamA: g.teams[i], teamB: g.teams[j], scoreA: null, scoreB: null, status: 'scheduled', group: groupID, leg: 1, matchday: 1
                      });
                      if (state.isDoubleRoundRobin) {
                          newMatches.push({
                              id: `m-${g.id}-${i}-${j}-2`, teamA: g.teams[j], teamB: g.teams[i], scoreA: null, scoreB: null, status: 'scheduled', group: groupID, leg: 2, matchday: 1
                          });
                      }
                  }
              }
          });
          dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups, matches: newMatches, knockoutStage: state.knockoutStage } });
      },
      generateKnockoutBracket: () => ({ success: true }),
      initializeEmptyKnockoutStage: () => dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups, matches: state.matches, knockoutStage: { 'Round of 16': [], 'Quarter-finals': [], 'Semi-finals': [], 'Final': [] } } }),
      addKnockoutMatch: (r: keyof KnockoutStageRounds, tA: string | null, tB: string | null, pA: string, pB: string, num: number) => {
          const m: KnockoutMatch = { 
              id: `km-${Date.now()}`, round: r, matchNumber: num, 
              teamA: state.teams.find(x => x.id === tA) || null, teamB: state.teams.find(x => x.id === tB) || null, 
              placeholderA: pA, placeholderB: pB, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: null
          };
          if (state.knockoutStage) {
              const ks = { ...state.knockoutStage, [r]: [...state.knockoutStage[r], m] };
              dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups, matches: state.matches, knockoutStage: ks } });
          }
      }
  };
};
