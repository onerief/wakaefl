import React from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, AlertTriangle } from 'lucide-react';

interface GenerateBracketConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const GenerateBracketConfirmationModal: React.FC<GenerateBracketConfirmationModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-lg relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-brand-light hover:text-brand-text transition-colors" aria-label="Close form">
          <X size={24} />
        </button>
        <div className="p-4 text-center">
            <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-brand-text mb-2">Confirm Bracket Generation</h2>
            <p className="text-brand-light mb-6">
                Are you sure? This will overwrite any existing knockout stage data based on the current group standings. This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button 
                    type="button" 
                    onClick={onConfirm}
                    className="bg-yellow-600 text-white hover:bg-yellow-700"
                >
                    Yes, Generate Bracket
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
};
