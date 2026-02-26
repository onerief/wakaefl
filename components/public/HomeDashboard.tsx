
import React, { useMemo, useState, useEffect } from 'react';
import { PlusCircle, Calendar, ArrowRight, Newspaper, Clock, Zap, Star, Trophy, ChevronLeft, ChevronRight, Globe, LayoutGrid, Shield, Users, ShoppingBag, Timer } from 'lucide-react';
import { Card } from '../shared/Card';
import { TournamentMode, Team, Match, NewsItem, ScheduleSettings } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';
import { AutoTimer } from './AutoTimer';
import { HeroPattern, EmptyNewsIllustration, LeagueIcon, RegionIcon, ChampionshipIcon } from '../shared/Icons';

interface HomeDashboardProps {
  onSelectMode: (mode: TournamentMode | 'hall_of_fame' | 'news' | 'shop') => void;
  teamCount: number;
  partnerCount: number;
  onRegisterTeam?: () => void;
  isRegistrationOpen?: boolean;
  userOwnedTeams?: { mode: TournamentMode, team: Team }[];
  allMatches?: Match[];
  news?: NewsItem[];
  visibleModes?: TournamentMode[];
  scheduleSettings?: ScheduleSettings;
  isAdmin?: boolean;
  onResetCycleChange?: (cycle: 24 | 48) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
    onSelectMode, 
    teamCount, 
    partnerCount, 
    onRegisterTeam, 
    isRegistrationOpen = true,
    userOwnedTeams = [],
    allMatches = [],
    news = [],
    visibleModes = ['league', 'wakacl', 'two_leagues'],
    scheduleSettings,
    isAdmin = false,
    onResetCycleChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const latestNews = useMemo(() => {
      return [...news].sort((a, b) => b.date - a.date).slice(0, 5);
  }, [news]);

