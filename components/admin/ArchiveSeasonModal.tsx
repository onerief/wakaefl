
import React, { useState, useMemo } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Crown, Save, Archive, AlertTriangle } from 'lucide-react';
import type { Team, SeasonHistory, TournamentMode, KnockoutStageRounds } from '../../types';
import { useToast } from '../shared/Toast';

interface ArchiveSeasonModalProps {
    mode: TournamentMode;
    teams: Team[];
    knockoutStage: KnockoutStageRounds | null;
    onArchive: (entry: SeasonHistory, keepTeams: boolean) => void;
    onClose: () => void;
}

export const ArchiveSeasonModal: React.FC<ArchiveSeasonModalProps> = ({ mode, teams, knockoutStage, onArchive, onClose }) => {
    const { addToast } = useToast();
    const [seasonName, setSeasonName] = useState(`Season ${new Date().getFullYear()}`);
    const [championId, setChampionId] = useState('');
    const [runnerUpId, setRunnerUpId] = useState('');
    const [keepTeams, setKeepTeams] = useState(true);

    // Attempt to auto-detect winner from knockout stage
    const detectedResults = useMemo(() => {
        if (!knockoutStage || !knockoutStage.Final || knockoutStage.Final.length === 0) return null;
        const finalMatch = knockoutStage.Final[0];
        if (!finalMatch.winnerId) return null;
        
        return {
            championId: finalMatch.winnerId,
            runnerUpId: finalMatch.winnerId === finalMatch.teamA?.id ? finalMatch.teamB?.id : finalMatch.teamA?.id
        };
    }, [knockoutStage]);

    // Set auto-detected values on mount
    React.useEffect(() => {
        if (detectedResults) {
            setChampionId(detectedResults.championId || '');
            setRunnerUpId(detectedResults.runnerUpId || '');
        }
    }, [detectedResults]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const champion = teams.find(t => t.id === championId);
        const runnerUp = teams.find(t => t.id === runnerUpId);

        if (!champion) {
            addToast('Wajib memilih Juara (Champion).', 'error');
            return;
        }

        const newEntry: SeasonHistory = {
            seasonId: `s-${Date.now()}`,
            seasonName: seasonName.trim(),
            champion: champion,
            runnerUp: runnerUp,
            dateCompleted: Date.now(),
            mode: mode
        };

        // Execute archive action directly without native confirm to ensure it fires
        onArchive(newEntry, keepTeams);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[120] backdrop-blur-md p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-xs relative !p-0 overflow-hidden shadow-2xl border-yellow-500/30 bg-brand-primary rounded-2xl ring-1 ring-white/10">
                <div className="bg-gradient-to-r from-yellow-900/40 to-black p-3 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xs font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                        <Archive size={14} className="text-yellow-500" /> End Season
                    </h3>
                    <button onClick={onClose} className="text-brand-light hover:text-white transition-all bg-white/5 p-1 rounded-full"><X size={12} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg flex gap-2 items-start">
                        <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={14} />
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest">Konfirmasi</p>
                            <p className="text-[9px] text-brand-light leading-tight">
                                Jadwal & Skor akan di-reset. Data Juara disimpan ke Hall of Fame.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <label className="block text-[8px] font-black text-brand-light uppercase tracking-widest mb-1">Nama Musim</label>
                            <input 
                                type="text" 
                                value={seasonName} 
                                onChange={e => setSeasonName(e.target.value)}
                                className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-lg text-white font-bold text-[10px] focus:border-yellow-500 outline-none transition-colors"
                                placeholder="Contoh: WAKACL Season 1"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[8px] font-black text-brand-light uppercase tracking-widest mb-1 flex items-center gap-1"><Crown size={8} className="text-yellow-500" /> Champion</label>
                                <select 
                                    value={championId} 
                                    onChange={e => setChampionId(e.target.value)}
                                    className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-lg text-white text-[10px] outline-none focus:border-yellow-500 transition-colors"
                                    required
                                >
                                    <option value="">-- Pilih --</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[8px] font-black text-brand-light uppercase tracking-widest mb-1 text-brand-light/70">Runner Up</label>
                                <select 
                                    value={runnerUpId} 
                                    onChange={e => setRunnerUpId(e.target.value)}
                                    className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-lg text-white text-[10px] outline-none focus:border-brand-light transition-colors"
                                >
                                    <option value="">-- Pilih --</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-white/5">
                            <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5 group">
                                <input 
                                    type="checkbox" 
                                    checked={keepTeams} 
                                    onChange={e => setKeepTeams(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-brand-light bg-brand-secondary text-brand-vibrant focus:ring-offset-0"
                                />
                                <div className="flex-1">
                                    <span className="block text-[9px] font-bold text-white uppercase group-hover:text-brand-vibrant transition-colors">Simpan Daftar Tim?</span>
                                    <span className="block text-[8px] text-brand-light opacity-60 leading-none mt-0.5">Centang agar tim tidak terhapus.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                        <Button type="button" variant="secondary" onClick={onClose} className="!text-[9px] !py-2 px-3 rounded-lg h-8">Batal</Button>
                        <Button type="submit" className="!bg-yellow-600 hover:!bg-yellow-700 text-white shadow-lg shadow-yellow-900/20 !text-[9px] !py-2 px-3 rounded-lg font-black uppercase tracking-wider h-8">
                            <Save size={12} /> Arsipkan
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
