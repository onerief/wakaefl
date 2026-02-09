
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
        type="button"
        onClick={() => setView(view)}
        className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 min-w-0 h-full py-1 cursor-pointer touch-manipulation active:scale-90 ${
          isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className={`relative p-2 rounded-xl transition-all duration-500 ${
          isActive 
          ? (colorClass || 'bg-brand-vibrant text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110') 
          : 'text-brand-light'
        }`}>
          <Icon size={20} className="sm:w-[24px] sm:h-[24px]" />
          {isActive && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_#fff]"></div>
          )}
        </div>
        <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-tight text-center leading-none truncate w-full px-0.5 mt-0.5 ${isActive ? 'text-white' : 'text-brand-light'}`}>
          {label}
        </span>
      </button>
    );
  };

  const isModeVisible = (mode: TournamentMode) => (visibleModes || ['league', 'wakacl', 'two_leagues']).includes(mode);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe pointer-events-none">
      <div className="w-full max-w-4xl px-3 pb-4 sm:pb-6">
        <nav className="bg-brand-primary/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,1)] flex items-center justify-between pointer-events-auto ring-1 ring-white/5 h-16 sm:h-20 gap-1 w-full relative overflow-hidden select-none">
            {/* Background Glow Effect for the whole bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-vibrant/5 via-transparent to-brand-special/5 pointer-events-none"></div>
            
            <NavItem view="home" label="Home" icon={Home} />
            
            {isModeVisible('league') && <NavItem view="league" label="Liga" icon={LayoutGrid} />}
            {isModeVisible('two_leagues') && <NavItem view="two_leagues" label="Wilayah" icon={Globe} colorClass="bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)]" />}
            {isModeVisible('wakacl') && <NavItem view="wakacl" label="Champ" icon={Trophy} colorClass="bg-brand-special text-brand-primary shadow-[0_0_15px_rgba(253,224,71,0.5)]" />}
            
            <NavItem view="hall_of_fame" label="Hall" icon={Crown} colorClass="bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            <NavItem view="news" label="Berita" icon={Newspaper} colorClass="bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
            <NavItem view="shop" label="Shop" icon={ShoppingBag} colorClass="bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
        </nav>
      </div>
    </div>
  );
};
