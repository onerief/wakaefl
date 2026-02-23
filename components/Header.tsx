
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
    onResetCycleChange
}) => {
  return (
    <header className="sticky top-0 z-40 bg-brand-primary/95 backdrop-blur-xl border-b border-white/5 shadow-[0_15px_50px_rgba(0,0,0,0.8)] pt-safe">
      <div className="container mx-auto px-3 sm:px-8 h-14 sm:h-32 flex justify-between items-center relative">
        
        {/* LEFT: LOGO */}
        <div 
            className="flex items-center group cursor-pointer z-30 min-w-0 relative" 
            onClick={() => setView('home')}
        >
            <div className="relative flex-shrink-0">
                {headerLogoUrl ? (
                    <img 
                        src={headerLogoUrl} 
                        alt="Logo" 
                        className="h-8 sm:h-24 w-auto object-contain drop-shadow-[0_0_20px_rgba(37,99,235,0.7)] group-hover:scale-105 transition-transform duration-500" 
                    />
                ) : (
                    <div className="relative scale-75 sm:scale-100">
                        <WakaLogo className="w-8 h-8 sm:w-20 sm:h-20 drop-shadow-[0_0_20px_rgba(37,99,235,0.6)] group-hover:scale-105 transition-transform duration-500" />
                    </div>
                )}
            </div>
        </div>

        {/* CENTER: BRANDING TEXT - POINTER EVENTS FIX */}
        {/* The container is pointer-events-none so it doesn't block clicks on the sides. The inner content is pointer-events-auto to be clickable. */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div 
                className="flex flex-col items-center cursor-pointer group pointer-events-auto"
                onClick={() => setView('home')}
            >
                <h1 className="text-sm sm:text-5xl font-black text-white italic leading-none tracking-tighter uppercase group-hover:text-brand-vibrant transition-all duration-500 drop-shadow-[0_5px_15px_rgba(0,0,0,1)] truncate w-full text-center">
                    Way Kanan
                </h1>
                <div className="flex items-center gap-1 sm:gap-4 mt-0.5 sm:mt-1 w-full justify-center">
                    <span className="text-[4px] sm:text-base font-black bg-gradient-to-r from-blue-500 via-blue-400 to-brand-special bg-clip-text text-transparent uppercase tracking-[0.1em] sm:tracking-[0.5em] leading-tight drop-shadow-[0_0_10px_rgba(37,99,235,0.5)] whitespace-nowrap">
                        eFootball Mobile
                    </span>
                </div>
            </div>
        </div>

        {/* RIGHT: AUTH/PROFILE */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0 z-30">
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
                    className="flex items-center gap-2 p-0.5 sm:p-2 sm:pl-5 sm:pr-1.5 bg-white/[0.03] border border-white/10 rounded-full hover:bg-white/10 transition-all group cursor-pointer relative"
                >
                    <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-brand-vibrant/40 group-hover:border-brand-vibrant transition-all shadow-inner relative">
                        {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-brand-vibrant/20 flex items-center justify-center text-brand-vibrant">
                                <UserIcon size={12} className="sm:w-5 sm:h-5" />
                            </div>
                        )}
                    </div>
                </button>
            ) : (
                <button
                    onClick={onUserAuthRequest}
                    className="px-2.5 py-1.5 sm:px-6 sm:py-3.5 rounded-lg sm:rounded-full text-[7px] sm:text-xs font-black uppercase tracking-[0.05em] sm:tracking-[0.2em] transition-all bg-brand-vibrant text-white shadow-lg active:scale-95 flex items-center gap-1 border border-white/10 cursor-pointer"
                >
                    <LogIn size={10} className="sm:w-4 sm:h-4" />
                    <span>Login</span>
                </button>
            )}
        </div>
      </div>
    </header>
  );
};
