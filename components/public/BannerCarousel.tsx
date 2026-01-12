
import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';

interface BannerCarouselProps {
    banners: string[];
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, [banners.length]);

    if (!banners || banners.length === 0) return null;

    return (
        <Card className="!p-0 overflow-hidden mb-8 relative border-brand-accent/50 shadow-2xl group">
             {/* Aspect ratio container: 16:9 on mobile, 21:9 or wider on desktop */}
            <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 bg-brand-primary">
                 {banners.map((banner, index) => (
                    <div 
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                         <img 
                            src={banner} 
                            alt={`Tournament Banner ${index + 1}`} 
                            className="w-full h-full object-cover object-center"
                        />
                         {/* Gradient overlay for text readability if needed later */}
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/80 to-transparent opacity-60"></div>
                    </div>
                 ))}
                 
                 {/* Navigation Dots */}
                 {banners.length > 1 && (
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                         {banners.map((_, index) => (
                             <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-brand-vibrant w-6' : 'bg-white/50 hover:bg-white'}`}
                                aria-label={`Go to slide ${index + 1}`}
                             />
                         ))}
                     </div>
                 )}
            </div>
        </Card>
    );
};
