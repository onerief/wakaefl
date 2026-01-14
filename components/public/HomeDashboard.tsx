
import React from 'react';
import { Trophy, ListOrdered, ChevronRight, Gamepad2, Users, Star, Crown, Globe, PlusCircle } from 'lucide-react';
import { Card } from '../shared/Card';
import { TournamentMode } from '../../types';
import { BannerCarousel } from './BannerCarousel';

interface HomeDashboardProps {
  onSelectMode: (mode: TournamentMode | 'hall_of_fame') => void;
  teamCount: number;
  partnerCount: number;
  banners?: string[];
  onRegisterTeam?: () => void;
  isRegistrationOpen?: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onSelectMode, teamCount, partnerCount, banners, onRegisterTeam, isRegistrationOpen = true }) => {
  return (
    <div className="space-y-4 md:space-y-10 py-2 md:py-4 animate-in fade-in duration-700 relative z-10">
      
      {/* Automatic Slideshow Section */}
      {banners && banners.length > 0 && (
          <div className="w-full">
              <BannerCarousel banners={banners} />
          </div>
      )}

      {/* Hero Section */}
      <div className="relative rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-brand-secondary to-brand-primary p-5 md:p-12 border border-white/5 shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[url('https://media.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L3AtNDY3LXBvbC00MzQ2LWwtMS1hLWpvYjkzNC5qcGc.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-vibrant/20 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-vibrant/10 border border-brand-vibrant/20 rounded-full mb-4">
            <Star size={10} className="text-brand-special fill-brand-special md:w-[14px] md:h-[14px]" />
            <span className="text-[9px] md:text-xs font-black text-brand-special uppercase tracking-widest">The Ultimate eFootball Hub</span>
          </div>
          
          <h1 className="text-2xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-[0.9] mb-3 md:mb-6">
            WAY KANAN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-vibrant via-brand-special to-brand-vibrant">eFootball Mobile</span>
          </h1>
          <p className="text-brand-light text-[10px] md:text-base mb-5 md:mb-8 max-w-md">
            Kelola liga reguler atau turnamen Champions League Way Kanan dengan sistem otomatis yang profesional.
          </p>
          
          <div className="flex flex-wrap gap-4 md:gap-8 items-center">
             <div className="flex flex-col">
                <span className="text-xl md:text-3xl font-black text-white">{teamCount}</span>
                <span className="text-[8px] md:text-[10px] font-bold text-brand-light uppercase tracking-widest">Teams Joined</span>
             </div>
             <div className="h-6 md:h-10 w-px bg-white/10"></div>
             <div className="flex flex-col">
                <span className="text-xl md:text-3xl font-black text-white">{partnerCount}</span>
                <span className="text-[8px] md:text-[10px] font-bold text-brand-light uppercase tracking-widest">Partners</span>
             </div>
             
             {isRegistrationOpen && (
                 <div className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-4">
                     <button 
                        onClick={onRegisterTeam}
                        className="group relative flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-brand-primary rounded-lg font-bold uppercase text-[10px] md:text-sm tracking-wider shadow-lg hover:shadow-white/20 transition-all z-20 w-full sm:w-auto"
                     >
                         <PlusCircle size={14} className="relative z-10 text-brand-vibrant md:w-5 md:h-5" />
                         <span className="relative z-10">Daftar Tim Baru</span>
                     </button>
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* Mode Selection Row - Updated Layout with Horizontal Text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-30">
        
        {/* Reguler Liga */}
        <button onClick={() => onSelectMode('league')} className="group relative text-left outline-none">
          <Card className="relative h-full !p-4 md:!p-5 rounded-2xl border-white/5 bg-brand-secondary/40 backdrop-blur-xl group-hover:border-brand-vibrant/50 transition-all">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex-shrink-0 p-2.5 md:p-3 bg-brand-primary rounded-xl border border-white/5 shadow-inner group-hover:bg-brand-vibrant/10 transition-colors">
                <ListOrdered size={20} className="text-brand-vibrant md:w-7 md:h-7" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm md:text-base font-black text-white italic uppercase leading-none tracking-tight truncate">Reguler Liga</h3>
                <span className="text-[8px] md:text-[9px] font-bold text-brand-light uppercase tracking-widest opacity-40 mt-1.5">Full Season</span>
              </div>
            </div>
          </Card>
        </button>

        {/* 2 Wilayah */}
        <button onClick={() => onSelectMode('two_leagues')} className="group relative text-left outline-none">
          <Card className="relative h-full !p-4 md:!p-5 rounded-2xl border-white/5 bg-brand-secondary/40 backdrop-blur-xl group-hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex-shrink-0 p-2.5 md:p-3 bg-brand-primary rounded-xl border border-white/5 shadow-inner group-hover:bg-purple-500/10 transition-colors">
                <Globe size={20} className="text-purple-400 md:w-7 md:h-7" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm md:text-base font-black text-white italic uppercase leading-none tracking-tight truncate">2 Wilayah</h3>
                <span className="text-[8px] md:text-[9px] font-bold text-brand-light uppercase tracking-widest opacity-40 mt-1.5">Dual Regions</span>
              </div>
            </div>
          </Card>
        </button>

        {/* WAKA CL */}
        <button onClick={() => onSelectMode('wakacl')} className="group relative text-left outline-none">
          <Card className="relative h-full !p-4 md:!p-5 rounded-2xl border-white/5 bg-brand-secondary/40 backdrop-blur-xl group-hover:border-brand-special/50 transition-all">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex-shrink-0 p-2.5 md:p-3 bg-brand-primary rounded-xl border border-white/5 shadow-inner group-hover:bg-brand-special/10 transition-colors">
                <Trophy size={20} className="text-brand-special md:w-7 md:h-7" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm md:text-base font-black text-white italic uppercase leading-none tracking-tight truncate">WAKACL</h3>
                <span className="text-[8px] md:text-[9px] font-bold text-brand-light uppercase tracking-widest opacity-40 mt-1.5">Elite Cup</span>
              </div>
            </div>
          </Card>
        </button>

        {/* Hall of Fame */}
        <button onClick={() => onSelectMode('hall_of_fame')} className="group relative text-left outline-none">
          <Card className="relative h-full !p-4 md:!p-5 rounded-2xl border-white/5 bg-brand-secondary/40 backdrop-blur-xl group-hover:border-yellow-500/50 transition-all">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex-shrink-0 p-2.5 md:p-3 bg-brand-primary rounded-xl border border-white/5 shadow-inner group-hover:bg-yellow-500/10 transition-colors">
                <Crown size={20} className="text-yellow-400 md:w-7 md:h-7" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm md:text-base font-black text-white italic uppercase leading-none tracking-tight truncate">Hall of Fame</h3>
                <span className="text-[8px] md:text-[9px] font-bold text-brand-light uppercase tracking-widest opacity-40 mt-1.5">Champions</span>
              </div>
            </div>
          </Card>
        </button>

      </div>
    </div>
  );
};
