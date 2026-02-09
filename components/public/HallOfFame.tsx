
import React from 'react';
import type { SeasonHistory, Team, TournamentMode, TournamentStatus } from '../../types';
import { Card } from '../shared/Card';
import { TeamLogo } from '../shared/TeamLogo';
import { Trophy, Crown, Medal, ArrowLeft, Globe, ListOrdered, Shield, Star } from 'lucide-react';

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-yellow-900 to-brand-primary p-6 sm:p-10 border border-yellow-500/20 shadow-2xl">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent"></div>
         <div className="relative z-10">
             <button onClick={onBack} className="flex items-center gap-2 text-brand-light hover:text-white mb-6 transition-colors group text-sm font-bold uppercase tracking-widest">
                 <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
             </button>
             <h1 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-4">
                 <Trophy className="text-yellow-400 fill-yellow-400/20" size={64} />
                 Hall of Fame
             </h1>
             <p className="text-yellow-100/60 text-base sm:text-lg max-w-xl font-medium">
                 Menghormati para legenda dan juara abadi komunitas eFootball Way Kanan.
             </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent/Current Champion Spotlight */}
          <div className="lg:col-span-2">
              <Card className="!p-6 sm:!p-10 !bg-gradient-to-br from-brand-secondary to-black border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-yellow-500/10 blur-[100px] rounded-full"></div>
                  
                  <h2 className="text-xl sm:text-2xl font-black text-yellow-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                      <Crown size={28} />
                      {history.length > 0 ? "Latest Season Glory" : "Current Season Leader"}
                  </h2>

                  {history.length > 0 ? (
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
                           {/* Champion Hero */}
                           <div className="flex flex-col items-center gap-4">
                               <div className="relative">
                                   <div className="absolute -inset-4 bg-yellow-500/20 blur-xl rounded-full animate-pulse-slow"></div>
                                   <TeamLogo logoUrl={history[0].champion.logoUrl} teamName={history[0].champion.name} className="w-32 h-32 md:w-56 md:h-56 shadow-2xl relative z-10" />
                                   <Crown size={48} className="absolute -top-6 -right-6 text-yellow-400 fill-yellow-400 drop-shadow-lg animate-bounce z-20 md:w-14 md:h-14" />
                               </div>
                               <div className="text-center">
                                    <div className="inline-block px-4 py-1 bg-yellow-500 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">Champion</div>
                                    <h3 className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter uppercase mb-1">{history[0].champion.name}</h3>
                                    <p className="text-brand-light text-xs font-bold uppercase opacity-60">Manager: {history[0].champion.manager || 'N/A'}</p>
                               </div>
                           </div>

                           <div className="hidden md:block w-px h-64 bg-white/10 self-center"></div>

                           {/* Details & Runner Up Spotlight */}
                           <div className="flex-grow flex flex-col justify-center space-y-6 w-full md:w-auto">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-yellow-200/50 text-base sm:text-xl font-bold uppercase tracking-[0.2em]">{history[0].seasonName}</span>
                                        <ModeBadge mode={history[0].mode} />
                                    </div>
                                    <p className="text-brand-light text-xs sm:text-sm italic max-w-sm">"Mengukir sejarah sebagai penguasa tertinggi di musim ini dengan performa yang tak terbendung."</p>
                                </div>

                                {history[0].runnerUp && (
                                    <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-right duration-700 w-full md:max-w-xs shadow-xl">
                                        <div className="relative shrink-0">
                                            <TeamLogo logoUrl={history[0].runnerUp.logoUrl} teamName={history[0].runnerUp.name} className="w-12 h-12 sm:w-16 sm:h-16 grayscale opacity-70" />
                                            <div className="absolute -bottom-1 -right-1 bg-brand-light rounded-full p-0.5 shadow-lg">
                                                <Star size={10} className="text-brand-primary fill-brand-primary" />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black text-brand-light/60 uppercase tracking-[0.2em] mb-0.5">Finalist / Runner Up</p>
                                            <h4 className="text-sm sm:text-base font-black text-white italic uppercase truncate">{history[0].runnerUp.name}</h4>
                                            <p className="text-[9px] text-brand-light font-bold mt-0.5 opacity-60 truncate">Mgr: {history[0].runnerUp.manager || 'N/A'}</p>
                                        </div>
                                    </div>
                                )}
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
               <h3 className="text-2xl font-black text-white italic uppercase mb-6 pl-4 border-l-4 border-brand-vibrant flex items-center gap-3">
                   <ListOrdered className="text-brand-vibrant" />
                   All Seasons History
               </h3>
               
               {history.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {history.map((season) => (
                           <div key={season.seasonId} className="bg-brand-secondary/40 border border-white/5 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/5 transition-all duration-300 group gap-4 relative overflow-hidden">
                               <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                   <div className="flex flex-col items-center justify-center w-8 sm:w-12 text-yellow-500 shrink-0">
                                       <Trophy size={18} className="sm:size-24" />
                                       <span className="text-[7px] sm:text-[10px] font-black mt-1 uppercase tracking-tighter">WINNER</span>
                                   </div>
                                   <TeamLogo logoUrl={season.champion.logoUrl} teamName={season.champion.name} className="w-12 h-12 sm:w-16 sm:h-16 shadow-xl shrink-0" />
                                   <div className="min-w-0">
                                       <h4 className="text-sm sm:text-lg font-black text-white group-hover:text-yellow-400 transition-colors truncate italic uppercase">{season.champion.name}</h4>
                                       <div className="flex flex-wrap items-center gap-2 mt-1">
                                           <p className="text-[8px] sm:text-[9px] text-brand-light font-black uppercase tracking-wider">{season.seasonName}</p>
                                           <ModeBadge mode={season.mode} />
                                       </div>
                                   </div>
                               </div>

                               {season.runnerUp && (
                                   <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 px-3 py-2 sm:p-0 bg-black/30 sm:bg-transparent rounded-2xl sm:rounded-none border border-white/5 sm:border-none shrink-0">
                                       <div className="flex flex-col sm:items-end min-w-0">
                                           <span className="text-[7px] sm:text-[8px] uppercase font-black text-brand-light/40 tracking-[0.2em]">Runner Up</span>
                                           <span className="text-[10px] sm:text-xs font-bold text-brand-text truncate max-w-[100px] sm:max-w-[120px] uppercase italic">{season.runnerUp.name}</span>
                                       </div>
                                       <TeamLogo logoUrl={season.runnerUp.logoUrl} teamName={season.runnerUp.name} className="w-7 h-7 sm:w-8 sm:h-8 grayscale opacity-50 border border-white/5 shrink-0" />
                                   </div>
                               )}
                               
                               {/* Subtle decorative background icon */}
                               <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                                   <Trophy size={100} />
                               </div>
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
