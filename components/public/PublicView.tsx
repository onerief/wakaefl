
import React, { useState, useMemo, useEffect } from 'react';
import type { Group, Match, KnockoutStageRounds, Team, KnockoutMatch, TournamentMode, SeasonHistory, ScheduleSettings } from '../../types';
import { GroupStage } from './GroupStage';
import { MatchCard } from './MatchList';
import { KnockoutStageView } from './KnockoutStageView';
import { RulesModal } from './RulesModal'; // Updated import
import { StatsStandings } from './StatsStandings';
import { Users, ListChecks, Trophy, BookOpen, Crown, ChevronDown, Zap, ShieldCheck, Star, Lock, Calendar, Info, BarChart3, Layout, Coffee, Clock } from 'lucide-react';
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
  scheduleSettings?: ScheduleSettings; // NEW PROP
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
            py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all w-full border overflow-hidden
            ${isActive 
                ? 'bg-brand-vibrant/10 border-brand-vibrant/30 text-brand-vibrant shadow-[inset_0_0_15px_rgba(37,99,235,0.15)]' 
                : 'bg-brand-secondary/40 border-transparent hover:bg-brand-secondary/60 text-brand-light/50 hover:text-brand-light'}
        `}
    >
        <Icon 
            size={14} 
            className={`transition-colors sm:w-[18px] sm:h-[18px] ${isActive ? 'fill-brand-vibrant/20' : 'group-hover:text-brand-light'}`} 
        />
        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tight leading-none truncate w-full sm:w-auto text-center">
            {label}
        </span>
        {isActive && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-vibrant shadow-[0_0_8px_#2563eb] sm:hidden"></span>
        )}
    </button>
);

const MatchdayTimer: React.FC<{ settings: ScheduleSettings }> = ({ settings }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        if (!settings.isActive || !settings.matchdayStartTime) {
            setTimeLeft('');
            return;
        }

        const interval = setInterval(() => {
            const deadline = settings.matchdayStartTime! + (settings.matchdayDurationHours * 3600000);
            const now = Date.now();
            const diff = deadline - now;

            if (diff <= 0) {
                setTimeLeft('Waktu Habis');
                setIsUrgent(true);
            } else {
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                
                setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
                
                // Urgent if less than 1 hour
                setIsUrgent(hours < 1);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [settings]);

    if (!timeLeft) return null;

    return (
        <div className="mb-4">
            <div className={`
                flex items-center justify-between px-4 py-3 rounded-2xl shadow-2xl border
                ${isUrgent 
                    ? 'bg-red-500/10 border-red-500/30 animate-pulse' 
                    : 'bg-gradient-to-r from-blue-600/10 to-brand-primary/50 border-brand-vibrant/30'}
            `}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isUrgent ? 'bg-red-500/20 text-red-500' : 'bg-brand-vibrant/20 text-brand-vibrant'}`}>
                        <Clock size={20} className={isUrgent ? "animate-bounce" : ""} />
                    </div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isUrgent ? 'text-red-400' : 'text-brand-light'}`}>
                            Batas Waktu Matchday {settings.currentMatchday}
                        </p>
                        <p className={`text-lg font-black italic tracking-tight ${isUrgent ? 'text-red-500' : 'text-brand-text'}`}>
                            {timeLeft}
                        </p>
                    </div>
                </div>
                {isUrgent && (
                    <div className="hidden sm:block text-[9px] font-bold text-red-400 uppercase tracking-widest px-3 py-1 bg-red-500/10 rounded-lg border border-red-500/20">
                        Segera Mainkan!
                    </div>
                )}
            </div>
            <div className="text-center text-[10px] text-brand-light/60 mt-2 italic font-medium px-2">
                *Untuk input score silakan kirim di Chat Jadwal beserta Screenshot Bukti Pertandingan.
            </div>
        </div>
    );
};

export const PublicView: React.FC<PublicViewProps> = ({ 
    mode, groups, matches, knockoutStage, rules, history, onSelectTeam, 
    currentUser, onAddMatchComment, isAdmin, onUpdateMatchScore, onUpdateKnockoutScore,
    userOwnedTeamIds = [], clubStats = [], playerStats = { topScorers: [], topAssists: [] },
    scheduleSettings
}) => {
  const [activeTab, setActiveTab] = useState<PublicTab>('groups');
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const [isAdminModeActive, setIsAdminModeActive] = useState(false);
  const [focusMyTeam, setFocusMyTeam] = useState(false);
  const [showRules, setShowRules] = useState(false); 

  const hasMyTeam = userOwnedTeamIds.length > 0;
  const supportsKnockout = mode === 'two_leagues' || mode === 'wakacl';
  const isChampionsMode = mode === 'wakacl';

  // Logic to auto-select the current active matchday based on unfinished matches
  useEffect(() => {
    if (groups.length === 0 || matches.length === 0) return;
    
    // We only want to set the default if it hasn't been set yet for a group
    // OR if we want to force update based on data changes (dynamic progression)
    
    const newSelections = { ...selectedMatchdays };
    let hasChanged = false;

    groups.forEach(g => {
        // Only auto-switch if the specific group doesn't have a user-selected day yet
        // OR if the currently selected day is completely finished and there is a next one?
        // For simplicity and to satisfy the prompt, let's calculate the "Next Active Day" 
        // and set it if we haven't manually interacted yet.
        
        if (newSelections[g.id]) return; 

        const groupLetter = g.name.replace('Group ', '').trim();
        const groupMatches = matches.filter(m => m.group === g.id || m.group === groupLetter || m.group === g.name);
        
        if (groupMatches.length === 0) return;

        // Sort matches by Leg then Matchday
        const sortedMatches = groupMatches.sort((a, b) => {
            if ((a.leg || 1) !== (b.leg || 1)) return (a.leg || 1) - (b.leg || 1);
            return (a.matchday || 1) - (b.matchday || 1);
        });

        // Find the first match that is NOT finished (scheduled or live)
        const nextActiveMatch = sortedMatches.find(m => m.status !== 'finished');
        
        let targetKey = '';
        if (nextActiveMatch) {
            // Set to the upcoming matchday
            targetKey = `L${nextActiveMatch.leg || 1}-D${nextActiveMatch.matchday || 1}`;
        } else {
            // If all matches finished, set to the very last matchday
            const lastMatch = sortedMatches[sortedMatches.length - 1];
            if (lastMatch) {
                targetKey = `L${lastMatch.leg || 1}-D${lastMatch.matchday || 1}`;
            }
        }

        if (targetKey && newSelections[g.id] !== targetKey) {
            newSelections[g.id] = targetKey;
            hasChanged = true;
        }
    });

    if (hasChanged) {
        setSelectedMatchdays(newSelections);
    }
  }, [matches, groups, mode]);

  const renderFixtures = () => {
    return (
        <div className="space-y-6">
            {scheduleSettings && <MatchdayTimer settings={scheduleSettings} />}
            
            {focusMyTeam && hasMyTeam ? (
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
                        {matches.filter(m => userOwnedTeamIds.includes(m.teamA.id) || userOwnedTeamIds.includes(m.teamB.id))
                            .sort((a, b) => (a.matchday || 0) - (b.matchday || 0))
                            .map(match => (
                                <MatchCard key={match.id} match={match} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateMatchScore} currentUser={currentUser} onAddComment={onAddMatchComment} isAdmin={isAdmin} userOwnedTeamIds={userOwnedTeamIds} mode={mode} />
                            ))}
                    </div>
                </div>
            ) : (
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

                        // Sort keys clearly: L1-D1, L1-D2 ... L2-D1, L2-D2
                        const sortedKeys = Object.keys(schedule).sort((a, b) => {
                            const [la, da] = a.replace('L','').split('-D').map(Number);
                            const [lb, db] = b.replace('L','').split('-D').map(Number);
                            if (la !== lb) return la - lb;
                            return da - db;
                        });

                        const activeScheduleKey = selectedMatchdays[group.id] || (sortedKeys.length > 0 ? sortedKeys[0] : '');
                        
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
                                <div className="p-4 sm:p-5 bg-black/40 border-b border-white/5 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-vibrant/10 flex items-center justify-center text-brand-vibrant border border-brand-vibrant/20 shadow-inner">
                                                <Calendar size={18} />
                                            </div>
                                            <h4 className="text-base sm:text-xl font-black text-white uppercase italic tracking-tighter leading-none">{group.name}</h4>
                                        </div>
                                    </div>
                                    
                                    {/* Horizontal Matchday Selector */}
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                                        {sortedKeys.map(key => {
                                            const [leg, day] = key.replace('L','').split('-D').map(Number);
                                            const isActive = activeScheduleKey === key;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setSelectedMatchdays(prev => ({...prev, [group.id]: key}))}
                                                    className={`
                                                        flex-shrink-0 flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all border
                                                        ${isActive 
                                                            ? 'bg-brand-vibrant text-white border-brand-vibrant shadow-[0_4px_12px_rgba(37,99,235,0.3)] scale-105' 
                                                            : 'bg-white/5 text-brand-light border-white/5 hover:bg-white/10 hover:border-white/10'}
                                                    `}
                                                >
                                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${isActive ? 'text-white/80' : 'text-brand-light/50'}`}>
                                                        {leg === 1 ? 'Leg 1' : 'Leg 2'}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase whitespace-nowrap">
                                                        Day {day}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                
                                <div className="p-3 sm:p-4 flex-grow relative overflow-y-auto custom-scrollbar bg-black/20">
                                    {currentMatches.length > 0 ? (
                                        <div className="space-y-3 animate-in slide-in-from-bottom-3 duration-500">
                                            {currentMatches.map(match => (
                                                <MatchCard key={match.id} match={match} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateMatchScore} currentUser={currentUser} onAddComment={onAddMatchComment} isAdmin={isAdmin} userOwnedTeamIds={userOwnedTeamIds} mode={mode} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 opacity-20 italic font-black uppercase tracking-widest text-[10px]">Belum ada jadwal</div>
                                    )}

                                    {/* BYE TEAMS INDICATOR */}
                                    {byeTeams.length > 0 && (
                                        <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2 mb-2 px-1">
                                                <Coffee size={12} className="text-yellow-500" />
                                                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Rest Week (BYE)</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {byeTeams.map(team => (
                                                    <div key={team.id} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 opacity-80 hover:opacity-100 transition-all">
                                                         <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-5 h-5" />
                                                         <span className="text-[9px] font-bold text-white uppercase tracking-tight">{team.name}</span>
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
            )}
        </div>
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'groups': return (<div className="space-y-6"><h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter px-1 flex items-center gap-4"><span>Group Standings</span><div className="h-px flex-grow bg-gradient-to-r from-brand-vibrant/50 to-transparent"></div></h2>{groups.length > 0 ? (<GroupStage groups={groups} matches={matches} onSelectTeam={onSelectTeam} userOwnedTeamIds={userOwnedTeamIds} history={history} />) : (<div className="text-center bg-brand-secondary/30 border border-white/5 p-16 rounded-[2rem] opacity-30">Menyiapkan data...</div>)}</div>);
      case 'fixtures': return (<div className="space-y-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1"><div className="flex items-center gap-4"><h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Match Fixtures</h2><div className="px-2 py-0.5 bg-brand-vibrant/10 border border-brand-vibrant/30 rounded-full"><span className="text-[8px] font-black text-brand-vibrant uppercase tracking-widest animate-pulse">Live</span></div></div>{hasMyTeam && (<button onClick={() => setFocusMyTeam(!focusMyTeam)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-xl border ${focusMyTeam ? 'bg-brand-vibrant text-white border-brand-vibrant' : 'bg-brand-secondary text-brand-light border-white/10 hover:border-brand-vibrant/40'}`}><Star size={14} className={focusMyTeam ? 'fill-white' : ''} /> {focusMyTeam ? 'Lihat Semua' : 'Fokus Tim Saya'}</button>)}</div>{groups.length > 0 ? renderFixtures() : <div className="text-center py-32 opacity-30 font-black italic">Jadwal Belum Dirilis</div>}</div>);
      case 'knockout': return (<div className="space-y-6"><h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter px-1 flex items-center gap-4"><span>{mode === 'two_leagues' ? 'Semi Final & Final' : 'Knockout Stage'}</span><div className="h-px flex-grow bg-gradient-to-r from-brand-special/50 to-transparent"></div></h2><KnockoutStageView knockoutStage={knockoutStage || {}} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateKnockoutScore} userOwnedTeamIds={userOwnedTeamIds} /></div>);
      case 'stats': return (<div className="space-y-6"><h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter px-1 flex items-center gap-4"><BarChart3 className="text-brand-special" size={24} /><span>Peringkat Statistik</span></h2><StatsStandings clubStats={clubStats} playerStats={playerStats} /></div>);
      default: return null;
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
        {/* UCL STAR PATTERN BACKGROUND */}
        {isChampionsMode && (
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
                <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.3),transparent)] blur-3xl rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.2),transparent)] blur-3xl rounded-full"></div>
                {/* Simulated Star Pattern using simple repeated elements or just suggestive gradients above */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}></div>
            </div>
        )}

        {/* SUB NAVIGATION - FIXED GRID LAYOUT - ALL ITEMS VISIBLE (NO SCROLL) */}
        <div className="sticky top-[56px] sm:top-[128px] z-[30] -mx-4 md:-mx-8 bg-brand-primary/95 backdrop-blur-xl border-b border-white/5 shadow-2xl">
            <div className="px-2 sm:px-4 py-1.5 sm:py-3 max-w-5xl mx-auto">
                <div className={`grid ${supportsKnockout ? 'grid-cols-5' : 'grid-cols-4'} gap-1 sm:gap-3`}>
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
                        className="group relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all w-full border bg-white/[0.02] border-transparent hover:bg-white/5 text-brand-light/50 hover:text-brand-light active:scale-95"
                    >
                        <BookOpen size={14} className="sm:w-[18px] sm:h-[18px] group-hover:text-brand-light" />
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tight leading-none truncate w-full sm:w-auto text-center">
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
