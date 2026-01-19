
/* Fix: Removed non-existent import 'uploadMatchProof' from firebaseService as it was causing an error and is unused in this component. */
import React, { useState, useRef } from 'react';
import type { KnockoutStageRounds, KnockoutMatch, Team } from '../../types';
import { Card } from '../shared/Card';
import { Trophy, Crown, ArrowRight, Zap, Save, Plus, Minus, Camera, Loader, MonitorPlay, Sparkles, Star } from 'lucide-react';
import { TeamLogo } from '../shared/TeamLogo';
import { useToast } from '../shared/Toast';
import { ProofModal } from './ProofModal';

interface KnockoutStageViewProps {
  knockoutStage: Partial<KnockoutStageRounds>;
  onSelectTeam: (team: Team) => void;
  isAdminMode?: boolean;
  onUpdateScore?: (matchId: string, data: Partial<KnockoutMatch> & { round: keyof KnockoutStageRounds }) => void;
  userOwnedTeamIds?: string[];
}

interface KnockoutMatchTeamProps {
  team: Team | null;
  placeholder: string;
  isWinner: boolean;
  onSelectTeam: (team: Team) => void;
  isLoser: boolean;
  isAdminMode?: boolean;
  editScore?: number;
  onAdjust?: (delta: number) => void;
  isMyTeam?: boolean;
}

