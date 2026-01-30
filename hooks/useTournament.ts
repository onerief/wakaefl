
import { useReducer, useCallback, useState, useEffect, useRef } from 'react';
import type { Team, Group, Match, Standing, KnockoutStageRounds, KnockoutMatch, TournamentState as FullTournamentState, Partner, TournamentMode, MatchComment, SeasonHistory } from '../types';
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
});

const calculateStandings = (teams: Team[], matches: Match[], groupId: string, groupName: string): Standing[] => {
  const standings: { [key: string]: Standing } = {};
  
  teams.forEach(team => {
      if (team && team.id) {
        standings[team.id] = { 
            team: { ...team }, 
            played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0, form: [] 
        };
      }
  });

  const groupLetter = groupName.replace('Group ', '').trim();

  matches.forEach(match => {
    const isMatchInGroup = match.group === groupId || match.group === groupLetter || match.group === groupName;
    if (!isMatchInGroup || match.status !== 'finished' || match.scoreA === null || match.scoreB === null) return;
    
    const idA = match.teamA?.id;
    const idB = match.teamB?.id;
    
    if (idA && standings[idA]) {
      const s = standings[idA];
      s.played++;
      s.goalDifference += (match.scoreA! - match.scoreB!);
      if (match.scoreA! > match.scoreB!) { s.wins++; s.points += 3; }
      else if (match.scoreA! === match.scoreB!) { s.draws++; s.points += 1; }
      else { s.losses++; }
    }
    
    if (idB && standings[idB]) {
      const s = standings[idB];
      s.played++;
      s.goalDifference += (match.scoreB! - match.scoreA!);
      if (match.scoreB! > match.scoreA!) { s.wins++; s.points += 3; }
      else if (match.scoreB! === match.scoreA!) { s.draws++; s.points += 1; }
      else { s.losses++; }
    }
  });

  return Object.values(standings).sort((a, b) => (b.points - a.points) || (b.goalDifference - a.goalDifference));
};

