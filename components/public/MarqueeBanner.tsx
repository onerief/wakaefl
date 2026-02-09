
import React from 'react';
import { Zap, Trophy, Target, Star } from 'lucide-react';

interface MarqueeBannerProps {
  messages?: string[];
}

export const MarqueeBanner: React.FC<MarqueeBannerProps> = ({ messages }) => {
  const defaultMessages = [
    "SELAMAT DATANG DI WAKAEFL HUB - TURNAMEN EFOOTBALL TERGOKIL SE-WAY KANAN!",
    "SIAPKAN STRATEGI TERBAIKMU DAN RAIH GELAR JUARA!",
    "WAKAEFL SEASON 1: THE GLORY AWAITS...",
    "MAINKAN DENGAN SPORTIF, MENANG DENGAN ELEGAN!",
    "UPDATE SKOR DAN KLASEMEN SECARA REAL-TIME DI SINI!"
  ];

  const displayMessages = messages || defaultMessages;

  return (
    <div className="relative w-full bg-brand-vibrant/10 border-y border-brand-vibrant/20 py-2 overflow-hidden backdrop-blur-sm z-30">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="animate-marquee flex items-center whitespace-nowrap">
        {/* We double the content to create a seamless loop */}
        {[...displayMessages, ...displayMessages].map((msg, idx) => (
          <div key={idx} className="flex items-center gap-4 px-8 group">
            <Zap size={14} className="text-brand-vibrant fill-brand-vibrant animate-pulse" />
            <span className="text-xs md:text-sm font-black text-brand-text tracking-widest uppercase italic group-hover:text-brand-vibrant transition-colors">
              {msg}
            </span>
            <Trophy size={14} className="text-brand-special" />
            <span className="w-2 h-2 rounded-full bg-brand-vibrant/40"></span>
          </div>
        ))}
      </div>

      {/* Side Fades for smooth entry/exit */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-brand-primary to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-brand-primary to-transparent z-10 pointer-events-none"></div>
    </div>
  );
};
