
import React, { useState } from 'react';
import type { Team, Group, Match, KnockoutStageRounds, KnockoutMatch, TournamentState, Partner, TournamentMode, TournamentStatus, SeasonHistory, NewsItem, Product } from '../../types';
import { MatchEditor } from './MatchEditor';
import { TeamManager } from './TeamManager';
import { Button } from '../shared/Button';
import { Trophy, Users, ListChecks, Plus, BookOpen, Settings, Database, Crown, ImageIcon, ShieldCheck, Share2, FileJson, LayoutGrid, Zap, Sparkles, AlertTriangle, Check, RefreshCw, X, Info, Newspaper, ShoppingBag, Type } from 'lucide-react';
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
import { useToast } from '../shared/Toast';

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
  isDoubleRoundRobin: boolean;
  isSyncing?: boolean;
  isRegistrationOpen: boolean;
  setMode: (mode: TournamentMode) => void;
  updateMatchScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
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
  updateRules: (rules: string) => void;
  updateBanners: (banners: string[]) => void;
  updatePartners: (partners: Partner[]) => void;
  manualAddGroup: (name: string) => void;
  manualDeleteGroup: (groupId: string) => void;
  manualAddTeamToGroup: (teamId: string, groupId: string) => void;
  manualRemoveTeamFromGroup: (teamId: string, groupId: string) => void;
  generateMatchesFromGroups: () => void;
  setTournamentState: (state: TournamentState) => void;
  addHistoryEntry: (entry: SeasonHistory) => void;
  deleteHistoryEntry: (id: string) => void;
  headerLogoUrl?: string;
  updateHeaderLogo?: (url: string) => void;
  setRegistrationOpen: (open: boolean) => void;
  setTournamentStatus: (status: 'active' | 'completed') => void;
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
    { id: 'branding', label: 'Logo Web', icon: ShieldCheck, color: 'text-cyan-400' },
    { id: 'history', label: 'Riwayat Juara', icon: Crown, color: 'text-orange-400' },
    { id: 'rules', label: 'Aturan', icon: BookOpen, color: 'text-brand-light' },
    { id: 'data', label: 'Database', icon: FileJson, color: 'text-rose-400' },
    { id: 'settings', label: 'System', icon: Settings, color: 'text-white' },
];

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('teams');
  const [selectedMatchdays, setSelectedMatchdays] = useState<Record<string, string>>({});
  const [showKoForm, setShowKoForm] = useState<{ round: keyof KnockoutStageRounds } | null>(null);
  const { addToast } = useToast();

  const currentTabInfo = ADMIN_TABS.find(t => t.id === activeTab);

  const handleGenerateBracket = () => {
    const res = props.generateKnockoutBracket();
    if (res.success) addToast("Bracket otomatis berhasil dibuat!", "success");
    else addToast(res.message || "Gagal membuat bracket.", "error");
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'teams': return <TeamManager {...props as any} onGenerationSuccess={() => setActiveTab('group-fixtures')} />;
      case 'group-fixtures': return (
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
                                <MatchEditor key={match.id} match={match} onUpdateScore={props.updateMatchScore} onGenerateSummary={async () => ''} onEditSchedule={() => {}} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      );
      case 'knockout': return (
        <div className="space-y-8">
            <Card className="border-brand-vibrant/30 bg-brand-vibrant/5 !p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                        <Zap size={20} className="text-brand-vibrant" /> Kontrol Bracket Knockout
                    </h3>
                    <p className="text-xs text-brand-light mt-1">Gunakan data klasemen grup terbaru untuk membuat bagan secara otomatis.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleGenerateBracket} className="!bg-brand-vibrant hover:!bg-blue-600 shadow-xl">
                        <Sparkles size={16} /> Auto-Generate (Top 2)
                    </Button>
                    <Button onClick={props.initializeEmptyKnockoutStage} variant="secondary">
                        Clear Bracket
                    </Button>
                </div>
            </Card>

            {(['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'] as (keyof KnockoutStageRounds)[]).map(round => {
                const matches = props.knockoutStage?.[round] || [];
                return (
                    <div key={round} className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-sm font-black text-brand-light uppercase tracking-[0.3em] flex items-center gap-2">
                                <Trophy size={14} className="text-yellow-500" /> {round} <span className="opacity-40">({matches.length})</span>
                            </h4>
                            <button 
                                onClick={() => setShowKoForm({ round })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-vibrant/10 hover:bg-brand-vibrant text-brand-vibrant hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                            >
                                <Plus size={12} /> Add Match
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
                            {matches.length === 0 && <div className="col-span-full py-10 text-center opacity-20 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest italic">Belum ada pertandingan di babak ini</div>}
                        </div>
                    </div>
                );
            })}
            
            {showKoForm && <KnockoutMatchForm round={showKoForm.round} teams={props.teams} onClose={() => setShowKoForm(null)} onSave={(...args) => { props.addKnockoutMatch(...args); setShowKoForm(null); }} />}
        </div>
      );
      case 'news': return <NewsManager news={props.news || []} onUpdateNews={props.onUpdateNews} categories={props.newsCategories} onUpdateCategories={props.updateNewsCategories} />;
      case 'shop': return <ProductManager products={props.products || []} onUpdateProducts={props.updateProducts} categories={props.shopCategories} onUpdateCategories={props.updateShopCategories} />;
      case 'marquee': return <MarqueeSettings messages={props.marqueeMessages || []} onUpdate={props.updateMarqueeMessages} />;
      case 'banners': return <BannerSettings banners={props.banners} onUpdateBanners={props.updateBanners} />;
      case 'partners': return <PartnerSettings partners={props.partners} onUpdatePartners={props.updatePartners} />;
      case 'branding': return <BrandingSettings headerLogoUrl={props.headerLogoUrl || ''} onUpdateHeaderLogo={props.updateHeaderLogo || (() => {})} />;
      case 'history': return <HistoryManager history={props.history} teams={props.teams} onAddEntry={props.addHistoryEntry} onDeleteEntry={props.deleteHistoryEntry} />;
      case 'rules': return <RulesEditor rules={props.rules} onSave={props.updateRules} />;
      case 'data': return <DataManager teams={props.teams} matches={props.matches} groups={props.groups} rules={props.rules} banners={props.banners} partners={props.partners} headerLogoUrl={props.headerLogoUrl || ''} mode={props.mode} knockoutStage={props.knockoutStage} setTournamentState={props.setTournamentState} />;
      case 'settings': return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Card className="border-brand-vibrant/20 !p-8">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-6 flex items-center gap-3">
                    <Settings className="text-brand-vibrant" size={28} /> System Controls
                </h3>
                
                <div className="space-y-8">
                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${props.isRegistrationOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                <Users size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white uppercase tracking-wider text-sm">Pendaftaran Tim Baru</h4>
                                <p className="text-[11px] text-brand-light opacity-60">Status pendaftaran saat ini: <strong>{props.isRegistrationOpen ? 'TERBUKA' : 'TERTUTUP'}</strong></p>
                            </div>
                        </div>
                        <button 
                            onClick={() => props.setRegistrationOpen(!props.isRegistrationOpen)}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${props.isRegistrationOpen ? 'bg-red-500 text-white shadow-lg' : 'bg-green-500 text-white shadow-lg'}`}
                        >
                            {props.isRegistrationOpen ? 'Tutup Pendaftaran' : 'Buka Pendaftaran'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${props.status === 'active' ? 'bg-brand-vibrant/20 text-brand-vibrant' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                <Trophy size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white uppercase tracking-wider text-sm">Status Turnamen</h4>
                                <p className="text-[11px] text-brand-light opacity-60">Status saat ini: <strong>{props.status.toUpperCase()}</strong></p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => props.setTournamentStatus('active')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${props.status === 'active' ? 'bg-brand-vibrant text-white border-brand-vibrant' : 'bg-transparent text-brand-light border-white/10'}`}
                            >
                                Active
                            </button>
                            <button 
                                onClick={() => props.setTournamentStatus('completed')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${props.status === 'completed' ? 'bg-brand-special text-brand-primary border-brand-special' : 'bg-transparent text-brand-light border-white/10'}`}
                            >
                                Completed
                            </button>
                        </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-4">
                         <Info size={20} className="text-yellow-500 shrink-0" />
                         <p className="text-xs text-yellow-200/70 leading-relaxed italic">
                            Catatan: Pengaturan ini hanya berlaku untuk mode turnamen yang sedang aktif (<strong>{props.mode.toUpperCase()}</strong>). Gunakan navigasi utama jika ingin mengubah pengaturan di kompetisi lain.
                         </p>
                    </div>
                </div>
            </Card>

            <Card className="border-red-500/20 bg-red-500/5 !p-8">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="text-red-500" size={28} />
                    <h3 className="text-xl font-black text-white uppercase italic">Danger Zone</h3>
                </div>
                <p className="text-sm text-brand-light mb-6">Reset total akan menghapus seluruh data tim, grup, dan pertandingan di musim ini.</p>
                <button 
                    onClick={() => { if(window.confirm("RESET TOTAL? Data tidak bisa dikembalikan!")) props.resetTournament(); }}
                    className="w-full py-4 bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-500 hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl"
                >
                    Hard Reset Musim Ini
                </button>
            </Card>
        </div>
      );
      default: return null;
    }
  }

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-100px)] -mx-3 md:-mx-8 -my-4 md:-my-8 bg-brand-primary overflow-hidden"> 
      <aside className="hidden lg:flex flex-col w-72 bg-brand-secondary/40 border-r border-white/5 backdrop-blur-md z-30">
          <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
              {ADMIN_TABS.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase italic transition-all ${activeTab === tab.id ? 'bg-white/10 text-white shadow-inner' : 'text-brand-light hover:bg-white/5 hover:text-white'}`}>
                      <tab.icon size={18} className={activeTab === tab.id ? tab.color : 'opacity-40'} />
                      {tab.label}
                  </button>
              ))}
          </nav>
      </aside>

      <div className="lg:hidden w-full bg-brand-secondary/80 backdrop-blur-md border-b border-white/5 overflow-x-auto no-scrollbar py-2 px-3 flex gap-2 shrink-0 z-40">
          {ADMIN_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase italic whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-brand-vibrant text-white shadow-lg' : 'bg-white/5 text-brand-light'}`}>
                  <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : tab.color} />
                  {tab.label}
              </button>
          ))}
      </div>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-brand-primary/40 border-b border-white/5 px-6 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0 backdrop-blur-sm relative z-40">
             <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                {currentTabInfo?.icon && <currentTabInfo.icon size={28} className={currentTabInfo.color} />} {currentTabInfo?.label}
             </h1>
             <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase text-brand-light opacity-60">Active: {props.mode.toUpperCase()}</span>
                 <div className={`w-2 h-2 rounded-full ${props.isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
             </div>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-32 lg:pb-8">
                {renderContent()}
             </div>
        </div>
      </main>
    </div>
  );
};
