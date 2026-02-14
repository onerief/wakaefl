
import React from 'react';
import { Card } from '../shared/Card';
import { X, BookOpen, ShieldCheck } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: string;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, rules }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-2xl relative max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="!p-0 !bg-brand-primary/95 border-brand-accent shadow-2xl flex flex-col overflow-hidden h-full rounded-[2rem]">
            {/* Header */}
            <div className="bg-brand-secondary/50 p-5 border-b border-white/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-vibrant/20 rounded-xl text-brand-vibrant">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white italic uppercase tracking-tighter">Peraturan Resmi</h2>
                        <p className="text-[10px] text-brand-light uppercase tracking-widest">WakaEFL Hub Rulebook</p>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-brand-light hover:text-white flex items-center justify-center transition-all"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-black/20">
                {rules ? (
                    <div className="prose prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-xs sm:text-sm text-brand-light leading-relaxed font-medium">
                            {rules}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-brand-light/30 flex flex-col items-center">
                        <ShieldCheck size={48} className="mb-4 opacity-50" />
                        <p className="text-xs font-black uppercase tracking-widest">Belum ada peraturan yang ditetapkan.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-brand-secondary/30 shrink-0 text-center">
                <p className="text-[9px] text-brand-light/40 italic">
                    Keputusan admin bersifat mutlak dan tidak dapat diganggu gugat.
                </p>
            </div>
        </Card>
      </div>
    </div>
  );
};
