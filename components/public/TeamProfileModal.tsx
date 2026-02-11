
import React, { useMemo } from 'react';
import type { Team, Match } from '../../types';
import { Card } from '../shared/Card';
import { X, UserCircle, Instagram, Smartphone, Zap, Star, Activity, Target, ShieldAlert, TrendingUp, Calendar, ImageIcon, Layout } from 'lucide-react';
import { TeamLogo } from '../shared/TeamLogo';

interface TeamProfileModalProps {
  team: Team;
  matches: Match[];
  onClose: () => void;
}

const StatBox = ({ label, value, colorClass = "text-brand-text", subLabel }: { label: string, value: string | number, colorClass?: string, subLabel?: string }) => (
    <div className="bg-white/5 border border-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center min-w-[60px] sm:min-w-[80px] flex-1 hover:bg-white/10 transition-colors">
        <span className={`text-base sm:text-lg font-black italic tracking-tighter ${colorClass}`}>{value}</span>
        <span className="text-[7px] sm:text-[8px] font-bold text-brand-light uppercase tracking-widest">{label}</span>
        {subLabel && <span className="text-[7px] text-brand-light/50 mt-0.5 sm:mt-1">{subLabel}</span>}
    </div>
);

export const TeamProfileModal: React.FC<TeamProfileModalProps> = ({ team, matches, onClose }) => {
  const whatsappLink = team.whatsappNumber ? `https://wa.me/${team.whatsappNumber.replace(/\D/g, '')}` : null;
  
  const teamMatches = useMemo(() => {
     return matches.filter(m => 
        (m.status === 'finished' || m.status === 'scheduled') && 
        (m.teamA.id === team.id || m.teamB.id === team.id)
     ).sort((a, b) => b.id.localeCompare(a.id)); // Newest first
  }, [matches, team.id]);

  const stats = useMemo(() => {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let gf = 0;
    let ga = 0;
    const form: ('W' | 'D' | 'L')[] = [];

    // Filter only finished matches for stats
    const finishedMatches = teamMatches.filter(m => m.status === 'finished');
    
    finishedMatches.forEach(m => {
        const isTeamA = m.teamA.id === team.id;
        const scoreSelf = isTeamA ? m.scoreA! : m.scoreB!;
        const scoreOpp = isTeamA ? m.scoreB! : m.scoreA!;
        
        gf += scoreSelf;
        ga += scoreOpp;

        if (scoreSelf > scoreOpp) {
            wins++;
            form.push('W');
        } else if (scoreSelf === scoreOpp) {
            draws++;
            form.push('D');
        } else {
            losses++;
            form.push('L');
        }
    });

    return {
        played: finishedMatches.length,
        wins,
        draws,
        losses,
        gf,
        ga,
        gd: gf - ga,
        form: form.slice(0, 5) // Last 5 matches (since we sorted desc)
    };
  }, [teamMatches, team.id]);

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md sm:max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 rounded-[1.5rem] sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Card Overlay Styling */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-vibrant via-brand-gradient-start to-brand-gradient-end rounded-[2rem] blur-xl opacity-20 pointer-events-none"></div>

        <Card className="!p-0 !bg-brand-primary !rounded-[1.5rem] sm:!rounded-[2rem] border-white/10 overflow-hidden shadow-2xl">
          {/* Header Banner Background */}
          <div className="relative h-24 sm:h-36 bg-gradient-to-br from-brand-secondary to-brand-primary overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#fff_1px,transparent_1px)] bg-[length:20px_20px]"></div>
             <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-brand-vibrant/20 blur-3xl rounded-full"></div>
             
             <button 
                onClick={onClose} 
                className="absolute top-3 right-3 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 text-brand-light hover:text-white hover:bg-black/60 flex items-center justify-center transition-all backdrop-blur-md border border-white/5"
             >
                <X size={16} sm:size={20} />
             </button>

             {team.isTopSeed && (
                 <div className="absolute top-3 left-3 z-20 flex items-center gap-1 px-2 py-0.5 bg-brand-special/20 border border-brand-special/30 rounded-full backdrop-blur-md">
                     <Star size={10} className="text-brand-special fill-brand-special" />
                     <span className="text-[8px] font-black text-brand-special uppercase tracking-widest">Top Seed</span>
                 </div>
             )}
          </div>

          {/* Profile Details Container */}
          <div className="relative px-4 sm:px-8 pb-6 sm:pb-8 -mt-12 sm:-mt-16 flex flex-col items-center">
            
            {/* Logo with Animated Ring */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-brand-vibrant to-brand-gradient-end rounded-full blur group-hover:opacity-100 opacity-75 transition-opacity"></div>
                <div className="relative p-1 bg-brand-primary rounded-full">
                    <TeamLogo 
                        logoUrl={team.logoUrl} 
                        teamName={team.name} 
                        className="w-24 h-24 sm:w-36 sm:h-36 shadow-2xl" 
                    />
                </div>
            </div>

            <div className="text-center mt-3 mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-md">
                    {team.name}
                </h2>
                {team.assignedGroup && (
                    <span className="text-[8px] sm:text-[10px] font-bold text-brand-vibrant uppercase tracking-[0.3em] block mt-0.5">
                        Group {team.assignedGroup} Member
                    </span>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="w-full flex gap-1.5 sm:gap-2 mb-2">
                <StatBox label="Played" value={stats.played} />
                <StatBox label="Won" value={stats.wins} colorClass="text-cyan-400" />
                <StatBox label="Drawn" value={stats.draws} colorClass="text-brand-light" />
                <StatBox label="Lost" value={stats.losses} colorClass="text-red-400" />
            </div>

            {/* Goal Stats Grid */}
             <div className="w-full grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                 <div className="bg-white/5 border border-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col items-center hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-1 mb-0.5 opacity-70">
                         <Target size={8} sm:size={10} className="text-green-400" />
                        <span className="text-[7px] sm:text-[8px] font-bold text-brand-light uppercase tracking-widest">Goals For</span>
                    </div>
                    <span className="text-base sm:text-lg font-black text-white">{stats.gf}</span>
                 </div>
                 <div className="bg-white/5 border border-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col items-center hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-1 mb-0.5 opacity-70">
                         <ShieldAlert size={8} sm:size={10} className="text-red-400" />
                        <span className="text-[7px] sm:text-[8px] font-bold text-brand-light uppercase tracking-widest">Goals Agst</span>
                    </div>
                    <span className="text-base sm:text-lg font-black text-white">{stats.ga}</span>
                 </div>
                 <div className="bg-white/5 border border-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col items-center hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-1 mb-0.5 opacity-70">
                         <TrendingUp size={8} sm:size={10} className="text-brand-vibrant" />
                        <span className="text-[7px] sm:text-[8px] font-bold text-brand-light uppercase tracking-widest">Goal Diff</span>
                    </div>
                    <span className={`text-base sm:text-lg font-black ${stats.gd > 0 ? "text-green-400" : stats.gd < 0 ? "text-red-400" : "text-white"}`}>
                        {stats.gd > 0 ? '+' : ''}{stats.gd}
                    </span>
                 </div>
            </div>

            {/* Squad Photo Display */}
            {team.squadPhotoUrl && (
                <div className="w-full mb-4 sm:mb-6">
                    <h4 className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-brand-light uppercase tracking-widest mb-3">
                        <Layout size={12} sm:size={14} className="text-brand-special" /> Squad & Formation
                    </h4>
                    <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-2xl group/squad cursor-zoom-in">
                        <img 
                            src={team.squadPhotoUrl} 
                            alt={`${team.name} Squad`} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/squad:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/squad:opacity-100 transition-opacity flex items-end p-2 sm:p-4">
                            <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-[0.2em]">{team.name} Official Squad</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Section */}
            <div className="w-full mb-4 sm:mb-6 bg-black/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2">
                        <Activity size={12} sm:size={14} className="text-brand-vibrant" />
                        <span className="text-[8px] sm:text-[10px] font-black text-brand-light uppercase tracking-widest">Recent Form</span>
                    </div>
                    <div className="flex gap-1">
                        {stats.form.length > 0 ? stats.form.map((res, i) => (
                            <div 
                                key={i} 
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-[8px] sm:text-[10px] font-black text-white ${
                                    res === 'W' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' :
                                    res === 'D' ? 'bg-gray-500' :
                                    'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                                }`}
                                title={res === 'W' ? 'Win' : res === 'D' ? 'Draw' : 'Loss'}
                            >
                                {res}
                            </div>
                        )) : (
                            <span className="text-[8px] sm:text-[10px] text-brand-light/40 italic">No matches</span>
                        )}
                    </div>
                </div>
                
                 <div className="flex items-center justify-between border-t border-white/5 pt-2 sm:pt-3 mt-2 sm:mt-3">
                     <span className="text-[8px] sm:text-[10px] font-bold text-brand-light uppercase tracking-widest opacity-50">Manager</span>
                     <div className="flex items-center gap-1.5">
                        <UserCircle size={12} sm:size={14} className="text-brand-vibrant" />
                        <span className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[150px]">{team.manager || 'N/A'}</span>
                     </div>
                 </div>
            </div>

            {/* MATCH HISTORY */}
            <div className="w-full mb-4 sm:mb-6">
                <h4 className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-brand-light uppercase tracking-widest mb-3">
                    <Calendar size={12} sm:size={14} /> Match History
                </h4>
                <div className="space-y-1.5 sm:space-y-2">
                    {teamMatches.length > 0 ? (
                        teamMatches.slice(0, 5).map(match => {
                            const isTeamA = match.teamA.id === team.id;
                            const opponent = isTeamA ? match.teamB : match.teamA;
                            const scoreSelf = isTeamA ? match.scoreA : match.scoreB;
                            const scoreOpp = isTeamA ? match.scoreB : match.scoreA;
                            const isWin = scoreSelf !== null && scoreOpp !== null && scoreSelf > scoreOpp;
                            const isDraw = scoreSelf !== null && scoreOpp !== null && scoreSelf === scoreOpp;
                            
                            return (
                                <div key={match.id} className="flex items-center justify-between bg-white/5 p-2 sm:p-2.5 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2">
                                         <div className={`w-0.5 h-6 rounded-full ${
                                             match.status !== 'finished' ? 'bg-brand-light/30' :
                                             isWin ? 'bg-green-500' : isDraw ? 'bg-gray-500' : 'bg-red-500'
                                         }`}></div>
                                         <div className="flex flex-col">
                                             <span className="text-[7px] sm:text-[8px] text-brand-light uppercase">vs</span>
                                             <span className="text-[9px] sm:text-xs font-bold text-white truncate max-w-[100px] sm:max-w-[120px]">{opponent.name}</span>
                                         </div>
                                    </div>
                                    {match.status === 'finished' ? (
                                        <div className="flex items-center gap-1.5 sm:gap-2 font-mono font-bold text-[10px] sm:text-xs">
                                            <span className={scoreSelf! > scoreOpp! ? 'text-green-400' : ''}>{scoreSelf}</span>
                                            <span className="text-brand-light/50">-</span>
                                            <span className={scoreOpp! > scoreSelf! ? 'text-green-400' : ''}>{scoreOpp}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[7px] sm:text-[9px] bg-brand-light/10 text-brand-light px-1.5 py-0.5 rounded">Scheduled</span>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                         <div className="text-center py-3 bg-white/5 rounded-lg border border-dashed border-white/10 text-[9px] sm:text-xs text-brand-light italic">
                             No matches found.
                         </div>
                    )}
                </div>
            </div>

            {/* Social Actions */}
            <div className="w-full flex flex-col gap-2 sm:gap-3">
                {whatsappLink && (
                    <a 
                        href={whatsappLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="group flex items-center justify-between w-full p-3 sm:p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl sm:rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Smartphone className="text-green-500" size={16} sm:size={20} />
                            <span className="text-[10px] sm:text-xs font-bold text-green-400">Hubungi Manager</span>
                        </div>
                        <Zap size={12} sm:size={14} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                )}
                {team.socialMediaUrl && (
                    <a 
                        href={team.socialMediaUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="group flex items-center justify-between w-full p-3 sm:p-4 bg-brand-vibrant/10 hover:bg-brand-vibrant/20 border border-brand-vibrant/20 rounded-xl sm:rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Instagram className="text-brand-vibrant" size={16} sm:size={20} />
                            <span className="text-[10px] sm:text-xs font-bold text-brand-vibrant">Official Instagram</span>
                        </div>
                        <Zap size={12} sm:size={14} className="text-brand-vibrant opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
