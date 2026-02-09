
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
        className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 flex-1 min-w-0 h-full py-1 cursor-pointer touch-manipulation active:scale-95 ${
          isActive ? 'opacity-100' : 'opacity-40 hover:opacity-80'
        }`}
        aria-current={isActive ? 'page' : undefined}
        title={label}
      >
        <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 ${
          isActive 
          ? (colorClass || 'bg-brand-vibrant text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-110') 
          : 'text-brand-light'
        }`}>
          <Icon size={18} className="sm:w-[22px] sm:h-[22px]" />
        </div>
        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-center leading-none truncate w-full px-0.5 ${isActive ? 'text-white' : 'text-brand-light'}`}>
          {label}
        </span>
      </button>
    );
  };

  const isModeVisible = (mode: TournamentMode) => (visibleModes || ['league', 'wakacl', 'two_leagues']).includes(mode);

  return (
    // Fixed: Removed h-0 and translate logic that pushed nav off-screen.
    // Kept pointer-events-none on container so clicks pass through empty areas to the footer.
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <div className="w-full max-w-3xl px-2 pb-4">
        {/* pointer-events-auto ensures the nav bar itself is clickable */}
        <nav className="bg-brand-secondary/95 backdrop-blur-3xl border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-1 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center justify-between pointer-events-auto ring-1 ring-white/5 h-16 sm:h-20 gap-1 w-full relative overflow-hidden select-none">
            <NavItem view="home" label="Home" icon={Home} />
            
            {isModeVisible('league') && <NavItem view="league" label="Liga" icon={LayoutGrid} />}
            {isModeVisible('two_leagues') && <NavItem view="two_leagues" label="Region" icon={Globe} colorClass="bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)]" />}
            {isModeVisible('wakacl') && <NavItem view="wakacl" label="Champ" icon={Trophy} colorClass="bg-brand-special text-brand-primary shadow-[0_0_15_px_rgba(253,224,71,0.5)]" />}
            
            <NavItem view="hall_of_fame" label="Legends" icon={Crown} colorClass="bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            <NavItem view="news" label="Berita" icon={Newspaper} colorClass="bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
            <NavItem view="shop" label="Shop" icon={ShoppingBag} colorClass="bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
        </nav>
      </div>
    </div>
  );
};
