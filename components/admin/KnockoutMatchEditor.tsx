
import React, { useState } from 'react';
import type { KnockoutMatch } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Save, Trophy, Pencil, Trash2, Plus, Minus } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { TeamLogo } from '../shared/TeamLogo';

interface KnockoutMatchEditorProps {
  match: KnockoutMatch;
  onUpdateScore: (matchId: string, scores: { scoreA1: number | null, scoreB1: number | null, scoreA2: number | null, scoreB2: number | null }) => void;
  onEdit: (match: KnockoutMatch) => void;
  onDelete: () => void;
}

export const KnockoutMatchEditor: React.FC<KnockoutMatchEditorProps> = ({ match, onUpdateScore, onEdit, onDelete }) => {
  const [sA1, setSA1] = useState<number | null>(match.scoreA1);
  const [sB1, setSB1] = useState<number | null>(match.scoreB1);
  const [sA2, setSA2] = useState<number | null>(match.scoreA2);
  const [sB2, setSB2] = useState<number | null>(match.scoreB2);
  const { addToast } = useToast();
  
  const isEditable = !!match.teamA && !!match.teamB;
  const isFinal = match.round === 'Final';

  const handleSave = () => {
    if (!isEditable) return;
    onUpdateScore(match.id, { scoreA1: sA1, scoreB1: sB1, scoreA2: sA2, scoreB2: sB2 });
    addToast('Skor Knockout disimpan!', 'success');
  };

  const adjust = (leg: 1 | 2, team: 'A' | 'B', delta: number) => {
      if (leg === 1) {
          if (team === 'A') setSA1(prev => Math.max(0, (prev || 0) + delta));
          else setSB1(prev => Math.max(0, (prev || 0) + delta));
      } else {
          if (team === 'A') setSA2(prev => Math.max(0, (prev || 0) + delta));
          else setSB2(prev => Math.max(0, (prev || 0) + delta));
      }
  };

  const teamAName = match.teamA?.name || match.placeholderA || 'Team A';
  const teamBName = match.teamB?.name || match.placeholderB || 'Team B';

  const ScoreControl = ({ val, onAdjust }: { val: number | null, onAdjust: (d: number) => void }) => (
      <div className="flex items-center bg-black/40 rounded-lg border border-white/5 p-0.5">
          <button onClick={() => onAdjust(-1)} className="p-1 text-brand-light hover:text-red-400"><Minus size={14} /></button>
          <span className="w-8 text-center font-black text-lg text-brand-vibrant">{val ?? 0}</span>
          <button onClick={() => onAdjust(1)} className="p-1 text-brand-light hover:text-green-400"><Plus size={14} /></button>
      </div>
  );

  return (
    <Card className={`${!isEditable ? 'opacity-80' : ''} border border-brand-accent/50 bg-brand-primary/40`}>
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
          <span className="text-[10px] font-black text-brand-light uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
            {match.round} - M{match.matchNumber}
          </span>
          <div className="flex gap-1">
             <button onClick={() => onEdit(match)} className="p-1.5 text-brand-light hover:text-white bg-white/5 rounded-lg"><Pencil size={12} /></button>
             <button onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg"><Trash2 size={12} /></button>
         </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-center gap-2">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <TeamLogo logoUrl={match.teamA?.logoUrl} teamName={teamAName} className="w-10 h-10" />
                <span className="text-[10px] font-bold text-white truncate w-full uppercase">{teamAName}</span>
            </div>
            <div className="text-brand-light/30 font-black italic">VS</div>
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <TeamLogo logoUrl={match.teamB?.logoUrl} teamName={teamBName} className="w-10 h-10" />
                <span className="text-[10px] font-bold text-white truncate w-full uppercase">{teamBName}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-3 bg-black/20 p-3 rounded-xl">
            {/* Leg 1 */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex justify-center"><ScoreControl val={sA1} onAdjust={(d) => adjust(1, 'A', d)} /></div>
                <div className="text-[9px] font-black text-brand-light uppercase tracking-tighter opacity-40">Leg 1</div>
                <div className="flex-1 flex justify-center"><ScoreControl val={sB1} onAdjust={(d) => adjust(1, 'B', d)} /></div>
            </div>

            {/* Leg 2 - Hidden for Final */}
            {!isFinal && (
                <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-3">
                    <div className="flex-1 flex justify-center"><ScoreControl val={sA2} onAdjust={(d) => adjust(2, 'A', d)} /></div>
                    <div className="text-[9px] font-black text-brand-light uppercase tracking-tighter opacity-40">Leg 2</div>
                    <div className="flex-1 flex justify-center"><ScoreControl val={sB2} onAdjust={(d) => adjust(2, 'B', d)} /></div>
                </div>
            )}
            
            {/* Total Aggregate */}
            {!isFinal && (
                <div className="flex items-center justify-center gap-8 pt-2 border-t border-white/5">
                    <div className="text-xl font-black text-white">{(sA1 || 0) + (sA2 || 0)}</div>
                    <div className="text-[8px] font-black text-brand-vibrant uppercase bg-brand-vibrant/10 px-2 py-0.5 rounded">AGG</div>
                    <div className="text-xl font-black text-white">{(sB1 || 0) + (sB2 || 0)}</div>
                </div>
            )}
        </div>

        <Button onClick={handleSave} disabled={!isEditable} className="w-full !py-3 bg-brand-vibrant hover:bg-blue-600 border-none shadow-lg shadow-blue-900/20">
            <Save size={16}/> <span>Simpan Hasil</span>
        </Button>
      </div>
    </Card>
  );
};
