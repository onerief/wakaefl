
/* Fix: Removed non-existent import 'uploadMatchProof' from firebaseService */
import React, { useState, useRef } from 'react';
import type { KnockoutStageRounds, KnockoutMatch, Team } from '../../types';
import { Card } from '../shared/Card';
import { Trophy, Crown, ArrowRight, Zap, Save, Plus, Minus, Camera, Loader, MonitorPlay, Sparkles, Star, Shield } from 'lucide-react';
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
                    relative flex items-center gap-3 w-full h-12 sm:h-14 px-3 rounded-lg text-left transition-all duration-300 shadow-lg
                    ${isWinner 
                        ? 'bg-white text-brand-primary scale-[1.05] z-10 border-l-[6px] border-l-brand-vibrant ring-2 ring-brand-vibrant/30' 
                        : isLoser 
                            ? 'bg-white/90 grayscale opacity-60 text-brand-primary/60 border-l-[6px] border-l-gray-400'
                            : isMyTeam 
                                ? 'bg-white text-brand-primary border-l-[6px] border-l-brand-special'
                                : 'bg-white text-brand-primary border-l-[6px] border-l-slate-800'
                    }
                `} 
                {...wrapperProps}
            >
                {team ? (
                    <>
                        <div className="relative shrink-0">
                            <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className={`w-8 h-8 sm:w-10 sm:h-10 transition-transform ${isWinner ? 'scale-110' : ''}`} />
                            {isWinner && (
                                <div className="absolute -top-2 -right-2 bg-brand-special rounded-full p-0.5 shadow-lg">
                                    <Crown size={12} className="text-brand-primary" />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <span className={`block text-xs sm:text-sm truncate uppercase tracking-tight font-black leading-none`}>
                                {team.name}
                            </span>
                            {isWinner && (
                                <span className="text-[7px] font-black text-brand-vibrant uppercase tracking-widest mt-1 block">Advancing</span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2 w-full opacity-30">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <Zap size={10} className="text-slate-500" />
                        </div>
                        <span className="italic text-[9px] uppercase font-black tracking-widest truncate">{placeholder}</span>
                    </div>
                )}
            </Wrapper>
            
            {isAdminMode && team && onAdjust && (
                <div className="flex items-center justify-center gap-3 bg-black/60 rounded-lg p-1 mx-1 mt-1 border border-white/10 scale-90">
                    <button onClick={(e) => { e.stopPropagation(); onAdjust(-1); }} className="text-brand-light hover:text-red-400"><Minus size={12}/></button>
                    <span className="text-xs font-black text-brand-special min-w-[12px] text-center">{editScore}</span>
                    <button onClick={(e) => { e.stopPropagation(); onAdjust(1); }} className="text-brand-light hover:text-green-400"><Plus size={12}/></button>
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
    const [isSaving, setIsSaving] = useState(false);
    const [showProof, setShowProof] = useState(false);
    const { addToast } = useToast();

    const isFinished = isFinal ? (sA1 !== null && sB1 !== null) : (sA1 !== null && sB1 !== null && sA2 !== null && sB2 !== null);
    
    const aggA = isFinished ? (sA1 ?? 0) + (sA2 ?? 0) : null;
    const aggB = isFinished ? (sB1 ?? 0) + (sB2 ?? 0) : null;
    
    const isTeamAWinner = isFinished && match.winnerId === match.teamA?.id;
    const isTeamBWinner = isFinished && match.winnerId === match.teamB?.id;
    
    const handleSave = async () => {
        if (!onUpdateScore) return;
        setIsSaving(true);
        try {
            await onUpdateScore(match.id, { 
                round: match.round,
                scoreA1: eA1, scoreB1: eB1, 
                scoreA2: isFinal ? null : eA2, scoreB2: isFinal ? null : eB2
            });
            addToast('Skor disimpan!', 'success');
        } catch (e) {
            addToast('Gagal.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative group/match py-4">
            {/* Connection lines visual approximation */}
            <div className="flex flex-col gap-4 relative z-10 w-full">
                <KnockoutMatchTeam 
                    team={match.teamA} 
                    placeholder={match.placeholderA}
                    isWinner={isTeamAWinner}
                    isLoser={isFinished && !isTeamAWinner && !!match.teamA}
                    onSelectTeam={onSelectTeam}
                    isAdminMode={isAdminMode}
                    editScore={eA1}
                    onAdjust={(d) => setEA1(v => Math.max(0, v + d))}
                    isMyTeam={match.teamA ? userOwnedTeamIds.includes(match.teamA.id) : false}
                />
                
                {/* Result Indicator Overlay */}
                {isFinished && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                        <div className="bg-brand-primary border border-white/20 px-3 py-1 rounded-md shadow-2xl">
                             <span className="text-xs font-black italic text-white">
                                {isFinal ? `${sA1}-${sB1}` : `${aggA}-${aggB}`}
                             </span>
                        </div>
                    </div>
                )}

                <KnockoutMatchTeam 
                    team={match.teamB} 
                    placeholder={match.placeholderB}
                    isWinner={isTeamBWinner}
                    isLoser={isFinished && !isTeamBWinner && !!match.teamB}
                    onSelectTeam={onSelectTeam}
                    isAdminMode={isAdminMode}
                    editScore={eB1}
                    onAdjust={(d) => setEB1(v => Math.max(0, v + d))}
                    isMyTeam={match.teamB ? userOwnedTeamIds.includes(match.teamB.id) : false}
                />
            </div>

            {isAdminMode && (
                <button onClick={handleSave} disabled={isSaving} className="mt-2 w-full text-[8px] font-black text-brand-special uppercase bg-black/40 py-1 rounded border border-brand-special/20 hover:bg-brand-special hover:text-brand-primary transition-all">
                    {isSaving ? <Loader className="animate-spin inline mr-1" size={8} /> : <Save size={8} className="inline mr-1" />} SIMPAN HASIL MATCH
                </button>
            )}

            {/* Desktop Connector Logic */}
            {!isFinal && (
                <div className="hidden lg:block absolute -right-10 top-1/2 w-10 h-px bg-white/10 group-hover:bg-brand-vibrant transition-colors"></div>
            )}
        </div>
    )
}

export const KnockoutStageView: React.FC<KnockoutStageViewProps> = ({ knockoutStage, onSelectTeam, isAdminMode, onUpdateScore, userOwnedTeamIds = [] }) => {
  const roundOrder: Array<keyof KnockoutStageRounds> = ['Play-offs', 'Quarter-finals', 'Semi-finals', 'Final'];

  return (
    <div className="w-full overflow-x-auto pb-12 custom-scrollbar relative">
      
      {/* Background Brand Overlay (Matches referensi) */}
      <div className="absolute top-0 right-0 p-10 flex flex-col items-end opacity-20 pointer-events-none select-none">
          <h2 className="text-4xl sm:text-6xl font-black text-white text-right italic leading-none tracking-tighter">
              WAY KANAN <br /> EFOOTBALL <br /> <span className="text-brand-vibrant">LEAGUE</span> <br /> CHAMPIONSHIP
          </h2>
          <div className="w-24 h-1 bg-white mt-4"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 min-w-max lg:min-w-full lg:justify-center px-4 py-10 relative z-10">
        {roundOrder.map((roundName, roundIdx) => {
          const matches = knockoutStage[roundName];
          if (!matches || matches.length === 0) return null;

          return (
            <div 
                key={roundName} 
                className={`flex flex-col space-y-6 min-w-[240px] sm:min-w-[280px] animate-in fade-in duration-700`}
                style={{ animationDelay: `${roundIdx * 100}ms` }}
            >
              <div className="text-left border-b border-white/5 pb-2">
                  <h3 className={`text-sm font-black uppercase tracking-[0.2em] italic text-brand-light`}>
                      {roundName}
                  </h3>
              </div>

              <div className="flex flex-col gap-10 flex-grow justify-center">
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
              </div>
            </div>
          );
        })}

        {/* Final Winner Slot (Sesuai referensi ada piala) */}
        <div className="flex flex-col items-center justify-center pt-20 px-8">
            <div className="relative group">
                <div className="absolute -inset-8 bg-brand-special/10 blur-3xl rounded-full group-hover:bg-brand-special/20 transition-all duration-700"></div>
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-brand-secondary to-black border border-brand-special/30 flex items-center justify-center relative z-10 shadow-2xl">
                    <Trophy size={48} className="text-brand-special animate-pulse" />
                </div>
                <div className="mt-4 text-center">
                    <span className="text-[10px] font-black text-brand-special uppercase tracking-[0.3em]">Champion</span>
                    <div className="w-full h-px bg-brand-special/20 my-1"></div>
                    <div className="text-white text-[9px] font-bold opacity-30 italic">Glory Awaits</div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Watermark Logo like image */}
      <div className="absolute bottom-4 right-10 opacity-30 pointer-events-none">
          <div className="flex items-center gap-3">
              <Shield size={60} className="text-brand-vibrant" />
              <div className="flex flex-col">
                  <span className="text-3xl font-black text-white italic tracking-tighter">WakaEFLeague</span>
              </div>
          </div>
      </div>
    </div>
  );
};
