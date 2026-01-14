
import React, { useState, useEffect, useMemo } from 'react';
import type { Team, Group, Match, KnockoutStageRounds, TournamentState } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { TeamForm } from './TeamForm';
import { Plus, Edit, Trash2, Shuffle, RefreshCw, Download, ArrowRightLeft, Star, Upload, Users, Mail, FileJson, ShieldAlert, Check, X as XIcon, Search, Bell, Settings as SettingsIcon, LayoutGrid } from 'lucide-react';
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
        addToast("Cannot delete a team that is part of a group.", 'error');
        return;
    }
    setTeamToDelete(team);
  }
  
  const handleConfirmDelete = () => {
    if (!teamToDelete) return;
    deleteTeam(teamToDelete.id);
    addToast(`Team "${teamToDelete.name}" has been deleted.`, 'success');
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
            addToast('Team details updated!', 'success');
        } else {
            const newTeamId = `t${Date.now()}`;
            addTeam(newTeamId, details.name, details.logoUrl, details.manager, details.socialMediaUrl, details.whatsappNumber, details.ownerEmail);
            addToast('New team added successfully!', 'success');
        }
        setShowForm(false);
        setEditingTeam(null);
    } catch (error) {
        console.error("Error saving team:", error);
        addToast('Failed to save team.', 'error');
    } finally {
        setIsSavingTeam(false);
    }
  };

  const handleApproveRegistration = async (reg: any) => {
      const newTeamId = `t${Date.now()}`;
      addTeam(newTeamId, reg.name, reg.logoUrl, reg.manager, reg.socialMediaUrl, reg.whatsappNumber, reg.ownerEmail);
      await deleteRegistration(reg.id);
      addToast(`Approved ${reg.name}!`, 'success');
  };

  const handleToggleSeed = (team: Team) => {
    updateTeam(team.id, team.name, team.logoUrl || '', team.manager, team.socialMediaUrl, team.whatsappNumber, !team.isTopSeed, team.ownerEmail);
  };

  const handleBackupData = () => {
    try {
        const backupData = { teams, groups, matches, knockoutStage, rules };
        // FIX: Sanitize before stringify to prevent circular errors
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
        addToast('Backup downloaded.', 'success');
    } catch (error) {
        console.error("Backup failed", error);
        addToast('Failed to create backup.', 'error');
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
          addToast("Invalid JSON format.", 'error');
        }
      } catch (error) {
        addToast("Failed to parse backup file.", 'error');
      } finally {
          if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importedData) {
      setTournamentState(importedData);
      addToast('Data restored.', 'success');
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
              addToast('Failed to parse legacy file.', 'error');
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

  const claimRequests = teams.filter(t => t.requestedOwnerEmail);
  const totalRequests = newRegistrations.length + claimRequests.length;

  return (
    <div className="space-y-6">
      {/* Mobile Sub-Tabs */}
      <div className="flex lg:hidden bg-brand-primary/50 p-1 rounded-xl border border-white/5 mb-4">
          <button 
              onClick={() => setActiveSubTab('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeSubTab === 'list' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light'}`}
          >
              <Users size={14} /> Team List
          </button>
          <button 
              onClick={() => setActiveSubTab('requests')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all relative ${activeSubTab === 'requests' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light'}`}
          >
              <Bell size={14} /> Requests
              {totalRequests > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
          </button>
          <button 
              onClick={() => setActiveSubTab('setup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeSubTab === 'setup' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light'}`}
          >
              <LayoutGrid size={14} /> Setup
          </button>
      </div>

      {/* VIEW: REQUESTS (MOBILE) or INTEGRATED (DESKTOP) */}
      {(activeSubTab === 'requests' || window.innerWidth >= 1024) && (
          <div className={`${activeSubTab === 'requests' ? 'block' : 'hidden lg:block'} space-y-4`}>
             {newRegistrations.length > 0 && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Bell size={16} /> New Applications ({newRegistrations.length})
                    </h4>
                    <div className="space-y-3">
                        {newRegistrations.map(reg => (
                            <div key={reg.id} className="flex flex-col sm:flex-row justify-between items-center bg-black/30 p-3 rounded-lg border border-blue-500/20 gap-3">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <TeamLogo logoUrl={reg.logoUrl} teamName={reg.name} className="w-10 h-10" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-white text-xs truncate">{reg.name}</span>
                                        <span className="text-[9px] text-brand-light truncate uppercase tracking-widest">Mgr: {reg.manager}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={() => handleApproveRegistration(reg)} className="flex-1 px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg uppercase">Approve</button>
                                    <button onClick={() => deleteRegistration(reg.id)} className="flex-1 px-3 py-1.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/30 uppercase">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {claimRequests.length > 0 && resolveTeamClaim && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <h4 className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <ShieldAlert size={16} /> Claim Requests ({claimRequests.length})
                    </h4>
                    <div className="space-y-3">
                        {claimRequests.map(team => (
                            <div key={team.id} className="flex flex-col sm:flex-row justify-between items-center bg-black/30 p-3 rounded-lg border border-yellow-500/20 gap-3">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-10 h-10" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-white text-xs truncate">{team.name}</span>
                                        <span className="text-[9px] text-brand-light truncate">{team.requestedOwnerEmail}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={() => resolveTeamClaim(team.id, true)} className="flex-1 px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg uppercase">Approve</button>
                                    <button onClick={() => resolveTeamClaim(team.id, false)} className="flex-1 px-3 py-1.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/30 uppercase">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeSubTab === 'requests' && totalRequests === 0 && (
                <div className="text-center py-12 text-brand-light/30 italic text-sm">No pending requests.</div>
            )}
          </div>
      )}

      {/* VIEW: TEAM LIST */}
      {(activeSubTab === 'list' || window.innerWidth >= 1024) && (
          <div className={activeSubTab === 'list' ? 'block' : 'hidden lg:block'}>
              <Card className="!p-4 sm:!p-6">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black italic uppercase text-brand-text">All Teams <span className="text-brand-vibrant">({teams.length})</span></h3>
                        <Button onClick={handleAddClick} className="!py-2 !px-4 !text-xs"><Plus size={14} /> Add Team</Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" size={16} />
                        <input
                            type="text"
                            placeholder="Search teams or managers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-brand-primary border border-brand-accent rounded-xl text-sm outline-none focus:border-brand-vibrant transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredTeams.length > 0 ? filteredTeams.map(team => {
                    const currentGroup = groups.find(g => g.teams.some(t => t.id === team.id));
                    return (
                        <div key={team.id} className="flex flex-row items-center justify-between gap-3 bg-brand-primary/40 p-2.5 rounded-xl border border-white/5 hover:border-brand-vibrant/30 transition-all group">
                            <div className="flex items-center gap-3 min-w-0">
                                <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-10 h-10 sm:w-11 sm:h-11" />
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-white truncate text-xs sm:text-sm uppercase tracking-tight">{team.name}</span>
                                        {team.isTopSeed && <Star size={10} className="fill-yellow-400 text-yellow-400 shrink-0" />}
                                    </div>
                                    <p className="text-[10px] text-brand-light truncate uppercase tracking-widest">Mgr: {team.manager || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleToggleSeed(team)} className={`p-1.5 rounded-lg ${team.isTopSeed ? 'text-yellow-400 bg-yellow-400/10' : 'text-brand-light hover:text-white bg-white/5'}`} title="Top Seed">
                                    <Star size={14} />
                                </button>
                                <button onClick={() => handleEditClick(team)} className="p-1.5 text-brand-light hover:text-white bg-white/5 rounded-lg"><Edit size={14} /></button>
                                <button onClick={() => handleDeleteClick(team)} className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg disabled:opacity-20" disabled={!!currentGroup}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    )
                    }) : <div className="text-center py-12 text-brand-light/30 italic">No teams matching your search.</div>}
                </div>
              </Card>
          </div>
      )}

      {/* VIEW: SETUP & TOOLS */}
      {(activeSubTab === 'setup' || window.innerWidth >= 1024) && (
          <div className={`${activeSubTab === 'setup' ? 'block' : 'hidden lg:block'} space-y-6`}>
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
                      <SettingsIcon size={18} className="text-brand-special" /> Data Tools & Disaster Recovery
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button onClick={handleBackupData} variant="secondary" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest"><Download size={14} /> Download Backup</Button>
                    <Button onClick={handleRestoreClick} variant="secondary" className="w-full !py-3 text-[10px] uppercase font-black tracking-widest"><Upload size={14} /> Restore from File</Button>
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
      <ConfirmationModal isOpen={!!teamToDelete} onClose={() => setTeamToDelete(null)} onConfirm={handleConfirmDelete} title="Delete Team" message={<p>Delete <strong>{teamToDelete?.name}</strong>? This cannot be undone.</p>} />
      <ConfirmationModal isOpen={showImportConfirm} onClose={() => { setShowImportConfirm(false); setImportedData(null); }} onConfirm={handleConfirmImport} title="Confirm Data Restore" message="This will overwrite all current tournament data with the selected backup file. Continue?" confirmText="Yes, Restore Data" />
      <ConfirmationModal isOpen={showLegacyImportConfirm} onClose={() => { setShowLegacyImportConfirm(false); setLegacyImportData(null); }} onConfirm={handleConfirmLegacyImport} title="Legacy Data Import" message="Convert and overwrite with data from legacy system format? Current data will be lost." confirmText="Yes, Proceed" />
    </div>
  );
};
