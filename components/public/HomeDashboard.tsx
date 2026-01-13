
import React from 'react';
import { Trophy, ListOrdered, ChevronRight, Gamepad2, Users, Star, Crown, Globe } from 'lucide-react';
import { Card } from '../shared/Card';
import { TournamentMode } from '../../types';

interface HomeDashboardProps {
  onSelectMode: (mode: TournamentMode | 'hall_of_fame') => void;
  teamCount: number;
  partnerCount: number;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onSelectMode, teamCount, partnerCount }) => {
  return (
    <div className="space-y-12 py-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-brand-secondary to-brand-primary p-8 md:p-16 border border-white/5 shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[url('https://media.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L3AtNDY3LXBvbC00MzQ2LWwtMS1hLWpvYjkzNC5qcGc.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-vibrant/20 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-vibrant/10 border border-brand-vibrant/20 rounded-full mb-6">
            <Star size={14} className="text-brand-special fill-brand-special" />
            <span className="text-xs font-black text-brand-special uppercase tracking-widest">The Ultimate eFootball Hub</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none mb-6">
            WAY KANAN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-vibrant via-brand-special to-brand-vibrant">eFootball Mobile</span>
          </h1>
          <p className="text-brand-light text-lg mb-8 max-w-md">
            Kelola liga reguler atau turnamen Champions League Way Kanan dengan sistem otomatis yang profesional dan real-time.
          </p>
          
          <div className="flex gap-8">
             <div className="flex flex-col">
                <span className="text-3xl font-black text-white">{teamCount}</span>
                <span className="text-[10px] font-bold text-brand-light uppercase tracking-widest">Teams Joined</span>
             </div>
             <div className="h-10 w-px bg-white/10"></div>
             <div className="flex flex-col">
                <span className="text-3xl font-black text-white">{partnerCount}</span>
                <span className="text-[10px] font-bold text-brand-light uppercase tracking-widest">Partners</span>
             </div>
          </div>
        </div>
      </div>

      {/* Mode Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* League Mode Card */}
        <button 
          onClick={() => onSelectMode('league')}
          className="group relative text-left"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-vibrant to-blue-800 rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
          <Card className="relative h-full !p-8 !rounded-[2rem] border-white/5 bg-brand-secondary/40 backdrop-blur-xl hover:border-brand-vibrant/50 transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-brand-primary rounded-2xl border border-white/5 shadow-xl group-hover:scale-110 group-hover:bg-brand-vibrant/10 transition-all duration-500">
                <ListOrdered size={32} className="text-brand-vibrant" />
              </div>
              <ChevronRight className="text-brand-light group-hover:text-brand-vibrant transition-colors group-hover:translate-x-2 duration-500" size={24} />
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase mb-2">Regular Liga</h3>
            <p className="text-brand-light text-sm leading-relaxed mb-4">
              Klasemen tunggal. Sistem Single/Double Round Robin.
            </p>
          </Card>
        </button>

        {/* Two Leagues Mode Card */}
        <button 
          onClick={() => onSelectMode('two_leagues')}
          className="group relative text-left"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-purple-800 rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
          <Card className="relative h-full !p-8 !rounded-[2rem] border-white/5 bg-brand-secondary/40 backdrop-blur-xl hover:border-purple-500/50 transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-brand-primary rounded-2xl border border-white/5 shadow-xl group-hover:scale-110 group-hover:bg-purple-500/10 transition-all duration-500">
                <Globe size={32} className="text-purple-400" />
              </div>
              <ChevronRight className="text-brand-light group-hover:text-purple-400 transition-colors group-hover:translate-x-2 duration-500" size={24} />
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase mb-2">2 Wilayah</h3>
            <p className="text-brand-light text-sm leading-relaxed mb-4">
              Grup Neraka & Surga. Semi Final & Final untuk juara.
            </p>
          </Card>
        </button>

        {/* WAKACL Mode Card */}
        <button 
          onClick={() => onSelectMode('wakacl')}
          className="group relative text-left"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-special to-brand-vibrant rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
          <Card className="relative h-full !p-8 !rounded-[2rem] border-white/5 bg-brand-secondary/40 backdrop-blur-xl hover:border-brand-special/50 transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-brand-primary rounded-2xl border border-white/5 shadow-xl group-hover:scale-100 group-hover:bg-brand-special/10 transition-all duration-500">
                <Trophy size={32} className="text-brand-special" />
              </div>
              <ChevronRight className="text-brand-light group-hover:text-brand-special transition-colors group-hover:translate-x-2 duration-500" size={24} />
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase mb-2">WAKACL</h3>
            <p className="text-brand-light text-sm leading-relaxed mb-4">
              Group Stage + Knockout hingga Grand Final.
            </p>
          </Card>
        </button>

        {/* Hall of Fame Card */}
        <button 
          onClick={() => onSelectMode('hall_of_fame')}
          className="group relative text-left"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
          <Card className="relative h-full !p-8 !rounded-[2rem] border-white/5 bg-brand-secondary/40 backdrop-blur-xl hover:border-yellow-500/50 transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-brand-primary rounded-2xl border border-white/5 shadow-xl group-hover:scale-110 group-hover:bg-yellow-500/10 transition-all duration-500">
                <Crown size={32} className="text-yellow-400" />
              </div>
              <ChevronRight className="text-brand-light group-hover:text-yellow-400 transition-colors group-hover:translate-x-2 duration-500" size={24} />
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase mb-2">Hall of Fame</h3>
            <p className="text-brand-light text-sm leading-relaxed mb-4">
              Daftar para juara dan legenda turnamen sebelumnya.
            </p>
          </Card>
        </button>
      </div>
      
      {/* Featured Footer Info */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-12 border-t border-white/5">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-vibrant/20 flex items-center justify-center">
                <Gamepad2 className="text-brand-vibrant" />
            </div>
            <div>
                <h4 className="font-black text-white italic uppercase">Pro Stats</h4>
                <p className="text-xs text-brand-light">Pelacakan formasi & hasil real-time</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-gradient-end/20 flex items-center justify-center">
                <Users className="text-brand-special" />
            </div>
            <div>
                <h4 className="font-black text-white italic uppercase">Verified Teams</h4>
                <p className="text-xs text-brand-light">Komunitas eFootball Terverifikasi</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-special/20 flex items-center justify-center">
                <Trophy className="text-brand-special" />
            </div>
            <div>
                <h4 className="font-black text-white italic uppercase">Elite Prizes</h4>
                <p className="text-xs text-brand-light">Kompetisi dengan hadiah menarik</p>
            </div>
        </div>
      </div>
    </div>
  );
};
