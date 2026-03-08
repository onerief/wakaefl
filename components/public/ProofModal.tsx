import React from 'react';
import { X } from 'lucide-react';

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export const ProofModal: React.FC<ProofModalProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] backdrop-blur-md animate-fade-in p-2 sm:p-4"
      onClick={onClose}
    >
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
      
      {/* Close button fixed to top right of screen for easy access on mobile */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-brand-vibrant transition-colors shadow-2xl z-50 border border-white/20 backdrop-blur-md"
        aria-label="Close proof image"
      >
        <X size={24} />
      </button>

      <div
        className="relative w-full h-full max-h-[100dvh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Match Proof Screenshot"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};