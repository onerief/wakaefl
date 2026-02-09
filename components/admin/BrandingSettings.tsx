
import React, { useRef, useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Upload, X, Loader, Image as ImageIcon, Check } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { uploadTeamLogo } from '../../services/firebaseService';
import { ConfirmationModal } from './ConfirmationModal';

interface BrandingSettingsProps {
    headerLogoUrl: string;
    onUpdateHeaderLogo: (url: string) => void;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ headerLogoUrl, onUpdateHeaderLogo }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const { addToast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            addToast('Maksimal ukuran file 2MB', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const downloadUrl = await uploadTeamLogo(file);
            onUpdateHeaderLogo(downloadUrl);
            addToast('Logo header berhasil diupload!', 'success');
        } catch (error: any) {
            addToast(error.message || 'Gagal mengupload logo.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const confirmRemove = () => {
        onUpdateHeaderLogo('');
        addToast('Logo header dihapus.', 'info');
        setShowRemoveConfirm(false);
    };

    return (
        <Card className="border-brand-accent/50">
            <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-brand-vibrant" /> Website Branding
            </h3>
            
            <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col md:flex-row items-center gap-6">
                
                {/* Preview Section */}
                <div className="flex-1 w-full md:w-auto flex flex-col items-center">
                    <p className="text-xs font-bold text-brand-light uppercase tracking-widest mb-3">Header Logo Preview</p>
                    <div className="relative h-20 w-full max-w-[280px] bg-brand-primary/80 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                        {headerLogoUrl ? (
                            <img 
                                src={headerLogoUrl} 
                                alt="Header Branding" 
                                className="h-16 w-auto object-contain" 
                            />
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

                {/* Actions Section */}
                <div className="flex-1 flex flex-col gap-3 w-full md:w-auto">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                    />
                    
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isUploading}
                            className="flex-1 justify-center text-xs"
                        >
                            <Upload size={14} /> {headerLogoUrl ? 'Ganti Logo' : 'Upload Logo'}
                        </Button>
                        
                        {headerLogoUrl && (
                            <Button 
                                onClick={() => setShowRemoveConfirm(true)}
                                variant="danger"
                                className="!p-2.5"
                                title="Hapus Logo Custom"
                            >
                                <X size={16} />
                            </Button>
                        )}
                    </div>
                    
                    <p className="text-[10px] text-brand-light leading-relaxed">
                        Logo ini akan menggantikan Icon & Teks "WAY KANAN WAKACL Hub" di navigasi atas. Gunakan file PNG transparan untuk hasil terbaik (Rekomendasi tinggi: 40px - 60px).
                    </p>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={showRemoveConfirm}
                onClose={() => setShowRemoveConfirm(false)}
                onConfirm={confirmRemove}
                title="Hapus Branding"
                message="Anda akan menghapus logo custom dan kembali ke tampilan default website. Lanjutkan?"
                confirmText="Hapus Logo"
            />
        </Card>
    );
};
