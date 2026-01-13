
import React, { useState, useMemo } from 'react';
import type { Group, Match, KnockoutStageRounds, Team } from '../../types';
import { GroupStage } from './GroupStage';
import { MatchCard } from './MatchList';
import { KnockoutStageView } from './KnockoutStageView';
import { RulesView } from './RulesView';
import { BannerMarquee } from './BannerMarquee';
import { MarqueeBanner } from './MarqueeBanner';
import { Users, ListChecks, Trophy, BookOpen, Crown } from 'lucide-react';
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
        className={`relative px-6 py-3 text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
            isActive ? 'text-brand-vibrant scale-105' : 'text-brand-light hover:text-brand-text'
        }`}
    >
        {children}
        {/* Animated Underline */}
        <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-brand-vibrant rounded-full transition-all duration-300 ${isActive ? 'opacity-100 shadow-[0_0_8px_#06b6d4]' : 'opacity-0 w-0'}`}></span>
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
            isActive ? 'text-brand-vibrant' : 'text-brand-light'
        }`}
    >
        {isActive && <div className="absolute inset-0 bg-brand-vibrant/5 blur-xl"></div>}
        <div className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'group-hover:text-brand-text'}`}>
            {icon}
        </div>
        <span className="text-[10px] font-bold tracking-wide leading-none">{label}</span>
        {isActive && <div className="absolute top-0 w-1/3 h-0.5 bg-brand-vibrant shadow-[0_0_10px_#06b6d4] rounded-full"></div>}
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
          <>
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-text to-brand-light italic uppercase tracking-tighter">
                  Group Stage
                </h2>
                <div className="h-1 flex-grow bg-gradient-to-r from-brand-vibrant to-transparent rounded-full opacity-50"></div>
            </div>
            {groups.length > 0 ? (
                <GroupStage groups={groups} onSelectTeam={onSelectTeam} />
            ) : (
                <div className="text-center bg-brand-secondary/30 border border-brand-accent p-12 rounded-2xl backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-brand-text mb-2">Group Stage Not Generated</h3>
                    <p className="text-brand-light">The admin has not generated the groups yet. Check back later!</p>
                </div>
            )}
          </>
        );
      case 'fixtures':
        return (
          <>
             <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-text to-brand-light italic uppercase tracking-tighter">
                  Match Schedule
                </h2>
                <div className="h-1 flex-grow bg-gradient-to-r from-brand-vibrant to-transparent rounded-full opacity-50"></div>
            </div>
            {matches.length > 0 ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {groups.map(group => {
                            const groupLetter = group.name.split(' ')[1];
                            const groupMatches = matches.filter(m => m.group === groupLetter);
                            if (groupMatches.length === 0) return null;

                            // Group matches by leg and day
                            const schedule = groupMatches.reduce((acc, match) => {
                                const scheduleKey = `Match ${match.leg || 1} - Day ${match.matchday || 1}`;
                                if (!acc[scheduleKey]) acc[scheduleKey] = [];
                                acc[scheduleKey].push(match);
                                return acc;
                            }, {} as Record<string, Match[]>);
                            
                            // Sort matchday keys correctly
                            const scheduleKeys = Object.keys(schedule).sort((a, b) => {
                                const [legA, dayA] = (a.match(/\d+/g) || [0, 0]).map(Number);
                                const [legB, dayB] = (b.match(/\d+/g) || [0, 0]).map(Number);
                                if (legA !== legB) return legA - legB;
                                return dayA - dayB;
                            });

                            // AUTO-DETECT NEXT MATCHDAY LOGIC:
                            // Find the first scheduleKey that contains at least one match that is NOT finished.
                            const nextUnfinishedMatchday = scheduleKeys.find(key => 
                                schedule[key].some(match => match.status !== 'finished')
                            ) || (scheduleKeys.length > 0 ? scheduleKeys[scheduleKeys.length - 1] : '');

                            const stateKey = group.id;
                            // Priority: 1. Manually selected, 2. Auto-detected unfinished, 3. Fallback to first
                            const activeScheduleKey = selectedMatchdays[stateKey] || nextUnfinishedMatchday;
                            
                            const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                                setSelectedMatchdays(prev => ({
                                    ...prev,
                                    [stateKey]: e.target.value
                                }));
                            };

                            return (
                                <div key={`${group.id}-fixtures`} className="bg-brand-secondary/20 border border-white/5 p-6 rounded-2xl shadow-xl">
                                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                                        <h4 className="text-2xl font-black text-brand-vibrant tracking-tight">{group.name}</h4>
                                        {scheduleKeys.length > 1 && (
                                            <div className="relative">
                                                <select
                                                    value={activeScheduleKey}
                                                    onChange={handleSelectChange}
                                                    className="appearance-none pl-4 pr-10 py-2 bg-brand-primary border border-brand-accent rounded-lg text-brand-text text-sm font-semibold focus:ring-2 focus:ring-brand-vibrant focus:border-transparent outline-none cursor-pointer hover:bg-brand-secondary transition-colors"
                                                >
                                                    {scheduleKeys.map(key => (
                                                        <option key={key} value={key}>
                                                            {key}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-light">
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
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
                                            <p className="text-brand-light text-center py-8 bg-black/20 rounded-lg">No matches for this selection.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center bg-brand-secondary/30 border border-brand-accent p-12 rounded-2xl backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-brand-text mb-2">No Fixtures Yet</h3>
                    <p className="text-brand-light">The group stage fixtures have not been generated by the admin.</p>
                </div>
            )}
          </>
        );
      case 'knockout':
        const hasKnockout = knockoutStage && Object.values(knockoutStage).some(r => (r as any[]).length > 0);
        if (!hasKnockout || !knockoutStage) {
            return (
                 <div className="text-center bg-brand-secondary/30 border border-brand-accent p-12 rounded-2xl backdrop-blur-sm">
                    <Trophy size={48} className="mx-auto text-brand-light mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-brand-text mb-2">Knockout Stage Not Ready</h3>
                    <p className="text-brand-light">The knockout stage will appear here once it has been generated.</p>
                </div>
            );
        }

        // Filter out Final from standard Knockout view
        const knockoutWithoutFinal = { ...knockoutStage };
        // Use type assertion to modify the partial copy safely
        const finalKey = 'Final' as keyof KnockoutStageRounds;
        if (knockoutWithoutFinal[finalKey]) {
            delete (knockoutWithoutFinal as any)[finalKey];
        }

        return (
          <>
             <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-special to-yellow-200 italic uppercase tracking-tighter">
                  Knockout Stage
                </h2>
                <div className="h-1 flex-grow bg-gradient-to-r from-brand-special to-transparent rounded-full opacity-50"></div>
            </div>
            <KnockoutStageView knockoutStage={knockoutWithoutFinal} onSelectTeam={onSelectTeam} />
          </>
        );
      case 'final':
        const finalMatch = knockoutStage?.Final;
        const hasFinal = finalMatch && finalMatch.length > 0;
        
        if (!hasFinal || !knockoutStage) {
             return (
                 <div className="text-center bg-brand-secondary/30 border border-brand-accent p-12 rounded-2xl backdrop-blur-sm">
                    <Crown size={48} className="mx-auto text-yellow-500 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-brand-text mb-2">The Final Match</h3>
                    <p className="text-brand-light">The final match details will appear here once ready.</p>
                </div>
            );
        }

        // Create an object containing only the Final
        const finalStageOnly = { Final: knockoutStage.Final };

        return (
           <>
             <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-500 italic uppercase tracking-tighter drop-shadow-lg">
                  The Grand Final
                </h2>
                <div className="h-1 flex-grow bg-gradient-to-r from-yellow-500 to-transparent rounded-full opacity-50"></div>
            </div>
            <KnockoutStageView knockoutStage={finalStageOnly} onSelectTeam={onSelectTeam} />
          </>
        );

      case 'rules':
        return <RulesView rules={rules} />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-8 pb-24 md:pb-0">
        
        {/* Continuous Marquee Banner (Text) */}
        <MarqueeBanner />

        {/* Image Banner Marquee (Replacement for Carousel) */}
        {banners && banners.length > 0 && (
             <BannerMarquee banners={banners} />
        )}

        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center mb-8 relative z-30">
            <div className="flex items-center bg-brand-secondary/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                <TabButton isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')}>
                    <Users size={18}/> <span>Groups</span>
                </TabButton>
                <TabButton isActive={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')}>
                    <ListChecks size={18}/> <span>Fixtures</span>
                </TabButton>
                <TabButton isActive={activeTab === 'knockout'} onClick={() => setActiveTab('knockout')}>
                    <Trophy size={18}/> <span>Knockout</span>
                </TabButton>
                 <TabButton isActive={activeTab === 'final'} onClick={() => setActiveTab('final')}>
                    <Crown size={18} className="text-yellow-400"/> <span className="text-yellow-100">Final</span>
                </TabButton>
                <TabButton isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')}>
                    <BookOpen size={18}/> <span>Rules</span>
                </TabButton>
            </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
            {renderContent()}
        </div>

        {/* Mobile Navigation (Bottom Fixed) */}
         <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-secondary/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.5)] z-50 h-[72px] pb-2 pointer-events-auto">
             <div className="grid grid-cols-5 h-full">
                <MobileTabButton isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')} label="Groups" icon={<Users size={20} />} />
                <MobileTabButton isActive={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')} label="Fixtures" icon={<ListChecks size={20} />} />
                <MobileTabButton isActive={activeTab === 'knockout'} onClick={() => setActiveTab('knockout')} label="Knockout" icon={<Trophy size={20} />} />
                <MobileTabButton isActive={activeTab === 'final'} onClick={() => setActiveTab('final')} label="Final" icon={<Crown size={20} className={activeTab === 'final' ? 'fill-yellow-500 text-yellow-500' : ''} />} />
                <MobileTabButton isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')} label="Rules" icon={<BookOpen size={20} />} />
             </div>
        </div>
    </div>
  );
};
