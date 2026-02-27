import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface FloatingThemeToggleProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const FloatingThemeToggle: React.FC<FloatingThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-24 right-4 z-50 p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group"
      style={{
        backgroundColor: theme === 'dark' ? '#f0f9ff' : '#020617', // Sky 50 (Light) vs Slate 950 (Dark)
        color: theme === 'dark' ? '#020617' : '#f0f9ff', // Slate 950 (Dark) vs Sky 50 (Light)
        border: '2px solid',
        borderColor: theme === 'dark' ? '#e0f2fe' : '#1e293b' // Sky 100 vs Slate 800
      }}
      aria-label="Toggle Theme"
    >
      <div className="relative w-6 h-6">
        <Sun 
          size={24} 
          className={`absolute inset-0 transition-all duration-500 ${
            theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-0'
          }`} 
        />
        <Moon 
          size={24} 
          className={`absolute inset-0 transition-all duration-500 ${
            theme === 'light' ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-0'
          }`} 
        />
      </div>
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-black/80 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-sm">
        {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
      </span>
    </button>
  );
};
