
import React, { useState } from 'react';
import type { Match, MatchPlayerStats, PlayerStat } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Sparkles, Save, Pencil, Link, Plus, Minus, User, BarChart3, Trash2, X } from 'lucide-react';
import { Spinner } from '../shared/Spinner';
import { useToast } from '../shared/Toast';
import { TeamLogo } from '../shared/TeamLogo';

interface MatchEditorProps {
  match: Match;
  onUpdateScore: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string, playerStats?: MatchPlayerStats) => void;
  onGenerateSummary: (matchId: string) => Promise<string>;
  onEditSchedule: (match: Match) => void;
}

export const MatchEditor: React.FC<MatchEditorProps> = ({ match, onUpdateScore, onGenerateSummary, onEditSchedule }) => {
  const [scoreA, setScoreA] = useState<number>(match.scoreA ?? 0);
  const [scoreB, setScoreB] = useState<number>(match.scoreB ?? 0);
  const [proofUrl, setProofUrl] = useState(match.proofUrl ?? '');
  const [showStats, setShowStats] = useState(false);
  const [statsA, setStatsA] = useState<PlayerStat[]>(match.playerStats?.teamA || []);
  const [statsB, setStatsB] = useState<PlayerStat[]>(match.playerStats?.teamB || []);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  const handleSave = () => {
    try {
        const playerStats: MatchPlayerStats = { teamA: statsA, teamB: statsB };
        onUpdateScore(match.id, scoreA, scoreB, proofUrl, playerStats);
        addToast('Skor & Statistik berhasil disimpan!', 'success');
        setShowStats(false);
    } catch (e) {
        console.error(e);
        addToast('Gagal menyimpan data.', 'error');
    }
  };

  const addStatRow = (team: 'A' | 'B') => {
      const newStat: PlayerStat = { name: '', goals: 0, assists: 0 };
      if (team === 'A') setStatsA([...statsA, newStat]);
      else setStatsB([...statsB, newStat]);
  };

  const updateStatRow = (team: 'A' | 'B', index: number, field: keyof PlayerStat, value: any) => {
      if (team === 'A') {
          const newStats = [...statsA];
          newStats[index] = { ...newStats[index], [field]: value };
          setStatsA(newStats);
      } else {
          const newStats = [...statsB];
          newStats[index] = { ...newStats[index], [field]: value };
          setStatsB(newStats);
      }
  };

  const removeStatRow = (team: 'A' | 'B', index: number) => {
      if (team === 'A') setStatsA(statsA.filter((_, i) => i !== index));
      else setStatsB(statsB.filter((_, i) => i !== index));
  };

  const adjustScore = (team: 'A' | 'B', delta: number) => {
    if (team === 'A') setScoreA(prev => Math.max(0, prev + delta));
    else setScoreB(prev => Math.max(0, prev + delta));
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
          <div className="flex gap-2">
            <button onClick={() => setShowStats(!showStats)} className={`p-1.5 rounded-lg transition-all border ${showStats ? 'bg-brand-special text-brand-primary border-brand-special' : 'bg-white/5 text-brand-light hover:text-white border-transparent'}`} title="Statistik Pemain"><BarChart3 size={14} /></button>
            <button onClick={() => onEditSchedule(match)} className="p-1.5 text-brand-light hover:text-white bg-white/5 rounded-lg transition-colors border border-transparent"><Pencil size={14} /></button>
          </div>
      </div>
     
      <div className="flex flex-col gap-6">
        {/* Teams & Scores Area */}
        <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-12 h-12 sm:w-14 sm:h-14" />
                <span className="font-black text-white text-[10px] sm:text-xs uppercase truncate w-full text-center">{match.teamA.name}</span>
                <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-1">
                    <button onClick={() => adjustScore('A', -1)} className="p-2 text-brand-light hover:text-red-400"><Minus size={16} /></button>
                    <input type="number" value={scoreA} onChange={(e) => setScoreA(parseInt(e.target.value) || 0)} className="w-10 text-center bg-transparent font-black text-xl text-brand-vibrant focus:outline-none" />
                    <button onClick={() => adjustScore('A', 1)} className="p-2 text-brand-light hover:text-green-400"><Plus size={16} /></button>
                </div>
            </div>

            <div className="text-brand-light/20 font-black italic text-xl">VS</div>

            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-12 h-12 sm:w-14 sm:h-14" />
                <span className="font-black text-white text-[10px] sm:text-xs uppercase truncate w-full text-center">{match.teamB.name}</span>
                <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-1">
                    <button onClick={() => adjustScore('B', -1)} className="p-2 text-brand-light hover:text-red-400"><Minus size={16} /></button>
                    <input type="number" value={scoreB} onChange={(e) => setScoreB(parseInt(e.target.value) || 0)} className="w-10 text-center bg-transparent font-black text-xl text-brand-vibrant focus:outline-none" />
                    <button onClick={() => adjustScore('B', 1)} className="p-2 text-brand-light hover:text-green-400"><Plus size={16} /></button>
                </div>
            </div>
        </div>

        {/* Player Stats Section */}
        {showStats && (
            <div className="bg-black/30 border border-brand-special/20 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h5 className="text-[10px] font-black text-brand-special uppercase tracking-widest flex items-center gap-2"><BarChart3 size={12}/> Player Statistics</h5>
                    <button onClick={() => setShowStats(false)} className="text-brand-light hover:text-white"><X size={14}/></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Stats Team A */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-brand-vibrant uppercase">{match.teamA.name}</span>
                            <button onClick={() => addStatRow('A')} className="text-[8px] font-black text-brand-vibrant uppercase hover:underline">+ Tambah</button>
                        </div>
                        {statsA.map((s, i) => (
                            <div key={i} className="flex gap-1 items-center">
                                <input placeholder="Nama" value={s.name} onChange={e => updateStatRow('A', i, 'name', e.target.value)} className="flex-grow bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] outline-none focus:border-brand-vibrant" />
                                <input type="number" placeholder="G" value={s.goals} onChange={e => updateStatRow('A', i, 'goals', parseInt(e.target.value) || 0)} className="w-8 bg-white/5 border border-white/10 rounded text-center py-1 text-[10px] text-brand-special font-bold" />
                                <input type="number" placeholder="A" value={s.assists} onChange={e => updateStatRow('A', i, 'assists', parseInt(e.target.value) || 0)} className="w-8 bg-white/5 border border-white/10 rounded text-center py-1 text-[10px] text-brand-light font-bold" />
                                <button onClick={() => removeStatRow('A', i)} className="text-red-400 p-1"><Trash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                    {/* Stats Team B */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-brand-light uppercase">{match.teamB.name}</span>
                            <button onClick={() => addStatRow('B')} className="text-[8px] font-black text-brand-light uppercase hover:underline">+ Tambah</button>
                        </div>
                        {statsB.map((s, i) => (
                            <div key={i} className="flex gap-1 items-center">
                                <input placeholder="Nama" value={s.name} onChange={e => updateStatRow('B', i, 'name', e.target.value)} className="flex-grow bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] outline-none focus:border-brand-light" />
                                <input type="number" placeholder="G" value={s.goals} onChange={e => updateStatRow('B', i, 'goals', parseInt(e.target.value) || 0)} className="w-8 bg-white/5 border border-white/10 rounded text-center py-1 text-[10px] text-brand-special font-bold" />
                                <input type="number" placeholder="A" value={s.assists} onChange={e => updateStatRow('B', i, 'assists', parseInt(e.target.value) || 0)} className="w-8 bg-white/5 border border-white/10 rounded text-center py-1 text-[10px] text-brand-light font-bold" />
                                <button onClick={() => removeStatRow('B', i)} className="text-red-400 p-1"><Trash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

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
                    <Save size={18}/> <span>Update Skor {showStats ? '& Stats' : ''}</span>
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
