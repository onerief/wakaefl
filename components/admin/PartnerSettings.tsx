
import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Plus, Trash2, Users, ExternalLink } from 'lucide-react';
import { useToast } from '../shared/Toast';
import type { Partner } from '../../types';
import { ConfirmationModal } from './ConfirmationModal';

interface PartnerSettingsProps {
    partners: Partner[];
    onUpdatePartners: (partners: Partner[]) => void;
}

export const PartnerSettings: React.FC<PartnerSettingsProps> = ({ partners, onUpdatePartners }) => {
    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [partnerToDelete, setPartnerToDelete] = useState<string | null>(null);
    const { addToast } = useToast();

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !logoUrl.trim()) {
            addToast('Name and Logo URL are required.', 'error');
            return;
        }
        
        try {
            new URL(logoUrl);
            if (websiteUrl) new URL(websiteUrl);
        } catch (_) {
            addToast('Please enter valid URLs (e.g., https://example.com/logo.png)', 'error');
            return;
        }

        const newPartner: Partner = {
            id: `p-${Date.now()}`,
            name: name.trim(),
            logoUrl: logoUrl.trim(),
            websiteUrl: websiteUrl.trim() || null
        };

        const updatedPartners = [...partners, newPartner];
        onUpdatePartners(updatedPartners);
        setName('');
        setLogoUrl('');
        setWebsiteUrl('');
        addToast('Partner added successfully!', 'success');
    };

    const confirmDelete = () => {
        if (partnerToDelete) {
            const updatedPartners = partners.filter(p => p.id !== partnerToDelete);
            onUpdatePartners(updatedPartners);
            addToast('Partner removed.', 'info');
            setPartnerToDelete(null);
        }
    };

    return (
        <Card>
            <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
                <Users size={20} className="text-brand-vibrant"/>
                Manage Official Partners
            </h3>
            
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6 p-4 bg-brand-primary rounded-lg border border-brand-accent">
                <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-brand-light mb-1">Partner Name</label>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sponsor Name"
                        className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-md text-brand-text text-sm"
                    />
                </div>
                <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-brand-light mb-1">Logo URL</label>
                    <input 
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-md text-brand-text text-sm"
                    />
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-brand-light mb-1">Website (Optional)</label>
                    <input 
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-md text-brand-text text-sm"
                    />
                </div>
                <div className="sm:col-span-2 flex items-end mt-2 sm:mt-0">
                    <Button type="submit" className="w-full text-sm">
                        <Plus size={16} /> Add
                    </Button>
                </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners.length > 0 ? (
                    partners.map((partner) => (
                        <div key={partner.id} className="relative flex items-center gap-3 p-3 rounded-lg border border-brand-accent bg-black/40">
                            <div className="w-16 h-12 flex-shrink-0 bg-white/5 rounded flex items-center justify-center p-1">
                                <img 
                                    src={partner.logoUrl} 
                                    alt={partner.name} 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-bold text-brand-text text-sm truncate">{partner.name}</p>
                                {partner.websiteUrl && (
                                    <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-vibrant hover:underline flex items-center gap-1">
                                        Visit Site <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                            <button
                                onClick={() => setPartnerToDelete(partner.id)}
                                className="text-brand-light hover:text-red-400 p-2 transition-colors"
                                title="Remove Partner"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-6 text-brand-light italic bg-brand-secondary/30 rounded-lg border border-brand-accent border-dashed text-sm">
                        No partners added.
                    </div>
                )}
            </div>

            <ConfirmationModal 
                isOpen={!!partnerToDelete}
                onClose={() => setPartnerToDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Partner"
                message="Anda yakin ingin menghapus partner/sponsor ini?"
                confirmText="Hapus"
            />
        </Card>
    );
};
