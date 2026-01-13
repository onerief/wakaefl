
import React, { useState } from 'react';
import type { Match } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Sparkles, Save, Pencil, Link } from 'lucide-react';
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
  const [scoreA, setScoreA] = useState(match.scoreA?.toString() ?? '');
  const [scoreB, setScoreB] = useState(match.scoreB?.toString() ?? '');
  const [proofUrl, setProofUrl] = useState(match.proofUrl ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleSave = () => {
    const numA = parseInt(scoreA, 10);
    const numB = parseInt(scoreB, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      onUpdateScore(match.id, numA, numB, proofUrl);
      addToast('Score saved!', 'success');
    } else {
      addToast('Invalid score.', 'error');
    }
  };

  const handleGenerate = async () => {
      if (match.status !== 'finished') {
          const message = 'Please save final score first.';
          setError(message);
          addToast(message, 'error');
          return;
      }
      setError('');
      setIsGenerating(true);
      try {
        await onGenerateSummary(match.id);
        addToast('Summary generated!', 'success');
      } catch (e) {
          const message = 'Failed to generate summary.';
          setError(message);
          addToast(message, 'error');
          console.error(e);
      } finally {
        setIsGenerating(false);
      }
  }

  return (
    <Card className="!p-3 bg-brand-primary hover:!ring-brand-vibrant relative transition-all">
      <div className="flex justify-between items-center mb-3">
           <span className="text-[10px] font-bold text-brand-vibrant bg-brand-vibrant/10 px-2 py-0.5 rounded-full">
            MD {match.matchday}
          </span>
          <div className="flex gap-2 items-center">
              <span className="text-[10px] font-bold text-brand-light opacity-50 uppercase">Leg {match.leg}</span>
              <button 
                onClick={() => onEditSchedule(match)} 
                className="p-2 -m-2 text-brand-light hover:text-white transition-colors" 
                title="Edit Match Schedule"
              >
                  <Pencil size={14} />
              </button>
          </div>
      </div>
     
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-3">
        {/* Team A */}
        <div className="flex flex-col items-center justify-center text-center gap-1 min-w-0">
            <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-10 h-10" />
            <span className="font-semibold text-brand-text truncate text-xs leading-tight w-full">{match.teamA.name}</span>
        </div>

        {/* Score Inputs Center */}
        <div className="flex items-center gap-2">
            <input 
                id={`scoreA-${match.id}`} 
                type="number" 
                inputMode="numeric"
                value={scoreA} 
                onChange={e => setScoreA(e.target.value)} 
                className="w-12 h-12 text-center bg-brand-secondary border border-brand-accent rounded-xl text-brand-text font-bold text-xl focus:ring-2 focus:ring-brand-vibrant touch-manipulation appearance-none" 
                placeholder="-" 
            />
            <div className="text-brand-light text-xs font-bold px-1">-</div>
            <input 
                id={`scoreB-${match.id}`} 
                type="number" 
                inputMode="numeric"
                value={scoreB} 
                onChange={e => setScoreB(e.target.value)} 
                className="w-12 h-12 text-center bg-brand-secondary border border-brand-accent rounded-xl text-brand-text font-bold text-xl focus:ring-2 focus:ring-brand-vibrant touch-manipulation appearance-none" 
                placeholder="-" 
            />
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center justify-center text-center gap-1 min-w-0">
            <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-10 h-10" />
            <span className="font-semibold text-brand-text truncate text-xs leading-tight w-full">{match.teamB.name}</span>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-brand-accent/30">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Link size={14} className="text-brand-light" />
            </div>
            <input
                type="text"
                value={proofUrl}
                onChange={e => setProofUrl(e.target.value)}
                className="w-full py-2 pl-8 pr-2 bg-brand-secondary border border-brand-accent rounded-lg text-brand-text text-sm placeholder:text-brand-accent/80 focus:ring-1 focus:ring-brand-vibrant outline-none"
                placeholder="Proof Link..."
            />
          </div>
          
          <Button onClick={handleSave} className="!py-2 !px-4 h-10 text-sm shrink-0 bg-green-600 hover:bg-green-700 border-none">
              <Save size={16}/>
          </Button>
          
          {/* Optional: Summary AI Button */}
          {match.status === 'finished' && (
              <Button onClick={handleGenerate} disabled={isGenerating} variant="secondary" className="!py-2 !px-3 h-10 w-10 shrink-0 flex items-center justify-center">
                  {isGenerating ? <Spinner size={14} /> : <Sparkles size={16} className="text-brand-special" />}
              </Button>
          )}
      </div>

        {error && <p className="text-red-400 text-[10px] mt-2 text-center">{error}</p>}
        {match.summary && !isGenerating && (
            <div className="bg-brand-secondary/30 p-2 rounded mt-2 border border-white/5">
                <p className="text-[10px] text-brand-light italic line-clamp-2">"{match.summary}"</p>
            </div>
        )}
    </Card>
  );
};
