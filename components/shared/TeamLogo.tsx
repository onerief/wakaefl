
import React, { useState, useEffect } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { LogoSkeleton } from './Skeleton';

interface TeamLogoProps {
  logoUrl?: string;
  teamName: string;
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ logoUrl, teamName, className = 'w-8 h-8' }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Reset states when logoUrl changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [logoUrl]);

  const isUrl = logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('blob:') || logoUrl.startsWith('data:'));
  const effectiveLogoUrl = logoUrl && !hasError 
    ? (isUrl ? logoUrl : `/logo/${logoUrl}`) 
    : null;

  // If no URL or error, return the fallback immediately to save resources
  if (!effectiveLogoUrl) {
    return (
      <div className={`${className} flex-shrink-0 rounded-full bg-brand-secondary/50 flex items-center justify-center text-brand-light/30 border border-white/5 backdrop-blur-sm`}>
        <Shield className="w-1/2 h-1/2 opacity-50" />
      </div>
    );
  }

  return (
    <div className={`${className} relative flex-shrink-0 flex items-center justify-center rounded-full bg-brand-secondary/20 overflow-hidden border border-white/5 shadow-inner`}>
        
        {/* Placeholder / Skeleton while loading */}
        {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-brand-secondary/40 animate-pulse">
                <Shield className="w-1/2 h-1/2 text-brand-light/10" />
            </div>
        )}

        <img 
            key={effectiveLogoUrl}
            src={effectiveLogoUrl} 
            alt={`${teamName} logo`} 
            className={`
                w-full h-full object-contain p-0.5 transition-all duration-700 ease-out
                ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90 blur-sm'}
            `}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
                console.warn(`TeamLogo: Failed to load logo for ${teamName}`);
                setHasError(true);
                setIsLoaded(true);
            }}
            loading="lazy"
            decoding="async" // Helps with main thread performance
          />

          {/* High-tech border glow overlay when loaded */}
          {isLoaded && !hasError && (
              <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10 pointer-events-none"></div>
          )}
    </div>
  );
};
