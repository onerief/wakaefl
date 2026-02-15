
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, UserCircle, LogOut, Shield, CheckCircle, Clock, Trophy, ListOrdered, Globe, Edit, ChevronRight, Check, User, LayoutDashboard, Bell, Trash2, Info, AlertTriangle } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Team, TournamentMode, Notification } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';
import { useToast } from '../shared/Toast';
import { getTournamentData, submitTeamClaimRequest, getUserTeams, updateUserTeamData, updateUserProfile, subscribeToNotifications, deleteNotification } from '../../services/firebaseService';
import { Spinner } from '../shared/Spinner';
import { UserTeamEditor } from './UserTeamEditor';

interface UserProfileModalProps {
  currentUser: FirebaseUser;
  teams: Team[]; 
  onClose: () => void;
  onLogout: () => void;
  isAdmin?: boolean;
  onAdminAccess?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ currentUser, onClose, onLogout, isAdmin, onAdminAccess }) => {
  const { addToast } = useToast();
  
  const [viewState, setViewState] = useState<'dashboard' | 'edit-team'>('dashboard');
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications'>('overview');
  const [userOwnedTeams, setUserOwnedTeams] = useState<{ mode: TournamentMode, team: Team }[]>([]);
  const [teamToEdit, setTeamToEdit] = useState<{ mode: TournamentMode, team: Team } | null>(null);
  const [isLoadingOwned, setIsLoadingOwned] = useState(true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(currentUser.displayName || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [claimMode, setClaimMode] = useState<TournamentMode>('league');
  const [claimableTeams, setClaimableTeams] = useState<Team[]>([]);
  const [selectedClaimTeamId, setSelectedClaimTeamId] = useState('');
  const [isLoadingClaimable, setIsLoadingClaimable] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  useEffect(() => {
      if (currentUser.email) {
          const unsub = subscribeToNotifications(currentUser.email, (notifs) => {
              setNotifications(notifs);
          });
          return () => unsub();
      }
  }, [currentUser.email]);

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

  const pendingTeamInClaimMode = useMemo(() => claimableTeams.find(t => t.requestedOwnerEmail === currentUser.email), [claimableTeams, currentUser.email]);
  const alreadyOwnedInClaimMode = useMemo(() => userOwnedTeams.some(ut => ut.mode === claimMode), [userOwnedTeams, claimMode]);
  const availableTeams = useMemo(() => claimableTeams.filter(t => !t.ownerEmail && t.id !== pendingTeamInClaimMode?.id), [claimableTeams, pendingTeamInClaimMode]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleUpdateName = async () => {
      if (!newName.trim() || newName === currentUser.displayName) {
          setIsEditingName(false);
          return;
      }
      setIsUpdatingName(true);
      try {
          await updateUserProfile(currentUser, newName);
          addToast('Nama profil berhasil diperbarui!', 'success');
          setIsEditingName(false);
      } catch (error) {
          addToast('Gagal memperbarui nama.', 'error');
      } finally {
          setIsUpdatingName(false);
      }
  };

  const handleEditClick = (teamItem: { mode: TournamentMode, team: Team }) => {
      setTeamToEdit(teamItem);
      setViewState('edit-team');
  };

  const handleSaveTeamUpdates = async (updates: Partial<Team>) => {
      if (!teamToEdit) return;
      try {
          await updateUserTeamData(teamToEdit.mode, teamToEdit.team.id, updates);
          addToast('Tim berhasil diperbarui!', 'success');
          await fetchUserTeams();
          setViewState('dashboard');
          setTeamToEdit(null);
      } catch (e) {
          addToast('Gagal memperbarui tim.', 'error');
      }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedClaimTeamId || !currentUser.email) return;
      try {
          await submitTeamClaimRequest(claimMode, selectedClaimTeamId, currentUser.email);
          addToast(`Permintaan klaim berhasil dikirim!`, 'success');
          setClaimableTeams(prev => prev.map(t => 
             t.id === selectedClaimTeamId ? { ...t, requestedOwnerEmail: currentUser.email! } : t
          ));
          setSelectedClaimTeamId('');
      } catch (error: any) {
          console.error("Claim Error:", error);
          if (error.code === 'permission-denied') {
             addToast('Akses Ditolak: Izin database belum diatur oleh Admin.', 'error');
          } else {
             addToast(error.message || 'Gagal mengirim permintaan.', 'error');
          }
      }
  };

  const handleDeleteNotification = async (id: string) => {
      try {
          await deleteNotification(id);
      } catch (e) {
          console.error(e);
      }
  };

  const getModeLabel = (m: TournamentMode) => {
      switch(m) {
          case 'league': return 'Liga';
          case 'wakacl': return 'WAKACL';
          case 'two_leagues': return '2 Region';
          default: return m;
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[100] backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-sm sm:max-w-md relative !p-0 overflow-hidden shadow-2xl !bg-brand-primary border-brand-vibrant/20 max-h-[85vh] flex flex-col rounded-2xl sm:rounded-[2rem]">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white transition-colors z-20 p-1 bg-black/20 rounded-full" aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="bg-brand-secondary/50 p-4 sm:p-6 flex flex-col items-center border-b border-white/5 shrink-0">
            <div className="w-14 h-14 sm:w-20 h-20 rounded-full bg-brand-vibrant/20 p-1 mb-2 relative">
                {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <div className="w-full h-full rounded-full bg-brand-primary flex items-center justify-center text-brand-vibrant">
                        <UserCircle size={28} sm:size={40} />
                    </div>
                )}
            </div>
            {isEditingName ? (
                <div className="flex flex-col items-center gap-1.5 w-full px-4 sm:px-8">
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-brand-primary border border-brand-vibrant/50 rounded-lg px-2 py-1 text-center text-white font-bold text-xs sm:text-base outline-none" autoFocus />
                    <div className="flex gap-2">
                        <button onClick={handleUpdateName} className="p-1.5 bg-green-600 text-white rounded-lg">
                            {isUpdatingName ? <Spinner size={12} /> : <Check size={12} />}
                        </button>
                        <button onClick={() => setIsEditingName(false)} className="p-1.5 bg-white/10 text-brand-light rounded-lg">
                            <X size={12} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5">
                        <h2 className="text-sm sm:text-xl font-bold text-white">{currentUser.displayName || 'Member'}</h2>
                        <button onClick={() => setIsEditingName(true)} className="text-brand-light hover:text-brand-vibrant"><Edit size={12} /></button>
                    </div>
                    <p className="text-[9px] sm:text-sm text-brand-light opacity-60">{currentUser.email}</p>
                </div>
            )}
        </div>

        {/* Tab Navigation */}
        {viewState === 'dashboard' && (
            <div className="flex bg-black/20 p-1 mx-4 mt-4 rounded-xl border border-white/5 shrink-0">
                <button 
                    onClick={() => setActiveTab('overview')} 
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'overview' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setActiveTab('notifications')} 
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all relative ${activeTab === 'notifications' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
                >
                    Notifikasi
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                </button>
            </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-grow">
            {viewState === 'dashboard' && activeTab === 'overview' && (
                <div className="space-y-5 animate-in slide-in-from-left duration-300">
                    {/* ADMIN SHORTCUT */}
                    {isAdmin && (
                        <div className="p-3 bg-brand-vibrant/10 border border-brand-vibrant/20 rounded-xl animate-in zoom-in-95 duration-500">
                             <p className="text-[8px] font-black text-brand-vibrant uppercase tracking-widest mb-2 px-1">Privilege Terdeteksi</p>
                             <Button onClick={() => { onAdminAccess?.(); onClose(); }} className="w-full !py-2.5 !text-[10px] sm:!text-xs">
                                 <Shield size={14} className="fill-white" /> Buka Panel Admin
                             </Button>
                        </div>
                    )}

                    <div>
                        <h3 className="text-[8px] sm:text-xs font-black text-brand-light uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Shield size={12} className="text-brand-vibrant" /> Tim Saya
                        </h3>
                        {isLoadingOwned ? (
                            <div className="flex justify-center py-2"><Spinner /></div>
                        ) : userOwnedTeams.length > 0 ? (
                            <div className="space-y-2">
                                {userOwnedTeams.map((item, idx) => (
                                    <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TeamLogo logoUrl={item.team.logoUrl} teamName={item.team.name} className="w-7 h-7" />
                                            <div>
                                                <h4 className="font-bold text-white text-[10px] truncate max-w-[120px]">{item.team.name}</h4>
                                                <span className="text-[7px] text-brand-vibrant font-black uppercase">{getModeLabel(item.mode)}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleEditClick(item)} className="p-1.5 rounded-lg bg-white/5 text-brand-light"><Edit size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-black/20 rounded-xl border border-dashed border-white/10 text-[9px] text-brand-light italic">Belum ada tim.</div>
                        )}
                    </div>

                    <div className="border-t border-white/5 pt-4">
                        <h3 className="text-[8px] sm:text-xs font-black text-brand-light uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Trophy size={12} className="text-brand-special" /> Klaim Tim
                        </h3>
                        <div className="flex bg-black/30 rounded-lg p-0.5 mb-3">
                            {(['league', 'wakacl', 'two_leagues'] as TournamentMode[]).map(m => (
                                <button key={m} onClick={() => setClaimMode(m)} className={`flex-1 py-1.5 text-[8px] sm:text-[9px] font-bold uppercase rounded-md transition-all ${claimMode === m ? 'bg-brand-vibrant text-white' : 'text-brand-light'}`}>{m === 'league' ? 'Liga' : m === 'wakacl' ? 'WAKACL' : '2 Region'}</button>
                            ))}
                        </div>
                        {alreadyOwnedInClaimMode ? (
                            <div className="bg-green-500/10 p-2 rounded-lg flex items-center gap-2 text-[9px] text-green-400 border border-green-500/20"><CheckCircle size={12} /> Sudah ada tim di sini.</div>
                        ) : pendingTeamInClaimMode ? (
                            <div className="bg-yellow-500/10 p-2 rounded-lg flex items-center gap-2 text-[9px] text-yellow-400 border border-yellow-500/20"><Clock size={12} /> Klaim {pendingTeamInClaimMode.name} diproses.</div>
                        ) : (
                            <form onSubmit={handleClaimSubmit} className="space-y-2">
                                <div className="relative">
                                    <select value={selectedClaimTeamId} onChange={(e) => setSelectedClaimTeamId(e.target.value)} className="w-full p-2 bg-black/20 border border-brand-accent rounded-lg text-white text-[10px] outline-none appearance-none" required>
                                        <option value="">-- Pilih Tim ({availableTeams.length}) --</option>
                                        {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <Button type="submit" className="w-full !py-2 text-[10px]" disabled={!selectedClaimTeamId || isLoadingClaimable}>Kirim Request</Button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {viewState === 'dashboard' && activeTab === 'notifications' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    {notifications.length === 0 ? (
                        <div className="text-center py-10 opacity-30 flex flex-col items-center">
                            <Bell size={32} className="mb-2" />
                            <p className="text-[10px] uppercase font-bold tracking-widest">Tidak ada notifikasi</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div key={notif.id} className={`p-3 rounded-xl border relative group ${notif.type === 'success' ? 'bg-green-500/10 border-green-500/20' : notif.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 ${notif.type === 'success' ? 'text-green-400' : notif.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>
                                        {notif.type === 'success' ? <CheckCircle size={16} /> : notif.type === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="text-xs font-bold text-white mb-1">{notif.title}</h4>
                                        <p className="text-[10px] text-brand-light leading-relaxed whitespace-pre-line">{notif.message}</p>
                                        <span className="text-[8px] text-brand-light/40 mt-2 block">{new Date(notif.timestamp).toLocaleString()}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteNotification(notif.id)} 
                                        className="p-1.5 text-brand-light hover:text-red-400 transition-colors opacity-50 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {viewState === 'edit-team' && teamToEdit && (
                <UserTeamEditor team={teamToEdit.team} onSave={handleSaveTeamUpdates} onCancel={() => { setViewState('dashboard'); setTeamToEdit(null); }} />
            )}
        </div>
        
        {viewState === 'dashboard' && (
            <div className="border-t border-white/5 bg-brand-secondary/30 p-3 shrink-0">
                <button onClick={onLogout} className="w-full py-2 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-lg text-[10px] font-bold uppercase tracking-wider"><LogOut size={12} /> Keluar Akun</button>
            </div>
        )}
      </Card>
    </div>
  );
};
