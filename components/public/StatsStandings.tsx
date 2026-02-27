
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
            <div className="bg-brand-secondary/40 border border-brand-accent rounded-2xl p-4 backdrop-blur-md flex items-center justify-center gap-3">
                <Trophy className="text-brand-special" size={24} />
                <h3 className="text-lg font-black text-brand-text uppercase tracking-widest">Most Productive Clubs</h3>
            </div>

            <Card className="!p-0 border-brand-accent bg-brand-secondary/90 overflow-hidden shadow-2xl !rounded-[1.5rem]">
                <div className="overflow-x-auto custom-scrollbar max-h-[65vh] overflow-y-auto relative w-full">
                    <table className="w-full text-left border-collapse min-w-[300px]">
                        <thead className="bg-brand-secondary border-b border-brand-accent sticky top-0 z-10 shadow-md">
                            <tr>
                                <th className="px-2 sm:px-6 py-3 sm:py-5 text-[8px] sm:text-xs font-black uppercase tracking-widest text-brand-light/50 w-10 sm:w-24 text-center">Rank</th>
                                <th className="px-2 sm:px-6 py-3 sm:py-5 text-[8px] sm:text-xs font-black uppercase tracking-widest text-brand-light/50">Club Name</th>
                                <th className="px-2 sm:px-6 py-3 sm:py-5 text-[8px] sm:text-xs font-black uppercase tracking-widest text-brand-light/50 text-center w-20 sm:w-32">
                                    Total Goals
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-accent/50">
                            {clubStats.length > 0 ? clubStats.map((entry, index) => (
                                <StatRow key={entry.team.id} rank={index + 1} name={entry.team.name} value={entry.goals} logoUrl={entry.team.logoUrl} index={index} />
                            )) : <EmptyState />}
                        </tbody>
                    </table>
                </div>

                <div className="bg-brand-primary/40 p-4 border-t border-brand-accent text-center relative z-20">
                    <p className="text-[8px] sm:text-[10px] text-brand-light/30 uppercase font-black tracking-[0.2em] italic">
                        Kalkulasi real-time mencakup seluruh pertandingan musim ini
                    </p>
                </div>
            </Card>
        </div>
    );
};

const StatRow = ({ rank, name, value, logoUrl, index }: any) => {
    const isTopThree = rank <= 3;
    return (
        <tr className={`
            group transition-colors duration-300
            ${index % 2 === 0 ? 'bg-brand-primary/40' : 'bg-transparent'}
            ${isTopThree ? 'bg-brand-vibrant/[0.05] hover:bg-brand-vibrant/10' : 'hover:bg-brand-accent/30'}
        `}>
            <td className="px-2 sm:px-6 py-2 sm:py-4 text-center">
                <div className="flex items-center justify-center">
                    {rank === 1 ? (
                        <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg bg-brand-special/20 flex items-center justify-center text-brand-special border border-brand-special/30 shadow-[0_0_10px_var(--brand-special)] animate-float">
                            <Crown size={12} className="sm:w-6 sm:h-6" />
                        </div>
                    ) : (
                        <span className={`text-[10px] sm:text-base font-black italic ${isTopThree ? 'text-brand-text' : 'text-brand-light/40'}`}>
                            #{rank}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-2 sm:px-6 py-2 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-4">
                    <TeamLogo logoUrl={logoUrl} teamName={name} className="w-6 h-6 sm:w-12 sm:h-12 shrink-0" />
                    <span className={`text-[9px] sm:text-sm font-black uppercase tracking-tight italic line-clamp-1 ${isTopThree ? 'text-brand-text' : 'text-brand-light'}`}>
                        {name}
                    </span>
                </div>
            </td>
            <td className="px-2 sm:px-6 py-2 sm:py-4 text-center">
                <div className={`inline-flex items-center gap-1 sm:gap-3 bg-brand-primary/40 px-2 sm:px-6 py-1 sm:py-2.5 rounded-full border border-brand-accent ${isTopThree ? 'border-brand-vibrant/30 shadow-lg' : ''}`}>
                    <span className={`text-xs sm:text-xl font-black italic ${isTopThree ? 'text-brand-vibrant' : 'text-brand-text'}`}>
                        {value}
                    </span>
                    <Target className={`${isTopThree ? 'text-brand-vibrant' : 'text-brand-light/20'} sm:w-5 sm:h-5`} size={10} />
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
