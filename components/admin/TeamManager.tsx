
import React, { useState, useEffect } from 'react';
import type { Team, Group, Match, KnockoutStageRounds, TournamentState } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { TeamForm } from './TeamForm';
import { Plus, Edit, Trash2, Shuffle, RefreshCw, Download, ArrowRightLeft, Star, Upload, Users, Mail, FileJson, ShieldAlert, Check, X as XIcon, Search, Bell } from 'lucide-react';
import { ResetConfirmationModal } from './ResetConfirmationModal';
import { GenerateGroupsConfirmationModal } from './GenerateGroupsConfirmationModal';
import { useToast } from '../shared/Toast';
import { ConfirmationModal } from './ConfirmationModal';
import { MoveTeamModal } from './MoveTeamModal';
import { ManualGroupManager } from './ManualGroupManager';
import { TeamLogo } from '../shared/TeamLogo';
import { subscribeToRegistrations, deleteRegistration } from '../../services/firebaseService';

interface TeamManagerProps {
  teams: Team[];
  groups: Group[];
  matches: Match[];
  knockoutStage: KnockoutStageRounds | null;
  addTeam: (id: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, ownerEmail?: string) => void;
  updateTeam: (teamId: string, name: string, logoUrl: string, manager?: string, socialMediaUrl?: string, whatsappNumber?: string, isTopSeed?: boolean, ownerEmail?: string) => void;
  deleteTeam: (teamId: string) => void;
  generateGroupStage: (config?: { numberOfGroups: number }) => { success: boolean; message?: string };
  assignTopSeedToGroup: (teamId: string, assignedGroup: string) => void;
  moveTeamToGroup: (teamId: string, destinationGroupId: string) => void;
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

export const TeamManager: React.FC<TeamManagerProps> = (props) => {
  const { 
    teams, groups, matches, knockoutStage, addTeam, updateTeam, deleteTeam, 
    onGenerationSuccess, resetTournament, moveTeamToGroup, 
    assignTopSeedToGroup, manualAddGroup, manualDeleteGroup, manualAddTeamToGroup, 
    manualRemoveTeamFromGroup, generateMatchesFromGroups, setTournamentState, importLegacyData, rules,
    resolveTeamClaim
  } = props;
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showGenerateMatchesConfirm, setShowGenerateMatchesConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [movingTeam, setMovingTeam] = useState<Team | null>(null);
  const [numGroups, setNumGroups] = useState(4);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importedData, setImportedData] = useState<TournamentState | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newRegistrations, setNewRegistrations] = useState<any[]>([]);
  
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

  const handleFormSave = async (
    details: { name: string; manager?: string; socialMediaUrl?: string; whatsappNumber?: string; logoUrl: string; ownerEmail?: string; }
  ) => {
    setIsSavingTeam(true);
    try {
        if (editingTeam) {
            updateTeam(
                editingTeam.id, 
                details.name, 
                details.logoUrl, 
                details.manager, 
                details.socialMediaUrl, 
                details.whatsappNumber, 
                editingTeam.isTopSeed,
                details.ownerEmail
            );
            addToast('Team details updated!', 'success');
        } else {
            const newTeamId = `t${Date.now()}`;
            addTeam(
                newTeamId, 
                details.name, 
                details.logoUrl, 
                details.manager, 
                details.socialMediaUrl, 
                details.whatsappNumber,
                details.ownerEmail
            );
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
  
  const handleGenerateClick = () => {
    const topSeedTeams = teams.filter(t => t.isTopSeed);
    if (topSeedTeams.length > 0) {
        if (topSeedTeams.length > numGroups) {
            addToast(`You have ${topSeedTeams.length} top seeds but only ${numGroups} groups.`, 'error');
            return;
        }
        if (!topSeedTeams.every(t => t.assignedGroup)) {
            addToast('Please assign all top seed teams to a group.', 'error');
            return;
        }
    }
    if (teams.length < 2) {
        addToast(`You need at least 2 teams.`, 'error');
        return;
    }
    setShowGenerateConfirm(true);
  };

  const handleGenerateConfirm = () => {
    // Note: generateGroupStage logic is handled by parent dispatch or wrapper in props
    // We assume the caller handles the logic if we only have the setter in manual manager
    // In this app, Auto generation is usually part of useTournament hook returned object
    // but the current props only show 'manual' functions and 'rules'. 
    // If the component needs automatic group generation, it's missing from props here but 
    // it was previously used. Let's assume it's available via dispatch in useTournament.
    setShowGenerateConfirm(false);
  }

  const handleGenerateMatchesClick = () => {
    if (groups.some(g => g.teams.length < 2)) {
        addToast('All groups must have at least 2 teams.', 'error');
        return;
    }
    setShowGenerateMatchesConfirm(true);
  };

  const handleGenerateMatchesConfirm = () => {
    generateMatchesFromGroups();
    addToast('Fixtures generated successfully!', 'success');
    onGenerationSuccess();
    setShowGenerateMatchesConfirm(false);
  };

  const handleResetConfirm = () => {
    resetTournament();
    addToast('Tournament reset.', 'info');
    setShowResetConfirm(false);
  };

  const handleMoveTeamSave = (destinationGroupId: string) => {
    if (!movingTeam) return;
    moveTeamToGroup(movingTeam.id, destinationGroupId);
    addToast(`Team moved.`, 'success');
    setMovingTeam(null);
  };

  const handleBackupData = () => {
    try {
        const backupData = { teams, groups, matches, knockoutStage, rules };
        
        // Custom replacer to handle circular references if any somehow slipped in
        const getCircularReplacer = () => {
          const seen = new WeakSet();
          return (key: string, value: any) => {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) return;
              seen.add(value);
            }
            return value;
          };
        };

        const jsonString = JSON.stringify(backupData, getCircularReplacer(), 2);
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
        console.error("Backup error:", error);
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

  const topSeedTeams = teams.filter(t => t.isTopSeed);
  const groupOptions = Array.from({ length: numGroups }, (_, i) => String.fromCharCode(65 + i));
  const claimRequests = teams.filter(t => t.requestedOwnerEmail);

  return (
    <Card>
      {newRegistrations.length > 0 && (
          <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <h4 className="text-sm font-black text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Bell size={16} /> Applications ({newRegistrations.length})
              </h4>
              <div className="space-y-3">
                  {newRegistrations.map(reg => (
                      <div key={reg.id} className="flex flex-col sm:flex-row justify-between items-center bg-black/30 p-3 rounded-lg border border-blue-500/20">
                          <div className="flex items-center gap-3 mb-2 sm:mb-0 w-full sm:w-auto">
                              <TeamLogo logoUrl={reg.logoUrl} teamName={reg.name} className="w-10 h-10" />
                              <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-white text-sm truncate">{reg.name}</span>
                                  <span className="text-[10px] text-brand-light truncate">Mgr: {reg.manager}</span>
                              </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                              <Button onClick={() => handleApproveRegistration(reg)} className="!py-1.5 !px-3 !text-xs bg-green-500 text-white border-none flex-1">Approve</Button>
                              <Button onClick={() => deleteRegistration(reg.id)} className="!py-1.5 !px-3 !text-xs bg-red-500/20 text-red-400 border-red-500/30 flex-1">Reject</Button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {claimRequests.length > 0 && resolveTeamClaim && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <h4 className="text-sm font-black text-yellow-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldAlert size={16} /> Pending Claim Requests ({claimRequests.length})
              </h4>
              <div className="space-y-3">
                  {claimRequests.map(team => (
                      <div key={team.id} className="flex flex-col sm:flex-row justify-between items-center bg-black/30 p-3 rounded-lg border border-yellow-500/20">
                          <div className="flex items-center gap-3 mb-2 sm:mb-0">
                              <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-8 h-8" />
                              <div className="flex flex-col">
                                  <span className="font-bold text-white text-sm">{team.name}</span>
                                  <span className="text-[10px] text-brand-light">{team.requestedOwnerEmail}</span>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <Button onClick={() => resolveTeamClaim(team.id, true)} className="!py-1.5 !px-3 !text-xs bg-green-500 text-white border-none">Approve</Button>
                              <Button onClick={() => resolveTeamClaim(team.id, false)} className="!py-1.5 !px-3 !text-xs bg-red-500/20 text-red-400 border-red-500/30">Reject</Button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <h3 className="text-xl font-bold text-brand-text">Manage Teams ({teams.length})</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
             <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" size={16} />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-brand-primary border border-brand-accent rounded-lg text-sm outline-none"
                />
             </div>
             <Button onClick={handleAddClick} className="w-full sm:w-auto"><Plus size={16} /> Add Team</Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
        {filteredTeams.length > 0 ? filteredTeams.map(team => {
          const currentGroup = groups.find(g => g.teams.some(t => t.id === team.id));
          return (
            <div key={team.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-brand-primary p-3 rounded-xl border border-transparent hover:border-brand-accent">
              <div className="flex items-center gap-3">
                <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-10 h-10 sm:w-8 sm:h-8" />
                <div className="flex-grow min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-semibold text-brand-text truncate text-sm sm:text-base">{team.name}</span>
                  </div>
                  <p className="text-xs text-brand-light">Mgr: {team.manager || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button onClick={() => handleToggleSeed(team)} variant="secondary" className="p-2 h-8 w-8" title="Toggle Seed">
                    <Star size={14} className={team.isTopSeed ? 'fill-yellow-400 text-yellow-400' : 'text-brand-light'} />
                </Button>
                <Button onClick={() => handleEditClick(team)} variant="secondary" className="p-2 h-8 w-8"><Edit size={14} /></Button>
                <Button onClick={() => handleDeleteClick(team)} variant="secondary" className="p-2 h-8 w-8" disabled={!!currentGroup}><Trash2 size={14} /></Button>
              </div>
            </div>
          )
        }) : <div className="text-center py-8 text-brand-light italic">No teams found.</div>}
      </div>

      <div className="border-t border-brand-accent mt-6 pt-6">
          <h3 className="text-xl font-bold text-brand-text mb-4">Controls</h3>
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap mb-4">
            <Button onClick={handleBackupData} variant="secondary"><Download size={16} /> Backup</Button>
            <Button onClick={handleRestoreClick} variant="secondary"><Upload size={16} /> Restore</Button>
            {importLegacyData && <Button onClick={handleLegacyImportClick} variant="secondary">Legacy Import</Button>}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
            <input type="file" ref={legacyFileInputRef} onChange={handleLegacyFileChange} className="hidden" accept="application/json" />
          </div>
          <Button onClick={() => setShowResetConfirm(true)} variant="danger" className="w-full sm:w-auto"><RefreshCw size={16} /> Reset All</Button>
      </div>

      <div className="border-t border-brand-accent mt-6 pt-6">
          <h3 className="text-xl font-bold text-brand-text mb-4">Manual Group Setup</h3>
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
      </div>

      {showForm && <TeamForm team={editingTeam} onSave={handleFormSave} onClose={() => setShowForm(false)} isSaving={isSavingTeam} />}
      {movingTeam && <MoveTeamModal team={movingTeam} groups={groups} onClose={() => setMovingTeam(null)} onSave={handleMoveTeamSave} />}
      {showResetConfirm && <ResetConfirmationModal onConfirm={handleResetConfirm} onCancel={() => setShowResetConfirm(false)} />}
      {showGenerateConfirm && <GenerateGroupsConfirmationModal onConfirm={handleGenerateConfirm} onCancel={() => setShowGenerateConfirm(false)} />}
      <ConfirmationModal isOpen={showGenerateMatchesConfirm} onClose={() => setShowGenerateMatchesConfirm(false)} onConfirm={handleGenerateMatchesConfirm} title="Generate Fixtures" message="This will overwrite existing match fixtures. Continue?" confirmText="Generate" />
      <ConfirmationModal isOpen={!!teamToDelete} onClose={() => setTeamToDelete(null)} onConfirm={handleConfirmDelete} title="Delete Team" message={<p>Delete <strong>{teamToDelete?.name}</strong>?</p>} />
      <ConfirmationModal isOpen={showImportConfirm} onClose={() => { setShowImportConfirm(false); setImportedData(null); }} onConfirm={handleConfirmImport} title="Restore Data" message="Overwrite all current data?" />
      <ConfirmationModal isOpen={showLegacyImportConfirm} onClose={() => { setShowLegacyImportConfirm(false); setLegacyImportData(null); }} onConfirm={handleConfirmLegacyImport} title="Legacy Import" message="Overwrite with legacy data?" />
    </Card>
  );
};
