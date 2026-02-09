
import React, { useState } from 'react';
import type { NewsItem } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Plus, Trash2, Newspaper, Image as ImageIcon, Save, X, Edit, Loader, Tag } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { CategoryManager } from './CategoryManager';
import { RichTextEditor } from '../shared/RichTextEditor';
import { ConfirmationModal } from './ConfirmationModal';

interface NewsManagerProps {
    news: NewsItem[];
    onUpdateNews: (news: NewsItem[]) => void;
    categories?: string[];
    onUpdateCategories?: (cats: string[]) => void;
}

export const NewsManager: React.FC<NewsManagerProps> = ({ news = [], onUpdateNews, categories = [], onUpdateCategories }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const { addToast } = useToast();

    // Form States
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState(categories[0] || 'Info');
    const [isSaving, setIsSaving] = useState(false);

    const resetForm = () => {
        setTitle('');
        setContent('');
        setImageUrl('');
        setCategory(categories[0] || 'Info');
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Check content length slightly differently for HTML strings
        if (!title.trim() || content.trim() === '' || content === '<br>') {
            addToast('Judul dan isi berita wajib diisi.', 'error');
            return;
        }

        setIsSaving(true);
        const newsItems = [...news];

        if (editingId) {
            const index = newsItems.findIndex(n => n.id === editingId);
            if (index !== -1) {
                newsItems[index] = { ...newsItems[index], title, content, imageUrl, category };
            }
            addToast('Berita berhasil diperbarui!', 'success');
        } else {
            const newItem: NewsItem = {
                id: `news-${Date.now()}`,
                title, content, category,
                imageUrl: imageUrl || 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800',
                date: Date.now(),
                author: 'Admin'
            };
            newsItems.push(newItem);
            addToast('Berita berhasil diterbitkan!', 'success');
        }

        onUpdateNews(newsItems);
        resetForm();
        setIsSaving(false);
    };

    const handleEdit = (item: NewsItem) => {
        setEditingId(item.id);
        setTitle(item.title);
        setContent(item.content);
        setImageUrl(item.imageUrl);
        setCategory(item.category);
        setIsFormOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            onUpdateNews(news.filter(n => n.id !== itemToDelete));
            addToast('Berita telah dihapus.', 'info');
            setItemToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                        <Newspaper size={20} className="text-brand-vibrant" /> Portal Berita Manager
                    </h3>
                    <p className="text-[10px] text-brand-light uppercase opacity-60">Kelola artikel dan pengumuman komunitas.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsCatManagerOpen(true)}
                        className="px-4 py-2 bg-white/5 hover:bg-brand-vibrant/20 border border-white/10 rounded-xl text-[10px] font-black uppercase text-brand-light hover:text-brand-vibrant transition-all flex items-center gap-2"
                    >
                        <Tag size={14} /> Kelola Kategori
                    </button>
                    {!isFormOpen && (
                        <Button onClick={() => setIsFormOpen(true)} className="!py-2 !px-5 !text-[10px] font-black uppercase">
                            <Plus size={16} /> Buat Berita Baru
                        </Button>
                    )}
                </div>
            </div>

            {isFormOpen && (
                <Card className="border-brand-vibrant/30 animate-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <h4 className="font-black text-brand-vibrant uppercase tracking-widest italic">
                                {editingId ? 'Edit Artikel' : 'Tulis Artikel Baru'}
                            </h4>
                            <button onClick={resetForm} type="button" className="text-brand-light hover:text-white p-1 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Judul Artikel</label>
                                    <input 
                                        type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul berita yang menarik..."
                                        className="w-full p-3 bg-brand-primary border border-brand-accent rounded-xl text-white text-sm focus:ring-1 focus:ring-brand-vibrant outline-none" required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Kategori</label>
                                        <select 
                                            value={category} onChange={(e) => setCategory(e.target.value)}
                                            className="w-full p-3 bg-brand-primary border border-brand-accent rounded-xl text-white text-xs focus:ring-1 focus:ring-brand-vibrant outline-none"
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">URL Thumbnail</label>
                                        <div className="relative">
                                            <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light/30" />
                                            <input 
                                                type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Link Gambar..."
                                                className="w-full pl-9 pr-3 py-3 bg-brand-primary border border-brand-accent rounded-xl text-white text-[10px] focus:ring-1 focus:ring-brand-vibrant outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Isi Berita</label>
                                <RichTextEditor 
                                    value={content} 
                                    onChange={setContent} 
                                    placeholder="Tulis berita lengkap, gunakan toolbar untuk memformat teks..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/5">
                            <Button type="submit" disabled={isSaving} className="!px-10 !py-3 shadow-lg shadow-brand-vibrant/20">
                                {isSaving ? <Loader className="animate-spin" /> : <><Save size={18} /> Terbitkan Sekarang</>}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.length > 0 ? [...news].sort((a,b) => b.date - a.date).map((item) => (
                    <div key={item.id} className="bg-brand-primary/40 border border-white/5 rounded-2xl overflow-hidden group hover:border-brand-vibrant/30 transition-all flex flex-col">
                        <div className="aspect-video relative overflow-hidden">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] font-black text-white uppercase">{item.category}</div>
                        </div>
                        <div className="p-4 flex-grow">
                            <h4 className="font-black text-white italic uppercase text-xs line-clamp-2 mb-2">{item.title}</h4>
                            {/* Remove Tags for preview text to keep it clean */}
                            <p className="text-[10px] text-brand-light line-clamp-3 opacity-60 mb-4">
                                {item.content.replace(/<[^>]+>/g, '')}
                            </p>
                        </div>
                        <div className="p-3 bg-black/20 border-t border-white/5 flex justify-between items-center">
                            <span className="text-[9px] font-bold text-brand-light opacity-40">{new Date(item.date).toLocaleDateString()}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(item)} className="p-1.5 bg-white/5 hover:bg-brand-vibrant hover:text-white text-brand-light rounded-lg transition-all"><Edit size={14}/></button>
                                <button onClick={() => setItemToDelete(item.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition-all"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-16 text-center bg-black/20 rounded-[2rem] border border-dashed border-white/10 opacity-30 italic font-black uppercase text-xs tracking-widest">
                        Belum ada berita yang diterbitkan.
                    </div>
                )}
            </div>

            <CategoryManager 
                isOpen={isCatManagerOpen} onClose={() => setIsCatManagerOpen(false)}
                title="Kelola Kategori Berita" categories={categories} 
                onUpdate={onUpdateCategories || (() => {})}
            />

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Berita"
                message="Anda yakin ingin menghapus artikel ini secara permanen? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus"
            />
        </div>
    );
};
