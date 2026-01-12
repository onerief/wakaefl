
import React from 'react';
import { Trophy, ListOrdered, ChevronRight, Gamepad2, Users, Star } from 'lucide-react';
import { Card } from '../shared/Card';

interface HomeDashboardProps {
  onSelectMode: (mode: 'league' | 'wakacl') => void;
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
            Pilih Format <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-vibrant via-brand-special to-brand-vibrant">Pertandingan</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* League Mode Card */}
        <button 
          onClick={() => onSelectMode('league')}
          className="group relative text-left"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-vibrant to-blue-800 rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
          <Card className="relative h-full !p-8 !rounded-[2rem] border-white/5 bg-brand-secondary/40 backdrop-blur-xl hover:border-brand-vibrant/50 transition-all">
            <div className="flex justify-between items-start mb-12">
              <div className="p-4 bg-brand-primary rounded-2xl border border-white/5 shadow-xl group-hover:scale-110 group-hover:bg-brand-vibrant/10 transition-all duration-500">
                <ListOrdered size={40} className="text-brand-vibrant" />
              </div>
              <ChevronRight className="text-brand-light group-hover:text-brand-vibrant transition-colors group-hover:translate-x-2 duration-500" size={32} />
            </div>
            <h3 className="text-3xl font-black text-white italic uppercase mb-2">Regular Liga</h3>
            <p className="text-brand-light leading-relaxed mb-6">
              Format klasemen tunggal. Semua tim bertanding satu sama lain dalam sistem Single atau Double Round Robin.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-brand-vibrant/10 rounded-full text-[10px] font-bold text-brand-vibrant uppercase tracking-wider border border-brand-vibrant/20">Points Based</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-brand-light uppercase tracking-wider">Top Table Winner</span>
            </div>
          </Card>
        </button>

        {/* WAKACL Mode Card */}
        <button 
          onClick={() => onSelectMode('wakacl')}
          className="group relative text-left"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-special to-brand-vibrant rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
          <Card className="relative h-full !p-8 !rounded-[2rem] border-white/5 bg-brand-secondary/40 backdrop-blur-xl hover:border-brand-special/50 transition-all">
            <div className="flex justify-between items-start mb-12">
              <div className="p-4 bg-brand-primary rounded-2xl border border-white/5 shadow-xl group-hover:scale-110 group-hover:bg-brand-special/10 transition-all duration-500">
                <Trophy size={40} className="text-brand-special" />
              </div>
              <ChevronRight className="text-brand-light group-hover:text-brand-special transition-colors group-hover:translate-x-2 duration-500" size={32} />
            </div>
            <h3 className="text-3xl font-black text-white italic uppercase mb-2">WAKACL Format</h3>
            <p className="text-brand-light leading-relaxed mb-6">
              Format turnamen elit. Group Stage yang diikuti oleh fase Knockout yang mendebarkan hingga ke Grand Final.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-brand-special/10 rounded-full text-[10px] font-bold text-brand-special uppercase tracking-wider border border-brand-special/20">Group Stage</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-brand-light uppercase tracking-wider">Knockout Stage</span>
            </div>
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
