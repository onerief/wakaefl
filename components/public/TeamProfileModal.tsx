
import React, { useMemo } from 'react';
import type { Team, Match } from '../../types';
import { Card } from '../shared/Card';
import { X, UserCircle, Instagram, Smartphone, Zap, Star, Activity, Target, ShieldAlert, TrendingUp } from 'lucide-react';
import { TeamLogo } from '../shared/TeamLogo';

interface TeamProfileModalProps {
  team: Team;
  matches: Match[];
  onClose: () => void;
}

const StatBox = ({ label, value, colorClass = "text-brand-text", subLabel }: { label: string, value: string | number, colorClass?: string, subLabel?: string }) => (
    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center min-w-[70px] flex-1 hover:bg-white/10 transition-colors">
        <span className={`text-xl font-black italic tracking-tighter ${colorClass}`}>{value}</span>
        <span className="text-[9px] font-bold text-brand-light uppercase tracking-widest">{label}</span>
        {subLabel && <span className="text-[8px] text-brand-light/50 mt-1">{subLabel}</span>}
    </div>
);

export const TeamProfileModal: React.FC<TeamProfileModalProps> = ({ team, matches, onClose }) => {
  const whatsappLink = team.whatsappNumber ? `https://wa.me/${team.whatsappNumber.replace(/\D/g, '')}` : null;
  
  const stats = useMemo(() => {
    // Filter for group matches involving this team
    const teamMatches = matches.filter(m => 
        m.status === 'finished' && (m.teamA.id === team.id || m.teamB.id === team.id)
    );

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let gf = 0;
    let ga = 0;
    const form: ('W' | 'D' | 'L')[] = [];

    // Sort matches by ID (as proxy for date) to determine form
    teamMatches.sort((a, b) => {
        return a.id.localeCompare(b.id);
    }).forEach(m => {
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
        played: teamMatches.length,
        wins,
        draws,
        losses,
        gf,
        ga,
        gd: gf - ga,
        form: form.slice(-5) // Last 5 matches
    };
  }, [matches, team.id]);

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Card Overlay Styling */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-vibrant via-brand-gradient-start to-brand-gradient-end rounded-[2rem] blur-xl opacity-20 pointer-events-none"></div>

        <Card className="!p-0 !bg-brand-primary !rounded-[2rem] border-white/10 overflow-hidden shadow-2xl">
          {/* Header Banner Background */}
          <div className="relative h-32 bg-gradient-to-br from-brand-secondary to-brand-primary overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#fff_1px,transparent_1px)] bg-[length:20px_20px]"></div>
             <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-brand-vibrant/20 blur-3xl rounded-full"></div>
             
             <button 
                onClick={onClose} 
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 text-brand-light hover:text-white hover:bg-black/60 flex items-center justify-center transition-all backdrop-blur-md border border-white/5"
             >
                <X size={20} />
             </button>

             {team.isTopSeed && (
                 <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-brand-special/20 border border-brand-special/30 rounded-full backdrop-blur-md">
                     <Star size={12} className="text-brand-special fill-brand-special" />
                     <span className="text-[10px] font-black text-brand-special uppercase tracking-widest">Top Seed</span>
                 </div>
             )}
          </div>

          {/* Profile Details Container */}
          <div className="relative px-6 pb-8 -mt-16 flex flex-col items-center">
            
            {/* Logo with Animated Ring */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-brand-vibrant to-brand-gradient-end rounded-full blur group-hover:opacity-100 opacity-75 transition-opacity"></div>
                <div className="relative p-1 bg-brand-primary rounded-full">
                    <TeamLogo 
                        logoUrl={team.logoUrl} 
                        teamName={team.name} 
                        className="w-28 h-28 sm:w-32 sm:h-32 shadow-2xl" 
                    />
                </div>
            </div>

            <div className="text-center mt-4 mb-6">
                <h2 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-md">
                    {team.name}
                </h2>
                {team.assignedGroup && (
                    <span className="text-xs font-bold text-brand-vibrant uppercase tracking-[0.3em] block mt-1">
                        Group {team.assignedGroup} Member
                    </span>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="w-full flex gap-2 mb-2">
                <StatBox label="Played" value={stats.played} />
                <StatBox label="Won" value={stats.wins} colorClass="text-cyan-400" />
                <StatBox label="Drawn" value={stats.draws} colorClass="text-brand-light" />
                <StatBox label="Lost" value={stats.losses} colorClass="text-red-400" />
            </div>

            {/* Goal Stats Grid */}
             <div className="w-full grid grid-cols-3 gap-2 mb-6">
                 <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col items-center hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-1 mb-1 opacity-70">
                         <Target size={10} className="text-green-400" />
                        <span className="text-[9px] font-bold text-brand-light uppercase tracking-widest">Goals For</span>
                    </div>
                    <span className="text-lg font-black text-white">{stats.gf}</span>
                 </div>
                 <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col items-center hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-1 mb-1 opacity-70">
                         <ShieldAlert size={10} className="text-red-400" />
                        <span className="text-[9px] font-bold text-brand-light uppercase tracking-widest">Goals Agst</span>
                    </div>
                    <span className="text-lg font-black text-white">{stats.ga}</span>
                 </div>
                 <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col items-center hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-1 mb-1 opacity-70">
                         <TrendingUp size={10} className="text-brand-vibrant" />
                        <span className="text-[9px] font-bold text-brand-light uppercase tracking-widest">Goal Diff</span>
                    </div>
                    <span className={`text-lg font-black ${stats.gd > 0 ? "text-green-400" : stats.gd < 0 ? "text-red-400" : "text-white"}`}>
                        {stats.gd > 0 ? '+' : ''}{stats.gd}
                    </span>
                 </div>
            </div>

            {/* Form Section */}
            <div className="w-full mb-6 bg-black/20 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-brand-vibrant" />
                        <span className="text-[10px] font-black text-brand-light uppercase tracking-widest">Recent Form</span>
                    </div>
                    <div className="flex gap-1">
                        {stats.form.length > 0 ? stats.form.map((res, i) => (
                            <div 
                                key={i} 
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white ${
                                    res === 'W' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' :
                                    res === 'D' ? 'bg-gray-500' :
                                    'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                                }`}
                                title={res === 'W' ? 'Win' : res === 'D' ? 'Draw' : 'Loss'}
                            >
                                {res}
                            </div>
                        )) : (
                            <span className="text-[10px] text-brand-light/40 italic">No matches yet</span>
                        )}
                    </div>
                </div>
                
                 <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                     <span className="text-[10px] font-bold text-brand-light uppercase tracking-widest opacity-50">Team Manager</span>
                     <div className="flex items-center gap-2">
                        <UserCircle size={14} className="text-brand-vibrant" />
                        <span className="text-sm font-bold text-white truncate max-w-[150px]">{team.manager || 'N/A'}</span>
                     </div>
                 </div>
            </div>

            {/* Social Actions */}
            <div className="w-full flex flex-col gap-3">
                {whatsappLink && (
                    <a 
                        href={whatsappLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="group flex items-center justify-between w-full p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <Smartphone className="text-green-500" size={20} />
                            <span className="text-sm font-bold text-green-400">Hubungi Manager</span>
                        </div>
                        <Zap size={14} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                )}
                {team.socialMediaUrl && (
                    <a 
                        href={team.socialMediaUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="group flex items-center justify-between w-full p-4 bg-brand-vibrant/10 hover:bg-brand-vibrant/20 border border-brand-vibrant/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <Instagram className="text-brand-vibrant" size={20} />
                            <span className="text-sm font-bold text-brand-vibrant">Official Instagram</span>
                        </div>
                        <Zap size={14} className="text-brand-vibrant opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
