
import React, { useState } from 'react';
import type { Team, Group, Match, KnockoutStageRounds, KnockoutMatch, TournamentState, Partner, TournamentMode, TournamentStatus, SeasonHistory, NewsItem, Product, ScheduleSettings } from '../../types';
import { MatchEditor } from './MatchEditor';
import { TeamManager } from './TeamManager';
import { Button } from '../shared/Button';
import { Trophy, Users, ListChecks, Plus, BookOpen, Settings, Crown, ImageIcon, ShieldCheck, Share2, FileJson, LayoutGrid, Zap, Sparkles, X, Newspaper, ShoppingBag, Type, Globe, RefreshCw, Eye, EyeOff, ChevronDown, Check, Archive, Save, Loader, AlertTriangle, Wifi } from 'lucide-react';
import { Card } from '../shared/Card';
import { RulesEditor } from './RulesEditor';
import { BannerSettings } from './BannerSettings';
import { PartnerSettings } from './PartnerSettings';
import { BrandingSettings } from './BrandingSettings';
import { HistoryManager } from './HistoryManager';
import { NewsManager } from './NewsManager';
import { ProductManager } from './ProductManager';
import { DataManager } from './DataManager';
import { MarqueeSettings } from './MarqueeSettings';
import { KnockoutMatchEditor } from './KnockoutMatchEditor';
import { KnockoutMatchForm } from './KnockoutMatchForm';
import { ArchiveSeasonModal } from './ArchiveSeasonModal';
import { useToast } from '../shared/Toast';
import { MatchDetailsModal } from './MatchDetailsModal';
import { ScheduleControl } from './ScheduleControl';

interface AdminPanelProps {
  teams: Team[];
  matches: Match[];
  knockoutStage: KnockoutStageRounds | null;
  groups: Group[];
  rules: string;
  banners: string[];
  partners: Partner[];
  news?: NewsItem[];
  products?: Product[];
  newsCategories?: string[];
  shopCategories?: string[];
  marqueeMessages?: string[];
  mode: TournamentMode;
  status: TournamentStatus;
  history: SeasonHistory[];
  scheduleSettings: ScheduleSettings;
  isDoubleRoundRobin: boolean;
  isSyncing?: boolean;
  hasUnsavedChanges?: boolean;
  forceSave?: () => Promise<void>;
  isRegistrationOpen: boolean;
  visibleModes?: TournamentMode[];
  setMode: (mode: TournamentMode) => void;
  updateMatchScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => void;
  updateTeam: (teamId: string, name: string, logoUrl: string, manager?: string | undefined, socialMediaUrl?: string | undefined, whatsappNumber?: string | undefined, isTopSeed?: boolean | undefined, ownerEmail?: string | undefined) => void;
  deleteTeam: (teamId: string) => void;
  onUpdateNews: (news: NewsItem[]) => void;
  updateProducts: (products: Product[]) => void;
  updateNewsCategories: (cats: string[]) => void;
  updateShopCategories: (cats: string[]) => void;
  updateMarqueeMessages: (msgs: string[]) => void;
  generateKnockoutBracket: () => { success: boolean; message?: string };
  updateKnockoutMatch: (matchId: string, match: KnockoutMatch) => void;
  addKnockoutMatch: (round: keyof KnockoutStageRounds, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string, matchNumber: number) => void;
  deleteKnockoutMatch: (round: keyof KnockoutStageRounds, id: string) => void;
  initializeEmptyKnockoutStage: () => void;
  resetTournament: () => void;
  archiveSeason?: (entry: SeasonHistory, keepTeams: boolean) => void;
  updateRules: (rules: string) => void;
  updateBanners: (banners: string[]) => void;
  updatePartners: (partners: Partner[]) => void;
  manualAddGroup: (name: string) => void;
  manualDeleteGroup: (groupId: string) => void;
  manualAddTeamToGroup: (teamId: string, groupId: string) => void;
  manualRemoveTeamFromGroup: (teamId: string, groupId: string) => void;
  autoGenerateGroups?: (numberOfGroups: number) => void; 
  initializeLeague?: () => void; 
  generateMatchesFromGroups: (type: 'single' | 'double') => void;
  setTournamentState: (state: TournamentState) => void;
  addHistoryEntry: (entry: SeasonHistory) => void;
  deleteHistoryEntry: (id: string) => void;
  headerLogoUrl?: string;
  updateHeaderLogo?: (url: string) => void;
  pwaIconUrl?: string;
  updatePwaIcon?: (url: string) => void;
  setRegistrationOpen: (open: boolean) => void;
  setTournamentStatus: (status: 'active' | 'completed') => void;
  updateVisibleModes: (modes: TournamentMode[]) => void;
  resolveTeamClaim?: (teamId: string, approved: boolean) => void;
  // Schedule Control Actions
  startMatchday?: (duration: number) => void;
  pauseSchedule?: () => void;
  setMatchday?: (day: number) => void;
  processMatchdayTimeouts?: () => { processedCount: number, message: string };
}

