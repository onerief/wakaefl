import React from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, AlertTriangle } from 'lucide-react';

interface ResetConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-lg relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-brand-light hover:text-brand-text transition-colors" aria-label="Close form">
          <X size={24} />
        </button>
        <div className="p-4 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-brand-text mb-2">Confirm Tournament Reset</h2>
            <p className="text-brand-light mb-6">
                Are you sure you want to start a new tournament? This action is irreversible and will permanently delete all current teams, groups, matches, and knockout stage data.
            </p>
            <div className="flex justify-center gap-4">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button 
                    type="button" 
                    onClick={onConfirm}
                    className="bg-red-600 text-white hover:bg-red-700"
                >
                    Yes, Reset Everything
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
};