
import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../shared/Toast';

interface BannerSettingsProps {
    banners: string[];
    onUpdateBanners: (banners: string[]) => void;
}

export const BannerSettings: React.FC<BannerSettingsProps> = ({ banners, onUpdateBanners }) => {
    const [newBannerUrl, setNewBannerUrl] = useState('');
    const { addToast } = useToast();

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBannerUrl.trim()) return;
        
        // Basic URL validation
        try {
            new URL(newBannerUrl);
        } catch (_) {
            addToast('Please enter a valid URL (e.g., https://example.com/image.jpg)', 'error');
            return;
        }

        const updatedBanners = [...banners, newBannerUrl.trim()];
        onUpdateBanners(updatedBanners);
        setNewBannerUrl('');
        addToast('Banner added successfully!', 'success');
    };

    const handleDelete = (index: number) => {
        const updatedBanners = banners.filter((_, i) => i !== index);
        onUpdateBanners(updatedBanners);
        addToast('Banner removed.', 'info');
    };

    return (
        <Card>
            <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-brand-vibrant"/>
                Manage Banners
            </h3>
            
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-6">
                <input 
                    type="url"
                    value={newBannerUrl}
                    onChange={(e) => setNewBannerUrl(e.target.value)}
                    placeholder="Enter image URL (https://...)"
                    className="flex-grow p-2 bg-brand-primary border border-brand-accent rounded-md text-brand-text focus:ring-2 focus:ring-brand-vibrant"
                />
                <Button type="submit">
                    <Plus size={16} /> Add Banner
                </Button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {banners.length > 0 ? (
                    banners.map((url, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-brand-accent bg-black/50">
                            <div className="aspect-video w-full">
                                <img 
                                    src={url} 
                                    alt={`Banner ${index}`} 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                            <button
                                onClick={() => handleDelete(index)}
                                className="absolute top-2 right-2 bg-red-600/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remove Banner"
                            >
                                <Trash2 size={16} />
                            </button>
                             <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs text-brand-light truncate">
                                {url}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-8 text-brand-light italic bg-brand-secondary/30 rounded-lg border border-brand-accent border-dashed">
                        No banners added yet. Add an image URL above to display it on the public home page.
                    </div>
                )}
            </div>
             <p className="mt-4 text-xs text-brand-light">
                * Supported formats: JPG, PNG, GIF, WebP. Ensure URLs are publicly accessible (e.g., from Imgur, Firebase Storage, etc.).
            </p>
        </Card>
    );
};
