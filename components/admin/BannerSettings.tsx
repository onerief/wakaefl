
import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Plus, Trash2, Image as ImageIcon, ExternalLink, Save, CloudCheck, Loader } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { ConfirmationModal } from './ConfirmationModal';

interface BannerSettingsProps {
    banners: string[];
    onUpdateBanners: (banners: string[]) => void;
}

export const BannerSettings: React.FC<BannerSettingsProps> = ({ banners, onUpdateBanners }) => {
    const [newBannerUrl, setNewBannerUrl] = useState('');
    const [bannerToDeleteIndex, setBannerToDeleteIndex] = useState<number | null>(null);
    const { addToast } = useToast();

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const url = newBannerUrl.trim();
        if (!url) return;
        
        try {
            new URL(url);
        } catch (_) {
            addToast('Harap masukkan URL yang valid (https://...)', 'error');
            return;
        }

        const updatedBanners = [...(banners || []), url];
        onUpdateBanners(updatedBanners);
        setNewBannerUrl('');
        addToast('Banner ditambahkan! Sedang menyinkronkan...', 'info');
    };

    const confirmDelete = () => {
        if (bannerToDeleteIndex !== null) {
            const updatedBanners = (banners || []).filter((_, i) => i !== bannerToDeleteIndex);
            onUpdateBanners(updatedBanners);
            addToast('Banner dihapus dari daftar.', 'info');
            setBannerToDeleteIndex(null);
        }
    };

    return (
        <Card className="border-brand-accent/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
                    <ImageIcon size={20} className="text-brand-vibrant"/>
                    Pengaturan Banner Home
                </h3>
                <div className="flex items-center gap-1 opacity-40">
                    <CloudCheck size={14} className="text-green-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Auto-Sync</span>
                </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-6">
                <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                        <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light/40" />
                        <input 
                            type="url"
                            value={newBannerUrl}
                            onChange={(e) => setNewBannerUrl(e.target.value)}
                            placeholder="URL Gambar Banner (1920x600 recommended)..."
                            className="w-full pl-10 pr-4 py-2.5 bg-brand-primary border border-brand-accent rounded-xl text-brand-text text-sm focus:ring-2 focus:ring-brand-vibrant outline-none transition-all"
                        />
                    </div>
                    <Button type="submit" className="!rounded-xl px-6">
                        <Plus size={16} /> Tambah
                    </Button>
                </form>
                <p className="text-[10px] text-brand-light/40 mt-2 italic px-1">
                    * Banner akan otomatis tersimpan dalam 1 detik. Jangan refresh halaman saat indikator kuning menyala.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {banners && banners.length > 0 ? (
                    banners.map((url, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-white/5 bg-black/40 shadow-lg">
                            <div className="aspect-[21/9] w-full">
                                <img 
                                    src={url} 
                                    alt={`Banner ${index}`} 
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-[8px] text-brand-light truncate max-w-[150px]">{url}</span>
                                    <div className="flex gap-1">
                                        <a href={url} target="_blank" rel="noreferrer" className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                                            <ExternalLink size={12} />
                                        </a>
                                        <button
                                            onClick={() => setBannerToDeleteIndex(index)}
                                            className="p-1.5 bg-red-500/20 hover:bg-red-500 rounded-lg text-red-400 hover:text-white transition-all shadow-lg"
                                            title="Hapus Banner"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-brand-light/20 italic bg-black/20 rounded-2xl border border-white/5 border-dashed">
                        <div className="flex flex-col items-center gap-2">
                            <ImageIcon size={40} className="opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest">Belum ada banner</p>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal 
                isOpen={bannerToDeleteIndex !== null}
                onClose={() => setBannerToDeleteIndex(null)}
                onConfirm={confirmDelete}
                title="Hapus Banner"
                message="Anda yakin ingin menghapus banner ini dari beranda?"
                confirmText="Hapus"
            />
        </Card>
    );
};
