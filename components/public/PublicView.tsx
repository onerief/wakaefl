
import React, { useState, useMemo, useEffect } from 'react';
import type { Group, Match, KnockoutStageRounds, Team, KnockoutMatch, TournamentMode } from '../../types';
import { GroupStage } from './GroupStage';
import { MatchCard } from './MatchList';
import { KnockoutStageView } from './KnockoutStageView';
import { RulesView } from './RulesView';
import { StatsStandings } from './StatsStandings';
import { Users, ListChecks, Trophy, BookOpen, Crown, ChevronDown, Zap, ShieldCheck, Star, Lock, Calendar, Info, BarChart3 } from 'lucide-react';
import type { User } from 'firebase/auth';

interface PublicViewProps {
  mode: TournamentMode;
  groups: Group[];
  matches: Match[];
  knockoutStage: KnockoutStageRounds | null;
  rules: string;
  onSelectTeam: (team: Team) => void;
  currentUser?: User | null;
  onAddMatchComment?: (matchId: string, text: string) => void;
  isAdmin?: boolean;
  onUpdateMatchScore?: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
  onUpdateKnockoutScore?: (matchId: string, data: Partial<KnockoutMatch> & { round: keyof KnockoutStageRounds }) => void;
  userOwnedTeamIds?: string[];
  clubStats?: any[];
}

type PublicTab = 'groups' | 'fixtures' | 'knockout' | 'final' | 'stats' | 'rules';

