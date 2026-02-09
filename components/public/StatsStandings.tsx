
import React, { useState } from 'react';
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

interface PlayerStatEntry {
    name: string;
    team: string;
    goals?: number;
    assists?: number;
}

interface StatsStandingsProps {
    clubStats: ClubStatEntry[];
    playerStats?: {
        topScorers: PlayerStatEntry[];
        topAssists: PlayerStatEntry[];
    };
}

export const StatsStandings: React.FC<StatsStandingsProps> = ({ clubStats = [], playerStats = { topScorers: [], topAssists: [] } }) => {
    const [activeTab, setActiveTab] = useState<'scorers' | 'assists' | 'clubs'>('scorers');

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] sm:text-xs font-black uppercase transition-all border-b-2 ${
                activeTab === id 
                ? 'text-brand-vibrant border-brand-vibrant bg-brand-vibrant/5' 
                : 'text-brand-light border-transparent hover:text-white'
            }`}
        >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
            {/* Header / Tab Navigation */}
            <div className="bg-brand-secondary/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="flex">
                    <TabButton id="scorers" label="Top Scorers" icon={Target} />
                    <TabButton id="assists" label="Top Assists" icon={Zap} />
                    <TabButton id="clubs" label="Most Productive Clubs" icon={Trophy} />
                </div>
            </div>

            <Card className="!p-0 border-white/5 bg-brand-secondary/20 overflow-hidden shadow-2xl !rounded-[1.5rem]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-brand-secondary/60 border-b border-white/5">
                            <tr>
                                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-brand-light/50 w-16 text-center">Rank</th>
                                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-brand-light/50">{activeTab === 'clubs' ? 'Club' : 'Player'}</th>
                                {activeTab !== 'clubs' && <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-brand-light/50">Club</th>}
                                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-brand-light/50 text-center w-28">
                                    {activeTab === 'scorers' ? 'Goals' : activeTab === 'assists' ? 'Assists' : 'Total Goals'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {activeTab === 'clubs' ? (
                                clubStats.length > 0 ? clubStats.map((entry, index) => (
                                    <StatRow key={entry.team.id} rank={index + 1} name={entry.team.name} value={entry.goals} logoUrl={entry.team.logoUrl} isClub={true} />
                                )) : <EmptyState />
                            ) : activeTab === 'scorers' ? (
                                playerStats.topScorers.length > 0 ? playerStats.topScorers.map((entry, index) => (
                                    <StatRow key={`${entry.name}-${entry.team}`} rank={index + 1} name={entry.name} value={entry.goals!} team={entry.team} />
                                )) : <EmptyState />
                            ) : (
                                playerStats.topAssists.length > 0 ? playerStats.topAssists.map((entry, index) => (
                                    <StatRow key={`${entry.name}-${entry.team}`} rank={index + 1} name={entry.name} value={entry.assists!} team={entry.team} icon={<Zap size={12} className="text-yellow-400" />} />
                                )) : <EmptyState />
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-black/40 p-4 border-t border-white/5 text-center">
                    <p className="text-[8px] sm:text-[9px] text-brand-light/30 uppercase font-black tracking-[0.2em] italic">
                        Kalkulasi real-time mencakup seluruh pertandingan musim ini
                    </p>
                </div>
            </Card>
        </div>
    );
};

const StatRow = ({ rank, name, value, team, logoUrl, isClub = false, icon }: any) => {
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
                    {isClub ? (
                        <TeamLogo logoUrl={logoUrl} teamName={name} className="w-8 h-8 sm:w-10 sm:h-10" />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-light">
                            <User size={16} />
                        </div>
                    )}
                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-tight italic ${isTopThree ? 'text-white' : 'text-brand-light'}`}>
                        {name}
                    </span>
                </div>
            </td>
            {!isClub && (
                <td className="px-4 py-3">
                    <span className="text-[9px] font-bold text-brand-light/60 uppercase">{team}</span>
                </td>
            )}
            <td className="px-4 py-3 text-center">
                <div className={`inline-flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-white/10 ${isTopThree ? 'border-brand-vibrant/30 shadow-lg' : ''}`}>
                    <span className={`text-sm sm:text-base font-black italic ${isTopThree ? 'text-brand-vibrant' : 'text-white'}`}>
                        {value}
                    </span>
                    {icon || <Target className={`${isTopThree ? 'text-brand-vibrant' : 'text-brand-light/20'}`} size={12} />}
                </div>
            </td>
        </tr>
    );
};

const EmptyState = () => (
    <tr>
        <td colSpan={4} className="px-6 py-20 text-center text-brand-light/20 italic font-black uppercase tracking-widest text-xs">
            Data statistik belum tersedia.
        </td>
    </tr>
);
