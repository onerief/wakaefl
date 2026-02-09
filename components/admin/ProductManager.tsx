
import React, { useState } from 'react';
import type { Product } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Plus, Trash2, ShoppingBag, Save, X, Edit, Loader, Image as ImageIcon, Tag } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { CategoryManager } from './CategoryManager';
import { ConfirmationModal } from './ConfirmationModal';

interface ProductManagerProps {
    products: Product[];
    onUpdateProducts: (products: Product[]) => void;
    categories?: string[];
    onUpdateCategories?: (cats: string[]) => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ products = [], onUpdateProducts, categories = [], onUpdateCategories }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const { addToast } = useToast();

    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState(categories[0] || 'Coin');
    const [isSaving, setIsSaving] = useState(false);

    const resetForm = () => {
        setName('');
        setPrice(0);
        setDescription('');
        setImageUrl('');
        setCategory(categories[0] || 'Coin');
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const updatedProducts = [...products];

        if (editingId) {
            const index = updatedProducts.findIndex(p => p.id === editingId);
            if (index !== -1) {
                updatedProducts[index] = { ...updatedProducts[index], name, price, description, imageUrl, category };
            }
            addToast('Produk Shop diperbarui!', 'success');
        } else {
            const newProduct: Product = {
                id: `prod-${Date.now()}`,
                name, price, description, category,
                imageUrl: imageUrl || 'https://images.unsplash.com/photo-1614680376593-902f74cc0d41?auto=format&fit=crop&q=80&w=400',
                isAvailable: true
            };
            updatedProducts.push(newProduct);
            addToast('Item berhasil dipajang di Shop!', 'success');
        }

        onUpdateProducts(updatedProducts);
        resetForm();
        setIsSaving(false);
    };

    const handleEdit = (p: Product) => {
        setEditingId(p.id);
        setName(p.name);
        setPrice(p.price);
        setDescription(p.description);
        setImageUrl(p.imageUrl);
        setCategory(p.category);
        setIsFormOpen(true);
    };

    const confirmDelete = () => {
        if (productToDelete) {
            onUpdateProducts(products.filter(p => p.id !== productToDelete));
            addToast('Item shop dihapus.', 'info');
            setProductToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                        <ShoppingBag size={20} className="text-emerald-400" /> Shop Manager
                    </h3>
                    <p className="text-[10px] text-brand-light uppercase opacity-60">Kelola jualan koin, akun, dan merchandise.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsCatManagerOpen(true)}
                        className="px-4 py-2 bg-white/5 hover:bg-emerald-500/20 border border-white/10 rounded-xl text-[10px] font-black uppercase text-brand-light hover:text-emerald-400 transition-all flex items-center gap-2"
                    >
                        <Tag size={14} /> Kelola Kategori
                    </button>
                    {!isFormOpen && (
                        <Button onClick={() => setIsFormOpen(true)} className="!py-2 !px-5 !text-[10px] font-black uppercase">
                            <Plus size={16} /> Tambah Item Shop
                        </Button>
                    )}
                </div>
            </div>

            {isFormOpen && (
                <Card className="border-emerald-500/30 animate-in slide-in-from-top-4">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-brand-light uppercase mb-1">Nama Item</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: 1000 Koin eFootball" className="w-full p-3 bg-brand-primary border border-brand-accent rounded-xl text-white text-xs outline-none" required />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-light uppercase mb-1">Harga (IDR)</label>
                                        <input type="number" value={price} onChange={e => setPrice(parseInt(e.target.value))} className="w-full p-3 bg-brand-primary border border-brand-accent rounded-xl text-white text-xs outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-light uppercase mb-1">Kategori</label>
                                        <select 
                                            value={category} onChange={e => setCategory(e.target.value)} 
                                            className="w-full p-3 bg-brand-primary border border-brand-accent rounded-xl text-white text-xs outline-none"
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-light uppercase mb-1">URL Gambar Produk</label>
                                    <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full p-3 bg-brand-primary border border-brand-accent rounded-xl text-white text-xs outline-none" placeholder="https://..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-brand-light uppercase mb-1">Deskripsi & Syarat</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-40 p-4 bg-brand-primary border border-brand-accent rounded-xl text-white text-xs outline-none resize-none" placeholder="Tulis rincian produk..." required />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                            <Button type="button" variant="secondary" onClick={resetForm}>Batal</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader className="animate-spin" /> : <><Save size={16} /> Simpan ke Shop</>}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p => (
                    <div key={p.id} className="bg-brand-primary/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                        <div className="aspect-square relative">
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[8px] font-black text-emerald-400 border border-emerald-500/20">{p.category}</div>
                        </div>
                        <div className="p-3">
                            <h4 className="font-bold text-white text-[10px] sm:text-xs truncate">{p.name}</h4>
                            <p className="text-[10px] text-emerald-400 italic font-black">{new Intl.NumberFormat('id-ID').format(p.price)}</p>
                        </div>
                        <div className="p-2 bg-black/20 border-t border-white/5 flex gap-2">
                            <button onClick={() => handleEdit(p)} className="flex-1 py-2 bg-white/5 hover:bg-brand-vibrant transition-colors rounded-lg flex justify-center text-brand-light hover:text-white"><Edit size={14}/></button>
                            <button onClick={() => setProductToDelete(p.id)} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500 transition-colors rounded-lg flex justify-center text-red-400 hover:text-white"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>

            <CategoryManager 
                isOpen={isCatManagerOpen} onClose={() => setIsCatManagerOpen(false)}
                title="Kelola Kategori Shop" categories={categories} 
                onUpdate={onUpdateCategories || (() => {})}
            />

            <ConfirmationModal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Produk"
                message="Anda yakin ingin menghapus item ini dari Shop?"
                confirmText="Hapus"
            />
        </div>
    );
};
