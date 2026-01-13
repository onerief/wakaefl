
import React, { useState, useRef } from 'react';
import type { Team } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Copy, Check, UserCircle, Instagram, MessageCircle, Upload, Mail, Loader } from 'lucide-react';
import { TeamLogo } from '../shared/TeamLogo';
import { Spinner } from '../shared/Spinner';
import { uploadTeamLogo } from '../../services/firebaseService';
import { useToast } from '../shared/Toast';

interface TeamFormProps {
  team: Team | null;
  onSave: (
    details: { 
      name: string; 
      manager?: string; 
      socialMediaUrl?: string; 
      whatsappNumber?: string; 
      logoUrl: string;
      ownerEmail?: string;
    }
  ) => void;
  onClose: () => void;
  isSaving: boolean;
}

export const TeamForm: React.FC<TeamFormProps> = ({ team, onSave, onClose, isSaving }) => {
  const [name, setName] = useState(team?.name ?? '');
  const [manager, setManager] = useState(team?.manager ?? '');
  const [socialMediaUrl, setSocialMediaUrl] = useState(team?.socialMediaUrl ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(team?.whatsappNumber ?? '');
  const [logoUrl, setLogoUrl] = useState(team?.logoUrl ?? '');
  const [ownerEmail, setOwnerEmail] = useState(team?.ownerEmail ?? '');
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleCopyId = () => {
    if (team?.id) {
        navigator.clipboard.writeText(team.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) { // 2MB Limit
          addToast('File size must be under 2MB', 'error');
          return;
      }

      setIsUploading(true);
      try {
          const downloadUrl = await uploadTeamLogo(file);
          setLogoUrl(downloadUrl);
          addToast('Logo uploaded successfully!', 'success');
      } catch (error: any) {
          // Use the specific error message from the service
          addToast(error.message || 'Failed to upload logo.', 'error');
          console.error(error);
      } finally {
          setIsUploading(false);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(
        { 
          name: name.trim(), 
          manager: manager.trim(),
          socialMediaUrl: socialMediaUrl.trim(),
          whatsappNumber: whatsappNumber.trim(),
          logoUrl: logoUrl.trim(),
          ownerEmail: ownerEmail.trim()
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="w-full max-w-lg relative !p-0 overflow-hidden !rounded-[2rem] shadow-2xl">
            <div className="bg-brand-secondary/50 p-6 border-b border-white/5 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
                <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">
                    {team ? 'Edit Profil Tim' : 'Tambah Tim Baru'}
                </h2>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-brand-light hover:text-white flex items-center justify-center transition-all" aria-label="Close form" disabled={isSaving}>
                <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-20">
                {/* Logo Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="relative group">
                        <TeamLogo logoUrl={logoUrl} teamName={name || "New Team"} className="w-24 h-24 flex-shrink-0" />
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                <Loader className="animate-spin text-white" size={24} />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow w-full space-y-3">
                    <div>
                        <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Logo Tim</label>
                        <div className="flex gap-2">
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
                                className="w-full flex justify-center text-xs py-2.5"
                            >
                                <Upload size={14} /> {logoUrl ? 'Ganti Logo' : 'Upload Logo'}
                            </Button>
                        </div>
                    </div>
                    
                    {/* Manual URL Fallback */}
                    <div>
                        <input
                            type="text"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            className="w-full p-2.5 bg-brand-primary border border-brand-accent rounded-lg text-brand-light text-xs focus:ring-1 focus:ring-brand-vibrant outline-none placeholder:text-brand-light/20"
                            placeholder="...atau tempel URL gambar manual"
                        />
                    </div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                    <label htmlFor="team-name" className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Nama Tim</label>
                    <input
                        id="team-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 bg-brand-primary border border-brand-accent rounded-xl text-brand-text font-bold focus:ring-2 focus:ring-brand-vibrant outline-none"
                        placeholder="Masukkan Nama Tim..."
                        required
                    />
                    </div>

                    <div>
                    <label htmlFor="owner-email" className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <Mail size={12} className="text-brand-vibrant" /> Email Pemilik (Wajib untuk Akses Member)
                    </label>
                    <div className="relative">
                        <input
                            id="owner-email"
                            type="email"
                            autoComplete="email"
                            value={ownerEmail}
                            onChange={(e) => setOwnerEmail(e.target.value)}
                            className="w-full p-3 bg-brand-primary border border-brand-accent rounded-xl text-brand-text text-sm focus:ring-2 focus:ring-brand-vibrant outline-none"
                            placeholder="email.peserta@gmail.com"
                        />
                    </div>
                    <p className="text-[10px] text-brand-light/60 mt-1">
                        Email ini akan menghubungkan akun user yang terdaftar dengan tim ini, memungkinkan mereka mengatur jadwal.
                    </p>
                    </div>

                    <div>
                    <label htmlFor="team-manager" className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Nama Manager</label>
                    <div className="relative">
                        <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-vibrant" />
                        <input
                            id="team-manager"
                            type="text"
                            value={manager}
                            onChange={(e) => setManager(e.target.value)}
                            className="w-full p-3 pl-10 bg-brand-primary border border-brand-accent rounded-xl text-brand-text text-sm focus:ring-2 focus:ring-brand-vibrant outline-none"
                            placeholder="Nama Manager Tim"
                        />
                    </div>
                    </div>
                </div>

                {/* Contact & Social */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                    <label htmlFor="team-whatsapp" className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">No. WhatsApp</label>
                    <div className="relative">
                        <MessageCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                        <input
                            id="team-whatsapp"
                            type="text"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            className="w-full p-3 pl-10 bg-brand-primary border border-brand-accent rounded-xl text-brand-text text-sm focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="628..."
                        />
                    </div>
                    </div>

                    <div>
                    <label htmlFor="team-social" className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5">Link Instagram</label>
                    <div className="relative">
                        <Instagram size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" />
                        <input
                            id="team-social"
                            type="text"
                            value={socialMediaUrl}
                            onChange={(e) => setSocialMediaUrl(e.target.value)}
                            className="w-full p-3 pl-10 bg-brand-primary border border-brand-accent rounded-xl text-brand-text text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                            placeholder="instagram.com/..."
                        />
                    </div>
                    </div>
                </div>
                
                {team && (
                <div className="pt-2 border-t border-white/5">
                    <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest mb-1.5 opacity-50">ID Tim (Read Only)</label>
                    <div className="flex gap-2">
                        <input
                        type="text"
                        value={team.id}
                        readOnly
                        className="w-full p-2 bg-black/30 border border-white/5 rounded-lg text-brand-light font-mono text-xs opacity-60 cursor-not-allowed"
                        />
                        <Button type="button" variant="secondary" onClick={handleCopyId} className="!p-2" title="Salin ID">
                            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </Button>
                    </div>
                </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5 sticky bottom-0 bg-brand-primary p-4 -mx-6 -mb-6 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="!rounded-xl px-6 py-3">Batal</Button>
                    <Button type="submit" disabled={isSaving || isUploading} className="!rounded-xl px-8 min-w-[140px] py-3">
                    {isSaving ? <Spinner /> : (team ? 'Simpan Perubahan' : 'Tambah Tim')}
                    </Button>
                </div>
            </form>
        </Card>
      </div>
    </div>
  );
};
