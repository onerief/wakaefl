
import React from 'react';
import type { SeasonHistory, Team, TournamentMode, TournamentStatus } from '../../types';
import { Card } from '../shared/Card';
import { TeamLogo } from '../shared/TeamLogo';
import { Trophy, Crown, Medal, ArrowLeft, Globe, ListOrdered, Shield } from 'lucide-react';

interface HallOfFameProps {
  history: SeasonHistory[];
  currentStatus: TournamentStatus;
  mode: TournamentMode;
  currentLeader?: Team | null; 
  onBack: () => void;
}

const ModeBadge = ({ mode }: { mode?: TournamentMode }) => {
    switch (mode) {
        case 'league':
            return <span className="flex items-center gap-1 text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20"><ListOrdered size={10} /> Liga</span>;
        case 'two_leagues':
            return <span className="flex items-center gap-1 text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20"><Globe size={10} /> 2 Region</span>;
        case 'wakacl':
            return <span className="flex items-center gap-1 text-[9px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20"><Shield size={10} /> WAKACL</span>;
        default:
            return null;
    }
};

export const HallOfFame: React.FC<HallOfFameProps> = ({ history, currentStatus, mode, currentLeader, onBack }) => {
  const activeSeasonTitle = mode === 'league' ? 'Liga Reguler' : mode === 'wakacl' ? 'WAKACL' : 'Liga 2 Wilayah';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-yellow-900 to-brand-primary p-8 border border-yellow-500/20 shadow-2xl">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent"></div>
         <div className="relative z-10">
             <button onClick={onBack} className="flex items-center gap-2 text-brand-light hover:text-white mb-6 transition-colors group">
                 <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
             </button>
             <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-4">
                 <Trophy className="text-yellow-400 fill-yellow-400/20" size={64} />
                 Hall of Fame
             </h1>
             <p className="text-yellow-100/60 text-lg max-w-xl">
                 Menghormati para legenda dan juara abadi komunitas eFootball Way Kanan.
             </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent/Current Champion Spotlight */}
          <div className="lg:col-span-2">
              <Card className="!p-8 !bg-gradient-to-br from-brand-secondary to-black border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-yellow-500/10 blur-[100px] rounded-full"></div>
                  
                  <h2 className="text-2xl font-black text-yellow-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                      <Crown size={28} />
                      {history.length > 0 ? "Latest Champion" : "Current Season Leader"}
                  </h2>

                  {history.length > 0 ? (
                      // Display Global Last Champion
                      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                           <div className="relative">
                               <div className="absolute -inset-4 bg-yellow-500/20 blur-xl rounded-full animate-pulse-slow"></div>
                               <TeamLogo logoUrl={history[0].champion.logoUrl} teamName={history[0].champion.name} className="w-40 h-40 md:w-56 md:h-56 shadow-2xl relative z-10" />
                               <Crown size={48} className="absolute -top-6 -right-6 text-yellow-400 fill-yellow-400 drop-shadow-lg animate-bounce z-20" />
                           </div>
                           <div className="text-center md:text-left z-10">
                               <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                                   <span className="text-yellow-200/50 text-xl font-bold uppercase tracking-[0.2em]">{history[0].seasonName}</span>
                                   <ModeBadge mode={history[0].mode} />
                               </div>
                               <h3 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter my-2 drop-shadow-md">
                                   {history[0].champion.name}
                               </h3>
                               <p className="text-brand-light text-lg">Manager: <span className="text-white font-bold">{history[0].champion.manager || 'Unknown'}</span></p>
                           </div>
                      </div>
                  ) : currentLeader ? (
                      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                           <div className="relative">
                               <div className="absolute -inset-4 bg-brand-vibrant/20 blur-xl rounded-full"></div>
                               <TeamLogo logoUrl={currentLeader.logoUrl} teamName={currentLeader.name} className="w-40 h-40 md:w-56 md:h-56 shadow-2xl relative z-10" />
                           </div>
                           <div className="text-center md:text-left z-10">
                               <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                                   <span className="text-brand-vibrant text-xl font-bold uppercase tracking-[0.2em]">Live: {activeSeasonTitle}</span>
                               </div>
                               <h3 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter my-2">
                                   {currentLeader.name}
                               </h3>
                               <p className="text-brand-light text-lg">Current Leader / Finalist</p>
                           </div>
                      </div>
                  ) : (
                      <div className="text-center py-12 text-brand-light italic opacity-50">
                          Belum ada data juara atau pemimpin klasemen untuk ditampilkan.
                      </div>
                  )}
              </Card>
          </div>

          {/* Combined History List */}
          <div className="lg:col-span-2">
               <h3 className="text-2xl font-black text-white italic uppercase mb-6 pl-4 border-l-4 border-brand-vibrant">
                   All Seasons History
               </h3>
               
               {history.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {history.map((season) => (
                           <div key={season.seasonId} className="bg-brand-secondary/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                               <div className="flex items-center gap-4">
                                   <div className="flex flex-col items-center justify-center w-12 text-yellow-500">
                                       <Trophy size={24} />
                                       <span className="text-[10px] font-bold mt-1">WINNER</span>
                                   </div>
                                   <TeamLogo logoUrl={season.champion.logoUrl} teamName={season.champion.name} className="w-16 h-16" />
                                   <div>
                                       <h4 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">{season.champion.name}</h4>
                                       <div className="flex items-center gap-2 mt-1">
                                           <p className="text-[10px] text-brand-light uppercase">{season.seasonName}</p>
                                           <ModeBadge mode={season.mode} />
                                       </div>
                                   </div>
                               </div>
                               {season.runnerUp && (
                                   <div className="hidden sm:flex flex-col items-end opacity-50">
                                       <span className="text-[10px] uppercase font-bold text-brand-light mb-1">Runner Up</span>
                                       <div className="flex items-center gap-2">
                                           <span className="text-xs font-bold text-brand-text text-right truncate max-w-[100px]">{season.runnerUp.name}</span>
                                           <TeamLogo logoUrl={season.runnerUp.logoUrl} teamName={season.runnerUp.name} className="w-8 h-8 grayscale" />
                                       </div>
                                   </div>
                               )}
                           </div>
                       ))}
                   </div>
               ) : (
                   <div className="bg-brand-secondary/20 rounded-2xl p-8 text-center border border-white/5 border-dashed">
                       <p className="text-brand-light">Belum ada histori musim yang tersimpan.</p>
                   </div>
               )}
          </div>
      </div>
    </div>
  );
};
