
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
  userOwnedTeamIds?: string[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, matches = [], groupName = '', onSelectTeam, history = [], userOwnedTeamIds = [] }) => {
  const latestChampionId = history && history.length > 0 ? history[0].champion.id : null;

  return (
    <div className="overflow-hidden rounded-xl border border-brand-accent bg-brand-secondary/90 backdrop-blur-md shadow-2xl w-full flex flex-col">
      <div className="w-full max-h-[65vh] overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left table-fixed border-collapse">
          <thead className="text-[8px] sm:text-[10px] text-brand-light uppercase bg-brand-secondary border-b border-brand-accent sticky top-0 z-20 shadow-md">
            <tr>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[16%] sm:w-[10%] bg-brand-secondary pl-1">#</th>
              <th scope="col" className="py-3 font-black tracking-wider text-left pl-1 w-[34%] sm:w-[30%] bg-brand-secondary">Club</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[10%] sm:w-[7%] bg-brand-secondary">P</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center hidden sm:table-cell w-[15%] bg-brand-secondary">Form</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[10%] sm:w-[8%] bg-brand-secondary">GD</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[10%] sm:w-[10%] bg-brand-secondary">Pts</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[20%] sm:w-[15%] bg-brand-secondary">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-accent/50">
            {standings.map((standing, index) => {
              const isQualifier = index < 2;
              const isTop = index === 0;
              const isMyTeam = userOwnedTeamIds.includes(standing.team.id);
              const isDefendingChamp = standing.team.id === latestChampionId;
              const change = standing.rankChange || 0;

              return (
                <tr 
                  key={standing.team.id} 
                  className={`
                    transition-all duration-300
                    ${index % 2 === 0 ? 'bg-brand-primary/40' : 'bg-transparent'}
                    ${isQualifier ? 'hover:bg-brand-vibrant/10' : 'hover:bg-brand-accent/30'}
                  `}
                >
                  <td className="py-2.5 sm:py-3 text-center relative pl-1">
                    {isQualifier && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4/5 w-0.5 sm:w-1 bg-brand-vibrant rounded-r-full shadow-[0_0_10px_var(--brand-vibrant)]"></div>
                    )}
                    <div className="flex flex-col items-center justify-center -gap-0.5">
                        <span className={`font-black text-[10px] sm:text-sm leading-none ${isQualifier ? 'text-brand-vibrant' : 'text-brand-light/70'}`}>
                            {index + 1}
                        </span>
                        <div className="flex items-center justify-center gap-0.5">
                            {change > 0 && <span className="text-[7px] font-black text-green-500">+{change}</span>}
                            {change < 0 && <span className="text-[7px] font-black text-red-500">{change}</span>}
                            {change === 0 && <Minus size={6} className="text-brand-light/20" />}
                        </div>
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
                            className="w-5 h-5 sm:w-10 sm:h-10 shadow-lg"
                          />
                          {isDefendingChamp && (
                              <div className="absolute -top-1 -right-1 bg-brand-special rounded-full p-0.5 shadow-lg border border-brand-primary z-10">
                                  <Crown size={8} className="text-brand-primary sm:w-2.5 sm:h-2.5 fill-brand-primary" />
                              </div>
                          )}
                      </div>
                      <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] sm:text-sm font-black text-brand-text group-hover:text-brand-vibrant transition-colors leading-none tracking-tight uppercase italic truncate">
                                {standing.team.name || "TBD"}
                            </span>
                            <div className="flex items-center gap-0.5">
                                {isTop && (
                                    <span className="px-1 py-0.5 bg-brand-special text-brand-primary text-[6px] sm:text-[7px] font-black rounded-sm uppercase leading-none">Top</span>
                                )}
                                {isMyTeam && (
                                    <span className="px-1 py-0.5 bg-brand-vibrant text-white text-[6px] sm:text-[7px] font-black rounded-sm uppercase leading-none animate-pulse">Saya</span>
                                )}
                            </div>
                          </div>
                          {standing.team.manager && (
                            <span className="text-[6px] sm:text-[9px] font-bold text-brand-light/70 uppercase truncate text-left mt-0.5">
                                {standing.team.manager}
                            </span>
                          )}
                      </div>
                    </button>
                  </td>
                  <td className="py-2.5 sm:py-3 text-center text-brand-light/90 text-[9px] sm:text-sm font-bold">{standing.played}</td>
                  
                  {/* Form Column */}
                  <td className="py-2.5 sm:py-3 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1">
                          {standing.form.map((result, i) => (
                              <div 
                                  key={i} 
                                  className={`
                                      w-3.5 h-3.5 rounded flex items-center justify-center text-[7px] font-black
                                      ${result === 'W' ? 'bg-green-500 text-white' : 
                                        result === 'D' ? 'bg-gray-500 text-white' : 
                                        'bg-red-500 text-white'}
                                  `}
                                  title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
                              >
                                  {result}
                              </div>
                          ))}
                          {standing.form.length === 0 && <span className="text-brand-light/30 text-[9px] italic">-</span>}
                      </div>
                  </td>

                  <td className="py-2.5 sm:py-3 text-center text-[9px] sm:text-xs">
                    <span className={`font-black ${standing.goalDifference > 0 ? 'text-green-500' : standing.goalDifference < 0 ? 'text-red-500' : 'text-brand-light/50'}`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </span>
                  </td>
                  <td className="py-2.5 sm:py-3 text-center">
                    <div className="inline-flex items-center justify-center min-w-[18px] sm:min-w-[32px] h-5 sm:h-8 bg-brand-vibrant/10 rounded-md sm:rounded-lg border border-brand-vibrant/30 transition-colors">
                        <span className="font-black text-brand-text text-[9px] sm:text-sm px-1 italic">
                            {standing.points}
                        </span>
                    </div>
                  </td>
                  <td className="py-2.5 sm:py-3 text-center">
                    <span className="text-[8px] sm:text-[11px] font-black text-brand-special whitespace-nowrap">
                        Rp {(standing.team.saldo || 0).toLocaleString('id-ID')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-2 sm:p-3 bg-brand-secondary/80 border-t border-brand-accent flex flex-col sm:flex-row items-center justify-between gap-2 relative z-20">
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-brand-vibrant rounded-full shadow-[0_0_8px_var(--brand-vibrant)]"></div>
                  <span className="text-[7px] font-black text-brand-light/80 uppercase">Qualify</span>
              </div>
              <div className="flex items-center gap-1">
                  <Crown size={8} className="text-brand-special" />
                  <span className="text-[7px] font-black text-brand-light/80 uppercase">Def. Champ</span>
              </div>
          </div>
          <div className="flex items-center gap-1.5 bg-brand-primary/50 px-2 py-1 rounded-lg border border-brand-accent/50">
              <Info size={10} className="text-brand-light" />
              <span className="text-[8px] text-brand-light font-bold italic">
                  Klik Nama Tim untuk Info Manager & WhatsApp
              </span>
          </div>
      </div>
    </div>
  );
};
