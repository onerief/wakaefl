
import React from 'react';
import type { View, TournamentMode } from '../types';
import { Trophy, Globe, LayoutGrid, Newspaper, ShoppingBag, Home, Crown, MessageCircle, Sun, Moon } from 'lucide-react';
import { CustomTrophy } from './shared/Icons';

interface NavigationMenuProps {
  currentView: View;
  setView: (view: View) => void;
  visibleModes?: TournamentMode[];
  onToggleChat: () => void;
  isChatOpen: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ currentView, setView, visibleModes = ['league', 'wakacl', 'two_leagues'], onToggleChat, isChatOpen, theme, onToggleTheme }) => {
  const NavItem = ({ view, label, icon: Icon, colorClass = "" }: { view: View, label: string, icon: any, colorClass?: string }) => {
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
        <div className={`relative p-1.5 sm:p-2 rounded-xl transition-all duration-500 ${
          isActive 
          ? (colorClass || 'bg-brand-vibrant text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110') 
          : 'text-brand-light'
        }`}>
          <Icon size={20} className="sm:w-[24px] sm:h-[24px]" />
          {isActive && (
              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_#fff]"></div>
          )}
        </div>
        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-center leading-none truncate w-full px-0.5 mt-0.5 ${isActive ? 'text-white' : 'text-brand-light'}`}>
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
          <div className={`relative p-1.5 sm:p-2 rounded-xl transition-all duration-500 ${
            isActive 
            ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-110' 
            : 'text-brand-light'
          }`}>
            <MessageCircle size={20} className="sm:w-[24px] sm:h-[24px]" />
            {isActive && (
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_#fff]"></div>
            )}
          </div>
          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-center leading-none truncate w-full px-0.5 mt-0.5 ${isActive ? 'text-white' : 'text-brand-light'}`}>
            Chat
          </span>
        </button>
      );
  };

  const ThemeToggle = () => {
      return (
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 min-w-[60px] sm:min-w-0 flex-1 h-full py-1 cursor-pointer touch-manipulation active:scale-90 shrink-0 opacity-40 hover:opacity-70"
        >
          <div className="relative p-1.5 sm:p-2 rounded-xl transition-all duration-500 text-brand-light">
            {theme === 'dark' ? (
                <Sun size={20} className="sm:w-[24px] sm:h-[24px]" />
            ) : (
                <Moon size={20} className="sm:w-[24px] sm:h-[24px]" />
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-center leading-none truncate w-full px-0.5 mt-0.5 text-brand-light">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>
      );
  };

  const isModeVisible = (mode: TournamentMode) => (visibleModes || ['league', 'wakacl', 'two_leagues']).includes(mode);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe pointer-events-none">
      <div className="w-full max-w-5xl px-0 sm:px-3 pb-3 sm:pb-6">
        <nav className="bg-brand-primary/95 backdrop-blur-2xl border-t sm:border border-white/10 sm:rounded-[2rem] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,1)] flex items-center justify-start sm:justify-between pointer-events-auto ring-1 ring-white/5 h-[4.5rem] sm:h-20 w-full relative overflow-x-auto no-scrollbar select-none">
            {/* Background Glow Effect for the whole bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-vibrant/5 via-transparent to-brand-special/5 pointer-events-none sticky left-0 right-0"></div>
            
            <NavItem view="home" label="Home" icon={Home} />
            
            {isModeVisible('league') && <NavItem view="league" label="Liga" icon={LayoutGrid} />}
            {isModeVisible('two_leagues') && <NavItem view="two_leagues" label="Wilayah" icon={Globe} colorClass="bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)]" />}
            {isModeVisible('wakacl') && <NavItem view="wakacl" label="Champ" icon={CustomTrophy} colorClass="bg-brand-special text-brand-primary shadow-[0_0_15px_rgba(253,224,71,0.5)]" />}
            
            <NavItem view="hall_of_fame" label="Hall" icon={Crown} colorClass="bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            <NavItem view="news" label="Berita" icon={Newspaper} colorClass="bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
            <NavItem view="shop" label="Shop" icon={ShoppingBag} colorClass="bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            
            <ChatItem />
            <ThemeToggle />
        </nav>
      </div>
    </div>
  );
};
