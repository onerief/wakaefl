
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Team, Group, Match, KnockoutStageRounds, TournamentState, TournamentMode } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { TeamForm } from './TeamForm';
import { Plus, Edit, Trash2, RefreshCw, Download, Star, Upload, Users, ShieldAlert, Check, Search, Bell, Settings as SettingsIcon, LayoutGrid, ShieldCheck, UserMinus, FileJson, CloudUpload, X, Instagram, MessageCircle, Trophy, ExternalLink, AlertTriangle, UserCheck, Loader, Database } from 'lucide-react';
import { ResetConfirmationModal } from './ResetConfirmationModal';
import { useToast } from '../shared/Toast';
import { ConfirmationModal } from './ConfirmationModal';
import { ManualGroupManager } from './ManualGroupManager';
import { TeamLogo } from '../shared/TeamLogo';
import { subscribeToRegistrations, deleteRegistration, addApprovedTeamToFirestore, saveTournamentData, sendNotification, getAllGlobalTeams } from '../../services/firebaseService';
import { ImportTeamModal } from './ImportTeamModal';

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
  autoGenerateGroups?: (numberOfGroups: number) => void; // New Prop
  generateMatchesFromGroups: () => void;
  setTournamentState: (state: TournamentState) => void;
  rules: string;
  resolveTeamClaim?: (teamId: string, approved: boolean) => void;
}

type SubTab = 'list' | 'requests' | 'setup';

