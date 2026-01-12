
import React, { useState } from 'react';
import type { Team, Match, KnockoutStageRounds, KnockoutMatch, Group, TournamentState, Partner, TournamentMode } from '../../types';
import { MatchEditor } from './MatchEditor';
import { TeamManager } from './TeamManager';
import { Button } from '../shared/Button';
import { KnockoutMatchEditor } from './KnockoutMatchEditor';
import { Trophy, Users, ListChecks, Plus, BookOpen, Settings, LayoutGrid, Database, Zap, Shield, AlertCircle } from 'lucide-react';
import { KnockoutMatchForm } from './KnockoutMatchForm';
import { useToast } from '../shared/Toast';
import { Card } from '../shared/Card';
import { RulesEditor } from './RulesEditor';
import { BannerSettings } from './BannerSettings';
import { PartnerSettings } from './PartnerSettings';

interface AdminPanelProps {
  teams: Team[];
  matches: Match[];
  knockoutStage: KnockoutStageRounds | null;
  groups: Group[];
  rules: string;
  banners: string[];
  partners: Partner[];
  mode: TournamentMode;
  isDoubleRoundRobin: boolean;
  setMode: (mode: TournamentMode) => void;
  setRoundRobin: (isDouble: boolean) => void;
  updateMatchScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
  addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string) => void;
  updateTeam: (teamId: string, name: string, logoUrl: string, manager?: string | undefined, socialMediaUrl?: string | undefined, whatsappNumber?: string | undefined, isTopSeed?: boolean | undefined) => void;
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
  isLoading?: boolean;
}

type AdminTab = 'group-fixtures' | 'knockout' | 'teams' | 'rules' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('teams');
  const [isAddingMatch, setIsAddingMatch] = useState<keyof KnockoutStageRounds | null>(null);
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const { addToast } = useToast();
  
  const { 
      matches, updateMatchScore, teams, knockoutStage, groups, mode, setMode, 
      isDoubleRoundRobin, setRoundRobin, updateKnockoutMatch, rules, updateRules,
      banners, updateBanners, partners, updatePartners, initializeEmptyKnockoutStage,
      setTournamentState
  } = props;

  const handleAddKnockoutMatch = (round: keyof KnockoutStageRounds, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string) => {
      props.addKnockoutMatch(round, teamAId, teamBId, placeholderA, placeholderB);
      addToast(`Match added to ${round}.`, 'success');
      setIsAddingMatch(null);
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'group-fixtures':
        if (matches.length === 0) {
          return (
            <div className="text-center bg-brand-secondary p-8 rounded-lg border border-brand-accent border-dashed">
              <h3 className="text-xl font-bold text-brand-text mb-2">No Matches Generated</h3>
              <p className="text-brand-light">Go to the 'Teams' tab to generate the fixtures for {mode.toUpperCase()}.</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
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
        if (mode !== 'wakacl') {
            return (
                <div className="text-center bg-brand-secondary/30 p-12 rounded-2xl border border-brand-accent border-dashed">
                    <Zap size={48} className="mx-auto text-brand-light/30 mb-4" />
                    <h3 className="text-xl font-bold text-brand-text mb-2">Knockout Restricted</h3>
                    <p className="text-brand-light">Knockout stage is only available in <strong>WAKACL Hub</strong> mode. Please switch mode in settings or header.</p>
                </div>
            )
        }
        return (
          <div>
            {!knockoutStage ? (
              <div className="text-center bg-brand-secondary p-8 rounded-lg border border-brand-accent border-dashed">
                <h3 className="text-xl font-bold text-brand-text mb-2">The Knockout Stage Awaits</h3>
                <p className="text-brand-light mb-4">Finish the group stage to generate.</p>
                <div className="flex justify-center gap-4">
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
                      <h3 className="text-2xl font-bold text-brand-vibrant">{roundName}</h3>
                      <Button onClick={() => setIsAddingMatch(roundName)} variant="secondary"><Plus size={16} /> Add Match</Button>
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
          </div>
        );
      case 'teams':
        return <TeamManager {...props} onGenerationSuccess={() => setActiveTab('group-fixtures')} />;
      case 'rules':
        return <RulesEditor rules={rules} onSave={updateRules} />;
      case 'settings':
        return (
            <div className="space-y-8">
                <BannerSettings banners={banners} onUpdateBanners={updateBanners} />
                <PartnerSettings partners={partners} onUpdatePartners={updatePartners} />
            </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="pb-20">
      {/* Database Switcher */}
      <Card className="mb-8 !p-2 bg-brand-vibrant/5 border-brand-vibrant/20 border-dashed">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-vibrant/20 flex items-center justify-center text-brand-vibrant">
                      <Database size={20} />
                  </div>
                  <div>
                      <h2 className="font-black text-white italic uppercase leading-none">Database Terpilih</h2>
                      <p className="text-[10px] text-brand-light font-bold uppercase tracking-widest">
                          Mengelola Data: <span className={mode === 'wakacl' ? 'text-brand-special' : 'text-brand-vibrant'}>{mode === 'wakacl' ? 'WAKACL (Tournament)' : 'LIGA (Regular)'}</span>
                      </p>
                  </div>
              </div>
              
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
                  <button 
                    onClick={() => setMode('league')}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === 'league' ? 'bg-brand-vibrant text-brand-primary shadow-lg' : 'text-brand-light hover:text-white'}`}
                  >
                      Liga Reguler
                  </button>
                  <button 
                    onClick={() => setMode('wakacl')}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === 'wakacl' ? 'bg-brand-special text-brand-primary shadow-lg' : 'text-brand-light hover:text-white'}`}
                  >
                      WAKACL Hub
                  </button>
              </div>
          </div>
          {teams.length === 0 && (
              <div className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                  <AlertCircle size={16} />
                  <p className="text-xs font-bold">Database {mode.toUpperCase()} saat ini masih kosong. Jika data sebelumnya ada di mode lain, gunakan Backup & Restore di tab Teams.</p>
              </div>
          )}
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-brand-text flex items-center gap-3">
            <Shield className="text-brand-vibrant" />
            Admin Panel
        </h2>
        <div className="flex flex-wrap gap-1 bg-brand-secondary/50 backdrop-blur-md p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('teams')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'teams' ? 'bg-brand-vibrant text-brand-primary shadow-lg' : 'text-brand-light hover:text-white hover:bg-white/5'}`}>
              <Users size={14} className="inline mr-2" /> Teams
          </button>
          <button onClick={() => setActiveTab('group-fixtures')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'group-fixtures' ? 'bg-brand-vibrant text-brand-primary shadow-lg' : 'text-brand-light hover:text-white hover:bg-white/5'}`}>
              <ListChecks size={14} className="inline mr-2" /> Fixtures
          </button>
          <button 
              onClick={() => setActiveTab('knockout')} 
              disabled={mode !== 'wakacl'}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'knockout' ? 'bg-brand-special text-brand-primary shadow-lg' : 'text-brand-light hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed'}`}
          >
              <Trophy size={14} className="inline mr-2" /> Knockout
          </button>
          <button onClick={() => setActiveTab('rules')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'rules' ? 'bg-brand-vibrant text-brand-primary shadow-lg' : 'text-brand-light hover:text-white hover:bg-white/5'}`}>
              <BookOpen size={14} className="inline mr-2" /> Rules
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-brand-vibrant text-brand-primary shadow-lg' : 'text-brand-light hover:text-white hover:bg-white/5'}`}>
              <Settings size={14} className="inline mr-2" /> Settings
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderContent()}
      </div>
    </div>
  );
};
