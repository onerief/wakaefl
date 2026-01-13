
import React, { useState, useRef } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Upload, UserCircle, MessageCircle, Instagram, Loader, Send } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { uploadTeamLogo, submitNewTeamRegistration } from '../../services/firebaseService';
import { TeamLogo } from '../shared/TeamLogo';
import type { User } from 'firebase/auth';

interface TeamRegistrationModalProps {
    currentUser: User;
    onClose: () => void;
}

export const TeamRegistrationModal: React.FC<TeamRegistrationModalProps> = ({ currentUser, onClose }) => {
    const [name, setName] = useState('');
    const [manager, setManager] = useState(currentUser.displayName || '');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [socialMediaUrl, setSocialMediaUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

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
                ownerEmail: currentUser.email || ''
            }, currentUser.email || '');
            
            addToast('Formulir pendaftaran berhasil dikirim! Tunggu persetujuan admin.', 'success');
            onClose();
        } catch (error) {
            console.error(error);
            addToast('Gagal mengirim pendaftaran.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-lg relative !p-0 overflow-hidden shadow-2xl !bg-brand-primary border-brand-vibrant/20 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-brand-secondary/50 p-5 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Form Pendaftaran Tim</h2>
                        <p className="text-xs text-brand-light">Daftarkan tim baru untuk mengikuti kompetisi.</p>
                    </div>
                    <button onClick={onClose} className="text-brand-light hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
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
                                    <Upload size={14} /> Upload Logo
                                </Button>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
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
                            
                            <div className="p-3 bg-brand-vibrant/10 border border-brand-vibrant/20 rounded-lg">
                                <p className="text-[10px] text-brand-light">
                                    <strong className="text-brand-vibrant">Info:</strong> Pendaftaran ini akan dikirim ke Admin untuk ditinjau. Setelah disetujui, Anda otomatis menjadi pemilik tim ini.
                                </p>
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
    );
};
