
import React, { useMemo } from 'react';
import { Star, PlusCircle, Calendar, ArrowRight, Newspaper, Clock, Trophy } from 'lucide-react';
import { Card } from '../shared/Card';
import { TournamentMode, Team, Match, NewsItem } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';

interface HomeDashboardProps {
  onSelectMode: (mode: TournamentMode | 'hall_of_fame' | 'news') => void;
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

  const latestNews = useMemo(() => {
      return [...news].sort((a, b) => b.date - a.date).slice(0, 3);
  }, [news]);

  return (
    <div className="space-y-6 md:space-y-12 py-1 md:py-4 animate-in fade-in duration-700 relative z-10">
      
      {/* STATS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-brand-secondary/40 border border-white/5 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-4 sm:gap-6 flex-1">
              <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-black text-white leading-none">{teamCount}</span>
                  <span className="text-[7px] sm:text-[8px] font-bold text-brand-light uppercase tracking-widest opacity-60">Teams</span>
              </div>
              <div className="w-px h-5 sm:h-6 bg-white/10"></div>
              <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-black text-white leading-none">{partnerCount}</span>
                  <span className="text-[7px] sm:text-[8px] font-bold text-brand-light uppercase tracking-widest opacity-60">Sponsors</span>
              </div>
          </div>

          {isRegistrationOpen && (
              <button 
                onClick={onRegisterTeam} 
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-vibrant hover:bg-blue-600 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
              >
                  <PlusCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span>Daftar Tim</span>
              </button>
          )}
      </div>

      {/* BERITA TERKINI SECTION */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
            <h3 className="text-[10px] sm:text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <Newspaper size={16} className="text-brand-vibrant sm:w-4 sm:h-4" /> Berita Terkini
            </h3>
            <button onClick={() => onSelectMode('news')} className="text-[9px] sm:text-[10px] font-black text-brand-vibrant uppercase flex items-center gap-1 hover:text-white transition-colors">
                Semua <ArrowRight size={10} className="sm:w-3 sm:h-3" />
            </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {latestNews.length > 0 ? latestNews.map((item) => (
                <div key={item.id} className="group cursor-pointer" onClick={() => onSelectMode('news')}>
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 mb-3 shadow-xl bg-black/20">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 bg-brand-vibrant/90 backdrop-blur-md text-white text-[7px] font-black uppercase rounded shadow-lg">
                                {item.category}
                            </span>
                        </div>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white leading-snug group-hover:text-brand-vibrant transition-colors line-clamp-2 uppercase italic mb-1.5">
                        {item.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[8px] sm:text-[10px] text-brand-light font-bold opacity-60">
                        <div className="flex items-center gap-1"><Clock size={10} /> {new Date(item.date).toLocaleDateString()}</div>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <span>Admin</span>
                    </div>
                </div>
            )) : (
                <div className="col-span-full py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/5 text-center text-brand-light italic text-[10px]">
                    Belum ada berita.
                </div>
            )}
        </div>
      </div>

      {/* INTELLIGENT SPOTLIGHT: Next Match */}
      {nextMatchInfo && (
          <div className="animate-in slide-in-from-left duration-700">
              <h3 className="text-[9px] sm:text-[10px] font-black text-brand-light uppercase tracking-[0.2em] mb-3 flex items-center gap-2 px-1">
                  <Calendar size={10} className="text-brand-vibrant sm:w-3 sm:h-3" /> Jadwal Terdekat
              </h3>
              <Card onClick={() => onSelectMode(nextMatchInfo.mode!)} className="!p-0 overflow-hidden !bg-gradient-to-r from-brand-vibrant/10 to-transparent border-brand-vibrant/20 group cursor-pointer">
                  <div className="flex flex-row items-center">
                      <div className="bg-brand-vibrant p-3 sm:p-6 flex flex-col items-center justify-center text-white shrink-0 min-w-[70px] sm:min-w-[120px]">
                          <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-widest opacity-70 mb-1">Day</span>
                          <span className="text-xl sm:text-2xl font-black italic">{nextMatchInfo.match.matchday || 1}</span>
                      </div>
                      <div className="p-3 flex-grow flex items-center justify-center gap-2 sm:gap-12 overflow-hidden">
                          <div className="flex flex-col items-center gap-1 text-center flex-1 min-w-0">
                              <TeamLogo logoUrl={nextMatchInfo.match.teamA.logoUrl} teamName={nextMatchInfo.match.teamA.name} className="w-8 h-8 sm:w-14 sm:h-14" />
                              <span className="text-[8px] sm:text-[10px] font-black text-white uppercase truncate w-full">{nextMatchInfo.match.teamA.name}</span>
                          </div>
                          <div className="flex flex-col items-center shrink-0">
                              <span className="text-[8px] sm:text-[10px] font-black text-brand-vibrant uppercase italic mb-0.5">VS</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 text-center flex-1 min-w-0">
                              <TeamLogo logoUrl={nextMatchInfo.match.teamB.logoUrl} teamName={nextMatchInfo.match.teamB.name} className="w-8 h-8 sm:w-14 sm:h-14" />
                              <span className="text-[8px] sm:text-[10px] font-black text-white uppercase truncate w-full">{nextMatchInfo.match.teamB.name}</span>
                          </div>
                      </div>
                      <div className="p-3 shrink-0">
                          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-brand-vibrant group-hover:bg-brand-vibrant group-hover:text-white transition-all">
                              <ArrowRight size={14} className="sm:w-5 sm:h-5" />
                          </div>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
