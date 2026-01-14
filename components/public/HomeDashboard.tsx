
import React from 'react';
import { Trophy, ListOrdered, ChevronRight, Gamepad2, Users, Star, Crown, Globe, PlusCircle } from 'lucide-react';
import { Card } from '../shared/Card';
import { TournamentMode } from '../../types';
import { BannerMarquee } from './BannerMarquee';

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
    <div className="space-y-6 md:space-y-8 py-2 md:py-4 animate-in fade-in duration-700 relative z-10">
      
      {/* Banner Marquee Section */}
      {banners && banners.length > 0 && (
          <div className="w-full">
              <BannerMarquee banners={banners} />
          </div>
      )}

      {/* Hero Section */}
      <div className="relative rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-brand-secondary to-brand-primary p-6 md:p-12 border border-white/5 shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[url('https://media.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L3AtNDY3LXBvbC00MzQ2LWwtMS1hLWpvYjkzNC5qcGc.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-vibrant/20 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-brand-vibrant/10 border border-brand-vibrant/20 rounded-full mb-4 md:mb-6">
            <Star size={12} className="text-brand-special fill-brand-special md:w-[14px] md:h-[14px]" />
            <span className="text-[10px] md:text-xs font-black text-brand-special uppercase tracking-widest">The Ultimate eFootball Hub</span>
          </div>
          
          <h1 className="text-2xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-4 md:mb-6">
            WAY KANAN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-vibrant via-brand-special to-brand-vibrant">eFootball Mobile</span>
          </h1>
          <p className="text-brand-light text-xs md:text-base mb-6 md:mb-8 max-w-md">
            Kelola liga reguler atau turnamen Champions League Way Kanan dengan sistem otomatis yang profesional dan real-time.
          </p>
          
          <div className="flex flex-wrap gap-4 md:gap-6 items-center">
             <div className="flex flex-col">
                <span className="text-xl md:text-3xl font-black text-white">{teamCount}</span>
                <span className="text-[9px] md:text-[10px] font-bold text-brand-light uppercase tracking-widest">Teams Joined</span>
             </div>
             <div className="h-8 md:h-10 w-px bg-white/10 hidden sm:block"></div>
             <div className="flex flex-col">
                <span className="text-xl md:text-3xl font-black text-white">{partnerCount}</span>
                <span className="text-[9px] md:text-[10px] font-bold text-brand-light uppercase tracking-widest">Partners</span>
             </div>
             
             {isRegistrationOpen && (
                 <div className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-8">
                     <button 
                        onClick={onRegisterTeam}
                        className="group relative flex items-center gap-2 md:gap-3 px-4 py-2.5 md:px-6 md:py-3 bg-white text-brand-primary rounded-xl font-bold uppercase text-xs md:text-sm tracking-wider shadow-lg hover:shadow-white/20 transition-all hover:scale-105 active:scale-95 z-20"
                     >
                         <div className="absolute -inset-1 bg-gradient-to-r from-brand-vibrant to-brand-special rounded-xl blur opacity-20 group-hover:opacity-60 transition-opacity"></div>
                         <PlusCircle size={18} className="relative z-10 text-brand-vibrant md:w-5 md:h-5" />
                         <span className="relative z-10">Daftar Tim Baru</span>
                     </button>
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* Mode Selection Row - Grid 3 cols on mobile for main modes, 1 col for Hall of Fame below */}
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 relative z-30">
        
        {/* League Mode Card */}
        <button 
          onClick={() => onSelectMode('league')}
          className="group relative text-left block w-full outline-none focus:ring-2 focus:ring-brand-vibrant rounded-xl md:rounded-[2rem]"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-vibrant to-blue-800 rounded-xl md:rounded-[2rem] blur opacity-10 group-hover:opacity-100 transition duration-500"></div>
          <Card className="relative h-full !p-3 sm:!p-8 rounded-xl md:!rounded-[2rem] border-white/5 bg-brand-secondary/40 backdrop-blur-xl hover:border-brand-vibrant/50 transition-all pointer-events-none">
            <div className="flex justify-between items-start mb-2 md:mb-8">
              <div className="p-1.5 md:p-3 bg-brand-primary rounded-lg md:rounded-2xl border border-white/5 shadow-xl group-hover:scale-110 group-hover:bg-brand-vibrant/10 transition-all duration-500">
                <ListOrdered size={20} className="text-brand-vibrant md:w-8 md:h-8" />
              </div>
              <ChevronRight className="text-brand-light group-hover:text-brand-vibrant transition-colors group-hover:translate-x-2 duration-500 hidden md:block" size={20} />
            </div>
            <h3 className="text-[10px] sm:text-lg md:text-2xl font-black text-white italic uppercase leading-tight">Regular <br className="md:hidden" /> Liga</h3>
            <p className="text-brand-light text-[10px] md:text-sm leading-tight mt-1 hidden sm:block">
              Klasemen tunggal. Sistem Round Robin.
            </p>
          </Card>
        </button>

        {/* Two Leagues Mode Card */}
        <button 
          onClick={() => onSelectMode('two_leagues')}
          className="group relative text-left block w-full outline-none focus:ring-2 focus:ring-purple-500 rounded-xl md:rounded-[2rem]"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-purple-800 rounded-xl md:rounded-[2rem] blur opacity-10 group-hover:opacity-100 transition duration-500"></div>
          <Card className="relative h-full !p-3 sm:!p-8 rounded-xl md:!rounded-[2rem] border-white/5 bg-brand-secondary/40 backdrop-blur-xl hover:border-purple-500/50 transition-all pointer-events-none">
            <div className="flex justify-between items-start mb-2 md:mb-8">
              <div className="p-1.5 md:p-3 bg-brand-primary rounded-lg md:rounded-2xl border border-white/5 shadow-xl group-hover:scale-110 group-hover:bg-purple-500/10 transition-all duration-500">
                <Globe size={20} className="text-purple-400 md:w-8 md:h-8" />
              </div>
              <ChevronRight className="text-brand-light group-hover:text-purple-400 transition-colors group-hover:translate-x-2 duration-500 hidden md:block" size={20} />
            </div>
            <h3 className="text-[10px] sm:text-lg md:text-2xl font-black text-white italic uppercase leading-tight">2 <br className="md:hidden" /> Wilayah</h3>
            <p className="text-brand-light text-[10px] md:text-sm leading-tight mt-1 hidden sm:block">
              Grup Neraka & Surga. Knockout.
            </p>
          </Card>
        </button>

        {/* WAKACL Mode Card */}
        <button 
          onClick={() => onSelectMode('wakacl')}
          className="group relative text-left block w-full outline-none focus:ring-2 focus:ring-brand-special rounded-xl md:rounded-[2rem]"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-special to-brand-vibrant rounded-xl md:rounded-[2rem] blur opacity-10 group-hover:opacity-100 transition duration-500"></div>
          <Card className="relative h-full !p-3 sm:!p-8 rounded-xl md:!rounded-[2rem] border-white/5 bg-brand-secondary/40 backdrop-blur-xl hover:border-brand-special/50 transition-all pointer-events-none">
            <div className="flex justify-between items-start mb-2 md:mb-8">
              <div className="p-1.5 md:p-3 bg-brand-primary rounded-lg md:rounded-2xl border border-white/5 shadow-xl group-hover:scale-110 group-hover:bg-brand-special/10 transition-all duration-500">
                <Trophy size={20} className="text-brand-special md:w-8 md:h-8" />
              </div>
              <ChevronRight className="text-brand-light group-hover:text-brand-special transition-colors group-hover:translate-x-2 duration-500 hidden md:block" size={20} />
            </div>
            <h3 className="text-[10px] sm:text-lg md:text-2xl font-black text-white italic uppercase leading-tight">WAKA <br className="md:hidden" /> CL</h3>
            <p className="text-brand-light text-[10px] md:text-sm leading-tight mt-1 hidden sm:block">
              Champions League. Group & Knockout.
            </p>
          </Card>
        </button>

        {/* Hall of Fame Card - Row 2 on mobile (span 3), Column 4 on desktop */}
        <button 
          onClick={() => onSelectMode('hall_of_fame')}
          className="group relative text-left col-span-3 sm:col-span-1 mt-2 sm:mt-0 block w-full outline-none focus:ring-2 focus:ring-yellow-500 rounded-xl md:rounded-[2rem]"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-xl md:rounded-[2rem] blur opacity-10 group-hover:opacity-100 transition duration-500"></div>
          <Card className="relative h-full !p-4 sm:!p-8 rounded-xl md:!rounded-[2rem] border-white/5 bg-brand-secondary/40 backdrop-blur-xl hover:border-yellow-500/50 transition-all pointer-events-none">
            <div className="flex justify-between items-center sm:items-start mb-0 sm:mb-8">
              <div className="flex items-center gap-3 sm:block">
                <div className="p-2 md:p-3 bg-brand-primary rounded-lg md:rounded-2xl border border-white/5 shadow-xl group-hover:scale-110 group-hover:bg-yellow-500/10 transition-all duration-500">
                    <Crown size={24} className="text-yellow-400 md:w-8 md:h-8" />
                </div>
                <h3 className="sm:hidden text-lg font-black text-white italic uppercase">Hall of Fame</h3>
              </div>
              <div className="flex items-center gap-2">
                 <span className="sm:hidden text-[10px] font-bold text-brand-light uppercase tracking-widest">Daftar Juara</span>
                 <ChevronRight className="text-brand-light group-hover:text-yellow-400 transition-colors group-hover:translate-x-2 duration-500" size={20} />
              </div>
            </div>
            <h3 className="hidden sm:block text-lg md:text-2xl font-black text-white italic uppercase mb-1 md:mb-2">Hall of Fame</h3>
            <p className="text-brand-light text-[11px] md:text-sm leading-relaxed hidden sm:block">
              Daftar para juara dan legenda turnamen sebelumnya.
            </p>
          </Card>
        </button>
      </div>
      
      {/* Featured Footer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 py-8 md:py-12 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-vibrant/20 flex items-center justify-center flex-shrink-0">
                <Gamepad2 size={20} className="text-brand-vibrant md:w-6 md:h-6" />
            </div>
            <div>
                <h4 className="text-xs md:text-base font-black text-white italic uppercase leading-none mb-1">Pro Stats</h4>
                <p className="text-[10px] md:text-xs text-brand-light">Pelacakan formasi & hasil real-time</p>
            </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-gradient-end/20 flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-brand-special md:w-6 md:h-6" />
            </div>
            <div>
                <h4 className="text-xs md:text-base font-black text-white italic uppercase leading-none mb-1">Verified Teams</h4>
                <p className="text-[10px] md:text-xs text-brand-light">Komunitas eFootball Terverifikasi</p>
            </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-special/20 flex items-center justify-center flex-shrink-0">
                <Trophy size={20} className="text-brand-special md:w-6 md:h-6" />
            </div>
            <div>
                <h4 className="text-xs md:text-base font-black text-white italic uppercase leading-none mb-1">Elite Prizes</h4>
                <p className="text-[10px] md:text-xs text-brand-light">Kompetisi dengan hadiah menarik</p>
            </div>
        </div>
      </div>
    </div>
  );
};
