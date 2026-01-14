
import React from 'react';
import type { Standing, Team } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';

interface StandingsTableProps {
  standings: Standing[];
  onSelectTeam: (team: Team) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, onSelectTeam }) => {
  const headers = ['Pos', 'Club', 'P', 'W', 'D', 'L', 'GD', 'Pts', 'Form'];

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-brand-secondary/20 backdrop-blur-sm custom-scrollbar">
      <div className="min-w-[320px] w-full">
        <table className="w-full text-sm text-left text-brand-light">
          <thead className="text-[9px] sm:text-xs text-brand-text/70 uppercase bg-black/30 border-b border-white/5">
            <tr>
              {headers.map((header) => {
                let classes = "py-2 sm:py-3 font-black tracking-wider whitespace-nowrap ";
                
                if (header === 'Pos') classes += "w-8 text-center px-1";
                else if (header === 'Club') classes += "text-left px-2"; 
                else if (['W', 'D', 'L'].includes(header)) classes += "hidden md:table-cell text-center w-8 sm:w-10 px-1";
                else if (header === 'Form') classes += "hidden sm:table-cell text-center w-24 px-1";
                else classes += "text-center w-8 sm:w-10 px-1"; // P, GD, Pts

                return (
                  <th key={header} scope="col" className={classes}>
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((standing, index) => {
              const isQualifier = index < 2;
              return (
                <tr 
                  key={standing.team.id} 
                  className={`
                    transition-colors hover:bg-white/5 
                    ${isQualifier ? 'bg-brand-vibrant/5' : ''}
                    relative
                  `}
                >
                  {/* Position */}
                  <td className="py-2.5 text-center relative px-1">
                    {isQualifier && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-0.5 bg-brand-vibrant rounded-r-full"></div>
                    )}
                    <span className={`font-black text-[10px] sm:text-xs ${isQualifier ? 'text-brand-vibrant' : 'text-brand-light/40'}`}>
                        {index + 1}
                    </span>
                  </td>

                  {/* Team */}
                  <td className="py-2 px-2 font-medium text-brand-text">
                    <button onClick={() => onSelectTeam(standing.team)} className="flex items-center gap-1.5 sm:gap-2 text-left group max-w-[120px] sm:max-w-none">
                      <div className="relative flex-shrink-0">
                        <TeamLogo logoUrl={standing.team.logoUrl} teamName={standing.team.name} className="w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:scale-110"/>
                        {isQualifier && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-brand-vibrant rounded-full border border-brand-secondary"></div>}
                      </div>
                      <span className="truncate text-[11px] sm:text-sm font-bold group-hover:text-brand-vibrant transition-colors leading-none">{standing.team.name}</span>
                    </button>
                  </td>

                  {/* Stats */}
                  <td className="py-2 px-1 text-center text-brand-text text-[11px] sm:text-xs font-bold">{standing.played}</td>
                  <td className="py-2 px-1 text-center hidden md:table-cell opacity-70 text-xs">{standing.wins}</td>
                  <td className="py-2 px-1 text-center hidden md:table-cell opacity-70 text-xs">{standing.draws}</td>
                  <td className="py-2 px-1 text-center hidden md:table-cell opacity-70 text-xs">{standing.losses}</td>
                  
                  {/* Goal Difference */}
                  <td className="py-2 px-1 text-center text-[10px] sm:text-xs">
                    <span className={`font-bold ${standing.goalDifference > 0 ? 'text-green-400' : standing.goalDifference < 0 ? 'text-red-400' : 'text-brand-light/50'}`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </span>
                  </td>
                  
                  {/* Points */}
                  <td className="py-2 px-1 text-center">
                    <span className="font-black text-white bg-white/5 sm:bg-white/10 px-1.5 py-0.5 rounded text-[11px] sm:text-xs border border-white/5">
                        {standing.points}
                    </span>
                  </td>

                  {/* Form */}
                  <td className="py-2 px-1 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1">
                          {standing.form && standing.form.length > 0 ? standing.form.map((res, i) => (
                              <div 
                                key={i} 
                                title={res === 'W' ? 'Win' : res === 'D' ? 'Draw' : 'Loss'}
                                className={`
                                  w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full 
                                  ${res === 'W' ? 'bg-green-500' : res === 'D' ? 'bg-gray-500' : 'bg-red-500'}
                                `}
                              />
                          )) : <span className="text-[10px] text-brand-light/20">-</span>}
                      </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
