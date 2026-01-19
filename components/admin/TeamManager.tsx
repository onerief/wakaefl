
// Fix: Added React to the import to resolve 'Cannot find namespace React' errors in FC and Event types
import React, { useState, useEffect, useRef } from 'react';
import type { Team, Group, Match, KnockoutStageRounds, TournamentState, TournamentMode } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { TeamForm } from './TeamForm';
import { Plus, Edit, Trash2, RefreshCw, Download, Star, Upload, Users, ShieldAlert, Check, Search, Bell, Settings as SettingsIcon, LayoutGrid, ShieldCheck, UserMinus, FileJson, CloudUpload } from 'lucide-react';
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

  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyFileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
      const unsubscribe = subscribeToRegistrations((regs) => {
          setNewRegistrations(regs);
      });
      return () => unsubscribe();
  }, []);

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
      addToast(`Pendaftaran ${reg.name} diterima!`, 'success');
  };

  const handleResolveClaim = (teamId: string, approved: boolean) => {
      if (resolveTeamClaim) {
          resolveTeamClaim(teamId, approved);
          addToast(approved ? 'Klaim tim disetujui!' : 'Klaim tim diabaikan.', approved ? 'success' : 'info');
      } else {
          addToast('Fungsi klaim tidak tersedia.', 'error');
      }
  };

  const handleToggleSeed = (team: Team) => {
    updateTeam(team.id, team.name, team.logoUrl || '', team.manager, team.socialMediaUrl, team.whatsappNumber, !team.isTopSeed, team.ownerEmail);
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
        
        // 1. Validasi struktur
        if (!data || !data.teams) {
            addToast("Format JSON tidak valid.", 'error');
            return;
        }

        // 2. Buat Map dari Master Teams
        const teamMap = new Map<string, Team>();
        data.teams.forEach((t: any) => {
            if (t && t.id && typeof t !== 'string') teamMap.set(t.id, t);
        });

        const getFullTeam = (val: any): Team | null => {
            if (!val) return null;
            const id = (typeof val === 'object') ? val.id : (typeof val === 'string' && val !== "[Circular]" ? val : null);
            return id ? teamMap.get(id) || null : null;
        };

        // 3. Perbaiki Matches & Groups (Solusi Masalah TBD)
        if (data.matches) {
            data.matches = data.matches.map((m: any) => ({
                ...m,
                teamA: getFullTeam(m.teamA),
                teamB: getFullTeam(m.teamB)
            })).filter((m: any) => m.teamA && m.teamB);
        }

        if (data.groups) {
            data.groups = data.groups.map((g: any) => {
                const groupLetter = g.name.replace('Group ', '').trim();
                const teamIdsInThisGroup = new Set<string>();
                if (data.matches) {
                    data.matches.forEach((m: any) => {
                        if (m.group === g.id || m.group === groupLetter || m.group === g.name) {
                            if (m.teamA?.id) teamIdsInThisGroup.add(m.teamA.id);
                            if (m.teamB?.id) teamIdsInThisGroup.add(m.teamB.id);
                        }
                    });
                }
                const reconstructedTeams = Array.from(teamIdsInThisGroup).map(id => teamMap.get(id)).filter((t): t is Team => !!t);
                return { ...g, teams: reconstructedTeams, standings: [] };
            });
        }

        // 4. Update State Lokal
        const finalData = {
            ...data,
            mode: mode, // Tetapkan mode saat ini
            status: data.status || 'active',
            isRegistrationOpen: data.isRegistrationOpen ?? true
        } as TournamentState;
        
        setTournamentState(finalData);

        // 5. FORCE SAVE KE CLOUD (Solusi data tidak tersimpan)
        addToast('Mempersinkronkan data ke Cloud...', 'info');
        await saveTournamentData(mode, finalData);
        
        addToast('RESTORASI BERHASIL: Data telah diperbaiki dan disimpan permanen di database.', 'success');
        
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
              {newRegistrations.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full animate-bounce font-black border-2 border-brand-primary">
                      {newRegistrations.length}
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
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleToggleSeed(team)} className={`p-2 rounded-lg transition-colors ${team.isTopSeed ? 'text-yellow-400 bg-yellow-400/10' : 'text-brand-light hover:text-white bg-white/5'}`} title="Top Seed">
                                    <Star size={16} />
                                </button>
                                {team.ownerEmail && (
                                    <button 
                                        onClick={() => setTeamToUnbind(team)} 
                                        className="p-2 text-orange-400 hover:text-orange-300 bg-orange-500/10 rounded-lg transition-colors"
                                        title="Unbind Manager Account"
                                    >
                                        <UserMinus size={16} />
                                    </button>
                                )}
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
                    {importLegacyData && <Button onClick={() => legacyFileInputRef.current?.click()} variant="secondary" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest sm:col-span-2"><FileJson size={14} /> Legacy JSON Import</Button>}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/5">
                      <Button onClick={() => setShowResetConfirm(true)} variant="danger" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest bg-red-600/10 hover:bg-red-600">
                          <RefreshCw size={14} /> Hard Reset Tournament
                      </Button>
                      <p className="text-[9px] text-red-400/50 mt-2 text-center uppercase tracking-wider font-bold">⚠️ Perhatian: Tindakan ini tidak dapat dibatalkan!</p>
                  </div>
                  
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
                  <input type="file" ref={legacyFileInputRef} onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (!file) return;
                       const reader = new FileReader();
                       reader.onload = (ev) => {
                           try {
                               const data = JSON.parse(ev.target?.result as string);
                               if (importLegacyData) importLegacyData(data);
                           } catch (err) { addToast("Failed to process legacy file.", 'error'); }
                       };
                       reader.readAsText(file);
                  }} className="hidden" accept="application/json" />
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
