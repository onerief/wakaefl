
import React, { useState, useRef } from 'react';
import type { Team } from '../../types';
import { Button } from '../shared/Button';
import { Save, UserCircle, Instagram, MessageCircle, ArrowLeft, Loader, Upload, X } from 'lucide-react';
import { TeamLogo } from '../shared/TeamLogo';
import { uploadTeamLogo } from '../../services/firebaseService';
import { useToast } from '../shared/Toast';

interface UserTeamEditorProps {
  team: Team;
  onSave: (updates: Partial<Team>) => Promise<void>;
  onCancel: () => void;
}

export const UserTeamEditor: React.FC<UserTeamEditorProps> = ({ team, onSave, onCancel }) => {
  const [manager, setManager] = useState(team.manager || '');
  const [whatsappNumber, setWhatsappNumber] = useState(team.whatsappNumber || '');
  const [socialMediaUrl, setSocialMediaUrl] = useState(team.socialMediaUrl || '');
  const [logoUrl, setLogoUrl] = useState(team.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) { // 2MB Limit
          addToast('Ukuran file maksimal 2MB', 'error');
          return;
      }

      setIsUploading(true);
      try {
          const downloadUrl = await uploadTeamLogo(file);
          setLogoUrl(downloadUrl);
          addToast('Logo berhasil diupload!', 'success');
      } catch (error: any) {
          addToast(error.message || 'Gagal mengupload logo.', 'error');
          console.error(error);
      } finally {
          setIsUploading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        manager,
        whatsappNumber,
        socialMediaUrl,
        logoUrl
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/5 text-brand-light transition-colors">
            <ArrowLeft size={20} />
        </button>
        <h3 className="text-xl font-bold text-white">Edit Tim: {team.name}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Logo Upload Section */}
        <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-4">
            <div className="relative group">
                <TeamLogo logoUrl={logoUrl} teamName={team.name} className="w-24 h-24 shadow-2xl" />
                {isUploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <Loader className="animate-spin text-white" size={24} />
                    </div>
                )}
            </div>
            
            <div className="flex gap-2 w-full">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                <Button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="secondary" 
                    disabled={isUploading}
                    className="w-full flex justify-center !py-2.5 !text-xs !bg-brand-vibrant/10 hover:!bg-brand-vibrant/20 border-brand-vibrant/30 text-brand-vibrant"
                >
                    <Upload size={14} /> Upload Logo Baru
                </Button>
                {logoUrl && (
                    <Button 
                        type="button" 
                        onClick={() => setLogoUrl('')} 
                        variant="secondary"
                        className="!px-3 !bg-red-500/10 border-red-500/30 text-red-400 hover:!bg-red-500/20"
                        title="Hapus Logo"
                    >
                        <X size={14} />
                    </Button>
                )}
            </div>
            <p className="text-[10px] text-brand-light/50 text-center">
                Format: JPG, PNG. Maks 2MB.
            </p>
        </div>

        {/* Manager Name */}
        <div>
            <label className="block text-xs font-bold text-brand-light uppercase tracking-wider mb-2">
                Nama Manager
            </label>
            <div className="relative">
                <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" />
                <input 
                    type="text" 
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    placeholder="Nama Panggilan / ID Game"
                    className="w-full pl-10 pr-4 py-3 bg-brand-primary border border-brand-accent rounded-xl text-sm text-brand-text focus:ring-2 focus:ring-brand-vibrant outline-none transition-all"
                />
            </div>
        </div>

        {/* WhatsApp */}
        <div>
            <label className="block text-xs font-bold text-brand-light uppercase tracking-wider mb-2">
                Nomor WhatsApp
            </label>
            <div className="relative">
                <MessageCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                <input 
                    type="text" 
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="08..."
                    className="w-full pl-10 pr-4 py-3 bg-brand-primary border border-brand-accent rounded-xl text-sm text-brand-text focus:ring-2 focus:ring-green-500 outline-none transition-all"
                />
            </div>
        </div>

        {/* Social Media */}
        <div>
            <label className="block text-xs font-bold text-brand-light uppercase tracking-wider mb-2">
                Link Instagram / Sosmed
            </label>
            <div className="relative">
                <Instagram size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" />
                <input 
                    type="text" 
                    value={socialMediaUrl}
                    onChange={(e) => setSocialMediaUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full pl-10 pr-4 py-3 bg-brand-primary border border-brand-accent rounded-xl text-sm text-brand-text focus:ring-2 focus:ring-brand-vibrant outline-none transition-all"
                />
            </div>
        </div>

        <Button type="submit" disabled={isSaving || isUploading} className="w-full !py-3 !rounded-xl text-sm font-bold shadow-lg">
            {isSaving ? <Loader className="animate-spin" size={18} /> : <span className="flex items-center gap-2"><Save size={18} /> Simpan Perubahan</span>}
        </Button>
      </form>
    </div>
  );
};
