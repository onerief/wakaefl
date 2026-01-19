
import React, { useState } from 'react';
import type { Team, Match, KnockoutStageRounds, KnockoutMatch, Group, TournamentState, Partner, TournamentMode, TournamentStatus, SeasonHistory } from '../../types';
import { MatchEditor } from './MatchEditor';
import { TeamManager } from './TeamManager';
import { Button } from '../shared/Button';
import { KnockoutMatchEditor } from './KnockoutMatchEditor';
import { Trophy, Users, ListChecks, Plus, BookOpen, Settings, Database, PlayCircle, StopCircle, Archive, LayoutDashboard, Zap, ChevronDown, Check, Menu, Lock, Unlock, Crown, Image as ImageIcon, ShieldCheck, HelpCircle, Bell, ChevronRight, LayoutGrid, CloudCheck, RefreshCw, FileJson, Share2, Layers } from 'lucide-react';
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

type AdminTab = 'teams' | 'group-fixtures' | 'knockout' | 'banners' | 'partners' | 'history' | 'rules' | 'branding' | 'data' | 'settings';

const ADMIN_TABS: { id: AdminTab; label: string; icon: any; color: string }[] = [
    { id: 'teams', label: 'Tim & Manager', icon: Users, color: 'text-blue-400' },
    { id: 'group-fixtures', label: 'Jadwal Liga', icon: ListChecks, color: 'text-indigo-400' },
    { id: 'knockout', label: 'Knockout', icon: Trophy, color: 'text-yellow-400' },
    { id: 'banners', label: 'Banner Home', icon: ImageIcon, color: 'text-pink-400' },
    { id: 'partners', label: 'Sponsor', icon: Share2, color: 'text-emerald-400' },
    { id: 'branding', label: 'Logo Web', icon: ShieldCheck, color: 'text-cyan-400' },
    { id: 'history', label: 'Riwayat Juara', icon: Crown, color: 'text-orange-400' },
    { id: 'rules', label: 'Aturan', icon: BookOpen, color: 'text-slate-400' },
    { id: 'data', label: 'Database', icon: FileJson, color: 'text-rose-400' },
    { id: 'settings', label: 'System', icon: Settings, color: 'text-white' },
];

