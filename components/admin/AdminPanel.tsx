
import { useReducer, useCallback, useState, useEffect, useRef } from 'react';
import type { Team, Group, Match, Standing, KnockoutStageRounds, KnockoutMatch, TournamentState, Partner, TournamentMode, TournamentStatus, MatchComment, SeasonHistory, NewsItem, Product } from '../../types';
import { generateSummary } from '../../services/geminiService';
import { subscribeToTournamentData, saveTournamentData, sanitizeData } from '../../services/firebaseService';
import { useToast } from '../shared/Toast';

import React from 'react';
import { MatchEditor } from './MatchEditor';
import { TeamManager } from './TeamManager';
import { Button } from '../shared/Button';
import { Trophy, Users, ListChecks, Plus, BookOpen, Settings, Database, PlayCircle, StopCircle, Archive, LayoutDashboard, Zap, ChevronDown, Check, Menu, Lock, Unlock, Crown, Image as ImageIcon, ShieldCheck, HelpCircle, Bell, ChevronRight, LayoutGrid, CloudCheck, RefreshCw, FileJson, Share2, Layers, AlertCircle, List, Newspaper, ShoppingBag } from 'lucide-react';
import { Card } from '../shared/Card';
import { RulesEditor } from './RulesEditor';
import { BannerSettings } from './BannerSettings';
import { PartnerSettings } from './PartnerSettings';
import { BrandingSettings } from './BrandingSettings';
import { HistoryManager } from './HistoryManager';
import { NewsManager } from './NewsManager';
import { ProductManager } from './ProductManager';
import { GenerateBracketConfirmationModal } from './GenerateBracketConfirmationModal';
import { ConfirmationModal } from './ConfirmationModal';
import { DataManager } from './DataManager';
import { TeamLogo } from '../shared/TeamLogo';

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
  mode: TournamentMode;
  status: TournamentStatus;
  history: SeasonHistory[];
  isDoubleRoundRobin: boolean;
  isSyncing?: boolean;
  setMode: (mode: TournamentMode) => void;
  updateMatchScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
  addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => void;
  updateTeam: (teamId: string, name: string, logoUrl: string, manager?: string | undefined, socialMediaUrl?: string | undefined, whatsappNumber?: string | undefined, isTopSeed?: boolean | undefined, ownerEmail?: string | undefined) => void;
  deleteTeam: (teamId: string) => void;
  onUpdateNews: (news: NewsItem[]) => void;
  updateProducts: (products: Product[]) => void;
  updateNewsCategories: (cats: string[]) => void;
  updateShopCategories: (cats: string[]) => void;
  generateKnockoutBracket: () => { success: boolean; message?: string };
  updateKnockoutMatch: (matchId: string, match: KnockoutMatch) => void;
  initializeEmptyKnockoutStage: () => void;
  addKnockoutMatch: (round: keyof KnockoutStageRounds, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string, matchNumber: number) => void;
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
  finalizeSeason: () => { success: boolean; message: string };
  resumeSeason: () => void;
  startNewSeason: () => void; 
  addHistoryEntry: (entry: SeasonHistory) => void;
  deleteHistoryEntry: (id: string) => void;
  headerLogoUrl?: string;
  updateHeaderLogo?: (url: string) => void;
}

type AdminTab = 'teams' | 'group-fixtures' | 'knockout' | 'news' | 'shop' | 'banners' | 'partners' | 'history' | 'rules' | 'branding' | 'data' | 'settings';

const ADMIN_TABS: { id: AdminTab; label: string; icon: any; color: string }[] = [
    { id: 'teams', label: 'Tim & Manager', icon: Users, color: 'text-blue-400' },
    { id: 'group-fixtures', label: 'Jadwal Liga', icon: ListChecks, color: 'text-indigo-400' },
    { id: 'knockout', label: 'Knockout', icon: Trophy, color: 'text-yellow-400' },
    { id: 'news', label: 'News Manager', icon: Newspaper, color: 'text-orange-400' },
    { id: 'shop', label: 'Shop Manager', icon: ShoppingBag, color: 'text-emerald-400' },
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
  const { isSyncing, setTournamentState, products, updateProducts, newsCategories, shopCategories, updateNewsCategories, updateShopCategories } = props;

  const currentTabInfo = ADMIN_TABS.find(t => t.id === activeTab);

  const renderContent = () => {
    switch(activeTab) {
      case 'teams': return <TeamManager {...props} onGenerationSuccess={() => setActiveTab('group-fixtures')} />;
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
      case 'news': return <NewsManager news={props.news || []} onUpdateNews={props.onUpdateNews} categories={newsCategories} onUpdateCategories={updateNewsCategories} />;
      case 'shop': return <ProductManager products={products || []} onUpdateProducts={updateProducts} categories={shopCategories} onUpdateCategories={updateShopCategories} />;
      case 'banners': return <BannerSettings banners={props.banners} onUpdateBanners={props.updateBanners} />;
      case 'partners': return <PartnerSettings partners={props.partners} onUpdatePartners={props.updatePartners} />;
      case 'history': return <HistoryManager history={props.history} teams={props.teams} onAddEntry={props.addHistoryEntry} onDeleteEntry={props.deleteHistoryEntry} />;
      case 'rules': return <RulesEditor rules={props.rules} onSave={props.updateRules} />;
      case 'data': return <DataManager teams={props.teams} matches={props.matches} groups={props.groups} rules={props.rules} banners={props.banners} partners={props.partners} headerLogoUrl={props.headerLogoUrl || ''} mode={props.mode} knockoutStage={props.knockoutStage} setTournamentState={setTournamentState} />;
      default: return null;
    }
  }

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-100px)] -mx-3 md:-mx-8 -my-4 md:-my-8 bg-brand-primary overflow-hidden"> 
      {/* Sidebar Desktop */}
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

      {/* Sidebar Mobile (Scrollable Horizontal) */}
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
             <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
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
