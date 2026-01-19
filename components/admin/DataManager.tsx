
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
    ShieldCheck
} from 'lucide-react';
import { useToast } from '../shared/Toast';
import { saveTournamentData } from '../../services/firebaseService';
import type { Team, Match, Group, TournamentState, TournamentMode, Partner, KnockoutStageRounds } from '../../types';

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
    setTournamentState: (state: TournamentState) => void;
}

export const DataManager: React.FC<DataManagerProps> = ({ 
    teams, matches, groups, rules, banners, partners, headerLogoUrl, mode, knockoutStage, setTournamentState 
}) => {
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeImportKey, setActiveImportKey] = useState<string | null>(null);

    const handleExport = (key: 'teams' | 'matches' | 'rules' | 'settings' | 'all') => {
        try {
            let exportData: any = {};
            let filename = `wakacl-${key}-${new Date().toISOString().split('T')[0]}.json`;

            switch(key) {
                case 'teams': exportData = { teams }; break;
                case 'matches': exportData = { matches, groups, knockoutStage }; break;
                case 'rules': exportData = { rules }; break;
                case 'settings': exportData = { banners, partners, headerLogoUrl }; break;
                case 'all': exportData = { teams, matches, groups, rules, banners, partners, headerLogoUrl, knockoutStage }; break;
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
                // Karena file impor seringkali hanya berisi ID atau struktur melingkar
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
                
                addToast(`DATA BERHASIL DIPULIHKAN: Semua jadwal dan skor telah diperbarui.`, 'success');
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
            <div className="bg-brand-vibrant/10 border border-brand-vibrant/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-brand-vibrant/5 blur-[100px] rounded-full"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Database className="text-brand-vibrant" size={32} />
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Database Management</h2>
                    </div>
                    <p className="text-sm text-brand-light max-w-md">
                        Ekspor atau Impor data turnamen. Gunakan tombol **Restore All Data** untuk memulihkan jadwal lama Anda.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
                    <Button onClick={() => handleExport('all')} variant="secondary" className="!bg-white/5 !border-white/10 !py-3 px-6 text-xs uppercase font-black tracking-widest">
                        <Download size={16} /> Full Backup
                    </Button>
                    <Button onClick={() => triggerImport('all')} className="!py-3 px-8 text-xs uppercase font-black tracking-widest shadow-brand-vibrant/30">
                        <Upload size={16} /> Restore All Data
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DataSection 
                    title="Teams & Profile" 
                    icon={Users} 
                    description="Kelola daftar tim, logo, manager, foto skuad, dan kontak WhatsApp."
                    exportKey="teams"
                    colorClass="text-blue-400"
                />
                <DataSection 
                    title="Matches & Score" 
                    icon={ListChecks} 
                    description="Data jadwal grup, skor pertandingan, link bukti, dan struktur knockout."
                    exportKey="matches"
                    colorClass="text-indigo-400"
                />
                <DataSection 
                    title="Tournament Rules" 
                    icon={BookOpen} 
                    description="Teks peraturan lengkap yang ditampilkan di halaman publik."
                    exportKey="rules"
                    colorClass="text-emerald-400"
                />
                <DataSection 
                    title="Site Settings" 
                    icon={Settings} 
                    description="Banner dashboard, daftar sponsor, dan logo branding header."
                    exportKey="settings"
                    colorClass="text-slate-400"
                />
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-2xl p-5 flex items-start gap-4">
                <AlertTriangle className="text-yellow-500 shrink-0" size={24} />
                <div className="space-y-1">
                    <h5 className="text-sm font-black text-yellow-500 uppercase tracking-wider italic">Instruksi Impor</h5>
                    <p className="text-[11px] text-yellow-100/60 leading-relaxed">
                        Jika Anda mengimpor jadwal saja, pastikan ID tim di file JSON tersebut cocok dengan ID tim yang ada sekarang. Gunakan tombol <strong>"Restore All Data"</strong> untuk keamanan data yang lebih terjamin.
                    </p>
                </div>
            </div>

            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/json" 
                className="hidden" 
            />

            {isProcessing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center">
                    <div className="bg-brand-secondary p-8 rounded-[2rem] border border-brand-vibrant/30 flex flex-col items-center shadow-2xl animate-in zoom-in-95">
                        <RefreshCw className="text-brand-vibrant animate-spin mb-4" size={48} />
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Memproses Data...</h3>
                        <p className="text-brand-light text-sm mt-2">Jangan tutup atau refresh halaman ini.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
