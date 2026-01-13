
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
  isRegistrationOpen: true, // Default open for new setup
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
  | { type: 'SET_REGISTRATION_STATUS'; payload: boolean };

const calculateStandings = (teams: Team[], matches: Match[]): Standing[] => {
  const standings: { [key: string]: Standing } = teams.reduce((acc, team) => {
    acc[team.id] = { team, played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0, form: [] };
    return acc;
  }, {} as { [key: string]: Standing });

  // Process Stats
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
  
  // Calculate Form (Last 5 matches based on ID or matchday)
  // Sort matches to ensure order (using ID as simplistic timestamp if dates absent)
  const sortedMatches = [...matches].sort((a, b) => a.id.localeCompare(b.id));

  teams.forEach(team => {
      if (!standings[team.id]) return;
      
      const teamMatches = sortedMatches.filter(m => 
          m.status === 'finished' && 
          (m.teamA.id === team.id || m.teamB.id === team.id)
      );

      // Take last 5
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
            history: state.history, // PRESERVE HISTORY
            partners: state.partners, // PRESERVE PARTNERS
            banners: state.banners, // PRESERVE BANNERS
            rules: state.rules, // PRESERVE RULES
            status: 'active'
        };
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
    case 'IMPORT_LEGACY_JSON':
      return { ...action.payload };
    case 'REQUEST_TEAM_CLAIM': {
        const { teamId, userEmail } = action.payload;
        const updatedTeams = state.teams.map(t => 
            t.id === teamId ? { ...t, requestedOwnerEmail: userEmail } : t
        );
        return { ...state, teams: updatedTeams };
    }
    case 'RESOLVE_TEAM_CLAIM': {
        const { teamId, approved } = action.payload;
        const updatedTeams = state.teams.map(t => {
            if (t.id === teamId) {
                if (approved) {
                    return { ...t, ownerEmail: t.requestedOwnerEmail, requestedOwnerEmail: undefined };
                } else {
                    return { ...t, requestedOwnerEmail: undefined };
                }
            }
            return t;
        });
        
        // Also update groups and matches where this team exists
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
        return {
            ...state,
            status: 'completed',
            history: [...state.history, action.payload]
        };
    case 'SET_STATUS':
        return { ...state, status: action.payload };
    case 'SET_REGISTRATION_STATUS':
        return { ...state, isRegistrationOpen: action.payload };
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
    dispatch({ type: 'RESET', payload: createInitialState(activeMode) });

    getTournamentData(activeMode).then(data => {
      if (data) {
        // Ensure legacy data gets the flag if missing
        const safeData = { ...data, isRegistrationOpen: data.isRegistrationOpen ?? true };
        dispatch({ type: 'SET_STATE', payload: safeData });
      } else {
        // Default state
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

  const generateKnockoutBracket = () => {
      if (state.mode === 'two_leagues') {
          const groupA = state.groups[0]; 
          const groupB = state.groups[1]; 

          if (!groupA || !groupB) {
              return { success: false, message: "Groups not found for 2-League format." };
          }

          const standingsA = [...groupA.standings].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
          const standingsB = [...groupB.standings].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);

          if (standingsA.length < 2 || standingsB.length < 2) {
              return { success: false, message: "Not enough teams in groups to form Semi-Finals." };
          }

          const a1 = standingsA[0].team;
          const a2 = standingsA[1].team;
          const b1 = standingsB[0].team;
          const b2 = standingsB[1].team;

          const sfMatches: KnockoutMatch[] = [
              {
                  id: 'sf-1', round: 'Semi-finals', matchNumber: 1,
                  teamA: a1, teamB: b2,
                  scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null,
                  winnerId: null, nextMatchId: 'final', placeholderA: 'Winner A1/B2', placeholderB: 'Winner B1/A2'
              },
              {
                  id: 'sf-2', round: 'Semi-finals', matchNumber: 2,
                  teamA: b1, teamB: a2,
                  scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null,
                  winnerId: null, nextMatchId: 'final', placeholderA: 'Winner A1/B2', placeholderB: 'Winner B1/A2'
              }
          ];

          const finalMatch: KnockoutMatch = {
              id: 'final', round: 'Final', matchNumber: 3,
              teamA: null, teamB: null, 
              scoreA1: null, scoreB1: null, scoreA2: null, scoreB2: null,
              winnerId: null, nextMatchId: null,
              placeholderA: 'Winner SF1', placeholderB: 'Winner SF2'
          };

          const newKnockoutStage: KnockoutStageRounds = {
              'Round of 16': [],
              'Quarter-finals': [],
              'Semi-finals': sfMatches,
              'Final': [finalMatch]
          };

          dispatch({ type: 'GENERATE_KNOCKOUT_BRACKET', payload: { knockoutStage: newKnockoutStage } });
          return { success: true };

      } else {
           return { success: false, message: "Knockout generation only implemented for Two Leagues mode currently." };
      }
  };

  const finalizeSeason = () => {
    let champion: Team | null = null;
    let runnerUp: Team | undefined;

    // Determine champion based on mode
    if (state.mode === 'league') {
        // League mode: Top of the single group standings
        if (state.groups.length > 0) {
            // Assume single group for league mode usually, or flatten standings
            const allStandings = state.groups.flatMap(g => g.standings)
                .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
            if (allStandings.length > 0) {
                champion = allStandings[0].team;
                if (allStandings.length > 1) runnerUp = allStandings[1].team;
            }
        }
    } else {
        // WAKACL or Two Leagues: Winner of Final Knockout Match
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
            dateCompleted: Date.now()
        };
        dispatch({ type: 'FINALIZE_SEASON', payload: historyEntry });
        return { success: true, message: `Season ended! Champion: ${champion.name}` };
    } else {
        // If no champion found (e.g. forgot to set final score), prompt user
        dispatch({ type: 'SET_STATUS', payload: 'completed' });
        return { success: false, message: "Season ended, but NO champion was detected. Did you set the Final Match winner?" };
    }
  };

  const importLegacyData = useCallback((jsonData: any) => {
      try {
          const newTeams: Team[] = [];
          const nerakaTeams: Team[] = [];
          const surgaTeams: Team[] = [];
          const groupMatches: Match[] = [];
          const knockoutStage: KnockoutStageRounds = {
              'Round of 16': [],
              'Quarter-finals': [],
              'Semi-finals': [],
              'Final': []
          };

          jsonData.teams.forEach((t: any, index: number) => {
              const team: Team = {
                  id: `t-${index}-${t.name.replace(/\s+/g, '').toLowerCase()}`,
                  name: t.name,
                  logoUrl: t.logoUrl,
                  manager: t.player,
                  socialMediaUrl: t.socialMedia,
                  whatsappNumber: t.whatsapp,
                  ownerEmail: ''
              };
              newTeams.push(team);
              if (t.league === "Neraka") nerakaTeams.push(team);
              if (t.league === "Surga") surgaTeams.push(team);
          });

          const groups: Group[] = [
              { id: 'g-neraka', name: 'Grup Neraka', teams: nerakaTeams, standings: [] },
              { id: 'g-surga', name: 'Grup Surga', teams: surgaTeams, standings: [] }
          ];

          jsonData.schedule.forEach((s: any, index: number) => {
              const teamA = newTeams.find(t => t.name === s.home);
              const teamB = newTeams.find(t => t.name === s.away);

              if (teamA && teamB) {
                  if (s.stage === 'Regular') {
                      const groupName = nerakaTeams.find(t => t.id === teamA.id) ? 'Neraka' : 'Surga';
                      const match: Match = {
                          id: `m-${index}`,
                          teamA,
                          teamB,
                          scoreA: s.homeScore,
                          scoreB: s.awayScore,
                          status: s.status === 'Finished' ? 'finished' : 'scheduled',
                          group: groupName,
                          matchday: s.babak,
                          proofUrl: s.proofLink,
                          comments: []
                      };
                      groupMatches.push(match);
                  } else if (s.stage === 'Semi-Final') {
                      const existingMatchIndex = knockoutStage['Semi-finals'].findIndex(m => 
                        (m.teamA?.id === teamA.id && m.teamB?.id === teamB.id) || 
                        (m.teamA?.id === teamB.id && m.teamB?.id === teamA.id)
                      );

                      if (existingMatchIndex === -1) {
                          knockoutStage['Semi-finals'].push({
                              id: `sf-${index}`,
                              round: 'Semi-finals',
                              matchNumber: knockoutStage['Semi-finals'].length + 1,
                              teamA: teamA,
                              teamB: teamB,
                              scoreA1: s.homeScore,
                              scoreB1: s.awayScore,
                              scoreA2: null, scoreB2: null,
                              winnerId: null, nextMatchId: null, placeholderA: '', placeholderB: ''
                          });
                      } else {
                          const m = knockoutStage['Semi-finals'][existingMatchIndex];
                          if (m.teamA?.id === teamB.id) { 
                              m.scoreB2 = s.homeScore;
                              m.scoreA2 = s.awayScore; 
                          }
                      }
                  } else if (s.stage === 'Final') {
                      knockoutStage['Final'].push({
                          id: `final-${index}`,
                          round: 'Final',
                          matchNumber: 1,
                          teamA, teamB,
                          scoreA1: s.homeScore, scoreB1: s.awayScore,
                          scoreA2: null, scoreB2: null,
                          winnerId: null, nextMatchId: null, placeholderA: '', placeholderB: ''
                      });
                  }
              }
          });

          groups.forEach(g => {
              g.standings = calculateStandings(g.teams, groupMatches.filter(m => m.group === g.name.split(' ')[1]));
          });

          const importedState: FullTournamentState = {
              teams: newTeams,
              groups: groups,
              matches: groupMatches,
              knockoutStage: knockoutStage,
              rules: jsonData.rules || state.rules,
              banners: [jsonData.promoBannerUrl, jsonData.giftBannerUrl].filter(Boolean),
              partners: jsonData.sponsors || [],
              mode: 'two_leagues',
              isDoubleRoundRobin: true,
              status: 'active',
              history: [],
              isRegistrationOpen: true
          };

          dispatch({ type: 'IMPORT_LEGACY_JSON', payload: importedState });
          addToast('Legacy data imported successfully!', 'success');

      } catch (e) {
          console.error("Import failed", e);
          addToast('Failed to import legacy data. Check console.', 'error');
      }
  }, [state.rules, addToast]);

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
      generateKnockoutBracket,
      importLegacyData,
      finalizeSeason,
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
      },
      requestTeamClaim: (teamId: string, userEmail: string) => dispatch({ type: 'REQUEST_TEAM_CLAIM', payload: { teamId, userEmail } }),
      resolveTeamClaim: (teamId: string, approved: boolean) => dispatch({ type: 'RESOLVE_TEAM_CLAIM', payload: { teamId, approved } }),
      setRegistrationStatus: (isOpen: boolean) => dispatch({ type: 'SET_REGISTRATION_STATUS', payload: isOpen })
  };
};
