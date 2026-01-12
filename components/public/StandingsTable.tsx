
import React from 'react';
import type { Standing, Team } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';

interface StandingsTableProps {
  standings: Standing[];
  onSelectTeam: (team: Team) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, onSelectTeam }) => {
  const headers = ['Pos', 'Club', 'P', 'W', 'D', 'L', 'GD', 'Pts'];
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-brand-secondary/20 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-brand-light">
          <thead className="text-xs text-brand-text/70 uppercase bg-black/20 border-b border-white/5">
            <tr>
              {headers.map((header, idx) => (
                <th key={header} scope="col" className={`px-3 py-4 font-bold tracking-wider ${idx === 1 ? 'text-left' : 'text-center'} ${['W', 'D', 'L'].includes(header) ? 'hidden sm:table-cell' : ''}`}>
                  {header}
                </th>
              ))}
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
                  <td className="px-3 py-3 text-center relative">
                    {isQualifier && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4/5 w-1 bg-brand-vibrant rounded-r-full shadow-[0_0_10px_#06b6d4]"></div>
                    )}
                    <span className={`font-bold ${isQualifier ? 'text-brand-vibrant' : 'text-brand-light/50'}`}>
                        {index + 1}
                    </span>
                  </td>

                  {/* Team */}
                  <th scope="row" className="px-3 py-3 font-medium text-brand-text whitespace-nowrap">
                    <button onClick={() => onSelectTeam(standing.team)} className="flex items-center gap-3 text-left w-full group">
                      <div className="relative">
                        <TeamLogo logoUrl={standing.team.logoUrl} teamName={standing.team.name} className="w-8 h-8 sm:w-9 sm:h-9 transition-transform group-hover:scale-110"/>
                        {isQualifier && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-vibrant rounded-full border-2 border-brand-secondary shadow-lg"></div>}
                      </div>
                      <span className="group-hover:text-brand-vibrant transition-colors">{standing.team.name}</span>
                    </button>
                  </th>

                  {/* Stats */}
                  <td className="px-3 py-3 text-center text-brand-text">{standing.played}</td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell opacity-70">{standing.wins}</td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell opacity-70">{standing.draws}</td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell opacity-70">{standing.losses}</td>
                  
                  {/* Goal Difference */}
                  <td className="px-3 py-3 text-center">
                    <span className={`font-bold ${standing.goalDifference > 0 ? 'text-green-400' : standing.goalDifference < 0 ? 'text-red-400' : 'text-brand-light'}`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </span>
                  </td>
                  
                  {/* Points */}
                  <td className="px-3 py-3 text-center">
                    <span className="font-black text-white bg-white/10 px-2 py-1 rounded-md min-w-[30px] inline-block shadow-inner border border-white/5">
                        {standing.points}
                    </span>
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
