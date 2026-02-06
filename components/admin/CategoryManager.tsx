
import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Plus, Trash2, Tag, Save, Edit } from 'lucide-react';
import { useToast } from '../shared/Toast';

interface CategoryManagerProps {
    categories: string[];
    onUpdate: (cats: string[]) => void;
    title: string;
    isOpen: boolean;
    onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories = [], onUpdate, title, isOpen, onClose }) => {
    const [newCat, setNewCat] = useState('');
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const { addToast } = useToast();

    if (!isOpen) return null;

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const val = newCat.trim();
        if (!val) return;
        if (categories.includes(val)) {
            addToast('Kategori sudah ada.', 'error');
            return;
        }
        onUpdate([...categories, val]);
        setNewCat('');
        addToast('Kategori ditambahkan!', 'success');
    };

    const handleDelete = (val: string) => {
        if (window.confirm(`Hapus kategori "${val}"? Artikel/Produk dengan kategori ini mungkin tidak akan muncul di filter.`)) {
            onUpdate(categories.filter(c => c !== val));
        }
    };

    const startEdit = (idx: number, val: string) => {
        setEditingIdx(idx);
        setEditValue(val);
    };

    const saveEdit = () => {
        const val = editValue.trim();
        if (!val) return;
        const newCats = [...categories];
        newCats[editingIdx!] = val;
        onUpdate(newCats);
        setEditingIdx(null);
        addToast('Kategori diperbarui.', 'success');
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] backdrop-blur-md p-4">
            <Card className="w-full max-w-md relative !p-0 shadow-2xl border-brand-vibrant/30">
                <div className="p-5 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                        <Tag size={18} className="text-brand-vibrant" /> {title}
                    </h3>
                    <button onClick={onClose} className="text-brand-light hover:text-white transition-all"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input 
                            type="text" 
                            value={newCat} 
                            onChange={e => setNewCat(e.target.value)}
                            placeholder="Nama kategori baru..."
                            className="flex-grow bg-brand-primary border border-brand-accent rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-brand-vibrant transition-all"
                        />
                        <Button type="submit" className="!px-4">
                            <Plus size={18} />
                        </Button>
                    </form>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                                {editingIdx === idx ? (
                                    <div className="flex gap-2 w-full">
                                        <input 
                                            type="text" 
                                            value={editValue} 
                                            onChange={e => setEditValue(e.target.value)}
                                            className="flex-grow bg-black/40 border border-brand-vibrant rounded-lg px-2 py-1 text-xs text-white outline-none"
                                            autoFocus
                                        />
                                        <button onClick={saveEdit} className="text-green-400 p-1"><Save size={14}/></button>
                                        <button onClick={() => setEditingIdx(null)} className="text-brand-light p-1"><X size={14}/></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-xs font-bold text-brand-light">{cat}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(idx, cat)} className="p-1.5 text-brand-light hover:text-white bg-white/5 rounded-lg"><Edit size={12}/></button>
                                            <button onClick={() => handleDelete(cat)} className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg"><Trash2 size={12}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};
