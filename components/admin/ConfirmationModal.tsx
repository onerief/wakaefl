
import React from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmButtonClass?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  icon?: React.ElementType;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmButtonClass, variant = 'danger', icon: CustomIcon
}) => {
  if (!isOpen) return null;

  const style = {
      danger: { icon: AlertTriangle, color: 'text-red-500', border: 'border-red-500/30', bg: 'bg-red-500/10', btn: 'bg-red-600 hover:bg-red-700' },
      warning: { icon: AlertTriangle, color: 'text-yellow-500', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', btn: 'bg-yellow-600 hover:bg-yellow-700' },
      success: { icon: CheckCircle, color: 'text-green-500', border: 'border-green-500/30', bg: 'bg-green-500/10', btn: 'bg-green-600 hover:bg-green-700' },
      info: { icon: Info, color: 'text-brand-vibrant', border: 'border-brand-vibrant/30', bg: 'bg-brand-vibrant/10', btn: 'bg-brand-vibrant hover:bg-blue-600' }
  }[variant];

  const Icon = CustomIcon || style.icon;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className={`w-full max-w-xs relative !p-0 overflow-hidden shadow-2xl bg-brand-primary rounded-2xl border ${style.border}`}>
        <div className="bg-brand-secondary/80 p-3 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xs font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
               <Icon size={14} className={style.color} />
               {title}
            </h3>
            <button onClick={onClose} className="text-brand-light hover:text-white transition-all bg-white/5 p-1 rounded-full"><X size={12} /></button>
        </div>
        
        <div className="p-4">
            <div className={`text-[10px] text-brand-light leading-relaxed ${style.bg} p-3 rounded-xl border ${style.border} mb-4`}>
                {message}
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onClose} className="!text-[10px] !py-1.5 !px-3 rounded-lg h-8">
                    Batal
                </Button>
                <Button 
                    type="button" 
                    onClick={() => { onConfirm(); onClose(); }}
                    className={`${confirmButtonClass || style.btn} text-white !text-[10px] !py-1.5 !px-3 rounded-lg shadow-lg font-black uppercase tracking-wider border-none h-8 flex items-center gap-2`}
                >
                    {confirmText}
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
};
