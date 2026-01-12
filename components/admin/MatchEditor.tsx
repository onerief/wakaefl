
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
      addToast('Match score saved successfully!', 'success');
    } else {
      addToast('Invalid score format.', 'error');
    }
  };

  const handleGenerate = async () => {
      if (match.status !== 'finished') {
          const message = 'Please save a final score before generating a summary.';
          setError(message);
          addToast(message, 'error');
          return;
      }
      setError('');
      setIsGenerating(true);
      try {
        await onGenerateSummary(match.id);
        addToast('Match summary generated!', 'success');
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
    <Card className="!p-3 bg-brand-primary hover:!ring-brand-vibrant relative">
      <div className="flex justify-between items-center mb-2">
           <span className="text-[10px] font-bold text-brand-vibrant bg-brand-vibrant/10 px-2 py-0.5 rounded-full">
            MD {match.matchday}
          </span>
          <span className="text-[10px] font-bold text-brand-light opacity-50 uppercase">Leg {match.leg}</span>
      </div>
     
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-3">
        {/* Row 1: Team Names */}
        <div className="flex items-center gap-1.5 min-w-0">
            <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span className="font-semibold text-brand-text truncate text-xs sm:text-sm">{match.teamA.name}</span>
        </div>
        <div className="text-xs text-brand-light">vs</div>
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
            <span className="font-semibold text-brand-text truncate text-xs sm:text-sm text-right">{match.teamB.name}</span>
            <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
        </div>

        {/* Row 2: Scores and Actions */}
        <div className="flex items-center gap-1">
            <label htmlFor={`scoreA-${match.id}`} className="sr-only">Score A</label>
            <input id={`scoreA-${match.id}`} type="number" value={scoreA} onChange={e => setScoreA(e.target.value)} className="w-full p-1.5 text-center bg-brand-primary border border-brand-accent rounded-md text-brand-text font-bold text-sm" placeholder="-" />
        </div>
        <div className="flex items-center justify-center gap-1">
            <Button onClick={() => onEditSchedule(match)} variant="secondary" className="!p-1.5 h-8 w-8" title="Edit Schedule">
                <Pencil size={12}/>
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating} variant="secondary" className="!p-1.5 h-8 w-8" title="Generate Summary">
                {isGenerating ? <Spinner size={12} /> : <Sparkles size={12} />}
            </Button>
        </div>
        <div className="flex items-center gap-1">
            <label htmlFor={`scoreB-${match.id}`} className="sr-only">Score B</label>
            <input id={`scoreB-${match.id}`} type="number" value={scoreB} onChange={e => setScoreB(e.target.value)} className="w-full p-1.5 text-center bg-brand-primary border border-brand-accent rounded-md text-brand-text font-bold text-sm" placeholder="-" />
        </div>
        
        {/* Row 3: Proof and Save */}
        <div className="relative col-span-3 mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link size={12} className="text-brand-light" />
            </div>
            <input
                id={`proof-${match.id}`}
                type="text"
                value={proofUrl}
                onChange={e => setProofUrl(e.target.value)}
                className="w-full p-2 pl-8 pr-20 bg-brand-primary border border-brand-accent rounded-md text-brand-text text-xs placeholder:text-brand-accent/80"
                placeholder="Proof URL"
            />
            <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
                <Button onClick={handleSave} className="!py-0.5 !px-2 h-7 text-xs">
                    <Save size={12}/>
                    <span className="ml-1">Save</span>
                </Button>
            </div>
        </div>
      </div>
        {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
        {match.summary && !isGenerating && (
            <div className="border-t border-brand-accent/50 pt-2 mt-2">
                <p className="text-xs text-brand-light italic line-clamp-2"><strong>AI:</strong> "{match.summary}"</p>
            </div>
        )}
    </Card>
  );
};
