
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerCarouselProps {
    banners: string[];
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (banners.length <= 1 || isPaused) return;

        // Waktu tunggu tetap 2000ms (2 detik)
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [banners.length, isPaused]);

    if (!banners || banners.length === 0) return null;

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

    return (
        <div 
            className="relative w-full mb-6 group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Main Carousel Container with Overflow Hidden */}
            <div className="relative aspect-[21/9] sm:aspect-[21/7] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-brand-secondary/20">
                
                {/* Slidable Wrapper */}
                <div 
                    className="flex h-full w-full transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {banners.map((banner, index) => (
                        <div 
                            key={index}
                            className="relative flex-shrink-0 w-full h-full"
                        >
                            <img 
                                src={banner} 
                                alt={`Tournament Banner ${index + 1}`} 
                                className="w-full h-full object-cover"
                                loading={index === 0 ? "eager" : "lazy"}
                            />
                            {/* Decorative Overlays for each slide */}
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/90 via-transparent to-transparent opacity-60"></div>
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                <div className="absolute inset-0 flex items-center justify-between p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                    <button 
                        onClick={prevSlide}
                        className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-brand-vibrant transition-all active:scale-90"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={nextSlide}
                        className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-brand-vibrant transition-all active:scale-90"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Progress Indicators (Dots) */}
                {banners.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                    index === currentIndex 
                                        ? 'bg-brand-vibrant w-8 shadow-[0_0_10px_rgba(37,99,235,0.8)]' 
                                        : 'bg-white/30 w-2 hover:bg-white/50'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
                
                {/* Static Outer Ring */}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none z-40"></div>
            </div>
        </div>
    );
};
