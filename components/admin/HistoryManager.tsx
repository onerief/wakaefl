
import React, { useState } from 'react';
import type { SeasonHistory, Team, TournamentMode } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Plus, Trash2, Crown, Trophy, Calendar, Globe, ListOrdered, Shield, X, Edit, Layout } from 'lucide-react';
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
    
    // Manual Input Overrides
    const [useManualEntry, setUseManualEntry] = useState(false);
    const [manualChampName, setManualChampName] = useState('');
    const [manualChampLogo, setManualChampLogo] = useState('');
    const [manualChampMgr, setManualChampMgr] = useState('');

    const { addToast } = useToast();

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!seasonName.trim()) {
            addToast('Nama Musim wajib diisi.', 'error');
            return;
        }

        let champion: Team | undefined;
        let runnerUp: Team | undefined;

        if (useManualEntry) {
            if (!manualChampName.trim()) {
                addToast('Nama Juara manual wajib diisi.', 'error');
                return;
            }
            champion = {
                id: `manual-${Date.now()}`,
                name: manualChampName.trim(),
                logoUrl: manualChampLogo.trim() || 'https://aistudiocdn.com/lucide-react@^0.553.0',
                manager: manualChampMgr.trim()
            };
        } else {
            champion = teams.find(t => t.id === championId);
            if (!champion) {
                addToast('Pilih Juara dari daftar.', 'error');
                return;
            }
            runnerUp = teams.find(t => t.id === runnerUpId);
        }

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
        setManualChampName('');
        setManualChampLogo('');
        setManualChampMgr('');
        addToast('Riwayat Juara berhasil ditambahkan!', 'success');
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
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                        <Crown size={24} className="text-yellow-500" />
                        Tambah Legenda Baru
                    </h3>
                    <button 
                        onClick={() => setUseManualEntry(!useManualEntry)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${useManualEntry ? 'bg-brand-vibrant text-white border-brand-vibrant' : 'bg-white/5 text-brand-light border-white/10 hover:text-white'}`}
                    >
                        {useManualEntry ? <Layout size={14}/> : <Edit size={14}/>}
                        {useManualEntry ? 'Gunakan Daftar Tim' : 'Input Manual (Tim Lama)'}
                    </button>
                </div>
                
                <form onSubmit={handleAdd} className="space-y-6 bg-brand-primary p-5 rounded-2xl border border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5 ml-1">Judul Musim / Kompetisi</label>
                            <input 
                                type="text"
                                value={seasonName}
                                onChange={(e) => setSeasonName(e.target.value)}
                                placeholder="Contoh: Season 1 - The First Battle"
                                className="w-full p-3 bg-brand-secondary border border-brand-accent rounded-xl text-white text-sm font-bold focus:ring-1 focus:ring-brand-vibrant outline-none shadow-inner"
                            />
                        </div>

                        {useManualEntry ? (
                            <>
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                                    <div className="md:col-span-3 pb-2"><span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Detail Juara Manual</span></div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-brand-light uppercase mb-1">Nama Tim</label>
                                        <input type="text" value={manualChampName} onChange={e => setManualChampName(e.target.value)} className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-lg text-white text-xs outline-none" placeholder="Nama Tim" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-brand-light uppercase mb-1">URL Logo</label>
                                        <input type="text" value={manualChampLogo} onChange={e => setManualChampLogo(e.target.value)} className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-lg text-white text-xs outline-none" placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-brand-light uppercase mb-1">Nama Manager</label>
                                        <input type="text" value={manualChampMgr} onChange={e => setManualChampMgr(e.target.value)} className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-lg text-white text-xs outline-none" placeholder="Nama Manager" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5 ml-1">Pilih Juara (1st)</label>
                                    <select 
                                        value={championId}
                                        onChange={(e) => setChampionId(e.target.value)}
                                        className="w-full p-3 bg-brand-secondary border border-brand-accent rounded-xl text-white text-sm font-bold focus:ring-1 focus:ring-brand-vibrant outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Pilih dari Tim Aktif --</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5 ml-1">Runner Up (2nd)</label>
                                    <select 
                                        value={runnerUpId}
                                        onChange={(e) => setRunnerUpId(e.target.value)}
                                        className="w-full p-3 bg-brand-secondary border border-brand-accent rounded-xl text-white text-sm font-bold focus:ring-1 focus:ring-brand-vibrant outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Pilih dari Tim Aktif --</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5 ml-1">Kategori Turnamen</label>
                            <select 
                                value={mode}
                                onChange={(e) => setMode(e.target.value as TournamentMode)}
                                className="w-full p-3 bg-brand-secondary border border-brand-accent rounded-xl text-white text-sm font-bold focus:ring-1 focus:ring-brand-vibrant outline-none appearance-none cursor-pointer"
                            >
                                <option value="league">Liga Reguler</option>
                                <option value="two_leagues">2 Wilayah (Region)</option>
                                <option value="wakacl">WAKACL</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <Button type="submit" className="w-full !py-3.5 !rounded-xl shadow-lg shadow-brand-vibrant/20">
                                <Plus size={18} /> Simpan ke Hall of Fame
                            </Button>
                        </div>
                    </div>
                    
                    <div className="bg-brand-vibrant/5 p-3 rounded-xl flex items-center gap-3">
                        <Trophy size={20} className="text-brand-vibrant shrink-0" />
                        <p className="text-[10px] text-brand-light italic">
                            Data "Legend" disimpan secara global. Champion akan mendapatkan lencana mahkota di klasemen Liga/WAKACL.
                        </p>
                    </div>
                </form>
            </Card>

            <Card className="border-brand-accent/50">
                <h3 className="text-lg font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-3">
                    <Trophy size={24} className="text-brand-vibrant" />
                    Manajemen Legenda Terdaftar
                </h3>

                <div className="space-y-3">
                    {history.length > 0 ? (
                        [...history].sort((a,b) => b.dateCompleted - a.dateCompleted).map((entry) => (
                            <div key={entry.seasonId} className="flex items-center justify-between p-4 bg-brand-primary/60 border border-white/5 rounded-2xl group hover:border-brand-vibrant/30 transition-all shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <TeamLogo logoUrl={entry.champion.logoUrl} teamName={entry.champion.name} className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-yellow-500/30" />
                                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 shadow-lg">
                                            <Crown size={12} className="text-brand-primary fill-brand-primary" />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h4 className="font-black text-white uppercase italic text-sm sm:text-base truncate">{entry.champion.name}</h4>
                                            <ModeBadge mode={entry.mode} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{entry.seasonName}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                            <span className="text-[9px] text-brand-light font-bold">Mgr: {entry.champion.manager || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { if(window.confirm('Hapus legenda ini?')) onDeleteEntry(entry.seasonId); }}
                                    className="p-3 text-brand-light hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Hapus riwayat"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-black/20 rounded-[2rem] border border-dashed border-white/10 text-xs text-brand-light/30 italic font-black uppercase tracking-widest">
                            Hall of Fame masih kosong.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

const ModeBadge = ({ mode }: { mode?: TournamentMode }) => {
    switch (mode) {
        case 'league':
            return <span className="flex items-center gap-1 text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20">Liga</span>;
        case 'two_leagues':
            return <span className="flex items-center gap-1 text-[8px] font-black text-purple-400 uppercase tracking-widest bg-purple-400/10 px-1.5 py-0.5 rounded border border-purple-400/20">2 Region</span>;
        case 'wakacl':
            return <span className="flex items-center gap-1 text-[8px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">WAKACL</span>;
        default:
            return null;
    }
};
