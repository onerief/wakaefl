
import React from 'react';

interface BannerMarqueeProps {
    banners: string[];
}

export const BannerMarquee: React.FC<BannerMarqueeProps> = ({ banners }) => {
    if (!banners || banners.length === 0) return null;

    // We need enough items to cover the screen width twice for a seamless loop
    // If only one banner, we repeat it multiple times
    const displayBanners = banners.length < 5 
        ? [...banners, ...banners, ...banners, ...banners] 
        : [...banners, ...banners];

    return (
        <div className="relative w-full bg-black/40 border-y border-white/5 py-4 overflow-hidden backdrop-blur-md mb-8 group">
            <style>{`
                @keyframes banner-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-banner-scroll {
                    display: flex;
                    width: max-content;
                    animation: banner-scroll 45s linear infinite;
                }
                .group:hover .animate-banner-scroll {
                    animation-play-state: paused;
                }
            `}</style>
            
            <div className="animate-banner-scroll flex items-center gap-6 px-6">
                {displayBanners.map((url, idx) => (
                    <div 
                        key={idx} 
                        className="relative h-32 sm:h-40 md:h-48 lg:h-56 shrink-0 aspect-[21/9] rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-500 hover:scale-105 hover:border-brand-vibrant/50"
                    >
                        <img 
                            src={url} 
                            alt={`Banner ${idx}`} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        {/* Subtle inner glow */}
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none"></div>
                    </div>
                ))}
            </div>

            {/* Side Fades for professional look */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-brand-primary via-brand-primary/50 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-brand-primary via-brand-primary/50 to-transparent z-10 pointer-events-none"></div>
        </div>
    );
};
