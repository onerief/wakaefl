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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm p-4 animate-fade-in"
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
      <div
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Match Proof Screenshot"
          className="w-full h-auto object-contain rounded-lg shadow-2xl max-h-[90vh]"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-brand-primary text-brand-light rounded-full p-1.5 hover:bg-brand-accent hover:text-brand-text transition-colors shadow-lg"
          aria-label="Close proof image"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};