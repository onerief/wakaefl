
import React from 'react';
import type { View } from '../types';
import { Shield, Zap, User as UserIcon, LogIn } from 'lucide-react';
import type { User } from 'firebase/auth';

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
}

export const Header: React.FC<HeaderProps> = ({ 
    currentView, 
    setView, 
    isAdminAuthenticated, 
    onAdminViewRequest, 
    currentUser,
    onUserAuthRequest,
    onShowProfile,
    headerLogoUrl
}) => {
  return (
    <header className="sticky top-0 z-[70] bg-brand-primary/95 backdrop-blur-xl border-b border-white/5 shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
      <div className="container mx-auto px-4 md:px-8 h-16 sm:h-32 flex justify-between items-center relative">
        
        {/* LEFT: LOGO */}
        <div 
            className="flex items-center group cursor-pointer z-30 min-w-0" 
            onClick={() => setView('home')}
        >
            <div className="relative flex-shrink-0">
                {headerLogoUrl ? (
                    <img 
                        src={headerLogoUrl} 
                        alt="Logo" 
                        className="h-10 sm:h-24 w-auto object-contain drop-shadow-[0_0_20px_rgba(37,99,235,0.7)] group-hover:scale-105 transition-transform duration-500" 
                    />
                ) : (
                    <div className="relative">
                        <Shield size={32} className="text-brand-vibrant fill-brand-vibrant/10 group-hover:scale-105 transition-transform sm:w-20 sm:h-20 drop-shadow-[0_0_20px_rgba(37,99,235,0.6)]"/>
                        <Zap size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-special animate-pulse sm:w-10 sm:h-10" />
                    </div>
                )}
            </div>
        </div>

        {/* CENTER: BRANDING TEXT */}
        <div 
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none sm:pointer-events-auto cursor-pointer group z-20 w-full max-w-[45%] sm:max-w-none"
            onClick={() => setView('home')}
        >
            <h1 className="text-base sm:text-5xl font-black text-white italic leading-none tracking-tighter uppercase group-hover:text-brand-vibrant transition-all duration-500 drop-shadow-[0_5px_15px_rgba(0,0,0,1)] truncate w-full text-center">
                Way Kanan
            </h1>
            <div className="flex items-center gap-2 sm:gap-4 mt-0.5 sm:mt-1 w-full justify-center">
                <div className="hidden sm:block h-px w-6 sm:w-16 bg-gradient-to-r from-transparent to-brand-vibrant opacity-50"></div>
                <span className="text-[5px] sm:text-base font-black bg-gradient-to-r from-blue-500 via-blue-400 to-brand-special bg-clip-text text-transparent uppercase tracking-[0.15em] sm:tracking-[0.5em] leading-tight drop-shadow-[0_0_10px_rgba(37,99,235,0.5)] whitespace-nowrap">
                    eFootball Mobile
                </span>
                <div className="hidden sm:block h-px w-6 sm:w-16 bg-gradient-to-l from-transparent to-brand-special opacity-50"></div>
            </div>
        </div>

        {/* RIGHT: AUTH/PROFILE */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0 z-30">
            {currentUser ? (
                <button 
                    onClick={onShowProfile}
                    className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 sm:pl-5 sm:pr-1.5 bg-white/[0.03] border border-white/10 rounded-full hover:bg-white/10 transition-all group shadow-2xl"
                >
                    <span className="hidden xl:block text-[10px] font-black text-brand-light uppercase group-hover:text-white transition-colors max-w-[100px] truncate">
                        {currentUser.displayName || 'Pemain'}
                    </span>
                    <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-brand-vibrant/40 group-hover:border-brand-vibrant transition-all shadow-inner">
                        {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-brand-vibrant/20 flex items-center justify-center text-brand-vibrant">
                                <UserIcon size={14} sm:size={20} />
                            </div>
                        )}
                    </div>
                </button>
            ) : (
                <button
                    onClick={onUserAuthRequest}
                    className="px-3 py-1.5 sm:px-6 sm:py-3.5 rounded-full text-[8px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all bg-brand-vibrant text-white hover:bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95 flex items-center gap-1 sm:gap-1.5 border border-white/10"
                >
                    <LogIn size={12} className="sm:w-4 sm:h-4" />
                    <span className="font-black">Login</span>
                </button>
            )}
            
            {isAdminAuthenticated && (
                <button 
                    onClick={onAdminViewRequest}
                    className={`p-1.5 sm:p-3 rounded-full transition-all border ${currentView === 'admin' ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/5 border-white/10 text-brand-light hover:text-white'}`}
                    title="Panel Admin"
                >
                    <Shield size={16} sm:size={20} />
                </button>
            )}
        </div>
      </div>
    </header>
  );
};
