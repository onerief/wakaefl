import React, { useState, useMemo } from 'react';
import type { Team, Group } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { TeamLogo } from '../shared/TeamLogo';

interface MoveTeamModalProps {
  team: Team;
  groups: Group[];
  onSave: (destinationGroupId: string) => void;
  onClose: () => void;
}

export const MoveTeamModal: React.FC<MoveTeamModalProps> = ({ team, groups, onSave, onClose }) => {
  const { addToast } = useToast();

  const currentGroup = useMemo(() => 
    groups.find(g => g.teams.some(t => t.id === team.id)),
    [groups, team.id]
  );
  
  const destinationOptions = useMemo(() =>
    groups.filter(g => g.id !== currentGroup?.id),
    [groups, currentGroup]
  );

  const [destinationGroupId, setDestinationGroupId] = useState(destinationOptions[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationGroupId) {
        addToast("Please select a destination group.", 'error');
        return;
    }
    onSave(destinationGroupId);
  };


  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-brand-text transition-colors" aria-label="Close form">
          <X size={24} />
        </button>
        <div className="p-4">
          <h2 className="text-2xl font-bold text-brand-text mb-4 text-center">Move Team</h2>
          <div className="flex flex-col items-center gap-2 mb-6 text-center">
             <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-12 h-12" />
             <p className="font-semibold text-xl">{team.name}</p>
             <p className="text-sm text-brand-light">Currently in: <strong>{currentGroup?.name}</strong></p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="destination-group" className="block text-sm font-medium text-brand-light mb-1">Move to Group</label>
              <select
                id="destination-group"
                value={destinationGroupId}
                onChange={e => setDestinationGroupId(e.target.value)}
                className="w-full p-2 bg-brand-primary border border-brand-accent rounded-md text-brand-text focus:ring-2 focus:ring-brand-cyan"
              >
                {destinationOptions.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-xs text-yellow-800 bg-yellow-50 p-3 rounded-md border border-yellow-200 flex gap-3">
                <AlertTriangle size={32} className="flex-shrink-0 text-yellow-500" />
                <div>
                    <strong>Warning:</strong> Moving a team will delete all existing matches and reset standings for both the original group ({currentGroup?.name}) and the new destination group. This action cannot be undone.
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit"><Save size={16}/> Confirm Move</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};