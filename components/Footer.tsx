
import React from 'react';
import { Shield, Instagram, Twitter, MessageCircle, Gamepad2, Trophy, Monitor, Lock, Mail, Phone } from 'lucide-react';
import type { Partner } from '../types';

interface FooterProps {
    partners?: Partner[];
    onAdminLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ partners, onAdminLogin }) => {
  const hasPartners = partners && partners.length > 0;

  return (
    <footer className="bg-brand-secondary/30 border-t border-white/5 pt-12 pb-24 md:pb-8 mt-auto relative z-0 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Official Partners Banner */}
        <div className="flex flex-col items-center justify-center mb-12 space-y-6">
            <div className="flex items-center gap-3 w-full max-w-4xl">
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-grow"></div>
                <span className="text-[10px] font-bold text-brand-light/30 tracking-[0.3em] uppercase whitespace-nowrap">Official Partners</span>
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-grow"></div>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-80 hover:opacity-100 transition-opacity duration-500">
                {hasPartners ? (
                    partners.map((partner) => (
                         <a 
                            key={partner.id}
                            href={partner.websiteUrl || '#'} 
                            target={partner.websiteUrl ? "_blank" : undefined}
                            rel={partner.websiteUrl ? "noopener noreferrer" : undefined}
                            className={`flex items-center justify-center transition-all duration-500 hover:scale-110 ${!partner.websiteUrl ? 'cursor-default pointer-events-none' : ''}`}
                            title={partner.name}
                        >
                            <img 
                                src={partner.logoUrl} 
                                alt={partner.name} 
                                className="h-8 md:h-10 w-auto object-contain max-w-[150px] drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                                loading="lazy"
                            />
                        </a>
                    ))
                ) : (
                    <>
                        {/* Default Placeholders if no partners added */}
                         <div className="flex items-center gap-2 group cursor-default transition-all">
                            <Gamepad2 size={28} className="text-brand-vibrant fill-brand-vibrant/10 transition-colors" />
                            <span className="font-black text-2xl text-brand-text tracking-tighter italic group-hover:text-white transition-colors">eFootball™</span>
                        </div>

                        <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

                        <div className="flex items-center gap-2 group cursor-default transition-all">
                             <Monitor size={28} className="text-purple-400 fill-purple-400/10 transition-colors" />
                            <span className="font-bold text-xl text-brand-text tracking-wide group-hover:text-white transition-colors">
                                S<span className="text-purple-400">TREAM</span>LABS
                            </span>
                        </div>

                        <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

                        <div className="flex items-center gap-2 group cursor-default transition-all">
                            <Trophy size={28} className="text-yellow-400 fill-yellow-400/10 transition-colors" />
                            <div className="flex flex-col leading-none">
                                <span className="font-black text-base text-brand-text uppercase group-hover:text-white transition-colors">Way Kanan</span>
                                <span className="text-[10px] font-bold text-yellow-400 tracking-widest uppercase">ESPORTS</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 border-t border-white/5 pt-12">
          
          {/* Brand Column */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-4 group cursor-pointer">
               <div className="relative">
                   <Shield size={32} className="text-brand-vibrant fill-brand-vibrant/10" />
                   <div className="absolute inset-0 bg-brand-vibrant/20 blur-lg rounded-full"></div>
               </div>
               <div className="flex flex-col">
                   <span className="text-lg font-black text-brand-text tracking-tighter italic leading-none">WAY KANAN</span>
                   <span className="text-xs font-bold text-brand-vibrant tracking-widest uppercase">Tournament Hub</span>
               </div>
            </div>
            <p className="text-brand-light/80 text-sm leading-relaxed max-w-xs">
              The premier platform for eFootball tournaments. Join the community, track stats, and compete for glory in our Champions League format events.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-center text-center">
            <h4 className="font-bold text-brand-text mb-6 uppercase tracking-wider text-xs border-b border-brand-vibrant/50 pb-2">Tournament</h4>
            <ul className="space-y-3 text-sm text-brand-light">
                <li><span className="hover:text-brand-vibrant transition-colors cursor-pointer">Group Stage</span></li>
                <li><span className="hover:text-brand-vibrant transition-colors cursor-pointer">Knockout Bracket</span></li>
                <li><span className="hover:text-brand-vibrant transition-colors cursor-pointer">Match Schedule</span></li>
                <li><span className="hover:text-brand-vibrant transition-colors cursor-pointer">Rules & Regulations</span></li>
            </ul>
          </div>

          {/* Connect */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
             <h4 className="font-bold text-brand-text mb-6 uppercase tracking-wider text-xs border-b border-brand-vibrant/50 pb-2">Community & Social</h4>
             <div className="flex gap-4 mb-4">
                <a 
                    href="https://www.instagram.com/waykanan_efootball?igsh=MXh6Y3dzdXdpMmtqbA==" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/5 rounded-xl hover:bg-brand-vibrant hover:text-brand-primary transition-all hover:scale-110 group border border-white/5 hover:border-brand-vibrant"
                    title="Instagram Official"
                >
                    <Instagram size={20} />
                </a>
                 <a 
                    href="https://wa.me/6289646800884" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/5 rounded-xl hover:bg-green-500 hover:text-brand-primary transition-all hover:scale-110 group border border-white/5 hover:border-green-500"
                    title="WhatsApp Admin"
                >
                    <MessageCircle size={20} />
                </a>
                 <a 
                    href="mailto:kanyepocof@gmail.com" 
                    className="p-2.5 bg-white/5 rounded-xl hover:bg-brand-special hover:text-brand-primary transition-all hover:scale-110 group border border-white/5 hover:border-brand-special"
                    title="Email Support"
                >
                    <Mail size={20} />
                </a>
             </div>
             <p className="text-brand-light/60 text-xs">
                Ada pertanyaan? <a href="https://wa.me/6289646800884" target="_blank" rel="noopener noreferrer" className="text-brand-vibrant hover:underline">Hubungi Admin di WhatsApp</a>
             </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brand-light/40 font-medium">
            <p>&copy; 2024 Way Kanan eFootball Community. All rights reserved.</p>
            <div className="flex gap-6 items-center">
                <span className="hover:text-brand-light transition-colors cursor-pointer">Privacy Policy</span>
                <span className="hover:text-brand-light transition-colors cursor-pointer">Terms of Service</span>
                
                {/* Simplified Admin Login Trigger */}
                {onAdminLogin && (
                    <button 
                        onClick={onAdminLogin}
                        className="hover:text-brand-vibrant transition-colors"
                        title="Admin Login"
                    >
                        <Lock size={12} />
                    </button>
                )}
            </div>
        </div>
      </div>
    </footer>
  );
};
