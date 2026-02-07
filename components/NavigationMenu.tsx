
import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../types';
import { Trophy, Crown, ListOrdered, Globe, ChevronDown, LayoutGrid, Zap, Newspaper, ShoppingBag, Home } from 'lucide-react';

interface NavigationMenuProps {
  currentView: View;
  setView: (view: View) => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ currentView, setView }) => {
  const [isLigaOpen, setIsLigaOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLigaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLigaActive = currentView === 'league' || currentView === 'two_leagues';

  return (
    <nav className="sticky top-16 sm:top-32 z-40 w-full bg-brand-primary/90 backdrop-blur-xl border-b border-white/5 shadow-2xl overflow-visible">
      <div className="container mx-auto px-4 overflow-visible">
        <div className="flex flex-wrap items-center justify-center py-2 sm:py-5 gap-1.5 sm:gap-6 overflow-visible">
            
            {/* HOME BUTTON */}
            {currentView !== 'home' && (
                <button
                    onClick={() => setView('home')}
                    className="px-3 sm:px-8 py-2 sm:py-3 rounded-xl text-[9px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap border text-brand-light border-white/5 hover:text-white hover:bg-white/5 hover:border-brand-vibrant/30 group"
                >
                    <Home size={14} sm:size={18} className="group-hover:text-brand-vibrant transition-colors" />
                    <span>Home</span>
                </button>
            )}

            {/* 1. LIGA DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsLigaOpen(!isLigaOpen)}
                    className={`px-3 sm:px-8 py-2 sm:py-3 rounded-xl text-[9px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap border ${
                        isLigaActive 
                        ? 'bg-brand-vibrant text-white border-brand-vibrant shadow-lg shadow-brand-vibrant/30 scale-105' 
                        : 'text-brand-light border-white/5 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <ListOrdered size={14} sm:size={18} />
                    <span>Liga</span>
                    <ChevronDown size={12} sm:size={14} className={`transition-transform duration-500 ${isLigaOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLigaOpen && (
                    <div className="absolute top-[110%] left-0 sm:left-1/2 sm:-translate-x-1/2 w-48 sm:w-56 bg-brand-secondary border border-brand-vibrant/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-[100] ring-1 ring-white/10">
                        <div className="p-1.5 flex flex-col gap-1 bg-brand-secondary/95 backdrop-blur-2xl">
                            <div className="px-3 py-1 mb-0.5">
                                <span className="text-[7px] font-black text-brand-light uppercase tracking-[0.3em] opacity-40">Pilih Format</span>
                            </div>
                            <button 
                                onClick={() => { setView('league'); setIsLigaOpen(false); }}
                                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-[9px] sm:text-xs font-black uppercase italic transition-all ${currentView === 'league' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:bg-white/5 hover:text-white'}`}
                            >
                                <LayoutGrid size={14} /> Reguler
                            </button>
                            <button 
                                onClick={() => { setView('two_leagues'); setIsLigaOpen(false); }}
                                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-[9px] sm:text-xs font-black uppercase italic transition-all ${currentView === 'two_leagues' ? 'bg-purple-600 text-white shadow-lg' : 'text-brand-light hover:bg-white/5 hover:text-white'}`}
                            >
                                <Globe size={14} /> 2 Region
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={() => { setView('wakacl'); setIsLigaOpen(false); }}
                className={`px-3 sm:px-8 py-2 sm:py-3 rounded-xl text-[9px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap border ${
                    currentView === 'wakacl' ? 'bg-brand-special text-brand-primary border-brand-special shadow-lg scale-105' : 'text-brand-light border-white/5 hover:text-white hover:bg-white/5'
                }`}
            >
                <Trophy size={14} sm:size={18} /> <span>Champions</span>
            </button>

            <button
                onClick={() => { setView('news'); setIsLigaOpen(false); }}
                className={`px-3 sm:px-8 py-2 sm:py-3 rounded-xl text-[9px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap border ${
                    currentView === 'news' ? 'bg-blue-500 text-white border-blue-500 shadow-lg' : 'text-brand-light border-white/5 hover:text-white hover:bg-white/5'
                }`}
            >
                <Newspaper size={14} sm:size={18} /> <span>Berita</span>
            </button>

            <button
                onClick={() => { setView('shop'); setIsLigaOpen(false); }}
                className={`px-3 sm:px-8 py-2 sm:py-3 rounded-xl text-[9px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap border ${
                    currentView === 'shop' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'text-brand-light border-white/5 hover:text-white hover:bg-white/5'
                }`}
            >
                <ShoppingBag size={14} sm:size={18} /> <span>Shop</span>
            </button>
        </div>
      </div>
    </nav>
  );
};