type AdminTab = 'teams' | 'group-fixtures' | 'knockout' | 'news' | 'shop' | 'marquee' | 'banners' | 'partners' | 'history' | 'rules' | 'branding' | 'data' | 'settings';

const ADMIN_TABS: { id: AdminTab; label: string; icon: any; color: string }[] = [
    { id: 'teams', label: 'Tim & Manager', icon: Users, color: 'text-blue-400' },
    { id: 'group-fixtures', label: 'Jadwal Liga', icon: ListChecks, color: 'text-indigo-400' },
    { id: 'knockout', label: 'Knockout', icon: Trophy, color: 'text-yellow-400' },
    { id: 'news', label: 'News Manager', icon: Newspaper, color: 'text-orange-400' },
    { id: 'shop', label: 'Shop Manager', icon: ShoppingBag, color: 'text-emerald-400' },
    { id: 'marquee', label: 'Running Text', icon: Type, color: 'text-brand-vibrant' },
    { id: 'banners', label: 'Banner Home', icon: ImageIcon, color: 'text-pink-400' },
    { id: 'partners', label: 'Sponsor', icon: Share2, color: 'text-emerald-400' },
    { id: 'branding', label: 'Logo & App', icon: ShieldCheck, color: 'text-cyan-400' },
    { id: 'history', label: 'Riwayat Juara', icon: Crown, color: 'text-orange-400' },
    { id: 'rules', label: 'Aturan', icon: BookOpen, color: 'text-brand-light' },
    { id: 'data', label: 'Database', icon: FileJson, color: 'text-rose-400' },
    { id: 'settings', label: 'System', icon: Settings, color: 'text-white' },
];

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('teams');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const [showKoForm, setShowKoForm] = useState<{ round: keyof KnockoutStageRounds } | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const { addToast } = useToast();

  const currentTabInfo = ADMIN_TABS.find(t => t.id === activeTab);

  const handleGenerateBracket = () => {
    const res = props.generateKnockoutBracket();
    if (res.success) addToast("Bracket otomatis berhasil dibuat!", "success");
    else addToast(res.message || "Gagal membuat bracket.", "error");
  };

  const handleArchiveSeason = (entry: SeasonHistory, keepTeams: boolean) => {
      if (props.archiveSeason) {
          props.archiveSeason(entry, keepTeams);
          addToast('Musim berhasil diarsipkan & direset!', 'success');
      } else {
          props.addHistoryEntry(entry);
          props.resetTournament();
          addToast('Musim diarsipkan (Mode Reset Terbatas).', 'info');
      }
  };

  const ModeSwitcher = () => (
      <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
          {(['league', 'two_leagues', 'wakacl'] as TournamentMode[]).map(m => (
              <button
                key={m}
                onClick={() => props.setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${props.mode === m ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
              >
                  {m === 'league' ? <LayoutGrid size={10}/> : m === 'two_leagues' ? <Globe size={10}/> : <Trophy size={10}/>}
                  <span className="hidden sm:inline">{m === 'league' ? 'Liga' : m === 'two_leagues' ? '2 Wilayah' : 'Championship'}</span>
              </button>
          ))}
      </div>
  );

  const toggleVisibility = (modeToToggle: TournamentMode) => {
      const current = props.visibleModes || ['league', 'wakacl', 'two_leagues'];
      let updated: TournamentMode[];
      if (current.includes(modeToToggle)) {
          updated = current.filter(m => m !== modeToToggle);
      } else {
          updated = [...current, modeToToggle];
      }
      props.updateVisibleModes(updated);
      addToast(`Visibilitas ${modeToToggle.toUpperCase()} diperbarui.`, 'info');
  };

  const handleForceSave = async () => {
      if (props.forceSave) {
          await props.forceSave();
          addToast('Data berhasil disimpan manual.', 'success');
      }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'teams': return <TeamManager {...props as any} onGenerationSuccess={() => setActiveTab('group-fixtures')} autoGenerateGroups={props.autoGenerateGroups} initializeLeague={props.initializeLeague} />;
      case 'marquee': return (
          <MarqueeSettings 
              messages={props.marqueeMessages || []} 
              onUpdate={props.updateMarqueeMessages} 
          />
      );
      case 'banners': return (
          <BannerSettings 
              banners={props.banners || []}
              onUpdateBanners={props.updateBanners}
          />
      );
      case 'partners': return (
          <PartnerSettings 
              partners={props.partners || []} 
              onUpdatePartners={props.updatePartners} 
          />
      );
      case 'branding': return (
          <BrandingSettings 
              headerLogoUrl={props.headerLogoUrl || ''}
              onUpdateHeaderLogo={props.updateHeaderLogo || (() => {})}
              pwaIconUrl={props.pwaIconUrl || ''}
              onUpdatePwaIcon={props.updatePwaIcon || (() => {})}
          />
      );
      case 'news': return (
          <NewsManager 
              news={props.news || []}
              onUpdateNews={props.onUpdateNews}
              categories={props.newsCategories}
              onUpdateCategories={props.updateNewsCategories}
          />
      );
      case 'shop': return (
          <ProductManager 
              products={props.products || []}
              onUpdateProducts={props.updateProducts}
              categories={props.shopCategories}
              onUpdateCategories={props.updateShopCategories}
          />
      );
      case 'history': return (
          <HistoryManager 
              history={props.history}
              teams={props.teams}
              onAddEntry={props.addHistoryEntry}
              onDeleteEntry={props.deleteHistoryEntry}
          />
      );
      case 'rules': return (
          <RulesEditor rules={props.rules} onSave={props.updateRules} />
      );
      case 'data': return (
          <DataManager 
              teams={props.teams}
              matches={props.matches}
              groups={props.groups}
              rules={props.rules}
              banners={props.banners}
              partners={props.partners}
              headerLogoUrl={props.headerLogoUrl || ''}
              mode={props.mode}
              knockoutStage={props.knockoutStage}
              scheduleSettings={props.scheduleSettings}
              setTournamentState={props.setTournamentState}
          />
      );
      case 'group-fixtures': return (
        <div className="pb-20 space-y-6">
            {props.startMatchday && props.pauseSchedule && props.setMatchday && props.processMatchdayTimeouts && (
                <ScheduleControl 
                    settings={props.scheduleSettings}
                    onStart={props.startMatchday}
                    onPause={props.pauseSchedule}
                    onSetMatchday={props.setMatchday}
                    onCheckTimeouts={props.processMatchdayTimeouts}
                    totalMatchdays={38} // Hardcoded or dynamic
                />
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {props.groups.map(group => {
                    const groupMatches = props.matches.filter(m => m.group === group.id || m.group === group.name.replace('Group ', '').trim());
                    if (groupMatches.length === 0) return null;
                    const schedule = groupMatches.reduce((acc, m) => {
                        const key = `L${m.leg || 1}-D${m.matchday || 1}`;
                        if (!acc[key]) acc[key] = []; acc[key].push(m); return acc;
                    }, {} as Record<string, Match[]>);
                    const activeKey = selectedMatchdays[group.id] || Object.keys(schedule)[0];
                    return (
                        <div key={group.id} className="bg-brand-secondary/30 p-5 rounded-[1.5rem] border border-white/5 shadow-xl">
                            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5">
                                <h4 className="text-lg font-black text-brand-vibrant uppercase italic tracking-tight">{group.name}</h4>
                                <select 
                                    value={activeKey} 
                                    onChange={(e) => setSelectedMatchdays(prev => ({...prev, [group.id]: e.target.value}))}
                                    className="bg-brand-primary border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white font-bold outline-none"
                                >
                                    {Object.keys(schedule).map(k => <option key={k} value={k}>{k.replace('L', 'Leg ').replace('D', ' Day ')}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                {schedule[activeKey]?.map(match => (
                                    <MatchEditor key={match.id} match={match} onUpdateScore={props.updateMatchScore} onGenerateSummary={async () => ''} onEditSchedule={(m) => setEditingMatch(m)} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      );
      case 'knockout': return (
        <div className="space-y-8 pb-20">
            <Card className="border-brand-vibrant/30 bg-brand-vibrant/5 !p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                        <Zap size={20} className="text-brand-vibrant" /> Kontrol Bracket
                    </h3>
                    <p className="text-xs text-brand-light mt-1">Gunakan data klasemen terbaru untuk membuat bagan otomatis.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleGenerateBracket} className="!bg-brand-vibrant hover:!bg-blue-600 shadow-xl !text-[10px] sm:!text-xs">
                        <Sparkles size={14} /> Auto-Gen
                    </Button>
                    <Button onClick={props.initializeEmptyKnockoutStage} variant="secondary" className="!text-[10px] sm:!text-xs">
                        Clear
                    </Button>
                </div>
            </Card>

            {(['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'] as (keyof KnockoutStageRounds)[]).map(round => {
                const matches = props.knockoutStage?.[round] || [];
                return (
                    <div key={round} className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] sm:text-xs font-black text-brand-light uppercase tracking-[0.2em] flex items-center gap-2">
                                <Trophy size={12} className="text-yellow-500" /> {round}
                            </h4>
                            <button 
                                onClick={() => setShowKoForm({ round })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-vibrant/10 hover:bg-brand-vibrant text-brand-vibrant hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                            >
                                <Plus size={10} /> Add
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {matches.map(m => (
                                <KnockoutMatchEditor 
                                    key={m.id} 
                                    match={m} 
                                    onUpdateScore={props.updateKnockoutMatch} 
                                    onEdit={() => {}} 
                                    onDelete={() => props.deleteKnockoutMatch(round, m.id)} 
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
            
            {showKoForm && <KnockoutMatchForm round={showKoForm.round} teams={props.teams} onClose={() => setShowKoForm(null)} onSave={(...args) => { props.addKnockoutMatch(...args); setShowKoForm(null); }} />}
        </div>
      );
      case 'settings': return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* NEW: ARCHIVE SEASON CONTROL */}
            <Card className="border-yellow-500/30 bg-yellow-900/5 !p-6 sm:!p-8">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-4 flex items-center gap-3">
                    <Crown className="text-yellow-500" size={24} /> Selesaikan Musim
                </h3>
                <p className="text-[11px] text-brand-light mb-6 opacity-70">
                    Gunakan fitur ini jika turnamen {props.mode.toUpperCase()} sudah selesai. 
                    Sistem akan menyimpan Juara ke Hall of Fame dan mereset jadwal untuk musim baru.
                </p>
                <button 
                    onClick={() => setShowArchiveModal(true)}
                    className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-yellow-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                >
                    <Archive size={18} /> Arsipkan & Mulai Musim Baru
                </button>
            </Card>

            <Card className="border-brand-vibrant/20 !p-6 sm:!p-8">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-6 flex items-center gap-3">
                    <Settings className="text-brand-vibrant" size={24} /> System Control
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Users size={16} className="text-brand-light"/>
                            <span className="text-xs font-bold text-white uppercase">Registrasi Tim Baru</span>
                        </div>
                        <button 
                            onClick={() => props.setRegistrationOpen(!props.isRegistrationOpen)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${props.isRegistrationOpen ? 'bg-red-500 text-white shadow-lg' : 'bg-green-500 text-white shadow-lg'}`}
                        >
                            {props.isRegistrationOpen ? 'Tutup' : 'Buka'}
                        </button>
                    </div>
                </div>
            </Card>

            <Card className="border-cyan-500/20 !p-6 sm:!p-8">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-6 flex items-center gap-3">
                    <Eye className="text-cyan-400" size={24} /> Visibilitas Menu Publik
                </h3>
                <p className="text-[10px] text-brand-light mb-4 uppercase tracking-widest opacity-60">Pilih menu yang ingin ditampilkan di navigasi bar bawah (Publik).</p>
                
                <div className="space-y-3">
                    {(['league', 'two_leagues', 'wakacl'] as TournamentMode[]).map(m => {
                        const isVisible = (props.visibleModes || ['league', 'wakacl', 'two_leagues']).includes(m);
                        const label = m === 'league' ? 'Liga Reguler' : m === 'two_leagues' ? '2 Wilayah' : 'Championship';
                        return (
                            <div key={m} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-cyan-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    {isVisible ? <Eye size={16} className="text-cyan-400" /> : <EyeOff size={16} className="text-red-400" />}
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${isVisible ? 'text-white' : 'text-brand-light opacity-40'}`}>{label}</span>
                                </div>
                                <button 
                                    onClick={() => toggleVisibility(m)}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${isVisible ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-brand-light border border-white/10'}`}
                                >
                                    {isVisible ? 'Terlihat' : 'Tersembunyi'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card className="border-red-500/20 bg-red-500/5 !p-6 sm:!p-8">
                <h3 className="text-xl font-black text-white uppercase italic mb-4">Danger Zone</h3>
                <button 
                    onClick={() => { if(window.confirm("RESET TOTAL? Data tidak bisa dikembalikan!")) props.resetTournament(); }}
                    className="w-full py-4 bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-500 hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                    Hard Reset Mode Ini
                </button>
            </Card>
        </div>
      );
      default: return null;
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] -mx-3 md:-mx-8 -my-4 md:-my-8 bg-brand-primary overflow-hidden relative"> 
      {/* ... (Sidebar and Mobile Navigation remain unchanged) ... */}
      <aside className="hidden lg:flex flex-col w-64 bg-brand-secondary/40 border-r border-white/5 backdrop-blur-md z-30 overflow-hidden shrink-0">
          <div className="p-6 border-b border-white/5 flex flex-col gap-4">
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                  <ShieldCheck className="text-brand-vibrant" size={24} /> Admin Hub
              </h2>
              <ModeSwitcher />
          </div>
          <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              {ADMIN_TABS.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${activeTab === tab.id ? 'bg-white/10 text-white shadow-inner' : 'text-brand-light hover:bg-white/5 hover:text-white'}`}>
                      <tab.icon size={16} className={activeTab === tab.id ? tab.color : 'opacity-40'} />
                      {tab.label}
                  </button>
              ))}
          </nav>
      </aside>

      <div className="lg:hidden w-full bg-brand-secondary/95 backdrop-blur-md border-b border-white/10 flex flex-col shrink-0 z-40 relative">
          <div className="flex items-center justify-between px-3 py-3 bg-black/20 gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex-1 flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all active:scale-95 group"
              >
                  <div className="flex items-center gap-2.5">
                      {currentTabInfo?.icon && <currentTabInfo.icon size={18} className={currentTabInfo.color} />}
                      <span className="uppercase tracking-wider font-black text-[10px]">{currentTabInfo?.label}</span>
                  </div>
                  <ChevronDown size={16} className={`text-brand-light transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
              </button>
              <div className="shrink-0">
                  <ModeSwitcher />
              </div>
          </div>

          {/* NEW: MOBILE STATUS & SAVE BAR (VISIBLE ONLY ON MOBILE) */}
          <div className={`px-3 py-1.5 flex items-center justify-between border-t border-white/5 ${props.hasUnsavedChanges ? 'bg-yellow-500/10' : 'bg-black/20'}`}>
               <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${props.isSyncing ? 'text-blue-400' : props.hasUnsavedChanges ? 'text-yellow-500' : 'text-green-500'}`}>
                   {props.isSyncing ? <RefreshCw size={12} className="animate-spin"/> : <Wifi size={12}/>}
                   <span>{props.isSyncing ? 'Syncing...' : props.hasUnsavedChanges ? 'Unsaved' : 'Connected'}</span>
               </div>
               {props.hasUnsavedChanges && !props.isSyncing && (
                   <button onClick={handleForceSave} className="bg-yellow-500 text-brand-primary px-3 py-1 rounded text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all flex items-center gap-1 animate-pulse">
                      <Save size={10} /> Save Now
                   </button>
               )}
          </div>

          {isMobileMenuOpen && (
              <>
                  <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                  <div className="absolute top-full left-0 right-0 bg-brand-secondary border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 max-h-[70vh] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                      <div className="p-2 space-y-1">
                          {ADMIN_TABS.map((tab) => (
                              <button
                                  key={tab.id}
                                  onClick={() => {
                                      setActiveTab(tab.id);
                                      setIsMobileMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${
                                      activeTab === tab.id 
                                      ? 'bg-brand-vibrant text-white shadow-lg' 
                                      : 'text-brand-light hover:bg-white/5 hover:text-white'
                                  }`}
                              >
                                  <div className="flex items-center gap-3">
                                      <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : tab.color} />
                                      {tab.label}
                                  </div>
                                  {activeTab === tab.id && <Check size={14} className="text-white" />}
                              </button>
                          ))}
                      </div>
                  </div>
              </>
          )}
      </div>

      <main className="flex-1 flex flex-col min-w-0 relative bg-black/10 overflow-hidden">
        <header className="hidden lg:flex bg-brand-primary/60 border-b border-white/5 px-8 py-4 justify-between items-center shrink-0 backdrop-blur-xl relative z-40 shadow-xl">
             <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                {currentTabInfo?.icon && <currentTabInfo.icon size={24} className={currentTabInfo.color} />} {currentTabInfo?.label}
             </h1>
             <div className="flex items-center gap-4">
                 
                 {/* Connection Status Indicator */}
                 <div className="flex items-center gap-3 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                     <div className={`flex items-center gap-2 ${props.isSyncing ? 'text-yellow-400' : props.hasUnsavedChanges ? 'text-yellow-500' : 'text-green-500'}`}>
                         {props.isSyncing ? (
                             <RefreshCw className="animate-spin" size={14} />
                         ) : (
                             <Wifi size={14} />
                         )}
                         <span className="text-[10px] font-black uppercase tracking-widest">
                             {props.isSyncing ? 'Syncing...' : props.hasUnsavedChanges ? 'Unsaved' : 'Connected'}
                         </span>
                     </div>
                     {props.hasUnsavedChanges && !props.isSyncing && (
                         <button 
                            onClick={handleForceSave}
                            className="bg-yellow-500 hover:bg-yellow-400 text-brand-primary text-[9px] font-black uppercase px-2 py-0.5 rounded ml-1 animate-pulse"
                         >
                             Save Now
                         </button>
                     )}
                 </div>

                 <div className="h-4 w-px bg-white/10"></div>
                 <span className="text-[10px] font-black text-brand-vibrant uppercase tracking-widest bg-brand-vibrant/5 px-3 py-1 rounded-full border border-brand-vibrant/20">Active Session</span>
             </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed opacity-95">
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto">
                {renderContent()}
             </div>
        </div>
      </main>

      {showArchiveModal && (
          <ArchiveSeasonModal 
              mode={props.mode}
              teams={props.teams}
              knockoutStage={props.knockoutStage}
              onClose={() => setShowArchiveModal(false)}
              onArchive={handleArchiveSeason}
          />
      )}

      {editingMatch && (
          <MatchDetailsModal 
              match={editingMatch} 
              teams={props.teams} 
              onClose={() => setEditingMatch(null)}
              onSave={(id, updates) => {
                  props.updateMatch(id, updates);
                  setEditingMatch(null);
              }}
          />
      )}
    </div>
  );
};
