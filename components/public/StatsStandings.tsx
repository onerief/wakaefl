
import React from 'react';
import { Trophy, Crown, Target, Zap, User, Users } from 'lucide-react';
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
    // playerStats prop is no longer used but kept for interface compatibility if needed upstream
    playerStats?: any; 
}

export const StatsStandings: React.FC<StatsStandingsProps> = ({ clubStats = [] }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
            {/* Header Only (No Tabs) */}
            <div className="bg-brand-secondary/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md flex items-center justify-center gap-3">
                <Trophy className="text-brand-special" size={24} />
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Most Productive Clubs</h3>
            </div>

            <Card className="!p-0 border-white/5 bg-brand-secondary/20 overflow-hidden shadow-2xl !rounded-[1.5rem]">
                <div className="overflow-x-auto custom-scrollbar max-h-[65vh] overflow-y-auto relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-brand-secondary/95 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md shadow-md">
                            <tr>
                                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-brand-light/50 w-16 text-center">Rank</th>
                                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-brand-light/50">Club Name</th>
                                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-brand-light/50 text-center w-28">
                                    Total Goals
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {clubStats.length > 0 ? clubStats.map((entry, index) => (
                                <StatRow key={entry.team.id} rank={index + 1} name={entry.team.name} value={entry.goals} logoUrl={entry.team.logoUrl} />
                            )) : <EmptyState />}
                        </tbody>
                    </table>
                </div>

                <div className="bg-black/40 p-4 border-t border-white/5 text-center relative z-20">
                    <p className="text-[8px] sm:text-[9px] text-brand-light/30 uppercase font-black tracking-[0.2em] italic">
                        Kalkulasi real-time mencakup seluruh pertandingan musim ini
                    </p>
                </div>
            </Card>
        </div>
    );
};

const StatRow = ({ rank, name, value, logoUrl }: any) => {
    const isTopThree = rank <= 3;
    return (
        <tr className={`group hover:bg-white/[0.02] transition-colors ${isTopThree ? 'bg-brand-vibrant/[0.02]' : ''}`}>
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center">
                    {rank === 1 ? (
                        <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.3)] animate-float">
                            <Crown size={14} />
                        </div>
                    ) : (
                        <span className={`text-xs font-black italic ${isTopThree ? 'text-white' : 'text-brand-light/40'}`}>
                            #{rank}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <TeamLogo logoUrl={logoUrl} teamName={name} className="w-8 h-8 sm:w-10 sm:h-10" />
                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-tight italic ${isTopThree ? 'text-white' : 'text-brand-light'}`}>
                        {name}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 text-center">
                <div className={`inline-flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-white/10 ${isTopThree ? 'border-brand-vibrant/30 shadow-lg' : ''}`}>
                    <span className={`text-sm sm:text-base font-black italic ${isTopThree ? 'text-brand-vibrant' : 'text-white'}`}>
                        {value}
                    </span>
                    <Target className={`${isTopThree ? 'text-brand-vibrant' : 'text-brand-light/20'}`} size={12} />
                </div>
            </td>
        </tr>
    );
};

const EmptyState = () => (
    <tr>
        <td colSpan={3} className="px-6 py-20 text-center text-brand-light/20 italic font-black uppercase tracking-widest text-xs">
            Data statistik belum tersedia.
        </td>
    </tr>
);
