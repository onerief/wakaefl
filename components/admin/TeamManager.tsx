
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
    generateGroupStage, onGenerationSuccess, resetTournament, moveTeamToGroup, 
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
  
  // Fetch pending registrations
  useEffect(() => {
      const unsubscribe = subscribeToRegistrations((regs) => {
          setNewRegistrations(regs);
      });
      return () => unsubscribe();
  }, []);

  const isTeamInUse = (teamId: string) => {
    return groups.some(g => g.teams.some(t => t.id === teamId));
  }

  // Filtered teams for display
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
        addToast('Failed to save team. Please try again.', 'error');
    } finally {
        setIsSavingTeam(false);
    }
  };

  const handleApproveRegistration = async (reg: any) => {
      const newTeamId = `t${Date.now()}`;
      // Add team to main database
      addTeam(
          newTeamId,
          reg.name,
          reg.logoUrl,
          reg.manager,
          reg.socialMediaUrl,
          reg.whatsappNumber,
          reg.ownerEmail // Link to the user who registered
      );
      
      // Delete registration request
      await deleteRegistration(reg.id);
      addToast(`Approved ${reg.name}!`, 'success');
  };

  const handleRejectRegistration = async (regId: string) => {
      await deleteRegistration(regId);
      addToast('Registration rejected.', 'info');
  };

  const handleToggleSeed = (team: Team) => {
    updateTeam(
        team.id,
        team.name,
        team.logoUrl || '',
        team.manager,
        team.socialMediaUrl,
        team.whatsappNumber,
        !team.isTopSeed,
        team.ownerEmail
    );
};
  
  const handleGenerateClick = () => {
    const topSeedTeams = teams.filter(t => t.isTopSeed);

    if (topSeedTeams.length > 0) {
        if (topSeedTeams.length > numGroups) {
            addToast(`You have ${topSeedTeams.length} top seed teams but only ${numGroups} groups. Increase the number of groups.`, 'error');
            return;
        }
        const allSeedsAssigned = topSeedTeams.every(t => t.assignedGroup);
        if (!allSeedsAssigned) {
            addToast('Please assign all top seed teams to a group.', 'error');
            return;
        }
        const assignedGroups = topSeedTeams.map(t => t.assignedGroup).filter(Boolean);
        const hasDuplicates = new Set(assignedGroups).size !== assignedGroups.length;
        if (hasDuplicates) {
            addToast('Each top seed team must be assigned to a unique group.', 'error');
            return;
        }
    }
    
    if (teams.length < 2) {
        addToast(`You need at least 2 teams. You currently have ${teams.length}.`, 'error');
        return;
    }

    setShowGenerateConfirm(true);
  };

  const handleGenerateConfirm = () => {
    const topSeedTeams = teams.filter(t => t.isTopSeed);
    let result;
    if (topSeedTeams.length > 0) {
        result = generateGroupStage({ numberOfGroups: numGroups });
    } else {
        result = generateGroupStage();
    }

    if (result.success) {
        addToast('Groups created successfully! You can now generate fixtures.', 'success');
    } else if (result.message) {
        addToast(result.message, 'error');
    }
    setShowGenerateConfirm(false);
  }

  const handleGenerateMatchesClick = () => {
    if (groups.some(g => g.teams.length < 2)) {
        addToast('All groups must have at least 2 teams to generate fixtures.', 'error');
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
    addToast('Tournament has been reset.', 'info');
    setShowResetConfirm(false);
  };

  const handleMoveTeamSave = (destinationGroupId: string) => {
    if (!movingTeam) return;
    moveTeamToGroup(movingTeam.id, destinationGroupId);
    addToast(`Team "${movingTeam.name}" moved successfully.`, 'success');
    setMovingTeam(null);
  };

  const handleBackupData = () => {
    try {
        const backupData = { teams, groups, matches, knockoutStage, rules };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        a.download = `efootball-ucl-hub-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast('Data backup is downloading.', 'success');
    } catch (error) {
        console.error("Failed to create backup:", error);
        addToast('Failed to create data backup.', 'error');
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
        if (typeof text !== 'string') throw new Error("File content is not readable.");
        const data = JSON.parse(text) as TournamentState;
        if (data && typeof data === 'object' && 'teams' in data && 'groups' in data && 'matches' in data) {
          setImportedData(data);
          setShowImportConfirm(true);
        } else {
          addToast("Invalid JSON format.", 'error');
        }
      } catch (error) {
        addToast("Failed to read or parse the backup file.", 'error');
      } finally {
          if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importedData) {
      setTournamentState(importedData);
      addToast('Tournament data has been restored from backup.', 'success');
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
              if (!data.teams || !Array.isArray(data.teams) || !data.schedule) throw new Error("Invalid Legacy JSON format");
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

  const canGenerateGroups = teams.length >= 2;
  const topSeedTeams = teams.filter(t => t.isTopSeed);
  const groupOptions = Array.from({ length: numGroups }, (_, i) => String.fromCharCode(65 + i));
  const claimRequests = teams.filter(t => t.requestedOwnerEmail);

  return (
    <Card>
      {/* NEW REGISTRATIONS SECTION */}
      {newRegistrations.length > 0 && (
          <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl animate-in slide-in-from-top-4">
              <h4 className="text-sm font-black text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Bell size={16} className="animate-bounce" />
                  New Team Applications ({newRegistrations.length})
              </h4>
              <div className="space-y-3">
                  {newRegistrations.map(reg => (
                      <div key={reg.id} className="flex flex-col sm:flex-row justify-between items-center bg-black/30 p-3 rounded-lg border border-blue-500/20">
                          <div className="flex items-center gap-3 mb-2 sm:mb-0 w-full sm:w-auto">
                              <TeamLogo logoUrl={reg.logoUrl} teamName={reg.name} className="w-10 h-10" />
                              <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-white text-sm truncate">{reg.name}</span>
                                  <span className="text-[10px] text-brand-light truncate flex flex-col sm:flex-row sm:gap-2">
                                      <span className="flex gap-1">Target: <span className="text-yellow-400 font-bold uppercase">{reg.preferredMode === 'league' ? 'Liga' : reg.preferredMode === 'two_leagues' ? '2 Wilayah' : reg.preferredMode === 'wakacl' ? 'WAKACL' : 'N/A'}</span></span>
                                      <span className="hidden sm:inline">|</span>
                                      <span>Mgr: <span className="text-blue-200">{reg.manager}</span></span>
                                  </span>
                              </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                              <Button onClick={() => handleApproveRegistration(reg)} className="!py-1.5 !px-3 !text-xs bg-green-500 text-white hover:bg-green-600 border-none flex-1 sm:flex-none justify-center">
                                  <Check size={12} className="mr-1" /> Approve
                              </Button>
                              <Button onClick={() => handleRejectRegistration(reg.id)} className="!py-1.5 !px-3 !text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40 border-red-500/30 flex-1 sm:flex-none justify-center">
                                  <XIcon size={12} className="mr-1" /> Reject
                              </Button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* CLAIM REQUESTS SECTION */}
      {claimRequests.length > 0 && resolveTeamClaim && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <h4 className="text-sm font-black text-yellow-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldAlert size={16} />
                  Pending Claim Requests ({claimRequests.length})
              </h4>
              <div className="space-y-3">
                  {claimRequests.map(team => (
                      <div key={team.id} className="flex flex-col sm:flex-row justify-between items-center bg-black/30 p-3 rounded-lg border border-yellow-500/20">
                          <div className="flex items-center gap-3 mb-2 sm:mb-0">
                              <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-8 h-8" />
                              <div className="flex flex-col">
                                  <span className="font-bold text-white text-sm">{team.name}</span>
                                  <span className="text-[10px] text-brand-light">Requested by: <span className="text-yellow-200">{team.requestedOwnerEmail}</span></span>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <Button onClick={() => resolveTeamClaim(team.id, true)} className="!py-1.5 !px-3 !text-xs bg-green-500 text-white hover:bg-green-600 border-none">
                                  <Check size={12} className="mr-1" /> Approve
                              </Button>
                              <Button onClick={() => resolveTeamClaim(team.id, false)} className="!py-1.5 !px-3 !text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40 border-red-500/30">
                                  <XIcon size={12} className="mr-1" /> Reject
                              </Button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* HEADER WITH SEARCH AND ADD */}
      <div className="flex flex-col gap-4 mb-6">
        <h3 className="text-xl font-bold text-brand-text">Manage Teams ({teams.length})</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
             <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" size={16} />
                <input
                    type="text"
                    placeholder="Search Team..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-brand-primary border border-brand-accent rounded-lg text-sm focus:ring-2 focus:ring-brand-vibrant outline-none"
                />
             </div>
             <Button onClick={handleAddClick} className="w-full sm:w-auto flex justify-center items-center">
                <Plus size={16} />
                Add Team
             </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
        {filteredTeams.length > 0 ? filteredTeams.map(team => {
          const currentGroup = groups.find(g => g.teams.some(t => t.id === team.id));
          return (
            <div key={team.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-brand-primary p-3 rounded-xl border border-transparent hover:border-brand-accent transition-colors">
              <div className="flex items-center gap-3">
                <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-10 h-10 sm:w-8 sm:h-8" />
                <div className="flex-grow min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-semibold text-brand-text truncate text-sm sm:text-base">{team.name}</span>
                      {team.ownerEmail && (
                          <div className="flex items-center gap-1 text-[10px] text-brand-light/60 bg-white/5 px-2 py-0.5 rounded max-w-fit">
                             <Mail size={10} className="shrink-0" />
                             <span className="truncate max-w-[150px]">{team.ownerEmail}</span>
                          </div>
                      )}
                  </div>
                  <p className="text-xs text-brand-light">
                      {team.manager ? `Mgr: ${team.manager}` : 'No Manager'} 
                      {currentGroup && <span className="text-brand-vibrant font-bold ml-1">• Group {currentGroup.name.split(' ')[1]}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-none">
                <Button onClick={() => handleToggleSeed(team)} variant="secondary" className="p-2 h-8 w-8" title={team.isTopSeed ? "Unmark as Top Seed" : "Mark as Top Seed"}>
                    <Star size={14} className={`transition-colors ${team.isTopSeed ? 'fill-yellow-400 text-yellow-400' : 'text-brand-light hover:text-yellow-300'}`} />
                </Button>
                {currentGroup && (
                    <Button onClick={() => setMovingTeam(team)} variant="secondary" className="px-3 py-1.5 h-8 w-10" title="Move team to another group">
                        <ArrowRightLeft size={14} />
                    </Button>
                )}
                <Button onClick={() => handleEditClick(team)} variant="secondary" className="px-3 py-1.5 h-8 w-10">
                  <Edit size={14} />
                </Button>
                <Button 
                  onClick={() => handleDeleteClick(team)} 
                  variant="secondary" 
                  className="px-3 py-1.5 h-8 w-10 bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30 disabled:opacity-30"
                  disabled={!!currentGroup}
                  title={currentGroup ? "Cannot delete a team in a group" : "Delete team"}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          )
        }) : (
            <div className="text-center py-8 text-brand-light italic bg-brand-secondary/30 rounded-lg">
                {searchTerm ? 'No teams found matching your search.' : 'No teams added yet.'}
            </div>
        )}
      </div>
      
      {topSeedTeams.length > 0 && (
          <div className="border-t border-brand-accent mt-6 pt-6">
              <h3 className="text-xl font-bold text-brand-text mb-4">Top Seed Placement</h3>
              <div className="bg-brand-primary p-4 rounded-xl space-y-4">
                <div>
                    <label htmlFor="num-groups" className="block text-sm font-medium text-brand-light mb-1">Number of Groups</label>
                    <input
                        id="num-groups"
                        type="number"
                        min="2"
                        max="8"
                        value={numGroups}
                        onChange={(e) => setNumGroups(parseInt(e.target.value, 10) || 2)}
                        className="w-full sm:w-24 p-2 bg-brand-secondary border border-brand-accent rounded-md text-brand-text"
                    />
                </div>
                <div className="space-y-3">
                    {topSeedTeams.map(team => (
                        <div key={team.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-black/20 rounded">
                            <div className="flex items-center gap-2">
                                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-brand-text text-sm">{team.name}</span>
                            </div>
                            <select
                                value={team.assignedGroup || ""}
                                onChange={(e) => assignTopSeedToGroup(team.id, e.target.value)}
                                className="w-full sm:w-auto p-2 bg-brand-secondary border border-brand-accent rounded-md text-brand-text text-xs"
                            >
                                <option value="">Select Group</option>
                                {groupOptions.map(char => (
                                    <option key={char} value={char}>Group {char}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
              </div>
          </div>
      )}

      <div className="border-t border-brand-accent mt-6 pt-6">
          <h3 className="text-xl font-bold text-brand-text mb-4">Tournament Controls</h3>
          <div className="space-y-4">
               <div className="bg-brand-primary p-4 rounded-xl">
                   <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                    <Button onClick={handleBackupData} variant="secondary" className="w-full sm:w-auto">
                        <Download size={16} />
                        Backup Data
                    </Button>
                    <Button onClick={handleRestoreClick} variant="secondary" className="w-full sm:w-auto">
                        <Upload size={16} />
                        Restore Data
                    </Button>
                    {importLegacyData && (
                        <Button onClick={handleLegacyImportClick} variant="secondary" className="w-full sm:w-auto bg-purple-900/30 text-purple-300 border-purple-500/30 hover:bg-purple-900/50">
                            <FileJson size={16} />
                            Import Legacy
                        </Button>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
                    <input type="file" ref={legacyFileInputRef} onChange={handleLegacyFileChange} className="hidden" accept="application/json" />
                  </div>
              </div>
               <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleGenerateClick} disabled={!canGenerateGroups} className="w-full sm:w-auto justify-center">
                      <Users size={16} /> Generate Groups
                  </Button>
                  <Button onClick={handleGenerateMatchesClick} disabled={groups.length === 0 || matches.length > 0} className="w-full sm:w-auto justify-center">
                      <Shuffle size={16} /> Generate Fixtures
                  </Button>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                  <Button onClick={() => setShowResetConfirm(true)} className="bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto justify-center">
                      <RefreshCw size={16} /> Reset Tournament
                  </Button>
              </div>
          </div>
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

      {showForm && (
        <TeamForm
          team={editingTeam}
          onSave={handleFormSave}
          onClose={() => setShowForm(false)}
          isSaving={isSavingTeam}
        />
      )}
      
      {movingTeam && (
        <MoveTeamModal
            team={movingTeam}
            groups={groups}
            onClose={() => setMovingTeam(null)}
            onSave={handleMoveTeamSave}
        />
      )}

      {showResetConfirm && <ResetConfirmationModal onConfirm={handleResetConfirm} onCancel={() => setShowResetConfirm(false)} />}
      {showGenerateConfirm && <GenerateGroupsConfirmationModal onConfirm={handleGenerateConfirm} onCancel={() => setShowGenerateConfirm(false)} />}
      <ConfirmationModal
        isOpen={showGenerateMatchesConfirm}
        onClose={() => setShowGenerateMatchesConfirm(false)}
        onConfirm={handleGenerateMatchesConfirm}
        title="Confirm Fixture Generation"
        message="This will create a new set of match fixtures for the current groups. Any existing fixtures will be overwritten. Continue?"
        confirmText="Yes, Generate Fixtures"
        confirmButtonClass="bg-brand-vibrant text-white hover:bg-opacity-80"
      />
      <ConfirmationModal isOpen={!!teamToDelete} onClose={() => setTeamToDelete(null)} onConfirm={handleConfirmDelete} title="Confirm Team Deletion" message={<p>Are you sure you want to permanently delete the team <strong>{teamToDelete?.name}</strong>?</p>} confirmText="Yes, Delete Team" confirmButtonClass="bg-red-600 text-white hover:bg-red-700" />
      <ConfirmationModal isOpen={showImportConfirm} onClose={() => { setShowImportConfirm(false); setImportedData(null); }} onConfirm={handleConfirmImport} title="Confirm Data Restore" message="Overwrite all data?" confirmText="Yes, Restore Data" />
      <ConfirmationModal isOpen={showLegacyImportConfirm} onClose={() => { setShowLegacyImportConfirm(false); setLegacyImportData(null); }} onConfirm={handleConfirmLegacyImport} title="Confirm Legacy Data Import" message="Overwrite data with legacy file?" confirmText="Yes, Import" />
    </Card>
  );
};
