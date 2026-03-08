
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
            className={`group relative overflow-hidden rounded-[2rem] p-6 text-left transition-all duration-500 hover:-translate-y-2 border border-brand-accent active:scale-95 flex flex-col h-full bg-brand-secondary shadow-lg hover:shadow-2xl`}
        >
            <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${colorClass} to-transparent pointer-events-none`}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--brand-light),transparent)] opacity-5 pointer-events-none"></div>
            <div className="mb-4 flex items-center justify-between relative z-10">
                <div className={`p-3 rounded-2xl ${colorClass.replace('from-', 'bg-').replace('/5', '')} shadow-xl text-white`}>
                    <Icon size={28} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                    <ArrowRight size={20} className="text-brand-text" />
                </div>
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-brand-text italic uppercase tracking-tighter mb-2 group-hover:text-brand-special transition-colors relative z-10">{title}</h4>
            <p className="text-xs text-brand-light font-medium leading-relaxed mb-6 relative z-10">{desc}</p>
            <div className="mt-auto flex items-center gap-2 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-text/80 py-1.5 px-4 bg-brand-primary/40 rounded-full border border-brand-accent group-hover:bg-brand-vibrant group-hover:text-white group-hover:border-brand-vibrant transition-all">
                    Masuk Arena
                </span>
            </div>
        </button>
    );
  };

  return (
    <div className="flex flex-col gap-10 md:gap-20 pt-0 pb-20 animate-in fade-in duration-700 relative z-10">
      <div className="absolute inset-0 z-[-1] opacity-20 pointer-events-none text-brand-light">
        <HeroPattern />
      </div>

      {/* BENTO GRID DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2 sm:px-0">
          {/* Main News Spotlight (Bento Large) */}
          <div className="md:col-span-3 md:row-span-2">
            <div 
                className="relative w-full group h-full"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {latestNews.length > 0 ? (
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-brand-accent glass-card h-full aspect-[4/3] md:aspect-auto">
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                    
                                    <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-3 py-1 bg-brand-vibrant text-white text-[9px] font-black uppercase rounded-lg border border-white/20">
                                                {item.category}
                                            </span>
                                        </div>
                                        <h4 className="text-xl md:text-4xl font-sports text-white leading-tight mb-4 line-clamp-2">
                                            {item.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-brand-vibrant text-[10px] font-black uppercase tracking-widest">
                                            <span>Baca Selengkapnya</span>
                                            <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {latestNews.length > 1 && (
                            <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                                <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="w-10 h-10 rounded-full bg-black/40 text-white backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-brand-vibrant transition-all">
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="w-10 h-10 rounded-full bg-black/40 text-white backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-brand-vibrant transition-all">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full py-12 bg-brand-secondary/40 rounded-[2.5rem] border border-dashed border-brand-accent flex flex-col items-center justify-center text-center gap-4">
                        <EmptyNewsIllustration className="w-24 h-16 opacity-30" />
                        <span className="text-brand-light font-black uppercase tracking-widest text-[10px]">Belum Ada Berita</span>
                    </div>
                )}
            </div>
          </div>

          {/* Quick Stats (Bento Small) */}
          <div className="md:col-span-1 grid grid-cols-2 md:grid-cols-1 gap-4">
              {[
                  { label: 'Peserta', val: teamCount, icon: Users, color: 'text-blue-500' },
                  { label: 'Sponsors', val: partnerCount, icon: Star, color: 'text-yellow-500' }
              ].map((stat, i) => (
                  <div key={i} className="glass-card p-5 rounded-[2rem] flex flex-col justify-between hover:border-brand-vibrant/30 transition-all group">
                      <div className={`w-10 h-10 rounded-xl bg-brand-primary/50 flex items-center justify-center ${stat.color}`}>
                          <stat.icon size={20} />
                      </div>
                      <div className="mt-4">
                          <p className="text-3xl font-sports text-brand-text leading-none">{stat.val}</p>
                          <p className="text-[9px] font-black text-brand-light uppercase tracking-widest mt-1 opacity-60">{stat.label}</p>
                      </div>
                  </div>
              ))}
          </div>

          {/* Next Match Spotlight (Bento Medium) */}
          {nextMatchInfo && (
              <div className="md:col-span-4">
                  <div 
                      onClick={() => onSelectMode(nextMatchInfo.mode!)}
                      className="glass-card rounded-[2.5rem] overflow-hidden border-brand-vibrant/20 group cursor-pointer hover:border-brand-vibrant transition-all p-1"
                  >
                      <div className="flex flex-col md:flex-row items-stretch bg-brand-primary/30 rounded-[2.4rem] overflow-hidden">
                          <div className="bg-brand-vibrant p-6 md:p-10 flex md:flex-col items-center justify-between md:justify-center text-white shrink-0">
                              <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Next Match</span>
                              <span className="text-3xl md:text-6xl font-sports leading-none">MD{nextMatchInfo.match.matchday || 1}</span>
                          </div>
                          <div className="p-6 md:p-10 flex-grow flex items-center justify-around gap-4">
                              <div className="flex flex-col items-center gap-3 text-center">
                                  <TeamLogo logoUrl={nextMatchInfo.match.teamA.logoUrl} teamName={nextMatchInfo.match.teamA.name} className="w-16 h-16 md:w-24 md:h-24 shadow-2xl ring-4 ring-brand-accent/30" />
                                  <span className="text-[10px] md:text-sm font-black text-brand-text uppercase italic tracking-tight line-clamp-1">{nextMatchInfo.match.teamA.name}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                  <div className="text-xl md:text-4xl font-sports text-brand-vibrant italic px-4 py-2 bg-brand-vibrant/10 rounded-2xl border border-brand-vibrant/30">VS</div>
                                  {timeLeft && <span className="mt-2 text-[8px] font-black text-red-500 uppercase tracking-widest animate-pulse">{timeLeft}</span>}
                              </div>
                              <div className="flex flex-col items-center gap-3 text-center">
                                  <TeamLogo logoUrl={nextMatchInfo.match.teamB.logoUrl} teamName={nextMatchInfo.match.teamB.name} className="w-16 h-16 md:w-24 md:h-24 shadow-2xl ring-4 ring-brand-accent/30" />
                                  <span className="text-[10px] md:text-sm font-black text-brand-text uppercase italic tracking-tight line-clamp-1">{nextMatchInfo.match.teamB.name}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* COMPETITION EXPLORER */}
      <div className="space-y-6 px-2 sm:px-0">
          <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-brand-special/10 flex items-center justify-center text-brand-special">
                  <Trophy size={20} />
              </div>
              <h3 className="text-xl md:text-3xl font-sports text-brand-text">Arena Kompetisi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CompetitionCard 
                  mode="league" title="Liga Reguler" 
                  desc="Kompetisi format liga satu musim penuh."
                  icon={LeagueIcon} colorClass="from-blue-500" 
              />
              <CompetitionCard 
                  mode="two_leagues" title="2 Wilayah" 
                  desc="Pertarungan antar region menuju gelar juara."
                  icon={RegionIcon} colorClass="from-purple-500" 
              />
              <CompetitionCard 
                  mode="wakacl" title="WakaEFL Champ" 
                  desc="Kasta tertinggi. Format UCL penuh gengsi."
                  icon={ChampionshipIcon} colorClass="from-yellow-500" 
              />
          </div>
      </div>

      {/* USER REGISTRATION CTA */}
      {isRegistrationOpen && (
          <div className="relative group p-1 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-r from-brand-vibrant via-brand-special to-brand-vibrant bg-[length:200%_auto] animate-[gradient_8s_linear_infinite] mx-2 sm:mx-0">
              <style>{`
                @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
              `}</style>
              <div className="bg-brand-secondary p-6 sm:p-12 rounded-[1.4rem] sm:rounded-[2.4rem] flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 shadow-2xl">
                  <div className="text-center md:text-left">
                      <h3 className="text-2xl sm:text-5xl font-black text-brand-text italic uppercase tracking-tighter mb-2 sm:mb-3">Siap Bertanding?</h3>
                      <p className="text-brand-light text-xs sm:text-lg max-w-lg">Pendaftaran musim baru telah dibuka! Daftarkan tim kamu sekarang dan jadilah legenda baru di WakaEFL Hub.</p>
                  </div>
                  <button 
                      onClick={onRegisterTeam}
                      className="group/btn flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-5 bg-brand-vibrant hover:bg-brand-inverse text-white hover:text-brand-primary rounded-xl sm:rounded-[1.5rem] text-sm sm:text-lg font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all shadow-2xl active:scale-95"
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
