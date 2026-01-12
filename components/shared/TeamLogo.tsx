
import React from 'react';
import { Shield } from 'lucide-react';

interface TeamLogoProps {
  logoUrl?: string;
  teamName: string;
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ logoUrl, teamName, className = 'w-8 h-8' }) => {
  const [hasError, setHasError] = React.useState(false);
  
  const isUrl = logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('blob:') || logoUrl.startsWith('data:'));
  const effectiveLogoUrl = logoUrl && !hasError 
    ? (isUrl ? logoUrl : `/logo/${logoUrl}`) 
    : null;

  if (effectiveLogoUrl) {
    return (
      <div className={`${className} relative flex-shrink-0 flex items-center justify-center rounded-full bg-white overflow-hidden shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-gray-200`}>
         <img 
            src={effectiveLogoUrl} 
            alt={`${teamName} logo`} 
            className="w-full h-full object-contain p-0.5"
            onError={() => setHasError(true)}
            loading="lazy"
          />
      </div>
    );
  }

  return (
    <div className={`${className} flex-shrink-0 rounded-full bg-brand-secondary flex items-center justify-center text-brand-light ring-1 ring-inset ring-brand-accent/50 backdrop-blur-sm`}>
      <Shield className="w-1/2 h-1/2" />
    </div>
  );
};
