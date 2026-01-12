
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  ...props
}) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary active:scale-95';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-brand-vibrant to-blue-700 text-white shadow-lg shadow-brand-vibrant/20 hover:shadow-brand-vibrant/40 border border-white/10',
    secondary: 'bg-brand-secondary/50 text-brand-text border border-brand-accent hover:bg-brand-accent hover:text-white backdrop-blur-sm',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300'
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
