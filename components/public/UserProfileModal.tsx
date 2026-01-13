
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, UserCircle, LogOut, Shield, CheckCircle, Clock, Trophy, ListOrdered, Globe, Edit, ChevronRight } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Team, TournamentMode } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';
import { useToast } from '../shared/Toast';
import { getTournamentData, submitTeamClaimRequest, getUserTeams, updateUserTeamData } from '../../services/firebaseService';
import { Spinner } from '../shared/Spinner';
import { UserTeamEditor } from './UserTeamEditor';

interface UserProfileModalProps {
  currentUser: User;
  teams: Team[]; 
  onClose: () => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ currentUser, onClose, onLogout }) => {
  const { addToast } = useToast();
  
  // Dashboard State
  const [viewState, setViewState] = useState<'dashboard' | 'edit-team'>('dashboard');
  const [userOwnedTeams, setUserOwnedTeams] = useState<{ mode: TournamentMode, team: Team }[]>([]);
  const [teamToEdit, setTeamToEdit] = useState<{ mode: TournamentMode, team: Team } | null>(null);
  const [isLoadingOwned, setIsLoadingOwned] = useState(true);

  // Claiming State
  const [claimMode, setClaimMode] = useState<TournamentMode>('league');
  const [claimableTeams, setClaimableTeams] = useState<Team[]>([]);
  const [selectedClaimTeamId, setSelectedClaimTeamId] = useState('');
  const [isLoadingClaimable, setIsLoadingClaimable] = useState(false);

  // --- Effect: Fetch User's Owned Teams ---
  const fetchUserTeams = async () => {
      setIsLoadingOwned(true);
      if (currentUser.email) {
          const teams = await getUserTeams(currentUser.email);
          setUserOwnedTeams(teams);
      }
      setIsLoadingOwned(false);
  };

  useEffect(() => {
      fetchUserTeams();
  }, [currentUser.email]);

  // --- Effect: Fetch Claimable Teams for Selected Mode ---
  useEffect(() => {
    const fetchClaimable = async () => {
        setIsLoadingClaimable(true);
        try {
            const data = await getTournamentData(claimMode);
            if (data && data.teams) {
                setClaimableTeams(data.teams);
            } else {
                setClaimableTeams([]);
            }
        } catch (error) {
            console.error("Error fetching claimable teams:", error);
        } finally {
            setIsLoadingClaimable(false);
        }
    };
    fetchClaimable();
  }, [claimMode]);

  // Computed: Filter teams available for claim
  const pendingTeamInClaimMode = useMemo(() => claimableTeams.find(t => t.requestedOwnerEmail === currentUser.email), [claimableTeams, currentUser.email]);
  const alreadyOwnedInClaimMode = useMemo(() => userOwnedTeams.some(ut => ut.mode === claimMode), [userOwnedTeams, claimMode]);
  const availableTeams = useMemo(() => claimableTeams.filter(t => !t.ownerEmail && t.id !== pendingTeamInClaimMode?.id), [claimableTeams, pendingTeamInClaimMode]);

  // --- Handlers ---

  const handleEditClick = (teamItem: { mode: TournamentMode, team: Team }) => {
      setTeamToEdit(teamItem);
      setViewState('edit-team');
  };

  const handleSaveTeamUpdates = async (updates: Partial<Team>) => {
      if (!teamToEdit) return;
      try {
          await updateUserTeamData(teamToEdit.mode, teamToEdit.team.id, updates);
          addToast('Tim berhasil diperbarui!', 'success');
          
          // Refresh local data
          await fetchUserTeams();
          setViewState('dashboard');
          setTeamToEdit(null);
      } catch (e) {
          console.error(e);
          addToast('Gagal memperbarui tim.', 'error');
      }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedClaimTeamId) return;
      if (!currentUser.email) {
          addToast('Email anda tidak valid.', 'error');
          return;
      }

      try {
          await submitTeamClaimRequest(claimMode, selectedClaimTeamId, currentUser.email);
          addToast(`Permintaan klaim berhasil dikirim!`, 'success');
          
          // Optimistic update for UI
          setClaimableTeams(prev => prev.map(t => 
             t.id === selectedClaimTeamId ? { ...t, requestedOwnerEmail: currentUser.email! } : t
          ));
          setSelectedClaimTeamId('');
      } catch (error: any) {
          addToast(error.message || 'Gagal mengirim permintaan.', 'error');
      }
  };

  const getModeLabel = (m: TournamentMode) => {
      switch(m) {
          case 'league': return 'Liga Reguler';
          case 'wakacl': return 'WAKACL';
          case 'two_leagues': return '2 Wilayah';
          default: return m;
      }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md relative !p-0 overflow-hidden shadow-2xl !bg-brand-primary border-brand-vibrant/20 max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white transition-colors z-20" aria-label="Close modal">
          <X size={24} />
        </button>

        {/* Profile Header */}
        <div className="bg-brand-secondary/50 p-6 flex flex-col items-center border-b border-white/5 relative overflow-hidden flex-shrink-0">
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
            <h2 className="text-xl font-bold text-white relative z-10">{currentUser.displayName || 'Member'}</h2>
            <p className="text-sm text-brand-light relative z-10">{currentUser.email}</p>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
            
            {/* VIEW: DASHBOARD */}
            {viewState === 'dashboard' && (
                <div className="space-y-8">
                    
                    {/* Section 1: My Teams */}
                    <div>
                        <h3 className="text-xs font-black text-brand-light uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Shield size={14} className="text-brand-vibrant" /> Tim Saya
                        </h3>
                        
                        {isLoadingOwned ? (
                            <div className="flex justify-center py-4"><Spinner /></div>
                        ) : userOwnedTeams.length > 0 ? (
                            <div className="space-y-3">
                                {userOwnedTeams.map((item, idx) => (
                                    <div key={idx} className="bg-gradient-to-r from-brand-secondary to-transparent border border-white/5 rounded-xl p-3 flex items-center justify-between group hover:border-brand-vibrant/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <TeamLogo logoUrl={item.team.logoUrl} teamName={item.team.name} className="w-10 h-10" />
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{item.team.name}</h4>
                                                <span className="text-[10px] text-brand-vibrant bg-brand-vibrant/10 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                                    {getModeLabel(item.mode)}
                                                </span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleEditClick(item)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-brand-vibrant hover:text-white text-brand-light transition-all"
                                            title="Edit Tim"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-black/20 rounded-xl border border-dashed border-white/10 text-xs text-brand-light">
                                Anda belum memiliki tim. Silakan daftar di bawah.
                            </div>
                        )}
                    </div>

                    {/* Section 2: Join Competition */}
                    <div className="border-t border-white/5 pt-6">
                        <h3 className="text-xs font-black text-brand-light uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Trophy size={14} className="text-brand-special" /> Daftar Kompetisi
                        </h3>

                        {/* Mode Selector */}
                        <div className="flex bg-black/30 rounded-lg p-1 mb-4">
                            {(['league', 'wakacl', 'two_leagues'] as TournamentMode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setClaimMode(m)}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-all ${
                                        claimMode === m ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'
                                    }`}
                                >
                                    {m === 'league' ? 'Liga' : m === 'wakacl' ? 'WAKACL' : '2 Region'}
                                </button>
                            ))}
                        </div>

                        {/* Status Message */}
                        {alreadyOwnedInClaimMode ? (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-3">
                                <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                                <span className="text-xs text-green-100">Anda sudah memiliki tim di kompetisi ini.</span>
                            </div>
                        ) : pendingTeamInClaimMode ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-3">
                                <Clock size={18} className="text-yellow-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-yellow-100">Menunggu Persetujuan</p>
                                    <p className="text-[10px] text-yellow-200/70">Request untuk tim <strong>{pendingTeamInClaimMode.name}</strong> sedang diproses admin.</p>
                                </div>
                            </div>
                        ) : (
                            /* Claim Form */
                            <form onSubmit={handleClaimSubmit} className="space-y-3">
                                {isLoadingClaimable ? (
                                    <div className="text-center py-2"><Spinner size={14} /></div>
                                ) : (
                                    <div className="relative">
                                        <select 
                                            value={selectedClaimTeamId}
                                            onChange={(e) => setSelectedClaimTeamId(e.target.value)}
                                            className="w-full p-3 bg-black/20 border border-brand-accent rounded-xl text-brand-text text-xs font-bold focus:ring-2 focus:ring-brand-vibrant outline-none appearance-none"
                                            required
                                        >
                                            <option value="">-- Pilih Tim Tersedia ({availableTeams.length}) --</option>
                                            {availableTeams.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} {t.requestedOwnerEmail ? '(High Demand)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-light">
                                            <ChevronRight size={14} className="rotate-90" />
                                        </div>
                                    </div>
                                )}
                                <Button type="submit" className="w-full text-xs" disabled={!selectedClaimTeamId || isLoadingClaimable}>
                                    Kirim Request
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW: EDIT TEAM */}
            {viewState === 'edit-team' && teamToEdit && (
                <UserTeamEditor 
                    team={teamToEdit.team} 
                    onSave={handleSaveTeamUpdates}
                    onCancel={() => {
                        setViewState('dashboard');
                        setTeamToEdit(null);
                    }}
                />
            )}

        </div>

        {/* Footer Logout */}
        {viewState === 'dashboard' && (
            <div className="border-t border-white/5 bg-brand-secondary/30 p-4">
                <button 
                    onClick={onLogout}
                    className="w-full py-2 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
                >
                    <LogOut size={14} />
                    Keluar Akun
                </button>
            </div>
        )}
      </Card>
    </div>
  );
};
