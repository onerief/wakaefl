
// Fix: Added React to the import to resolve 'Cannot find namespace React' errors in FC and Event types
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Team, Group, Match, KnockoutStageRounds, TournamentState, TournamentMode } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { TeamForm } from './TeamForm';
import { Plus, Edit, Trash2, RefreshCw, Download, Star, Upload, Users, ShieldAlert, Check, Search, Bell, Settings as SettingsIcon, LayoutGrid, ShieldCheck, UserMinus, FileJson, CloudUpload, X, Instagram, MessageCircle, Trophy, ExternalLink, AlertTriangle, UserCheck } from 'lucide-react';
import { ResetConfirmationModal } from './ResetConfirmationModal';
import { useToast } from '../shared/Toast';
import { ConfirmationModal } from './ConfirmationModal';
import { ManualGroupManager } from './ManualGroupManager';
import { TeamLogo } from '../shared/TeamLogo';
import { subscribeToRegistrations, deleteRegistration, sanitizeData, saveTournamentData } from '../../services/firebaseService';

interface TeamManagerProps {
  teams: Team[];
  groups: Group[];
  matches: Match[];
  knockoutStage: KnockoutStageRounds | null;
  mode: TournamentMode;
  addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => void;
  updateTeam: (teamId: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, isTopSeed?: boolean, ownerEmail?: string) => void;
  deleteTeam: (teamId: string) => void;
  unbindTeam: (teamId: string) => void;
  onGenerationSuccess: () => void;
  resetTournament: () => void;
  manualAddGroup: (name: string) => void;
  manualDeleteGroup: (groupId: string) => void;
  manualAddTeamToGroup: (teamId: string, groupId: string) => void;
  manualRemoveTeamFromGroup: (teamId: string, groupId: string) => void;
  generateMatchesFromGroups: () => void;
  setTournamentState: (state: TournamentState) => void;
  importLegacyData?: (jsonData: any) => void; 
  rules: string;
  resolveTeamClaim?: (teamId: string, approved: boolean) => void;
}

type SubTab = 'list' | 'requests' | 'setup';

