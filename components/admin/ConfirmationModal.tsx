
import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmButtonClass?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmButtonClass = 'bg-red-600 text-white hover:bg-red-700'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm">
      <Card className="w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-brand-text transition-colors" aria-label="Close modal">
          <X size={24} />
        </button>
        <div className="p-4 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-brand-text mb-2">{title}</h2>
            <div className="text-brand-light mb-6">
                {message}
            </div>
            <div className="flex justify-center gap-4">
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button 
                    type="button" 
                    onClick={onConfirm}
                    className={confirmButtonClass}
                >
                    {confirmText}
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
};
