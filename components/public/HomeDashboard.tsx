
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
    <div className="space-y-8 md:space-y-12 py-2 md:py-4 animate-in fade-in duration-700 relative z-10">
      
      {/* STATS BAR (Ringkasan Tipis sebagai pengganti Hero) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-secondary/40 border border-white/5 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-6">
              <div className="flex flex-col">
                  <span className="text-xl font-black text-white leading-none">{teamCount}</span>
                  <span className="text-[8px] font-bold text-brand-light uppercase tracking-widest opacity-60">Teams</span>
              </div>
              <div className="w-px h-6 bg-white/10"></div>
              <div className="flex flex-col">
                  <span className="text-xl font-black text-white leading-none">{partnerCount}</span>
                  <span className="text-[8px] font-bold text-brand-light uppercase tracking-widest opacity-60">Sponsors</span>
              </div>
          </div>

          {isRegistrationOpen && (
              <button 
                onClick={onRegisterTeam} 
                className="flex items-center gap-2 px-5 py-2 bg-brand-vibrant hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                  <PlusCircle size={14} />
                  <span>Daftar Tim Baru</span>
              </button>
          )}
      </div>

      {/* BERITA TERKINI SECTION */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <Newspaper size={18} className="text-brand-vibrant" /> Berita Terkini
            </h3>
            <button onClick={() => onSelectMode('news')} className="text-[10px] font-black text-brand-vibrant uppercase flex items-center gap-1 hover:text-white transition-colors">
                Lihat Semua <ArrowRight size={12} />
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNews.length > 0 ? latestNews.map((item) => (
                <div key={item.id} className="group cursor-pointer" onClick={() => onSelectMode('news')}>
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 mb-3 shadow-xl">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 bg-brand-vibrant/90 backdrop-blur-md text-white text-[8px] font-black uppercase rounded-lg shadow-lg">
                                {item.category}
                            </span>
                        </div>
                    </div>
                    <h4 className="text-sm font-black text-white leading-snug group-hover:text-brand-vibrant transition-colors line-clamp-2 uppercase italic mb-2">
                        {item.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] text-brand-light font-bold opacity-60">
                        <div className="flex items-center gap-1"><Clock size={12} /> {new Date(item.date).toLocaleDateString()}</div>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <span>Admin</span>
                    </div>
                </div>
            )) : (
                <div className="col-span-full py-12 bg-white/[0.02] rounded-2xl border border-dashed border-white/5 text-center text-brand-light italic text-xs">
                    Belum ada berita yang diterbitkan.
                </div>
            )}
        </div>
      </div>

      {/* INTELLIGENT SPOTLIGHT: Next Match */}
      {nextMatchInfo && (
          <div className="animate-in slide-in-from-left duration-700">
              <h3 className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-1">
                  <Calendar size={12} className="text-brand-vibrant" /> Jadwal Terdekat Anda
              </h3>
              <Card onClick={() => onSelectMode(nextMatchInfo.mode!)} className="!p-0 overflow-hidden !bg-gradient-to-r from-brand-vibrant/10 to-transparent border-brand-vibrant/20 group cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center">
                      <div className="bg-brand-vibrant p-3 md:p-6 flex flex-col items-center justify-center text-white shrink-0">
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-1">Matchday</span>
                          <span className="text-2xl font-black italic">{nextMatchInfo.match.matchday || 1}</span>
                      </div>
                      <div className="p-3 md:p-4 flex-grow flex items-center justify-center gap-4 md:gap-12">
                          <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                              <TeamLogo logoUrl={nextMatchInfo.match.teamA.logoUrl} teamName={nextMatchInfo.match.teamA.name} className="w-10 h-10 md:w-14 md:h-14" />
                              <span className="text-[9px] md:text-xs font-black text-white uppercase truncate w-full">{nextMatchInfo.match.teamA.name}</span>
                          </div>
                          <div className="flex flex-col items-center">
                              <span className="text-[8px] font-black text-brand-vibrant uppercase italic mb-0.5">VS</span>
                              <div className="w-6 h-px bg-white/10"></div>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                              <TeamLogo logoUrl={nextMatchInfo.match.teamB.logoUrl} teamName={nextMatchInfo.match.teamB.name} className="w-10 h-10 md:w-14 md:h-14" />
                              <span className="text-[9px] md:text-xs font-black text-white uppercase truncate w-full">{nextMatchInfo.match.teamB.name}</span>
                          </div>
                      </div>
                      <div className="px-4 py-3 md:py-0 border-t md:border-t-0 md:border-l border-white/5 flex items-center justify-between md:justify-center gap-4">
                          <div className="flex flex-col md:items-center">
                                <span className="text-[7px] font-bold text-brand-light uppercase tracking-widest">Kompetisi</span>
                                <span className="text-[10px] font-black text-white uppercase">{nextMatchInfo.mode === 'league' ? 'Liga Reguler' : nextMatchInfo.mode === 'wakacl' ? 'WAKACL' : '2 Wilayah'}</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-vibrant group-hover:bg-brand-vibrant group-hover:text-white transition-all">
                              <ArrowRight size={16} />
                          </div>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
