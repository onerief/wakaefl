
import React, { useState, useMemo, useEffect } from 'react';
import type { Group, Match, KnockoutStageRounds, Team, KnockoutMatch, TournamentMode, SeasonHistory } from '../../types';
import { GroupStage } from './GroupStage';
import { MatchCard } from './MatchList';
import { KnockoutStageView } from './KnockoutStageView';
import { RulesModal } from './RulesModal'; // Updated import
import { StatsStandings } from './StatsStandings';
import { Users, ListChecks, Trophy, BookOpen, Crown, ChevronDown, Zap, ShieldCheck, Star, Lock, Calendar, Info, BarChart3, Layout, Coffee } from 'lucide-react';
import type { User } from 'firebase/auth';
import { TeamLogo } from '../shared/TeamLogo';

interface PublicViewProps {
  mode: TournamentMode;
  groups: Group[];
  matches: Match[];
  knockoutStage: KnockoutStageRounds | null;
  rules: string;
  history: SeasonHistory[];
  onSelectTeam: (team: Team) => void;
  currentUser?: User | null;
  onAddMatchComment?: (matchId: string, text: string) => void;
  isAdmin?: boolean;
  onUpdateMatchScore?: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
  onUpdateKnockoutScore?: (matchId: string, data: Partial<KnockoutMatch> & { round: keyof KnockoutStageRounds }) => void;
  userOwnedTeamIds?: string[];
  clubStats?: any[];
  playerStats?: { topScorers: any[], topAssists: any[] };
}

type PublicTab = 'groups' | 'fixtures' | 'knockout' | 'stats'; 

const InternalTabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    label: string;
    icon: any;
}> = ({ isActive, onClick, label, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`
            group relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 
            py-2.5 sm:py-3 rounded-xl transition-all w-full border overflow-hidden
            ${isActive 
                ? 'bg-brand-vibrant/10 border-brand-vibrant/30 text-brand-vibrant shadow-[inset_0_0_15px_rgba(37,99,235,0.15)]' 
                : 'bg-white/[0.02] border-transparent hover:bg-white/5 text-brand-light/50 hover:text-brand-light'}
        `}
    >
        <Icon 
            size={16} 
            className={`transition-colors sm:w-[18px] sm:h-[18px] ${isActive ? 'fill-brand-vibrant/20' : 'group-hover:text-brand-light'}`} 
        />
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight leading-none truncate w-full sm:w-auto text-center">
            {label}
        </span>
        {isActive && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-vibrant shadow-[0_0_8px_#2563eb] sm:hidden"></span>
        )}
    </button>
);

