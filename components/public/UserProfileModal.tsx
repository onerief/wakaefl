
import React, { useState, useMemo } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, UserCircle, LogOut, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Team } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';
import { useToast } from '../shared/Toast';

interface UserProfileModalProps {
  currentUser: User;
  teams: Team[];
  onClose: () => void;
  onLogout: () => void;
  onRequestClaim: (teamId: string, userEmail: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ currentUser, teams, onClose, onLogout, onRequestClaim }) => {
  const { addToast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState('');

  // Determine current status
  const myTeam = useMemo(() => teams.find(t => t.ownerEmail === currentUser.email), [teams, currentUser.email]);
  const pendingTeam = useMemo(() => teams.find(t => t.requestedOwnerEmail === currentUser.email), [teams, currentUser.email]);
  
  // Filter teams available for claim (no owner, no pending request from current user, but maybe pending from others is ok? Let's hide if pending from *anyone* to avoid conflict, or just show them)
  // Simplest: Available if no owner.
  const availableTeams = useMemo(() => teams.filter(t => !t.ownerEmail && t.id !== pendingTeam?.id), [teams, pendingTeam]);

  const handleClaimSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTeamId) return;
      if (!currentUser.email) {
          addToast('Email anda tidak valid.', 'error');
          return;
      }
      onRequestClaim(selectedTeamId, currentUser.email);
      addToast('Permintaan klaim tim berhasil dikirim! Tunggu konfirmasi admin.', 'success');
      setSelectedTeamId('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md relative !p-0 overflow-hidden shadow-2xl !bg-brand-primary border-brand-vibrant/20">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white transition-colors z-10" aria-label="Close modal">
          <X size={24} />
        </button>

        {/* Profile Header */}
        <div className="bg-brand-secondary/50 p-6 flex flex-col items-center border-b border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-vibrant/10 blur-3xl rounded-full scale-150 opacity-30"></div>
            <div className="w-20 h-20 rounded-full bg-brand-vibrant/20 p-1 mb-4 relative z-10">
                {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <div className="w-full h-full rounded-full bg-brand-primary flex items-center justify-center text-brand-vibrant">
                        <UserCircle size={40} />
                    </div>
                )}
            </div>
            <h2 className="text-xl font-bold text-white relative z-10">{currentUser.displayName || 'User'}</h2>
            <p className="text-sm text-brand-light relative z-10">{currentUser.email}</p>
        </div>

        <div className="p-6 space-y-6">
            
            {/* STATUS: OWNED TEAM */}
            {myTeam && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2 text-green-400 font-bold uppercase tracking-wider text-xs">
                        <CheckCircle size={14} />
                        Manager Tim
                    </div>
                    <div className="flex flex-col items-center gap-3 mt-4">
                        <TeamLogo logoUrl={myTeam.logoUrl} teamName={myTeam.name} className="w-16 h-16" />
                        <h3 className="text-xl font-black text-white italic">{myTeam.name}</h3>
                        <p className="text-xs text-brand-light">Anda memiliki akses penuh untuk mengatur jadwal tim ini.</p>
                    </div>
                </div>
            )}

            {/* STATUS: PENDING REQUEST */}
            {!myTeam && pendingTeam && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-3 text-yellow-400 font-bold uppercase tracking-wider text-xs">
                        <Clock size={14} />
                        Menunggu Persetujuan
                    </div>
                    <div className="flex items-center gap-4 bg-black/20 p-3 rounded-lg text-left">
                         <TeamLogo logoUrl={pendingTeam.logoUrl} teamName={pendingTeam.name} className="w-10 h-10" />
                         <div>
                             <p className="font-bold text-white text-sm">{pendingTeam.name}</p>
                             <p className="text-[10px] text-brand-light">Request dikirim. Hubungi admin untuk mempercepat.</p>
                         </div>
                    </div>
                </div>
            )}

            {/* STATUS: NO TEAM & FORM */}
            {!myTeam && !pendingTeam && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-brand-light text-sm">
                        <Shield size={16} className="text-brand-vibrant" />
                        <span className="font-bold">Klaim Tim Anda</span>
                    </div>
                    <p className="text-xs text-brand-light/70">
                        Pilih tim yang ingin anda kelola. Admin akan memverifikasi permintaan anda sebelum memberikan akses.
                    </p>
                    
                    <form onSubmit={handleClaimSubmit} className="space-y-3">
                        <div className="relative">
                            <select 
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                className="w-full p-3 bg-black/20 border border-brand-accent rounded-xl text-brand-text text-sm focus:ring-2 focus:ring-brand-vibrant outline-none appearance-none"
                                required
                            >
                                <option value="">-- Pilih Tim Tersedia --</option>
                                {availableTeams.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} {t.requestedOwnerEmail ? '(Ada Request Lain)' : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-light">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={!selectedTeamId}>
                            Kirim Permintaan
                        </Button>
                    </form>
                </div>
            )}

            {/* Logout */}
            <div className="border-t border-white/5 pt-6">
                <button 
                    onClick={onLogout}
                    className="w-full py-3 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold"
                >
                    <LogOut size={16} />
                    Keluar Akun
                </button>
            </div>
        </div>
      </Card>
    </div>
  );
};
