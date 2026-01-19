
import React, { useState, useMemo, useEffect } from 'react';
import type { Group, Match, KnockoutStageRounds, Team, KnockoutMatch } from '../../types';
import { GroupStage } from './GroupStage';
import { MatchCard } from './MatchList';
import { KnockoutStageView } from './KnockoutStageView';
import { RulesView } from './RulesView';
import { BannerCarousel } from './BannerCarousel';
import { MarqueeBanner } from './MarqueeBanner';
import { Users, ListChecks, Trophy, BookOpen, Crown, ChevronDown, Zap, ShieldCheck, Star, Filter, LayoutGrid } from 'lucide-react';
import type { User } from 'firebase/auth';

interface PublicViewProps {
  groups: Group[];
  matches: Match[];
  knockoutStage: KnockoutStageRounds | null;
  rules: string;
  banners: string[];
  onSelectTeam: (team: Team) => void;
  currentUser?: User | null;
  onAddMatchComment?: (matchId: string, text: string) => void;
  isAdmin?: boolean;
  onUpdateMatchScore?: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
  onUpdateKnockoutScore?: (matchId: string, data: Partial<KnockoutMatch> & { round: keyof KnockoutStageRounds }) => void;
  userOwnedTeamIds?: string[];
}

type PublicTab = 'groups' | 'fixtures' | 'knockout' | 'final' | 'rules';

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
        <div className={`mb-0.5 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
            {icon}
        </div>
        <span className={`text-[8px] font-black tracking-tight uppercase leading-none transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}>
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
    groups, matches, knockoutStage, rules, banners, onSelectTeam, 
    currentUser, onAddMatchComment, isAdmin, onUpdateMatchScore, onUpdateKnockoutScore,
    userOwnedTeamIds = []
}) => {
  const [activeTab, setActiveTab] = useState<PublicTab>('groups');
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const [isAdminModeActive, setIsAdminModeActive] = useState(false);
  const [focusMyTeam, setFocusMyTeam] = useState(false);

  const hasMyTeam = userOwnedTeamIds.length > 0;

  useEffect(() => {
    if (activeTab === 'fixtures' && hasMyTeam) {
        const newDefaults = { ...selectedMatchdays };
        groups.forEach(g => {
            if (!newDefaults[g.id]) {
                const myMatch = matches.find(m => 
                    (m.group === g.id || m.group === g.name.replace('Group ', '')) && 
                    (userOwnedTeamIds.includes(m.teamA.id) || userOwnedTeamIds.includes(m.teamB.id)) &&
                    m.status !== 'finished'
                );
                if (myMatch) {
                    newDefaults[g.id] = `Match ${myMatch.leg || 1} - Day ${myMatch.matchday || 1}`;
                }
            }
        });
        setSelectedMatchdays(newDefaults);
    }
  }, [activeTab, userOwnedTeamIds, groups, matches]);

  const AdminToggle = () => {
      if (!isAdmin) return null;
      return (
          <div className="flex justify-center mb-4 px-2">
              <button 
                onClick={() => setIsAdminModeActive(!isAdminModeActive)}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all
                    ${isAdminModeActive 
                        ? 'bg-brand-special text-brand-primary shadow-[0_0_15px_rgba(253,224,71,0.4)]' 
                        : 'bg-brand-vibrant/10 text-brand-vibrant border border-brand-vibrant/30 hover:bg-brand-vibrant/20'}
                `}
              >
                  {isAdminModeActive ? <Zap size={14} className="fill-brand-primary" /> : <ShieldCheck size={14} />}
                  {isAdminModeActive ? '⚡ Mode Edit Admin Aktif' : 'Buka Mode Edit Admin'}
              </button>
          </div>
      );
  };

  const renderFixtures = () => {
    if (focusMyTeam && hasMyTeam) {
        const myMatches = matches.filter(m => 
            userOwnedTeamIds.includes(m.teamA.id) || userOwnedTeamIds.includes(m.teamB.id)
        ).sort((a, b) => {
            if (a.status !== 'finished' && b.status === 'finished') return -1;
            if (a.status === 'finished' && b.status !== 'finished') return 1;
            return 0;
        });

        return (
            <div className="space-y-4 sm:space-y-6">
                <div className="bg-brand-vibrant/10 border border-brand-vibrant/20 p-4 rounded-2xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-vibrant/20 rounded-xl text-brand-vibrant">
                            <Star size={20} className="fill-brand-vibrant" />
                        </div>
                        <div>
                            <h3 className="text-white text-sm sm:text-base font-black uppercase italic tracking-wider">Jadwal Tim Saya</h3>
                            <p className="text-[9px] sm:text-[10px] text-brand-light">Menampilkan semua pertandingan Anda.</p>
                        </div>
                    </div>
                    <button onClick={() => setFocusMyTeam(false)} className="text-[9px] font-black uppercase text-brand-vibrant hover:text-white underline px-2 py-1">
                        Lihat Semua
                    </button>
                </div>
                
                {myMatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {myMatches.map(match => (
                            <MatchCard key={match.id} match={match} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateMatchScore} currentUser={currentUser} onAddComment={onAddMatchComment} isAdmin={isAdmin} userOwnedTeamIds={userOwnedTeamIds} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-brand-secondary/20 rounded-2xl border border-dashed border-white/5 opacity-50">
                        <p className="text-brand-light italic text-sm">Tim Anda belum memiliki jadwal pertandingan.</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {groups.map(group => {
                const groupLetter = group.name.replace('Group ', '').trim();
                const groupMatches = matches.filter(m => 
                    m.group === group.id || 
                    m.group === groupLetter || 
                    m.group === group.name
                );
                
                const schedule = groupMatches.reduce((acc, match) => {
                    const scheduleKey = `Match ${match.leg || 1} - Day ${match.matchday || 1}`;
                    if (!acc[scheduleKey]) acc[scheduleKey] = [];
                    acc[scheduleKey].push(match);
                    return acc;
                }, {} as Record<string, Match[]>);
                
                const scheduleKeys = Object.keys(schedule).sort((a, b) => {
                    const numsA = a.match(/\d+/g) || [0, 0];
                    const numsB = b.match(/\d+/g) || [0, 0];
                    return Number(numsA[0]) - Number(numsB[0]) || Number(numsA[1]) - Number(numsB[1]);
                });

                const defaultScheduleKey = scheduleKeys.find(key => schedule[key].some(m => m.status !== 'finished')) || scheduleKeys[scheduleKeys.length - 1];
                const activeScheduleKey = selectedMatchdays[group.id] || defaultScheduleKey;
                
                return (
                    <div key={`${group.id}-fixtures`} className="bg-brand-secondary/30 border border-white/5 p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] flex flex-col h-full shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-white/5">
                            <h4 className="text-lg sm:text-2xl font-black text-brand-vibrant tracking-tight uppercase italic leading-none">{group.name}</h4>
                            {scheduleKeys.length > 1 && (
                                <div className="relative">
                                    <select
                                        value={activeScheduleKey}
                                        onChange={(e) => setSelectedMatchdays(prev => ({...prev, [group.id]: e.target.value}))}
                                        className="w-full sm:w-auto appearance-none pl-3 pr-8 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white text-[10px] font-black uppercase outline-none focus:border-brand-vibrant transition-colors"
                                    >
                                        {scheduleKeys.map(key => <option key={key} value={key} className="bg-brand-primary">{key}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-light pointer-events-none" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 flex-grow">
                            {groupMatches.length > 0 ? (
                                schedule[activeScheduleKey]?.map(match => (
                                    <MatchCard key={match.id} match={match} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateMatchScore} currentUser={currentUser} onAddComment={onAddMatchComment} isAdmin={isAdmin} userOwnedTeamIds={userOwnedTeamIds} />
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-30 italic text-xs">Jadwal belum dibuat untuk grup ini.</div>
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
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2 px-1">
                <h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Group Stage</h2>
                <div className="h-0.5 flex-grow bg-gradient-to-r from-brand-vibrant to-transparent rounded-full opacity-30"></div>
            </div>
            {groups.length > 0 ? (
                <GroupStage 
                    groups={groups} 
                    onSelectTeam={onSelectTeam} 
                    userOwnedTeamIds={userOwnedTeamIds} 
                />
            ) : (
                <div className="text-center bg-brand-secondary/30 border border-white/5 p-12 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-2">Grup Belum Tersedia</h3>
                    <p className="text-brand-light text-xs">Admin sedang mengatur pembagian grup.</p>
                </div>
            )}
          </div>
        );
      case 'fixtures':
        return (
          <div className="space-y-4">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 px-1">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Fixtures</h2>
                    <div className="h-0.5 w-20 bg-gradient-to-r from-brand-vibrant to-transparent rounded-full opacity-30"></div>
                </div>

                {hasMyTeam && (
                    <button 
                        onClick={() => setFocusMyTeam(!focusMyTeam)}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg border ${
                            focusMyTeam ? 'bg-brand-vibrant text-white border-brand-vibrant' : 'bg-brand-secondary text-brand-light hover:text-white border-white/5'
                        }`}
                    >
                        <Star size={14} className={focusMyTeam ? 'fill-white' : ''} />
                        Fokus Tim Saya
                    </button>
                )}
            </div>
            <AdminToggle />
            {groups.length > 0 ? renderFixtures() : (
                <div className="text-center bg-brand-secondary/30 border border-white/5 p-12 rounded-2xl">
                    <h3 className="text-lg font-bold text-white">Belum Ada Jadwal</h3>
                </div>
            )}
          </div>
        );
      case 'knockout':
        return (
          <div className="space-y-4">
             <div className="flex items-center gap-3 mb-2 px-1">
                <h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Brackets</h2>
                <div className="h-0.5 flex-grow bg-gradient-to-r from-brand-special to-transparent rounded-full opacity-30"></div>
            </div>
            <AdminToggle />
            <KnockoutStageView knockoutStage={knockoutStage || {}} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateKnockoutScore} userOwnedTeamIds={userOwnedTeamIds} />
          </div>
        );
      case 'final':
        return (
           <div className="space-y-4">
             <div className="flex items-center gap-3 mb-2 px-1">
                <h2 className="text-xl sm:text-4xl font-black text-yellow-400 italic uppercase tracking-tighter">Grand Final</h2>
                <div className="h-0.5 flex-grow bg-gradient-to-r from-yellow-500 to-transparent rounded-full opacity-30"></div>
            </div>
            <AdminToggle />
            <KnockoutStageView knockoutStage={{ Final: knockoutStage?.Final || [] }} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateKnockoutScore} userOwnedTeamIds={userOwnedTeamIds} />
          </div>
        );
      case 'rules': return <RulesView rules={rules} />;
      default: return null;
    }
  }

  return (
    <div className="space-y-4 pb-20 md:pb-8">
        <MarqueeBanner />
        {banners && banners.length > 0 && <BannerCarousel banners={banners} />}
        <div className="hidden md:flex justify-center mb-8 relative z-30">
            <div className="flex items-center bg-brand-secondary/80 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-white/5 shadow-2xl">
                <TabButton isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')}><Users size={16}/> <span>Groups</span></TabButton>
                <TabButton isActive={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')}><ListChecks size={16}/> <span>Fixtures</span></TabButton>
                <TabButton isActive={activeTab === 'knockout'} onClick={() => setActiveTab('knockout')}><Trophy size={16}/> <span>Knockout</span></TabButton>
                <TabButton isActive={activeTab === 'final'} onClick={() => setActiveTab('final')}><Crown size={16} className="text-yellow-400"/> <span className="text-yellow-100">Final</span></TabButton>
                <TabButton isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')}><BookOpen size={16}/> <span>Rules</span></TabButton>
            </div>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">{renderContent()}</div>
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-secondary/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-50 h-[64px]">
             <div className="grid grid-cols-5 h-full px-1">
                <MobileTabButton isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')} label="Grup" icon={<Users size={20} />} />
                <MobileTabButton isActive={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')} label="Jadwal" icon={<ListChecks size={20} />} />
                <MobileTabButton isActive={activeTab === 'knockout'} onClick={() => setActiveTab('knockout')} label="Braket" icon={<Trophy size={20} />} />
                <MobileTabButton isActive={activeTab === 'final'} onClick={() => setActiveTab('final')} label="Final" icon={<Crown size={20} className={activeTab === 'final' ? 'text-yellow-500' : ''} />} />
                <MobileTabButton isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')} label="Aturan" icon={<BookOpen size={20} />} />
             </div>
        </div>
    </div>
  );
};
