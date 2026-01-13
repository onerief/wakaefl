
import React, { useState } from 'react';
import type { Match, Team } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Save } from 'lucide-react';
import { useToast } from '../shared/Toast';

interface MatchScheduleEditorProps {
  match: Match;
  teams: Team[];
  onSave: (matchId: string, teamAId: string, teamBId: string) => void;
  onClose: () => void;
}

export const MatchScheduleEditor: React.FC<MatchScheduleEditorProps> = ({ match, teams, onSave, onClose }) => {
  const [teamAId, setTeamAId] = useState(match.teamA.id);
  const [teamBId, setTeamBId] = useState(match.teamB.id);
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamAId === teamBId) {
      addToast("A team cannot play against itself.", 'error');
      return;
    }
    onSave(match.id, teamAId, teamBId);
  };

  const TeamSelect = ({ id, label, value, onChange }: { id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-brand-light mb-1">{label}</label>
        <select
          id={id}
          value={value}
          onChange={onChange}
          className="w-full p-2 bg-brand-primary border border-brand-accent rounded-md text-brand-text focus:ring-2 focus:ring-brand-vibrant"
        >
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
      <Card className="w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-brand-text transition-colors" aria-label="Close form">
          <X size={24} />
        </button>
        <div className="p-4">
          <h2 className="text-2xl font-bold text-brand-text mb-4 text-center">Edit Match Schedule</h2>
          <p className="text-center text-brand-light text-sm mb-2">Group {match.group}</p>
          <div className="flex items-center justify-center gap-4 mb-6 text-center">
              <span className="font-semibold flex-1 truncate">{match.teamA.name}</span>
              <span className="text-brand-light">vs</span>
              <span className="font-semibold flex-1 truncate">{match.teamB.name}</span>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <TeamSelect 
                id="team-a-select"
                label="Team A"
                value={teamAId}
                onChange={e => setTeamAId(e.target.value)}
            />
            <TeamSelect
                id="team-b-select"
                label="Team B"
                value={teamBId}
                onChange={e => setTeamBId(e.target.value)}
            />
            
            <div className="text-xs text-yellow-300 bg-yellow-900/30 p-3 rounded-md border border-yellow-700/50">
                <strong>Warning:</strong> Changing teams will reset the match score and status to 'scheduled'.
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit"><Save size={16}/> Save Changes</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
