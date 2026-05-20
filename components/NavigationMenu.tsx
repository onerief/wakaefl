
import React from 'react';
import type { View, TournamentMode } from '../types';
import { Trophy, Globe, LayoutGrid, Newspaper, ShoppingBag, Home, Crown, MessageCircle, Zap } from 'lucide-react';
import { CustomTrophy } from './shared/Icons';

interface NavigationMenuProps {
  currentView: View;
  setView: (view: View) => void;
  visibleModes?: TournamentMode[];
  hiddenViews?: View[];
  onToggleChat: () => void;
  isChatOpen: boolean;
  customName?: string;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ 
    currentView, 
    setView, 
    visibleModes = ['league', 'wakacl', 'two_leagues'], 
    hiddenViews = [],
    onToggleChat, 
    isChatOpen,
    customName
}) => {
  const NavItem = ({ view, label, icon: Icon, colorClass = "" }: { view: View, label: string, icon: any, colorClass?: string }) => {
    const isHidden = (hiddenViews || []).includes(view);
    if (isHidden && view !== 'home') return null; // Home is usually always visible or handled separately

    const isActive = currentView === view;
    return (
      <button
        type="button"
        onClick={() => setView(view)}
        className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 min-w-[60px] sm:min-w-0 flex-1 h-full py-1 cursor-pointer touch-manipulation active:scale-90 shrink-0 ${
          isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className={`relative flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl transition-all duration-300 ${
          isActive 
          ? (colorClass ? colorClass.split(' ')[0] : 'text-brand-vibrant') 
          : 'text-brand-light'
        }`}>
          <Icon size={20} className={`sm:w-[24px] sm:h-[24px] transition-transform ${isActive ? 'scale-110' : ''}`} />
        </div>
        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-center leading-none truncate w-full px-0.5 mt-0.5 ${isActive ? (colorClass ? colorClass.split(' ')[0] : 'text-brand-vibrant') : 'text-brand-light'}`}>
          {label}
        </span>
      </button>
    );
  };

  const ChatItem = () => {
      const isActive = isChatOpen;
      return (
        <button
          type="button"
          onClick={onToggleChat}
          className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 min-w-[60px] sm:min-w-0 flex-1 h-full py-1 cursor-pointer touch-manipulation active:scale-90 shrink-0 ${
            isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'
          }`}
        >
          <div className={`relative flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl transition-all duration-300 ${
            isActive 
            ? 'text-brand-vibrant' 
            : 'text-brand-light'
          }`}>
            <MessageCircle size={20} className={`sm:w-[24px] sm:h-[24px] transition-transform ${isActive ? 'scale-110' : ''}`} />
          </div>
          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-center leading-none truncate w-full px-0.5 mt-0.5 ${isActive ? 'text-brand-vibrant' : 'text-brand-light'}`}>
            Chat
          </span>
        </button>
      );
  };

  const isModeVisible = (mode: TournamentMode) => (visibleModes || ['league', 'wakacl', 'two_leagues']).includes(mode);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe border-t border-brand-accent bg-brand-primary/90 backdrop-blur-xl transition-all duration-300">
      <div className="w-full max-w-5xl px-2">
        <nav className="flex items-center justify-around sm:justify-between h-14 sm:h-16 w-full relative overflow-x-auto no-scrollbar select-none">
            <NavItem view="home" label="Home" icon={Home} />
            
            {isModeVisible('league') && <NavItem view="league" label="Liga" icon={LayoutGrid} colorClass="text-blue-500" />}
            {isModeVisible('two_leagues') && <NavItem view="two_leagues" label="Wilayah" icon={Globe} colorClass="text-purple-500" />}
            {isModeVisible('wakacl') && <NavItem view="wakacl" label="Champ" icon={CustomTrophy} colorClass="text-brand-special" />}
            {isModeVisible('custom') && <NavItem view="custom" label={customName || "Kustom"} icon={Zap} colorClass="text-brand-vibrant" />}
            
            <NavItem view="hall_of_fame" label="Hall" icon={Crown} colorClass="text-orange-500" />
            <NavItem view="news" label="Berita" icon={Newspaper} colorClass="text-blue-400" />
            <NavItem view="shop" label="Shop" icon={ShoppingBag} colorClass="text-emerald-500" />
            
            <ChatItem />
        </nav>
      </div>
    </div>
  );
};
