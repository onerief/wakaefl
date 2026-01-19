
import React, { useState } from 'react';
import type { Team, Match, KnockoutStageRounds, KnockoutMatch, Group, TournamentState, Partner, TournamentMode, TournamentStatus, SeasonHistory } from '../../types';
import { MatchEditor } from './MatchEditor';
import { TeamManager } from './TeamManager';
import { Button } from '../shared/Button';
import { KnockoutMatchEditor } from './KnockoutMatchEditor';
import { Trophy, Users, ListChecks, Plus, BookOpen, Settings, Database, PlayCircle, StopCircle, Archive, LayoutDashboard, Zap, ChevronDown, Check, Menu, Lock, Unlock, Crown, Image as ImageIcon, ShieldCheck, HelpCircle, Bell, ChevronRight, LayoutGrid, CloudCheck, RefreshCw, FileJson } from 'lucide-react';
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
import { DataManager } from './DataManager';

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
  isSyncing?: boolean;
  setMode: (mode: TournamentMode) => void;
  setRoundRobin: (isDouble: boolean) => void;
  updateMatchScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
  addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => void;
  updateTeam: (teamId: string, name: string, logoUrl: string, manager?: string | undefined, socialMediaUrl?: string | undefined, whatsappNumber?: string | undefined, isTopSeed?: boolean | undefined, ownerEmail?: string | undefined) => void;
  deleteTeam: (teamId: string) => void;
  unbindTeam: (teamId: string) => void;
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

type AdminTab = 'group-fixtures' | 'knockout' | 'teams' | 'history' | 'rules' | 'settings' | 'data';

