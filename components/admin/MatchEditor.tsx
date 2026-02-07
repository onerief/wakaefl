
import React, { useState } from 'react';
import type { Match } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Sparkles, Save, Pencil, Link, Plus, Minus } from 'lucide-react';
import { Spinner } from '../shared/Spinner';
import { useToast } from '../shared/Toast';
import { TeamLogo } from '../shared/TeamLogo';

interface MatchEditorProps {
  match: Match;
  onUpdateScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
  onGenerateSummary: (matchId: string) => Promise<string>;
  onEditSchedule: (match: Match) => void;
}

export const MatchEditor: React.FC<MatchEditorProps> = ({ match, onUpdateScore, onGenerateSummary, onEditSchedule }) => {
  const [scoreA, setScoreA] = useState<number>(match.scoreA ?? 0);
  const [scoreB, setScoreB] = useState<number>(match.scoreB ?? 0);
  const [proofUrl, setProofUrl] = useState(match.proofUrl ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  const handleSave = () => {
    try {
        onUpdateScore(match.id, scoreA, scoreB, proofUrl);
        addToast('Skor berhasil disimpan!', 'success');
    } catch (e) {
        console.error(e);
        addToast('Gagal menyimpan skor.', 'error');
    }
  };

  const adjustScore = (team: 'A' | 'B', delta: number) => {
    if (team === 'A') {
        setScoreA(prev => Math.max(0, prev + delta));
    } else {
        setScoreB(prev => Math.max(0, prev + delta));
    }
  };

  const handleGenerate = async () => {
      if (match.status !== 'finished') {
          addToast('Simpan skor terlebih dahulu.', 'error');
          return;
      }
      setIsGenerating(true);
      try {
        await onGenerateSummary(match.id);
        addToast('Ringkasan AI dibuat!', 'success');
      } catch (e) {
          addToast('Gagal membuat ringkasan.', 'error');
      } finally {
        setIsGenerating(false);
      }
  }

  return (
    <Card className="!p-4 bg-brand-primary/60 border-brand-accent hover:border-brand-vibrant transition-all">
      <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-brand-vibrant bg-brand-vibrant/10 px-2 py-1 rounded uppercase tracking-tighter">
                Matchday {match.matchday}
            </span>
            <span className="text-[10px] font-bold text-brand-light/40 uppercase">Leg {match.leg}</span>
          </div>
          <button 
            onClick={() => onEditSchedule(match)} 
            className="p-1.5 text-brand-light hover:text-white bg-white/5 rounded-lg transition-colors"
          >
              <Pencil size={14} />
          </button>
      </div>
     
      <div className="flex flex-col gap-6">
        {/* Teams & Scores Area */}
        <div className="flex items-center justify-between gap-2">
            
            {/* Team A Section */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-12 h-12 sm:w-14 sm:h-14" />
                <span className="font-black text-white text-[10px] sm:text-xs uppercase truncate w-full text-center">{match.teamA.name}</span>
                
                {/* Score Controls A */}
                <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-1">
                    <button onClick={() => adjustScore('A', -1)} className="p-2 text-brand-light hover:text-red-400"><Minus size={16} /></button>
                    <input 
                        type="number" 
                        value={scoreA}
                        onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                        className="w-10 text-center bg-transparent font-black text-xl text-brand-vibrant focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button onClick={() => adjustScore('A', 1)} className="p-2 text-brand-light hover:text-green-400"><Plus size={16} /></button>
                </div>
            </div>

            <div className="text-brand-light/20 font-black italic text-xl">VS</div>

            {/* Team B Section */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-12 h-12 sm:w-14 sm:h-14" />
                <span className="font-black text-white text-[10px] sm:text-xs uppercase truncate w-full text-center">{match.teamB.name}</span>
                
                {/* Score Controls B */}
                <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-1">
                    <button onClick={() => adjustScore('B', -1)} className="p-2 text-brand-light hover:text-red-400"><Minus size={16} /></button>
                    <input 
                        type="number" 
                        value={scoreB}
                        onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                        className="w-10 text-center bg-transparent font-black text-xl text-brand-vibrant focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button onClick={() => adjustScore('B', 1)} className="p-2 text-brand-light hover:text-green-400"><Plus size={16} /></button>
                </div>
            </div>
        </div>

        {/* Proof URL & Summary Button */}
        <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="relative">
                <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" />
                <input
                    type="text"
                    value={proofUrl}
                    onChange={e => setProofUrl(e.target.value)}
                    className="w-full py-2.5 pl-9 pr-3 bg-black/30 border border-brand-accent rounded-xl text-xs text-brand-light placeholder:text-brand-light/20 focus:border-brand-vibrant outline-none"
                    placeholder="Link Bukti (Video/SS)..."
                />
            </div>

            <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-grow !py-3 bg-green-600 hover:bg-green-700 border-none shadow-lg shadow-green-900/20">
                    <Save size={18}/> <span>Update Skor</span>
                </Button>
                
                <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || match.status !== 'finished'} 
                    variant="secondary" 
                    className="!px-4 bg-white/5 border-white/10"
                    title="Generate Summary AI"
                >
                    {isGenerating ? <Spinner size={16} /> : <Sparkles size={18} className="text-brand-special" />}
                </Button>
            </div>
        </div>
      </div>
    </Card>
  );
};
