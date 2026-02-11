
import React, { useState, useEffect } from 'react';
import type { KnockoutMatch, MatchPlayerStats, PlayerStat } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Save, Trophy, Pencil, Trash2, Plus, Minus, CheckCircle2, AlertCircle, BarChart3, X, Trash } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { TeamLogo } from '../shared/TeamLogo';

interface KnockoutMatchEditorProps {
  match: KnockoutMatch;
  onUpdateScore: (matchId: string, data: KnockoutMatch) => void;
  onEdit: (match: KnockoutMatch) => void;
  onDelete: () => void;
}

export const KnockoutMatchEditor: React.FC<KnockoutMatchEditorProps> = ({ match, onUpdateScore, onEdit, onDelete }) => {
  const [sA1, setSA1] = useState<number | null>(match.scoreA1);
  const [sB1, setSB1] = useState<number | null>(match.scoreB1);
  const [sA2, setSA2] = useState<number | null>(match.scoreA2);
  const [sB2, setSB2] = useState<number | null>(match.scoreB2);
  const [manualWinnerId, setManualWinnerId] = useState<string | null>(match.winnerId);
  
  const { addToast } = useToast();
  
  const isEditable = !!match.teamA && !!match.teamB;
  const isFinal = match.round === 'Final';

  const aggA = (sA1 || 0) + (sA2 || 0);
  const aggB = (sB1 || 0) + (sB2 || 0);

  const handleSave = () => {
    if (!isEditable) return;
    
    onUpdateScore(match.id, { 
        ...match,
        scoreA1: sA1, 
        scoreB1: sB1, 
        scoreA2: sA2, 
        scoreB2: sB2,
        winnerId: manualWinnerId,
        playerStats: undefined
    });
    addToast('Skor berhasil disimpan.', 'success');
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
            <div className={`flex flex-col items-center gap-1 flex-1 min-w-0 transition-opacity ${manualWinnerId === match.teamA?.id ? 'opacity-100' : manualWinnerId ? 'opacity-30' : 'opacity-100'}`}>
                <TeamLogo logoUrl={match.teamA?.logoUrl} teamName={teamAName} className="w-10 h-10" />
                <span className="text-[10px] font-bold text-white truncate w-full uppercase">{teamAName}</span>
            </div>
            <div className="text-brand-light/30 font-black italic">VS</div>
            <div className={`flex flex-col items-center gap-1 flex-1 min-w-0 transition-opacity ${manualWinnerId === match.teamB?.id ? 'opacity-100' : manualWinnerId ? 'opacity-30' : 'opacity-100'}`}>
                <TeamLogo logoUrl={match.teamB?.logoUrl} teamName={teamBName} className="w-10 h-10" />
                <span className="text-[10px] font-bold text-white truncate w-full uppercase">{teamBName}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-3 bg-black/20 p-3 rounded-xl">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex justify-center"><ScoreControl val={sA1} onAdjust={(d) => adjust(1, 'A', d)} /></div>
                <div className="text-[9px] font-black text-brand-light uppercase tracking-tighter opacity-40">Leg 1</div>
                <div className="flex-1 flex justify-center"><ScoreControl val={sB1} onAdjust={(d) => adjust(1, 'B', d)} /></div>
            </div>
            {!isFinal && (
                <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-3">
                    <div className="flex-1 flex justify-center"><ScoreControl val={sA2} onAdjust={(d) => adjust(2, 'A', d)} /></div>
                    <div className="text-[9px] font-black text-brand-light uppercase tracking-tighter opacity-40">Leg 2</div>
                    <div className="flex-1 flex justify-center"><ScoreControl val={sB2} onAdjust={(d) => adjust(2, 'B', d)} /></div>
                </div>
            )}
            {!isFinal && (
                <div className="flex flex-col items-center pt-2 border-t border-white/5">
                    <div className="flex items-center justify-center gap-8 mb-2">
                        <div className={`text-xl font-black ${aggA > aggB ? 'text-brand-vibrant' : 'text-white'}`}>{aggA}</div>
                        <div className="text-[8px] font-black text-brand-light uppercase bg-white/5 px-2 py-0.5 rounded">AGG</div>
                        <div className={`text-xl font-black ${aggB > aggA ? 'text-brand-vibrant' : 'text-white'}`}>{aggB}</div>
                    </div>
                    {aggA === aggB && sA1 !== null && sA2 !== null && (
                        <div className="w-full space-y-2 mt-1">
                            <p className="text-[8px] font-black text-brand-special uppercase text-center flex items-center justify-center gap-1">
                                <AlertCircle size={10} /> Skor Seri! Pilih Pemenang Penalti:
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => setManualWinnerId(match.teamA?.id || null)} className={`flex-1 py-1 text-[8px] font-black uppercase rounded border transition-all ${manualWinnerId === match.teamA?.id ? 'bg-brand-vibrant text-white border-brand-vibrant' : 'bg-black/40 text-brand-light border-white/10'}`}>{teamAName} Lolos</button>
                                <button onClick={() => setManualWinnerId(match.teamB?.id || null)} className={`flex-1 py-1 text-[8px] font-black uppercase rounded border transition-all ${manualWinnerId === match.teamB?.id ? 'bg-brand-vibrant text-white border-brand-vibrant' : 'bg-black/40 text-brand-light border-white/10'}`}>{teamBName} Lolos</button>
                            </div>
                        </div>
                    )}
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