export const PublicView: React.FC<PublicViewProps> = ({ 
    mode, groups, matches, knockoutStage, rules, history, onSelectTeam, 
    currentUser, onAddMatchComment, isAdmin, onUpdateMatchScore, onUpdateKnockoutScore,
    userOwnedTeamIds = [], clubStats = [], playerStats = { topScorers: [], topAssists: [] }
}) => {
  const [activeTab, setActiveTab] = useState<PublicTab>('groups');
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const [isAdminModeActive, setIsAdminModeActive] = useState(false);
  const [focusMyTeam, setFocusMyTeam] = useState(false);
  const [showRules, setShowRules] = useState(false); 

  const hasMyTeam = userOwnedTeamIds.length > 0;
  const supportsKnockout = mode === 'two_leagues' || mode === 'wakacl';

  useEffect(() => {
    if (groups.length === 0 || matches.length === 0) return;
    const newSelections = { ...selectedMatchdays };
    let hasChanged = false;

    groups.forEach(g => {
        if (newSelections[g.id]) return;
        const groupLetter = g.name.replace('Group ', '').trim();
        const groupMatches = matches.filter(m => m.group === g.id || m.group === groupLetter || m.group === g.name);
        if (groupMatches.length === 0) return;
        const nextMatch = groupMatches.sort((a, b) => {
                if (a.leg !== b.leg) return (a.leg || 1) - (b.leg || 1);
                return (a.matchday || 1) - (b.matchday || 1);
            }).find(m => m.status !== 'finished');
        const defaultLeg = nextMatch?.leg || 1;
        const defaultDay = nextMatch?.matchday || 1;
        newSelections[g.id] = `L${defaultLeg}-D${defaultDay}`;
        hasChanged = true;
    });
    if (hasChanged) setSelectedMatchdays(newSelections);
  }, [matches, groups, mode]);

  const renderFixtures = () => {
    if (focusMyTeam && hasMyTeam) {
        const myMatches = matches.filter(m => 
            userOwnedTeamIds.includes(m.teamA.id) || userOwnedTeamIds.includes(m.teamB.id)
        ).sort((a, b) => (a.matchday || 0) - (b.matchday || 0));

        return (
            <div className="space-y-4 max-w-4xl mx-auto">
                <div className="bg-brand-vibrant/10 border border-brand-vibrant/20 p-5 rounded-[1.5rem] flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-vibrant/20 rounded-2xl text-brand-vibrant border border-brand-vibrant/20"><Star size={24} className="fill-brand-vibrant" /></div>
                        <div>
                            <h3 className="text-white text-sm sm:text-base font-black uppercase italic tracking-tight">Timeline Tim Anda</h3>
                            <p className="text-[10px] text-brand-light font-bold uppercase opacity-60">Seluruh jadwal Anda di grup ini</p>
                        </div>
                    </div>
                    <button onClick={() => setFocusMyTeam(false)} className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black uppercase text-brand-vibrant hover:bg-brand-vibrant hover:text-white transition-all">Lihat Semua</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {myMatches.map(match => (
                        <MatchCard key={match.id} match={match} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateMatchScore} currentUser={currentUser} onAddComment={onAddMatchComment} isAdmin={isAdmin} userOwnedTeamIds={userOwnedTeamIds} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map(group => {
                const groupLetter = group.name.replace('Group ', '').trim();
                const groupMatches = matches.filter(m => 
                    m.group === group.id || m.group === groupLetter || m.group === group.name
                );
                const schedule = groupMatches.reduce((acc, match) => {
                    const key = `L${match.leg || 1}-D${match.matchday || 1}`;
                    if (!acc[key]) acc[key] = []; acc[key].push(match); return acc;
                }, {} as Record<string, Match[]>);
                const leg1Days = Array.from(new Set(groupMatches.filter(m => m.leg === 1).map(m => m.matchday))).filter((d): d is number => d !== undefined).sort((a, b) => a - b);
                const leg2Days = Array.from(new Set(groupMatches.filter(m => m.leg === 2).map(m => m.matchday))).filter((d): d is number => d !== undefined).sort((a, b) => a - b);
                const activeScheduleKey = selectedMatchdays[group.id] || (leg1Days.length > 0 ? `L1-D${leg1Days[0]}` : '');
                
                const currentMatches = schedule[activeScheduleKey] || [];
                
                // Calculate BYE Teams
                const playingTeamIds = new Set<string>();
                currentMatches.forEach(m => {
                    playingTeamIds.add(m.teamA.id);
                    playingTeamIds.add(m.teamB.id);
                });
                const byeTeams = group.teams.filter(t => !playingTeamIds.has(t.id));

                return (
                    <div key={`${group.id}-fixtures`} className="flex flex-col bg-brand-secondary/30 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative group/card min-h-[300px]">
                        <div className="p-4 sm:p-5 bg-black/40 border-b border-white/5 flex justify-between items-center gap-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-vibrant/10 flex items-center justify-center text-brand-vibrant border border-brand-vibrant/20 shadow-inner">
                                    <Calendar size={18} />
                                </div>
                                <h4 className="text-base sm:text-xl font-black text-white uppercase italic tracking-tighter leading-none">{group.name}</h4>
                            </div>
                            <div className="relative">
                                <select value={activeScheduleKey} onChange={(e) => setSelectedMatchdays(prev => ({...prev, [group.id]: e.target.value}))} className="appearance-none pl-3 pr-8 py-2 bg-brand-primary border border-white/10 rounded-xl text-white text-[9px] font-black uppercase tracking-widest outline-none focus:border-brand-vibrant transition-all cursor-pointer shadow-lg">
                                    {leg1Days.length > 0 && (<optgroup label="PUTARAN 1 (LEG 1)" className="bg-brand-primary text-brand-vibrant">{leg1Days.map(d => <option key={`L1-D${d}`} value={`L1-D${d}`}>Matchday {d}</option>)}</optgroup>)}
                                    {leg2Days.length > 0 && (<optgroup label="PUTARAN 2 (LEG 2)" className="bg-brand-primary text-brand-special">{leg2Days.map(d => <option key={`L2-D${d}`} value={`L2-D${d}`}>Matchday {d} (Leg 2)</option>)}</optgroup>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-light pointer-events-none" />
                            </div>
                        </div>
                        <div className="p-3 sm:p-4 flex-grow relative overflow-y-auto custom-scrollbar">
                            {currentMatches.length > 0 ? (
                                <div className="space-y-3 animate-in slide-in-from-bottom-3 duration-500">
                                    {currentMatches.map(match => (
                                        <MatchCard key={match.id} match={match} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateMatchScore} currentUser={currentUser} onAddComment={onAddMatchComment} isAdmin={isAdmin} userOwnedTeamIds={userOwnedTeamIds} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 opacity-20 italic font-black uppercase tracking-widest text-[10px]">Belum ada jadwal</div>
                            )}

                            {/* BYE TEAMS INDICATOR */}
                            {byeTeams.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <Coffee size={12} className="text-brand-light opacity-60" />
                                        <span className="text-[10px] font-black text-brand-light uppercase tracking-widest opacity-60">Sedang Istirahat (BYE)</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {byeTeams.map(team => (
                                            <div key={team.id} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                                 <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-6 h-6" />
                                                 <span className="text-[10px] font-black text-white uppercase italic tracking-tight">{team.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'groups': return (<div className="space-y-6"><h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter px-1 flex items-center gap-4"><span>Group Standings</span><div className="h-px flex-grow bg-gradient-to-r from-brand-vibrant/50 to-transparent"></div></h2>{groups.length > 0 ? (<GroupStage groups={groups} onSelectTeam={onSelectTeam} userOwnedTeamIds={userOwnedTeamIds} history={history} />) : (<div className="text-center bg-brand-secondary/30 border border-white/5 p-16 rounded-[2rem] opacity-30">Menyiapkan data...</div>)}</div>);
      case 'fixtures': return (<div className="space-y-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1"><div className="flex items-center gap-4"><h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Match Fixtures</h2><div className="px-2 py-0.5 bg-brand-vibrant/10 border border-brand-vibrant/30 rounded-full"><span className="text-[8px] font-black text-brand-vibrant uppercase tracking-widest animate-pulse">Live</span></div></div>{hasMyTeam && (<button onClick={() => setFocusMyTeam(!focusMyTeam)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-xl border ${focusMyTeam ? 'bg-brand-vibrant text-white border-brand-vibrant' : 'bg-brand-secondary text-brand-light border-white/10 hover:border-brand-vibrant/40'}`}><Star size={14} className={focusMyTeam ? 'fill-white' : ''} /> {focusMyTeam ? 'Lihat Semua' : 'Fokus Tim Saya'}</button>)}</div>{groups.length > 0 ? renderFixtures() : <div className="text-center py-32 opacity-30 font-black italic">Jadwal Belum Dirilis</div>}</div>);
      case 'knockout': return (<div className="space-y-6"><h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter px-1 flex items-center gap-4"><span>{mode === 'two_leagues' ? 'Semi Final & Final' : 'Knockout Stage'}</span><div className="h-px flex-grow bg-gradient-to-r from-brand-special/50 to-transparent"></div></h2><KnockoutStageView knockoutStage={knockoutStage || {}} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateKnockoutScore} userOwnedTeamIds={userOwnedTeamIds} /></div>);
      case 'stats': return (<div className="space-y-6"><h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter px-1 flex items-center gap-4"><BarChart3 className="text-brand-special" size={24} /><span>Peringkat Statistik</span></h2><StatsStandings clubStats={clubStats} playerStats={playerStats} /></div>);
      default: return null;
    }
  }

  return (
    <div className="space-y-6">
        {/* SUB NAVIGATION - FIXED GRID LAYOUT - ALL ITEMS VISIBLE (NO SCROLL) */}
        <div className="sticky top-[56px] sm:top-[128px] z-[30] -mx-4 bg-brand-primary/95 backdrop-blur-xl border-b border-white/5 shadow-2xl">
            <div className="px-2 sm:px-4 py-2 sm:py-3 max-w-5xl mx-auto">
                <div className={`grid ${supportsKnockout ? 'grid-cols-5' : 'grid-cols-4'} gap-1.5 sm:gap-3`}>
                    <InternalTabButton 
                        isActive={activeTab === 'groups'} 
                        onClick={() => setActiveTab('groups')} 
                        label="Klasemen" 
                        icon={Users} 
                    />
                    <InternalTabButton 
                        isActive={activeTab === 'fixtures'} 
                        onClick={() => setActiveTab('fixtures')} 
                        label="Jadwal" 
                        icon={ListChecks} 
                    />
                    {supportsKnockout && (
                        <InternalTabButton 
                            isActive={activeTab === 'knockout'} 
                            onClick={() => setActiveTab('knockout')} 
                            label={mode === 'two_leagues' ? 'Finals' : 'Bagan'} 
                            icon={Trophy} 
                        />
                    )}
                    <InternalTabButton 
                        isActive={activeTab === 'stats'} 
                        onClick={() => setActiveTab('stats')} 
                        label="Stats" 
                        icon={BarChart3} 
                    />
                    
                    {/* Rules Button as a direct Grid Item - Same size as others */}
                    <button
                        onClick={() => setShowRules(true)}
                        className="group relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 rounded-xl transition-all w-full border bg-white/[0.02] border-transparent hover:bg-white/5 text-brand-light/50 hover:text-brand-light active:scale-95"
                    >
                        <BookOpen size={16} className="sm:w-[18px] sm:h-[18px] group-hover:text-brand-light" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight leading-none truncate w-full sm:w-auto text-center">
                            Rules
                        </span>
                    </button>
                </div>
            </div>
        </div>

        {isAdmin && (
            <div className="flex justify-center mt-2 px-4">
                 <button onClick={() => setIsAdminModeActive(!isAdminModeActive)} className={`w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isAdminModeActive ? 'bg-brand-special text-brand-primary shadow-[0_0_20px_rgba(253,224,71,0.4)]' : 'bg-brand-vibrant/10 text-brand-vibrant border border-brand-vibrant/30'}`}>
                    {isAdminModeActive ? '⚡ Edit Mode ON' : 'Aktifkan Edit Skor'}
                </button>
            </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 px-1 sm:px-0">{renderContent()}</div>

        {/* Rules Modal */}
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} rules={rules} />
    </div>
  );
};
