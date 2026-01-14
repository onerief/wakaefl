
import React, { useState, useMemo } from 'react';
import type { Group, Match, KnockoutStageRounds, Team } from '../../types';
import { GroupStage } from './GroupStage';
import { MatchCard } from './MatchList';
import { KnockoutStageView } from './KnockoutStageView';
import { RulesView } from './RulesView';
import { BannerMarquee } from './BannerMarquee';
import { MarqueeBanner } from './MarqueeBanner';
// Added ChevronDown to imports
import { Users, ListChecks, Trophy, BookOpen, Crown, ChevronDown } from 'lucide-react';
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
        <div className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
            {icon}
        </div>
        <span className="text-[9px] font-black tracking-widest uppercase leading-none">{label}</span>
        {isActive && <div className="absolute top-0 w-1/4 h-0.5 bg-brand-vibrant shadow-[0_0_10px_rgba(37,99,235,1)] rounded-full"></div>}
    </button>
);

export const PublicView: React.FC<PublicViewProps> = ({ 
    groups, matches, knockoutStage, rules, banners, onSelectTeam, 
    currentUser, onAddMatchComment 
}) => {
  const [activeTab, setActiveTab] = useState<PublicTab>('groups');
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});


  const renderContent = () => {
    switch(activeTab) {
      case 'groups':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">
                  Group Stage
                </h2>
                <div className="h-1 flex-grow bg-gradient-to-r from-brand-vibrant to-transparent rounded-full opacity-30"></div>
            </div>
            {groups.length > 0 ? (
                <GroupStage groups={groups} onSelectTeam={onSelectTeam} />
            ) : (
                <div className="text-center bg-brand-secondary/30 border border-white/5 p-12 rounded-3xl backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-white mb-2">Groups TBD</h3>
                    <p className="text-brand-light text-sm">The tournament organizers are finalizing the groups. Check back soon!</p>
                </div>
            )}
          </div>
        );
      case 'fixtures':
        return (
          <div className="space-y-6">
             <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">
                  Fixtures
                </h2>
                <div className="h-1 flex-grow bg-gradient-to-r from-brand-vibrant to-transparent rounded-full opacity-30"></div>
            </div>
            {matches.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
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

                        const nextUnfinishedMatchday = scheduleKeys.find(key => 
                            schedule[key].some(match => match.status !== 'finished')
                        ) || (scheduleKeys.length > 0 ? scheduleKeys[scheduleKeys.length - 1] : '');

                        const stateKey = group.id;
                        const activeScheduleKey = selectedMatchdays[stateKey] || nextUnfinishedMatchday;
                        
                        return (
                            <div key={`${group.id}-fixtures`} className="bg-brand-secondary/30 border border-white/5 p-4 sm:p-6 rounded-3xl shadow-2xl flex flex-col h-full">
                                <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5">
                                    <h4 className="text-xl sm:text-2xl font-black text-brand-vibrant tracking-tight italic uppercase">{group.name}</h4>
                                    {scheduleKeys.length > 1 && (
                                        <div className="relative">
                                            <select
                                                value={activeScheduleKey}
                                                onChange={(e) => setSelectedMatchdays(prev => ({...prev, [stateKey]: e.target.value}))}
                                                className="appearance-none pl-3 pr-8 py-1.5 bg-black/40 border border-white/10 rounded-xl text-white text-[10px] sm:text-xs font-black uppercase tracking-wider outline-none cursor-pointer hover:border-brand-vibrant transition-all"
                                            >
                                                {scheduleKeys.map(key => (
                                                    <option key={key} value={key}>{key}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-light" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3 flex-grow">
                                    {activeScheduleKey && schedule[activeScheduleKey] ? (
                                        schedule[activeScheduleKey]
                                            .sort((a, b) => a.id.localeCompare(b.id))
                                            .map(match => (
                                                <MatchCard 
                                                    key={match.id} 
                                                    match={match} 
                                                    onSelectTeam={onSelectTeam}
                                                    currentUser={currentUser}
                                                    onAddComment={onAddMatchComment}
                                                />
                                            ))
                                    ) : (
                                        <div className="text-center py-10 opacity-30 italic text-sm">No matches scheduled.</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center bg-brand-secondary/30 border border-white/5 p-12 rounded-3xl backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-white mb-2">No Fixtures</h3>
                    <p className="text-brand-light text-sm">Wait for organizers to generate the schedule.</p>
                </div>
            )}
          </div>
        );
      case 'knockout':
        const hasKnockout = knockoutStage && Object.values(knockoutStage).some(r => (r as any[]).length > 0);
        if (!hasKnockout || !knockoutStage) {
            return (
                 <div className="text-center bg-brand-secondary/30 border border-white/5 p-12 rounded-3xl backdrop-blur-sm">
                    <Trophy size={48} className="mx-auto text-brand-light/20 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Knockout Stage Pending</h3>
                    <p className="text-brand-light text-sm">Bracket will be generated after group matches conclude.</p>
                </div>
            );
        }

        const knockoutWithoutFinal = { ...knockoutStage };
        if (knockoutWithoutFinal['Final']) {
            delete (knockoutWithoutFinal as any)['Final'];
        }

        return (
          <div className="space-y-6">
             <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">
                  Brackets
                </h2>
                <div className="h-1 flex-grow bg-gradient-to-r from-brand-special to-transparent rounded-full opacity-30"></div>
            </div>
            <KnockoutStageView knockoutStage={knockoutWithoutFinal} onSelectTeam={onSelectTeam} />
          </div>
        );
      case 'final':
        const finalMatch = knockoutStage?.Final;
        const hasFinal = finalMatch && finalMatch.length > 0;
        
        if (!hasFinal || !knockoutStage) {
             return (
                 <div className="text-center bg-brand-secondary/30 border border-white/5 p-12 rounded-3xl backdrop-blur-sm">
                    <Crown size={48} className="mx-auto text-yellow-500/20 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">The Final Awaits</h3>
                    <p className="text-brand-light text-sm">Stay tuned for the grand finale announcement.</p>
                </div>
            );
        }

        return (
           <div className="space-y-6">
             <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-white to-yellow-400 italic uppercase tracking-tighter drop-shadow-lg">
                  Grand Final
                </h2>
                <div className="h-1 flex-grow bg-gradient-to-r from-yellow-500 to-transparent rounded-full opacity-30"></div>
            </div>
            <KnockoutStageView knockoutStage={{ Final: knockoutStage.Final }} onSelectTeam={onSelectTeam} />
          </div>
        );

      case 'rules':
        return <RulesView rules={rules} />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">
        <MarqueeBanner />
        
        {banners && banners.length > 0 && (
             <BannerMarquee banners={banners} />
        )}

        {/* Desktop Navigation */}
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

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-1 sm:px-0">
            {renderContent()}
        </div>

        {/* Mobile Navigation (Fixed Bottom) */}
         <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-secondary/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.8)] z-50 h-[64px] pointer-events-auto">
             <div className="grid grid-cols-5 h-full px-2">
                <MobileTabButton isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')} label="Groups" icon={<Users size={18} />} />
                <MobileTabButton isActive={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')} label="Matches" icon={<ListChecks size={18} />} />
                <MobileTabButton isActive={activeTab === 'knockout'} onClick={() => setActiveTab('knockout')} label="Bracket" icon={<Trophy size={18} />} />
                <MobileTabButton isActive={activeTab === 'final'} onClick={() => setActiveTab('final')} label="Final" icon={<Crown size={18} className={activeTab === 'final' ? 'fill-yellow-500 text-yellow-500' : ''} />} />
                <MobileTabButton isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')} label="Rules" icon={<BookOpen size={18} />} />
             </div>
        </div>
    </div>
  );
};
