
import React, { useState } from 'react';
import type { Match, Team, MatchStatus } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Save, AlertTriangle, Link, Activity, Shield } from 'lucide-react';
import { useToast } from '../shared/Toast';

interface MatchDetailsModalProps {
  match: Match;
  teams: Team[];
  onSave: (matchId: string, updates: Partial<Match>) => void;
  onClose: () => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({ match, teams, onSave, onClose }) => {
  const [teamAId, setTeamAId] = useState(match.teamA.id);
  const [teamBId, setTeamBId] = useState(match.teamB.id);
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [scoreA, setScoreA] = useState<string>(match.scoreA?.toString() ?? '');
  const [scoreB, setScoreB] = useState<string>(match.scoreB?.toString() ?? '');
  const [proofUrl, setProofUrl] = useState(match.proofUrl || '');
  
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (teamAId === teamBId) {
        addToast('Tim tidak boleh sama.', 'error');
        return;
    }

    const teamA = teams.find(t => t.id === teamAId);
    const teamB = teams.find(t => t.id === teamBId);

    if (!teamA || !teamB) {
        addToast('Tim tidak valid.', 'error');
        return;
    }

    const updates: Partial<Match> = {
        teamA,
        teamB,
        status,
        scoreA: scoreA === '' ? null : parseInt(scoreA),
        scoreB: scoreB === '' ? null : parseInt(scoreB),
        proofUrl
    };

    onSave(match.id, updates);
    addToast('Detail pertandingan diperbarui.', 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <Card className="w-full max-w-md sm:max-w-xl relative !p-0 overflow-hidden shadow-2xl bg-brand-primary rounded-2xl border border-brand-vibrant/30">
        <div className="bg-brand-secondary/80 p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-sm sm:text-base font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                <Activity size={16} className="text-brand-vibrant" /> Edit Match Details
            </h3>
            <button onClick={onClose} className="text-brand-light hover:text-white transition-all bg-white/5 p-1 rounded-full"><X size={16} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
            
            {/* Teams Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-light uppercase tracking-wider flex items-center gap-1"><Shield size={10} className="text-brand-vibrant"/> Home Team</label>
                    <select 
                        value={teamAId}
                        onChange={e => setTeamAId(e.target.value)}
                        className="w-full p-2.5 bg-black/20 border border-brand-accent rounded-xl text-white text-xs font-bold outline-none focus:border-brand-vibrant transition-all"
                    >
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-light uppercase tracking-wider flex items-center gap-1"><Shield size={10} className="text-brand-special"/> Away Team</label>
                    <select 
                        value={teamBId}
                        onChange={e => setTeamBId(e.target.value)}
                        className="w-full p-2.5 bg-black/20 border border-brand-accent rounded-xl text-white text-xs font-bold outline-none focus:border-brand-special transition-all"
                    >
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Status & Scores */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-light uppercase tracking-wider">Match Status</label>
                    <div className="flex gap-2">
                        {(['scheduled', 'live', 'finished'] as MatchStatus[]).map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(s)}
                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                    status === s 
                                    ? s === 'live' ? 'bg-red-500 text-white border-red-500' : s === 'finished' ? 'bg-green-500 text-white border-green-500' : 'bg-brand-vibrant text-white border-brand-vibrant'
                                    : 'bg-transparent text-brand-light border-white/10 hover:border-white/30'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-brand-light uppercase tracking-wider text-center block">Score A</label>
                        <input 
                            type="number" 
                            value={scoreA}
                            onChange={e => setScoreA(e.target.value)}
                            placeholder="-"
                            className="w-full text-center py-2 bg-black/40 border border-white/10 rounded-lg text-white font-black text-lg outline-none focus:border-brand-vibrant"
                        />
                    </div>
                    <span className="text-brand-light/30 font-black pt-5">-</span>
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-brand-light uppercase tracking-wider text-center block">Score B</label>
                        <input 
                            type="number" 
                            value={scoreB}
                            onChange={e => setScoreB(e.target.value)}
                            placeholder="-"
                            className="w-full text-center py-2 bg-black/40 border border-white/10 rounded-lg text-white font-black text-lg outline-none focus:border-brand-special"
                        />
                    </div>
                </div>
            </div>

            {/* Proof URL */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-light uppercase tracking-wider flex items-center gap-1"><Link size={10}/> Proof Link</label>
                <input 
                    type="text" 
                    value={proofUrl}
                    onChange={e => setProofUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 bg-black/20 border border-brand-accent rounded-xl text-brand-light text-xs outline-none focus:border-brand-vibrant transition-all"
                />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} className="!text-[10px] !py-2 rounded-lg h-9">
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    className="bg-brand-vibrant text-white hover:bg-blue-600 !text-[10px] !py-2 rounded-lg shadow-lg font-black uppercase tracking-wider border-none h-9 flex items-center gap-2"
                >
                    <Save size={14} /> Update Match
                </Button>
            </div>
        </form>
      </Card>
    </div>
  );
};