const KnockoutMatchTeam: React.FC<KnockoutMatchTeamProps> = ({ 
    team, placeholder, isWinner, onSelectTeam, isLoser, isAdminMode, editScore, onAdjust, isMyTeam
}) => {
    const hasTeam = !!team;
    const Wrapper = hasTeam ? 'button' : 'div';
    const wrapperProps = hasTeam ? { onClick: () => onSelectTeam(team!) } : {};

    return (
        <div className="flex flex-col gap-0.5 w-full relative">
            <Wrapper 
                className={`
                    relative flex items-center gap-2 w-full p-2.5 rounded-xl text-left border transition-all duration-500
                    ${isWinner 
                        ? 'bg-brand-vibrant/20 border-brand-vibrant shadow-[0_0_20px_rgba(37,99,235,0.3)] z-10 scale-[1.03] ring-1 ring-white/20' 
                        : isLoser 
                            ? 'opacity-30 grayscale border-transparent bg-black/10 scale-95'
                            : isMyTeam 
                                ? 'border-brand-vibrant/50 bg-brand-vibrant/5'
                                : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }
                `} 
                {...wrapperProps}
            >
                {team ? (
                    <>
                        <div className="relative shrink-0">
                            <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className={`w-8 h-8 sm:w-11 sm:h-11 transition-all duration-700 ${isWinner ? 'animate-float-mini' : ''} ${isMyTeam ? 'ring-2 ring-brand-vibrant' : ''}`} />
                            {isWinner && (
                                <div className="absolute -top-1.5 -right-1.5 bg-brand-special rounded-full p-0.5 shadow-lg animate-bounce">
                                    <Crown size={10} className="text-brand-primary" />
                                </div>
                            )}
                            {isMyTeam && !isWinner && (
                                <div className="absolute -top-1.5 -right-1.5 bg-brand-vibrant rounded-full p-0.5 shadow-lg">
                                    <Star size={10} className="text-white fill-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <span className={`block text-[10px] sm:text-sm truncate uppercase tracking-tight font-black transition-colors duration-500 ${isWinner || isMyTeam ? 'text-white' : 'text-brand-light'}`}>
                                {team.name}
                            </span>
                            {isWinner ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] sm:text-[8px] font-black text-brand-special uppercase tracking-[0.2em] animate-pulse">Winner</span>
                                    <Sparkles size={8} className="text-brand-special animate-pulse" />
                                </div>
                            ) : isMyTeam && (
                                <span className="text-[7px] sm:text-[8px] font-black text-brand-vibrant uppercase tracking-[0.2em]">Tim Anda</span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2 w-full">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                            <Zap size={10} className="text-white/10" />
                        </div>
                        <span className="italic text-[9px] sm:text-xs text-brand-light/40 uppercase font-bold tracking-widest truncate">{placeholder}</span>
                    </div>
                )}
                
                {/* Visual Shine Effect for Winners */}
                {isWinner && (
                    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine animate-shine-slow" />
                    </div>
                )}
            </Wrapper>
            
            {isAdminMode && team && onAdjust && (
                <div className="flex items-center justify-center gap-3 bg-black/40 rounded-lg p-1 mx-1 border border-white/5 scale-90">
                    <button onClick={(e) => { e.stopPropagation(); onAdjust(-1); }} className="text-brand-light hover:text-red-400"><Minus size={10}/></button>
                    <span className="text-xs font-black text-brand-special min-w-[12px] text-center">{editScore}</span>
                    <button onClick={(e) => { e.stopPropagation(); onAdjust(1); }} className="text-brand-light hover:text-green-400"><Plus size={10}/></button>
                </div>
            )}
        </div>
    );
};

const KnockoutMatchCard: React.FC<{ 
    match: KnockoutMatch, 
    onSelectTeam: (team: Team) => void, 
    isAdminMode?: boolean,
    onUpdateScore?: (matchId: string, data: Partial<KnockoutMatch> & { round: keyof KnockoutStageRounds }) => void,
    userOwnedTeamIds?: string[]
}> = ({ match, onSelectTeam, isAdminMode, onUpdateScore, userOwnedTeamIds = [] }) => {
    const isFinal = match.round === 'Final';
    const sA1 = match.scoreA1;
    const sB1 = match.scoreB1;
    const sA2 = match.scoreA2;
    const sB2 = match.scoreB2;

    const [eA1, setEA1] = useState(sA1 ?? 0);
    const [eB1, setEB1] = useState(sB1 ?? 0);
    const [eA2, setEA2] = useState(sA2 ?? 0);
    const [eB2, setEB2] = useState(sB2 ?? 0);
    const [editProofUrl, setEditProofUrl] = useState(match.proofUrl ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [showProof, setShowProof] = useState(false);
    const { addToast } = useToast();

    const isLeg1Finished = sA1 !== null && sB1 !== null;
    const isLeg2Finished = sA2 !== null && sB2 !== null;
    const isFinished = isFinal ? isLeg1Finished : (isLeg1Finished && isLeg2Finished);
    
    const aggA = isFinished ? (sA1 ?? 0) + (sA2 ?? 0) : null;
    const aggB = isFinished ? (sB1 ?? 0) + (sB2 ?? 0) : null;
    
    const isTeamAWinner = isFinished && match.winnerId === match.teamA?.id;
    const isTeamBWinner = isFinished && match.winnerId === match.teamB?.id;
    const isTeamALoser = isFinished && !isTeamAWinner && !!match.teamA;
    const isTeamBLoser = isFinished && !isTeamBWinner && !!match.teamB;
    
    const isMyMatch = (match.teamA && userOwnedTeamIds.includes(match.teamA.id)) || (match.teamB && userOwnedTeamIds.includes(match.teamB.id));

    const handleSave = async () => {
        if (!onUpdateScore) return;
        setIsSaving(true);
        try {
            await onUpdateScore(match.id, { 
                round: match.round,
                scoreA1: eA1, scoreB1: eB1, 
                scoreA2: isFinal ? null : eA2, scoreB2: isFinal ? null : eB2,
                proofUrl: editProofUrl
            });
            addToast('Skor disimpan!', 'success');
        } catch (e) {
            addToast('Gagal.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative group/match animate-in fade-in slide-in-from-right-4 duration-700">
            <Card className="!p-0 border-none bg-transparent overflow-visible">
                <div className={`
                    relative bg-brand-secondary/40 backdrop-blur-md rounded-2xl border transition-all duration-500 overflow-hidden
                    ${isAdminMode ? 'border-brand-special' : isMyMatch ? 'border-brand-vibrant shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'border-white/5'}
                    ${isFinished ? 'ring-1 ring-white/5 shadow-[0_0_30px_rgba(0,0,0,0.3)]' : ''}
                    ${isFinal && isFinished ? 'ring-2 ring-brand-special shadow-brand-special/20' : ''}
                `}>
                    <div className="px-3 py-1.5 bg-black/40 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black text-brand-light/50 tracking-widest uppercase">Match {match.matchNumber}</span>
                             {(match.proofUrl || editProofUrl) && (
                                <button onClick={() => setShowProof(true)} className="text-brand-vibrant hover:text-white transition-colors">
                                    <MonitorPlay size={10} />
                                </button>
                             )}
                             {isMyMatch && (
                                 <div className="flex items-center gap-1 text-brand-vibrant animate-pulse">
                                     <Star size={8} className="fill-brand-vibrant" />
                                     <span className="text-[7px] font-black uppercase">Tim Anda</span>
                                 </div>
                             )}
                        </div>
                        {isAdminMode && (
                            <button onClick={handleSave} disabled={isSaving} className="text-[8px] font-black text-brand-special uppercase flex items-center gap-1 hover:brightness-125">
                                {isSaving ? <Loader className="animate-spin" size={8} /> : <Save size={8} />} SIMPAN
                            </button>
                        )}
                        {!isAdminMode && isFinished && (
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-black text-brand-vibrant uppercase tracking-widest">Completed</span>
                                <div className="w-1 h-1 rounded-full bg-brand-vibrant animate-pulse"></div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 sm:p-6 flex flex-col gap-3 relative">
                        <KnockoutMatchTeam 
                            team={match.teamA} 
                            placeholder={match.placeholderA}
                            isWinner={isTeamAWinner}
                            isLoser={isTeamALoser}
                            onSelectTeam={onSelectTeam}
                            isAdminMode={isAdminMode}
                            editScore={eA1}
                            onAdjust={(d) => setEA1(v => Math.max(0, v + d))}
                            isMyTeam={match.teamA ? userOwnedTeamIds.includes(match.teamA.id) : false}
                        />
                        
                        <div className="flex justify-center items-center py-1">
                            {isFinished ? (
                                isFinal ? (
                                    <div className="flex items-center gap-4 text-2xl sm:text-4xl font-black italic relative">
                                        <div className={`absolute -inset-x-8 -inset-y-4 bg-brand-special/5 blur-2xl rounded-full ${isTeamAWinner || isTeamBWinner ? 'animate-pulse' : ''}`}></div>
                                        <span className={`relative transition-all duration-500 ${isTeamAWinner ? 'text-brand-special scale-110' : 'text-brand-light/50'}`}>{sA1}</span>
                                        <span className="relative text-white/20 text-xs">-</span>
                                        <span className={`relative transition-all duration-500 ${isTeamBWinner ? 'text-brand-special scale-110' : 'text-brand-light/50'}`}>{sB1}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-[10px] font-black text-white bg-black/40 px-4 py-1 rounded-full border border-white/5 shadow-inner">
                                        <span className="text-brand-light/40 text-[8px] uppercase tracking-[0.2em]">Agg</span>
                                        <span className="flex items-center gap-2 italic">
                                            <span className={isTeamAWinner ? 'text-brand-vibrant' : ''}>{aggA}</span>
                                            <span className="text-white/10">-</span>
                                            <span className={isTeamBWinner ? 'text-brand-vibrant' : ''}>{aggB}</span>
                                        </span>
                                    </div>
                                )
                            ) : (
                                <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            )}
                        </div>

                        <KnockoutMatchTeam 
                            team={match.teamB} 
                            placeholder={match.placeholderB}
                            isWinner={isTeamBWinner}
                            isLoser={isTeamBLoser}
                            onSelectTeam={onSelectTeam}
                            isAdminMode={isAdminMode}
                            editScore={eB1}
                            onAdjust={(d) => setEB1(v => Math.max(0, v + d))}
                            isMyTeam={match.teamB ? userOwnedTeamIds.includes(match.teamB.id) : false}
                        />
                    </div>
                </div>
            </Card>

            {/* Desktop Connector for Winner Flow */}
            {!isFinal && isFinished && (
                <div className="hidden lg:block absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-px bg-brand-vibrant shadow-[0_0_8px_#2563eb] animate-pulse">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-vibrant shadow-[0_0_12px_#2563eb]"></div>
                    <div className="absolute inset-0 bg-brand-vibrant animate-ping opacity-20 rounded-full"></div>
                </div>
            )}
            
            {(match.proofUrl || editProofUrl) && (
                <ProofModal isOpen={showProof} onClose={() => setShowProof(false)} imageUrl={editProofUrl || match.proofUrl || ''} />
            )}
        </div>
    )
}

export const KnockoutStageView: React.FC<KnockoutStageViewProps> = ({ knockoutStage, onSelectTeam, isAdminMode, onUpdateScore, userOwnedTeamIds = [] }) => {
  const roundOrder: Array<keyof KnockoutStageRounds> = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

  return (
    <div className="w-full overflow-x-auto pb-12 custom-scrollbar perspective-1000">
      <style>{`
        @keyframes shine {
          100% { left: 125%; }
        }
        @keyframes shine-slow {
          0% { left: -100%; }
          20% { left: 125%; }
          100% { left: 125%; }
        }
        @keyframes float-mini {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.05); }
        }
        .animate-shine {
          animation: shine 0.8s forwards;
        }
        .animate-shine-slow {
          animation: shine-slow 4s infinite ease-in-out;
        }
        .animate-float-mini {
          animation: float-mini 3s infinite ease-in-out;
        }
        .perspective-1000 {
            perspective: 1000px;
        }
      `}</style>
      
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-20 min-w-max lg:min-w-full lg:justify-center px-4 py-4">
        {roundOrder.map((roundName, roundIdx) => {
          const matches = knockoutStage[roundName];
          if (!matches || matches.length === 0) return null;

          const isFinalRound = roundName === 'Final';

          return (
            <div 
                key={roundName} 
                className={`flex flex-col space-y-6 min-w-[260px] sm:min-w-[340px] animate-in fade-in duration-1000 slide-in-from-bottom-2`}
                style={{ animationDelay: `${roundIdx * 150}ms` }}
            >
              <div className="text-center mb-2 group">
                <div className="inline-flex flex-col items-center">
                    <h3 className={`text-xs sm:text-base font-black uppercase tracking-[0.3em] italic transition-all duration-500 ${isFinalRound ? 'text-brand-special scale-110' : 'text-brand-vibrant group-hover:text-white'}`}>
                        {roundName}
                    </h3>
                    <div className={`h-1 rounded-full transition-all duration-700 ${isFinalRound ? 'bg-brand-special w-24 shadow-[0_0_15px_#fde047]' : 'bg-brand-vibrant/30 w-8 group-hover:w-16 group-hover:bg-brand-vibrant'} mt-1.5`}></div>
                </div>
              </div>

              <div className="flex flex-col gap-8 lg:gap-14 flex-grow justify-around relative">
                {matches.map(match => (
                    <KnockoutMatchCard 
                        key={match.id} 
                        match={match} 
                        onSelectTeam={onSelectTeam} 
                        isAdminMode={isAdminMode}
                        onUpdateScore={onUpdateScore}
                        userOwnedTeamIds={userOwnedTeamIds}
                    />
                ))}
                
                {/* Decorative Flow Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-brand-vibrant/5 via-transparent to-brand-vibrant/5 blur-[100px] pointer-events-none -z-10 opacity-30"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