const ADMIN_TABS: { id: AdminTab; label: string; icon: any; color: string }[] = [
    { id: 'teams', label: 'Teams & Claims', icon: Users, color: 'text-blue-400' },
    { id: 'group-fixtures', label: 'Match Fixtures', icon: ListChecks, color: 'text-indigo-400' },
    { id: 'knockout', label: 'Knockout Stage', icon: Trophy, color: 'text-yellow-400' },
    { id: 'history', label: 'Season History', icon: Crown, color: 'text-orange-400' },
    { id: 'rules', label: 'Tourney Rules', icon: BookOpen, color: 'text-emerald-400' },
    { id: 'data', label: 'Data Manager', icon: FileJson, color: 'text-rose-400' },
    { id: 'settings', label: 'Site Settings', icon: Settings, color: 'text-slate-400' },
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
      generateKnockoutBracket, isRegistrationOpen, setRegistrationStatus,
      deleteKnockoutMatch, updateKnockoutMatchDetails, updateMatchSchedule,
      headerLogoUrl, updateHeaderLogo, history, addHistoryEntry, deleteHistoryEntry,
      isSyncing, unbindTeam, setTournamentState
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
              {isOpen && <div className="mt-2 animate-in slide-in-from-top-2 duration-300">{children}</div>}
          </div>
      );
  };

  const currentTabInfo = ADMIN_TABS.find(t => t.id === activeTab);

  const renderContent = () => {
    switch(activeTab) {
      case 'group-fixtures':
        if (matches.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center bg-brand-secondary/20 rounded-2xl border border-dashed border-white/10 mx-auto max-w-2xl">
              <ListChecks size={48} className="text-brand-light/20 mb-4" />
              <h3 className="text-xl font-bold text-brand-text mb-2">No Matches Generated</h3>
              <p className="text-brand-light">Go to the 'Teams' tab to generate fixtures from groups.</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {groups.map(group => {
                    const groupLetter = group.name.split(' ')[1];
                    const groupMatches = matches.filter(m => m.group === groupLetter || m.group === group.id);
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
                                <h4 className="text-lg font-black text-brand-vibrant uppercase tracking-tight italic">{group.name}</h4>
                                 {scheduleKeys.length > 1 && (
                                     <select
                                        value={activeScheduleKey}
                                        onChange={(e) => setSelectedMatchdays(prev => ({ ...prev, [stateKey]: e.target.value }))}
                                        className="p-1.5 bg-brand-primary border border-brand-accent rounded text-brand-text text-[10px] font-black uppercase focus:ring-1 focus:ring-brand-vibrant outline-none"
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
                                ) : <p className="text-brand-light text-center py-4 text-sm italic">No matches.</p>}
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
                <div className="flex flex-col items-center justify-center h-full py-20 text-center bg-brand-secondary/20 rounded-2xl border border-dashed border-white/10 mx-auto max-w-2xl">
                    <Zap size={48} className="text-brand-light/20 mb-4" />
                    <h3 className="text-xl font-bold text-brand-text mb-2">Knockout Restricted</h3>
                    <p className="text-brand-light">Knockout bracket is only available for <strong>WAKACL</strong> or <strong>2 Wilayah</strong> modes.</p>
                </div>
            )
        }
        return (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-4">
                {knockoutStage && (
                    <Button onClick={() => setIsAddingMatch('Quarter-finals')} className="!py-2.5 shadow-brand-vibrant/20">
                        <Plus size={18} /> Tambah Match Manual
                    </Button>
                )}
             </div>

            {!knockoutStage || Object.values(knockoutStage).every((r: any) => r.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-brand-secondary/20 rounded-2xl border border-dashed border-white/10 mx-auto max-w-2xl">
                <Trophy size={48} className="text-brand-light/20 mb-4" />
                <h3 className="text-xl font-bold text-brand-text mb-2">Ready to Rumble?</h3>
                <p className="text-brand-light mb-6 text-sm">Generate the bracket once group stages are complete.</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Button onClick={() => setShowGenerateBracketConfirm(true)} className="w-full">Auto-Generate Bracket</Button>
                  <Button onClick={() => { initializeEmptyKnockoutStage(); setIsAddingMatch('Quarter-finals'); }} variant="secondary" className="w-full">Create Manually</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {(Object.keys(knockoutStage) as Array<keyof KnockoutStageRounds>).map((roundName) => (
                  <Card key={roundName} className="border-white/5 !p-3 sm:!p-6">
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                      <h3 className="text-sm sm:text-lg font-black text-brand-vibrant uppercase tracking-wider italic">{roundName}</h3>
                      <Button onClick={() => setIsAddingMatch(roundName)} variant="secondary" className="!px-2 sm:!px-3 !py-1 text-[10px] sm:text-xs h-7 sm:h-8"><Plus size={12} /> Add Match</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {knockoutStage[roundName].sort((a,b) => a.matchNumber - b.matchNumber).map((match: KnockoutMatch) => (
                         <KnockoutMatchEditor 
                            key={match.id} 
                            match={match} 
                            onUpdateScore={(id, data) => updateKnockoutMatch(id, { ...match, ...data })} 
                            onEdit={setEditingKnockoutMatch} 
                            onDelete={() => props.deleteKnockoutMatch?.(match.id)} 
                        />
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
             {isAddingMatch && <KnockoutMatchForm round={isAddingMatch} teams={teams} onSave={(...args) => { props.addKnockoutMatch(...args); setIsAddingMatch(null); }} onClose={() => setIsAddingMatch(null)} />}
             {editingKnockoutMatch && <KnockoutMatchScheduleEditor match={editingKnockoutMatch} teams={teams} onSave={(...args) => { props.updateKnockoutMatchDetails?.(...args); setEditingKnockoutMatch(null); }} onClose={() => setEditingKnockoutMatch(null)} />}
             {showGenerateBracketConfirm && <GenerateBracketConfirmationModal onConfirm={() => { generateKnockoutBracket(); setShowGenerateBracketConfirm(false); }} onCancel={() => setShowGenerateBracketConfirm(false)} />}
          </div>
        );
      case 'teams': return <TeamManager {...props} onGenerationSuccess={() => setActiveTab('group-fixtures')} unbindTeam={unbindTeam} />;
      case 'history': return <HistoryManager history={history} teams={teams} onAddEntry={addHistoryEntry} onDeleteEntry={deleteHistoryEntry} />;
      case 'rules': return <RulesEditor rules={props.rules} onSave={updateRules} />;
      case 'data': return (
        <DataManager 
            teams={teams} 
            matches={matches} 
            groups={groups} 
            rules={rules} 
            banners={banners} 
            partners={partners} 
            headerLogoUrl={headerLogoUrl || ''} 
            mode={mode} 
            setTournamentState={setTournamentState} 
            knockoutStage={knockoutStage}
        />
      );
      case 'settings':
        return (
            <div className="space-y-4 max-w-4xl">
                <AccordionItem id="branding" label="Website Branding" icon={ImageIcon}>
                     {updateHeaderLogo && <BrandingSettings headerLogoUrl={headerLogoUrl || ''} onUpdateHeaderLogo={updateHeaderLogo} />}
                </AccordionItem>
                <AccordionItem id="registration" label="Public Registration" icon={Users}>
                    <Card className="border-brand-accent/50 z-10 relative !p-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 gap-4">
                            <div className="text-center sm:text-left">
                                <p className="font-bold text-white text-sm">Status Pendaftaran Publik</p>
                                <p className="text-[10px] text-brand-light mt-1">{isRegistrationOpen ? "Tombol 'Daftar' terlihat di Home." : "Pendaftaran saat ini ditutup."}</p>
                            </div>
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                                <button onClick={() => setRegistrationStatus?.(true)} className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${isRegistrationOpen ? 'bg-green-600 text-white shadow-lg' : 'text-brand-light hover:text-white'}`}><Unlock size={14} /> Open</button>
                                <button onClick={() => setRegistrationStatus?.(false)} className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${!isRegistrationOpen ? 'bg-red-600 text-white shadow-lg' : 'text-brand-light hover:text-white'}`}><Lock size={14} /> Closed</button>
                            </div>
                        </div>
                    </Card>
                </AccordionItem>
                <AccordionItem id="season" label="Season Management" icon={Settings}>
                     <Card className="border-brand-accent/50 !p-4">
                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-center">
                                <p className="font-semibold text-white text-sm">Status Musim: <span className={`ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{status}</span></p>
                            </div>
                            {status === 'active' ? (
                                <Button onClick={() => setShowFinalizeConfirm(true)} className="bg-yellow-600 text-white hover:bg-yellow-700 border-none w-full justify-center text-xs py-3 font-black uppercase"><StopCircle size={16} /> End Season & Crown Champion</Button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button onClick={resumeSeason} variant="secondary" className="flex-1 justify-center text-xs py-3 font-black uppercase"><PlayCircle size={16} /> Resume</Button>
                                    <Button onClick={() => setShowStartNewSeasonConfirm(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none justify-center text-xs py-3 font-black uppercase"><Archive size={16} /> New Season</Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </AccordionItem>
                <AccordionItem id="banners" label="Home Banners" icon={ImageIcon}><BannerSettings banners={banners} onUpdateBanners={updateBanners} /></AccordionItem>
                <AccordionItem id="partners" label="Partners & Sponsors" icon={ShieldCheck}><PartnerSettings partners={partners} onUpdatePartners={updatePartners} /></AccordionItem>
            </div>
        );
      default: return null;
    }
  }

  const MobileMenuButton: React.FC<{ tab: typeof ADMIN_TABS[0], isActive: boolean, onClick: () => void }> = ({ tab, isActive, onClick }) => (
      <button
          onClick={onClick}
          className={`flex flex-col items-center justify-center px-2 py-2 min-w-[60px] transition-all relative ${isActive ? tab.color : 'text-brand-light'}`}
      >
          <tab.icon size={18} className={isActive ? 'scale-110' : 'scale-100 opacity-60'} />
          <span className="text-[8px] font-black uppercase tracking-tighter mt-1 truncate w-full text-center">{tab.label.split(' ')[0]}</span>
          {isActive && <div className="absolute bottom-0 w-1/2 h-0.5 bg-brand-vibrant rounded-full shadow-[0_0_8px_rgba(37,99,235,1)]"></div>}
      </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:h-[calc(100vh-100px)] -mx-3 md:-mx-8 -my-4 md:-my-8 bg-brand-primary overflow-hidden"> 
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 bg-brand-secondary/30 border-r border-white/5 backdrop-blur-md relative z-30">
          
          {/* Sidebar Top: Mode Selector */}
          <div className="p-6 border-b border-white/5">
             <div className="flex items-center gap-2 mb-4 px-1">
                 <Database size={16} className="text-brand-vibrant" />
                 <h3 className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em]">Active Database</h3>
             </div>
             <div className="space-y-1.5">
                 {MODES.map(m => (
                     <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl transition-all border flex items-center justify-between group ${
                            mode === m.id
                            ? 'bg-brand-vibrant border-brand-vibrant text-white shadow-[0_0_20px_rgba(37,99,235,0.25)]' 
                            : 'bg-black/20 border-white/5 text-brand-light hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <span className="text-xs font-black uppercase tracking-wider italic">{m.label}</span>
                        {mode === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                    </button>
                 ))}
             </div>
          </div>

          {/* Sidebar Center: Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
              {ADMIN_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-black uppercase italic tracking-tight transition-all duration-300 ${
                            isActive 
                            ? 'bg-white/10 text-white shadow-inner' 
                            : 'text-brand-light hover:bg-white/5 hover:text-white'
                        }`}
                      >
                          <tab.icon size={20} className={isActive ? tab.color : 'opacity-40'} />
                          {tab.label}
                          {isActive && <ChevronRight size={14} className="ml-auto opacity-40" />}
                      </button>
                  )
              })}
          </nav>

          {/* Sidebar Bottom: Stats or Info */}
          <div className="p-6 border-t border-white/5 bg-black/20">
              <div className="flex items-center gap-2 text-[9px] font-black text-brand-light/50 uppercase tracking-widest">
                  <ShieldCheck size={12} /> Banjar Baru Admin Panel
              </div>
          </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-black/10 relative">
        
        {/* Mobile Header Tab Selector */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-brand-secondary/80 border-b border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <Database size={16} className="text-brand-vibrant" />
                <select 
                    value={mode}
                    onChange={(e) => setMode(e.target.value as TournamentMode)}
                    className="bg-transparent text-[10px] font-black text-white outline-none appearance-none cursor-pointer uppercase tracking-widest"
                >
                    {MODES.map(m => <option key={m.id} value={m.id} className="text-black">{m.label}</option>)}
                </select>
                <ChevronDown size={12} className="text-brand-light" />
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-[8px] font-black uppercase text-brand-light">{isSyncing ? 'Syncing...' : 'Online'}</span>
            </div>
        </div>

        {/* Dynamic Header */}
        <header className="bg-brand-primary/40 border-b border-white/5 px-6 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 shrink-0 backdrop-blur-sm">
             <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-brand-vibrant uppercase tracking-[0.3em]">Management</span>
                    <div className="w-8 h-px bg-brand-vibrant/30"></div>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                    {currentTabInfo?.icon && <currentTabInfo.icon size={28} className={currentTabInfo.color} />}
                    {currentTabInfo?.label}
                </h1>
             </div>
             
             <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-black/40 rounded-2xl border border-white/5">
                <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-light/50">Database Sync Status</span>
                    <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                        {isSyncing ? 'Writing Changes...' : 'All data saved to cloud'}
                        {isSyncing ? <RefreshCw size={10} className="animate-spin text-yellow-400" /> : <CloudCheck size={12} className="text-green-500" />}
                    </span>
                </div>
             </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-24 lg:pb-0">
                {renderContent()}
             </div>
        </div>
      </main>

      {/* Mobile Nav (lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-secondary/95 border-t border-white/10 flex items-center justify-around z-50 px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          {ADMIN_TABS.map((tab) => (
              <MobileMenuButton 
                  key={tab.id} 
                  tab={tab} 
                  isActive={activeTab === tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
              />
          ))}
      </div>

      <ConfirmationModal
        isOpen={showFinalizeConfirm}
        onClose={() => setShowFinalizeConfirm(false)}
        onConfirm={() => { finalizeSeason(); setShowFinalizeConfirm(false); }}
        title="Finalize Season"
        message="Are you sure? This will record the current champion in history and lock the season."
        confirmText="Yes, End Season"
        confirmButtonClass="bg-yellow-600 text-white hover:bg-yellow-700 font-black uppercase italic"
      />

      <ConfirmationModal
        isOpen={showStartNewSeasonConfirm}
        onClose={() => setShowStartNewSeasonConfirm(false)}
        onConfirm={() => { startNewSeason(); setShowStartNewSeasonConfirm(false); }}
        title="Start New Season"
        message="This will archive current data and start a completely empty season. Proceed?"
        confirmText="Yes, Start Fresh"
        confirmButtonClass="bg-blue-600 text-white hover:bg-blue-700 font-black uppercase italic"
      />
    </div>
  );
};
