
import React, { useState } from 'react';
import type { KnockoutStageRounds, Team } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Trophy, Shield, Info, ChevronDown, Plus, Hash } from 'lucide-react';
import { useToast } from '../shared/Toast';

interface KnockoutMatchFormProps {
  round: keyof KnockoutStageRounds;
  teams: Team[];
  onSave: (
    round: keyof KnockoutStageRounds, 
    teamAId: string | null, 
    teamBId: string | null, 
    placeholderA: string, 
    placeholderB: string,
    matchNumber: number
  ) => void;
  onClose: () => void;
}

const ROUND_OPTIONS: (keyof KnockoutStageRounds)[] = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

export const KnockoutMatchForm: React.FC<KnockoutMatchFormProps> = ({ round: initialRound, teams, onSave, onClose }) => {
  const [selectedRound, setSelectedRound] = useState<keyof KnockoutStageRounds>(initialRound);
  const [teamAId, setTeamAId] = useState<string | null>(null);
  const [teamBId, setTeamBId] = useState<string | null>(null);
  const [placeholderA, setPlaceholderA] = useState('');
  const [placeholderB, setPlaceholderB] = useState('');
  const [matchNumber, setMatchNumber] = useState<number>(1);
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamAId && !placeholderA.trim()) {
        addToast("Silakan pilih Tim A atau masukkan placeholder.", 'error');
        return;
    }
    if (!teamBId && !placeholderB.trim()) {
        addToast("Silakan pilih Tim B atau masukkan placeholder.", 'error');
        return;
    }

    onSave(
        selectedRound, 
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md sm:max-w-3xl relative !p-0 overflow-hidden shadow-2xl !bg-brand-primary border-brand-vibrant/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-brand-secondary/50 p-6 border-b border-white/5 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-vibrant/10 rounded-xl text-brand-vibrant">
                    <Trophy size={20} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">
                    Tambah Match Knockout
                </h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-brand-light hover:text-white flex items-center justify-center transition-all">
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            
            {/* General Match Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-brand-vibrant/5 p-4 rounded-2xl border border-brand-vibrant/10">
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest flex items-center gap-2">
                        <Shield size={12} className="text-brand-vibrant" /> Babak Pertandingan
                    </label>
                    <div className="relative">
                        <select
                            value={selectedRound}
                            onChange={(e) => setSelectedRound(e.target.value as keyof KnockoutStageRounds)}
                            className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-xl text-white font-bold text-sm focus:ring-2 focus:ring-brand-vibrant outline-none appearance-none"
                        >
                            {ROUND_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-light pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest flex items-center gap-2">
                        <Hash size={12} className="text-brand-vibrant" /> No. Pertandingan
                    </label>
                    <input
                        type="number"
                        value={matchNumber}
                        onChange={(e) => setMatchNumber(parseInt(e.target.value) || 1)}
                        className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-xl text-white font-bold text-sm focus:ring-2 focus:ring-brand-vibrant outline-none"
                        min="1"
                        placeholder="Urutan Bracket (1, 2, 3...)"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A Selection */}
                <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-black text-brand-vibrant uppercase tracking-[0.2em] pb-2 border-b border-white/5">Tim A (Home)</h4>
                    
                    <div>
                        <label htmlFor="team-a" className="block text-[10px] font-bold text-brand-light uppercase mb-1.5">Pilih Tim Terdaftar</label>
                        <select
                            id="team-a"
                            value={teamAId ?? 'TBD'}
                            onChange={handleTeamAChange}
                            className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-lg text-white text-xs focus:ring-1 focus:ring-brand-vibrant"
                        >
                            <option value="TBD">-- Gunakan Placeholder --</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center"><span className="bg-brand-primary px-2 text-[8px] font-black text-brand-light/30 uppercase tracking-widest">Atau</span></div>
                    </div>

                    <div>
                        <label htmlFor="placeholder-a" className="block text-[10px] font-bold text-brand-light uppercase mb-1.5">Ketik Placeholder</label>
                        <input
                            id="placeholder-a"
                            type="text"
                            value={placeholderA}
                            onChange={(e) => setPlaceholderA(e.target.value)}
                            className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-lg text-white text-xs focus:ring-1 focus:ring-brand-vibrant disabled:opacity-30"
                            disabled={!!teamAId}
                            placeholder={teamAId ? "Using selected team" : "Misal: Winner QF1"}
                        />
                    </div>
                </div>

                {/* Team B Selection */}
                <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-black text-brand-special uppercase tracking-[0.2em] pb-2 border-b border-white/5">Tim B (Away)</h4>
                    
                    <div>
                        <label htmlFor="team-b" className="block text-[10px] font-bold text-brand-light uppercase mb-1.5">Pilih Tim Terdaftar</label>
                        <select
                            id="team-b"
                            value={teamBId ?? 'TBD'}
                            onChange={handleTeamBChange}
                            className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-lg text-white text-xs focus:ring-1 focus:ring-brand-vibrant"
                        >
                            <option value="TBD">-- Gunakan Placeholder --</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center"><span className="bg-brand-primary px-2 text-[8px] font-black text-brand-light/30 uppercase tracking-widest">Atau</span></div>
                    </div>

                    <div>
                        <label htmlFor="placeholder-b" className="block text-[10px] font-bold text-brand-light uppercase mb-1.5">Ketik Placeholder</label>
                        <input
                            id="placeholder-b"
                            type="text"
                            value={placeholderB}
                            onChange={(e) => setPlaceholderB(e.target.value)}
                            className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-lg text-white text-xs focus:ring-1 focus:ring-brand-vibrant disabled:opacity-30"
                            disabled={!!teamBId}
                            placeholder={teamBId ? "Using selected team" : "Misal: Winner QF2"}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
              <Button type="button" variant="secondary" onClick={onClose} className="px-6">Batal</Button>
              <Button type="submit" className="px-8 shadow-lg shadow-brand-vibrant/20">
                  <Plus size={18} /> Simpan Pertandingan
              </Button>
            </div>
        </form>
      </Card>
    </div>
  );
};
