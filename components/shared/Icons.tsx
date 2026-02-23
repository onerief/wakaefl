import React from 'react';

export const WakaLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Shield Base */}
    <path 
      d="M50 5 L90 20 V50 C90 75 50 95 50 95 C50 95 10 75 10 50 V20 L50 5 Z" 
      fill="url(#logoGradient)" 
      stroke="rgba(255,255,255,0.2)" 
      strokeWidth="2"
    />
    
    {/* Inner Shield Detail */}
    <path 
      d="M50 15 L80 26 V50 C80 70 50 85 50 85 C50 85 20 70 20 50 V26 L50 15 Z" 
      fill="rgba(0,0,0,0.2)" 
    />
    
    {/* Lightning Bolt / W Shape */}
    <path 
      d="M35 35 L48 35 L42 55 L58 55 L38 80 L44 60 L28 60 L35 35 Z" 
      fill="url(#accentGradient)" 
      filter="url(#glow)"
      stroke="white"
      strokeWidth="1"
    />
    
    {/* Decorative Lines */}
    <path d="M50 5 V15" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <path d="M90 20 L80 26" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <path d="M10 20 L20 26" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
  </svg>
);

export const HeroPattern = ({ className }: { className?: string }) => (
  <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      </pattern>
      <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.1)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
    <rect width="100%" height="100%" fill="url(#dots)" />
  </svg>
);

export const EmptyNewsIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 150" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="30" width="120" height="90" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2"/>
    <path d="M40 60 H160" stroke="#334155" strokeWidth="2"/>
    <rect x="55" y="45" width="90" height="6" rx="3" fill="#475569"/>
    <rect x="55" y="75" width="60" height="6" rx="3" fill="#334155"/>
    <rect x="55" y="90" width="80" height="6" rx="3" fill="#334155"/>
    <rect x="55" y="105" width="40" height="6" rx="3" fill="#334155"/>
    <circle cx="160" cy="30" r="12" fill="#ef4444" opacity="0.8"/>
    <path d="M156 26 L164 34 M164 26 L156 34" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const LeagueIcon = ({ className, size = 24 }: { className?: string, size?: number | string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
    <path d="M9 21V9" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const RegionIcon = ({ className, size = 24 }: { className?: string, size?: number | string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" />
    <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const ChampionshipIcon = ({ className, size = 24 }: { className?: string, size?: number | string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CustomTrophy = ({ className, size = 24 }: { className?: string, size?: number | string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 4H17C18.6569 4 20 5.34315 20 7V8C20 10.2091 18.2091 12 16 12H8C5.79086 12 4 10.2091 4 8V7C4 5.34315 5.34315 4 7 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 4V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 4V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
