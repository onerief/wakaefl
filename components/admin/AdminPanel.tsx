
import React, { useState } from 'react';
import type { Team, Match, KnockoutStageRounds, KnockoutMatch, Group, TournamentState, Partner, TournamentMode, TournamentStatus } from '../../types';
import { MatchEditor } from './MatchEditor';
import { TeamManager } from './TeamManager';
import { Button } from '../shared/Button';
import { KnockoutMatchEditor } from './KnockoutMatchEditor';
import { Trophy, Users, ListChecks, Plus, BookOpen, Settings, Database, PlayCircle, StopCircle, Archive, LayoutDashboard, Zap } from 'lucide-react';
import { KnockoutMatchForm } from './KnockoutMatchForm';
import { useToast } from '../shared/Toast';
import { Card } from '../shared/Card';
import { RulesEditor } from './RulesEditor';
import { BannerSettings } from './BannerSettings';
import { PartnerSettings } from './PartnerSettings';
import { GenerateBracketConfirmationModal } from './GenerateBracketConfirmationModal';
import { ConfirmationModal } from './ConfirmationModal';

interface AdminPanelProps {
  teams: Team[];
  matches: Match[];
  knockoutStage: KnockoutStageRounds | null;
  groups: Group[];
  rules: string;
  banners: string[];
  partners: Partner[];
  mode: TournamentMode;
  status: TournamentStatus;
  isDoubleRoundRobin: boolean;
  setMode: (mode: TournamentMode) => void;
  setRoundRobin: (isDouble: boolean) => void;
  updateMatchScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
  addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => void;
  updateTeam: (teamId: string, name: string, logoUrl: string, manager?: string | undefined, socialMediaUrl?: string | undefined, whatsappNumber?: string | undefined, isTopSeed?: boolean | undefined, ownerEmail?: string | undefined) => void;
  deleteTeam: (teamId: string) => void;
  generateKnockoutBracket: () => { success: boolean; message?: string };
  updateKnockoutMatch: (matchId: string, match: KnockoutMatch) => void;
  initializeEmptyKnockoutStage: () => void;
  addKnockoutMatch: (round: keyof KnockoutStageRounds, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string) => void;
  deleteKnockoutMatch: (matchId: string) => void;
  resetTournament: () => void;
  updateRules: (rules: string) => void;
  updateBanners: (banners: string[]) => void;
  updatePartners: (partners: Partner[]) => void;
  manualAddGroup: (name: string) => void;
  manualDeleteGroup: (groupId: string) => void;
  manualAddTeamToGroup: (teamId: string, groupId: string) => void;
  manualRemoveTeamFromGroup: (teamId: string, groupId: string) => void;
  generateMatchesFromGroups: () => void;
  setTournamentState: (state: TournamentState) => void;
  importLegacyData: (jsonData: any) => void;
  finalizeSeason: () => { success: boolean; message: string };
  resumeSeason: () => void;
  startNewSeason: () => void; 
  resolveTeamClaim?: (teamId: string, approved: boolean) => void;
  isLoading?: boolean;
}

