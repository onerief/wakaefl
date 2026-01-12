
import React, { useState } from 'react';
import type { Match, Team } from '../../types';
import { Card } from '../shared/Card';
import { MonitorPlay } from 'lucide-react';
import { ProofModal } from './ProofModal';
import { TeamLogo } from '../shared/TeamLogo';

interface MatchCardProps {
    match: Match;
    onSelectTeam: (team: Team) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSelectTeam }) => {
    const [showProof, setShowProof] = useState(false);

    const isFinished = match.status === 'finished' && match.scoreA !== null && match.scoreB !== null;

    return (
        <>
            <Card className="!p-0 group border-l-4 border-l-transparent hover:border-l-brand-vibrant transition-all hover:scale-[1.02] duration-300">
                {/* Header Info */}
                <div className="flex items-center justify-between px-4 py-2 bg-black/20 text-[10px] sm:text-xs text-brand-light border-b border-white/5">
                    <span className="font-medium tracking-wide">
                        Group {match.group}{match.matchday && ` • Matchday ${match.matchday}`}
                    </span>
                    <div className="flex items-center gap-2">
                        {match.proofUrl && (
                            <button
                                onClick={(e) => {e.stopPropagation(); setShowProof(true);}}
                                title="Watch Highlight/Proof"
                                className="flex items-center gap-1 text-brand-vibrant hover:text-white transition-colors"
                            >
                                <MonitorPlay size={12} />
                                <span className="hidden sm:inline">Proof</span>
                            </button>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                            match.status === 'finished' ? 'bg-brand-accent/50 text-brand-light' :
                            match.status === 'live' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                            'bg-brand-vibrant/10 text-brand-vibrant'
                        }`}>
                            {match.status}
                        </span>
                    </div>
                </div>

                {/* Match Content */}
                <div className="p-3 sm:p-4 flex items-center justify-between gap-1 sm:gap-2 relative">
                    {/* Background VS Watermark */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-white/5 pointer-events-none italic">VS</div>

                    {/* Team A */}
                    <button onClick={() => onSelectTeam(match.teamA)} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 flex-1 min-w-0 text-center sm:text-left group/team hover:bg-white/5 p-1 sm:p-2 rounded-lg transition-colors">
                        <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-10 h-10 sm:w-12 sm:h-12 shadow-lg group-hover/team:scale-110 transition-transform duration-300" />
                        <span className="text-xs sm:text-base font-bold text-brand-text truncate w-full group-hover:text-brand-vibrant transition-colors leading-tight mt-1 sm:mt-0">{match.teamA.name}</span>
                    </button>

                    {/* Score */}
                    <div className="flex flex-col items-center justify-center px-1 sm:px-2 min-w-[60px] sm:min-w-[80px]">
                        {isFinished ? (
                            <div className="flex items-center gap-1 sm:gap-2 text-xl sm:text-3xl font-black text-white bg-black/30 px-2 sm:px-3 py-1 rounded-lg border border-white/10 shadow-inner">
                                <span className={`${match.scoreA! > match.scoreB! ? 'text-brand-vibrant' : ''}`}>{match.scoreA}</span>
                                <span className="text-brand-light text-sm sm:text-base opacity-50">-</span>
                                <span className={`${match.scoreB! > match.scoreA! ? 'text-brand-vibrant' : ''}`}>{match.scoreB}</span>
                            </div>
                        ) : (
                            <div className="text-lg sm:text-xl font-bold text-brand-light/30">VS</div>
                        )}
                    </div>

                    {/* Team B */}
                    <button onClick={() => onSelectTeam(match.teamB)} className="flex flex-col sm:flex-row-reverse items-center gap-1 sm:gap-3 flex-1 min-w-0 text-center sm:text-right group/team hover:bg-white/5 p-1 sm:p-2 rounded-lg transition-colors">
                        <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-10 h-10 sm:w-12 sm:h-12 shadow-lg group-hover/team:scale-110 transition-transform duration-300" />
                        <span className="text-xs sm:text-base font-bold text-brand-text truncate w-full group-hover:text-brand-vibrant transition-colors leading-tight mt-1 sm:mt-0">{match.teamB.name}</span>
                    </button>
                </div>

                {match.summary && (
                    <div className="bg-brand-secondary/30 px-4 py-2 border-t border-white/5">
                        <p className="text-xs text-brand-light italic leading-relaxed line-clamp-2">
                            <span className="text-brand-vibrant font-bold not-italic mr-1">AI Summary:</span> 
                            "{match.summary}"
                        </p>
                    </div>
                )}
            </Card>
            {match.proofUrl && (
                <ProofModal 
                    isOpen={showProof}
                    onClose={() => setShowProof(false)}
                    imageUrl={match.proofUrl}
                />
            )}
        </>
    )
}
