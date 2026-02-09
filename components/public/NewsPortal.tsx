
import React, { useState, useMemo, useEffect } from 'react';
import type { NewsItem, TournamentState } from '../../types';
import { Card } from '../shared/Card';
import { Clock, Search, Newspaper, Calendar, ArrowRight, Share2, Tag } from 'lucide-react';

interface NewsPortalProps {
    news: NewsItem[];
    categories?: string[];
    deepLinkNewsId?: string | null;
    onNavigateToArticle?: (id: string) => void;
    onBackToPortal?: () => void;
}

export const NewsPortal: React.FC<NewsPortalProps> = ({ 
    news = [], 
    categories = ['Match', 'Transfer', 'Info', 'Interview'],
    deepLinkNewsId,
    onNavigateToArticle,
    onBackToPortal
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [readingItem, setReadingItem] = useState<NewsItem | null>(null);

    const availableCategories = useMemo(() => ['All', ...categories], [categories]);

    // Handle deep linking on mount or data change
    useEffect(() => {
        if (deepLinkNewsId && news.length > 0) {
            const article = news.find(n => n.id === deepLinkNewsId || createSlug(n.title) === deepLinkNewsId);
            if (article) {
                setReadingItem(article);
            }
        } else if (!deepLinkNewsId) {
            setReadingItem(null);
        }
    }, [deepLinkNewsId, news]);

    const filteredNews = useMemo(() => {
        return news
            .filter(item => {
                const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     item.content.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
                return matchesSearch && matchesCat;
            })
            .sort((a, b) => b.date - a.date);
    }, [news, searchTerm, selectedCategory]);

    const featuredItem = filteredNews[0];
    const otherItems = filteredNews.slice(1);

    // Slug generator for clean URLs
    function createSlug(title: string) {
        return title.toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }

    const handleItemClick = (item: NewsItem) => {
        const slug = createSlug(item.title);
        if (onNavigateToArticle) {
            onNavigateToArticle(slug);
        } else {
            setReadingItem(item);
        }
    };

    if (readingItem) {
        return (
            <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20">
                <button 
                    onClick={() => onBackToPortal ? onBackToPortal() : setReadingItem(null)}
                    className="flex items-center gap-2 text-brand-light hover:text-white mb-8 transition-colors group"
                >
                    <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Kembali ke Portal
                </button>

                <div className="relative aspect-[21/9] w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl mb-8">
                    <img src={readingItem.imageUrl} alt={readingItem.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                        <span className="px-3 py-1 bg-brand-vibrant text-white text-[10px] font-black uppercase rounded-full shadow-lg mb-3 inline-block">
                            {readingItem.category}
                        </span>
                        <h1 className="text-2xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                            {readingItem.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-6 mb-8 px-4 border-y border-white/5 py-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-vibrant/20 flex items-center justify-center text-brand-vibrant">W</div>
                        <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-wider">{readingItem.author}</p>
                            <p className="text-[8px] text-brand-light font-bold uppercase opacity-60">Way Kanan Media Hub</p>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    <div className="flex items-center gap-2 text-brand-light">
                        <Calendar size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{new Date(readingItem.date).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Render HTML Content */}
                <div className="px-4">
                    <div 
                        className="prose prose-invert max-w-none prose-p:text-brand-light prose-p:leading-relaxed prose-strong:text-white prose-headings:text-white prose-a:text-brand-vibrant prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 news-content"
                        dangerouslySetInnerHTML={{ __html: readingItem.content }}
                    />
                    <style>{`
                        .news-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                        .news-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
                        .news-content h1 { font-size: 2em; margin-bottom: 0.5em; margin-top: 1em; font-weight: 800; font-style: italic; }
                        .news-content h2 { font-size: 1.5em; margin-bottom: 0.5em; margin-top: 1em; font-weight: 700; }
                        .news-content p { margin-bottom: 1em; }
                    `}</style>
                </div>
                
                <div className="mt-16 pt-8 border-t border-white/5 flex justify-center">
                    <button 
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: readingItem.title,
                                    url: window.location.href
                                });
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Link berhasil disalin!');
                            }
                        }}
                        className="flex items-center gap-2 px-8 py-4 bg-brand-primary border border-white/10 rounded-2xl text-brand-light hover:text-white transition-all"
                    >
                        <Share2 size={18} /> Bagikan Artikel Ini
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* News Header & Search */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-4">
                        <Newspaper size={50} className="text-brand-vibrant" /> Portal Berita
                    </h2>
                    <p className="text-brand-light font-bold uppercase tracking-widest text-[10px] opacity-60">Sajian Informasi Terpercaya eFootball Way Kanan</p>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-80">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light/30" size={16} />
                        <input 
                            type="text" 
                            placeholder="Cari berita..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-brand-secondary/50 border border-white/5 rounded-xl text-xs font-bold text-white focus:border-brand-vibrant transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {availableCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                            selectedCategory === cat 
                            ? 'bg-brand-vibrant border-brand-vibrant text-white shadow-lg shadow-brand-vibrant/20' 
                            : 'bg-white/5 border-white/5 text-brand-light hover:text-white hover:border-white/20'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {filteredNews.length === 0 ? (
                <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem]">
                    <Newspaper size={48} className="mx-auto text-brand-light/20 mb-4" />
                    <p className="text-brand-light italic">Tidak ada berita yang ditemukan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* FEATURED NEWS */}
                    {featuredItem && (
                        <div className="lg:col-span-8 group cursor-pointer" onClick={() => handleItemClick(featuredItem)}>
                            <Card className="!p-0 border-white/5 bg-brand-secondary/40 h-full !rounded-[2.5rem] overflow-hidden group-hover:border-brand-vibrant/30 transition-all">
                                <div className="relative aspect-[21/10] overflow-hidden">
                                    <img src={featuredItem.imageUrl} alt={featuredItem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                    <div className="absolute top-6 left-6">
                                        <span className="px-4 py-1.5 bg-brand-vibrant/90 backdrop-blur-md text-white text-[10px] font-black uppercase rounded-full shadow-2xl">
                                            HEADLINE NEWS
                                        </span>
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <h3 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-tight mb-2">
                                            {featuredItem.title}
                                        </h3>
                                        <p className="text-brand-light/80 text-xs md:text-sm line-clamp-2 max-w-2xl font-medium">
                                            {featuredItem.content.replace(/<[^>]+>/g, '')}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* SIDEBAR NEWS */}
                    <div className="lg:col-span-4 space-y-6">
                        <h3 className="text-xs font-black text-brand-light uppercase tracking-widest px-1">Terpopuler Pekan Ini</h3>
                        <div className="space-y-4">
                            {otherItems.slice(0, 4).map((item) => (
                                <div 
                                    key={item.id} 
                                    className="flex gap-4 group cursor-pointer"
                                    onClick={() => handleItemClick(item)}
                                >
                                    <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-white/5">
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex-grow min-w-0 flex flex-col justify-center">
                                        <span className="text-[8px] font-black text-brand-vibrant uppercase tracking-widest mb-1">{item.category}</span>
                                        <h4 className="text-xs font-black text-white italic uppercase leading-snug line-clamp-2 group-hover:text-brand-vibrant transition-colors">
                                            {item.title}
                                        </h4>
                                        <span className="text-[9px] text-brand-light opacity-40 mt-1 font-bold">{new Date(item.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
