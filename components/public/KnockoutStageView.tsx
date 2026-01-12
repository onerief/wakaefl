
import React from 'react';
import type { KnockoutStageRounds, KnockoutMatch, Team } from '../../types';
import { Card } from '../shared/Card';
import { Trophy, Crown, ArrowRight, Zap } from 'lucide-react';
import { TeamLogo } from '../shared/TeamLogo';

interface KnockoutStageViewProps {
  knockoutStage: Partial<KnockoutStageRounds>;
  onSelectTeam: (team: Team) => void;
}

interface KnockoutMatchTeamProps {
  team: Team | null;
  placeholder: string;
  isWinner: boolean;
  onSelectTeam: (team: Team) => void;
  isLoser: boolean;
}

const KnockoutMatchTeam: React.FC<KnockoutMatchTeamProps> = ({ team, placeholder, isWinner, onSelectTeam, isLoser }) => {
    const hasTeam = !!team;
    const Wrapper = hasTeam ? 'button' : 'div';
    const wrapperProps = hasTeam ? { onClick: () => onSelectTeam(team!) } : {};

    return (
        <Wrapper 
            className={`
                relative flex items-center gap-3 w-full p-2 sm:p-3 rounded-xl text-left border transition-all duration-500
                ${isWinner 
                    ? 'bg-gradient-to-r from-brand-vibrant/20 via-brand-vibrant/10 to-transparent border-brand-vibrant shadow-[0_0_20px_rgba(6,182,212,0.2)] z-10 scale-[1.02]' 
                    : isLoser 
                        ? 'opacity-40 grayscale border-transparent bg-black/10'
                        : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                }
            `} 
            {...wrapperProps}
        >
            {team ? (
                <>
                    <div className="relative shrink-0">
                        <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className={`w-8 h-8 sm:w-10 sm:h-10 shadow-lg ${isWinner ? 'ring-2 ring-brand-vibrant ring-offset-2 ring-offset-brand-primary' : ''}`} />
                        {isWinner && (
                            <div className="absolute -top-2 -right-2 bg-brand-special rounded-full p-0.5 shadow-lg animate-bounce">
                                <Crown size={10} className="text-brand-primary" />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow min-w-0">
                        <span className={`block text-xs sm:text-sm truncate uppercase tracking-tight font-black ${isWinner ? 'text-white' : 'text-brand-light'}`}>
                            {team.name}
                        </span>
                        {isWinner && (
                            <span className="text-[9px] font-bold text-brand-vibrant uppercase tracking-widest animate-pulse">Winner</span>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                        <Zap size={14} className="text-white/10" />
                    </div>
                    <span className="italic text-[10px] sm:text-xs text-brand-light/40 uppercase font-bold tracking-widest truncate">{placeholder}</span>
                </div>
            )}
            
            {/* Inner Glow for Winner */}
            {isWinner && (
                <div className="absolute inset-0 bg-brand-vibrant/5 blur-xl pointer-events-none rounded-xl"></div>
            )}
        </Wrapper>
    );
};

const KnockoutMatchCard: React.FC<{ match: KnockoutMatch, onSelectTeam: (team: Team) => void }> = ({ match, onSelectTeam }) => {
    const isFinal = match.round === 'Final';
    const sA1 = match.scoreA1;
    const sB1 = match.scoreB1;
    const sA2 = match.scoreA2;
    const sB2 = match.scoreB2;

    const isLeg1Finished = sA1 !== null && sB1 !== null;
    const isLeg2Finished = sA2 !== null && sB2 !== null;
    const isFinished = isFinal ? isLeg1Finished : (isLeg1Finished && isLeg2Finished);
    
    const aggA = isFinished ? (sA1 ?? 0) + (sA2 ?? 0) : null;
    const aggB = isFinished ? (sB1 ?? 0) + (sB2 ?? 0) : null;
    
    const awayGoalsA = sA2 ?? 0;
    const awayGoalsB = sB1 ?? 0;
    
    let winnerReason = '';
    if (isFinished && aggA !== null && aggB !== null && aggA === aggB) {
        if (awayGoalsA > awayGoalsB || awayGoalsB > awayGoalsA) {
            winnerReason = '(Away Goals)';
        }
    }

    const isTeamAWinner = isFinished && match.winnerId === match.teamA?.id;
    const isTeamBWinner = isFinished && match.winnerId === match.teamB?.id;
    const isTeamALoser = isFinished && !isTeamAWinner && !!match.teamA;
    const isTeamBLoser = isFinished && !isTeamBWinner && !!match.teamB;

    return (
        <div className="relative group/match">
            <Card className={`!p-0 border-none bg-transparent overflow-visible`}>
                <div className={`
                    relative bg-brand-secondary/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl transition-all duration-500 overflow-hidden
                    ${isFinal ? 'ring-2 ring-brand-special/30 shadow-brand-special/10' : 'group-hover/match:border-brand-vibrant/30'}
                `}>
                    {/* Header bar */}
                    <div className="px-4 py-1.5 bg-black/40 border-b border-white/5 flex justify-between items-center">
                        <span className="text-[9px] font-black text-brand-light/50 tracking-widest uppercase">Match {match.matchNumber}</span>
                        {isFinished && <span className="text-[9px] font-black text-brand-vibrant uppercase tracking-widest">Final Result</span>}
                    </div>

                    <div className="p-3 sm:p-5 flex flex-col gap-3">
                        <KnockoutMatchTeam 
                            team={match.teamA} 
                            placeholder={match.placeholderA}
                            isWinner={isTeamAWinner}
                            isLoser={isTeamALoser}
                            onSelectTeam={onSelectTeam}
                        />
                        
                        <div className="flex justify-center items-center gap-4 py-1">
                            {isFinished ? (
                                isFinal ? (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-4 text-3xl font-black italic">
                                            <span className={isTeamAWinner ? 'text-brand-vibrant' : 'text-brand-light'}>{sA1}</span>
                                            <span className="text-white/20 text-lg">-</span>
                                            <span className={isTeamBWinner ? 'text-brand-vibrant' : 'text-brand-light'}>{sB1}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-6 text-xs font-black italic text-brand-light/60">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] uppercase tracking-tighter opacity-50 mb-1">Leg 1</span>
                                            <span className="bg-black/30 px-2 py-0.5 rounded-md">{sA1}-{sB1}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] uppercase tracking-widest text-brand-vibrant mb-0.5">Agg</span>
                                            <span className="text-xl text-white font-black bg-brand-vibrant/10 px-3 py-1 rounded-xl ring-1 ring-brand-vibrant/20">{aggA}-{aggB}</span>
                                            {winnerReason && <span className="text-[8px] text-brand-vibrant mt-1 leading-none">{winnerReason}</span>}
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] uppercase tracking-tighter opacity-50 mb-1">Leg 2</span>
                                            <span className="bg-black/30 px-2 py-0.5 rounded-md">{sB2}-{sA2}</span>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            )}
                        </div>

                        <KnockoutMatchTeam 
                            team={match.teamB} 
                            placeholder={match.placeholderB}
                            isWinner={isTeamBWinner}
                            isLoser={isTeamBLoser}
                            onSelectTeam={onSelectTeam}
                        />
                    </div>
                </div>
            </Card>

            {/* Desktop Connectors (rendered if not the Final round) */}
            {!isFinal && (
                <div className="hidden lg:block absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-px bg-white/10">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-vibrant shadow-[0_0_8px_#06b6d4]"></div>
                </div>
            )}
        </div>
    )
}

export const KnockoutStageView: React.FC<KnockoutStageViewProps> = ({ knockoutStage, onSelectTeam }) => {
  // Define rounds order for a traditional bracket flow
  const roundOrder: Array<keyof KnockoutStageRounds> = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

  return (
    <div className="w-full overflow-x-auto pb-12 custom-scrollbar">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 min-w-max lg:min-w-full lg:justify-center px-4">
        {roundOrder.map((roundName) => {
          const matches = knockoutStage[roundName];
          if (!matches || matches.length === 0) return null;

          const isFinalRound = roundName === 'Final';

          return (
            <div key={roundName} className={`flex flex-col ${isFinalRound ? 'justify-center' : ''} space-y-8 min-w-[280px] sm:min-w-[320px]`}>
              {/* Round Header */}
              <div className="text-center mb-4">
                 <div className="inline-flex flex-col items-center group">
                    <h3 className={`text-sm sm:text-base font-black uppercase tracking-[0.3em] italic mb-1 transition-colors ${isFinalRound ? 'text-brand-special' : 'text-brand-vibrant group-hover:text-white'}`}>
                        {roundName}
                    </h3>
                    <div className={`h-1 w-12 rounded-full transition-all duration-500 ${isFinalRound ? 'bg-brand-special w-24 shadow-[0_0_15px_#facc15]' : 'bg-brand-vibrant/30 group-hover:bg-brand-vibrant group-hover:w-20'}`}></div>
                 </div>
              </div>

              {/* Matches in Round */}
              <div className={`flex flex-col gap-8 lg:gap-12 flex-grow justify-around`}>
                {matches.map(match => (
                    <KnockoutMatchCard 
                        key={match.id} 
                        match={match} 
                        onSelectTeam={onSelectTeam} 
                    />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
      `}</style>
    </div>
  );
};
