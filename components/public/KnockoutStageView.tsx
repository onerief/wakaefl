
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { KnockoutStageRounds, KnockoutMatch, Team } from '../../types';
import { Trophy, Crown, Info, Zap, Shield, Save, Minus, Plus, Loader, MapPin, Clock, ChevronLeft, ChevronRight, Star, CheckCircle2 } from 'lucide-react';
import { TeamLogo } from '../shared/TeamLogo';
import { useToast } from '../shared/Toast';

interface KnockoutStageViewProps {
  knockoutStage: Partial<KnockoutStageRounds>;
  onSelectTeam: (team: Team) => void;
  isAdminMode?: boolean;
  onUpdateScore?: (matchId: string, data: Partial<KnockoutMatch> & { round: keyof KnockoutStageRounds }) => void;
  userOwnedTeamIds?: string[];
}

// Utility to check if a knockout match is fully completed
const isMatchFinished = (match: KnockoutMatch): boolean => {
    const isFinal = match.round === 'Final';
    const leg1Done = match.scoreA1 !== null && match.scoreB1 !== null;
    const leg2Done = match.scoreA2 !== null && match.scoreB2 !== null;
    
    if (isFinal) return leg1Done && !!match.winnerId;
    return leg1Done && leg2Done && !!match.winnerId;
};

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
  isHome?: boolean;
  isOngoing?: boolean;
}

