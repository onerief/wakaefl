
import React, { useState, useMemo } from 'react';
import type { Product } from '../../types';
import { Card } from '../shared/Card';
import { ShoppingBag, Search, MessageCircle, Zap, ShieldCheck, Tag } from 'lucide-react';

interface StoreFrontProps {
    products: Product[];
    categories?: string[];
}

export const StoreFront: React.FC<StoreFrontProps> = ({ products = [], categories = ['Coin', 'Account', 'Jasa', 'Merch'] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const availableCategories = useMemo(() => ['All', ...categories], [categories]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
            return matchesSearch && matchesCat && p.isAvailable;
        });
    }, [products, searchTerm, selectedCategory]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    };

    const handleBuy = (product: Product) => {
        const message = `Halo Admin WAKACL, saya ingin memesan:\n\n*Produk:* ${product.name}\n*Harga:* ${formatPrice(product.price)}\n\nMohon informasi pembayarannya.`;
        window.open(`https://wa.me/6289646800884?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-gradient-to-br from-emerald-900 via-brand-primary to-brand-primary p-6 sm:p-12 border border-emerald-500/20 shadow-2xl">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div className="relative z-10 text-center sm:text-left">
                    <h1 className="text-3xl sm:text-6xl font-black text-white italic uppercase tracking-tighter mb-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center sm:justify-start">
                        <ShoppingBag size={48} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" /> 
                        <span>Waka Shop</span>
                    </h1>
                    <p className="text-emerald-100/60 text-xs sm:text-lg max-w-xl font-medium uppercase tracking-widest sm:normal-case sm:tracking-normal">
                        Top-Up Coin & Kebutuhan eFootball Terpercaya di Way Kanan.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-4 bg-brand-secondary/40 p-3 sm:p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                                selectedCategory === cat 
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                : 'bg-white/5 border-white/5 text-brand-light hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light/30" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari item di shop..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-brand-primary border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all placeholder:text-brand-light/20 shadow-inner"
                    />
                </div>
            </div>

            {/* Grid Produk */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                    <Card key={product.id} className="group !p-0 border-white/5 bg-brand-secondary/30 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden flex flex-col">
                        <div className="relative aspect-square overflow-hidden bg-black/40">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute top-2 left-2">
                                <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-emerald-400 text-[7px] sm:text-[9px] font-black uppercase rounded border border-emerald-500/30">
                                    {product.category}
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-3 sm:p-5 flex-grow flex flex-col">
                            <h3 className="text-[10px] sm:text-sm font-black text-white uppercase italic mb-1 group-hover:text-emerald-400 transition-colors line-clamp-2">{product.name}</h3>
                            <p className="text-[8px] sm:text-[10px] text-brand-light opacity-50 line-clamp-1 mb-3">{product.description}</p>
                            
                            <div className="mt-auto">
                                <div className="text-xs sm:text-lg font-black text-white mb-3 italic tracking-tight">{formatPrice(product.price)}</div>
                                <button 
                                    onClick={() => handleBuy(product)}
                                    className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 group/btn"
                                >
                                    <MessageCircle size={14} className="sm:w-4 sm:h-4 group-hover/btn:rotate-12 transition-transform" /> 
                                    <span>Beli</span>
                                </button>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <div className="col-span-full py-24 text-center opacity-30 italic font-black uppercase tracking-widest text-xs border border-dashed border-white/10 rounded-3xl">
                        Shop sedang kosong untuk kategori ini.
                    </div>
                )}
            </div>
        </div>
    );
};
