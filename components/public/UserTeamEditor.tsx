
import React, { useState } from 'react';
import type { Team } from '../../types';
import { Button } from '../shared/Button';
import { Save, UserCircle, Instagram, MessageCircle, ArrowLeft, Loader, Upload, X, Image as ImageIcon, Layout, Shield, Link as LinkIcon } from 'lucide-react';
import { TeamLogo } from '../shared/TeamLogo';
import { useToast } from '../shared/Toast';
import { ImageUploadTutorial } from '../shared/ImageUploadTutorial';

interface UserTeamEditorProps {
  team: Team;
  onSave: (updates: Partial<Team>) => Promise<void>;
  onCancel: () => void;
}

export const UserTeamEditor: React.FC<UserTeamEditorProps> = ({ team, onSave, onCancel }) => {
  const [name, setName] = useState(team?.name || '');
  const [manager, setManager] = useState(team?.manager || '');
  const [whatsappNumber, setWhatsappNumber] = useState(team?.whatsappNumber || '');
  const [socialMediaUrl, setSocialMediaUrl] = useState(team?.socialMediaUrl || '');
  const [logoUrl, setLogoUrl] = useState(team?.logoUrl || '');
  const [squadPhotoUrl, setSquadPhotoUrl] = useState(team?.squadPhotoUrl || '');
  
  const [isSaving, setIsSaving] = useState(false);
  
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
        addToast('Nama tim tidak boleh kosong.', 'error');
        return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        manager: manager.trim(),
        whatsappNumber: whatsappNumber.trim(),
        socialMediaUrl: socialMediaUrl.trim(),
        logoUrl: logoUrl.trim(),
        squadPhotoUrl
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-2 mb-2 sm:mb-4">
        <button onClick={onCancel} className="p-1.5 sm:p-2 rounded-full hover:bg-white/5 text-brand-light transition-colors">
            <ArrowLeft className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
        </button>
        <h3 className="text-sm sm:text-xl font-bold text-white truncate">Edit: {team?.name}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        
        {/* Logo Upload Section */}
        <div className="bg-black/20 p-3 sm:p-4 rounded-xl border border-white/5 flex flex-col items-center gap-3 sm:gap-4">
            <ImageUploadTutorial />
            <label className="block w-full text-[8px] sm:text-[10px] font-black text-brand-light uppercase tracking-widest text-center">
                Logo Tim
            </label>
            <div className="relative group">
                <TeamLogo logoUrl={logoUrl} teamName={name || "New Team"} className="w-16 h-16 sm:w-24 sm:h-24 shadow-2xl" />
            </div>
            
            <div className="w-full">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon size={14} className="text-brand-light/50" />
                    </div>
                    <input 
                        type="url" 
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://i.ibb.co/..."
                        className="w-full pl-9 pr-3 py-2.5 sm:py-3 bg-brand-primary border border-brand-accent rounded-xl text-brand-text text-[11px] sm:text-xs placeholder-brand-light/30 focus:ring-2 focus:ring-brand-vibrant outline-none"
                    />
                </div>
            </div>
        </div>

        {/* Squad Photo Section */}
        <div className="bg-black/20 p-3 sm:p-4 rounded-xl border border-white/5 flex flex-col items-center gap-3 sm:gap-4">
            <label className="block w-full text-[8px] sm:text-[10px] font-black text-brand-light uppercase tracking-widest text-center">
                Foto Skuad / Formasi
            </label>
            <div className="relative w-full aspect-video bg-black/40 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center group">
                {squadPhotoUrl ? (
                    <img src={squadPhotoUrl} alt="Squad" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-brand-light/20">
                        <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Belum ada foto</span>
                    </div>
                )}
            </div>
            
            <div className="w-full">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon size={14} className="text-brand-light/50" />
                    </div>
                    <input 
                        type="url" 
                        value={squadPhotoUrl}
                        onChange={(e) => setSquadPhotoUrl(e.target.value)}
                        placeholder="https://i.ibb.co/..."
                        className="w-full pl-9 pr-3 py-2.5 sm:py-3 bg-brand-primary border border-brand-accent rounded-xl text-brand-text text-[11px] sm:text-xs placeholder-brand-light/30 focus:ring-2 focus:ring-brand-vibrant outline-none"
                    />
                </div>
            </div>
        </div>

        {/* Fields */}
        <div className="space-y-3 sm:space-y-4">
            
            {/* Nama Tim */}
            <div>
                <label className="block text-[10px] sm:text-xs font-bold text-brand-light uppercase tracking-wider mb-1.5 sm:mb-2">
                    Nama Tim
                </label>
                <div className="relative">
                    <Shield className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-brand-vibrant" />
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama Tim eFootball"
                        className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-brand-primary border border-brand-accent rounded-xl text-[11px] sm:text-sm text-brand-text focus:ring-2 focus:ring-brand-vibrant outline-none transition-all font-bold"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] sm:text-xs font-bold text-brand-light uppercase tracking-wider mb-1.5 sm:mb-2">
                    Nama Manager
                </label>
                <div className="relative">
                    <UserCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" />
                    <input 
                        type="text" 
                        value={manager}
                        onChange={(e) => setManager(e.target.value)}
                        placeholder="Nama Panggilan"
                        className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-brand-primary border border-brand-accent rounded-xl text-[11px] sm:text-sm text-brand-text focus:ring-2 focus:ring-brand-vibrant outline-none transition-all"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] sm:text-xs font-bold text-brand-light uppercase tracking-wider mb-1.5 sm:mb-2">
                    Nomor WhatsApp
                </label>
                <div className="relative">
                    <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                    <input 
                        type="text" 
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="08..."
                        className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-brand-primary border border-brand-accent rounded-xl text-[11px] sm:text-sm text-brand-text focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] sm:text-xs font-bold text-brand-light uppercase tracking-wider mb-1.5 sm:mb-2">
                    Link Instagram
                </label>
                <div className="relative">
                    <Instagram className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" />
                    <input 
                        type="text" 
                        value={socialMediaUrl}
                        onChange={(e) => setSocialMediaUrl(e.target.value)}
                        placeholder="https://instagram.com/..."
                        className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-brand-primary border border-brand-accent rounded-xl text-[11px] sm:text-sm text-brand-text focus:ring-2 focus:ring-brand-vibrant outline-none transition-all"
                    />
                </div>
            </div>
        </div>

        <Button type="submit" disabled={isSaving} className="w-full !py-2.5 sm:!py-3 !rounded-xl text-[11px] sm:text-sm font-bold shadow-lg">
            {isSaving ? <Loader className="animate-spin w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <span className="flex items-center gap-2"><Save className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Simpan Perubahan</span>}
        </Button>
      </form>
    </div>
  );
};