const hydrateTournamentData = (state: FullTournamentState): FullTournamentState => {
    if (!state.teams || state.teams.length === 0) return state;

    const teamMap = new Map<string, Team>();
    state.teams.forEach(t => {
        if (t && t.id) teamMap.set(t.id, t);
    });
    
    const getFullTeam = (val: any): Team => {
        const id = (val && typeof val === 'object') ? val.id : val;
        return teamMap.get(id) || { id, name: 'TBD' } as Team;
    };

    const hydratedMatches = (state.matches || []).map(m => ({
        ...m,
        teamA: getFullTeam(m.teamA),
        teamB: getFullTeam(m.teamB)
    }));

    const hydratedGroups = (state.groups || []).map(g => {
        const groupTeams = (g.teams || []).map(t => getFullTeam(t));
        return {
            ...g,
            teams: groupTeams,
            standings: calculateStandings(groupTeams, hydratedMatches, g.id, g.name)
        };
    });

    const hydratedKnockout = state.knockoutStage ? {
        'Play-offs': (state.knockoutStage['Play-offs'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
        'Round of 16': (state.knockoutStage['Round of 16'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
        'Quarter-finals': (state.knockoutStage['Quarter-finals'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
        'Semi-finals': (state.knockoutStage['Semi-finals'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null })),
        'Final': (state.knockoutStage['Final'] || []).map((m: any) => ({ ...m, teamA: m.teamA ? getFullTeam(m.teamA) : null, teamB: m.teamB ? getFullTeam(m.teamB) : null }))
    } : null;

    return {
        ...state,
        groups: hydratedGroups,
        matches: hydratedMatches,
        knockoutStage: hydratedKnockout as any
    };
};

type Action =
  | { type: 'SET_STATE'; payload: FullTournamentState }
  | { type: 'SET_MODE'; payload: TournamentMode }
  | { type: 'ADD_TEAM'; payload: Team }
  | { type: 'UPDATE_TEAM'; payload: Team }
  | { type: 'DELETE_TEAM'; payload: string }
  | { type: 'UNBIND_TEAM'; payload: string }
  | { type: 'RESOLVE_CLAIM'; payload: { teamId: string; approved: boolean } }
  | { type: 'GENERATE_GROUPS'; payload: { groups: Group[], matches: Match[], knockoutStage: KnockoutStageRounds | null } }
  | { type: 'UPDATE_MATCH_SCORE'; payload: { matchId: string; scoreA: number; scoreB: number; proofUrl?: string } }
  | { type: 'UPDATE_MATCH_SCHEDULE'; payload: { matchId: string; teamAId: string; teamBId: string } }
  | { type: 'ADD_MATCH_COMMENT'; payload: { matchId: string; comment: MatchComment } }
  | { type: 'UPDATE_KNOCKOUT_MATCH'; payload: KnockoutMatch }
  | { type: 'RESET'; payload: FullTournamentState }
  | { type: 'START_NEW_SEASON' }
  | { type: 'FINALIZE_SEASON'; payload: SeasonHistory }
  | { type: 'SET_STATUS'; payload: 'active' | 'completed' }
  | { type: 'UPDATE_RULES', payload: string }
  | { type: 'UPDATE_BANNERS', payload: string[] }
  | { type: 'UPDATE_PARTNERS', payload: Partner[] }
  | { type: 'SET_REGISTRATION_STATUS', payload: boolean }
  | { type: 'UPDATE_HEADER_LOGO', payload: string }
  | { type: 'DELETE_HISTORY_ENTRY', payload: string };

const tournamentReducer = (state: FullTournamentState, action: Action): FullTournamentState => {
  let newState: FullTournamentState;
  switch (action.type) {
    case 'SET_STATE': newState = { ...state, ...action.payload }; break;
    case 'SET_MODE': newState = { ...state, mode: action.payload }; break;
    case 'ADD_TEAM': newState = { ...state, teams: [...state.teams, action.payload] }; break;
    case 'UPDATE_TEAM': newState = { ...state, teams: state.teams.map(t => t.id === action.payload.id ? action.payload : t) }; break;
    case 'DELETE_TEAM': newState = { ...state, teams: state.teams.filter(t => t.id !== action.payload) }; break;
    case 'UNBIND_TEAM':
      newState = { 
        ...state, 
        teams: state.teams.map(t => {
          if (t.id === action.payload) {
            const { ownerEmail, requestedOwnerEmail, ...rest } = t;
            return { ...rest } as Team;
          }
          return t;
        }) 
      };
      break;
    case 'RESOLVE_CLAIM': {
        const { teamId, approved } = action.payload;
        newState = {
            ...state,
            teams: state.teams.map(t => {
                if (t.id !== teamId) return t;
                const newTeam = { ...t };
                if (approved && t.requestedOwnerEmail) {
                    newTeam.ownerEmail = t.requestedOwnerEmail;
                }
                delete newTeam.requestedOwnerEmail;
                return newTeam;
            })
        };
        break;
    }
    case 'GENERATE_GROUPS': newState = { ...state, ...action.payload }; break;
    case 'UPDATE_MATCH_SCORE': {
      const updatedMatches = state.matches.map(m => m.id === action.payload.matchId ? { ...m, ...action.payload, status: 'finished' as const } : m);
      newState = { ...state, matches: updatedMatches };
      break;
    }
    case 'UPDATE_MATCH_SCHEDULE': {
      const { matchId, teamAId, teamBId } = action.payload;
      const teamA = state.teams.find(t => t.id === teamAId);
      const teamB = state.teams.find(t => t.id === teamBId);
      if (!teamA || !teamB) return state;
      
      const updatedMatches = state.matches.map(m => m.id === matchId ? { 
          ...m, 
          teamA, 
          teamB,
          scoreA: null,
          scoreB: null,
          status: 'scheduled' as const,
          proofUrl: ''
      } : m);
      newState = { ...state, matches: updatedMatches };
      break;
    }
    case 'ADD_MATCH_COMMENT': {
        const { matchId, comment } = action.payload;
        newState = {
            ...state,
            matches: state.matches.map(m => m.id === matchId ? { ...m, comments: [...(m.comments || []), comment] } : m)
        };
        break;
    }
    case 'UPDATE_KNOCKOUT_MATCH': {
        if (!state.knockoutStage) return state;
        const round = action.payload.round;
        const updatedMatch = action.payload;
        
        const ks = { ...state.knockoutStage };
        ks[round] = ks[round].map(m => m.id === updatedMatch.id ? updatedMatch : m);

        if (updatedMatch.winnerId && updatedMatch.nextMatchId) {
            const winner = state.teams.find(t => t.id === updatedMatch.winnerId);
            if (winner) {
                const nextRoundKeys: (keyof KnockoutStageRounds)[] = ['Play-offs', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];
                const currentRoundIdx = nextRoundKeys.indexOf(round);
                
                for (let i = currentRoundIdx + 1; i < nextRoundKeys.length; i++) {
                    const nextRoundKey = nextRoundKeys[i];
                    let matchFound = false;
                    
                    ks[nextRoundKey] = ks[nextRoundKey].map(nm => {
                        if (nm.id === updatedMatch.nextMatchId) {
                            matchFound = true;
                            const isForSlotA = 
                                nm.placeholderA.toLowerCase().includes(`winner match ${updatedMatch.matchNumber}`) || 
                                nm.placeholderA.toLowerCase().includes(`winner po${updatedMatch.matchNumber}`) || 
                                nm.placeholderA.toLowerCase().includes(`winner qf ${updatedMatch.matchNumber}`) ||
                                nm.placeholderA.toLowerCase().includes(`winner semi-final`);
                            
                            return {
                                ...nm,
                                teamA: isForSlotA ? winner : nm.teamA,
                                teamB: !isForSlotA ? winner : nm.teamB
                            };
                        }
                        return nm;
                    });
                    
                    if (matchFound) break;
                }
            }
        }

        newState = { ...state, knockoutStage: ks };
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
  const [isSyncing, setIsSyncing] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdatingFromServer = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToTournamentData(activeMode, (serverData) => {
        isUpdatingFromServer.current = true;
        dispatch({ type: 'SET_STATE', payload: serverData });
        setTimeout(() => {
            isUpdatingFromServer.current = false;
            setIsLoading(false);
        }, 100);
    });
    return () => unsubscribe();
  }, [activeMode]);

  useEffect(() => {
    if (isAdmin && !isLoading && !isUpdatingFromServer.current) {
       if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
       saveTimeoutRef.current = setTimeout(async () => { 
           setIsSyncing(true); 
           try {
               await saveTournamentData(activeMode, stateRef.current); 
           } catch (e) {
               console.error("Auto-save failed:", e);
           } finally {
               setIsSyncing(false); 
           }
       }, 2000); 
       return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }
  }, [state, isLoading, activeMode, isAdmin]);

  return { 
      ...state, 
      isLoading,
      isSyncing,
      setMode: (m: TournamentMode) => dispatch({ type: 'SET_MODE', payload: m }),
      addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => 
        dispatch({ type: 'ADD_TEAM', payload: { id, name, logoUrl, manager, socialMediaUrl, whatsappNumber, ownerEmail } }),
      updateTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, isTopSeed?: boolean, ownerEmail?: string) => 
        dispatch({ type: 'UPDATE_TEAM', payload: { id, name, logoUrl, manager, socialMediaUrl, whatsappNumber, isTopSeed, ownerEmail } }),
      deleteTeam: (id: string) => dispatch({ type: 'DELETE_TEAM', payload: id }),
      unbindTeam: (id: string) => dispatch({ type: 'UNBIND_TEAM', payload: id }),
      resolveTeamClaim: (teamId: string, approved: boolean) => dispatch({ type: 'RESOLVE_CLAIM', payload: { teamId, approved } }),
      updateMatchScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => 
        dispatch({ type: 'UPDATE_MATCH_SCORE', payload: { matchId, scoreA, scoreB, proofUrl } }),
      updateMatchSchedule: (matchId: string, teamAId: string, teamBId: string) =>
        dispatch({ type: 'UPDATE_MATCH_SCHEDULE', payload: { matchId, teamAId, teamBId } }),
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
              return { success: true, message: 'Musim Berakhir' };
          }
          return { success: false, message: 'Tidak Ada Juara' };
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
          dispatch({ type: 'GENERATE_GROUPS', payload: { groups: newGroups, matches: state.matches, knockoutStage: state.knockoutStage } });
      },
      manualRemoveTeamFromGroup: (tid: string, gid: string) => {
          const newGroups = state.groups.map(g => g.id === gid ? { ...g, teams: g.teams.filter(x => x.id !== tid) } : g);
          dispatch({ type: 'GENERATE_GROUPS', payload: { groups: newGroups, matches: state.matches, knockoutStage: state.knockoutStage } });
      },
      generateMatchesFromGroups: () => {
          const newMatches: Match[] = [];
          state.groups.forEach(g => {
              const groupID = g.id;
              const originalTeams = [...g.teams];
              if (originalTeams.length < 2) return;

              const teamsForScheduling = [...originalTeams];
              if (teamsForScheduling.length % 2 !== 0) {
                  teamsForScheduling.push({ id: 'bye', name: 'BYE' } as Team);
              }

              const numTeams = teamsForScheduling.length;
              const roundsPerLeg = numTeams - 1;
              const matchesPerRound = numTeams / 2;

              for (let round = 0; round < roundsPerLeg; round++) {
                  for (let i = 0; i < matchesPerRound; i++) {
                      const teamA = teamsForScheduling[i];
                      const teamB = teamsForScheduling[numTeams - 1 - i];

                      if (teamA.id !== 'bye' && teamB.id !== 'bye') {
                          newMatches.push({
                              id: `m-${groupID}-${round}-${i}-L1`,
                              teamA: teamA,
                              teamB: teamB,
                              scoreA: null,
                              scoreB: null,
                              status: 'scheduled',
                              group: groupID,
                              leg: 1,
                              matchday: round + 1
                          });
                      }
                  }
                  teamsForScheduling.splice(1, 0, teamsForScheduling.pop()!);
              }

              if (state.isDoubleRoundRobin) {
                  const teamsForLeg2 = [...originalTeams];
                  if (teamsForLeg2.length % 2 !== 0) teamsForLeg2.push({ id: 'bye', name: 'BYE' } as Team);

                  for (let round = 0; round < roundsPerLeg; round++) {
                      for (let i = 0; i < matchesPerRound; i++) {
                          const teamA = teamsForLeg2[i];
                          const teamB = teamsForLeg2[numTeams - 1 - i];

                          if (teamA.id !== 'bye' && teamB.id !== 'bye') {
                              newMatches.push({
                                  id: `m-${groupID}-${round}-${i}-L2`,
                                  teamA: teamB, 
                                  teamB: teamA,
                                  scoreA: null,
                                  scoreB: null,
                                  status: 'scheduled',
                                  group: groupID,
                                  leg: 2,
                                  matchday: round + 1 + roundsPerLeg 
                              });
                          }
                      }
                      teamsForLeg2.splice(1, 0, teamsForLeg2.pop()!);
                  }
              }
          });
          dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups, matches: newMatches, knockoutStage: state.knockoutStage } });
      },
      initializeEmptyKnockoutStage: () => dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups, matches: state.matches, knockoutStage: { 'Play-offs': [], 'Round of 16': [], 'Quarter-finals': [], 'Semi-finals': [], 'Final': [] } } }),
      getGlobalSeeding: () => {
          const rank1Pool: (Standing & { groupName: string })[] = [];
          const rank2Pool: (Standing & { groupName: string })[] = [];

          state.groups.forEach(g => {
              if (g.standings.length >= 1) rank1Pool.push({ ...g.standings[0], groupName: g.name });
              if (g.standings.length >= 2) rank2Pool.push({ ...g.standings[1], groupName: g.name });
          });

          const sortFn = (a: Standing, b: Standing) => (b.points - a.points) || (b.goalDifference - a.goalDifference);
          rank1Pool.sort(sortFn);
          rank2Pool.sort(sortFn);

          return [...rank1Pool, ...rank2Pool];
      },
      generateKnockoutBracket: () => {
          if (state.groups.length === 0) return { success: false, message: 'Tidak ada grup untuk ditarik datanya.' };
          
          const rank1Pool: Standing[] = [];
          const rank2Pool: Standing[] = [];

          state.groups.forEach(g => {
              if (g.standings.length >= 1) rank1Pool.push(g.standings[0]);
              if (g.standings.length >= 2) rank2Pool.push(g.standings[1]);
          });

          const sortFn = (a: Standing, b: Standing) => (b.points - a.points) || (b.goalDifference - a.goalDifference);
          rank1Pool.sort(sortFn);
          rank2Pool.sort(sortFn);

          const seeds = [...rank1Pool, ...rank2Pool].map(s => s.team);
          const totalQualified = seeds.length;

          const knockout: KnockoutStageRounds = { 'Play-offs': [], 'Round of 16': [], 'Quarter-finals': [], 'Semi-finals': [], 'Final': [] };

          if (totalQualified === 10) {
              // LOGIKA SESUAI GAMBAR REFERENSI
              // Play-offs (Round 1)
              knockout['Play-offs'].push({ id: `po-1`, round: 'Play-offs', matchNumber: 1, teamA: seeds[6], teamB: seeds[9], placeholderA: 'Seed 7', placeholderB: 'Seed 10', scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'qf-1' });
              knockout['Play-offs'].push({ id: `po-2`, round: 'Play-offs', matchNumber: 2, teamA: seeds[7], teamB: seeds[8], placeholderA: 'Seed 8', placeholderB: 'Seed 9', scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'qf-4' });

              // Quarter-finals
              knockout['Quarter-finals'].push({ id: `qf-1`, round: 'Quarter-finals', matchNumber: 1, teamA: seeds[1], teamB: null, placeholderA: 'Seed 2 (Mbambet style)', placeholderB: 'Winner Play-off 1', scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'sf-1' });
              knockout['Quarter-finals'].push({ id: `qf-2`, round: 'Quarter-finals', matchNumber: 2, teamA: seeds[2], teamB: seeds[5], placeholderA: 'Seed 3', placeholderB: 'Seed 6', scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'sf-1' });
              knockout['Quarter-finals'].push({ id: `qf-3`, round: 'Quarter-finals', matchNumber: 3, teamA: seeds[3], teamB: seeds[4], placeholderA: 'Seed 4', placeholderB: 'Seed 5', scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'sf-2' });
              knockout['Quarter-finals'].push({ id: `qf-4`, round: 'Quarter-finals', matchNumber: 4, teamA: seeds[0], teamB: null, placeholderA: 'Seed 1 (Waiting)', placeholderB: 'Winner Play-off 2', scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'sf-2' });

              // Semi-finals
              knockout['Semi-finals'].push({ id: `sf-1`, round: 'Semi-finals', matchNumber: 1, teamA: null, teamB: null, placeholderA: 'Winner QF 1', placeholderB: 'Winner QF 2', scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'f-1' });
              knockout['Semi-finals'].push({ id: `sf-2`, round: 'Semi-finals', matchNumber: 2, teamA: null, teamB: null, placeholderA: 'Winner QF 3', placeholderB: 'Winner QF 4', scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: 'f-1' });

              // Final
              knockout['Final'].push({ id: `f-1`, round: 'Final', matchNumber: 1, teamA: null, teamB: null, placeholderA: 'Winner SF 1', placeholderB: 'Winner SF 2', scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: null });

              dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups, matches: state.matches, knockoutStage: knockout } });
              return { success: true, message: 'Bracket 10 Tim Berhasil Dibuat (Sesuai Referensi)!' };
          }

          if (totalQualified === 16) {
              for (let i = 0; i < 8; i++) {
                  knockout['Round of 16'].push({
                      id: `r16-${i+1}`, round: 'Round of 16', matchNumber: i + 1,
                      teamA: seeds[i], teamB: seeds[15 - i], 
                      placeholderA: `Seed ${i + 1}`, placeholderB: `Seed ${16 - i}`,
                      scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: `qf-${Math.floor(i/2) + 1}`
                  });
              }
              for(let i=0; i<4; i++) knockout['Quarter-finals'].push({ id: `qf-${i+1}`, round: 'Quarter-finals', matchNumber: i+1, teamA: null, teamB: null, placeholderA: `Winner R16 M${i*2+1}`, placeholderB: `Winner R16 M${i*2+2}`, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: `sf-${Math.floor(i/2)+1}` });
              for(let i=0; i<2; i++) knockout['Semi-finals'].push({ id: `sf-${i+1}`, round: 'Semi-finals', matchNumber: i+1, teamA: null, teamB: null, placeholderA: `Winner QF M${i*2+1}`, placeholderB: `Winner QF M${i*2+2}`, scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: `f-1` });
              knockout['Final'].push({ id: `f-1`, round: 'Final', matchNumber: 1, teamA: null, teamB: null, placeholderA: 'Winner SF1', placeholderB: 'Winner SF2', scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null, winnerId: null, nextMatchId: null });
              
              dispatch({ type: 'GENERATE_GROUPS', payload: { groups: state.groups, matches: state.matches, knockoutStage: knockout } });
              return { success: true, message: 'Bracket 16 Tim Berhasil Dibuat!' };
          }

          // Fallback simple for other numbers
          return { success: false, message: `Jumlah tim yang lolos (${totalQualified}) tidak didukung otomatis.` };
      },
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
