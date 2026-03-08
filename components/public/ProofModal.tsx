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
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-[150] backdrop-blur-md animate-fade-in p-4"
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
        className="relative flex items-center justify-center max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Match Proof Screenshot"
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-brand-primary text-brand-light rounded-full p-1.5 hover:bg-brand-accent hover:text-white transition-colors shadow-2xl z-50 border border-brand-accent"
          aria-label="Close proof image"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};