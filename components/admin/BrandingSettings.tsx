
import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Upload, X, Loader, Image as ImageIcon, Smartphone, Link as LinkIcon } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { ConfirmationModal } from './ConfirmationModal';
import { ImageUploadTutorial } from '../shared/ImageUploadTutorial';

interface BrandingSettingsProps {
    headerLogoUrl: string;
    onUpdateHeaderLogo: (url: string) => void;
    pwaIconUrl: string;
    onUpdatePwaIcon: (url: string) => void;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ headerLogoUrl, onUpdateHeaderLogo, pwaIconUrl, onUpdatePwaIcon }) => {
    const [showRemoveConfirm, setShowRemoveConfirm] = useState<'header' | 'pwa' | null>(null);
    const { addToast } = useToast();

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
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-3 w-full md:w-auto">
                        <ImageUploadTutorial />
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon size={14} className="text-brand-light/50" />
                            </div>
                            <input 
                                type="url" 
                                value={headerLogoUrl}
                                onChange={(e) => onUpdateHeaderLogo(e.target.value)}
                                placeholder="URL Header Logo (https://i.ibb.co/...)"
                                className="w-full pl-9 pr-3 py-2.5 bg-brand-primary border border-brand-accent rounded-lg text-brand-text text-xs placeholder-brand-light/30 focus:ring-1 focus:ring-brand-vibrant outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            {headerLogoUrl && (
                                <Button onClick={() => setShowRemoveConfirm('header')} variant="danger" className="w-full justify-center text-xs">
                                    <X size={14} /> Hapus Logo Custom
                                </Button>
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
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-3 w-full md:w-auto">
                        <ImageUploadTutorial />
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon size={14} className="text-brand-light/50" />
                            </div>
                            <input 
                                type="url" 
                                value={pwaIconUrl}
                                onChange={(e) => onUpdatePwaIcon(e.target.value)}
                                placeholder="URL App Icon (https://i.ibb.co/...)"
                                className="w-full pl-9 pr-3 py-2.5 bg-brand-primary border border-brand-accent rounded-lg text-brand-text text-xs placeholder-brand-light/30 focus:ring-1 focus:ring-brand-vibrant outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            {pwaIconUrl && (
                                <Button onClick={() => setShowRemoveConfirm('pwa')} variant="danger" className="w-full justify-center text-xs">
                                    <X size={14} /> Hapus Icon Custom
                                </Button>
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