  useEffect(() => {
    if (latestNews.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % latestNews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [latestNews.length, isPaused]);

  // Timer Logic
  useEffect(() => {
      if (!scheduleSettings || !scheduleSettings.isActive || !scheduleSettings.matchdayStartTime) {
          setTimeLeft('');
          return;
      }

      const interval = setInterval(() => {
          const deadline = scheduleSettings.matchdayStartTime! + (scheduleSettings.matchdayDurationHours * 3600000);
          const now = Date.now();
          const diff = deadline - now;

          if (diff <= 0) {
              setTimeLeft('00:00:00');
          } else {
              const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
              const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
              const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
              setTimeLeft(`${hours}:${minutes}:${seconds}`);
          }
      }, 1000);

      return () => clearInterval(interval);
  }, [scheduleSettings]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % latestNews.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + latestNews.length) % latestNews.length);

  const nextMatchInfo = useMemo(() => {
    if (userOwnedTeams.length === 0 || allMatches.length === 0) return null;
    const userTeamIds = userOwnedTeams.map(t => t.team.id);
    
    // Filter matches
    const upcoming = allMatches.filter(m => {
        const isMyMatch = userTeamIds.includes(m.teamA.id) || userTeamIds.includes(m.teamB.id);
        const isPending = m.status === 'scheduled' || m.status === 'live';

        // STRICTER FILTER:
        // Only show matches that belong to the currently active Matchday defined by Admin.
        // This prevents showing MD3 if the admin is still focused on MD2, even if the user finished their MD2 game.
        let isAllowedBySchedule = true;
        if (scheduleSettings && scheduleSettings.currentMatchday) {
            isAllowedBySchedule = (m.matchday || 1) <= scheduleSettings.currentMatchday;
        }

        return isMyMatch && isPending && isAllowedBySchedule;
    }).sort((a, b) => {
        // Sort by Matchday first
        const dayDiff = (a.matchday || 1) - (b.matchday || 1);
        if (dayDiff !== 0) return dayDiff;
        // Then by ID as fallback
        return a.id.localeCompare(b.id);
    });

    if (upcoming.length === 0) return null;
    
    const match = upcoming[0];
    const userTeamMode = userOwnedTeams.find(ut => ut.team.id === match.teamA.id || ut.team.id === match.teamB.id)?.mode;
    
    if (userTeamMode && !visibleModes.includes(userTeamMode)) return null;
    
    return { match, mode: userTeamMode };
  }, [userOwnedTeams, allMatches, visibleModes, scheduleSettings]);

  const CompetitionCard = ({ mode, title, desc, icon: Icon, colorClass, bgClass }: any) => {
    if (!visibleModes.includes(mode)) return null;
    return (
        <button 
            onClick={() => onSelectMode(mode)}
            className={`group relative overflow-hidden rounded-[2rem] p-6 text-left transition-all duration-500 hover:-translate-y-2 border border-white/5 active:scale-95 flex flex-col h-full ${bgClass}`}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>
            <div className="mb-4 flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${colorClass} shadow-xl`}>
                    <Icon size={28} className="text-white" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                    <ArrowRight size={20} className="text-white/40" />
                </div>
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter mb-2 group-hover:text-brand-special transition-colors">{title}</h4>
            <p className="text-xs text-white/50 font-medium leading-relaxed mb-6">{desc}</p>
            <div className="mt-auto flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80 py-1.5 px-4 bg-black/40 rounded-full border border-white/10 group-hover:bg-brand-vibrant group-hover:border-brand-vibrant transition-all">
                    Masuk Arena
                </span>
            </div>
        </button>
    );
  };

  return (
    <div className="space-y-10 md:space-y-20 py-2 md:py-4 animate-in fade-in duration-700 relative z-10 pb-20">
      <div className="absolute inset-0 z-[-1] opacity-20 pointer-events-none">
        <HeroPattern />
      </div>

      {/* QUICK STATS BAR - Moved Above News Slideshow */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8 px-2 sm:px-0">
          {[
              { label: 'Total Peserta', val: teamCount, icon: Users, color: 'text-blue-400' },
              { label: 'Official Sponsors', val: partnerCount, icon: Star, color: 'text-yellow-400' },
              { label: 'Mode Kompetisi', val: visibleModes.length, icon: Trophy, color: 'text-purple-400' },
              { label: 'Status Server', val: 'Online', icon: Zap, color: 'text-green-400' }
          ].map((stat, i) => (
              <div key={i} className="bg-brand-secondary/40 border border-white/5 p-3 sm:p-5 rounded-2xl sm:rounded-[1.5rem] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-4 hover:border-white/10 transition-all">
                  <div className={`p-2 sm:p-3 rounded-xl bg-white/5 ${stat.color}`}><stat.icon size={16} className="sm:w-5 sm:h-5" /></div>
                  <div>
                      <p className="text-xl sm:text-2xl font-black text-white italic leading-none">{stat.val}</p>
                      <p className="text-[8px] sm:text-[10px] font-bold text-brand-light uppercase tracking-widest opacity-50 mt-1">{stat.label}</p>
                  </div>
              </div>
          ))}
      </div>

      {/* INTELLIGENT SPOTLIGHT: Next Match (Moved Up) */}
      {nextMatchInfo && (
          <div className="animate-in slide-in-from-left duration-700 px-2 sm:px-0">
              <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-brand-light uppercase tracking-[0.2em] sm:tracking-[0.3em] flex items-center gap-1.5 sm:gap-2">
                      <Calendar size={12} className="sm:w-3.5 sm:h-3.5 text-brand-vibrant" /> Jadwal Terdekat Tim Anda
                  </h3>
                  {timeLeft && (
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full animate-pulse">
                          <Timer size={10} className="sm:w-3 sm:h-3 text-red-500" />
                          <span className="text-[9px] sm:text-[10px] font-black text-red-500 font-mono tracking-widest">{timeLeft}</span>
                      </div>
                  )}
              </div>
              <Card onClick={() => onSelectMode(nextMatchInfo.mode!)} className="!p-0 overflow-hidden !bg-black/60 border-brand-vibrant/30 group cursor-pointer hover:border-brand-vibrant transition-all rounded-2xl sm:rounded-[1.5rem]">
                  <div className="flex flex-col md:flex-row md:items-center">
                      <div className="bg-brand-vibrant p-3 sm:p-10 flex flex-row md:flex-col items-center justify-between md:justify-center text-white shrink-0 shadow-2xl">
                          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-80">Matchday</span>
                          <span className="text-2xl sm:text-5xl font-black italic leading-none">{nextMatchInfo.match.matchday || 1}</span>
                      </div>
                      <div className="p-4 sm:p-6 md:p-12 flex-grow flex items-center justify-center gap-4 sm:gap-8 md:gap-24">
                          <div className="flex flex-col items-center gap-2 sm:gap-3 text-center flex-1">
                              <TeamLogo logoUrl={nextMatchInfo.match.teamA.logoUrl} teamName={nextMatchInfo.match.teamA.name} className="w-12 h-12 sm:w-16 sm:h-16 md:w-28 md:h-28 shadow-2xl ring-2 sm:ring-4 ring-white/5" />
                              <span className="text-[10px] sm:text-xs md:text-xl font-black text-white uppercase italic tracking-tight line-clamp-1">{nextMatchInfo.match.teamA.name}</span>
                          </div>
                          <div className="flex flex-col items-center">
                              <div className="text-sm sm:text-xl md:text-3xl font-black text-brand-vibrant italic px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-vibrant/10 rounded-xl sm:rounded-2xl border border-brand-vibrant/30">VS</div>
                              {timeLeft && <span className="mt-1.5 sm:mt-2 text-[7px] sm:text-[8px] font-black text-red-400 uppercase tracking-widest">Live Limit</span>}
                          </div>
                          <div className="flex flex-col items-center gap-2 sm:gap-3 text-center flex-1">
                              <TeamLogo logoUrl={nextMatchInfo.match.teamB.logoUrl} teamName={nextMatchInfo.match.teamB.name} className="w-12 h-12 sm:w-16 sm:h-16 md:w-28 md:h-28 shadow-2xl ring-2 sm:ring-4 ring-white/5" />
                              <span className="text-[10px] sm:text-xs md:text-xl font-black text-white uppercase italic tracking-tight line-clamp-1">{nextMatchInfo.match.teamB.name}</span>
                          </div>
                      </div>
                  </div>
              </Card>
          </div>
      )}

      {/* BERITA SLIDESHOW (Prominent UCL Style Hero) */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 px-2 sm:px-0">
        <div 
            className="relative w-full group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {latestNews.length > 0 ? (
                <div className="relative overflow-hidden rounded-2xl sm:rounded-[3rem] border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.5)] sm:shadow-[0_30px_100px_rgba(0,0,0,1)] bg-brand-secondary/40 aspect-[4/3] sm:aspect-[21/9]">
                    <div 
                        className="flex h-full transition-transform duration-1000 ease-in-out"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {latestNews.map((item) => (
                            <div 
                                key={item.id} 
                                className="relative flex-shrink-0 w-full h-full cursor-pointer"
                                onClick={() => onSelectMode('news')}
                            >
                                <img 
                                    src={item.imageUrl} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/40 sm:via-brand-primary/20 to-transparent"></div>
                                
                                <div className="absolute inset-0 p-4 sm:p-16 flex flex-col justify-end">
                                    <div className="flex items-center gap-1.5 sm:gap-3 mb-2 sm:mb-4">
                                        <span className="px-2 sm:px-4 py-1 sm:py-1.5 bg-brand-vibrant text-white text-[7px] sm:text-[11px] font-black uppercase rounded-md sm:rounded-lg shadow-2xl border border-white/20">
                                            {item.category}
                                        </span>
                                        <span className="text-white/80 text-[7px] sm:text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 bg-black/40 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-white/5">
                                            <Clock size={10} className="sm:w-3 sm:h-3" /> {new Date(item.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="text-base sm:text-6xl font-black text-white italic uppercase tracking-tighter leading-tight sm:leading-none line-clamp-3 sm:line-clamp-2 drop-shadow-2xl mb-2 sm:mb-4">
                                        {item.title}
                                    </h4>
                                    <div className="flex sm:hidden items-center gap-1.5 text-brand-vibrant text-[9px] font-black uppercase tracking-widest mt-1">
                                        <span>Baca Artikel</span>
                                        <ArrowRight size={10} />
                                    </div>
                                    <div className="hidden md:flex items-center gap-4 text-brand-light text-lg font-medium opacity-80 group-hover:opacity-100 transition-all">
                                        <span>Baca Artikel Lengkap</span>
                                        <ArrowRight size={24} className="animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {latestNews.length > 1 && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="absolute left-2 sm:left-10 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-black/40 text-white backdrop-blur-xl border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-vibrant hover:scale-110">
                                <ChevronLeft size={16} className="sm:w-8 sm:h-8" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="absolute right-2 sm:right-10 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-black/40 text-white backdrop-blur-xl border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-vibrant hover:scale-110">
                                <ChevronRight size={16} className="sm:w-8 sm:h-8" />
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="py-12 sm:py-32 bg-white/[0.02] rounded-2xl sm:rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4 sm:gap-6 group hover:bg-white/[0.04] transition-colors">
                    <EmptyNewsIllustration className="w-24 h-16 sm:w-48 sm:h-36 opacity-30 group-hover:opacity-50 transition-opacity" />
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <span className="text-brand-light font-black uppercase tracking-widest text-[10px] sm:text-sm">Belum Ada Berita</span>
                        <span className="text-brand-light/50 text-[9px] sm:text-xs max-w-[200px] sm:max-w-xs mx-auto">Pantau terus untuk update terbaru seputar turnamen dan transfer pemain.</span>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* COMPETITION EXPLORER - THE MAIN MENU */}
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
          <div className="flex items-center justify-between px-1 sm:px-2">
              <h3 className="text-base sm:text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2 sm:gap-3">
                  <Trophy size={20} className="sm:w-7 sm:h-7 text-brand-special" /> Jelajahi
              </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
              <CompetitionCard 
                  mode="league" title="Liga Reguler" 
                  desc="Kompetisi format liga satu musim penuh."
                  icon={LeagueIcon} colorClass="bg-blue-600" bgClass="bg-gradient-to-br from-blue-900/40 to-black" 
              />
              <CompetitionCard 
                  mode="two_leagues" title="2 Wilayah" 
                  desc="Pertarungan antar region menuju gelar juara."
                  icon={RegionIcon} colorClass="bg-purple-600" bgClass="bg-gradient-to-br from-purple-900/40 to-black" 
              />
              <CompetitionCard 
                  mode="wakacl" title="WakaEFL Champ" 
                  desc="Kasta tertinggi. Format UCL penuh gengsi."
                  icon={ChampionshipIcon} colorClass="bg-yellow-600" bgClass="bg-gradient-to-br from-yellow-900/40 to-black" 
              />
          </div>
      </div>

      {/* USER REGISTRATION CTA */}
      {isRegistrationOpen && (
          <div className="relative group p-1 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-r from-brand-vibrant via-brand-special to-brand-vibrant bg-[length:200%_auto] animate-[gradient_8s_linear_infinite] mx-2 sm:mx-0">
              <style>{`
                @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
              `}</style>
              <div className="bg-brand-primary p-6 sm:p-12 rounded-[1.4rem] sm:rounded-[2.4rem] flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
                  <div className="text-center md:text-left">
                      <h3 className="text-2xl sm:text-5xl font-black text-white italic uppercase tracking-tighter mb-2 sm:mb-3">Siap Bertanding?</h3>
                      <p className="text-brand-light text-xs sm:text-lg max-w-lg">Pendaftaran musim baru telah dibuka! Daftarkan tim kamu sekarang dan jadilah legenda baru di WakaEFL Hub.</p>
                  </div>
                  <button 
                      onClick={onRegisterTeam}
                      className="group/btn flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-5 bg-brand-vibrant hover:bg-white text-white hover:text-brand-primary rounded-xl sm:rounded-[1.5rem] text-sm sm:text-lg font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all shadow-2xl active:scale-95"
                  >
                      <PlusCircle size={18} className="sm:w-6 sm:h-6" />
                      <span>Daftar Sekarang</span>
                      <ArrowRight size={18} className="sm:w-6 sm:h-6 group-hover/btn:translate-x-2 transition-transform" />
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};
