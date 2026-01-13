
import React, { useState } from 'react';
import type { Team } from '../../types';
import { Button } from '../shared/Button';
import { Save, UserCircle, Instagram, MessageCircle, Globe, ArrowLeft, Loader } from 'lucide-react';
import { TeamLogo } from '../shared/TeamLogo';

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
        
        {/* Logo Preview & Input */}
        <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-4">
            <div className="relative group">
                <TeamLogo logoUrl={logoUrl} teamName={team.name} className="w-24 h-24 shadow-2xl" />
                <div className="absolute -bottom-2 -right-2 bg-brand-vibrant text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-lg">Preview</div>
            </div>
            <div className="w-full">
                <label className="block text-xs font-bold text-brand-light uppercase tracking-wider mb-2">
                    URL Logo Tim
                </label>
                <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-vibrant" />
                    <input 
                        type="text" 
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full pl-10 pr-4 py-3 bg-brand-primary border border-brand-accent rounded-xl text-sm text-brand-text focus:ring-2 focus:ring-brand-vibrant outline-none transition-all"
                    />
                </div>
                <p className="text-[10px] text-brand-light/50 mt-2">
                    Tips: Upload gambar ke GitHub/Imgur, lalu salin "Direct Link" atau "Raw URL" ke sini.
                </p>
            </div>
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
                    className="w-full pl-10 pr-4 py-3 bg-brand-primary border border-brand-accent rounded-xl text-sm text-brand-text focus:ring-2 focus:ring-brand-vibrant outline-none transition-all"
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

        <Button type="submit" disabled={isSaving} className="w-full !py-3 !rounded-xl text-sm font-bold shadow-lg">
            {isSaving ? <Loader className="animate-spin" size={18} /> : <span className="flex items-center gap-2"><Save size={18} /> Simpan Perubahan</span>}
        </Button>
      </form>
    </div>
  );
};
