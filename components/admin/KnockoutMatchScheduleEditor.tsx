
import React, { useState } from 'react';
import type { KnockoutMatch, Team } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Save, Hash } from 'lucide-react';
import { useToast } from '../shared/Toast';

interface KnockoutMatchScheduleEditorProps {
  match: KnockoutMatch;
  teams: Team[];
  onSave: (matchId: string, teamAId: string | null, teamBId: string | null, placeholderA: string, placeholderB: string, matchNumber: number) => void;
  onClose: () => void;
}

export const KnockoutMatchScheduleEditor: React.FC<KnockoutMatchScheduleEditorProps> = ({ match, teams, onSave, onClose }) => {
  const [teamAId, setTeamAId] = useState<string | null>(match.teamA?.id ?? null);
  const [teamBId, setTeamBId] = useState<string | null>(match.teamB?.id ?? null);
  const [placeholderA, setPlaceholderA] = useState(match.placeholderA ?? '');
  const [placeholderB, setPlaceholderB] = useState(match.placeholderB ?? '');
  const [matchNumber, setMatchNumber] = useState<number>(match.matchNumber || 1);
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
        match.id,
        teamAId, 
        teamBId, 
        teamAId ? '' : placeholderA.trim(), 
        teamBId ? '' : placeholderB.trim(),
        matchNumber
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md sm:max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-brand-text transition-colors" aria-label="Close form">
          <X size={24} />
        </button>
        <div className="p-4">
          <h2 className="text-2xl font-bold text-brand-text mb-2 text-center">Edit Match Details</h2>
          <p className="text-center text-brand-light text-sm mb-6">{match.round}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Match Order */}
            <div className="bg-brand-secondary/40 p-4 rounded-xl border border-white/5">
                <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Hash size={12} className="text-brand-vibrant" /> Nomor Pertandingan (Order)
                </label>
                <input
                    type="number"
                    value={matchNumber}
                    onChange={(e) => setMatchNumber(parseInt(e.target.value) || 1)}
                    className="w-full max-w-[120px] p-2 bg-brand-primary border border-brand-accent rounded-lg text-white font-bold text-sm focus:ring-2 focus:ring-brand-vibrant outline-none"
                    min="1"
                />
            </div>

            {/* Team A */}
            <fieldset className="space-y-4 border border-white/5 bg-black/20 p-4 rounded-xl">
              <legend className="text-xs font-black text-brand-vibrant uppercase tracking-[0.2em] px-2 bg-brand-primary rounded border border-white/5">Team A (Home)</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="team-a" className="block text-[10px] font-bold text-brand-light uppercase mb-1">Select Team</label>
                  <select
                    id="team-a"
                    value={teamAId ?? 'TBD'}
                    onChange={handleTeamAChange}
                    className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-lg text-white text-xs focus:ring-2 focus:ring-brand-vibrant"
                  >
                    <option value="TBD">TBD / Use Placeholder</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="placeholder-a" className="block text-[10px] font-bold text-brand-light uppercase mb-1">Set Placeholder</label>
                  <input
                    id="placeholder-a"
                    type="text"
                    value={placeholderA}
                    onChange={(e) => setPlaceholderA(e.target.value)}
                    className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-lg text-white text-xs focus:ring-2 focus:ring-brand-vibrant disabled:opacity-30"
                    disabled={!!teamAId}
                    placeholder={teamAId ? "Team Selected" : "e.g., Winner QF1"}
                  />
                </div>
              </div>
            </fieldset>

            {/* Team B */}
            <fieldset className="space-y-4 border border-white/5 bg-black/20 p-4 rounded-xl">
              <legend className="text-xs font-black text-brand-special uppercase tracking-[0.2em] px-2 bg-brand-primary rounded border border-white/5">Team B (Away)</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="team-b" className="block text-[10px] font-bold text-brand-light uppercase mb-1">Select Team</label>
                  <select
                    id="team-b"
                    value={teamBId ?? 'TBD'}
                    onChange={handleTeamBChange}
                    className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-lg text-white text-xs focus:ring-2 focus:ring-brand-vibrant"
                  >
                    <option value="TBD">TBD / Use Placeholder</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="placeholder-b" className="block text-[10px] font-bold text-brand-light uppercase mb-1">Set Placeholder</label>
                  <input
                    id="placeholder-b"
                    type="text"
                    value={placeholderB}
                    onChange={(e) => setPlaceholderB(e.target.value)}
                    className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-lg text-white text-xs focus:ring-2 focus:ring-brand-vibrant disabled:opacity-30"
                    disabled={!!teamBId}
                    placeholder={teamBId ? "Team Selected" : "e.g., Winner QF2"}
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={onClose} className="px-6">Cancel</Button>
              <Button type="submit" className="px-8 shadow-lg shadow-brand-vibrant/20"><Save size={16} /> Save Changes</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
