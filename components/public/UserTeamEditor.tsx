
import React, { useState, useRef } from 'react';
import type { Team } from '../../types';
import { Button } from '../shared/Button';
import { Save, UserCircle, Instagram, MessageCircle, ArrowLeft, Loader, Upload, X, ImageIcon, Layout } from 'lucide-react';
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
  const [squadPhotoUrl, setSquadPhotoUrl] = useState(team.squadPhotoUrl || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingSquad, setIsUploadingSquad] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const squadInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'squad') => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) { // 2MB Limit
          addToast('Ukuran file maksimal 2MB', 'error');
          return;
      }

      if (type === 'logo') setIsUploading(true);
      else setIsUploadingSquad(true);

      try {
          const downloadUrl = await uploadTeamLogo(file);
          if (type === 'logo') setLogoUrl(downloadUrl);
          else setSquadPhotoUrl(downloadUrl);
          addToast(`${type === 'logo' ? 'Logo' : 'Foto Skuad'} berhasil diupload!`, 'success');
      } catch (error: any) {
          addToast(error.message || 'Gagal mengupload gambar.', 'error');
          console.error(error);
      } finally {
          if (type === 'logo') setIsUploading(false);
          else setIsUploadingSquad(false);
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
        logoUrl,
        squadPhotoUrl
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
            <label className="block w-full text-[10px] font-black text-brand-light uppercase tracking-widest text-center">
                Logo Tim
            </label>
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
                    onChange={(e) => handleFileChange(e, 'logo')}
                    accept="image/*"
                    className="hidden"
                />
                <Button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="secondary" 
                    disabled={isUploading}
                    className="w-full flex justify-center !py-2 !text-xs !bg-brand-vibrant/10 hover:!bg-brand-vibrant/20 border-brand-vibrant/30 text-brand-vibrant"
                >
                    <Upload size={14} /> Upload Logo
                </Button>
            </div>
        </div>

        {/* Squad Photo Section */}
        <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-4">
            <label className="block w-full text-[10px] font-black text-brand-light uppercase tracking-widest text-center">
                Foto Skuad / Formasi
            </label>
            <div className="relative w-full aspect-video bg-black/40 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center group">
                {squadPhotoUrl ? (
                    <img src={squadPhotoUrl} alt="Squad" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-brand-light/20">
                        <ImageIcon size={40} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Belum ada foto</span>
                    </div>
                )}
                {isUploadingSquad && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader className="animate-spin text-white" size={24} />
                    </div>
                )}
            </div>
            
            <div className="flex gap-2 w-full">
                <input 
                    type="file" 
                    ref={squadInputRef}
                    onChange={(e) => handleFileChange(e, 'squad')}
                    accept="image/*"
                    className="hidden"
                />
                <Button 
                    type="button" 
                    onClick={() => squadInputRef.current?.click()} 
                    variant="secondary" 
                    disabled={isUploadingSquad}
                    className="w-full flex justify-center !py-2 !text-xs !bg-brand-special/10 hover:!bg-brand-special/20 border-brand-special/30 text-brand-special"
                >
                    <Layout size={14} /> {squadPhotoUrl ? 'Ganti Foto Skuad' : 'Upload Foto Skuad'}
                </Button>
                {squadPhotoUrl && (
                    <Button 
                        type="button" 
                        onClick={() => setSquadPhotoUrl('')} 
                        variant="secondary"
                        className="!px-3 !bg-red-500/10 border-red-500/30 text-red-400 hover:!bg-red-500/20"
                    >
                        <X size={14} />
                    </Button>
                )}
            </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
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
        </div>

        <Button type="submit" disabled={isSaving || isUploading || isUploadingSquad} className="w-full !py-3 !rounded-xl text-sm font-bold shadow-lg">
            {isSaving ? <Loader className="animate-spin" size={18} /> : <span className="flex items-center gap-2"><Save size={18} /> Simpan Perubahan</span>}
        </Button>
      </form>
    </div>
  );
};
