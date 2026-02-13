
import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Calendar, RefreshCw, AlertTriangle, ArrowRightLeft, Repeat } from 'lucide-react';

interface FixtureGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (type: 'single' | 'double') => void;
  groupCount: number;
}

export const FixtureGeneratorModal: React.FC<FixtureGeneratorModalProps> = ({ isOpen, onClose, onGenerate, groupCount }) => {
  const [selectedType, setSelectedType] = useState<'single' | 'double'>('double');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] backdrop-blur-md p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md relative !p-0 overflow-hidden shadow-2xl bg-brand-primary rounded-2xl border border-brand-vibrant/30">
        <div className="bg-brand-secondary/80 p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-sm font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                <Calendar size={16} className="text-brand-vibrant" /> Fixture Generator
            </h3>
            <button onClick={onClose} className="text-brand-light hover:text-white transition-all bg-white/5 p-1 rounded-full"><X size={16} /></button>
        </div>
        
        <div className="p-5 space-y-6">
            <div className="bg-brand-vibrant/10 p-3 rounded-xl border border-brand-vibrant/20 flex gap-3">
                <AlertTriangle className="text-brand-vibrant shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-brand-vibrant uppercase tracking-widest">Perhatian</p>
                    <p className="text-[10px] text-brand-light leading-relaxed">
                        Generator ini akan <strong>menghapus semua jadwal pertandingan</strong> yang ada di {groupCount} grup saat ini dan membuat jadwal baru berdasarkan format yang dipilih. Skor yang sudah ada akan hilang.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[10px] font-bold text-brand-light uppercase tracking-widest ml-1">Pilih Format Liga</p>
                
                <button 
                    onClick={() => setSelectedType('single')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${selectedType === 'single' ? 'bg-brand-vibrant text-white border-brand-vibrant shadow-lg' : 'bg-black/20 border-white/10 text-brand-light hover:bg-white/5'}`}
                >
                    <div className={`p-2 rounded-lg ${selectedType === 'single' ? 'bg-white/20' : 'bg-white/5'}`}>
                        <ArrowRightLeft size={20} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-xs font-black uppercase tracking-wider">Single Round Robin</h4>
                        <p className={`text-[10px] mt-0.5 ${selectedType === 'single' ? 'text-white/80' : 'text-brand-light/50'}`}>
                            Setiap tim bertemu 1 kali (1 Leg). Cepat & Singkat.
                        </p>
                    </div>
                </button>

                <button 
                    onClick={() => setSelectedType('double')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${selectedType === 'double' ? 'bg-brand-special text-brand-primary border-brand-special shadow-lg' : 'bg-black/20 border-white/10 text-brand-light hover:bg-white/5'}`}
                >
                    <div className={`p-2 rounded-lg ${selectedType === 'double' ? 'bg-black/10' : 'bg-white/5'}`}>
                        <Repeat size={20} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-xs font-black uppercase tracking-wider">Double Round Robin</h4>
                        <p className={`text-[10px] mt-0.5 ${selectedType === 'double' ? 'text-brand-primary/70' : 'text-brand-light/50'}`}>
                            Home & Away (2 Leg). Format Liga Standar.
                        </p>
                    </div>
                </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <Button type="button" variant="secondary" onClick={onClose} className="!text-[10px] !py-2.5 rounded-lg">
                    Batal
                </Button>
                <Button 
                    type="button" 
                    onClick={() => { onGenerate(selectedType); onClose(); }}
                    className="!text-[10px] !py-2.5 rounded-lg shadow-lg font-black uppercase tracking-wider border-none flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                    <RefreshCw size={14} /> Generate Jadwal
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
};
