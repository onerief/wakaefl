
import React from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Trophy, AlertCircle } from 'lucide-react';

interface GenerateBracketConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const GenerateBracketConfirmationModal: React.FC<GenerateBracketConfirmationModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <Card className="w-full max-w-xs relative !p-0 overflow-hidden shadow-2xl bg-brand-primary rounded-2xl border border-brand-vibrant/30">
        <div className="bg-gradient-to-r from-brand-vibrant/20 to-black p-3 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xs font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                <Trophy size={14} className="text-brand-vibrant" /> Auto Bracket
            </h3>
            <button onClick={onCancel} className="text-brand-light hover:text-white transition-all bg-white/5 p-1 rounded-full"><X size={12} /></button>
        </div>
        
        <div className="p-4">
            <div className="bg-brand-vibrant/10 p-3 rounded-xl border border-brand-vibrant/20 mb-4 flex gap-3">
                <AlertCircle className="text-brand-vibrant shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-brand-vibrant uppercase tracking-widest">Overwrite Warning</p>
                    <p className="text-[10px] text-brand-light leading-relaxed">
                        Sistem akan membuat bagan knockout baru berdasarkan klasemen grup saat ini. Data knockout yang sudah ada akan <strong>tertimpa</strong>.
                    </p>
                </div>
            </div>
            
            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel} className="!text-[10px] !py-1.5 rounded-lg h-8">
                    Batal
                </Button>
                <Button 
                    type="button" 
                    onClick={onConfirm}
                    className="bg-brand-vibrant text-white hover:bg-blue-600 !text-[10px] !py-1.5 rounded-lg shadow-lg shadow-brand-vibrant/20 font-black uppercase tracking-wider h-8"
                >
                    Generate Bracket
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
};