const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`relative px-6 py-3 text-sm font-black italic uppercase transition-all duration-300 flex items-center gap-2 ${
            isActive ? 'text-brand-vibrant scale-105' : 'text-brand-light hover:text-brand-text'
        }`}
    >
        {children}
        <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-brand-vibrant rounded-full transition-all duration-300 ${isActive ? 'opacity-100 shadow-[0_0_8px_rgba(37,99,235,0.8)]' : 'opacity-0 w-0'}`}></span>
    </button>
);

const MobileTabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
}> = ({ isActive, onClick, label, icon }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative overflow-hidden group ${
            isActive ? 'text-brand-vibrant bg-white/[0.04]' : 'text-brand-light'
        }`}
    >
        <div className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
            {icon}
        </div>
        <span className={`text-[9px] font-black tracking-tight uppercase leading-none transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}>
            {label}
        </span>
        {isActive && (
            <div className="absolute top-0 inset-x-0 flex justify-center">
                <div className="w-8 h-1 bg-brand-vibrant shadow-[0_0_12px_rgba(37,99,235,1)] rounded-full"></div>
            </div>
        )}
    </button>
);

export const PublicView: React.FC<PublicViewProps> = ({ 
    mode, groups, matches, knockoutStage, rules, onSelectTeam, 
    currentUser, onAddMatchComment, isAdmin, onUpdateMatchScore, onUpdateKnockoutScore,
    userOwnedTeamIds = [], clubStats = []
}) => {
  const [activeTab, setActiveTab] = useState<PublicTab>('groups');
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const [isAdminModeActive, setIsAdminModeActive] = useState(false);
  const [focusMyTeam, setFocusMyTeam] = useState(false);

  const hasMyTeam = userOwnedTeamIds.length > 0;
  
  // LOGIC: Show Knockout Tabs if mode supports it (2 Regions or WAKACL)
  const supportsKnockout = mode === 'two_leagues' || mode === 'wakacl';
  const koLabel = mode === 'two_leagues' ? 'Semi Final' : 'Knockout';

  useEffect(() => {
    if (groups.length === 0 || matches.length === 0) return;

    const newSelections = { ...selectedMatchdays };
    let hasChanged = false;

    groups.forEach(g => {
        if (newSelections[g.id]) return;

        const groupLetter = g.name.replace('Group ', '').trim();
        const groupMatches = matches.filter(m => 
            m.group === g.id || m.group === groupLetter || m.group === g.name
        );

        if (groupMatches.length === 0) return;

        const nextMatch = groupMatches
            .sort((a, b) => {
                if (a.leg !== b.leg) return (a.leg || 1) - (b.leg || 1);
                return (a.matchday || 1) - (b.matchday || 1);
            })
            .find(m => m.status !== 'finished');

        const defaultLeg = nextMatch?.leg || 1;
        const defaultDay = nextMatch?.matchday || 1;
        
        newSelections[g.id] = `L${defaultLeg}-D${defaultDay}`;
        hasChanged = true;
    });

    if (hasChanged) setSelectedMatchdays(newSelections);
  }, [matches, groups, activeTab]);

  const AdminToggle = () => {
      if (!isAdmin) return null;
      return (
          <div className="flex justify-center mb-4 px-2">
              <button 
                onClick={() => setIsAdminModeActive(!isAdminModeActive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isAdminModeActive ? 'bg-brand-special text-brand-primary' : 'bg-brand-vibrant/10 text-brand-vibrant border border-brand-vibrant/30'}`}>
                  {isAdminModeActive ? '⚡ Admin Mode: ON' : 'Akses Admin'}
              </button>
          </div>
      );
  };

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
                            <h3 className="text-white text-base font-black uppercase italic tracking-tight">Timeline Tim Anda</h3>
                            <p className="text-[10px] text-brand-light font-bold uppercase opacity-60">Seluruh jadwal Anda di grup ini</p>
                        </div>
                    </div>
                    <button onClick={() => setFocusMyTeam(false)} className="px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-[10px] font-black uppercase text-brand-vibrant hover:bg-brand-vibrant hover:text-white transition-all">Lihat Semua</button>
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
                
                const leg1Matches = groupMatches.filter(m => m.leg === 1);
                const isLeg1Finished = leg1Matches.length > 0 && leg1Matches.every(m => m.status === 'finished');
                
                const leg1Days = Array.from(new Set(groupMatches.filter(m => m.leg === 1).map(m => m.matchday))).filter((d): d is number => d !== undefined).sort((a, b) => a - b);
                const leg2Days = Array.from(new Set(groupMatches.filter(m => m.leg === 2).map(m => m.matchday))).filter((d): d is number => d !== undefined).sort((a, b) => a - b);

                const schedule = groupMatches.reduce((acc, match) => {
                    const key = `L${match.leg || 1}-D${match.matchday || 1}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(match);
                    return acc;
                }, {} as Record<string, Match[]>);

                const activeScheduleKey = selectedMatchdays[group.id] || (leg1Days.length > 0 ? `L1-D${leg1Days[0]}` : '');
                
                const isSelectedLeg2 = activeScheduleKey.startsWith('L2');
                const isLocked = isSelectedLeg2 && !isLeg1Finished && !isAdminModeActive;

                return (
                    <div key={`${group.id}-fixtures`} className="flex flex-col bg-brand-secondary/30 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative group/card min-h-[400px]">
                        <div className="p-5 bg-black/40 border-b border-white/5 flex justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-vibrant/10 flex items-center justify-center text-brand-vibrant border border-brand-vibrant/20 shadow-inner">
                                    <Calendar size={20} />
                                </div>
                                <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{group.name}</h4>
                            </div>
                            
                            <div className="relative">
                                <select
                                    value={activeScheduleKey}
                                    onChange={(e) => setSelectedMatchdays(prev => ({...prev, [group.id]: e.target.value}))}
                                    className="appearance-none pl-4 pr-10 py-2.5 bg-brand-primary border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-vibrant transition-all cursor-pointer shadow-lg"
                                >
                                    {leg1Days.length > 0 && (
                                        <optgroup label="PUTARAN 1 (LEG 1)" className="bg-brand-primary text-brand-vibrant">
                                            {leg1Days.map(d => <option key={`L1-D${d}`} value={`L1-D${d}`}>Matchday {d}</option>)}
                                        </optgroup>
                                    )}
                                    {leg2Days.length > 0 && (
                                        <optgroup label="PUTARAN 2 (LEG 2)" className="bg-brand-primary text-brand-special">
                                            {leg2Days.map(d => (
                                                <option key={`L2-D${d}`} value={`L2-D${d}`}>Matchday {d} (Leg 2)</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-light pointer-events-none" />
                            </div>
                        </div>

                        <div className="p-4 flex-grow relative overflow-y-auto custom-scrollbar">
                            {isLocked ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500 h-full">
                                    <div className="w-16 h-16 bg-brand-vibrant/10 rounded-full flex items-center justify-center mb-5 text-brand-vibrant ring-1 ring-brand-vibrant/30">
                                        <Lock size={32} />
                                    </div>
                                    <h5 className="text-sm font-black uppercase text-white tracking-widest mb-2 italic">Leg 2 Terkunci</h5>
                                    <p className="text-[10px] text-brand-light leading-relaxed max-w-[200px] opacity-70">
                                        Selesaikan seluruh pertandingan <span className="text-brand-vibrant font-bold">Putaran 1</span> untuk membuka Leg 2.
                                    </p>
                                </div>
                            ) : schedule[activeScheduleKey] ? (
                                <div className="space-y-3 animate-in slide-in-from-bottom-3 duration-500">
                                    {schedule[activeScheduleKey].map(match => (
                                        <MatchCard key={match.id} match={match} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateMatchScore} currentUser={currentUser} onAddComment={onAddMatchComment} isAdmin={isAdmin} userOwnedTeamIds={userOwnedTeamIds} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 opacity-20 italic font-black uppercase tracking-widest text-xs">Belum ada jadwal</div>
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
      case 'groups':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter px-1 flex items-center gap-4">
                <span>Group Standings</span>
                <div className="h-px flex-grow bg-gradient-to-r from-brand-vibrant/50 to-transparent"></div>
            </h2>
            {groups.length > 0 ? (
                <GroupStage groups={groups} onSelectTeam={onSelectTeam} userOwnedTeamIds={userOwnedTeamIds} />
            ) : (
                <div className="text-center bg-brand-secondary/30 border border-white/5 p-16 rounded-[2rem] opacity-30">Menyiapkan data...</div>
            )}
          </div>
        );
      case 'fixtures':
        return (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4 px-1">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Match Fixtures</h2>
                    <div className="px-3 py-1 bg-brand-vibrant/10 border border-brand-vibrant/30 rounded-full">
                         <span className="text-[10px] font-black text-brand-vibrant uppercase tracking-widest animate-pulse">Live Schedule</span>
                    </div>
                </div>
                {hasMyTeam && (
                    <button onClick={() => setFocusMyTeam(!focusMyTeam)} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all shadow-xl border ${focusMyTeam ? 'bg-brand-vibrant text-white border-brand-vibrant' : 'bg-brand-secondary text-brand-light border-white/10 hover:border-brand-vibrant/40'}`}>
                        <Star size={16} className={focusMyTeam ? 'fill-white' : ''} /> {focusMyTeam ? 'Lihat Semua' : 'Fokus Tim Saya'}
                    </button>
                )}
            </div>
            <AdminToggle />
            {groups.length > 0 ? renderFixtures() : <div className="text-center py-32 opacity-30 font-black italic">Jadwal Belum Dirilis</div>}
          </div>
        );
      case 'knockout':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter px-1">{koLabel} Stage</h2>
            <AdminToggle />
            <KnockoutStageView knockoutStage={knockoutStage || {}} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateKnockoutScore} userOwnedTeamIds={userOwnedTeamIds} />
          </div>
        );
      case 'final':
        return (
           <div className="space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black text-yellow-400 italic uppercase tracking-tighter px-1 flex items-center gap-4">
                <Crown size={40} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" /> 
                <span>Ultimate Grand Final</span>
            </h2>
            <AdminToggle />
            <KnockoutStageView knockoutStage={{ Final: knockoutStage?.Final || [] }} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateKnockoutScore} userOwnedTeamIds={userOwnedTeamIds} />
          </div>
        );
      case 'stats':
          return (
            <div className="space-y-6">
                 <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter px-1 flex items-center gap-4">
                    <BarChart3 className="text-brand-special" size={32} />
                    <span>Peringkat Produktivitas Klub</span>
                </h2>
                <StatsStandings clubStats={clubStats} />
            </div>
          )
      case 'rules': return <RulesView rules={rules} />;
      default: return null;
    }
  }

  return (
    <div className="space-y-6 pb-32 md:pb-12">
        {/* Desktop Navigation Sub-Tabs */}
        <div className="hidden md:flex justify-center mb-10 sticky top-32 z-30">
            <div className="flex bg-brand-secondary/90 backdrop-blur-2xl p-1.5 rounded-full border border-white/10 shadow-2xl">
                <TabButton isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')}><Users size={16}/> <span>Groups</span></TabButton>
                <TabButton isActive={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')}><ListChecks size={16}/> <span>Fixtures</span></TabButton>
                {supportsKnockout && (
                    <>
                        <TabButton isActive={activeTab === 'knockout'} onClick={() => setActiveTab('knockout')}><Trophy size={16}/> <span>{koLabel}</span></TabButton>
                        <TabButton isActive={activeTab === 'final'} onClick={() => setActiveTab('final')}><Crown size={16} className="text-yellow-400"/> <span className="text-yellow-100">Final</span></TabButton>
                    </>
                )}
                <TabButton isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')}><BarChart3 size={16} className="text-brand-special"/> <span>Stats</span></TabButton>
                <TabButton isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')}><BookOpen size={16}/> <span>Rules</span></TabButton>
            </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">{renderContent()}</div>

        {/* Mobile Navigation Navigation (Bottom) - Dynamic Grid Columns */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-secondary/95 backdrop-blur-2xl border-t border-white/10 z-[80] h-[72px] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
             <div className={`grid ${supportsKnockout ? 'grid-cols-6' : 'grid-cols-4'} h-full items-center px-1`}>
                <MobileTabButton isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')} label="Grup" icon={<Users size={18} />} />
                <MobileTabButton isActive={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')} label="Jadwal" icon={<ListChecks size={18} />} />
                {supportsKnockout && (
                    <>
                        <MobileTabButton isActive={activeTab === 'knockout'} onClick={() => setActiveTab('knockout')} label={mode === 'two_leagues' ? 'SF' : 'KO'} icon={<Trophy size={18} />} />
                        <MobileTabButton isActive={activeTab === 'final'} onClick={() => setActiveTab('final')} label="Final" icon={<Crown size={18} className={activeTab === 'final' ? 'text-yellow-500' : ''} />} />
                    </>
                )}
                <MobileTabButton isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="Stats" icon={<BarChart3 size={18} className={activeTab === 'stats' ? 'text-brand-special' : ''} />} />
                <MobileTabButton isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')} label="Aturan" icon={<BookOpen size={18} />} />
             </div>
        </div>
    </div>
  );
};
