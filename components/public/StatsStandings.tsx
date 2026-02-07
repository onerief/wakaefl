
import React from 'react';
import { Trophy, Crown, Target } from 'lucide-react';
import { Card } from '../shared/Card';
import { TeamLogo } from '../shared/TeamLogo';

interface ClubStatEntry {
    team: {
        id: string;
        name: string;
        logoUrl?: string;
    };
    goals: number;
}

interface StatsStandingsProps {
    clubStats: ClubStatEntry[];
}

export const StatsStandings: React.FC<StatsStandingsProps> = ({ clubStats = [] }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            {/* Table Header Accent */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-vibrant/20 flex items-center justify-center text-brand-vibrant border border-brand-vibrant/20 shadow-lg">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-white italic uppercase tracking-tight">Klub Terproduktif</h3>
                        <p className="text-[9px] text-brand-light font-bold uppercase tracking-widest opacity-60">Total Gol Seluruh Kompetisi</p>
                    </div>
                </div>
            </div>

            {/* Stats Table */}
            <Card className="!p-0 border-white/5 bg-brand-secondary/20 overflow-hidden shadow-2xl !rounded-[1.5rem]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-brand-secondary/60 border-b border-white/5">
                            <tr>
                                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-brand-light/50 w-16 text-center">Rank</th>
                                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-brand-light/50">Club</th>
                                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-brand-light/50 text-center w-28">Total Goals</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {clubStats.length > 0 ? clubStats.map((entry, index) => {
                                const isTopThree = index < 3;
                                return (
                                    <tr key={entry.team.id} className={`group hover:bg-white/[0.02] transition-colors ${isTopThree ? 'bg-brand-vibrant/[0.02]' : ''}`}>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center">
                                                {index === 0 ? (
                                                    <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.3)] animate-float">
                                                        <Crown size={14} />
                                                    </div>
                                                ) : (
                                                    <span className={`text-xs font-black italic ${isTopThree ? 'text-white' : 'text-brand-light/40'}`}>
                                                        #{index + 1}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <TeamLogo 
                                                    logoUrl={entry.team.logoUrl} 
                                                    teamName={entry.team.name} 
                                                    className={`w-8 h-8 sm:w-10 sm:h-10 shadow-xl ${isTopThree ? 'ring-1 ring-brand-vibrant/30' : ''}`} 
                                                />
                                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-tight italic ${isTopThree ? 'text-white' : 'text-brand-light'}`}>
                                                    {entry.team.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="inline-flex flex-col items-center gap-0.5">
                                                <div className={`flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-white/10 ${isTopThree ? 'border-brand-vibrant/30 shadow-lg' : ''}`}>
                                                    <span className={`text-sm sm:text-base font-black italic ${isTopThree ? 'text-brand-vibrant' : 'text-white'}`}>
                                                        {entry.goals}
                                                    </span>
                                                    <Target className={`${isTopThree ? 'text-brand-vibrant' : 'text-brand-light/20'}`} size={12} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center text-brand-light/20 italic font-black uppercase tracking-widest text-xs">
                                        Data produktivitas belum tercatat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-black/40 p-4 border-t border-white/5 text-center">
                    <p className="text-[8px] sm:text-[9px] text-brand-light/30 uppercase font-black tracking-[0.2em] italic">
                        Kalkulasi mencakup gol di Group Stage dan Knockout Stage
                    </p>
                </div>
            </Card>
        </div>
    );
};
