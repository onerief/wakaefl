
import React from 'react';
import type { View } from '../types';
import { User as UserIcon, LogIn } from 'lucide-react';
import type { User } from 'firebase/auth';
import { AutoTimer } from './public/AutoTimer';
import { WakaLogo } from './shared/Icons';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  isAdminAuthenticated: boolean;
  onAdminViewRequest: () => void;
  onLogout: () => void;
  currentUser: User | null;
  onUserAuthRequest: () => void;
  onUserLogout: () => void;
  onShowProfile?: () => void;
  headerLogoUrl?: string;
  resetCycle?: 24 | 48;
  lastResetTime?: number;
  onResetCycleChange?: (cycle: 24 | 48) => void;
  hasUnreadNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    currentView, 
    setView, 
    isAdminAuthenticated, 
    onAdminViewRequest, 
    currentUser,
    onUserAuthRequest,
    onShowProfile,
    headerLogoUrl,
    resetCycle,
    lastResetTime,
    onResetCycleChange,
    hasUnreadNotifications
}) => {
  return (
    <header className="sticky top-0 z-40 bg-brand-primary/95 backdrop-blur-md border-b border-white/5 pt-safe">
      <div className="px-4 h-14 sm:h-16 flex justify-between items-center relative">
        
        {/* LEFT: LOGO */}
        <div 
            className="flex items-center group cursor-pointer z-30 min-w-0 relative flex-shrink-0" 
            onClick={() => setView('home')}
        >
            <div className="relative">
                {headerLogoUrl ? (
                    <img 
                        src={headerLogoUrl} 
                        alt="Logo" 
                        className="h-8 sm:h-10 w-auto object-contain transition-transform duration-300" 
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <WakaLogo className="w-8 h-8 sm:w-10 sm:h-10 text-brand-vibrant" />
                        <div className="flex flex-col">
                            <span className="text-[12px] font-black text-white leading-none truncate uppercase tracking-widest">WAKA</span>
                            <span className="text-[8px] font-bold text-brand-vibrant uppercase">Hub</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT: AUTH/PROFILE */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0 z-30">
            <div className="hidden md:block">
                <AutoTimer 
                    cycle={resetCycle} 
                    lastResetTime={lastResetTime}
                    onCycleChange={onResetCycleChange} 
                    isAdmin={isAdminAuthenticated} 
                />
            </div>
            {currentUser ? (
                <button 
                    onClick={onShowProfile}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-accent/30 overflow-hidden border border-brand-accent hover:border-brand-vibrant transition-all relative"
                >
                    {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon size={14} className="text-brand-vibrant" />
                    )}
                    {hasUnreadNotifications && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </button>
            ) : (
                <button
                    onClick={onUserAuthRequest}
                    className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all bg-brand-vibrant text-white active:scale-95 flex items-center gap-1"
                >
                    <LogIn size={12} />
                    <span>Login</span>
                </button>
            )}
        </div>
      </div>
    </header>
  );
};
