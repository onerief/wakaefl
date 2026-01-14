
import React from 'react';
import type { Standing, Team } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';

interface StandingsTableProps {
  standings: Standing[];
  onSelectTeam: (team: Team) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, onSelectTeam }) => {
  const headers = ['Pos', 'Club', 'P', 'GD', 'Pts'];

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-brand-secondary/20 backdrop-blur-sm">
      <div className="w-full">
        <table className="w-full text-sm text-left text-brand-light table-fixed">
          <thead className="text-[8px] sm:text-xs text-brand-text/70 uppercase bg-black/30 border-b border-white/5">
            <tr>
              <th scope="col" className="py-2 font-black tracking-wider text-center w-[12%]">Pos</th>
              <th scope="col" className="py-2 font-black tracking-wider text-left pl-1">Club</th>
              <th scope="col" className="py-2 font-black tracking-wider text-center w-[12%]">P</th>
              <th scope="col" className="py-2 font-black tracking-wider text-center w-[12%]">GD</th>
              <th scope="col" className="py-2 font-black tracking-wider text-center w-[12%]">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((standing, index) => {
              const isQualifier = index < 2;
              return (
                <tr key={standing.team.id} className={`transition-colors hover:bg-white/5 ${isQualifier ? 'bg-brand-vibrant/5' : ''}`}>
                  <td className="py-2.5 text-center relative">
                    {isQualifier && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-0.5 bg-brand-vibrant rounded-r-full"></div>}
                    <span className={`font-black text-[10px] sm:text-xs ${isQualifier ? 'text-brand-vibrant' : 'text-brand-light/40'}`}>
                        {index + 1}
                    </span>
                  </td>
                  <td className="py-2 pl-1 font-medium text-brand-text truncate">
                    <button onClick={() => onSelectTeam(standing.team)} className="flex items-center gap-2 text-left group w-full">
                      <TeamLogo logoUrl={standing.team.logoUrl} teamName={standing.team.name} className="w-7 h-7 sm:w-10 sm:h-10 flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"/>
                      <span className="truncate text-[11px] sm:text-sm font-bold group-hover:text-brand-vibrant transition-colors leading-none">{standing.team.name}</span>
                    </button>
                  </td>
                  <td className="py-2 text-center text-brand-text text-[10px] sm:text-xs font-bold">{standing.played}</td>
                  <td className="py-2 text-center text-[9px] sm:text-xs">
                    <span className={`font-bold ${standing.goalDifference > 0 ? 'text-green-400' : standing.goalDifference < 0 ? 'text-red-400' : 'text-brand-light/50'}`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="font-black text-white bg-white/5 sm:bg-white/10 px-1.5 py-0.5 rounded text-[10px] sm:text-xs border border-white/5">
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
