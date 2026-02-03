
import React from 'react';
import type { Standing, Team } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';

interface StandingsTableProps {
  standings: Standing[];
  onSelectTeam: (team: Team) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, onSelectTeam }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl w-full">
      <div className="w-full">
        <table className="w-full text-xs text-left table-fixed border-collapse">
          <thead className="text-[9px] sm:text-[10px] text-brand-light uppercase bg-brand-secondary/80 border-b border-white/10 backdrop-blur-md">
            <tr>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[12%] sm:w-[10%]">#</th>
              <th scope="col" className="py-3 font-black tracking-wider text-left pl-1 w-[48%] sm:w-[50%]">Club</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[10%]">P</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[15%]">GD</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[15%]">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((standing, index) => {
              const isQualifier = index < 2;
              return (
                <tr 
                  key={standing.team.id} 
                  className={`
                    transition-all duration-300
                    ${index % 2 === 0 ? 'bg-white/[0.01]' : 'bg-transparent'}
                    ${isQualifier ? 'hover:bg-brand-vibrant/10' : 'hover:bg-white/5'}
                  `}
                >
                  <td className="py-3 text-center relative">
                    {isQualifier && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4/5 w-0.5 sm:w-1 bg-brand-vibrant rounded-r-full shadow-[0_0_10px_#2563eb]"></div>
                    )}
                    <span className={`font-black text-[10px] sm:text-sm ${isQualifier ? 'text-brand-vibrant' : 'text-brand-light/50'}`}>
                        {index + 1}
                    </span>
                  </td>
                  <td className="py-3 pl-1 font-medium text-brand-text">
                    <button 
                        onClick={() => onSelectTeam(standing.team)} 
                        className="flex items-center gap-1.5 sm:gap-2.5 text-left group w-full overflow-hidden transition-transform active:scale-95"
                    >
                      <TeamLogo 
                        logoUrl={standing.team.logoUrl} 
                        teamName={standing.team.name} 
                        className="w-6 h-6 sm:w-10 sm:h-10 flex-shrink-0 shadow-lg"
                      />
                      <span className="text-[9px] sm:text-sm font-black text-white group-hover:text-brand-vibrant transition-colors leading-none tracking-tight uppercase italic truncate">
                        {standing.team.name || "TBD"}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 text-center text-brand-light/70 text-[10px] sm:text-sm font-bold">{standing.played}</td>
                  <td className="py-3 text-center text-[10px] sm:text-xs">
                    <span className={`font-black ${standing.goalDifference > 0 ? 'text-green-400' : standing.goalDifference < 0 ? 'text-red-400' : 'text-brand-light/30'}`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </span>
                  </td>
                  <td className="py-3 text-center">
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
      
      <div className="p-2 sm:p-3 bg-black/40 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 sm:w-2 sm:h-2 bg-brand-vibrant rounded-full shadow-[0_0_8px_#2563eb]"></div>
              <span className="text-[7px] sm:text-[9px] font-black text-brand-light/60 uppercase tracking-widest">Kualifikasi</span>
          </div>
          <div className="text-[7px] sm:text-[9px] text-brand-light/30 italic font-medium">
              Tap nama untuk profil
          </div>
      </div>
    </div>
  );
};
