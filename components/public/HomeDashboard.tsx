
import React, { useMemo } from 'react';
import { Trophy, ListOrdered, ChevronRight, Gamepad2, Users, Star, Crown, Globe, PlusCircle, Calendar, ArrowRight } from 'lucide-react';
import { Card } from '../shared/Card';
import { TournamentMode, Team, Match } from '../../types';
import { BannerCarousel } from './BannerCarousel';
import { TeamLogo } from '../shared/TeamLogo';

interface HomeDashboardProps {
  onSelectMode: (mode: TournamentMode | 'hall_of_fame') => void;
  teamCount: number;
  partnerCount: number;
  banners?: string[];
  onRegisterTeam?: () => void;
  isRegistrationOpen?: boolean;
  userOwnedTeams?: { mode: TournamentMode, team: Team }[];
  allMatches?: Match[];
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
    onSelectMode, 
    teamCount, 
    partnerCount, 
    banners, 
    onRegisterTeam, 
    isRegistrationOpen = true,
    userOwnedTeams = [],
    allMatches = []
}) => {
  
  // Spotlight logic: Find the very next upcoming match for any of the user's teams
  const nextMatchInfo = useMemo(() => {
    if (userOwnedTeams.length === 0 || allMatches.length === 0) return null;
    
    const userTeamIds = userOwnedTeams.map(t => t.team.id);
    const upcoming = allMatches.filter(m => 
        m.status === 'scheduled' && 
        (userTeamIds.includes(m.teamA.id) || userTeamIds.includes(m.teamB.id))
    ).sort((a, b) => {
        // Sort by matchday/leg logic if available
        const dayA = a.matchday || 1;
        const dayB = b.matchday || 1;
        return dayA - dayB;
    });

    if (upcoming.length === 0) return null;

    const match = upcoming[0];
    const userTeamMode = userOwnedTeams.find(ut => 
        ut.team.id === match.teamA.id || ut.team.id === match.teamB.id
    )?.mode;

    return { match, mode: userTeamMode };
  }, [userOwnedTeams, allMatches]);

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

      {/* INTELLIGENT SPOTLIGHT: Next Match */}
      {nextMatchInfo && (
          <div className="animate-in slide-in-from-left duration-700">
              <h3 className="text-xs font-black text-brand-light uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-1">
                  <Calendar size={14} className="text-brand-vibrant" /> Jadwal Terdekat Anda
              </h3>
              <Card 
                onClick={() => onSelectMode(nextMatchInfo.mode!)}
                className="!p-0 overflow-hidden !bg-gradient-to-r from-brand-vibrant/20 to-transparent border-brand-vibrant/30 group cursor-pointer"
              >
                  <div className="flex flex-col md:flex-row md:items-center">
                      <div className="bg-brand-vibrant p-4 md:p-8 flex flex-col items-center justify-center text-white shrink-0">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Matchday</span>
                          <span className="text-3xl font-black italic">{nextMatchInfo.match.matchday || 1}</span>
                      </div>
                      
                      <div className="p-4 md:p-6 flex-grow flex items-center justify-center gap-4 md:gap-12">
                          <div className="flex flex-col items-center gap-2 text-center flex-1">
                              <TeamLogo logoUrl={nextMatchInfo.match.teamA.logoUrl} teamName={nextMatchInfo.match.teamA.name} className="w-12 h-12 md:w-16 md:h-16" />
                              <span className="text-[10px] md:text-xs font-black text-white uppercase">{nextMatchInfo.match.teamA.name}</span>
                          </div>
                          
                          <div className="flex flex-col items-center">
                              <span className="text-[10px] font-black text-brand-vibrant uppercase italic mb-1">VS</span>
                              <div className="w-8 h-px bg-white/10"></div>
                          </div>

                          <div className="flex flex-col items-center gap-2 text-center flex-1">
                              <TeamLogo logoUrl={nextMatchInfo.match.teamB.logoUrl} teamName={nextMatchInfo.match.teamB.name} className="w-12 h-12 md:w-16 md:h-16" />
                              <span className="text-[10px] md:text-xs font-black text-white uppercase">{nextMatchInfo.match.teamB.name}</span>
                          </div>
                      </div>

                      <div className="px-6 py-4 md:py-0 border-t md:border-t-0 md:border-l border-white/5 flex items-center justify-between md:justify-center gap-4">
                          <div className="flex flex-col md:items-center">
                                <span className="text-[8px] font-bold text-brand-light uppercase tracking-widest">Kompetisi</span>
                                <span className="text-xs font-black text-white uppercase">{nextMatchInfo.mode === 'league' ? 'Liga Reguler' : nextMatchInfo.mode === 'wakacl' ? 'WAKACL' : '2 Wilayah'}</span>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-brand-vibrant group-hover:bg-brand-vibrant group-hover:text-white transition-all">
                              <ArrowRight size={20} />
                          </div>
                      </div>
                  </div>
              </Card>
          </div>
      )}

      {/* Mode Selection Row */}
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
