
import React, { useState } from 'react';
import type { View, Team } from '../types';
import { Shield, LogOut, Zap, Home, User as UserIcon, LogIn } from 'lucide-react';
import type { User } from 'firebase/auth';
import { UserProfileModal } from './public/UserProfileModal';

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
}

export const Header: React.FC<HeaderProps> = ({ 
    currentView, 
    setView, 
    isAdminAuthenticated, 
    onAdminViewRequest, 
    onLogout, // Admin Logout
    currentUser,
    onUserAuthRequest,
    onUserLogout,
    onShowProfile
}) => {
  return (
    <header className="sticky top-0 z-50 bg-brand-primary/80 backdrop-blur-md border-b border-white/5 shadow-2xl">
      <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        
        {/* Logo Area */}
        <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer min-w-0" onClick={() => setView('home')}>
            <div className="relative flex-shrink-0">
                <Shield size={28} className="sm:w-8 sm:h-8 text-brand-vibrant fill-brand-vibrant/20 drop-shadow-[0_0_8px_rgba(37,99,235,0.5)] group-hover:scale-110 transition-transform duration-300"/>
                <Zap size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-special animate-pulse sm:w-[14px] sm:h-[14px]" />
            </div>
            <div className="min-w-0 flex flex-col">
                <h1 className="text-base sm:text-lg md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-vibrant to-brand-special tracking-tighter uppercase italic leading-none truncate">
                    WAY KANAN
                </h1>
                <p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-brand-light tracking-widest uppercase">WAKACL Hub</p>
            </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-brand-secondary/50 p-1 rounded-full border border-white/5">
          <button
            onClick={() => setView('home')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
              currentView === 'home'
                ? 'bg-white/10 text-brand-vibrant'
                : 'text-brand-light hover:text-white hover:bg-white/5'
            }`}
          >
            <Home size={16} />
          </button>

          <button
            onClick={() => setView('league')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
              currentView === 'league'
                ? 'bg-gradient-to-r from-brand-vibrant to-blue-700 text-white shadow-lg'
                : 'text-brand-light hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Liga</span>
          </button>

          <button
            onClick={() => setView('wakacl')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
              currentView === 'wakacl'
                ? 'bg-gradient-to-r from-brand-special to-yellow-600 text-brand-primary shadow-lg'
                : 'text-brand-light hover:text-white hover:bg-white/5'
            }`}
          >
            <span>WAKACL</span>
          </button>
          
          {/* Admin Button - ONLY Visible if Authenticated */}
          {isAdminAuthenticated && (
            <>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button
                    onClick={onAdminViewRequest}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                    currentView === 'admin'
                        ? 'bg-gradient-to-r from-brand-vibrant to-indigo-600 text-white shadow-lg'
                        : 'text-brand-light hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Shield size={16} />
                    <span className="hidden lg:inline">Admin</span>
                </button>
            </>
          )}
          
          {/* User Auth Section */}
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          
          {currentUser ? (
              <button 
                onClick={onShowProfile}
                className="flex items-center gap-2 px-1 pl-2 py-1 hover:bg-white/5 rounded-full transition-colors group"
              >
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-vibrant/10 rounded-full border border-brand-vibrant/20 group-hover:bg-brand-vibrant/20 transition-colors">
                      {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt="Profile" className="w-5 h-5 rounded-full ring-1 ring-brand-vibrant" />
                      ) : (
                          <UserIcon size={16} className="text-brand-vibrant" />
                      )}
                      <span className="text-xs font-bold text-white max-w-[100px] truncate">
                        {currentUser.displayName || currentUser.email?.split('@')[0] || 'Member'}
                      </span>
                   </div>
              </button>
          ) : (
             <button
                onClick={onUserAuthRequest}
                className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 bg-brand-vibrant text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
              >
                <LogIn size={14} />
                <span>Masuk / Daftar</span>
              </button>
          )}
        </div>

        {/* Mobile View Toggle */}
        <div className="md:hidden flex items-center gap-2">
            <button 
                onClick={() => setView('home')}
                className={`p-2 rounded-lg ${currentView === 'home' ? 'text-brand-vibrant bg-white/5' : 'text-brand-light'}`}
            >
                <Home size={20} />
            </button>
            
            {/* User Mobile Auth */}
             {currentUser ? (
                <button onClick={onShowProfile} className="p-2 rounded-lg text-brand-light hover:text-brand-vibrant">
                     {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 rounded-full ring-1 ring-brand-vibrant/50" />
                      ) : (
                          <UserIcon size={20} />
                      )}
                </button>
             ) : (
                <button onClick={onUserAuthRequest} className="p-2 rounded-lg text-brand-vibrant bg-white/5">
                    <LogIn size={20} />
                </button>
             )}

            {isAdminAuthenticated && (
                <button 
                    onClick={onAdminViewRequest}
                    className={`p-2 transition-colors ${currentView === 'admin' ? 'text-brand-vibrant' : 'text-brand-light hover:text-white'}`}
                >
                    <Shield size={20} />
                </button>
            )}
        </div>
      </div>
    </header>
  );
};
