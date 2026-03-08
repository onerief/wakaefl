
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
        deepin-glass deepin-card
        p-4 md:p-6 
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
