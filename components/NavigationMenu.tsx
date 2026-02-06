
import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../types';
import { Trophy, Crown, ListOrdered, Globe, ChevronDown, LayoutGrid, Zap, Newspaper, ShoppingBag } from 'lucide-react';

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
    <nav className="sticky top-20 sm:top-32 z-40 w-full bg-brand-primary/90 backdrop-blur-xl border-b border-white/5 shadow-2xl overflow-visible">
      <div className="container mx-auto px-4 overflow-visible">
        {/* Changed from overflow-x-auto to flex-wrap for better dropdown visibility */}
        <div className="flex flex-wrap items-center justify-center py-3 sm:py-5 gap-2 sm:gap-6 overflow-visible">
            
            {/* 1. LIGA DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsLigaOpen(!isLigaOpen)}
                    className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap border ${
                        isLigaActive 
                        ? 'bg-brand-vibrant text-white border-brand-vibrant shadow-lg shadow-brand-vibrant/30 scale-105' 
                        : 'text-brand-light border-white/5 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <ListOrdered size={18} />
                    <span>Kompetisi Liga</span>
                    <ChevronDown size={14} className={`transition-transform duration-500 ${isLigaOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLigaOpen && (
                    <div className="absolute top-[110%] left-0 sm:left-1/2 sm:-translate-x-1/2 w-56 bg-brand-secondary border border-brand-vibrant/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-[100] ring-1 ring-white/10">
                        <div className="p-2 flex flex-col gap-1.5 bg-brand-secondary/95 backdrop-blur-2xl">
                            <div className="px-3 py-1 mb-1">
                                <span className="text-[8px] font-black text-brand-light uppercase tracking-[0.3em] opacity-40">Pilih Format</span>
                            </div>
                            <button 
                                onClick={() => { setView('league'); setIsLigaOpen(false); }}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] sm:text-xs font-black uppercase italic transition-all ${currentView === 'league' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:bg-white/5 hover:text-white'}`}
                            >
                                <LayoutGrid size={16} /> Reguler Liga
                            </button>
                            <button 
                                onClick={() => { setView('two_leagues'); setIsLigaOpen(false); }}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] sm:text-xs font-black uppercase italic transition-all ${currentView === 'two_leagues' ? 'bg-purple-600 text-white shadow-lg' : 'text-brand-light hover:bg-white/5 hover:text-white'}`}
                            >
                                <Globe size={16} /> Liga 2 Wilayah
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={() => { setView('wakacl'); setIsLigaOpen(false); }}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap border ${
                    currentView === 'wakacl' ? 'bg-brand-special text-brand-primary border-brand-special shadow-lg shadow-brand-special/30 scale-105' : 'text-brand-light border-white/5 hover:text-white hover:bg-white/5'
                }`}
            >
                <Trophy size={18} /> <span>Champions</span>
            </button>

            <button
                onClick={() => { setView('news'); setIsLigaOpen(false); }}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap border ${
                    currentView === 'news' ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30' : 'text-brand-light border-white/5 hover:text-white hover:bg-white/5'
                }`}
            >
                <Newspaper size={18} /> <span>Berita</span>
            </button>

            <button
                onClick={() => { setView('shop'); setIsLigaOpen(false); }}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap border ${
                    currentView === 'shop' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' : 'text-brand-light border-white/5 hover:text-white hover:bg-white/5'
                }`}
            >
                <ShoppingBag size={18} /> <span>Waka Shop</span>
            </button>

            <button
                onClick={() => { setView('hall_of_fame'); setIsLigaOpen(false); }}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap border ${
                    currentView === 'hall_of_fame' ? 'bg-white/20 text-white border-white/20 shadow-lg' : 'text-brand-light border-white/5 hover:text-white hover:bg-white/5'
                }`}
            >
                <Crown size={18} /> <span>HoF</span>
            </button>
        </div>
      </div>
    </nav>
  );
};