export const TeamManager: React.FC<TeamManagerProps> = (props) => {
  const { 
    teams, groups, matches, knockoutStage, mode, addTeam, updateTeam, deleteTeam, unbindTeam,
    onGenerationSuccess, resetTournament,
    manualAddGroup, manualDeleteGroup, manualAddTeamToGroup, 
    manualRemoveTeamFromGroup, generateMatchesFromGroups, setTournamentState, importLegacyData, rules,
    resolveTeamClaim
  } = props;
  
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [teamToUnbind, setTeamToUnbind] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRegistrations, setNewRegistrations] = useState<any[]>([]);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRefreshingRegs, setIsRefreshingRegs] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyFileInputRef = useRef<HTMLInputElement>(null);
  
  // Detect teams that have pending claim requests (requestedOwnerEmail)
  const pendingClaims = useMemo(() => {
      return teams.filter(t => t.requestedOwnerEmail && !t.ownerEmail);
  }, [teams]);

  // Real-time subscription to registrations (New Team forms)
  useEffect(() => {
      setRegError(null);
      const unsubscribe = subscribeToRegistrations((regs) => {
          setNewRegistrations(regs);
          setIsRefreshingRegs(false);
      }, (err) => {
          setRegError("Gagal memuat data pendaftaran.");
          setIsRefreshingRegs(false);
      });
      return () => unsubscribe();
  }, []);

  // Sort registrations by timestamp (newest first) locally
  const sortedRegistrations = useMemo(() => {
      return [...newRegistrations].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [newRegistrations]);

  const totalRequestCount = sortedRegistrations.length + pendingClaims.length;

  const isTeamInUse = (teamId: string) => {
    return groups.some(g => g.teams.some(t => t.id === teamId));
  }

  const filteredTeams = teams.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.manager?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setEditingTeam(null);
    setShowForm(true);
  };
  
  const handleEditClick = (team: Team) => {
    setEditingTeam(team);
    setShowForm(true);
  };

  const handleDeleteClick = (team: Team) => {
    if (isTeamInUse(team.id)) {
        addToast("Tidak bisa menghapus tim yang sudah masuk grup.", 'error');
        return;
    }
    setTeamToDelete(team);
  }
  
  const handleConfirmDelete = () => {
    if (!teamToDelete) return;
    deleteTeam(teamToDelete.id);
    addToast(`Tim "${teamToDelete.name}" telah dihapus.`, 'success');
    setTeamToDelete(null);
  };

  const handleConfirmUnbind = () => {
    if (!teamToUnbind) return;
    unbindTeam(teamToUnbind.id);
    addToast(`Manager dilepaskan dari tim "${teamToUnbind.name}".`, 'success');
    setTeamToUnbind(null);
  };

  const handleResetConfirm = () => {
    resetTournament();
    addToast('Turnamen telah di-reset ulang ke kondisi awal.', 'success');
    setShowResetConfirm(false);
  };

  const handleFormSave = async (
    details: { name: string; manager?: string; socialMediaUrl?: string; whatsappNumber?: string; logoUrl: string; ownerEmail?: string; }
  ) => {
    setIsSavingTeam(true);
    try {
        if (editingTeam) {
            updateTeam(editingTeam.id, details.name, details.logoUrl, details.manager, details.socialMediaUrl, details.whatsappNumber, editingTeam.isTopSeed, details.ownerEmail);
            addToast('Profil tim diperbarui!', 'success');
        } else {
            const newTeamId = `t${Date.now()}`;
            addTeam(newTeamId, details.name, details.logoUrl, details.manager, details.socialMediaUrl, details.whatsappNumber, details.ownerEmail);
            addToast('Tim baru berhasil ditambahkan!', 'success');
        }
        setShowForm(false);
        setEditingTeam(null);
    } catch (error) {
        console.error("Error saving team:", error);
        addToast('Gagal menyimpan tim.', 'error');
    } finally {
        setIsSavingTeam(false);
    }
  };

  const handleApproveRegistration = async (reg: any) => {
      const newTeamId = `t${Date.now()}`;
      addTeam(newTeamId, reg.name || 'Tim Tanpa Nama', reg.logoUrl || '', reg.manager || 'Tanpa Manager', reg.socialMediaUrl || '', reg.whatsappNumber || '', reg.ownerEmail || '');
      await deleteRegistration(reg.id);
      addToast(`Pendaftaran ${reg.name} diterima! Tim telah ditambahkan ke database.`, 'success');
  };

  const handleRejectRegistration = async (regId: string, regName: string) => {
      if (window.confirm(`Hapus/Tolak pendaftaran tim "${regName}"?`)) {
          await deleteRegistration(regId);
          addToast('Pendaftaran dihapus.', 'info');
      }
  };

  const handleResolveClaim = (teamId: string, approved: boolean) => {
      if (resolveTeamClaim) {
          resolveTeamClaim(teamId, approved);
          addToast(approved ? 'Klaim tim disetujui!' : 'Klaim tim ditolak.', approved ? 'success' : 'info');
      } else {
          addToast('Fungsi klaim tidak tersedia.', 'error');
      }
  };

  const handleBackupData = () => {
    try {
        const backupData = { teams, groups, matches, knockoutStage, rules };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        a.download = `wakacl-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast('Backup berhasil diunduh.', 'success');
    } catch (error) {
        console.error("Backup failed", error);
        addToast('Gagal membuat backup.', 'error');
    }
  };

  const handleRestoreClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsRestoring(true);
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File unreadable");
        
        let data = JSON.parse(text);
        if (!data || !data.teams) {
            addToast("Format JSON tidak valid.", 'error');
            return;
        }

        const finalData = {
            ...data,
            mode: mode,
            status: data.status || 'active',
            isRegistrationOpen: data.isRegistrationOpen ?? true
        } as TournamentState;
        
        setTournamentState(finalData);
        addToast('Mempersinkronkan data ke Cloud...', 'info');
        await saveTournamentData(mode, finalData);
        addToast('Restorasi berhasil disimpan ke cloud.', 'success');
      } catch (error) {
        console.error("Restore error:", error);
        addToast("Gagal memproses file backup.", 'error');
      } finally {
          setIsRestoring(false);
          if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-brand-primary/50 p-1 rounded-xl border border-white/5 mb-4 overflow-hidden">
          <button 
              onClick={() => setActiveSubTab('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeSubTab === 'list' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
          >
              <Users size={16} /> Daftar Tim
          </button>
          <button 
              onClick={() => setActiveSubTab('requests')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all relative ${activeSubTab === 'requests' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
          >
              <Bell size={16} /> Request
              {totalRequestCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full animate-bounce font-black border-2 border-brand-primary">
                      {totalRequestCount}
                  </span>
              )}
          </button>
          <button 
              onClick={() => setActiveSubTab('setup')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeSubTab === 'setup' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
          >
              <LayoutGrid size={16} /> Pengaturan
          </button>
      </div>

      {activeSubTab === 'list' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="!p-4 sm:!p-6 overflow-visible">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-text">Semua Tim <span className="text-brand-vibrant">({teams.length})</span></h3>
                        <Button onClick={handleAddClick} className="!py-2 !px-4 !text-[10px] font-black uppercase tracking-widest"><Plus size={14} /> Tambah Tim</Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" size={16} />
                        <input
                            type="text"
                            placeholder="Cari tim atau manager..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-brand-primary border border-brand-accent rounded-xl text-sm font-bold outline-none focus:border-brand-vibrant transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredTeams.length > 0 ? filteredTeams.map(team => {
                    const currentGroup = groups.find(g => g.teams.some(t => t.id === team.id));
                    return (
                        <div key={team.id} className="flex flex-row items-center justify-between gap-3 bg-brand-primary/40 p-3 rounded-xl border border-white/5 hover:border-brand-vibrant/30 transition-all group">
                            <div className="flex items-center gap-3 min-w-0">
                                <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-10 h-10 sm:w-11 sm:h-11" />
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-black text-white truncate text-xs sm:text-sm uppercase tracking-tight">{team.name}</span>
                                        {team.isTopSeed && <Star size={10} className="fill-yellow-400 text-yellow-400 shrink-0" />}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <p className="text-[9px] text-brand-light truncate uppercase tracking-widest font-bold opacity-60">Mgr: {team.manager || 'N/A'}</p>
                                        {team.ownerEmail && (
                                            <span className="text-[8px] bg-green-500/20 text-green-400 px-1 py-0.5 rounded flex items-center gap-1">
                                                <Check size={8} /> Linked
                                            </span>
                                        )}
                                        {team.requestedOwnerEmail && !team.ownerEmail && (
                                            <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded flex items-center gap-1 animate-pulse">
                                                <UserCheck size={8} /> Claiming...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleEditClick(team)} className="p-2 text-brand-light hover:text-white bg-white/5 rounded-lg transition-colors"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteClick(team)} className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg disabled:opacity-10 transition-colors" disabled={!!currentGroup} title="Hapus Tim"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    )
                    }) : <div className="text-center py-12 text-brand-light/30 italic">Tidak ada tim yang cocok dengan pencarian.</div>}
                </div>
              </Card>
          </div>
      )}

      {activeSubTab === 'requests' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              
              {/* SECTION: NEW TEAM REGISTRATIONS */}
              <Card className="!p-4 sm:!p-6 border-brand-vibrant/20">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-text flex items-center gap-3">
                            <Plus size={24} className="text-brand-vibrant" />
                            Pendaftaran Tim Baru <span className="text-brand-vibrant">({newRegistrations.length})</span>
                        </h3>
                        <p className="text-[10px] text-brand-light uppercase tracking-widest mt-1 opacity-60">Pemain mendaftarkan tim yang belum ada di database.</p>
                    </div>
                    <button 
                        onClick={() => { setIsRefreshingRegs(true); window.location.reload(); }}
                        className={`p-2 bg-white/5 hover:bg-white/10 rounded-xl text-brand-light transition-all ${isRefreshingRegs ? 'animate-spin text-brand-vibrant' : ''}`}
                        title="Refresh Manual"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {sortedRegistrations.length > 0 ? sortedRegistrations.map((reg) => (
                        <div key={reg.id} className="bg-brand-primary/40 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 group hover:border-brand-vibrant/30 transition-all shadow-lg relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <TeamLogo logoUrl={reg.logoUrl} teamName={reg.name} className="w-14 h-14 sm:w-16 sm:h-16 shadow-2xl ring-2 ring-white/5" />
                                    <div className="min-w-0">
                                        <h4 className="text-lg font-black text-white uppercase italic tracking-tight truncate">{reg.name}</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-vibrant/10 text-brand-vibrant text-[8px] font-black uppercase rounded-lg border border-brand-vibrant/20">
                                                <Trophy size={10} /> {reg.preferredMode === 'league' ? 'Liga' : reg.preferredMode === 'wakacl' ? 'WAKACL' : '2 Region'}
                                            </span>
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-white/5 text-brand-light text-[8px] font-black uppercase rounded-lg border border-white/10">
                                                <ShieldCheck size={10} /> Mgr: {reg.manager}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 sm:self-center bg-black/40 p-2 rounded-xl border border-white/5">
                                    <button 
                                        onClick={() => handleApproveRegistration(reg)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-green-900/20 active:scale-95"
                                    >
                                        <Check size={14} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleRejectRegistration(reg.id, reg.name)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all active:scale-95"
                                    >
                                        <X size={14} /> Tolak
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-white/5">
                                <div className="flex items-center gap-2 px-3 py-2 bg-black/20 rounded-xl border border-white/5">
                                    <MessageCircle size={14} className="text-green-500" />
                                    <span className="text-[10px] text-brand-light font-bold truncate">WA: {reg.whatsappNumber || 'N/A'}</span>
                                    {reg.whatsappNumber && (
                                        <a href={`https://wa.me/${reg.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="ml-auto p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                            <ExternalLink size={12} className="text-brand-vibrant" />
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-black/20 rounded-xl border border-white/5">
                                    <span className="text-[8px] text-brand-light/30 truncate">User Email: {reg.ownerEmail}</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center py-8 text-[10px] text-brand-light/20 uppercase font-black italic">Tidak ada pendaftaran tim baru</p>
                    )}
                </div>
              </Card>

              {/* SECTION: CLAIM REQUESTS (EXISTING TEAMS) */}
              <Card className="!p-4 sm:!p-6 border-brand-special/20">
                <div className="mb-6">
                    <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-text flex items-center gap-3">
                        <UserCheck size={24} className="text-brand-special" />
                        Permintaan Klaim Tim <span className="text-brand-special">({pendingClaims.length})</span>
                    </h3>
                    <p className="text-[10px] text-brand-light uppercase tracking-widest mt-1 opacity-60">Pemain meminta hak akses sebagai manager untuk tim yang sudah ada di database.</p>
                </div>

                <div className="space-y-4">
                    {pendingClaims.length > 0 ? pendingClaims.map((team) => (
                        <div key={team.id} className="bg-brand-primary/40 border border-yellow-500/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-brand-special/30 transition-all shadow-lg">
                            <div className="flex items-center gap-4">
                                <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-14 h-14 shadow-xl ring-2 ring-yellow-500/20" />
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase italic tracking-tight">{team.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-brand-special/10 text-brand-special text-[8px] font-black uppercase rounded-lg border border-brand-special/20">
                                            Klaim oleh: {team.requestedOwnerEmail}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                                <button 
                                    onClick={() => handleResolveClaim(team.id, true)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-special text-brand-primary rounded-lg text-[10px] font-black uppercase transition-all shadow-lg active:scale-95"
                                >
                                    <Check size={14} /> Terima Klaim
                                </button>
                                <button 
                                    onClick={() => handleResolveClaim(team.id, false)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all active:scale-95"
                                >
                                    <X size={14} /> Tolak
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 bg-black/10 rounded-2xl border border-dashed border-white/5">
                            <p className="text-xs font-bold text-brand-light/20 uppercase tracking-widest italic">Belum ada permintaan klaim tim</p>
                        </div>
                    )}
                </div>
              </Card>
          </div>
      )}

      {activeSubTab === 'setup' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="!p-4 sm:!p-6 border-brand-accent/30">
                  <h3 className="text-sm font-black italic text-brand-text uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <LayoutGrid size={18} className="text-brand-vibrant" /> Manual Group Setup
                  </h3>
                  <ManualGroupManager
                      teams={teams}
                      groups={groups}
                      matches={matches}
                      addGroup={manualAddGroup}
                      deleteGroup={manualDeleteGroup}
                      addTeamToGroup={manualAddTeamToGroup}
                      removeTeamFromGroup={manualRemoveTeamFromGroup}
                      generateMatches={generateMatchesFromGroups}
                      onGenerationSuccess={onGenerationSuccess}
                  />
              </Card>

              <Card className="!p-4 sm:!p-6 border-brand-vibrant/20">
                  <h3 className="text-sm font-black italic text-brand-text uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <SettingsIcon size={18} className="text-brand-special" /> Data Disaster Recovery
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button onClick={handleBackupData} variant="secondary" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest"><Download size={14} /> Unduh Backup</Button>
                    <Button onClick={handleRestoreClick} variant="secondary" disabled={isRestoring} className="w-full !py-3 text-[10px] uppercase font-black tracking-widest">
                        {isRestoring ? <RefreshCw className="animate-spin" size={14} /> : <Upload size={14} />} 
                        Pulihkan & Simpan ke Cloud
                    </Button>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/5">
                      <Button onClick={() => setShowResetConfirm(true)} variant="danger" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest bg-red-600/10 hover:bg-red-600">
                          <RefreshCw size={14} /> Hard Reset Tournament
                      </Button>
                  </div>
                  
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
              </Card>
          </div>
      )}

      {showForm && <TeamForm team={editingTeam} onSave={handleFormSave} onClose={() => setShowForm(false)} isSaving={isSavingTeam} />}
      {showResetConfirm && <ResetConfirmationModal onConfirm={handleResetConfirm} onCancel={() => setShowResetConfirm(false)} />}
      <ConfirmationModal isOpen={!!teamToDelete} onClose={() => setTeamToDelete(null)} onConfirm={handleConfirmDelete} title="Hapus Tim" message={<p>Hapus tim <strong>{teamToDelete?.name}</strong> secara permanen?</p>} />
      <ConfirmationModal 
        isOpen={!!teamToUnbind} 
        onClose={() => setTeamToUnbind(null)} 
        onConfirm={handleConfirmUnbind} 
        title="Unbind Manager" 
        message={<p>Lepaskan akses manager (<strong>{teamToUnbind?.ownerEmail}</strong>) dari tim <strong>{teamToUnbind?.name}</strong>? Pengguna tersebut tidak akan bisa lagi mengedit jadwal tim ini.</p>} 
        confirmText="Unbind Sekarang"
        confirmButtonClass="bg-orange-600 text-white hover:bg-orange-700"
      />
    </div>
  );
};
