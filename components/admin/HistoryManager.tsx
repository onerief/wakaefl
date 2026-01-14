
import React, { useState } from 'react';
import type { SeasonHistory, Team, TournamentMode } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Plus, Trash2, Crown, Trophy, Calendar, Globe, ListOrdered, Shield } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { TeamLogo } from '../shared/TeamLogo';

interface HistoryManagerProps {
    history: SeasonHistory[];
    teams: Team[];
    onAddEntry: (entry: SeasonHistory) => void;
    onDeleteEntry: (id: string) => void;
}

export const HistoryManager: React.FC<HistoryManagerProps> = ({ history, teams, onAddEntry, onDeleteEntry }) => {
    const [seasonName, setSeasonName] = useState('');
    const [championId, setChampionId] = useState('');
    const [runnerUpId, setRunnerUpId] = useState('');
    const [mode, setMode] = useState<TournamentMode>('league');
    const { addToast } = useToast();

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!seasonName.trim() || !championId) {
            addToast('Nama Musim dan Juara wajib diisi.', 'error');
            return;
        }

        const champion = teams.find(t => t.id === championId);
        if (!champion) return;

        const runnerUp = teams.find(t => t.id === runnerUpId);

        const newEntry: SeasonHistory = {
            seasonId: `s-manual-${Date.now()}`,
            seasonName: seasonName.trim(),
            champion: champion,
            runnerUp: runnerUp,
            dateCompleted: Date.now(),
            mode: mode
        };

        onAddEntry(newEntry);
        setSeasonName('');
        setChampionId('');
        setRunnerUpId('');
        addToast('Riwayat berhasil ditambahkan!', 'success');
    };

    const getModeIcon = (m?: TournamentMode) => {
        switch(m) {
            case 'league': return <ListOrdered size={12} className="text-blue-400" />;
            case 'two_leagues': return <Globe size={12} className="text-purple-400" />;
            case 'wakacl': return <Shield size={12} className="text-yellow-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-brand-accent/50">
                <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                    <Crown size={20} className="text-yellow-500" />
                    Tambah Juara Manual
                </h3>
                
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-primary p-4 rounded-xl border border-white/5">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Nama Musim / Judul</label>
                        <input 
                            type="text"
                            value={seasonName}
                            onChange={(e) => setSeasonName(e.target.value)}
                            placeholder="Contoh: Season 1 (Januari 2024)"
                            className="w-full p-2.5 bg-brand-secondary border border-brand-accent rounded-lg text-white text-sm focus:ring-1 focus:ring-brand-vibrant outline-none"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Pilih Juara (1st)</label>
                        <select 
                            value={championId}
                            onChange={(e) => setChampionId(e.target.value)}
                            className="w-full p-2.5 bg-brand-secondary border border-brand-accent rounded-lg text-white text-sm focus:ring-1 focus:ring-brand-vibrant outline-none appearance-none"
                        >
                            <option value="">-- Pilih Tim --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Pilih Runner Up (2nd)</label>
                        <select 
                            value={runnerUpId}
                            onChange={(e) => setRunnerUpId(e.target.value)}
                            className="w-full p-2.5 bg-brand-secondary border border-brand-accent rounded-lg text-white text-sm focus:ring-1 focus:ring-brand-vibrant outline-none appearance-none"
                        >
                            <option value="">-- Pilih Tim (Opsional) --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Jenis Turnamen</label>
                        <select 
                            value={mode}
                            onChange={(e) => setMode(e.target.value as TournamentMode)}
                            className="w-full p-2.5 bg-brand-secondary border border-brand-accent rounded-lg text-white text-sm focus:ring-1 focus:ring-brand-vibrant outline-none appearance-none"
                        >
                            <option value="league">Liga Reguler</option>
                            <option value="two_leagues">2 Wilayah (Region)</option>
                            <option value="wakacl">WAKACL</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <Button type="submit" className="w-full py-2.5">
                            <Plus size={16} /> Simpan Riwayat
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="border-brand-accent/50">
                <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                    <Trophy size={20} className="text-brand-vibrant" />
                    Kelola Riwayat Terdaftar
                </h3>

                <div className="space-y-3">
                    {history.length > 0 ? (
                        history.map((entry) => (
                            <div key={entry.seasonId} className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl group hover:border-brand-vibrant/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <TeamLogo logoUrl={entry.champion.logoUrl} teamName={entry.champion.name} className="w-10 h-10 ring-1 ring-yellow-500/50" />
                                        <Trophy size={14} className="absolute -top-1 -right-1 text-yellow-500 fill-yellow-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{entry.seasonName}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-brand-light font-bold">Juara: {entry.champion.name}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                            <div className="flex items-center gap-1 text-[9px] uppercase font-black tracking-wider opacity-60">
                                                {getModeIcon(entry.mode)}
                                                {entry.mode}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onDeleteEntry(entry.seasonId)}
                                    className="p-2 text-brand-light hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Hapus riwayat"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 bg-black/20 rounded-xl border border-dashed border-white/10 text-xs text-brand-light italic">
                            Belum ada riwayat manual di database ini.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
