
import React, { useState, useMemo } from 'react';
import type { Group, Match, KnockoutStageRounds, Team, KnockoutMatch } from '../../types';
import { GroupStage } from './GroupStage';
import { MatchCard } from './MatchList';
import { KnockoutStageView } from './KnockoutStageView';
import { RulesView } from './RulesView';
import { BannerCarousel } from './BannerCarousel';
import { MarqueeBanner } from './MarqueeBanner';
import { Users, ListChecks, Trophy, BookOpen, Crown, ChevronDown, Zap, ShieldCheck } from 'lucide-react';
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
            isActive ? 'text-brand-vibrant bg-white/[0.02]' : 'text-brand-light'
        }`}
    >
        <div className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
            {icon}
        </div>
        <span className="text-[7px] font-black tracking-tighter uppercase leading-none">{label}</span>
        {isActive && <div className="absolute top-0 w-1/4 h-0.5 bg-brand-vibrant shadow-[0_0_10px_rgba(37,99,235,1)] rounded-full"></div>}
    </button>
);

export const PublicView: React.FC<PublicViewProps> = ({ 
    groups, matches, knockoutStage, rules, banners, onSelectTeam, 
    currentUser, onAddMatchComment, isAdmin, onUpdateMatchScore, onUpdateKnockoutScore
}) => {
  const [activeTab, setActiveTab] = useState<PublicTab>('groups');
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const [isAdminModeActive, setIsAdminModeActive] = useState(false);

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

  const renderContent = () => {
    switch(activeTab) {
      case 'groups':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-1 px-1">
                <h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">
                  Group Stage
                </h2>
                <div className="h-0.5 flex-grow bg-gradient-to-r from-brand-vibrant to-transparent rounded-full opacity-30"></div>
            </div>
            {groups.length > 0 ? (
                <GroupStage groups={groups} onSelectTeam={onSelectTeam} />
            ) : (
                <div className="text-center bg-brand-secondary/30 border border-white/5 p-12 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-2">Groups TBD</h3>
                    <p className="text-brand-light text-xs">Organizers are finalizing the groups.</p>
                </div>
            )}
          </div>
        );
      case 'fixtures':
        return (
          <div className="space-y-4">
             <div className="flex items-center gap-3 mb-1 px-1">
                <h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">
                  Fixtures
                </h2>
                <div className="h-0.5 flex-grow bg-gradient-to-r from-brand-vibrant to-transparent rounded-full opacity-30"></div>
            </div>
            
            <AdminToggle />

            {matches.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {groups.map(group => {
                        const groupLetter = group.name.split(' ')[1];
                        const groupMatches = matches.filter(m => m.group === groupLetter);
                        if (groupMatches.length === 0) return null;

                        const schedule = groupMatches.reduce((acc, match) => {
                            const scheduleKey = `Match ${match.leg || 1} - Day ${match.matchday || 1}`;
                            if (!acc[scheduleKey]) acc[scheduleKey] = [];
                            acc[scheduleKey].push(match);
                            return acc;
                        }, {} as Record<string, Match[]>);
                        
                        const scheduleKeys = Object.keys(schedule).sort((a, b) => {
                            const [legA, dayA] = (a.match(/\d+/g) || [0, 0]).map(Number);
                            const [legB, dayB] = (b.match(/\d+/g) || [0, 0]).map(Number);
                            if (legA !== legB) return legA - legB;
                            return dayA - dayB;
                        });

                        const defaultScheduleKey = scheduleKeys.find(key => 
                            schedule[key].some(m => m.status !== 'finished')
                        ) || scheduleKeys[scheduleKeys.length - 1];

                        const stateKey = group.id;
                        const activeScheduleKey = selectedMatchdays[stateKey] || defaultScheduleKey;
                        
                        return (
                            <div key={`${group.id}-fixtures`} className="bg-brand-secondary/30 border border-white/5 p-3 rounded-[1.2rem] flex flex-col h-full">
                                <div className="flex justify-between items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                    <h4 className="text-sm sm:text-2xl font-black text-brand-vibrant tracking-tight uppercase leading-none">{group.name}</h4>
                                    {scheduleKeys.length > 1 && (
                                        <select
                                            value={activeScheduleKey}
                                            onChange={(e) => setSelectedMatchdays(prev => ({...prev, [stateKey]: e.target.value}))}
                                            className="appearance-none px-2 py-1 bg-black/40 border border-white/10 rounded-lg text-white text-[9px] font-black uppercase tracking-wider outline-none cursor-pointer hover:border-brand-vibrant transition-colors"
                                        >
                                            {scheduleKeys.map(key => {
                                                const isDone = schedule[key].every(m => m.status === 'finished');
                                                return <option key={key} value={key}>{key} {isDone ? '✓' : ''}</option>
                                            })}
                                        </select>
                                    )}
                                </div>
                                <div className="space-y-3 flex-grow">
                                    {activeScheduleKey && schedule[activeScheduleKey] ? (
                                        schedule[activeScheduleKey].map(match => (
                                            <MatchCard 
                                                key={match.id} 
                                                match={match} 
                                                onSelectTeam={onSelectTeam}
                                                isAdminMode={isAdminModeActive}
                                                onUpdateScore={onUpdateMatchScore}
                                                currentUser={currentUser}
                                                onAddComment={onAddMatchComment}
                                                isAdmin={isAdmin}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-6 opacity-30 italic text-[10px]">No matches.</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center bg-brand-secondary/30 border border-white/5 p-12 rounded-2xl">
                    <h3 className="text-lg font-bold text-white">No Fixtures</h3>
                </div>
            )}
          </div>
        );
      case 'knockout':
        return (
          <div className="space-y-4">
             <div className="flex items-center gap-3 mb-1 px-1">
                <h2 className="text-xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Brackets</h2>
                <div className="h-0.5 flex-grow bg-gradient-to-r from-brand-special to-transparent rounded-full opacity-30"></div>
            </div>
            <AdminToggle />
            <KnockoutStageView knockoutStage={knockoutStage || {}} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateKnockoutScore} />
          </div>
        );
      case 'final':
        return (
           <div className="space-y-4">
             <div className="flex items-center gap-3 mb-1 px-1">
                <h2 className="text-xl sm:text-4xl font-black text-yellow-400 italic uppercase tracking-tighter">Grand Final</h2>
                <div className="h-0.5 flex-grow bg-gradient-to-r from-yellow-500 to-transparent rounded-full opacity-30"></div>
            </div>
            <AdminToggle />
            <KnockoutStageView knockoutStage={{ Final: knockoutStage?.Final || [] }} onSelectTeam={onSelectTeam} isAdminMode={isAdminModeActive} onUpdateScore={onUpdateKnockoutScore} />
          </div>
        );
      case 'rules':
        return <RulesView rules={rules} />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
        <MarqueeBanner />
        
        {banners && banners.length > 0 && (
             <BannerCarousel banners={banners} />
        )}

        <div className="hidden md:flex justify-center mb-8 relative z-30">
            <div className="flex items-center bg-brand-secondary/80 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-white/5 shadow-2xl">
                <TabButton isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')}>
                    <Users size={16}/> <span>Groups</span>
                </TabButton>
                <TabButton isActive={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')}>
                    <ListChecks size={16}/> <span>Fixtures</span>
                </TabButton>
                <TabButton isActive={activeTab === 'knockout'} onClick={() => setActiveTab('knockout')}>
                    <Trophy size={16}/> <span>Knockout</span>
                </TabButton>
                 <TabButton isActive={activeTab === 'final'} onClick={() => setActiveTab('final')}>
                    <Crown size={16} className="text-yellow-400"/> <span className="text-yellow-100">Final</span>
                </TabButton>
                <TabButton isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')}>
                    <BookOpen size={16}/> <span>Rules</span>
                </TabButton>
            </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {renderContent()}
        </div>

         <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-secondary/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-50 h-[56px]">
             <div className="grid grid-cols-5 h-full px-1">
                <MobileTabButton isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')} label="Grup" icon={<Users size={18} />} />
                <MobileTabButton isActive={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')} label="Jadwal" icon={<ListChecks size={18} />} />
                <MobileTabButton isActive={activeTab === 'knockout'} onClick={() => setActiveTab('knockout')} label="Braket" icon={<Trophy size={18} />} />
                <MobileTabButton isActive={activeTab === 'final'} onClick={() => setActiveTab('final')} label="Final" icon={<Crown size={18} className={activeTab === 'final' ? 'text-yellow-500' : ''} />} />
                <MobileTabButton isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')} label="Aturan" icon={<BookOpen size={18} />} />
             </div>
        </div>
    </div>
  );
};