export const TeamManager: React.FC<TeamManagerProps> = (props) => {
  const { 
    teams, groups, mode, addTeam, updateTeam, deleteTeam, unbindTeam,
    onGenerationSuccess, resetTournament,
    manualAddGroup, manualDeleteGroup, manualAddTeamToGroup, 
    manualRemoveTeamFromGroup, autoGenerateGroups, generateMatchesFromGroups, setTournamentState, resolveTeamClaim
  } = props;
  
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRegistrations, setNewRegistrations] = useState<any[]>([]);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  
  // Import Features
  const [showImportModal, setShowImportModal] = useState(false);
  const [globalTeams, setGlobalTeams] = useState<Team[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  // States for approval with message
  const [registrationToApprove, setRegistrationToApprove] = useState<any | null>(null);
  const [approvalMessage, setApprovalMessage] = useState('');

  // State for rejecting registration confirmation
  const [registrationToReject, setRegistrationToReject] = useState<{id: string, name: string} | null>(null);

  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const pendingClaims = useMemo(() => teams.filter(t => t.requestedOwnerEmail && !t.ownerEmail), [teams]);

  useEffect(() => {
      const unsubscribe = subscribeToRegistrations((regs) => {
          setNewRegistrations(regs);
      }, (err) => {
          console.error("Registration sub error:", err);
      });
      return () => unsubscribe();
  }, []);

  const sortedRegistrations = useMemo(() => {
      return [...newRegistrations].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [newRegistrations]);

  const totalRequestCount = sortedRegistrations.length + pendingClaims.length;

  const isTeamInUse = (teamId: string) => groups.some(g => g.teams.some(t => t.id === teamId));

  const filteredTeams = teams.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.manager?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenImport = async () => {
      setIsLoadingGlobal(true);
      try {
          const allTeams = await getAllGlobalTeams();
          // Filter out teams already in THIS mode to prevent confusion (though addTeam handles new IDs)
          const currentTeamNames = new Set(teams.map(t => t.name.toLowerCase()));
          const availableTeams = allTeams.filter(t => !currentTeamNames.has(t.name.toLowerCase()));
          
          setGlobalTeams(availableTeams);
          setShowImportModal(true);
      } catch (e) {
          addToast('Gagal memuat database tim.', 'error');
      } finally {
          setIsLoadingGlobal(false);
      }
  };

  const handleImportSelect = (team: Team) => {
      // Create new ID for the team in this specific mode context
      const newId = `t${Date.now()}`;
      addTeam(
          newId, 
          team.name, 
          team.logoUrl || '', 
          team.manager, 
          team.socialMediaUrl, 
          team.whatsappNumber, 
          team.ownerEmail
      );
      addToast(`Tim ${team.name} berhasil diimpor!`, 'success');
      setShowImportModal(false);
  };

  const initiateApproval = (reg: any) => {
      setRegistrationToApprove(reg);
      setApprovalMessage(`Selamat! Tim ${reg.name} telah disetujui oleh admin. Silakan cek jadwal pertandingan Anda.`);
  };

  const handleConfirmApproval = async () => {
      if (!registrationToApprove) return;
      const reg = registrationToApprove;
      
      setIsProcessingAction(reg.id);
      try {
          const newTeam: Team = {
              id: `t${Date.now()}`,
              name: reg.name,
              logoUrl: reg.logoUrl,
              manager: reg.manager,
              socialMediaUrl: reg.socialMediaUrl,
              whatsappNumber: reg.whatsappNumber,
              ownerEmail: reg.ownerEmail
          };

          const targetMode = reg.preferredMode || mode;
          
          await addApprovedTeamToFirestore(targetMode as TournamentMode, newTeam);
          await deleteRegistration(reg.id);
          
          if (reg.ownerEmail) {
              await sendNotification(reg.ownerEmail, 'Pendaftaran Disetujui', approvalMessage, 'success');
          }
          
          addToast(`Tim "${reg.name}" BERHASIL disetujui!`, 'success');
      } catch (error) {
          addToast('Gagal memproses persetujuan.', 'error');
          console.error(error);
      } finally {
          setIsProcessingAction(null);
          setRegistrationToApprove(null);
          setApprovalMessage('');
      }
  };

  const handleConfirmReject = async () => {
      if (!registrationToReject) return;
      
      setIsProcessingAction(registrationToReject.id);
      try {
          await deleteRegistration(registrationToReject.id);
          addToast('Pendaftaran ditolak & dihapus.', 'info');
      } catch (e) {
          addToast('Gagal menghapus pendaftaran.', 'error');
      } finally {
          setIsProcessingAction(null);
          setRegistrationToReject(null);
      }
  };

  const handleBackupData = () => {
    try {
        const backupData = { teams, groups, matches: props.matches, knockoutStage: props.knockoutStage, rules: props.rules };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        const modeStr = mode === 'league' ? 'LEAGUE' : mode === 'wakacl' ? 'CHAMPIONSHIP' : '2REGION';
        a.download = `wakaefl-${modeStr}-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast('Backup berhasil diunduh.', 'success');
    } catch (error) {
        addToast('Gagal membuat backup.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-brand-primary/50 p-1 rounded-xl border border-white/5 mb-4 overflow-hidden">
          <button onClick={() => setActiveSubTab('list')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] sm:text-xs font-black uppercase rounded-lg transition-all ${activeSubTab === 'list' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}><Users size={16} /> Daftar Tim</button>
          <button onClick={() => setActiveSubTab('requests')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] sm:text-xs font-black uppercase rounded-lg transition-all relative ${activeSubTab === 'requests' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}><Bell size={16} /> Request {totalRequestCount > 0 && <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full animate-bounce font-black border-2 border-brand-primary">{totalRequestCount}</span>}</button>
          <button onClick={() => setActiveSubTab('setup')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] sm:text-xs font-black uppercase rounded-lg transition-all ${activeSubTab === 'setup' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}><LayoutGrid size={16} /> Pengaturan</button>
      </div>

      {activeSubTab === 'list' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="!p-4 sm:!p-6 overflow-visible">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-text">Semua Tim <span className="text-brand-vibrant">({teams.length})</span></h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                                onClick={handleOpenImport} 
                                disabled={isLoadingGlobal}
                                className="flex-1 sm:flex-none !py-2 !px-4 !text-[10px] font-black uppercase tracking-widest bg-brand-special text-brand-primary hover:bg-yellow-300 border-none shadow-lg shadow-yellow-500/20"
                            >
                                {isLoadingGlobal ? <Loader className="animate-spin" size={14} /> : <Database size={14} />} Ambil dari Database
                            </Button>
                            <Button onClick={() => { setEditingTeam(null); setShowForm(true); }} className="flex-1 sm:flex-none !py-2 !px-4 !text-[10px] font-black uppercase tracking-widest"><Plus size={14} /> Manual Baru</Button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" size={16} />
                        <input type="text" placeholder="Cari tim atau manager..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-brand-primary border border-brand-accent rounded-xl text-sm font-bold outline-none focus:border-brand-vibrant transition-all shadow-inner" />
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
                                    <div className="flex items-center gap-1.5"><span className="font-black text-white truncate text-xs sm:text-sm uppercase tracking-tight">{team.name}</span>{team.isTopSeed && <Star size={10} className="fill-yellow-400 text-yellow-400 shrink-0" />}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5"><p className="text-[9px] text-brand-light truncate uppercase tracking-widest font-bold opacity-60">Mgr: {team.manager || 'N/A'}</p>{team.ownerEmail && <span className="text-[8px] bg-green-500/20 text-green-400 px-1 py-0.5 rounded flex items-center gap-1"><Check size={8} /> Linked</span>}{team.requestedOwnerEmail && !team.ownerEmail && <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded flex items-center gap-1 animate-pulse"><UserCheck size={8} /> Claiming...</span>}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => { setEditingTeam(team); setShowForm(true); }} className="p-2 text-brand-light hover:text-white bg-white/5 rounded-lg transition-colors"><Edit size={16} /></button>
                                <button onClick={() => { if (!isTeamInUse(team.id)) setTeamToDelete(team); else addToast("Tim masih dalam grup.", "error"); }} className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg disabled:opacity-10 transition-colors" disabled={!!currentGroup}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    )}) : <div className="text-center py-12 text-brand-light/30 italic">Tidak ada tim.</div>}
                </div>
              </Card>
          </div>
      )}

      {activeSubTab === 'requests' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              <Card className="!p-4 sm:!p-6 border-brand-vibrant/20">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-text flex items-center gap-3"><Plus size={24} className="text-brand-vibrant" /> Pendaftaran Tim Baru <span className="text-brand-vibrant">({newRegistrations.length})</span></h3>
                        <p className="text-[10px] text-brand-light uppercase tracking-widest mt-1 opacity-60">Persetujuan tim langsung tersimpan ke database mode yang dipilih pemain.</p>
                    </div>
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
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-vibrant text-white text-[8px] font-black uppercase rounded-lg border border-brand-vibrant/20 animate-pulse">
                                                <Trophy size={10} /> {reg.preferredMode === 'league' ? 'Liga Reguler' : reg.preferredMode === 'wakacl' ? 'WAKACL' : '2 Wilayah'}
                                            </span>
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-white/5 text-brand-light text-[8px] font-black uppercase rounded-lg border border-white/10">Mgr: {reg.manager}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 sm:self-center bg-black/40 p-2 rounded-xl border border-white/5">
                                    {isProcessingAction === reg.id ? (
                                        <div className="px-10 py-2.5"><Loader className="animate-spin text-brand-vibrant" size={20} /></div>
                                    ) : (
                                        <>
                                            <button onClick={() => initiateApproval(reg)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-green-900/20 active:scale-95"><Check size={14} /> Approve</button>
                                            <button onClick={() => setRegistrationToReject({id: reg.id, name: reg.name})} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all active:scale-95"><X size={14} /> Tolak</button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-white/5 text-[10px] text-brand-light/60">
                                <div className="flex items-center gap-2">WA: {reg.whatsappNumber || 'N/A'}</div>
                                <div className="flex items-center gap-2 truncate">User: {reg.ownerEmail}</div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center py-8 text-[10px] text-brand-light/20 uppercase font-black italic">Kosong</p>
                    )}
                </div>
              </Card>

              <Card className="!p-4 sm:!p-6 border-brand-special/20">
                <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-text flex items-center gap-3"><UserCheck size={24} className="text-brand-special" /> Klaim Tim <span className="text-brand-special">({pendingClaims.length})</span></h3>
                <div className="space-y-4 mt-6">
                    {pendingClaims.map((team) => (
                        <div key={team.id} className="bg-brand-primary/40 border border-yellow-500/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-brand-special/30 transition-all shadow-lg">
                            <div className="flex items-center gap-4"><TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-14 h-14 shadow-xl ring-2 ring-yellow-500/20" /><div><h4 className="text-lg font-black text-white uppercase italic tracking-tight">{team.name}</h4><p className="text-[9px] text-brand-special uppercase font-bold">Klaim: {team.requestedOwnerEmail}</p></div></div>
                            <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5"><button onClick={() => resolveTeamClaim?.(team.id, true)} className="px-5 py-2.5 bg-brand-special text-brand-primary rounded-lg text-[10px] font-black uppercase transition-all shadow-lg active:scale-95"><Check size={14} /> Terima</button><button onClick={() => resolveTeamClaim?.(team.id, false)} className="px-5 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all active:scale-95"><X size={14} /> Tolak</button></div>
                        </div>
                    ))}
                    {pendingClaims.length === 0 && <p className="text-center py-4 text-[10px] text-brand-light/20 uppercase italic">Kosong</p>}
                </div>
              </Card>
          </div>
      )}

      {activeSubTab === 'setup' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="!p-4 sm:!p-6 border-brand-accent/30"><h3 className="text-sm font-black italic text-brand-text uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><LayoutGrid size={18} className="text-brand-vibrant" /> Group Setup & Fixtures</h3><ManualGroupManager teams={teams} groups={groups} matches={props.matches} addGroup={manualAddGroup} deleteGroup={manualDeleteGroup} addTeamToGroup={manualAddTeamToGroup} removeTeamFromGroup={manualRemoveTeamFromGroup} generateMatches={generateMatchesFromGroups} onGenerationSuccess={onGenerationSuccess} autoGenerateGroups={autoGenerateGroups} /></Card>
              <Card className="!p-4 sm:!p-6 border-brand-vibrant/20"><h3 className="text-sm font-black italic text-brand-text uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><SettingsIcon size={18} className="text-brand-special" /> Data Recovery</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Button onClick={handleBackupData} variant="secondary" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest"><Download size={14} /> Unduh Backup</Button><Button onClick={() => fileInputRef.current?.click()} variant="secondary" disabled={isRestoring} className="w-full !py-3 text-[10px] uppercase font-black tracking-widest">{isRestoring ? <RefreshCw className="animate-spin" size={14} /> : <Upload size={14} />} Pulihkan ke Cloud</Button></div><div className="mt-6 pt-6 border-t border-white/5"><Button onClick={() => setShowResetConfirm(true)} variant="danger" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest bg-red-600/10 hover:bg-red-600"><RefreshCw size={14} /> Hard Reset</Button></div><input type="file" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { try { setIsRestoring(true); const data = JSON.parse(ev.target?.result as string); setTournamentState({ ...data, mode, status: data.status || 'active', isRegistrationOpen: data.isRegistrationOpen ?? true }); await saveTournamentData(mode, data); addToast('Data berhasil dipulihkan!', 'success'); } catch (err) { addToast("File tidak valid.", 'error'); } finally { setIsRestoring(false); } }; reader.readAsText(file); }} className="hidden" accept="application/json" /></Card>
          </div>
      )}

      {showForm && <TeamForm team={editingTeam} onSave={(details) => { props.updateTeam(editingTeam?.id || `t${Date.now()}`, details.name, details.logoUrl, details.manager, details.socialMediaUrl, details.whatsappNumber, editingTeam?.isTopSeed, details.ownerEmail); setShowForm(false); }} onClose={() => setShowForm(false)} isSaving={isSavingTeam} />}
      {showResetConfirm && <ResetConfirmationModal onConfirm={() => { resetTournament(); setShowResetConfirm(false); }} onCancel={() => setShowResetConfirm(false)} />}
      
      {showImportModal && <ImportTeamModal teams={globalTeams} onSelect={handleImportSelect} onClose={() => setShowImportModal(false)} />}

      <ConfirmationModal 
        isOpen={!!teamToDelete} 
        onClose={() => setTeamToDelete(null)} 
        onConfirm={() => { deleteTeam(teamToDelete!.id); setTeamToDelete(null); }} 
        title="Hapus Tim" 
        message={<p>Hapus tim <strong>{teamToDelete?.name}</strong>? Tim ini akan hilang dari daftar.</p>}
        confirmText="Hapus"
      />

      <ConfirmationModal
        isOpen={!!registrationToReject}
        onClose={() => setRegistrationToReject(null)}
        onConfirm={handleConfirmReject}
        title="Tolak Pendaftaran"
        message={<p>Tolak pendaftaran tim <strong>{registrationToReject?.name}</strong>? Data akan dihapus permanen.</p>}
        confirmText="Tolak & Hapus"
        variant="warning"
      />

      {registrationToApprove && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] backdrop-blur-md p-4 animate-in fade-in duration-200">
              <Card className="w-full max-w-sm relative !p-0 overflow-hidden shadow-2xl bg-brand-primary rounded-2xl border border-brand-vibrant/30">
                  <div className="bg-brand-secondary/80 p-4 border-b border-white/5 flex justify-between items-center">
                      <h3 className="text-sm font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                          <Check size={16} className="text-green-500" /> Konfirmasi Approval
                      </h3>
                      <button onClick={() => setRegistrationToApprove(null)} className="text-brand-light hover:text-white transition-all bg-white/5 p-1 rounded-full"><X size={16} /></button>
                  </div>
                  <div className="p-4 space-y-4">
                      <p className="text-xs text-brand-light">
                          Anda akan menyetujui tim <strong>{registrationToApprove.name}</strong>. Tim akan ditambahkan ke <strong>{registrationToApprove.preferredMode?.toUpperCase() || mode.toUpperCase()}</strong>.
                      </p>
                      
                      <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest">Pesan untuk Member</label>
                          <textarea 
                              value={approvalMessage}
                              onChange={(e) => setApprovalMessage(e.target.value)}
                              className="w-full h-24 p-3 bg-black/40 border border-brand-accent rounded-xl text-white text-xs outline-none focus:border-brand-vibrant"
                              placeholder="Tulis pesan..."
                          />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                          <Button type="button" variant="secondary" onClick={() => setRegistrationToApprove(null)} className="!text-[10px]">Batal</Button>
                          <Button type="button" onClick={handleConfirmApproval} className="bg-green-600 text-white hover:bg-green-700 !text-[10px] font-black uppercase">
                              Setujui & Kirim Pesan
                          </Button>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
