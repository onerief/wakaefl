
import React, { useMemo } from 'react';
import type { Standing, Team, SeasonHistory, Match } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';
import { Crown, ChevronUp, ChevronDown, Minus, Info } from 'lucide-react';

interface StandingsTableProps {
  standings: Standing[];
  matches?: Match[];
  groupName?: string;
  onSelectTeam: (team: Team) => void;
  history?: SeasonHistory[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, matches = [], groupName = '', onSelectTeam, history = [] }) => {
  const latestChampionId = history && history.length > 0 ? history[0].champion.id : null;

  // --- LOGIC FOR RANK TRENDS (UP/DOWN) ---
  const rankChanges = useMemo(() => {
      // If no matches are played yet, everyone is 'same'
      const finishedMatches = matches.filter(m => m.status === 'finished');
      if (finishedMatches.length === 0) return {};

      // 1. Identify which matches are relevant for THIS group
      const groupLetter = groupName.replace('Group ', '').trim();
      const relevantMatches = finishedMatches.filter(m => 
          m.group === groupName || m.group === groupLetter || (groupName === 'Regular Season' && m.group === 'league-season')
      );

      if (relevantMatches.length === 0) return {};

      // 2. Identify the "Current Matchday" (max matchday played by ANY team in this group)
      // Actually, a better approach for "Rank Change" is to compare against "Standings BEFORE the last completed matchday".
      // But since matchdays can be partial, let's compare:
      // Current Standings (All Finished Matches) vs Previous Standings (Finished Matches - Last Match Per Team)
      
      // Let's create a map of "Last Played Match ID per Team" to exclude them
      const lastMatchIds = new Set<string>();
      
      // We sort relevant matches by date/ID descending to find the last one for each team
      const sortedMatches = [...relevantMatches].sort((a, b) => b.id.localeCompare(a.id)); 
      
      const teamLastMatchMap = new Map<string, string>();
      sortedMatches.forEach(m => {
          if (!teamLastMatchMap.has(m.teamA.id)) teamLastMatchMap.set(m.teamA.id, m.id);
          if (!teamLastMatchMap.has(m.teamB.id)) teamLastMatchMap.set(m.teamB.id, m.id);
      });

      // The "Previous State" excludes the most recent match for EVERY team.
      // This simulates "Where was I before my last game?"
      const previousMatches = relevantMatches.filter(m => {
          // If this match is the LAST match for Team A, exclude it?
          // No, that's too aggressive.
          // Standard approach: Find the MAX Matchday that is fully or partially active.
          // Let's simply exclude matches where matchday == maxMatchday?
          // Or simpler: Exclude matches played today?
          
          // Let's stick to the "Exclude Last Match Per Team" logic for individual trend.
          // But that creates a fragmented table.
          
          // Better Logic: Calculate standings based on (Current Matchday - 1).
          const maxDay = Math.max(...relevantMatches.map(m => m.matchday || 1));
          if (maxDay <= 1) return false; // No history before matchday 1
          return (m.matchday || 1) < maxDay;
      });

      // 3. Helper to calculate ranks for a subset of matches
      const calculateRanks = (subsetMatches: Match[]) => {
          const stats: Record<string, any> = {};
          // Initialize for all teams in current standings
          standings.forEach(s => {
              stats[s.team.id] = { points: 0, gd: 0, played: 0 };
          });

          subsetMatches.forEach(m => {
              if (stats[m.teamA.id] && stats[m.teamB.id]) {
                  const sA = stats[m.teamA.id];
                  const sB = stats[m.teamB.id];
                  sA.played++; sB.played++;
                  sA.gd += (m.scoreA! - m.scoreB!);
                  sB.gd += (m.scoreB! - m.scoreA!);
                  if (m.scoreA! > m.scoreB!) sA.points += 3;
                  else if (m.scoreB! > m.scoreA!) sB.points += 3;
                  else { sA.points += 1; sB.points += 1; }
              }
          });

          // Convert to array and sort
          return Object.keys(stats)
              .map(tId => ({ id: tId, ...stats[tId] }))
              .sort((a, b) => (b.points - a.points) || (b.gd - a.gd))
              .map(t => t.id); // Return array of IDs in order
      };

      const prevRankList = calculateRanks(previousMatches);
      const changes: Record<string, 'up' | 'down' | 'same'> = {};

      standings.forEach((s, currentIndex) => {
          const prevIndex = prevRankList.indexOf(s.team.id);
          if (prevIndex === -1) {
              changes[s.team.id] = 'same'; // New or no history
          } else if (currentIndex < prevIndex) {
              changes[s.team.id] = 'up'; // Lower index = Better rank
          } else if (currentIndex > prevIndex) {
              changes[s.team.id] = 'down';
          } else {
              changes[s.team.id] = 'same';
          }
      });

      return changes;
  }, [standings, matches, groupName]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl w-full flex flex-col">
      <div className="w-full max-h-[65vh] overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left table-fixed border-collapse">
          <thead className="text-[8px] sm:text-[10px] text-brand-light uppercase bg-brand-secondary/95 border-b border-white/10 backdrop-blur-md sticky top-0 z-20 shadow-md">
            <tr>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[16%] sm:w-[10%] bg-brand-secondary/95 pl-1">#</th>
              <th scope="col" className="py-3 font-black tracking-wider text-left pl-1 w-[44%] sm:w-[35%] bg-brand-secondary/95">Club</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[12%] sm:w-[8%] bg-brand-secondary/95">P</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center hidden sm:table-cell w-[24%] bg-brand-secondary/95">Form</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[14%] sm:w-[10%] bg-brand-secondary/95">GD</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[14%] sm:w-[15%] bg-brand-secondary/95">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((standing, index) => {
              const isQualifier = index < 2;
              const isDefendingChamp = standing.team.id === latestChampionId;
              const trend = rankChanges[standing.team.id] || 'same';

              return (
                <tr 
                  key={standing.team.id} 
                  className={`
                    transition-all duration-300
                    ${index % 2 === 0 ? 'bg-white/[0.01]' : 'bg-transparent'}
                    ${isQualifier ? 'hover:bg-brand-vibrant/10' : 'hover:bg-white/5'}
                  `}
                >
                  <td className="py-2.5 sm:py-3 text-center relative pl-1">
                    {isQualifier && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4/5 w-0.5 sm:w-1 bg-brand-vibrant rounded-r-full shadow-[0_0_10px_#2563eb]"></div>
                    )}
                    <div className="flex items-center justify-center gap-1">
                        <div className="w-3 flex justify-center">
                            {trend === 'up' && <ChevronUp size={10} className="text-green-500 animate-bounce" />}
                            {trend === 'down' && <ChevronDown size={10} className="text-red-500" />}
                            {trend === 'same' && <Minus size={8} className="text-brand-light/20" />}
                        </div>
                        <span className={`font-black text-[10px] sm:text-sm ${isQualifier ? 'text-brand-vibrant' : 'text-brand-light/50'}`}>
                            {index + 1}
                        </span>
                    </div>
                  </td>
                  <td className="py-2.5 sm:py-3 pl-1 font-medium text-brand-text">
                    <button 
                        onClick={() => onSelectTeam(standing.team)} 
                        className="flex items-center gap-1.5 sm:gap-2.5 text-left group w-full overflow-hidden transition-transform active:scale-95"
                    >
                      <div className="relative shrink-0">
                          <TeamLogo 
                            logoUrl={standing.team.logoUrl} 
                            teamName={standing.team.name} 
                            className="w-6 h-6 sm:w-10 sm:h-10 shadow-lg"
                          />
                          {isDefendingChamp && (
                              <div className="absolute -top-1 -right-1 bg-brand-special rounded-full p-0.5 shadow-lg border border-brand-primary z-10">
                                  <Crown size={8} className="text-brand-primary sm:w-2.5 sm:h-2.5 fill-brand-primary" />
                              </div>
                          )}
                      </div>
                      <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] sm:text-sm font-black text-white group-hover:text-brand-vibrant transition-colors leading-none tracking-tight uppercase italic truncate">
                                {standing.team.name || "TBD"}
                            </span>
                          </div>
                      </div>
                    </button>
                  </td>
                  <td className="py-2.5 sm:py-3 text-center text-brand-light/70 text-[10px] sm:text-sm font-bold">{standing.played}</td>
                  
                  {/* Form Column */}
                  <td className="py-2.5 sm:py-3 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1">
                          {standing.form.map((result, i) => (
                              <div 
                                  key={i} 
                                  className={`
                                      w-4 h-4 rounded flex items-center justify-center text-[8px] font-black
                                      ${result === 'W' ? 'bg-green-500 text-white' : 
                                        result === 'D' ? 'bg-gray-500 text-white' : 
                                        'bg-red-500 text-white'}
                                  `}
                                  title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
                              >
                                  {result}
                              </div>
                          ))}
                          {standing.form.length === 0 && <span className="text-brand-light/20 text-[9px] italic">-</span>}
                      </div>
                  </td>

                  <td className="py-2.5 sm:py-3 text-center text-[10px] sm:text-xs">
                    <span className={`font-black ${standing.goalDifference > 0 ? 'text-green-400' : standing.goalDifference < 0 ? 'text-red-400' : 'text-brand-light/30'}`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </span>
                  </td>
                  <td className="py-2.5 sm:py-3 text-center">
                    <div className="inline-flex items-center justify-center min-w-[20px] sm:min-w-[32px] h-5 sm:h-8 bg-brand-vibrant/20 rounded-md sm:rounded-lg border border-brand-vibrant/30 transition-colors">
                        <span className="font-black text-white text-[10px] sm:text-sm px-1 italic">
                            {standing.points}
                        </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-2 sm:p-3 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-20">
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-brand-vibrant rounded-full shadow-[0_0_8px_#2563eb]"></div>
                  <span className="text-[7px] font-black text-brand-light/60 uppercase">Qualify</span>
              </div>
              <div className="flex items-center gap-1">
                  <Crown size={8} className="text-brand-special" />
                  <span className="text-[7px] font-black text-brand-light/60 uppercase">Def. Champ</span>
              </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
              <Info size={10} className="text-brand-light" />
              <span className="text-[8px] text-brand-light font-bold italic">
                  Klik Nama Tim untuk Info Manager & WhatsApp
              </span>
          </div>
      </div>
    </div>
  );
};
