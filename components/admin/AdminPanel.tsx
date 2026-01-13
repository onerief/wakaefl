
import React, { useState } from 'react';
import type { Team, Match, KnockoutStageRounds, KnockoutMatch, Group, TournamentState, Partner, TournamentMode, TournamentStatus } from '../../types';
import { MatchEditor } from './MatchEditor';
import { TeamManager } from './TeamManager';
import { Button } from '../shared/Button';
import { KnockoutMatchEditor } from './KnockoutMatchEditor';
import { Trophy, Users, ListChecks, Plus, BookOpen, Settings, LayoutGrid, Database, Zap, Shield, AlertCircle, PlayCircle, StopCircle, Archive } from 'lucide-react';
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
  startNewSeason: () => void; // New prop
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
      isDoubleRoundRobin, setRoundRobin, updateKnockoutMatch, rules, updateRules,
      banners, updateBanners, partners, updatePartners, initializeEmptyKnockoutStage,
      setTournamentState, generateKnockoutBracket
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
            <div className="text-center bg-brand-secondary p-8 rounded-lg border border-brand-accent border-dashed mt-4">
              <h3 className="text-xl font-bold text-brand-text mb-2">No Matches Generated</h3>
              <p className="text-brand-light">Go to the 'Teams' tab to generate the fixtures for {mode.toUpperCase()}.</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <div key={`${group.id}-fixtures`} className="bg-brand-secondary p-4 rounded-lg border border-white/5 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xl font-bold text-brand-vibrant italic uppercase tracking-tighter">{group.name}</h4>
                                 {scheduleKeys.length > 1 && (
                                     <select
                                        value={activeScheduleKey}
                                        onChange={(e) => setSelectedMatchdays(prev => ({ ...prev, [stateKey]: e.target.value }))}
                                        className="p-2 bg-brand-primary border border-brand-accent rounded-md text-brand-text text-sm"
                                    >
                                        {scheduleKeys.map(key => <option key={key} value={key}>{key}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="space-y-4">
                                 {activeScheduleKey && schedule[activeScheduleKey] ? (
                                    schedule[activeScheduleKey].sort((a, b) => a.id.localeCompare(b.id)).map(match => (
                                        <MatchEditor key={match.id} match={match} onUpdateScore={updateMatchScore} onGenerateSummary={async () => ''} onEditSchedule={() => {}} />
                                    ))
                                ) : <p className="text-brand-light text-center py-4">No matches for this selection.</p>}
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
                <div className="text-center bg-brand-secondary/30 p-12 rounded-2xl border border-brand-accent border-dashed mt-4">
                    <Zap size={48} className="mx-auto text-brand-light/30 mb-4" />
                    <h3 className="text-xl font-bold text-brand-text mb-2">Knockout Restricted</h3>
                    <p className="text-brand-light">Knockout stage is only available in <strong>WAKACL</strong> or <strong>2 Wilayah</strong> mode.</p>
                </div>
            )
        }
        return (
          <div className="mt-4">
            {!knockoutStage || Object.values(knockoutStage).every((r: any) => r.length === 0) ? (
              <div className="text-center bg-brand-secondary p-8 rounded-lg border border-brand-accent border-dashed">
                <h3 className="text-xl font-bold text-brand-text mb-2">The Knockout Stage Awaits</h3>
                <p className="text-brand-light mb-4">Finish the group stage to generate.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
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
                  <div key={roundName}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg sm:text-2xl font-bold text-brand-vibrant">{roundName}</h3>
                      <Button onClick={() => setIsAddingMatch(roundName)} variant="secondary" className="!px-3 !py-1.5 text-xs"><Plus size={14} /> Add</Button>
                    </div>
                    <div className="space-y-4">
                      {knockoutStage[roundName].map((match: KnockoutMatch) => (
                         <KnockoutMatchEditor key={match.id} match={match} onUpdateScore={(id, data) => updateKnockoutMatch(id, { ...match, ...data })} onEdit={() => {}} onDelete={() => props.deleteKnockoutMatch(match.id)} />
                      ))}
                    </div>
                  </div>
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
        return <div className="mt-4"><TeamManager {...props} onGenerationSuccess={() => setActiveTab('group-fixtures')} /></div>;
      case 'rules':
        return <div className="mt-4"><RulesEditor rules={rules} onSave={updateRules} /></div>;
      case 'settings':
        return (
            <div className="space-y-8 mt-4">
                <div className="bg-brand-secondary/30 p-6 rounded-xl border border-brand-accent">
                    <h3 className="text-xl font-bold text-brand-text mb-4">Season Control</h3>
                    <div className="flex flex-col gap-4">
                        <div className="p-3 bg-black/20 rounded-lg">
                            <p className="font-semibold text-white flex items-center gap-2">
                                Status: 
                                <span className={`px-2 py-0.5 rounded text-xs uppercase font-black tracking-wider ${status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {status}
                                </span>
                            </p>
                            <p className="text-[10px] text-brand-light mt-1 leading-relaxed">
                                {status === 'active' 
                                    ? "Season is ongoing. Matches open for scoring." 
                                    : "Season finalized. Winner recorded in Hall of Fame."}
                            </p>
                        </div>
                        {status === 'active' ? (
                            <Button onClick={() => setShowFinalizeConfirm(true)} className="bg-yellow-600 text-white hover:bg-yellow-700 border-none w-full justify-center">
                                <StopCircle size={16} /> End Season & Crown Champion
                            </Button>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button onClick={resumeSeason} variant="secondary" className="w-full justify-center">
                                    <PlayCircle size={16} /> Resume/Edit
                                </Button>
                                <Button onClick={() => setShowStartNewSeasonConfirm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-none w-full justify-center">
                                    <Archive size={16} /> Start New Season
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <BannerSettings banners={banners} onUpdateBanners={updateBanners} />
                <PartnerSettings partners={partners} onUpdatePartners={updatePartners} />
            </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="pb-24">
      {/* Header & Title */}
      <div className="flex items-center gap-3 mb-6">
          <Shield className="text-brand-vibrant w-8 h-8" />
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-brand-text">Admin Panel</h2>
      </div>

      {/* Database Switcher - Horizontal Scroll on Mobile */}
      <Card className="mb-6 !p-3 bg-brand-vibrant/5 border-brand-vibrant/20 border-dashed">
          <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-1">
                  <div className="w-8 h-8 rounded-lg bg-brand-vibrant/20 flex items-center justify-center text-brand-vibrant shrink-0">
                      <Database size={16} />
                  </div>
                  <div className="min-w-0">
                      <h2 className="text-sm font-black text-white italic uppercase leading-none">Database</h2>
                      <p className="text-[10px] text-brand-light font-bold uppercase tracking-widest truncate">
                          Mode: <span className="text-white">{mode.replace('_', ' ')}</span>
                      </p>
                  </div>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:pb-0 no-scrollbar">
                  <button 
                    onClick={() => setMode('league')}
                    className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${mode === 'league' ? 'bg-brand-vibrant text-brand-primary border-brand-vibrant' : 'bg-black/40 text-brand-light border-white/5 hover:bg-white/5'}`}
                  >
                      Liga Reguler
                  </button>
                  <button 
                    onClick={() => setMode('two_leagues')}
                    className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${mode === 'two_leagues' ? 'bg-purple-600 text-white border-purple-500' : 'bg-black/40 text-brand-light border-white/5 hover:bg-white/5'}`}
                  >
                      Liga 2 Wilayah
                  </button>
                  <button 
                    onClick={() => setMode('wakacl')}
                    className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${mode === 'wakacl' ? 'bg-brand-special text-brand-primary border-brand-special' : 'bg-black/40 text-brand-light border-white/5 hover:bg-white/5'}`}
                  >
                      WAKACL Hub
                  </button>
              </div>
          </div>
      </Card>

      {/* Navigation Tabs - Horizontal Scroll on Mobile */}
      <div className="sticky top-[64px] z-40 bg-brand-primary/95 backdrop-blur-md py-2 border-b border-white/5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:static sm:border-none">
        <div className="flex gap-2 overflow-x-auto no-scrollbar sm:flex-wrap">
          <button onClick={() => setActiveTab('teams')} className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'teams' ? 'bg-brand-vibrant text-brand-primary shadow-lg' : 'bg-brand-secondary/50 text-brand-light hover:text-white border border-white/5'}`}>
              <Users size={14} /> Teams
          </button>
          <button onClick={() => setActiveTab('group-fixtures')} className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'group-fixtures' ? 'bg-brand-vibrant text-brand-primary shadow-lg' : 'bg-brand-secondary/50 text-brand-light hover:text-white border border-white/5'}`}>
              <ListChecks size={14} /> Fixtures
          </button>
          <button 
              onClick={() => setActiveTab('knockout')} 
              disabled={mode === 'league'}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'knockout' ? 'bg-brand-special text-brand-primary shadow-lg' : 'bg-brand-secondary/50 text-brand-light hover:text-white border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed'} ${mode === 'league' ? 'hidden' : ''}`}
          >
              <Trophy size={14} /> Knockout
          </button>
          <button onClick={() => setActiveTab('rules')} className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'rules' ? 'bg-brand-vibrant text-brand-primary shadow-lg' : 'bg-brand-secondary/50 text-brand-light hover:text-white border border-white/5'}`}>
              <BookOpen size={14} /> Rules
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-brand-vibrant text-brand-primary shadow-lg' : 'bg-brand-secondary/50 text-brand-light hover:text-white border border-white/5'}`}>
              <Settings size={14} /> Settings
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[50vh]">
        {renderContent()}
      </div>
      
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
