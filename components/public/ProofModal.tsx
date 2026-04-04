import React, { useState } from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export const ProofModal: React.FC<ProofModalProps> = ({ isOpen, onClose, imageUrl }) => {
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

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
        className="relative w-full h-full max-h-[100dvh] flex flex-col items-center justify-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {!imageError ? (
            <img
              src={imageUrl}
              alt="Match Proof Screenshot"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={() => setImageError(true)}
            />
        ) : (
            <div className="bg-brand-secondary/80 p-6 sm:p-8 rounded-2xl border border-brand-accent/30 flex flex-col items-center text-center max-w-sm mx-auto shadow-2xl">
                <div className="w-16 h-16 bg-brand-vibrant/20 rounded-full flex items-center justify-center mb-4 text-brand-vibrant">
                    <ImageIcon size={32} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Bukti Pertandingan</h3>
                <p className="text-xs text-brand-light/70 mb-6 leading-relaxed">
                    Link bukti yang diberikan tidak dapat dimuat sebagai gambar langsung. Silakan buka link di tab baru untuk melihat bukti.
                </p>
                <a 
                    href={imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-brand-vibrant text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-vibrant/20"
                >
                    <span>Buka Link Bukti</span>
                    <ExternalLink size={16} />
                </a>
            </div>
        )}
      </div>
    </div>
  );
};