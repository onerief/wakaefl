
import React, { useState } from 'react';
import type { KnockoutMatch } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Save, Trophy, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { TeamLogo } from '../shared/TeamLogo';

interface KnockoutMatchEditorProps {
  match: KnockoutMatch;
  onUpdateScore: (matchId: string, scores: { scoreA1: number | null, scoreB1: number | null, scoreA2: number | null, scoreB2: number | null }) => void;
  onEdit: (match: KnockoutMatch) => void;
  onDelete: () => void;
}

export const KnockoutMatchEditor: React.FC<KnockoutMatchEditorProps> = ({ match, onUpdateScore, onEdit, onDelete }) => {
  const [scoreA1, setScoreA1] = useState(match.scoreA1?.toString() ?? '');
  const [scoreB1, setScoreB1] = useState(match.scoreB1?.toString() ?? '');
  const [scoreA2, setScoreA2] = useState(match.scoreA2?.toString() ?? '');
  const [scoreB2, setScoreB2] = useState(match.scoreB2?.toString() ?? '');
  const { addToast } = useToast();
  
  const isEditable = !!match.teamA && !!match.teamB;
  const isFinal = match.round === 'Final';

  const handleSave = () => {
    if (!isEditable) return;
    const numA1 = scoreA1 === '' ? null : parseInt(scoreA1, 10);
    const numB1 = scoreB1 === '' ? null : parseInt(scoreB1, 10);
    const numA2 = scoreA2 === '' ? null : parseInt(scoreA2, 10);
    const numB2 = scoreB2 === '' ? null : parseInt(scoreB2, 10);
    
    if ((scoreA1 !== '' && isNaN(numA1!)) || (scoreB1 !== '' && isNaN(numB1!)) || (scoreA2 !== '' && isNaN(numA2!)) || (scoreB2 !== '' && isNaN(numB2!))) {
        addToast('Invalid score format.', 'error');
        return;
    }

    onUpdateScore(match.id, { scoreA1: numA1, scoreB1: numB1, scoreA2: numA2, scoreB2: numB2 });
    addToast('Knockout score saved!', 'success');
  };
  
  const aggA = (parseInt(scoreA1, 10) || 0) + (parseInt(scoreA2, 10) || 0);
  const aggB = (parseInt(scoreB1, 10) || 0) + (parseInt(scoreB2, 10) || 0);

  const teamAName = match.teamA?.name || match.placeholderA || 'Team A';
  const teamBName = match.teamB?.name || match.placeholderB || 'Team B';

  return (
    <Card className={`${!isEditable ? 'opacity-80' : ''} border border-white/5`}>
      {/* Header with Toolbar */}
      <div className="border-b border-white/5 pb-4 mb-4">
          <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-brand-light uppercase tracking-wider bg-white/5 px-2 py-1 rounded">
                Match {match.matchNumber}
              </span>
              <div className="flex gap-2">
                 <Button 
                    onClick={() => onEdit(match)} 
                    variant="secondary" 
                    className="!p-1.5 h-7 w-7" 
                    title="Edit Match Details"
                 >
                     <Pencil size={12} />
                 </Button>
                 <Button 
                    onClick={onDelete} 
                    variant="secondary" 
                    className="!p-1.5 h-7 w-7 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border-red-500/30" 
                    title="Delete Match"
                 >
                     <Trash2 size={12} />
                 </Button>
             </div>
          </div>

          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                 <TeamLogo logoUrl={match.teamA?.logoUrl} teamName={teamAName} className="w-8 h-8 sm:w-10 sm:h-10 shadow-md" />
                 <div className="flex flex-col truncate min-w-0">
                     <span className="font-bold text-brand-text truncate text-sm sm:text-lg">{teamAName}</span>
                     {match.winnerId === match.teamA?.id && <span className="text-[10px] sm:text-xs text-brand-vibrant flex items-center gap-1"><Trophy size={10} /> Winner</span>}
                 </div>
             </div>

             <div className="px-2 sm:px-4 text-brand-light font-bold text-xs sm:text-sm italic shrink-0">VS</div>

             <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0 text-right">
                 <div className="flex flex-col truncate min-w-0 items-end">
                     <span className="font-bold text-brand-text truncate text-sm sm:text-lg">{teamBName}</span>
                     {match.winnerId === match.teamB?.id && <span className="text-[10px] sm:text-xs text-brand-vibrant flex items-center gap-1"><Trophy size={10} /> Winner</span>}
                 </div>
                 <TeamLogo logoUrl={match.teamB?.logoUrl} teamName={teamBName} className="w-8 h-8 sm:w-10 sm:h-10 shadow-md" />
             </div>
          </div>
      </div>

      <div className="space-y-4 bg-black/20 p-3 sm:p-4 rounded-xl shadow-inner">
        {isFinal ? (
           <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-widest text-brand-special font-bold mb-2">Final Match (Single Leg)</span>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                         <input 
                            type="number" 
                            value={scoreA1} 
                            onChange={e => setScoreA1(e.target.value)} 
                            className="w-14 h-10 sm:w-16 sm:h-12 text-center text-lg sm:text-xl font-black bg-brand-primary border border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-vibrant focus:border-transparent transition-all placeholder:text-brand-accent"
                            placeholder="0"
                            disabled={!isEditable}
                        />
                         <span className="text-[10px] text-brand-light mt-1 font-bold truncate max-w-[60px] sm:max-w-[80px]">{teamAName}</span>
                    </div>
                   
                    <span className="text-2xl font-black text-brand-light/50">-</span>
                    
                     <div className="flex flex-col items-center">
                        <input 
                            type="number" 
                            value={scoreB1} 
                            onChange={e => setScoreB1(e.target.value)} 
                            className="w-14 h-10 sm:w-16 sm:h-12 text-center text-lg sm:text-xl font-black bg-brand-primary border border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-vibrant focus:border-transparent transition-all placeholder:text-brand-accent"
                            placeholder="0"
                            disabled={!isEditable}
                        />
                         <span className="text-[10px] text-brand-light mt-1 font-bold truncate max-w-[60px] sm:max-w-[80px]">{teamBName}</span>
                    </div>
                </div>
           </div>
        ) : (
            <>
                {/* Leg 1 */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-center">
                     <div className="flex flex-col items-end">
                        <input 
                            type="number" 
                            value={scoreA1} 
                            onChange={e => setScoreA1(e.target.value)} 
                            className="w-12 h-9 sm:w-14 sm:h-10 text-center font-bold bg-brand-primary border border-brand-accent rounded-md focus:ring-1 focus:ring-brand-vibrant placeholder:text-brand-accent"
                            placeholder="-"
                            disabled={!isEditable}
                        />
                        <span className="text-[8px] sm:text-[10px] text-brand-vibrant font-bold mt-1 uppercase tracking-wide">Home</span>
                     </div>
                     <div className="flex flex-col items-center w-10 sm:w-12">
                        <span className="text-[10px] sm:text-xs font-bold text-brand-light uppercase">Leg 1</span>
                     </div>
                     <div className="flex flex-col items-start">
                        <input 
                            type="number" 
                            value={scoreB1} 
                            onChange={e => setScoreB1(e.target.value)} 
                            className="w-12 h-9 sm:w-14 sm:h-10 text-center font-bold bg-brand-primary border border-brand-accent rounded-md focus:ring-1 focus:ring-brand-vibrant placeholder:text-brand-accent"
                            placeholder="-"
                            disabled={!isEditable}
                        />
                        <span className="text-[8px] sm:text-[10px] text-brand-light/50 font-bold mt-1 uppercase tracking-wide">Away</span>
                     </div>
                </div>

                {/* Leg 2 */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-center">
                     <div className="flex flex-col items-end">
                        <input 
                            type="number" 
                            value={scoreA2} 
                            onChange={e => setScoreA2(e.target.value)} 
                            className="w-12 h-9 sm:w-14 sm:h-10 text-center font-bold bg-brand-primary border border-brand-accent rounded-md focus:ring-1 focus:ring-brand-vibrant placeholder:text-brand-accent"
                            placeholder="-"
                            disabled={!isEditable}
                        />
                         <span className="text-[8px] sm:text-[10px] text-brand-light/50 font-bold mt-1 uppercase tracking-wide">Away</span>
                     </div>
                     <div className="flex flex-col items-center w-10 sm:w-12">
                        <span className="text-[10px] sm:text-xs font-bold text-brand-light uppercase">Leg 2</span>
                     </div>
                     <div className="flex flex-col items-start">
                        <input 
                            type="number" 
                            value={scoreB2} 
                            onChange={e => setScoreB2(e.target.value)} 
                            className="w-12 h-9 sm:w-14 sm:h-10 text-center font-bold bg-brand-primary border border-brand-accent rounded-md focus:ring-1 focus:ring-brand-vibrant placeholder:text-brand-accent"
                            placeholder="-"
                            disabled={!isEditable}
                        />
                        <span className="text-[8px] sm:text-[10px] text-brand-vibrant font-bold mt-1 uppercase tracking-wide">Home</span>
                     </div>
                </div>
                
                {/* Aggregate */}
                <div className="border-t border-white/5 pt-3 mt-1">
                     <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                        <div className="text-right text-xl sm:text-2xl font-black text-brand-text w-14">{aggA}</div>
                        <div className="text-center text-[8px] sm:text-[10px] uppercase tracking-widest text-brand-light/50 font-bold w-12">AGG</div>
                        <div className="text-left text-xl sm:text-2xl font-black text-brand-text w-14">{aggB}</div>
                     </div>
                </div>
            </>
        )}
      </div>

      <div className="mt-4 flex justify-end">
         <Button onClick={handleSave} disabled={!isEditable} className="w-full sm:w-auto">
            <Save size={16}/>
            Save Score
         </Button>
      </div>
    </Card>
  );
};
