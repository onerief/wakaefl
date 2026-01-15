
import React from 'react';
import type { Standing, Team } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';

interface StandingsTableProps {
  standings: Standing[];
  onSelectTeam: (team: Team) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, onSelectTeam }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-inner">
      <div className="w-full">
        <table className="w-full text-sm text-left table-fixed border-collapse">
          <thead className="text-[9px] sm:text-xs text-brand-light uppercase bg-brand-secondary/80 border-b border-white/10">
            <tr>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[12%]">#</th>
              <th scope="col" className="py-3 font-black tracking-wider text-left pl-2 w-[53%]">Club</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[10%]">P</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[12%]">GD</th>
              <th scope="col" className="py-3 font-black tracking-wider text-center w-[13%]">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((standing, index) => {
              const isQualifier = index < 2;
              return (
                <tr 
                  key={standing.team.id} 
                  className={`
                    transition-colors duration-200
                    ${index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}
                    ${isQualifier ? 'hover:bg-brand-vibrant/10' : 'hover:bg-white/5'}
                  `}
                >
                  <td className="py-3.5 text-center relative">
                    {isQualifier && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4/5 w-1 bg-brand-vibrant rounded-r-full shadow-[0_0_8px_#2563eb]"></div>
                    )}
                    <span className={`font-black text-[11px] sm:text-sm ${isQualifier ? 'text-brand-vibrant' : 'text-brand-light/50'}`}>
                        {index + 1}
                    </span>
                  </td>
                  <td className="py-3 pl-2 font-medium text-brand-text truncate">
                    <button 
                        onClick={() => onSelectTeam(standing.team)} 
                        className="flex items-center gap-3 text-left group w-full overflow-hidden"
                    >
                      <TeamLogo 
                        logoUrl={standing.team.logoUrl} 
                        teamName={standing.team.name} 
                        className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 shadow-lg ring-1 ring-white/5"
                      />
                      <span className="truncate text-xs sm:text-sm font-black text-white group-hover:text-brand-vibrant transition-colors leading-tight tracking-tight uppercase italic">
                        {standing.team.name || "Nama Tim Hilang"}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 text-center text-brand-light/80 text-[11px] sm:text-sm font-bold">{standing.played}</td>
                  <td className="py-3 text-center text-[10px] sm:text-xs">
                    <span className={`font-black ${standing.goalDifference > 0 ? 'text-green-400' : standing.goalDifference < 0 ? 'text-red-400' : 'text-brand-light/40'}`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="inline-flex items-center justify-center min-w-[28px] h-7 bg-brand-vibrant/20 rounded-md border border-brand-vibrant/30">
                        <span className="font-black text-white text-[11px] sm:text-sm px-1">
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
      
      {/* Footer Info Klasemen */}
      <div className="p-3 bg-black/40 border-t border-white/5 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-brand-vibrant rounded-full shadow-[0_0_5px_#2563eb]"></div>
              <span className="text-[8px] sm:text-[10px] font-bold text-brand-light uppercase tracking-wider">Zona Kualifikasi</span>
          </div>
          <div className="text-[8px] sm:text-[10px] text-brand-light/40 italic ml-auto">
              *Klik nama tim untuk profil lengkap
          </div>
      </div>
    </div>
  );
};
