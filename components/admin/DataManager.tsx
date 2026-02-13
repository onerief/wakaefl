
import React, { useRef, useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { 
    Download, 
    Upload, 
    Users, 
    ListChecks, 
    BookOpen, 
    Settings, 
    Database, 
    FileJson, 
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    ShieldCheck,
    Globe,
    Server
} from 'lucide-react';
import { useToast } from '../shared/Toast';
import { saveTournamentData, getFullSystemBackup, restoreFullSystem } from '../../services/firebaseService';
import type { Team, Match, Group, TournamentState, TournamentMode, Partner, KnockoutStageRounds, ScheduleSettings } from '../../types';

interface DataManagerProps {
    teams: Team[];
    matches: Match[];
    groups: Group[];
    rules: string;
    banners: string[];
    partners: Partner[];
    headerLogoUrl: string;
    mode: TournamentMode;
    knockoutStage: KnockoutStageRounds | null;
    scheduleSettings: ScheduleSettings;
    setTournamentState: (state: TournamentState) => void;
}

export const DataManager: React.FC<DataManagerProps> = ({ 
    teams, matches, groups, rules, banners, partners, headerLogoUrl, mode, knockoutStage, scheduleSettings, setTournamentState 
}) => {
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const globalInputRef = useRef<HTMLInputElement>(null);
    const [activeImportKey, setActiveImportKey] = useState<string | null>(null);

    const getModeLabel = (m: TournamentMode) => {
        switch(m) {
            case 'league': return 'LEAGUE';
            case 'wakacl': return 'CHAMPIONSHIP';
            case 'two_leagues': return '2REGION';
            default: return 'TOURNAMENT';
        }
    };

    const handleExport = (key: 'teams' | 'matches' | 'rules' | 'settings' | 'all') => {
        try {
            let exportData: any = {};
            const dateStr = new Date().toISOString().split('T')[0];
            const modeStr = getModeLabel(mode);
            let filename = `wakaefl-${modeStr}-${key}-${dateStr}.json`;

            switch(key) {
                case 'teams': exportData = { teams }; break;
                case 'matches': exportData = { matches, groups, knockoutStage, scheduleSettings }; break;
                case 'rules': exportData = { rules }; break;
                case 'settings': exportData = { banners, partners, headerLogoUrl }; break;
                case 'all': exportData = { teams, matches, groups, rules, banners, partners, headerLogoUrl, knockoutStage, scheduleSettings }; break;
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast(`Ekspor ${key.toUpperCase()} berhasil!`, 'success');
        } catch (e) {
            addToast('Gagal melakukan ekspor.', 'error');
        }
    };

    const handleGlobalExport = async () => {
        setIsProcessing(true);
        try {
            const data = await getFullSystemBackup();
            const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            const filename = `wakaefl-FULL-SYSTEM-BACKUP-${dateStr}.json`;
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Backup Global berhasil diunduh!', 'success');
        } catch (e) {
            console.error(e);
            addToast('Gagal melakukan backup global.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const triggerImport = (key: string) => {
        setActiveImportKey(key);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeImportKey) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                setIsProcessing(true);
                const importedData = JSON.parse(event.target?.result as string);
                
                // Helper untuk memastikan tim memiliki data utuh
                const currentTeams = importedData.teams || teams;
                const teamMap = new Map<string, Team>();
                currentTeams.forEach((t: any) => {
                    if (t && t.id) teamMap.set(t.id, t);
                });

                const getHydratedTeam = (val: any): Team => {
                    const id = (val && typeof val === 'object') ? val.id : val;
                    return teamMap.get(id) || { id, name: 'TBD' } as Team;
                };

                // State awal (merge dengan data lama jika parsial)
                let newState: TournamentState = {
                    teams: currentTeams,
                    matches: importedData.matches || matches,
                    groups: importedData.groups || groups,
                    rules: importedData.rules || rules,
                    banners: importedData.banners || banners,
                    partners: importedData.partners || partners,
                    headerLogoUrl: importedData.headerLogoUrl || headerLogoUrl,
                    mode: mode,
                    knockoutStage: importedData.knockoutStage || knockoutStage,
                    scheduleSettings: importedData.scheduleSettings || scheduleSettings,
                    isDoubleRoundRobin: true,
                    status: 'active',
                    history: importedData.history || [],
                    isRegistrationOpen: true
                };

                // Jika impor spesifik, ganti bagian tersebut
                if (activeImportKey === 'matches') {
                    if (!importedData.matches) throw new Error("File tidak berisi data pertandingan.");
                    newState.matches = importedData.matches.map((m: any) => ({
                        ...m,
                        teamA: getHydratedTeam(m.teamA),
                        teamB: getHydratedTeam(m.teamB),
                        matchday: m.matchday || 1,
                        leg: m.leg || 1
                    }));
                }

                // Push to app state
                setTournamentState(newState);
                
                // Force save ke Cloud secara permanen
                addToast('Menyimpan ke Database Cloud...', 'info');
                await saveTournamentData(mode, newState);
                
                addToast(`DATA MODE INI BERHASIL DIPULIHKAN.`, 'success');
            } catch (err: any) {
                console.error(err);
                addToast(`Gagal Impor: ${err.message}`, 'error');
            } finally {
                setIsProcessing(false);
                setActiveImportKey(null);
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleGlobalImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            if (!window.confirm("PERINGATAN: Ini akan menimpa SEMUA data di SEMUA mode (Liga, WAKACL, 2 Region). Lanjutkan?")) return;

            try {
                setIsProcessing(true);
                const importedData = JSON.parse(event.target?.result as string);
                
                await restoreFullSystem(importedData);
                
                addToast('SISTEM GLOBAL BERHASIL DIPULIHKAN! Silakan refresh halaman.', 'success');
                setTimeout(() => window.location.reload(), 2000);
            } catch (err: any) {
                console.error(err);
                addToast(`Restore Gagal: ${err.message}`, 'error');
            } finally {
                setIsProcessing(false);
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const DataSection = ({ title, icon: Icon, description, exportKey, colorClass }: any) => (
        <Card className="border-white/5 bg-brand-primary/40 hover:border-brand-vibrant/30 transition-all group !p-5">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-black/40 border border-white/5 ${colorClass}`}>
                    <Icon size={24} />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleExport(exportKey)}
                        className="p-2.5 bg-brand-vibrant/10 text-brand-vibrant rounded-xl hover:bg-brand-vibrant hover:text-white transition-all shadow-lg"
                        title="Export JSON"
                    >
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={() => triggerImport(exportKey)}
                        className="p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-lg"
                        title="Import JSON"
                    >
                        <Upload size={18} />
                    </button>
                </div>
            </div>
            <h4 className="text-lg font-black text-white uppercase italic tracking-tight mb-1 group-hover:text-brand-vibrant transition-colors">{title}</h4>
            <p className="text-[11px] text-brand-light leading-relaxed opacity-60">{description}</p>
        </Card>
    );

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* FULL SYSTEM BACKUP SECTION */}
            <div className="bg-gradient-to-r from-indigo-900/40 to-brand-primary border border-indigo-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 p-40 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Server className="text-indigo-400" size={32} />
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Full System Maintenance</h2>
                    </div>
                    <p className="text-sm text-brand-light max-w-lg">
                        Backup atau Restore <strong>seluruh website</strong> sekaligus (Liga Reguler, WAKACL, 2 Region, dan Pengaturan Global). Gunakan ini untuk migrasi atau pencadangan total.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
                    <Button onClick={handleGlobalExport} className="!bg-indigo-600 hover:!bg-indigo-700 border-none !py-3 px-6 text-xs uppercase font-black tracking-widest shadow-lg shadow-indigo-900/20">
                        <Download size={16} /> Global Backup
                    </Button>
                    <Button onClick={() => globalInputRef.current?.click()} variant="secondary" className="!bg-white/5 !border-white/10 !py-3 px-6 text-xs uppercase font-black tracking-widest hover:!bg-red-500/20 hover:!text-red-400 hover:!border-red-500/30 transition-all">
                        <Upload size={16} /> Global Restore
                    </Button>
                </div>
            </div>

            {/* CURRENT MODE BACKUP SECTION */}
            <div className="border-t border-white/5 pt-8">
                <h3 className="text-xl font-black text-brand-text italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                    <Database className="text-brand-vibrant" size={24} /> 
                    Backup Mode: <span className="text-brand-vibrant underline decoration-wavy underline-offset-4">{getModeLabel(mode)}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DataSection 
                        title="Teams & Profile" 
                        icon={Users} 
                        description={`Daftar tim khusus untuk mode ${getModeLabel(mode)}.`}
                        exportKey="teams"
                        colorClass="text-blue-400"
                    />
                    <DataSection 
                        title="Matches & Score" 
                        icon={ListChecks} 
                        description="Jadwal, skor, dan bagan knockout."
                        exportKey="matches"
                        colorClass="text-indigo-400"
                    />
                    <DataSection 
                        title="Tournament Rules" 
                        icon={BookOpen} 
                        description="Teks peraturan (berlaku global)."
                        exportKey="rules"
                        colorClass="text-emerald-400"
                    />
                    <DataSection 
                        title="Combined Data" 
                        icon={FileJson} 
                        description={`Semua data (tim, match, grup) khusus mode ${getModeLabel(mode)}.`}
                        exportKey="all"
                        colorClass="text-slate-400"
                    />
                </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-2xl p-5 flex items-start gap-4">
                <AlertTriangle className="text-yellow-500 shrink-0" size={24} />
                <div className="space-y-1">
                    <h5 className="text-sm font-black text-yellow-500 uppercase tracking-wider italic">Penting</h5>
                    <p className="text-[11px] text-yellow-100/60 leading-relaxed">
                        <strong>Mode Backup</strong> hanya menyimpan data untuk kompetisi yang sedang Anda buka saat ini ({getModeLabel(mode)}). 
                        Gunakan <strong>Full System Maintenance</strong> di atas jika ingin mengamankan semua kompetisi sekaligus.
                    </p>
                </div>
            </div>

            {/* Hidden Inputs */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/json" 
                className="hidden" 
            />
            <input 
                type="file" 
                ref={globalInputRef} 
                onChange={handleGlobalImport} 
                accept="application/json" 
                className="hidden" 
            />

            {isProcessing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-brand-secondary p-10 rounded-[2rem] border border-brand-vibrant/30 flex flex-col items-center shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
                        <div className="absolute inset-0 bg-brand-vibrant/5 animate-pulse"></div>
                        <RefreshCw className="text-brand-vibrant animate-spin mb-6 relative z-10" size={64} />
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter relative z-10">Processing Data...</h3>
                        <p className="text-brand-light text-sm mt-2 relative z-10 font-bold uppercase tracking-widest">Mohon Tunggu & Jangan Refresh</p>
                    </div>
                </div>
            )}
        </div>
    );
};
