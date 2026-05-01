
import React, { useState, useEffect } from 'react';
import { Zap, Trophy, Star } from 'lucide-react';
import { subscribeToDonations } from '../../services/firebaseService';
import type { Donation } from '../../types';

interface MarqueeBannerProps {
  messages?: string[];
}

export const MarqueeBanner: React.FC<MarqueeBannerProps> = ({ messages }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  
  const defaultMessages = [
    "SELAMAT DATANG DI WAKAEFL HUB - TURNAMEN EFOOTBALL TERGOKIL SE-WAY KANAN!",
    "SIAPKAN STRATEGI TERBAIKMU DAN RAIH GELAR JUARA!",
    "WAKAEFL SEASON 1: THE GLORY AWAITS...",
    "MAINKAN DENGAN SPORTIF, MENANG DENGAN ELEGAN!",
    "UPDATE SKOR DAN KLASEMEN SECARA REAL-TIME DI SINI!"
  ];

  useEffect(() => {
    // Real-time subscription to Firestore donations
    const unsubscribe = subscribeToDonations((data) => {
      setDonations(data);
    });

    return () => unsubscribe();
  }, []);

  const donationMessages = donations.slice(0, 5).map(d => (
    <div key={`don-${d.id || d.timestamp}`} className="flex items-center gap-4 px-8 border-x border-brand-special/20 bg-brand-special/5">
      <Star size={16} className="text-brand-special fill-brand-special animate-spin-slow" />
      <span className="text-xs md:text-sm font-black text-brand-special tracking-[0.2em] uppercase italic">
        TERIMA KASIH {d.name.toUpperCase()} (RP {d.amount.toLocaleString('id-ID')})!
      </span>
      <Trophy size={16} className="text-brand-special" />
    </div>
  ));

  const displayMessages = [
    ...donationMessages,
    ...(messages || defaultMessages).map((msg, i) => (
      <div key={`msg-${i}`} className="flex items-center gap-4 px-8 group">
        <Zap size={14} className="text-brand-vibrant fill-brand-vibrant animate-pulse" />
        <span className="text-xs md:text-sm font-black text-brand-text tracking-widest uppercase italic group-hover:text-brand-vibrant transition-colors">
          {msg}
        </span>
        <Trophy size={14} className="text-brand-special" />
        <span className="w-2 h-2 rounded-full bg-brand-vibrant/40"></span>
      </div>
    ))
  ];

  return (
    <div className="relative w-full bg-brand-vibrant/10 border-y border-brand-vibrant/20 py-2 overflow-hidden backdrop-blur-sm z-30">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
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
        {[...displayMessages, ...displayMessages].map((content, idx) => (
          <React.Fragment key={idx}>
            {content}
          </React.Fragment>
        ))}
      </div>

      {/* Side Fades for smooth entry/exit */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-brand-primary to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-brand-primary to-transparent z-10 pointer-events-none"></div>
    </div>
  );
};
