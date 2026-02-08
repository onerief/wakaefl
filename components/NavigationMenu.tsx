
import React from 'react';
import type { View, TournamentMode } from '../types';
import { Trophy, Globe, LayoutGrid, Newspaper, ShoppingBag, Home, Crown } from 'lucide-react';

interface NavigationMenuProps {
  currentView: View;
  setView: (view: View) => void;
  visibleModes?: TournamentMode[];
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ currentView, setView, visibleModes = ['league', 'wakacl', 'two_leagues'] }) => {
  const NavItem = ({ view, label, icon: Icon, colorClass = "" }: { view: View, label: string, icon: any, colorClass?: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setView(view)}
        className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 min-w-0 ${
          isActive ? 'scale-110' : 'opacity-40 hover:opacity-100'
        }`}
      >
        <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all ${
          isActive 
          ? (colorClass || 'bg-brand-vibrant text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]') 
          : 'text-brand-light'
        }`}>
          <Icon size={14} sm:size={20} className="shrink-0" />
        </div>
        <span className={`text-[5px] xs:text-[6px] sm:text-[8px] font-black uppercase tracking-tighter text-center leading-none truncate w-full px-0.5 ${isActive ? 'text-white' : 'text-brand-light'}`}>
          {label}
        </span>
      </button>
    );
  };

  const isModeVisible = (mode: TournamentMode) => visibleModes.includes(mode);

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[98%] max-w-3xl pointer-events-none">
      <nav className="bg-brand-secondary/95 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-[2rem] p-1 sm:p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between pointer-events-auto ring-1 ring-white/5 gap-0">
          <NavItem view="home" label="Home" icon={Home} />
          
          {isModeVisible('league') && <NavItem view="league" label="Liga" icon={LayoutGrid} />}
          {isModeVisible('two_leagues') && <NavItem view="two_leagues" label="Region" icon={Globe} colorClass="bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)]" />}
          {isModeVisible('wakacl') && <NavItem view="wakacl" label="Champ" icon={Trophy} colorClass="bg-brand-special text-brand-primary shadow-[0_0_15_px_rgba(253,224,71,0.5)]" />}
          
          <NavItem view="hall_of_fame" label="Legends" icon={Crown} colorClass="bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
          <NavItem view="news" label="News" icon={Newspaper} colorClass="bg-blue-500" />
          <NavItem view="shop" label="Shop" icon={ShoppingBag} colorClass="bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
      </nav>
    </div>
  );
};
