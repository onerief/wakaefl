
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
        bg-brand-secondary/40 backdrop-blur-sm 
        border border-brand-accent 
        rounded-xl shadow-lg 
        p-4 md:p-6 
        transition-all duration-300 
        ${!noHover ? 'hover:bg-brand-secondary/60 hover:shadow-brand-vibrant/10 hover:border-brand-vibrant/30 hover:-translate-y-1' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Subtle shine effect on top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-light/10 to-transparent opacity-50"></div>
      
      {children}
    </div>
  );
};
