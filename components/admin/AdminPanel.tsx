
import React, { useState } from 'react';
import type { Team, Match, KnockoutStageRounds, KnockoutMatch, Group, TournamentState, Partner, TournamentMode, TournamentStatus, SeasonHistory } from '../../types';
import { MatchEditor } from './MatchEditor';
import { TeamManager } from './TeamManager';
import { Button } from '../shared/Button';
import { KnockoutMatchEditor } from './KnockoutMatchEditor';
import { Trophy, Users, ListChecks, Plus, BookOpen, Settings, Database, PlayCircle, StopCircle, Archive, LayoutDashboard, Zap, ChevronDown, Check, Menu, Lock, Unlock, Crown, Image as ImageIcon, ShieldCheck, HelpCircle, Bell, ChevronRight, LayoutGrid, CloudCheck, RefreshCw } from 'lucide-react';
import { KnockoutMatchForm } from './KnockoutMatchForm';
import { useToast } from '../shared/Toast';
import { Card } from '../shared/Card';
import { RulesEditor } from './RulesEditor';
import { BannerSettings } from './BannerSettings';
import { PartnerSettings } from './PartnerSettings';
import { BrandingSettings } from './BrandingSettings';
import { HistoryManager } from './HistoryManager';
import { GenerateBracketConfirmationModal } from './GenerateBracketConfirmationModal';
import { ConfirmationModal } from './ConfirmationModal';
import { MatchScheduleEditor } from './MatchScheduleEditor';
import { KnockoutMatchScheduleEditor } from './KnockoutMatchScheduleEditor';

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
  history: SeasonHistory[];
  isDoubleRoundRobin: boolean;
  isSyncing?: boolean; // New prop
  setMode: (mode: TournamentMode) => void;
  setRoundRobin: (isDouble: boolean) => void;
  updateMatchScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
  addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => void;
  updateTeam: (teamId: string, name: string, logoUrl: string, manager?: string | undefined, socialMediaUrl?: string | undefined, whatsappNumber?: string | undefined, isTopSeed?: boolean | undefined, ownerEmail?: string | undefined) => void;
  deleteTeam: (teamId: string) => void;
  generateKnockoutBracket: () => { success: boolean; message?: string };
  updateKnockoutMatch: (matchId: string, match: KnockoutMatch) => void;
  initializeEmptyKnockoutStage: () => void;
  addKnockoutMatch: (round: keyof KnockoutStageRounds, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string, matchNumber: number) => void;
  deleteKnockoutMatch?: (matchId: string) => void;
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
  addHistoryEntry: (entry: SeasonHistory) => void;
  deleteHistoryEntry: (id: string) => void;
  resolveTeamClaim?: (teamId: string, approved: boolean) => void;
  isLoading?: boolean;
  isRegistrationOpen?: boolean; 
  setRegistrationStatus?: (isOpen: boolean) => void;
  updateKnockoutMatchDetails?: (matchId: string, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string, matchNumber: number) => void;
  updateMatchSchedule?: (matchId: string, teamAId: string, teamBId: string) => void;
  headerLogoUrl?: string;
  updateHeaderLogo?: (url: string) => void;
}

type AdminTab = 'group-fixtures' | 'knockout' | 'teams' | 'history' | 'rules' | 'settings';

const ADMIN_TABS: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'group-fixtures', label: 'Fixtures', icon: ListChecks },
    { id: 'knockout', label: 'Knockout', icon: Trophy },
    { id: 'history', label: 'History', icon: Crown },
    { id: 'rules', label: 'Rules', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
];

