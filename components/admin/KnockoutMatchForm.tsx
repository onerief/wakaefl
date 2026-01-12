import React, { useState } from 'react';
import type { KnockoutStageRounds, Team } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X } from 'lucide-react';
import { useToast } from '../shared/Toast';

interface KnockoutMatchFormProps {
  round: keyof KnockoutStageRounds;
  teams: Team[];
  onSave: (
    round: keyof KnockoutStageRounds, 
    teamAId: string | null, 
    teamBId: string | null, 
    placeholderA: string, 
    placeholderB: string
  ) => void;
  onClose: () => void;
}

export const KnockoutMatchForm: React.FC<KnockoutMatchFormProps> = ({ round, teams, onSave, onClose }) => {
  const [teamAId, setTeamAId] = useState<string | null>(null);
  const [teamBId, setTeamBId] = useState<string | null>(null);
  const [placeholderA, setPlaceholderA] = useState('');
  const [placeholderB, setPlaceholderB] = useState('');
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamAId && !placeholderA.trim()) {
        addToast("Please select Team A or provide a placeholder.", 'error');
        return;
    }
    if (!teamBId && !placeholderB.trim()) {
        addToast("Please select Team B or provide a placeholder.", 'error');
        return;
    }

    onSave(
        round, 
        teamAId, 
        teamBId, 
        teamAId ? '' : placeholderA.trim(), 
        teamBId ? '' : placeholderB.trim()
    );
  };
  
  const handleTeamAChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === 'TBD') {
        setTeamAId(null);
      } else {
        setTeamAId(value);
        setPlaceholderA('');
      }
  };

  const handleTeamBChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === 'TBD') {
        setTeamBId(null);
      } else {
        setTeamBId(value);
        setPlaceholderB('');
      }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-brand-text transition-colors" aria-label="Close form">
          <X size={24} />
        </button>
        <div className="p-4">
          <h2 className="text-2xl font-bold text-brand-text mb-6 text-center">Add Match to {round}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Team A */}
            <fieldset className="space-y-2 border border-brand-accent p-4 rounded-lg">
              <legend className="text-lg font-semibold text-brand-text px-2">Team A</legend>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="w-full md:w-5/12">
                  <label htmlFor="team-a" className="block text-sm font-medium text-brand-light mb-1">Select Team</label>
                  <select
                    id="team-a"
                    value={teamAId ?? 'TBD'}
                    onChange={handleTeamAChange}
                    className="w-full p-2 bg-brand-primary border border-brand-accent rounded-md text-brand-text focus:ring-2 focus:ring-brand-vibrant"
                  >
                    <option value="TBD">TBD / Use Placeholder</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div className="text-brand-light font-semibold hidden md:block">OR</div>
                <div className="w-full md:w-5/12">
                  <label htmlFor="placeholder-a" className="block text-sm font-medium text-brand-light mb-1">Set Placeholder</label>
                  <input
                    id="placeholder-a"
                    type="text"
                    value={placeholderA}
                    onChange={(e) => setPlaceholderA(e.target.value)}
                    className="w-full p-2 bg-brand-primary border border-brand-accent rounded-md text-brand-text focus:ring-2 focus:ring-brand-vibrant disabled:opacity-50 disabled:bg-brand-secondary"
                    disabled={!!teamAId}
                    placeholder={teamAId ? "Using selected team" : "e.g., Winner QF1"}
                  />
                </div>
              </div>
            </fieldset>

            {/* Team B */}
            <fieldset className="space-y-2 border border-brand-accent p-4 rounded-lg">
              <legend className="text-lg font-semibold text-brand-text px-2">Team B</legend>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="w-full md:w-5/12">
                  <label htmlFor="team-b" className="block text-sm font-medium text-brand-light mb-1">Select Team</label>
                  <select
                    id="team-b"
                    value={teamBId ?? 'TBD'}
                    onChange={handleTeamBChange}
                    className="w-full p-2 bg-brand-primary border border-brand-accent rounded-md text-brand-text focus:ring-2 focus:ring-brand-vibrant"
                  >
                    <option value="TBD">TBD / Use Placeholder</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div className="text-brand-light font-semibold hidden md:block">OR</div>
                <div className="w-full md:w-5/12">
                  <label htmlFor="placeholder-b" className="block text-sm font-medium text-brand-light mb-1">Set Placeholder</label>
                  <input
                    id="placeholder-b"
                    type="text"
                    value={placeholderB}
                    onChange={(e) => setPlaceholderB(e.target.value)}
                    className="w-full p-2 bg-brand-primary border border-brand-accent rounded-md text-brand-text focus:ring-2 focus:ring-brand-vibrant disabled:opacity-50 disabled:bg-brand-secondary"
                    disabled={!!teamBId}
                    placeholder={teamBId ? "Using selected team" : "e.g., Winner QF2"}
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit">Add Match</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};