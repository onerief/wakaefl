
import React, { useMemo, useState, useEffect } from 'react';
import { PlusCircle, Calendar, ArrowRight, Newspaper, Clock, Zap, Star, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../shared/Card';
import { TournamentMode, Team, Match, NewsItem } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';

interface HomeDashboardProps {
  onSelectMode: (mode: TournamentMode | 'hall_of_fame' | 'news' | 'shop') => void;
  teamCount: number;
  partnerCount: number;
  onRegisterTeam?: () => void;
  isRegistrationOpen?: boolean;
  userOwnedTeams?: { mode: TournamentMode, team: Team }[];
  allMatches?: Match[];
  news?: NewsItem[];
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
    onSelectMode, 
    teamCount, 
    partnerCount, 
    onRegisterTeam, 
    isRegistrationOpen = true,
    userOwnedTeams = [],
    allMatches = [],
    news = []
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const latestNews = useMemo(() => {
      return [...news].sort((a, b) => b.date - a.date).slice(0, 5);
  }, [news]);

  // Auto-slide logic
  useEffect(() => {
    if (latestNews.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % latestNews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [latestNews.length, isPaused]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % latestNews.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + latestNews.length) % latestNews.length);

  const nextMatchInfo = useMemo(() => {
    if (userOwnedTeams.length === 0 || allMatches.length === 0) return null;
    const userTeamIds = userOwnedTeams.map(t => t.team.id);
    const upcoming = allMatches.filter(m => 
        m.status === 'scheduled' && (userTeamIds.includes(m.teamA.id) || userTeamIds.includes(m.teamB.id))
    ).sort((a, b) => (a.matchday || 1) - (b.matchday || 1));
    if (upcoming.length === 0) return null;
    const match = upcoming[0];
    const userTeamMode = userOwnedTeams.find(ut => ut.team.id === match.teamA.id || ut.team.id === match.teamB.id)?.mode;
    return { match, mode: userTeamMode };
  }, [userOwnedTeams, allMatches]);

  return (
    <div className="space-y-6 md:space-y-12 py-2 md:py-4 animate-in fade-in duration-700 relative z-10">
      
      {/* STATS BAR - Compact on Mobile */}
      <div className="flex flex-row items-center justify-between gap-4 p-3 sm:p-4 bg-brand-secondary/40 border border-white/5 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col">
                  <span className="text-base sm:text-xl font-black text-white leading-none">{teamCount}</span>
                  <span className="text-[7px] sm:text-[8px] font-bold text-brand-light uppercase tracking-widest opacity-60">Teams</span>
              </div>
              <div className="w-px h-5 sm:h-6 bg-white/10"></div>
              <div className="flex flex-col">
                  <span className="text-base sm:text-xl font-black text-white leading-none">{partnerCount}</span>
                  <span className="text-[7px] sm:text-[8px] font-bold text-brand-light uppercase tracking-widest opacity-60">Sponsors</span>
              </div>
          </div>

          {isRegistrationOpen && (
              <button 
                onClick={onRegisterTeam} 
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2 bg-brand-vibrant hover:bg-blue-600 text-white rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap"
              >
                  <PlusCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span>Daftar</span>
              </button>
          )}
      </div>

      {/* BERITA SLIDESHOW */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
            <h3 className="text-[10px] md:text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <Newspaper size={16} className="text-brand-vibrant sm:w-[18px]" /> Headline News
            </h3>
            <button onClick={() => onSelectMode('news')} className="text-[8px] sm:text-[10px] font-black text-brand-vibrant uppercase flex items-center gap-1 hover:text-white transition-colors">
                Lihat Semua <ArrowRight size={10} />
            </button>
        </div>
        
        <div 
            className="relative w-full group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {latestNews.length > 0 ? (
                <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-white/10 shadow-2xl bg-brand-secondary/40 aspect-[16/10] sm:aspect-[21/8]">
                    {/* Slides Wrapper */}
                    <div 
                        className="flex h-full transition-transform duration-700 ease-out"
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
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/10 to-transparent"></div>
                                
                                {/* Content Overlay */}
                                <div className="absolute inset-0 p-4 sm:p-12 flex flex-col justify-end">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-brand-vibrant text-white text-[7px] sm:text-[10px] font-black uppercase rounded-md sm:rounded-lg shadow-lg">
                                            {item.category}
                                        </span>
                                        <span className="text-white/60 text-[7px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Clock size={10} className="sm:w-[12px]" /> {new Date(item.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="text-sm sm:text-5xl font-black text-white italic uppercase tracking-tighter leading-tight line-clamp-2 drop-shadow-2xl">
                                        {item.title}
                                    </h4>
                                    <p className="hidden md:block text-brand-light/80 text-sm line-clamp-2 max-w-2xl font-medium mt-3">
                                        {item.content.replace(/<[^>]+>/g, '')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    {latestNews.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-vibrant"
                            >
                                <ChevronLeft size={20} sm:size={24} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-vibrant"
                            >
                                <ChevronRight size={20} sm:size={24} />
                            </button>
                        </>
                    )}

                    {/* Pagination Indicators */}
                    {latestNews.length > 1 && (
                        <div className="absolute bottom-4 sm:bottom-12 right-4 sm:right-12 z-20 flex gap-1.5 sm:gap-2">
                            {latestNews.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                    className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ${
                                        idx === currentIndex 
                                            ? 'bg-brand-vibrant w-5 sm:w-8 shadow-[0_0_10px_rgba(37,99,235,0.8)]' 
                                            : 'bg-white/20 w-1.5 sm:w-2 hover:bg-white/40'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-24 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5 text-center text-brand-light italic text-xs">
                    Belum ada berita yang diterbitkan.
                </div>
            )}
        </div>
      </div>

      {/* INTELLIGENT SPOTLIGHT: Next Match */}
      {nextMatchInfo && (
          <div className="animate-in slide-in-from-left duration-700">
              <h3 className="text-[8px] sm:text-[10px] font-black text-brand-light uppercase tracking-[0.2em] mb-3 sm:mb-4 flex items-center gap-2 px-1">
                  <Calendar size={12} className="text-brand-vibrant" /> Jadwal Terdekat Anda
              </h3>
              <Card onClick={() => onSelectMode(nextMatchInfo.mode!)} className="!p-0 overflow-hidden !bg-gradient-to-r from-brand-vibrant/10 to-transparent border-brand-vibrant/20 group cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center">
                      <div className="bg-brand-vibrant p-2 sm:p-6 flex flex-row md:flex-col items-center justify-between md:justify-center text-white shrink-0">
                          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest opacity-70">Matchday</span>
                          <span className="text-lg sm:text-2xl font-black italic">{nextMatchInfo.match.matchday || 1}</span>
                      </div>
                      <div className="p-3 md:p-4 flex-grow flex items-center justify-center gap-4 md:gap-12">
                          <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                              <TeamLogo logoUrl={nextMatchInfo.match.teamA.logoUrl} teamName={nextMatchInfo.match.teamA.name} className="w-8 h-8 sm:w-14 sm:h-14" />
                              <span className="text-[8px] sm:text-xs font-black text-white uppercase truncate w-full">{nextMatchInfo.match.teamA.name}</span>
                          </div>
                          <div className="flex flex-col items-center">
                              <span className="text-[7px] sm:text-[8px] font-black text-brand-vibrant uppercase italic mb-0.5">VS</span>
                              <div className="w-4 sm:w-6 h-px bg-white/10"></div>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                              <TeamLogo logoUrl={nextMatchInfo.match.teamB.logoUrl} teamName={nextMatchInfo.match.teamB.name} className="w-8 h-8 sm:w-14 sm:h-14" />
                              <span className="text-[8px] sm:text-xs font-black text-white uppercase truncate w-full">{nextMatchInfo.match.teamB.name}</span>
                          </div>
                      </div>
                      <div className="px-3 py-2 md:py-0 border-t md:border-t-0 md:border-l border-white/5 flex items-center justify-between md:justify-center gap-4">
                          <div className="flex flex-col md:items-center">
                                <span className="text-[6px] sm:text-[7px] font-bold text-brand-light uppercase tracking-widest">Kompetisi</span>
                                <span className="text-[8px] sm:text-[10px] font-black text-white uppercase">{nextMatchInfo.mode === 'league' ? 'Liga Reguler' : nextMatchInfo.mode === 'wakacl' ? 'WAKACL' : '2 Wilayah'}</span>
                          </div>
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-vibrant group-hover:bg-brand-vibrant group-hover:text-white transition-all">
                              <ArrowRight size={12} className="sm:w-[16px]" />
                          </div>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