const MODES: { id: TournamentMode; label: string }[] = [
    { id: 'league', label: 'Liga Reguler' },
    { id: 'two_leagues', label: '2 Wilayah' },
    { id: 'wakacl', label: 'WAKACL' },
];

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('teams');
  const [isAddingMatch, setIsAddingMatch] = useState<keyof KnockoutStageRounds | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingKnockoutMatch, setEditingKnockoutMatch] = useState<KnockoutMatch | null>(null);
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const [showGenerateBracketConfirm, setShowGenerateBracketConfirm] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showStartNewSeasonConfirm, setShowStartNewSeasonConfirm] = useState(false);
  
  const [openSettingsSection, setOpenSettingsSection] = useState<string | null>('branding');

  const { addToast } = useToast();
  
  const { 
      matches, updateMatchScore, teams, knockoutStage, groups, mode, setMode, 
      status, finalizeSeason, resumeSeason, startNewSeason,
      updateKnockoutMatch, rules, updateRules,
      banners, updateBanners, partners, updatePartners, initializeEmptyKnockoutStage,
      generateKnockoutBracket, 
      isRegistrationOpen, 
      setRegistrationStatus,
      deleteKnockoutMatch, updateKnockoutMatchDetails, updateMatchSchedule,
      headerLogoUrl, updateHeaderLogo, history, addHistoryEntry, deleteHistoryEntry,
      isSyncing
  } = props;

  const AccordionItem = ({ id, label, icon: Icon, children }: React.PropsWithChildren<{ id: string, label: string, icon: any }>) => {
      const isOpen = openSettingsSection === id;
      return (
          <div className="mb-3">
              <button
                  onClick={() => setOpenSettingsSection(isOpen ? null : id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${
                      isOpen ? 'bg-brand-vibrant/10 border-brand-vibrant/30' : 'bg-black/20 border-white/5 hover:bg-white/5'
                  }`}
              >
                  <div className="flex items-center gap-3">
                      <Icon size={18} className={isOpen ? 'text-brand-vibrant' : 'text-brand-light'} />
                      <span className={`text-sm font-bold uppercase tracking-wider ${isOpen ? 'text-white' : 'text-brand-light'}`}>{label}</span>
                  </div>
                  <ChevronDown size={18} className={`text-brand-light transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-vibrant' : ''}`} />
              </button>
              {isOpen && (
                  <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
                      {children}
                  </div>
              )}
          </div>
      );
  };

  const handleAddKnockoutMatch = (round: keyof KnockoutStageRounds, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string, matchNumber: number) => {
      props.addKnockoutMatch(round, teamAId, teamBId, placeholderA, placeholderB, matchNumber);
      addToast(`Match #${matchNumber} added to ${round}.`, 'success');
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
      addToast("Musim baru dimulai! Data histori telah diamankan.", 'success');
      setShowStartNewSeasonConfirm(false);
  }

  const handleSetRegistration = (status: boolean) => {
      if (setRegistrationStatus) {
          setRegistrationStatus(status);
          addToast(status ? 'Pendaftaran dibuka.' : 'Pendaftaran ditutup.', 'info');
      }
  }

  const handleEditMatchSchedule = (matchId: string, teamAId: string, teamBId: string) => {
      if (updateMatchSchedule) {
          updateMatchSchedule(matchId, teamAId, teamBId);
          addToast('Match schedule updated.', 'success');
          setEditingMatch(null);
      }
  }

  const handleEditKnockoutMatchDetails = (matchId: string, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string, matchNumber: number) => {
      if (updateKnockoutMatchDetails) {
          updateKnockoutMatchDetails(matchId, teamAId, teamBId, placeholderA, placeholderB, matchNumber);
          addToast('Knockout match details updated.', 'success');
          setEditingKnockoutMatch(null);
      }
  }

  const handleDeleteKnockoutMatch = (id: string) => {
      if (deleteKnockoutMatch) {
          deleteKnockoutMatch(id);
          addToast('Match deleted.', 'success');
      } else {
          addToast('Delete function not available.', 'error');
      }
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
            <h2 className="text-2xl font-black italic uppercase text-brand-text mb-4 hidden lg:block">Fixtures & Results</h2>
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
                                        <MatchEditor 
                                            key={match.id} 
                                            match={match} 
                                            onUpdateScore={updateMatchScore} 
                                            onGenerateSummary={async () => ''} 
                                            onEditSchedule={setEditingMatch} 
                                        />
                                    ))
                                ) : <p className="text-brand-light text-center py-4 text-sm">No matches.</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
            {editingMatch && (
                <MatchScheduleEditor 
                    match={editingMatch}
                    teams={teams}
                    onSave={handleEditMatchSchedule}
                    onClose={() => setEditingMatch(null)}
                />
            )}
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
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-2xl font-black italic uppercase text-brand-text">Knockout Stage</h2>
                {knockoutStage && (
                    <Button onClick={() => setIsAddingMatch('Quarter-finals')} className="!py-2.5 shadow-brand-vibrant/20">
                        <Plus size={18} /> Tambah Match Manual
                    </Button>
                )}
             </div>

            {!knockoutStage || Object.values(knockoutStage).every((r: any) => r.length === 0) ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-brand-secondary/20 rounded-2xl border border-dashed border-white/10">
                <Trophy size={48} className="text-brand-light/20 mb-4" />
                <h3 className="text-xl font-bold text-brand-text mb-2">Ready to Rumble?</h3>
                <p className="text-brand-light mb-6 text-sm">Generate the bracket once group stages are complete.</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Button onClick={() => setShowGenerateBracketConfirm(true)} className="w-full">
                    Auto-Generate Bracket
                  </Button>
                  <Button onClick={() => { initializeEmptyKnockoutStage(); setIsAddingMatch('Quarter-finals'); }} variant="secondary" className="w-full">
                    Create Manually
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {(Object.keys(knockoutStage) as Array<keyof KnockoutStageRounds>).map((roundName) => (
                  <Card key={roundName} className="border-white/5 !p-3 sm:!p-6">
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                      <h3 className="text-sm sm:text-lg font-bold text-brand-vibrant uppercase tracking-wider">{roundName}</h3>
                      <Button onClick={() => setIsAddingMatch(roundName)} variant="secondary" className="!px-2 sm:!px-3 !py-1 text-[10px] sm:text-xs h-7 sm:h-8"><Plus size={12} /> Add Match</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {knockoutStage[roundName].sort((a,b) => a.matchNumber - b.matchNumber).map((match: KnockoutMatch) => (
                         <KnockoutMatchEditor 
                            key={match.id} 
                            match={match} 
                            onUpdateScore={(id, data) => updateKnockoutMatch(id, { ...match, ...data })} 
                            onEdit={setEditingKnockoutMatch} 
                            onDelete={() => handleDeleteKnockoutMatch(match.id)} 
                        />
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
             {isAddingMatch && <KnockoutMatchForm round={isAddingMatch} teams={teams} onSave={handleAddKnockoutMatch} onClose={() => setIsAddingMatch(null)} />}
             {editingKnockoutMatch && (
                 <KnockoutMatchScheduleEditor 
                    match={editingKnockoutMatch}
                    teams={teams}
                    onSave={handleEditKnockoutMatchDetails}
                    onClose={() => setEditingKnockoutMatch(null)}
                 />
             )}
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
      case 'history':
        return <HistoryManager history={history} teams={teams} onAddEntry={addHistoryEntry} onDeleteEntry={deleteHistoryEntry} />;
      case 'rules':
        return <RulesEditor rules={rules} onSave={updateRules} />;
      case 'settings':
        return (
            <div className="space-y-4 pb-24">
                 <h2 className="text-2xl font-black italic uppercase text-brand-text mb-4 hidden lg:block">Settings & Config</h2>
                
                <div className="lg:hidden space-y-2">
                    <AccordionItem id="branding" label="Website Branding" icon={ImageIcon}>
                         {updateHeaderLogo && (
                            <BrandingSettings 
                                headerLogoUrl={headerLogoUrl || ''} 
                                onUpdateHeaderLogo={updateHeaderLogo} 
                            />
                        )}
                    </AccordionItem>

                    <AccordionItem id="registration" label="Registration Status" icon={Users}>
                         {setRegistrationStatus && (
                            <Card className="border-brand-accent/50 z-10 relative !p-3">
                                <div className="flex flex-col items-stretch justify-between p-4 bg-black/20 rounded-xl border border-white/5 gap-4">
                                    <div className="text-center">
                                        <p className="font-bold text-white text-sm">Status Pendaftaran Publik</p>
                                        <p className="text-[10px] text-brand-light mt-1">
                                            {isRegistrationOpen 
                                                ? "Tombol 'Daftar' terlihat di Home." 
                                                : "Pendaftaran ditutup."}
                                        </p>
                                    </div>
                                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                                        <button
                                            onClick={() => handleSetRegistration(true)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${isRegistrationOpen ? 'bg-green-600 text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
                                        >
                                            <Unlock size={14} /> Open
                                        </button>
                                        <button
                                            onClick={() => handleSetRegistration(false)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isRegistrationOpen ? 'bg-red-600 text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
                                        >
                                            <Lock size={14} /> Closed
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </AccordionItem>

                    <AccordionItem id="season" label="Season Controls" icon={Settings}>
                         <Card className="border-brand-accent/50 !p-3">
                            <div className="flex flex-col gap-4">
                                <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-center">
                                    <p className="font-semibold text-white text-sm">
                                        Current Status: 
                                        <span className={`ml-2 px-2 py-0.5 rounded text-xs uppercase font-black tracking-wider ${status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {status}
                                        </span>
                                    </p>
                                </div>
                                {status === 'active' ? (
                                    <Button onClick={() => setShowFinalizeConfirm(true)} className="bg-yellow-600 text-white hover:bg-yellow-700 border-none w-full justify-center text-xs py-3">
                                        <StopCircle size={16} /> End Season
                                    </Button>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Button onClick={resumeSeason} variant="secondary" className="w-full justify-center text-xs py-3">
                                            <PlayCircle size={16} /> Resume
                                        </Button>
                                        <Button onClick={() => setShowStartNewSeasonConfirm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-none w-full justify-center text-xs py-3">
                                            <Archive size={16} /> New Season
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </AccordionItem>

                    <AccordionItem id="banners" label="Home Banners" icon={ImageIcon}>
                         <BannerSettings banners={banners} onUpdateBanners={updateBanners} />
                    </AccordionItem>

                    <AccordionItem id="partners" label="Partners & Sponsors" icon={ShieldCheck}>
                         <PartnerSettings partners={partners} onUpdatePartners={updatePartners} />
                    </AccordionItem>
                </div>

                <div className="hidden lg:block space-y-6">
                    {updateHeaderLogo && (
                        <BrandingSettings 
                            headerLogoUrl={headerLogoUrl || ''} 
                            onUpdateHeaderLogo={updateHeaderLogo} 
                        />
                    )}

                    {setRegistrationStatus && (
                        <Card className="border-brand-accent/50 z-10 relative">
                            <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                                <Users size={20} className="text-brand-vibrant" /> New Team Registration
                            </h3>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 gap-4">
                                <div className="text-center sm:text-left flex-grow">
                                    <p className="font-bold text-white text-sm">Status Pendaftaran Publik</p>
                                    <p className="text-xs text-brand-light mt-1">
                                        {isRegistrationOpen 
                                            ? "Tombol 'Daftar Tim Baru' terlihat di halaman depan." 
                                            : "Pendaftaran disembunyikan dari publik."}
                                    </p>
                                </div>
                                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                                    <button
                                        onClick={() => handleSetRegistration(true)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${isRegistrationOpen ? 'bg-green-600 text-white shadow-lg' : 'text-brand-light hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Unlock size={14} /> Open
                                    </button>
                                    <button
                                        onClick={() => handleSetRegistration(false)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isRegistrationOpen ? 'bg-red-600 text-white shadow-lg' : 'text-brand-light hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Lock size={14} /> Closed
                                    </button>
                                </div>
                            </div>
                        </Card>
                    )}

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
            </div>
        );
      default:
        return null;
    }
  }

  const MobileMenuButton: React.FC<{ tab: typeof ADMIN_TABS[0], isActive: boolean, onClick: () => void }> = ({ tab, isActive, onClick }) => (
      <button
          onClick={onClick}
          className={`flex flex-col items-center justify-center px-4 py-2 min-w-[80px] transition-all relative ${
              isActive ? 'text-brand-vibrant' : 'text-brand-light'
          }`}
      >
          <tab.icon size={20} className={isActive ? 'scale-110' : 'scale-100'} />
          <span className="text-[9px] font-black uppercase tracking-tighter mt-1">{tab.label}</span>
          {isActive && (
              <div className="absolute bottom-0 w-1/3 h-0.5 bg-brand-vibrant rounded-full shadow-[0_0_8px_rgba(37,99,235,1)]"></div>
          )}
      </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-4 lg:h-[calc(100vh-140px)]"> 
      
      <div className="lg:hidden flex flex-col gap-2 relative z-40 bg-brand-primary/95 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between px-3 py-1">
              <div className="flex items-center gap-2">
                  <Database size={16} className="text-brand-vibrant" />
                  <span className="text-[10px] font-black text-brand-light uppercase tracking-widest">Active Database</span>
              </div>
              <div className="relative">
                  <select 
                      value={mode}
                      onChange={(e) => setMode(e.target.value as TournamentMode)}
                      className="bg-transparent text-xs font-black text-white outline-none appearance-none pr-5 cursor-pointer"
                  >
                      {MODES.map(m => (
                          <option key={m.id} value={m.id} className="text-black">{m.label}</option>
                      ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-light pointer-events-none" />
              </div>
          </div>
      </div>

      <aside className="hidden lg:block w-72 flex-shrink-0 space-y-6 relative z-30">
          <div className="bg-brand-secondary/40 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl">
             <div className="flex items-center gap-2 mb-4 px-1">
                 <Database size={16} className="text-brand-light" />
                 <h3 className="text-xs font-black text-brand-light uppercase tracking-widest">Select Database</h3>
             </div>
             <div className="space-y-2">
                 {MODES.map(m => (
                     <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg transition-all border flex items-center justify-between group ${
                            mode === m.id
                            ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                            : 'bg-black/20 border-transparent text-brand-light hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <span className="text-xs font-black uppercase tracking-wider">{m.label}</span>
                        {mode === m.id && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                    </button>
                 ))}
             </div>
          </div>

          <div className="bg-brand-secondary/40 backdrop-blur-sm border border-white/10 rounded-2xl p-2 shadow-xl">
              <div className="flex flex-col gap-1">
                  {ADMIN_TABS.map((tab) => {
                      const IsActive = activeTab === tab.id;
                      return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                IsActive 
                                ? 'bg-brand-vibrant text-white shadow-lg' 
                                : 'text-brand-light hover:bg-white/5 hover:text-white'
                            }`}
                          >
                              <div className="flex items-center gap-3">
                                  <tab.icon size={18} />
                                  {tab.label}
                              </div>
                              {IsActive && <Check size={14} />}
                          </button>
                      )
                  })}
              </div>
          </div>
      </aside>

      <main className="flex-1 bg-brand-secondary/20 backdrop-blur-sm border border-white/5 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
        {/* Sync Indicator Header */}
        <div className="bg-black/40 border-b border-white/5 px-6 py-2 flex justify-between items-center z-20 shrink-0">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-light">
                    {isSyncing ? 'Sinkronisasi...' : 'Data Terpusat'}
                </span>
             </div>
             {isSyncing ? (
                 <RefreshCw size={12} className="text-yellow-400 animate-spin" />
             ) : (
                 <CloudCheck size={14} className="text-green-500" />
             )}
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-3 md:p-8">
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 lg:pb-0">
                {renderContent()}
             </div>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-primary/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around z-50 px-2">
          <div className="flex w-full max-w-md mx-auto overflow-x-auto custom-scrollbar-hide">
              {ADMIN_TABS.map((tab) => (
                  <MobileMenuButton 
                      key={tab.id} 
                      tab={tab} 
                      isActive={activeTab === tab.id} 
                      onClick={() => setActiveTab(tab.id)} 
                  />
              ))}
          </div>
      </div>

      <ConfirmationModal
        isOpen={showFinalizeConfirm}
        onClose={() => setShowFinalizeConfirm(false)}
        onConfirm={handleFinalizeSeason}
        title="Finalize Season"
        message="Are you sure? This will record the current champion in history."
        confirmText="Yes, End Season"
        confirmButtonClass="bg-yellow-600 text-white hover:bg-yellow-700"
      />

      <ConfirmationModal
        isOpen={showStartNewSeasonConfirm}
        onClose={() => setShowStartNewSeasonConfirm(false)}
        onConfirm={handleStartNewSeason}
        title="Start New Season"
        message="Clear current data for a fresh season?"
        confirmText="Yes, Start Fresh"
        confirmButtonClass="bg-blue-600 text-white hover:bg-blue-700"
      />
      
      <style>{`
        .custom-scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .custom-scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