type AdminTab = 'group-fixtures' | 'knockout' | 'teams' | 'rules' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('teams');
  const [isAddingMatch, setIsAddingMatch] = useState<keyof KnockoutStageRounds | null>(null);
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const [showGenerateBracketConfirm, setShowGenerateBracketConfirm] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showStartNewSeasonConfirm, setShowStartNewSeasonConfirm] = useState(false);
  const { addToast } = useToast();
  
  const { 
      matches, updateMatchScore, teams, knockoutStage, groups, mode, setMode, 
      status, finalizeSeason, resumeSeason, startNewSeason,
      updateKnockoutMatch, rules, updateRules,
      banners, updateBanners, partners, updatePartners, initializeEmptyKnockoutStage,
      generateKnockoutBracket
  } = props;

  const handleAddKnockoutMatch = (round: keyof KnockoutStageRounds, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string) => {
      props.addKnockoutMatch(round, teamAId, teamBId, placeholderA, placeholderB);
      addToast(`Match added to ${round}.`, 'success');
      setIsAddingMatch(null);
  }

  const handleGenerateBracket = () => {
      const result = generateKnockoutBracket();
      if (result.success) {
          addToast("Knockout bracket generated successfully!", 'success');
      } else {
          addToast(result.message || "Failed to generate bracket.", 'error');
      }
      setShowGenerateBracketConfirm(false);
  }

  const handleFinalizeSeason = () => {
      const result = finalizeSeason();
      if (result.success) {
          addToast(result.message, 'success');
      } else {
          addToast(result.message, 'error');
      }
      setShowFinalizeConfirm(false);
  }

  const handleStartNewSeason = () => {
      startNewSeason();
      addToast("New season started! History has been preserved.", 'success');
      setShowStartNewSeasonConfirm(false);
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'group-fixtures':
        if (matches.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-64 text-center bg-brand-secondary/20 rounded-2xl border border-dashed border-white/10">
              <ListChecks size={48} className="text-brand-light/20 mb-4" />
              <h3 className="text-xl font-bold text-brand-text mb-2">No Matches Generated</h3>
              <p className="text-brand-light">Go to the 'Teams' tab to generate fixtures.</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic uppercase text-brand-text mb-4">Fixtures & Results</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {groups.map(group => {
                    const groupLetter = group.name.split(' ')[1];
                    const groupMatches = matches.filter(m => m.group === groupLetter);
                    if (groupMatches.length === 0) return null;

                    const schedule = groupMatches.reduce((acc, match) => {
                        const scheduleKey = `Matchday ${match.matchday || 1}${match.leg ? ` - Leg ${match.leg}` : ''}`;
                        if (!acc[scheduleKey]) acc[scheduleKey] = [];
                        acc[scheduleKey].push(match);
                        return acc;
                    }, {} as Record<string, Match[]>);
                    
                    const scheduleKeys = Object.keys(schedule).sort((a, b) => {
                        const numsA = a.match(/\d+/g)!.map(Number);
                        const numsB = b.match(/\d+/g)!.map(Number);
                        if (numsA[0] !== numsB[0]) return numsA[0] - numsB[0];
                        return (numsA[1] || 0) - (numsB[1] || 0);
                    });

                    const stateKey = group.id;
                    const activeScheduleKey = selectedMatchdays[stateKey] || (scheduleKeys.length > 0 ? scheduleKeys[0] : '');

                    return (
                        <div key={`${group.id}-fixtures`} className="bg-brand-secondary/30 p-4 rounded-xl border border-white/5 shadow-lg">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                                <h4 className="text-lg font-bold text-brand-vibrant uppercase tracking-tight">{group.name}</h4>
                                 {scheduleKeys.length > 1 && (
                                     <select
                                        value={activeScheduleKey}
                                        onChange={(e) => setSelectedMatchdays(prev => ({ ...prev, [stateKey]: e.target.value }))}
                                        className="p-1.5 bg-brand-primary border border-brand-accent rounded text-brand-text text-xs font-medium focus:ring-1 focus:ring-brand-vibrant outline-none"
                                    >
                                        {scheduleKeys.map(key => <option key={key} value={key}>{key}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="space-y-3">
                                 {activeScheduleKey && schedule[activeScheduleKey] ? (
                                    schedule[activeScheduleKey].sort((a, b) => a.id.localeCompare(b.id)).map(match => (
                                        <MatchEditor key={match.id} match={match} onUpdateScore={updateMatchScore} onGenerateSummary={async () => ''} onEditSchedule={() => {}} />
                                    ))
                                ) : <p className="text-brand-light text-center py-4 text-sm">No matches.</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        );
      case 'knockout':
        if (mode === 'league') {
            return (
                <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-brand-secondary/20 rounded-2xl border border-dashed border-white/10">
                    <Zap size={48} className="text-brand-light/20 mb-4" />
                    <h3 className="text-xl font-bold text-brand-text mb-2">Knockout Restricted</h3>
                    <p className="text-brand-light">Switch to <strong>WAKACL</strong> or <strong>2 Wilayah</strong> mode.</p>
                </div>
            )
        }
        return (
          <div className="space-y-6">
             <h2 className="text-2xl font-black italic uppercase text-brand-text mb-4">Knockout Stage</h2>
            {!knockoutStage || Object.values(knockoutStage).every((r: any) => r.length === 0) ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-brand-secondary/20 rounded-2xl border border-dashed border-white/10">
                <Trophy size={48} className="text-brand-light/20 mb-4" />
                <h3 className="text-xl font-bold text-brand-text mb-2">Ready to Rumble?</h3>
                <p className="text-brand-light mb-6">Generate the bracket once group stages are complete.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => setShowGenerateBracketConfirm(true)}>
                    Auto-Generate Bracket
                  </Button>
                  <Button onClick={() => initializeEmptyKnockoutStage()} variant="secondary">
                    Create Manually
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {(Object.keys(knockoutStage) as Array<keyof KnockoutStageRounds>).map((roundName) => (
                  <Card key={roundName} className="border-white/5">
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                      <h3 className="text-lg font-bold text-brand-vibrant uppercase tracking-wider">{roundName}</h3>
                      <Button onClick={() => setIsAddingMatch(roundName)} variant="secondary" className="!px-3 !py-1 text-xs h-8"><Plus size={12} /> Add Match</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {knockoutStage[roundName].map((match: KnockoutMatch) => (
                         <KnockoutMatchEditor key={match.id} match={match} onUpdateScore={(id, data) => updateKnockoutMatch(id, { ...match, ...data })} onEdit={() => {}} onDelete={() => props.deleteKnockoutMatch(match.id)} />
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
             {isAddingMatch && <KnockoutMatchForm round={isAddingMatch} teams={teams} onSave={handleAddKnockoutMatch} onClose={() => setIsAddingMatch(null)} />}
             {showGenerateBracketConfirm && (
                 <GenerateBracketConfirmationModal 
                    onConfirm={handleGenerateBracket} 
                    onCancel={() => setShowGenerateBracketConfirm(false)} 
                 />
             )}
          </div>
        );
      case 'teams':
        return <TeamManager {...props} onGenerationSuccess={() => setActiveTab('group-fixtures')} />;
      case 'rules':
        return <RulesEditor rules={rules} onSave={updateRules} />;
      case 'settings':
        return (
            <div className="space-y-6">
                 <h2 className="text-2xl font-black italic uppercase text-brand-text mb-4">Settings & Config</h2>
                <Card className="border-brand-accent/50">
                    <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                        <Settings size={20} className="text-brand-vibrant" /> Season Status
                    </h3>
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <p className="font-semibold text-white flex items-center gap-2 text-sm">
                                Current Status: 
                                <span className={`px-2 py-0.5 rounded text-xs uppercase font-black tracking-wider ${status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {status}
                                </span>
                            </p>
                            <p className="text-xs text-brand-light mt-1">
                                {status === 'active' 
                                    ? "Season is currently active." 
                                    : "Season is completed. Data is read-only."}
                            </p>
                        </div>
                        {status === 'active' ? (
                            <Button onClick={() => setShowFinalizeConfirm(true)} className="bg-yellow-600 text-white hover:bg-yellow-700 border-none w-full justify-center">
                                <StopCircle size={16} /> End Season & Crown Champion
                            </Button>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button onClick={resumeSeason} variant="secondary" className="w-full justify-center">
                                    <PlayCircle size={16} /> Resume Season
                                </Button>
                                <Button onClick={() => setShowStartNewSeasonConfirm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-none w-full justify-center">
                                    <Archive size={16} /> Start New Season
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
                <BannerSettings banners={banners} onUpdateBanners={updateBanners} />
                <PartnerSettings partners={partners} onUpdatePartners={updatePartners} />
            </div>
        );
      default:
        return null;
    }
  }

  // Helper for Sidebar Buttons
  const NavButton = ({ tab, icon: Icon, label }: { tab: AdminTab, icon: any, label: string }) => (
      <button
        onClick={() => setActiveTab(tab)}
        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 font-bold text-sm ${
            activeTab === tab 
            ? 'bg-brand-vibrant text-white shadow-lg shadow-brand-vibrant/20' 
            : 'text-brand-light hover:bg-white/5 hover:text-white'
        }`}
      >
          <Icon size={18} className={activeTab === tab ? 'text-white' : 'text-brand-light opacity-70'} />
          {label}
      </button>
  );

  const ModeButton = ({ m, label, colorClass, borderClass }: { m: TournamentMode, label: string, colorClass: string, borderClass: string }) => (
    <button
        onClick={() => setMode(m)}
        className={`w-full text-left px-4 py-2.5 rounded-lg transition-all border flex items-center justify-between group ${
            mode === m 
            ? `${colorClass} ${borderClass} shadow-md` 
            : 'bg-black/20 border-transparent text-brand-light hover:bg-white/5 hover:text-white'
        }`}
    >
        <span className="text-xs font-black uppercase tracking-wider">{label}</span>
        {mode === m && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-4 lg:h-[calc(100vh-140px)]"> 
    {/* Set fixed height on desktop to allow inner scroll */}
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
          
          {/* Database Switcher */}
          <div className="bg-brand-secondary/40 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl">
             <div className="flex items-center gap-2 mb-4 px-1">
                 <Database size={16} className="text-brand-light" />
                 <h3 className="text-xs font-black text-brand-light uppercase tracking-widest">Select Database</h3>
             </div>
             <div className="space-y-2">
                 <ModeButton m="league" label="Liga Reguler" colorClass="bg-blue-600 text-white" borderClass="border-blue-500" />
                 <ModeButton m="two_leagues" label="2 Wilayah" colorClass="bg-purple-600 text-white" borderClass="border-purple-500" />
                 <ModeButton m="wakacl" label="WAKACL" colorClass="bg-yellow-600 text-white" borderClass="border-yellow-500" />
             </div>
          </div>

          {/* Menu Tabs */}
          <nav className="bg-brand-secondary/40 backdrop-blur-sm border border-white/10 rounded-2xl p-2 shadow-xl flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar">
              <NavButton tab="teams" icon={Users} label="Teams Management" />
              <NavButton tab="group-fixtures" icon={ListChecks} label="Fixtures & Results" />
              <NavButton tab="knockout" icon={Trophy} label="Knockout Stage" />
              <NavButton tab="rules" icon={BookOpen} label="Rules" />
              <NavButton tab="settings" icon={Settings} label="Settings" />
          </nav>
          
          <div className="hidden lg:block bg-gradient-to-br from-brand-vibrant/20 to-transparent p-6 rounded-2xl border border-white/5 text-center">
             <LayoutDashboard size={32} className="mx-auto text-brand-vibrant mb-2 opacity-50" />
             <p className="text-[10px] text-brand-light uppercase tracking-widest font-bold">Admin Control Center</p>
          </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-brand-secondary/20 backdrop-blur-sm border border-white/5 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-vibrant/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        {/* Content Render - Wrapped in Scrollable Div */}
        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 lg:pb-0">
                {renderContent()}
             </div>
        </div>
      </main>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showFinalizeConfirm}
        onClose={() => setShowFinalizeConfirm(false)}
        onConfirm={handleFinalizeSeason}
        title="Finalize Season"
        message="Are you sure you want to end the current season? The current leader/champion will be recorded in the Hall of Fame history."
        confirmText="Yes, End Season"
        confirmButtonClass="bg-yellow-600 text-white hover:bg-yellow-700"
      />

      <ConfirmationModal
        isOpen={showStartNewSeasonConfirm}
        onClose={() => setShowStartNewSeasonConfirm(false)}
        onConfirm={handleStartNewSeason}
        title="Start New Season"
        message={
            <div className="text-sm">
                <p className="mb-2">This will <strong>clear all current teams, matches, and groups</strong> to prepare for a fresh season.</p>
                <p>Your Hall of Fame history, partners, and rules will be preserved. Are you sure?</p>
            </div>
        }
        confirmText="Yes, Start Fresh"
        confirmButtonClass="bg-blue-600 text-white hover:bg-blue-700"
      />
    </div>
  );
};