const MODES: { id: TournamentMode; label: string; color: string }[] = [
    { id: 'league', label: 'Liga Reguler', color: 'bg-blue-600' },
    { id: 'two_leagues', label: '2 Wilayah', color: 'bg-purple-600' },
    { id: 'wakacl', label: 'WAKACL', color: 'bg-yellow-500' },
];

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('teams');
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const [showGenerateBracketConfirm, setShowGenerateBracketConfirm] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);

  const { addToast } = useToast();
  const { 
      matches, updateMatchScore, teams, knockoutStage, groups, mode, setMode, 
      status, startNewSeason, finalizeSeason,
      updateKnockoutMatch, rules, updateRules,
      banners, updateBanners, partners, updatePartners,
      generateKnockoutBracket, isRegistrationOpen, setRegistrationStatus,
      headerLogoUrl, updateHeaderLogo, history, addHistoryEntry, deleteHistoryEntry,
      isSyncing, unbindTeam, setTournamentState
  } = props;

  const currentTabInfo = ADMIN_TABS.find(t => t.id === activeTab);
  const currentModeInfo = MODES.find(m => m.id === mode);

  const renderContent = () => {
    switch(activeTab) {
      case 'teams': return <TeamManager {...props} onGenerationSuccess={() => setActiveTab('group-fixtures')} unbindTeam={unbindTeam} />;
      case 'group-fixtures':
        if (matches.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center bg-brand-secondary/20 rounded-2xl border border-dashed border-white/10 mx-auto max-w-2xl">
              <ListChecks size={48} className="text-brand-light/20 mb-4" />
              <h3 className="text-xl font-bold text-brand-text mb-2">Belum Ada Jadwal</h3>
              <p className="text-brand-light">Pergi ke tab 'Tim & Manager' untuk generate jadwal dari grup.</p>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {groups.map(group => {
                  const groupMatches = matches.filter(m => m.group === group.id || m.group === group.name.replace('Group ', '').trim());
                  if (groupMatches.length === 0) return null;

                  const schedule = groupMatches.reduce((acc, match) => {
                      const key = `L${match.leg || 1}-D${match.matchday || 1}`;
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(match);
                      return acc;
                  }, {} as Record<string, Match[]>);
                  
                  const sortedKeys = Object.keys(schedule).sort((a, b) => a.localeCompare(b));
                  const activeKey = selectedMatchdays[group.id] || sortedKeys[0];

                  return (
                      <div key={`${group.id}-fixtures`} className="bg-brand-secondary/30 p-5 rounded-[1.5rem] border border-white/5 shadow-xl">
                          <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5">
                              <h4 className="text-lg font-black text-brand-vibrant uppercase italic tracking-tight">{group.name}</h4>
                              <select
                                  value={activeKey}
                                  onChange={(e) => setSelectedMatchdays(prev => ({ ...prev, [group.id]: e.target.value }))}
                                  className="p-2 bg-brand-primary border border-white/10 rounded-xl text-white text-[10px] font-black uppercase outline-none"
                              >
                                  {sortedKeys.map(k => {
                                      const parts = k.split('-');
                                      return <option key={k} value={k}>Matchday {parts[1].substring(1)} (Leg {parts[0].substring(1)})</option>;
                                  })}
                              </select>
                          </div>
                          <div className="space-y-3">
                               {schedule[activeKey]?.map(match => (
                                  <MatchEditor key={match.id} match={match} onUpdateScore={updateMatchScore} onGenerateSummary={async () => ''} onEditSchedule={() => {}} />
                              ))}
                          </div>
                      </div>
                  );
              })}
          </div>
        );
      case 'knockout':
        if (mode === 'league') return <div className="text-center py-20 opacity-30 italic">Knockout tidak tersedia di mode Liga. Ganti ke mode WAKACL di menu kiri.</div>;
        return (
          <div className="space-y-6">
            {!knockoutStage || Object.values(knockoutStage).every((r: any) => r.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-brand-secondary/20 rounded-2xl border border-dashed border-white/10 mx-auto max-w-2xl">
                <Trophy size={48} className="text-brand-light/20 mb-4" />
                <h3 className="text-xl font-bold text-brand-text mb-2">Siap untuk Knockout?</h3>
                <p className="text-brand-light mb-6 text-sm">Generate bracket setelah fase grup selesai.</p>
                <Button onClick={() => setShowGenerateBracketConfirm(true)}>Otomatis Generate Bracket</Button>
              </div>
            ) : (
              <div className="space-y-8">
                {(Object.keys(knockoutStage) as Array<keyof KnockoutStageRounds>).map((roundName) => (
                  <Card key={roundName} className="border-white/5 !p-6">
                    <h3 className="text-sm font-black text-brand-vibrant uppercase mb-4 italic">{roundName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {knockoutStage[roundName].map((match: KnockoutMatch) => (
                         <KnockoutMatchEditor key={match.id} match={match} onUpdateScore={(id, data) => updateKnockoutMatch(id, { ...match, ...data })} onEdit={() => {}} onDelete={() => {}} />
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {showGenerateBracketConfirm && <GenerateBracketConfirmationModal onConfirm={() => { generateKnockoutBracket(); setShowGenerateBracketConfirm(false); }} onCancel={() => setShowGenerateBracketConfirm(false)} />}
          </div>
        );
      case 'banners': return <BannerSettings banners={banners} onUpdateBanners={updateBanners} />;
      case 'partners': return <PartnerSettings partners={partners} onUpdatePartners={updatePartners} />;
      case 'branding': return updateHeaderLogo ? <BrandingSettings headerLogoUrl={headerLogoUrl || ''} onUpdateHeaderLogo={updateHeaderLogo} /> : null;
      case 'history': return <HistoryManager history={history} teams={teams} onAddEntry={addHistoryEntry} onDeleteEntry={deleteHistoryEntry} />;
      case 'rules': return <RulesEditor rules={props.rules} onSave={updateRules} />;
      case 'data': return <DataManager teams={teams} matches={matches} groups={groups} rules={rules} banners={banners} partners={partners} headerLogoUrl={headerLogoUrl || ''} mode={mode} knockoutStage={knockoutStage} setTournamentState={setTournamentState} />;
      case 'settings':
        return (
            <div className="space-y-6 max-w-2xl">
                <Card className="!p-6 border-brand-accent/50">
                    <h3 className="text-lg font-black text-white uppercase italic mb-4">Pengaturan Musim</h3>
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex justify-between items-center">
                            <span className="text-xs font-bold text-brand-light uppercase">Status Pendaftaran</span>
                            <button onClick={() => setRegistrationStatus?.(!isRegistrationOpen)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${isRegistrationOpen ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                {isRegistrationOpen ? 'OPEN' : 'CLOSED'}
                            </button>
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex justify-between items-center">
                            <span className="text-xs font-bold text-brand-light uppercase">Status Turnamen</span>
                            <span className="px-3 py-1 bg-brand-vibrant/20 text-brand-vibrant rounded font-black text-[10px] uppercase">{status}</span>
                        </div>
                        {status === 'active' ? (
                            <Button onClick={() => setShowFinalizeConfirm(true)} variant="danger" className="w-full !py-3">End Season & Lock Results</Button>
                        ) : (
                            <Button onClick={startNewSeason} className="w-full !py-3">Start Fresh New Season</Button>
                        )}
                    </div>
                </Card>
                <ConfirmationModal isOpen={showFinalizeConfirm} onClose={() => setShowFinalizeConfirm(false)} onConfirm={() => { finalizeSeason(); setShowFinalizeConfirm(false); }} title="Selesaikan Musim?" message="Tindakan ini akan menobatkan juara dan mengunci data musim saat ini ke riwayat." />
            </div>
        );
      default: return null;
    }
  }

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-100px)] -mx-3 md:-mx-8 -my-4 md:-my-8 bg-brand-primary overflow-hidden"> 
      
      {/* Sidebar Desktop: Database Switcher */}
      <aside className="hidden lg:flex flex-col w-72 bg-brand-secondary/40 border-r border-white/5 backdrop-blur-md z-30">
          <div className="p-6 border-b border-white/5">
             <div className="flex items-center gap-2 mb-4">
                <Database size={16} className="text-brand-vibrant" />
                <h3 className="text-[10px] font-black text-brand-light uppercase tracking-widest opacity-50">Database Aktif</h3>
             </div>
             <div className="space-y-1.5">
                 {MODES.map(m => (
                     <button key={m.id} onClick={() => setMode(m.id)} className={`w-full text-left px-4 py-3 rounded-xl transition-all border flex items-center justify-between group ${mode === m.id ? 'bg-brand-vibrant border-brand-vibrant text-white shadow-lg shadow-brand-vibrant/20' : 'bg-black/20 border-white/5 text-brand-light hover:border-white/20 hover:text-white'}`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${mode === m.id ? 'bg-white' : 'bg-brand-light/30'}`}></div>
                            <span className="text-[11px] font-black uppercase italic tracking-tight">{m.label}</span>
                        </div>
                        {mode === m.id && <ChevronRight size={14} className="opacity-50" />}
                    </button>
                 ))}
             </div>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
              {ADMIN_TABS.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase italic transition-all ${activeTab === tab.id ? 'bg-white/10 text-white shadow-inner' : 'text-brand-light hover:bg-white/5 hover:text-white'}`}>
                      <tab.icon size={18} className={activeTab === tab.id ? tab.color : 'opacity-40'} />
                      {tab.label}
                  </button>
              ))}
          </nav>
          
          <div className="p-6 border-t border-white/5 bg-black/20 text-center">
              <span className="text-[8px] font-black text-brand-light/30 uppercase tracking-[0.4em]">Way Kanan Hub Admin</span>
          </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-brand-primary/40 border-b border-white/5 px-6 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0 backdrop-blur-sm relative z-40">
             <div className="flex items-center gap-4">
                <div className="lg:hidden relative">
                    {/* Mobile Database Switcher Toggle */}
                    <button 
                        onClick={() => setIsModeSelectorOpen(!isModeSelectorOpen)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-white transition-all active:scale-95 ${currentModeInfo?.color}`}
                    >
                        <Layers size={18} />
                        <span className="text-xs font-black uppercase italic truncate max-w-[100px]">{currentModeInfo?.label}</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 ${isModeSelectorOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Mobile Mode Switcher Dropdown */}
                    {isModeSelectorOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-brand-secondary border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-[110]">
                            <div className="p-2 space-y-1">
                                {MODES.map(m => (
                                    <button 
                                        key={m.id} 
                                        onClick={() => { setMode(m.id); setIsModeSelectorOpen(false); }}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase italic flex items-center justify-between ${mode === m.id ? 'bg-brand-vibrant text-white' : 'text-brand-light hover:bg-white/5'}`}
                                    >
                                        {m.label}
                                        {mode === m.id && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-white/5 hidden lg:block"></div>

                <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                    {currentTabInfo?.icon && <currentTabInfo.icon size={28} className={currentTabInfo.color} />}
                    {currentTabInfo?.label}
                </h1>
             </div>

             <div className="flex items-center justify-between sm:justify-end gap-4">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-full border border-white/5">
                     <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                     <span className="text-[10px] font-black uppercase text-brand-light tracking-widest">{isSyncing ? 'Auto-Saving...' : 'Connected'}</span>
                 </div>
             </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-32 lg:pb-8">
                {renderContent()}
             </div>
        </div>
      </main>

      {/* Nav Mobile: Page Features Switcher */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-secondary/95 backdrop-blur-2xl border-t border-white/10 flex items-center overflow-x-auto custom-scrollbar-hide z-[100] px-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          {ADMIN_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center px-4 min-w-[90px] shrink-0 h-full transition-all relative ${activeTab === tab.id ? tab.color : 'text-brand-light'}`}>
                  <tab.icon size={18} className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 -translate-y-1' : 'opacity-50'}`} />
                  <span className={`text-[8px] font-black uppercase mt-1 text-center truncate w-full transition-all ${activeTab === tab.id ? 'opacity-100' : 'opacity-40'}`}>{tab.label}</span>
                  {activeTab === tab.id && (
                      <div className="absolute top-0 inset-x-4 h-0.5 bg-current rounded-full"></div>
                  )}
              </button>
          ))}
      </div>
    </div>
  );
};
