
import React, { useState, useEffect, useMemo } from 'react';
import type { Team, Group, Match, KnockoutStageRounds, TournamentState } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { TeamForm } from './TeamForm';
import { Plus, Edit, Trash2, Shuffle, RefreshCw, Download, ArrowRightLeft, Star, Upload, Users, Mail, FileJson, ShieldAlert, Check, X as XIcon, Search, Bell, Settings as SettingsIcon, LayoutGrid, Info, ShieldCheck } from 'lucide-react';
import { ResetConfirmationModal } from './ResetConfirmationModal';
import { GenerateGroupsConfirmationModal } from './GenerateGroupsConfirmationModal';
import { useToast } from '../shared/Toast';
import { ConfirmationModal } from './ConfirmationModal';
import { MoveTeamModal } from './MoveTeamModal';
import { ManualGroupManager } from './ManualGroupManager';
import { TeamLogo } from '../shared/TeamLogo';
import { subscribeToRegistrations, deleteRegistration, sanitizeData } from '../../services/firebaseService';

interface TeamManagerProps {
  teams: Team[];
  groups: Group[];
  matches: Match[];
  knockoutStage: KnockoutStageRounds | null;
  addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => void;
  updateTeam: (teamId: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, isTopSeed?: boolean, ownerEmail?: string) => void;
  deleteTeam: (teamId: string) => void;
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
    teams, groups, matches, knockoutStage, addTeam, updateTeam, deleteTeam, 
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
  const [searchTerm, setSearchTerm] = useState('');
  const [newRegistrations, setNewRegistrations] = useState<any[]>([]);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importedData, setImportedData] = useState<TournamentState | null>(null);
  const [showLegacyImportConfirm, setShowLegacyImportConfirm] = useState(false);
  const [legacyImportData, setLegacyImportData] = useState<any>(null);
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  const { addToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const legacyFileInputRef = React.useRef<HTMLInputElement>(null);
  
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

  const handleToggleSeed = (team: Team) => {
    updateTeam(team.id, team.name, team.logoUrl || '', team.manager, team.socialMediaUrl, team.whatsappNumber, !team.isTopSeed, team.ownerEmail);
  };

  const handleBackupData = () => {
    try {
        const backupData = { teams, groups, matches, knockoutStage, rules };
        const sanitized = sanitizeData(backupData);
        const jsonString = JSON.stringify(sanitized, null, 2);
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
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File unreadable");
        const data = JSON.parse(text) as TournamentState;
        if (data && typeof data === 'object' && 'teams' in data) {
          setImportedData(data);
          setShowImportConfirm(true);
        } else {
          addToast("Format JSON tidak valid.", 'error');
        }
      } catch (error) {
        addToast("Gagal memproses file backup.", 'error');
      } finally {
          if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importedData) {
      setTournamentState(importedData);
      addToast('Data berhasil dipulihkan.', 'success');
    }
    setShowImportConfirm(false);
    setImportedData(null);
  };

  const handleLegacyImportClick = () => legacyFileInputRef.current?.click();

  const handleLegacyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') throw new Error("Unreadable file");
              const data = JSON.parse(text);
              if (!data.teams || !data.schedule) throw new Error("Invalid format");
              setLegacyImportData(data);
              setShowLegacyImportConfirm(true);
          } catch (error) {
              addToast('Gagal memproses file legacy.', 'error');
          } finally {
              if (event.target) event.target.value = '';
          }
      }
      reader.readAsText(file);
  }

  const handleConfirmLegacyImport = () => {
      if (legacyImportData && importLegacyData) importLegacyData(legacyImportData);
      setShowLegacyImportConfirm(false);
      setLegacyImportData(null);
  };

  const claimRequests = teams.filter(t => !!t.requestedOwnerEmail);
  const totalRequestsCount = newRegistrations.length + claimRequests.length;

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Selector */}
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
              {totalRequestsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full animate-bounce font-black border-2 border-brand-primary">
                      {totalRequestsCount}
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

      {/* VIEW: REQUESTS */}
      {activeSubTab === 'requests' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             
             {/* Integrated Header */}
             <div className="bg-brand-vibrant/10 p-5 rounded-2xl border border-brand-vibrant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                     <div className="p-3 bg-brand-vibrant/20 rounded-2xl text-brand-vibrant shadow-inner">
                         <ShieldCheck size={28} />
                     </div>
                     <div>
                         <h3 className="text-lg font-black text-white uppercase tracking-wider italic leading-tight">Antrian Persetujuan</h3>
                         <p className="text-[11px] text-brand-light font-medium max-w-xs">Tinjau pendaftaran baru dan klaim tim dari member komunitas.</p>
                     </div>
                 </div>
                 {totalRequestsCount > 0 && (
                     <div className="px-4 py-2 bg-brand-vibrant rounded-xl text-white font-black text-xs uppercase tracking-widest text-center">
                         {totalRequestsCount} Total Menunggu
                     </div>
                 )}
             </div>

             {/* Combined List Logic */}
             {(newRegistrations.length > 0 || claimRequests.length > 0) ? (
                 <div className="space-y-8">
                     
                     {/* Section: New Registrations */}
                     {newRegistrations.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-brand-vibrant uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                <Plus size={14} /> Pendaftaran Tim Baru ({newRegistrations.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {newRegistrations.map(reg => (
                                    <div key={reg.id} className="flex flex-col bg-brand-secondary/40 p-4 rounded-2xl border border-white/10 gap-4 shadow-xl hover:border-brand-vibrant/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <TeamLogo logoUrl={reg.logoUrl} teamName={reg.name || 'New Team'} className="w-14 h-14 ring-2 ring-brand-vibrant/20" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-black text-white text-sm uppercase leading-tight">{reg.name || 'Tim Tanpa Nama'}</span>
                                                <div className="flex flex-col mt-1 gap-0.5">
                                                    <span className="text-[10px] text-brand-vibrant font-black uppercase tracking-widest">Mgr: {reg.manager || 'N/A'}</span>
                                                    <span className="text-[9px] text-brand-light italic truncate">{reg.ownerEmail || 'No Email'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                            <button onClick={() => handleApproveRegistration(reg)} className="px-4 py-2.5 bg-green-600 text-white text-[10px] font-black rounded-xl uppercase hover:bg-green-500 transition-all shadow-lg">Terima</button>
                                            <button onClick={() => deleteRegistration(reg.id)} className="px-4 py-2.5 bg-red-500/10 text-red-400 text-[10px] font-black rounded-xl border border-red-500/20 uppercase hover:bg-red-500/20 transition-all">Tolak</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     )}

                    {/* Section: Claim Requests */}
                    {claimRequests.length > 0 && resolveTeamClaim && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                <ShieldAlert size={14} /> Permintaan Klaim Tim ({claimRequests.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {claimRequests.map(team => (
                                    <div key={team.id} className="flex flex-col bg-brand-secondary/40 p-4 rounded-2xl border border-yellow-500/20 gap-4 shadow-xl hover:border-yellow-500/50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-14 h-14 ring-2 ring-yellow-500/20" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-black text-white text-sm uppercase leading-tight">{team.name}</span>
                                                <div className="flex flex-col mt-1 gap-0.5">
                                                    <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest italic">Pengeklaim:</span>
                                                    <span className="text-[10px] text-brand-light font-bold truncate">{team.requestedOwnerEmail}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                            <button onClick={() => resolveTeamClaim(team.id, true)} className="px-4 py-2.5 bg-yellow-600 text-brand-primary text-[10px] font-black rounded-xl uppercase hover:bg-yellow-500 transition-all shadow-lg">Izinkan</button>
                                            <button onClick={() => resolveTeamClaim(team.id, false)} className="px-4 py-2.5 bg-white/5 text-brand-light text-[10px] font-black rounded-xl border border-white/10 uppercase hover:bg-white/10 transition-all">Abaikan</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-black/10 rounded-3xl border border-dashed border-white/5 opacity-50">
                    <Check size={48} className="text-brand-light/10 mb-4" />
                    <p className="text-brand-light/30 italic text-sm font-bold uppercase tracking-widest text-center px-4">
                        Semua Bersih! Tidak ada permintaan pendaftaran atau klaim saat ini.
                    </p>
                </div>
             )}
          </div>
      )}

      {/* VIEW: TEAM LIST */}
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
                                    <p className="text-[9px] text-brand-light truncate uppercase tracking-widest font-bold opacity-60">Mgr: {team.manager || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleToggleSeed(team)} className={`p-2 rounded-lg transition-colors ${team.isTopSeed ? 'text-yellow-400 bg-yellow-400/10' : 'text-brand-light hover:text-white bg-white/5'}`} title="Top Seed">
                                    <Star size={16} />
                                </button>
                                <button onClick={() => handleEditClick(team)} className="p-2 text-brand-light hover:text-white bg-white/5 rounded-lg transition-colors"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteClick(team)} className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg disabled:opacity-10 transition-colors" disabled={!!currentGroup}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    )
                    }) : <div className="text-center py-12 text-brand-light/30 italic">Tidak ada tim yang cocok dengan pencarian.</div>}
                </div>
              </Card>
          </div>
      )}

      {/* VIEW: SETUP */}
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
                    <Button onClick={handleRestoreClick} variant="secondary" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest"><Upload size={14} /> Pulihkan Data</Button>
                    {importLegacyData && <Button onClick={handleLegacyImportClick} variant="secondary" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest sm:col-span-2"><FileJson size={14} /> Legacy JSON Import</Button>}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/5">
                      <Button onClick={() => setShowResetConfirm(true)} variant="danger" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest bg-red-600/10 hover:bg-red-600">
                          <RefreshCw size={14} /> Hard Reset Tournament
                      </Button>
                      <p className="text-[9px] text-red-400/50 mt-2 text-center uppercase tracking-wider font-bold">⚠️ Perhatian: Tindakan ini tidak dapat dibatalkan!</p>
                  </div>
                  
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
                  <input type="file" ref={legacyFileInputRef} onChange={handleLegacyFileChange} className="hidden" accept="application/json" />
              </Card>
          </div>
      )}

      {showForm && <TeamForm team={editingTeam} onSave={handleFormSave} onClose={() => setShowForm(false)} isSaving={isSavingTeam} />}
      {showResetConfirm && <ResetConfirmationModal onConfirm={handleResetConfirm} onCancel={() => setShowResetConfirm(false)} />}
      <ConfirmationModal isOpen={!!teamToDelete} onClose={() => setTeamToDelete(null)} onConfirm={handleConfirmDelete} title="Hapus Tim" message={<p>Hapus tim <strong>{teamToDelete?.name}</strong> secara permanen?</p>} />
      <ConfirmationModal isOpen={showImportConfirm} onClose={() => { setShowImportConfirm(false); setImportedData(null); }} onConfirm={handleConfirmImport} title="Restore Data" message="Semua data turnamen saat ini akan ditimpa oleh file backup. Lanjutkan?" confirmText="Ya, Restore" />
      <ConfirmationModal isOpen={showLegacyImportConfirm} onClose={() => { setShowLegacyImportConfirm(false); setLegacyImportData(null); }} onConfirm={handleConfirmLegacyImport} title="Import Legacy" message="Data dari sistem lama akan dikonversi. Data saat ini akan hilang." confirmText="Ya, Proses" />
    </div>
  );
};
