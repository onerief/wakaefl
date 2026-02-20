
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noHover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noHover = false, ...props }) => {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-brand-secondary/40 backdrop-blur-md 
        border border-white/5 
        rounded-[2rem] shadow-2xl 
        p-4 md:p-6 
        transition-all duration-500 
        ${!noHover ? 'hover:bg-brand-secondary/60 hover:border-brand-vibrant/40 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Subtle shine effect on top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
      
      {children}
    </div>
  );
};
