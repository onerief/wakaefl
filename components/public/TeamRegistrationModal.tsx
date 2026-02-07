
import React, { useState, useRef, useMemo } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Upload, UserCircle, MessageCircle, Instagram, Loader, Send, Trophy, ChevronDown, Phone, AlertCircle, Copy, Check } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { uploadTeamLogo, submitNewTeamRegistration } from '../../services/firebaseService';
import { TeamLogo } from '../shared/TeamLogo';
import type { User } from 'firebase/auth';
import type { TournamentMode, Team } from '../../types';

interface TeamRegistrationModalProps {
    currentUser: User;
    onClose: () => void;
    userOwnedTeams?: { mode: TournamentMode, team: Team }[];
}

export const TeamRegistrationModal: React.FC<TeamRegistrationModalProps> = ({ currentUser, onClose, userOwnedTeams = [] }) => {
    const [name, setName] = useState('');
    const [manager, setManager] = useState(currentUser.displayName || '');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [socialMediaUrl, setSocialMediaUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [preferredMode, setPreferredMode] = useState<TournamentMode>('league');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    // Unique list of teams owned by user (to avoid duplicates if same team in multiple modes)
    const uniqueExistingTeams = useMemo(() => {
        const map = new Map<string, Team>();
        userOwnedTeams.forEach(ut => map.set(ut.team.id, ut.team));
        return Array.from(map.values());
    }, [userOwnedTeams]);

    const handleUseExistingTeam = (teamId: string) => {
        if (!teamId) return;
        const team = uniqueExistingTeams.find(t => t.id === teamId);
        if (team) {
            setName(team.name || '');
            setManager(team.manager || currentUser.displayName || '');
            setWhatsappNumber(team.whatsappNumber || '');
            setSocialMediaUrl(team.socialMediaUrl || '');
            setLogoUrl(team.logoUrl || '');
            addToast(`Data tim "${team.name}" berhasil dimuat!`, 'success');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            addToast('Ukuran file maksimal 2MB', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const downloadUrl = await uploadTeamLogo(file);
            setLogoUrl(downloadUrl);
            addToast('Logo berhasil diupload!', 'success');
        } catch (error: any) {
            addToast(error.message || 'Gagal mengupload logo.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!name.trim()) {
            addToast('Nama tim wajib diisi.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await submitNewTeamRegistration({
                name: name.trim(),
                manager: manager.trim(),
                whatsappNumber: whatsappNumber.trim(),
                socialMediaUrl: socialMediaUrl.trim(),
                logoUrl: logoUrl,
                ownerEmail: currentUser.email || '',
                preferredMode: preferredMode
            }, currentUser.email || '');
            
            addToast('Formulir pendaftaran berhasil dikirim! Tunggu persetujuan admin.', 'success');
            onClose();
        } catch (error: any) {
            setSubmitError(`Gagal mengirim: ${error.message || 'Masalah Jaringan'}`);
            addToast('Gagal mengirim pendaftaran.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md">
            <div className="flex min-h-full items-center justify-center p-4">
                <Card className="w-full max-w-lg relative !p-0 overflow-hidden shadow-2xl !bg-brand-primary border-brand-vibrant/20 flex flex-col">
                    {/* Header */}
                    <div className="bg-brand-secondary/50 p-5 border-b border-white/5 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Form Pendaftaran Tim</h2>
                            <p className="text-xs text-brand-light">Daftarkan tim untuk musim kompetisi baru.</p>
                        </div>
                        <button onClick={onClose} className="text-brand-light hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
                        {submitError && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                                <AlertCircle size={20} />
                                <p className="text-xs font-bold">{submitError}</p>
                            </div>
                        )}

                        {/* USE EXISTING TEAM SELECTOR */}
                        {uniqueExistingTeams.length > 0 && (
                            <div className="mb-8 p-4 bg-brand-vibrant/5 border border-brand-vibrant/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                                <label className="block text-[10px] font-black text-brand-vibrant uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Check size={14} className="bg-brand-vibrant text-white rounded-full p-0.5" />
                                    Pilih Tim Anda Yang Sudah Ada
                                </label>
                                <div className="relative">
                                    <select
                                        onChange={(e) => handleUseExistingTeam(e.target.value)}
                                        className="w-full pl-4 pr-10 py-3 bg-brand-primary border border-brand-accent rounded-xl text-white text-xs font-bold focus:ring-2 focus:ring-brand-vibrant outline-none appearance-none"
                                        defaultValue=""
                                    >
                                        <option value="">-- Gunakan Data Tim Sebelumnya --</option>
                                        {uniqueExistingTeams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-light">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                                <p className="text-[9px] text-brand-light/50 mt-2 italic">* Memilih tim akan mengisi otomatis Nama, Manager, WA, IG, dan Logo.</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Logo Upload */}
                            <div className="flex flex-col items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                <div className="relative group">
                                    <TeamLogo logoUrl={logoUrl} teamName={name || "New Team"} className="w-24 h-24" />
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                            <Loader className="animate-spin text-white" size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 w-full max-w-xs">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <Button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()} 
                                        variant="secondary" 
                                        disabled={isUploading}
                                        className="w-full flex justify-center text-xs"
                                    >
                                        <Upload size={14} /> {logoUrl ? 'Ganti Logo' : 'Upload Logo'}
                                    </Button>
                                </div>
                            </div>

                            {/* Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-light uppercase mb-1">Target Kompetisi *</label>
                                    <div className="relative">
                                        <Trophy size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-vibrant" />
                                        <select
                                            value={preferredMode}
                                            onChange={(e) => setPreferredMode(e.target.value as TournamentMode)}
                                            className="w-full pl-10 pr-10 p-3 bg-brand-secondary border border-brand-accent rounded-xl text-white text-sm focus:ring-2 focus:ring-brand-vibrant outline-none appearance-none"
                                            required
                                        >
                                            <option value="league">Liga Reguler</option>
                                            <option value="two_leagues">2 Wilayah (Neraka/Surga)</option>
                                            <option value="wakacl">WAKACL (Champions League)</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-light">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-brand-light uppercase mb-1">Nama Tim *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Contoh: Garuda FC"
                                        className="w-full p-3 bg-brand-secondary border border-brand-accent rounded-xl text-white text-sm focus:ring-2 focus:ring-brand-vibrant outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-brand-light uppercase mb-1">Nama Manager *</label>
                                    <div className="relative">
                                        <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" />
                                        <input
                                            type="text"
                                            value={manager}
                                            onChange={(e) => setManager(e.target.value)}
                                            placeholder="Nama Panggilan"
                                            className="w-full pl-10 p-3 bg-brand-secondary border border-brand-accent rounded-xl text-white text-sm focus:ring-2 focus:ring-brand-vibrant outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-brand-light uppercase mb-1">No. WhatsApp</label>
                                        <div className="relative">
                                            <MessageCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                                            <input
                                                type="text"
                                                value={whatsappNumber}
                                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                                placeholder="08..."
                                                className="w-full pl-10 p-3 bg-brand-secondary border border-brand-accent rounded-xl text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-brand-light uppercase mb-1">Instagram</label>
                                        <div className="relative">
                                            <Instagram size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" />
                                            <input
                                                type="text"
                                                value={socialMediaUrl}
                                                onChange={(e) => setSocialMediaUrl(e.target.value)}
                                                placeholder="Link Profile"
                                                className="w-full pl-10 p-3 bg-brand-secondary border border-brand-accent rounded-xl text-white text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button type="submit" className="w-full justify-center py-3 text-sm font-bold" disabled={isSubmitting || isUploading}>
                                    {isSubmitting ? <Loader className="animate-spin" /> : <><Send size={16} /> Kirim Pendaftaran</>}
                                </Button>
                            </div>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    );
};
