
import React, { useRef, useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Upload, X, Loader, Image as ImageIcon, Smartphone } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { uploadTeamLogo } from '../../services/firebaseService';
import { ConfirmationModal } from './ConfirmationModal';

interface BrandingSettingsProps {
    headerLogoUrl: string;
    onUpdateHeaderLogo: (url: string) => void;
    pwaIconUrl: string;
    onUpdatePwaIcon: (url: string) => void;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ headerLogoUrl, onUpdateHeaderLogo, pwaIconUrl, onUpdatePwaIcon }) => {
    const headerInputRef = useRef<HTMLInputElement>(null);
    const pwaInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState<'header' | 'pwa' | null>(null);
    const { addToast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'pwa') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            addToast('Maksimal ukuran file 2MB', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const downloadUrl = await uploadTeamLogo(file);
            if (type === 'header') {
                onUpdateHeaderLogo(downloadUrl);
                addToast('Logo header berhasil diupload!', 'success');
            } else {
                onUpdatePwaIcon(downloadUrl);
                addToast('Ikon aplikasi berhasil diupload! Refresh halaman untuk melihat efek.', 'success');
            }
        } catch (error: any) {
            addToast(error.message || 'Gagal mengupload logo.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const confirmRemove = () => {
        if (showRemoveConfirm === 'header') {
            onUpdateHeaderLogo('');
            addToast('Logo header dihapus.', 'info');
        } else if (showRemoveConfirm === 'pwa') {
            onUpdatePwaIcon('');
            addToast('Ikon custom dihapus. Kembali ke default.', 'info');
        }
        setShowRemoveConfirm(null);
    };

    return (
        <Card className="border-brand-accent/50">
            <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-brand-vibrant" /> Website Branding
            </h3>
            
            <div className="space-y-6">
                {/* Header Logo Section */}
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 w-full md:w-auto flex flex-col items-center">
                        <p className="text-xs font-bold text-brand-light uppercase tracking-widest mb-3">Header Logo</p>
                        <div className="relative h-20 w-full max-w-[280px] bg-brand-primary/80 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                            {headerLogoUrl ? (
                                <img src={headerLogoUrl} alt="Header Branding" className="h-16 w-auto object-contain" />
                            ) : (
                                <div className="text-brand-light/30 text-xs italic">Default Text & Icon</div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader size={20} className="animate-spin text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-3 w-full md:w-auto">
                        <input type="file" ref={headerInputRef} onChange={(e) => handleFileChange(e, 'header')} accept="image/png, image/jpeg, image/webp" className="hidden" />
                        <div className="flex gap-2">
                            <Button onClick={() => headerInputRef.current?.click()} disabled={isUploading} className="flex-1 justify-center text-xs">
                                <Upload size={14} /> {headerLogoUrl ? 'Ganti Logo' : 'Upload Logo'}
                            </Button>
                            {headerLogoUrl && (
                                <Button onClick={() => setShowRemoveConfirm('header')} variant="danger" className="!p-2.5" title="Hapus Logo Custom"><X size={16} /></Button>
                            )}
                        </div>
                        <p className="text-[10px] text-brand-light leading-relaxed">
                            Logo ini akan menggantikan Icon & Teks di navigasi atas. Gunakan file PNG transparan (Rekomendasi tinggi: 40px - 60px).
                        </p>
                    </div>
                </div>

                {/* PWA Icon Section */}
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 w-full md:w-auto flex flex-col items-center">
                        <p className="text-xs font-bold text-brand-light uppercase tracking-widest mb-3">App Icon (PWA)</p>
                        <div className="relative w-20 h-20 bg-brand-primary/80 border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                            {pwaIconUrl ? (
                                <img src={pwaIconUrl} alt="App Icon" className="w-full h-full object-cover" />
                            ) : (
                                <Smartphone className="text-brand-light/20" size={32} />
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader size={20} className="animate-spin text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-3 w-full md:w-auto">
                        <input type="file" ref={pwaInputRef} onChange={(e) => handleFileChange(e, 'pwa')} accept="image/png, image/jpeg" className="hidden" />
                        <div className="flex gap-2">
                            <Button onClick={() => pwaInputRef.current?.click()} disabled={isUploading} className="flex-1 justify-center text-xs">
                                <Upload size={14} /> {pwaIconUrl ? 'Ganti Icon' : 'Upload Icon'}
                            </Button>
                            {pwaIconUrl && (
                                <Button onClick={() => setShowRemoveConfirm('pwa')} variant="danger" className="!p-2.5" title="Hapus Icon Custom"><X size={16} /></Button>
                            )}
                        </div>
                        <p className="text-[10px] text-brand-light leading-relaxed">
                            Icon ini akan muncul saat user menginstall aplikasi ke layar utama (Add to Home Screen). <strong>Wajib rasio 1:1 (Persegi), format PNG, minimal 512x512px.</strong>
                        </p>
                    </div>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={!!showRemoveConfirm}
                onClose={() => setShowRemoveConfirm(null)}
                onConfirm={confirmRemove}
                title="Hapus Branding"
                message="Anda akan menghapus gambar custom ini dan kembali ke default. Lanjutkan?"
                confirmText="Hapus"
            />
        </Card>
    );
};