const KnockoutMatchTeam: React.FC<KnockoutMatchTeamProps> = ({ 
    team, placeholder, isWinner, onSelectTeam, isLoser, isAdminMode, editScore, onAdjust, isMyTeam, isHome, isOngoing
}) => {
    const hasTeam = !!team;
    const Wrapper = hasTeam ? 'button' : 'div';
    const wrapperProps = hasTeam ? { onClick: () => onSelectTeam(team!) } : {};

    return (
        <div className="flex flex-col gap-1 w-full relative">
            <Wrapper 
                className={`
                    relative flex items-center gap-2 sm:gap-3 w-full h-12 sm:h-16 px-3 sm:px-4 rounded-xl text-left transition-all duration-500 shadow-xl border
                    ${isWinner 
                        ? 'bg-brand-vibrant text-white scale-[1.02] sm:scale-[1.05] z-10 border-white/20 shadow-[0_0_20px_rgba(37,99,235,0.4)] ring-2 ring-brand-vibrant' 
                        : isLoser 
                            ? 'bg-white/5 grayscale opacity-40 text-brand-light border-white/5'
                            : isMyTeam 
                                ? 'bg-white/10 text-white border-brand-special shadow-[0_0_15px_rgba(253,224,71,0.2)]'
                                : 'bg-white/5 text-brand-text border-white/10 hover:border-white/30'
                    }
                    ${isOngoing && !isWinner ? 'border-brand-vibrant/20 bg-white/[0.07]' : ''}
                `} 
                {...wrapperProps}
            >
                {team ? (
                    <>
                        <div className="relative shrink-0">
                            <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className={`w-7 h-7 sm:w-10 sm:h-10 transition-transform duration-700 ${isWinner ? 'scale-110' : ''}`} />
                            {isWinner && (
                                <div className="absolute -top-1.5 -right-1.5 bg-brand-special rounded-full p-0.5 shadow-lg border border-brand-primary animate-bounce">
                                    <Crown size={10} className="text-brand-primary sm:w-3 sm:h-3" />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className={`block text-[10px] sm:text-sm truncate uppercase tracking-tight font-black leading-none`}>
                                    {team.name}
                                </span>
                                <span className={`text-[6px] sm:text-[7px] font-black px-1 rounded border ${isWinner ? 'border-white/20 bg-white/10' : 'border-white/5 bg-black/20 text-brand-light/50'}`}>
                                    {isHome ? 'H' : 'A'}
                                </span>
                            </div>
                            {isWinner && (
                                <span className="text-[6px] sm:text-[7px] font-black text-brand-special uppercase tracking-[0.2em] mt-0.5 sm:mt-1 block animate-pulse">Qualified</span>
                            )}
                            {isOngoing && !isWinner && (
                                <span className="text-[6px] sm:text-[7px] font-bold text-brand-vibrant/60 uppercase tracking-widest mt-0.5 sm:mt-1 block">Competing</span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2 w-full opacity-20">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-brand-light border border-white/5">
                            <Shield size={8} />
                        </div>
                        <span className="italic text-[8px] sm:text-[9px] uppercase font-black tracking-widest truncate">{placeholder}</span>
                    </div>
                )}
            </Wrapper>
            
            {isAdminMode && team && onAdjust && (
                <div className="flex items-center justify-center gap-2 bg-black/60 rounded-lg p-0.5 mx-1 mt-1 border border-white/10 scale-90">
                    <button onClick={(e) => { e.stopPropagation(); onAdjust(-1); }} className="text-brand-light hover:text-red-400 p-1"><Minus size={10}/></button>
                    <span className="text-[10px] font-black text-brand-special min-w-[12px] text-center">{editScore}</span>
                    <button onClick={(e) => { e.stopPropagation(); onAdjust(1); }} className="text-brand-light hover:text-green-400 p-1"><Plus size={10}/></button>
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
    const [showBreakdown, setShowBreakdown] = useState(false);
    const { addToast } = useToast();

    const isLeg1Done = sA1 !== null && sB1 !== null;
    const isLeg2Done = sA2 !== null && sB2 !== null;
    const isFinished = isFinal ? isLeg1Done : (isLeg1Done && isLeg2Done);
    const isOngoing = isLeg1Done && !isFinished;
    
    const aggA = (sA1 ?? 0) + (sA2 ?? 0);
    const aggB = (sB1 ?? 0) + (sB2 ?? 0);
    
    const isTeamAWinner = isFinished && match.winnerId === match.teamA?.id;
    const isTeamBWinner = isFinished && match.winnerId === match.teamB?.id;
    const anyWinner = isTeamAWinner || isTeamBWinner;
    
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
        <div className="relative py-2 sm:py-4 w-full">
            {!isFinal && (
                <div className="hidden lg:block absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-px bg-white/10 z-0">
                    <div className={`h-full bg-brand-vibrant transition-all duration-1000 shadow-[0_0_10px_#2563eb] ${anyWinner ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
                </div>
            )}

            <div className="flex flex-col gap-2 sm:gap-3 relative z-10 w-full animate-in zoom-in-95 duration-500">
                <KnockoutMatchTeam 
                    team={match.teamA} 
                    placeholder={match.placeholderA}
                    isWinner={isTeamAWinner}
                    isLoser={isFinished && !isTeamAWinner && !!match.teamA}
                    onSelectTeam={onSelectTeam}
                    isAdminMode={isAdminMode}
                    editScore={isAdminMode ? eA1 : undefined}
                    onAdjust={(d) => setEA1(v => Math.max(0, v + d))}
                    isMyTeam={match.teamA ? userOwnedTeamIds.includes(match.teamA.id) : false}
                    isHome={true}
                    isOngoing={isOngoing}
                />
                
                <div className="flex flex-col items-center py-0.5">
                    {isFinished ? (
                        <div className="relative">
                            <button 
                                onClick={() => !isFinal && setShowBreakdown(!showBreakdown)}
                                className="bg-brand-primary border border-brand-vibrant/30 px-3 sm:px-5 py-1 sm:py-2 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group/agg ring-1 ring-brand-vibrant/20"
                            >
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <span className="text-sm sm:text-xl font-black italic text-white leading-none">
                                        {isFinal ? `${sA1}-${sB1}` : `${aggA}-${aggB}`}
                                    </span>
                                    {!isFinal && (
                                        <div className="p-0.5 sm:p-1 bg-white/10 rounded-full text-brand-vibrant group-hover/agg:bg-brand-vibrant group-hover/agg:text-white transition-colors">
                                            <Info size={10} className="sm:w-3 sm:h-3" />
                                        </div>
                                    )}
                                </div>
                            </button>
                            
                            {showBreakdown && !isFinal && (
                                <div className="absolute top-[120%] left-1/2 -translate-x-1/2 w-44 sm:w-52 bg-brand-secondary border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl z-[50] animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex justify-between items-center bg-white/5 p-1.5 sm:p-2 rounded-xl">
                                            <span className="text-[7px] sm:text-[9px] font-black text-brand-light uppercase">Leg 1 (A-H)</span>
                                            <span className="text-[10px] sm:text-xs font-black text-white">{sA1}-{sB1}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 p-1.5 sm:p-2 rounded-xl">
                                            <span className="text-[7px] sm:text-[9px] font-black text-brand-light uppercase">Leg 2 (B-H)</span>
                                            <span className="text-[10px] sm:text-xs font-black text-white">{sA2}-{sB2}</span>
                                        </div>
                                        <div className="h-px bg-white/10 my-1"></div>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[8px] sm:text-[10px] font-black text-brand-vibrant uppercase">Agg</span>
                                            <span className="text-xs sm:text-sm font-black text-white">{aggA}-{aggB}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : isOngoing ? (
                        <div className="flex flex-col items-center gap-1">
                            <div className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest bg-brand-vibrant px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] animate-pulse flex items-center gap-1.5">
                                <Zap size={10} className="fill-white sm:w-3 sm:h-3" /> 1ST LEG: {sA1}-{sB1}
                            </div>
                            <div className="flex items-center gap-1 text-brand-light/40 animate-in fade-in duration-1000">
                                <Clock size={7} className="sm:w-2 sm:h-2" />
                                <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.2em]">Wait for L2</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-px h-3 sm:h-6 bg-gradient-to-b from-white/10 to-transparent"></div>
                            <span className="text-[7px] sm:text-[9px] font-black text-brand-light/20 uppercase tracking-[0.4em] py-0.5">vs</span>
                            <div className="w-px h-3 sm:h-6 bg-gradient-to-t from-white/10 to-transparent"></div>
                        </div>
                    )}
                </div>

                <KnockoutMatchTeam 
                    team={match.teamB} 
                    placeholder={match.placeholderB}
                    isWinner={isTeamBWinner}
                    isLoser={isFinished && !isTeamBWinner && !!match.teamB}
                    onSelectTeam={onSelectTeam}
                    isAdminMode={isAdminMode}
                    editScore={isAdminMode ? eB1 : undefined}
                    onAdjust={(d) => setEB1(v => Math.max(0, v + d))}
                    isMyTeam={match.teamB ? userOwnedTeamIds.includes(match.teamB.id) : false}
                    isHome={false}
                    isOngoing={isOngoing}
                />
            </div>

            {isAdminMode && (
                <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2 sm:space-y-3 relative z-20">
                    {!isFinal && (
                         <div className="flex items-center justify-between gap-2 px-1">
                            <div className="flex-1 flex flex-col items-center gap-0.5">
                                <span className="text-[6px] sm:text-[8px] font-black text-brand-light uppercase">L2: A</span>
                                <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 p-1 rounded-xl border border-white/5">
                                    <button onClick={() => setEA2(v => Math.max(0, v-1))} className="text-brand-light hover:text-red-400 p-0.5"><Minus size={10}/></button>
                                    <span className="text-xs font-black text-brand-special min-w-[15px] text-center">{eA2}</span>
                                    <button onClick={() => setEA2(v => v+1)} className="text-brand-light hover:text-green-400 p-0.5"><Plus size={10}/></button>
                                </div>
                            </div>
                            <span className="text-brand-light/20 font-black text-[10px]">|</span>
                            <div className="flex-1 flex flex-col items-center gap-0.5">
                                <span className="text-[6px] sm:text-[8px] font-black text-brand-light uppercase">L2: B</span>
                                <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 p-1 rounded-xl border border-white/5">
                                    <button onClick={() => setEB2(v => Math.max(0, v-1))} className="text-brand-light hover:text-red-400 p-0.5"><Minus size={10}/></button>
                                    <span className="text-xs font-black text-brand-special min-w-[15px] text-center">{eB2}</span>
                                    <button onClick={() => setEB2(v => v+1)} className="text-brand-light hover:text-green-400 p-0.5"><Plus size={10}/></button>
                                </div>
                            </div>
                         </div>
                    )}
                    <button onClick={handleSave} disabled={isSaving} className="w-full text-[8px] sm:text-[10px] font-black text-white uppercase bg-brand-vibrant py-2 sm:py-3 rounded-xl shadow-lg shadow-brand-vibrant/20 hover:bg-blue-600 transition-all active:scale-95">
                        {isSaving ? <Loader className="animate-spin inline mr-1 sm:mr-2" size={10} /> : <Save size={10} className="inline mr-1 sm:mr-2" />} SAVE RESULTS
                    </button>
                </div>
            )}
        </div>
    )
}

export const KnockoutStageView: React.FC<KnockoutStageViewProps> = ({ knockoutStage, onSelectTeam, isAdminMode, onUpdateScore, userOwnedTeamIds = [] }) => {
  const roundOrder: Array<keyof KnockoutStageRounds> = ['Play-offs', 'Quarter-finals', 'Semi-finals', 'Final'];
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);
  const initialFocusSet = useRef(false);

  const availableRounds = useMemo(() => {
      return roundOrder.filter(round => knockoutStage[round] && knockoutStage[round]!.length > 0);
  }, [knockoutStage]);

  // SMART LOGIC: Auto-focus and Auto-switch
  useEffect(() => {
    if (availableRounds.length === 0) return;

    // Find the first round that is NOT finished
    let currentIncompleteIdx = availableRounds.findIndex(roundName => {
        const matches = knockoutStage[roundName] || [];
        return matches.length > 0 && !matches.every(m => isMatchFinished(m));
    });

    // If all available rounds are finished, focus on the last one (Final)
    if (currentIncompleteIdx === -1) {
        currentIncompleteIdx = availableRounds.length - 1;
    }

    // Only set the initial focus once on component mount or major data refresh
    if (!initialFocusSet.current) {
        setActiveRoundIdx(currentIncompleteIdx);
        initialFocusSet.current = true;
    } else {
        // If we are currently watching a round and it BECOMES finished,
        // automatically move to the next one
        const matchesInActiveRound = knockoutStage[availableRounds[activeRoundIdx]] || [];
        if (matchesInActiveRound.length > 0 && matchesInActiveRound.every(m => isMatchFinished(m))) {
            if (activeRoundIdx < availableRounds.length - 1) {
                // Short delay for better UX before shifting
                const timer = setTimeout(() => {
                    setActiveRoundIdx(prev => prev + 1);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }
  }, [knockoutStage, availableRounds]);

  const finalMatch = knockoutStage.Final && knockoutStage.Final.length > 0 ? knockoutStage.Final[0] : null;
  const winnerTeam = finalMatch && finalMatch.winnerId ? (finalMatch.winnerId === finalMatch.teamA?.id ? finalMatch.teamA : finalMatch.teamB) : null;

  if (availableRounds.length === 0) return (
      <div className="py-20 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
          <Trophy size={48} className="mx-auto text-brand-light/20 mb-4" />
          <p className="text-brand-light italic uppercase tracking-widest text-xs font-black">Bagan belum tersedia untuk musim ini</p>
      </div>
  );

  const activeRoundName = availableRounds[activeRoundIdx];
  const activeRoundFinished = (knockoutStage[activeRoundName] || []).every(m => isMatchFinished(m));

  return (
    <div className="w-full relative pb-10">
      
      {/* Champion Spotlight - Show if we have a winner */}
      {winnerTeam && (
          <div className="max-w-xl mx-auto mb-16 text-center animate-in fade-in zoom-in duration-1000">
              <div className="relative inline-block group">
                  <div className="absolute -inset-10 bg-brand-special/20 blur-3xl rounded-full animate-pulse-slow"></div>
                  <div className="relative bg-gradient-to-b from-brand-special/20 to-transparent border border-brand-special/30 p-8 rounded-[3rem] shadow-2xl">
                      <div className="flex flex-col items-center">
                          <Crown size={48} className="text-brand-special fill-brand-special mb-4 animate-bounce" />
                          <TeamLogo logoUrl={winnerTeam.logoUrl} teamName={winnerTeam.name} className="w-24 h-24 sm:w-32 sm:h-32 mb-4 ring-4 ring-brand-special/50 shadow-[0_0_30px_rgba(253,224,71,0.5)]" />
                          <h3 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter mb-1">{winnerTeam.name}</h3>
                          <div className="px-4 py-1 bg-brand-special rounded-full">
                              <span className="text-[10px] sm:text-xs font-black text-brand-primary uppercase tracking-widest">WAKACL CHAMPION</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Round Selection - Mobile & Desktop Header */}
      <div className="flex flex-col gap-4 mb-8 px-2 animate-in slide-in-from-top duration-500">
          <div className="flex items-center justify-between bg-brand-secondary/80 border border-white/10 rounded-2xl p-1.5 shadow-xl backdrop-blur-md max-w-2xl mx-auto w-full">
              <button 
                onClick={() => setActiveRoundIdx(prev => Math.max(0, prev - 1))}
                disabled={activeRoundIdx === 0}
                className="p-3 text-brand-light hover:text-white disabled:opacity-20 transition-all active:scale-75"
              >
                  <ChevronLeft size={24} />
              </button>
              
              <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[8px] font-black text-brand-vibrant uppercase tracking-[0.4em]">Fase Turnamen</span>
                      {activeRoundFinished && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[6px] font-black uppercase tracking-widest border border-green-500/30">
                              <CheckCircle2 size={8} /> Selesai
                          </div>
                      )}
                  </div>
                  <h3 className="text-base sm:text-xl font-black text-white uppercase italic tracking-tight text-center truncate px-2">
                      {activeRoundName}
                  </h3>
              </div>

              <button 
                onClick={() => setActiveRoundIdx(prev => Math.min(availableRounds.length - 1, prev + 1))}
                disabled={activeRoundIdx === availableRounds.length - 1}
                className="p-3 text-brand-light hover:text-white disabled:opacity-20 transition-all active:scale-75"
              >
                  <ChevronRight size={24} />
              </button>
          </div>
      </div>

      {/* Main View Container */}
      <div className="w-full overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-12 lg:gap-32 lg:justify-center lg:min-w-full px-2 sm:px-10">
            
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-4 sm:p-10 flex flex-col items-end opacity-5 sm:opacity-10 pointer-events-none select-none overflow-hidden hidden lg:flex">
                <h2 className="text-4xl sm:text-8xl font-black text-white text-right italic leading-none tracking-tighter">
                    THE ROAD TO <br /> GLORY
                </h2>
                <div className="w-24 sm:w-48 h-1 sm:h-2 bg-brand-special mt-3 sm:mt-6"></div>
            </div>

            {/* Display ONLY the active round (Smart View) */}
            <div className="flex flex-col space-y-6 sm:space-y-12 transition-all duration-500 w-full max-w-4xl mx-auto">
              <div className="flex flex-col gap-4 sm:gap-12 flex-grow justify-around relative min-h-[400px]">
                {(knockoutStage[activeRoundName] || []).map(match => (
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

            {/* Final Trophy Section - Only show when watching the Final */}
            {activeRoundName === 'Final' && (
                <div className={`flex flex-col items-center justify-center pt-8 sm:pt-24 px-6 sm:px-12 w-full lg:w-auto animate-in zoom-in duration-700`}>
                    <div className="relative group">
                        <div className="absolute -inset-10 sm:-inset-16 bg-brand-vibrant/20 blur-[60px] sm:blur-[100px] rounded-full group-hover:bg-brand-vibrant/30 transition-all duration-1000"></div>
                        <div className="absolute -inset-6 sm:-inset-10 bg-brand-special/10 blur-[40px] sm:blur-[60px] rounded-full animate-pulse-slow"></div>
                        
                        <div className="relative w-24 h-24 sm:w-40 sm:h-40 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-brand-secondary via-black to-brand-primary border border-brand-special/40 flex items-center justify-center z-10 shadow-[0_0_50px_rgba(253,224,71,0.2)] hover:scale-110 transition-transform duration-700">
                            <div className="flex flex-col items-center">
                                <Trophy size={32} className="text-brand-special drop-shadow-[0_0_15px_rgba(253,224,71,0.5)] animate-float sm:w-[64px] sm:h-[64px]" />
                            </div>
                        </div>

                        <div className="mt-6 sm:mt-8 text-center relative z-20">
                            <span className="text-[10px] sm:text-[12px] font-black text-brand-special uppercase tracking-[0.4em] sm:tracking-[0.5em] block mb-1 sm:mb-2">Ultimate Glory</span>
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-special/50 to-transparent"></div>
                        </div>
                    </div>
                </div>
            )}
          </div>
      </div>
      
      <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none flex items-center gap-2 lg:gap-4 z-0">
          <Shield size={20} className="text-brand-vibrant lg:w-[40px] lg:h-[40px]" />
          <span className="text-xs lg:text-2xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap">WakaEFLeague Championship</span>
      </div>
    </div>
  );
};
