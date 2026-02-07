
import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Plus, Trash2, Zap, Save, Type, AlertCircle } from 'lucide-react';
import { useToast } from '../shared/Toast';

interface MarqueeSettingsProps {
    messages: string[];
    onUpdate: (msgs: string[]) => void;
}

export const MarqueeSettings: React.FC<MarqueeSettingsProps> = ({ messages, onUpdate }) => {
    const [newMessage, setNewMessage] = useState('');
    const { addToast } = useToast();

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const msg = newMessage.trim().toUpperCase();
        if (!msg) return;
        
        onUpdate([...messages, msg]);
        setNewMessage('');
        addToast('Teks berjalan ditambahkan!', 'success');
    };

    const handleDelete = (index: number) => {
        const updated = messages.filter((_, i) => i !== index);
        onUpdate(updated);
        addToast('Pesan dihapus.', 'info');
    };

    return (
        <Card className="border-brand-vibrant/20">
            <h3 className="text-lg font-black text-white italic uppercase tracking-widest mb-6 flex items-center gap-2">
                <Type size={20} className="text-brand-vibrant" /> Pengaturan Running Text
            </h3>

            <div className="space-y-6">
                <form onSubmit={handleAdd} className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-2 ml-1">Tambah Pesan Baru</label>
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <Zap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-vibrant" />
                            <input 
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="MASUKKAN PENGUMUMAN DI SINI..."
                                className="w-full pl-9 pr-4 py-3 bg-brand-primary border border-brand-accent rounded-xl text-white text-xs font-bold outline-none focus:border-brand-vibrant transition-all"
                            />
                        </div>
                        <Button type="submit" className="!px-6 !py-3">
                            <Plus size={18} />
                        </Button>
                    </div>
                    <p className="text-[9px] text-brand-light/40 mt-2 px-1 flex items-center gap-1">
                        <AlertCircle size={10} /> Tips: Teks akan otomatis dikonversi ke HURUF KAPITAL.
                    </p>
                </form>

                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-brand-light uppercase tracking-widest px-1">Daftar Pesan Aktif</h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {messages.length > 0 ? messages.map((msg, index) => (
                            <div key={index} className="flex items-center justify-between gap-4 p-3 bg-white/5 border border-white/5 rounded-xl group hover:border-brand-vibrant/30 transition-all">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-6 h-6 rounded-lg bg-brand-vibrant/10 flex items-center justify-center text-brand-vibrant shrink-0">
                                        <span className="text-[10px] font-black">{index + 1}</span>
                                    </div>
                                    <p className="text-xs font-bold text-brand-text truncate leading-tight uppercase tracking-wide">{msg}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(index)}
                                    className="p-2 text-brand-light hover:text-red-400 transition-all shrink-0"
                                    title="Hapus Pesan"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )) : (
                            <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/10 opacity-30 italic text-xs uppercase tracking-widest font-black">
                                Belum ada running text.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};
