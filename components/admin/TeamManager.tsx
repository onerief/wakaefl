
import React, { useState } from 'react';
import type { Team, Group, Match, KnockoutStageRounds, TournamentState } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { TeamForm } from './TeamForm';
import { Plus, Edit, Trash2, Shuffle, RefreshCw, Download, ArrowRightLeft, Star, Upload, Users, Mail, FileJson } from 'lucide-react';
import { ResetConfirmationModal } from './ResetConfirmationModal';
import { GenerateGroupsConfirmationModal } from './GenerateGroupsConfirmationModal';
import { useToast } from '../shared/Toast';
import { ConfirmationModal } from './ConfirmationModal';
import { MoveTeamModal } from './MoveTeamModal';
import { ManualGroupManager } from './ManualGroupManager';
import { TeamLogo } from '../shared/TeamLogo';

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
  importLegacyData?: (jsonData: any) => void; // New optional prop
  rules: string;
}

export const TeamManager: React.FC<TeamManagerProps> = (props) => {
  const { 
    teams, groups, matches, knockoutStage, addTeam, updateTeam, deleteTeam, 
    generateGroupStage, onGenerationSuccess, resetTournament, moveTeamToGroup, 
    assignTopSeedToGroup, manualAddGroup, manualDeleteGroup, manualAddTeamToGroup, 
    manualRemoveTeamFromGroup, generateMatchesFromGroups, setTournamentState, importLegacyData, rules
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
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const legacyFileInputRef = React.useRef<HTMLInputElement>(null);
  
  const isTeamInUse = (teamId: string) => {
    return groups.some(g => g.teams.some(t => t.id === teamId));
  }

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
    addToast(`Team "${movingTeam.name}" moved successfully. Matches and standings for affected groups have been reset.`, 'success');
    setMovingTeam(null);
  };

  const handleBackupData = () => {
    try {
        const backupData = {
            teams,
            groups,
            matches,
            knockoutStage,
            rules
        };
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
        addToast('Tournament data backup is downloading.', 'success');
    } catch (error) {
        console.error("Failed to create backup:", error);
        addToast('Failed to create data backup.', 'error');
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not readable.");
        }
        const data = JSON.parse(text) as TournamentState;
        
        // Basic validation
        if (data && typeof data === 'object' && 'teams' in data && 'groups' in data && 'matches' in data) {
          setImportedData(data);
          setShowImportConfirm(true);
        } else {
          addToast("Invalid JSON format. The file does not appear to be a valid tournament backup.", 'error');
        }
      } catch (error) {
        console.error("Failed to parse JSON:", error);
        addToast("Failed to read or parse the backup file. Please ensure it's a valid JSON file.", 'error');
      } finally {
          if(event.target) {
            event.target.value = '';
          }
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

  // Specific handler for legacy JSON format
  const handleLegacyImportClick = () => {
      legacyFileInputRef.current?.click();
  }

  const handleLegacyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') throw new Error("Unreadable file");
              const data = JSON.parse(text);
              if (importLegacyData) {
                  importLegacyData(data);
              }
          } catch (error) {
              console.error(error);
              addToast('Failed to import legacy data.', 'error');
          } finally {
              if (event.target) event.target.value = '';
          }
      }
      reader.readAsText(file);
  }

  const canGenerateGroups = teams.length >= 2;
  const topSeedTeams = teams.filter(t => t.isTopSeed);
  const groupOptions = Array.from({ length: numGroups }, (_, i) => String.fromCharCode(65 + i));

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-brand-text">Manage Teams ({teams.length})</h3>
        <Button onClick={handleAddClick}>
          <Plus size={16} />
          Add Team
        </Button>
      </div>

      <div className="space-y-2">
        {teams.map(team => {
          const currentGroup = groups.find(g => g.teams.some(t => t.id === team.id));
          return (
            <div key={team.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-brand-primary p-3 rounded-md">
              <div className="flex items-center gap-3">
                <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-8 h-8" />
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-text truncate">{team.name}</span>
                      {team.ownerEmail && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded flex items-center gap-1 border border-green-800">
                             <Mail size={8} /> Linked
                          </span>
                      )}
                  </div>
                  {currentGroup && <p className="text-xs text-brand-light">Group {currentGroup.name.split(' ')[1]}</p>}
                  {team.ownerEmail && <p className="text-[10px] text-brand-light/50 truncate max-w-[200px]">{team.ownerEmail}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                <Button onClick={() => handleToggleSeed(team)} variant="secondary" className="p-2" title={team.isTopSeed ? "Unmark as Top Seed" : "Mark as Top Seed"}>
                    <Star size={14} className={`transition-colors ${team.isTopSeed ? 'fill-yellow-400 text-yellow-400' : 'text-brand-light hover:text-yellow-300'}`} />
                </Button>
                {currentGroup && (
                    <Button onClick={() => setMovingTeam(team)} variant="secondary" className="px-3 py-1.5" title="Move team to another group">
                        <ArrowRightLeft size={14} />
                    </Button>
                )}
                <Button onClick={() => handleEditClick(team)} variant="secondary" className="px-3 py-1.5">
                  <Edit size={14} />
                </Button>
                <Button 
                  onClick={() => handleDeleteClick(team)} 
                  variant="secondary" 
                  className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-transparent disabled:text-gray-500"
                  disabled={!!currentGroup}
                  title={currentGroup ? "Cannot delete a team in a group" : "Delete team"}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      
      {topSeedTeams.length > 0 && (
          <div className="border-t border-brand-accent mt-6 pt-6">
              <h3 className="text-xl font-bold text-brand-text mb-4">Top Seed Placement</h3>
              <div className="bg-brand-primary p-4 rounded-md space-y-4">
                <div>
                    <label htmlFor="num-groups" className="block text-sm font-medium text-brand-light mb-1">Number of Groups</label>
                    <input
                        id="num-groups"
                        type="number"
                        min="2"
                        max="8"
                        value={numGroups}
                        onChange={(e) => setNumGroups(parseInt(e.target.value, 10) || 2)}
                        className="w-24 p-2 bg-brand-secondary border border-brand-accent rounded-md text-brand-text"
                    />
                </div>
                <div className="space-y-3">
                    {topSeedTeams.map(team => (
                        <div key={team.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-brand-text">{team.name}</span>
                            </div>
                            <select
                                value={team.assignedGroup || ""}
                                onChange={(e) => assignTopSeedToGroup(team.id, e.target.value)}
                                className="p-2 bg-brand-secondary border border-brand-accent rounded-md text-brand-text"
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
              <div className="bg-brand-primary p-4 rounded-md">
                  <p className="text-brand-light mb-3 text-sm">
                      Download a JSON file containing all current tournament data (teams, groups, matches, etc.). Keep this file safe to restore your tournament later.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                    <Button onClick={handleBackupData} variant="secondary" className="w-full sm:w-auto">
                        <Download size={16} />
                        Backup Tournament Data
                    </Button>
                    <Button onClick={handleRestoreClick} variant="secondary" className="w-full sm:w-auto">
                        <Upload size={16} />
                        Restore from Backup
                    </Button>
                    {importLegacyData && (
                        <Button onClick={handleLegacyImportClick} variant="secondary" className="w-full sm:w-auto bg-purple-900/30 text-purple-300 border-purple-500/30 hover:bg-purple-900/50">
                            <FileJson size={16} />
                            Import Legacy S2 Data
                        </Button>
                    )}
                    <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="application/json"
                    />
                    <input 
                        type="file"
                        ref={legacyFileInputRef}
                        onChange={handleLegacyFileChange}
                        className="hidden"
                        accept="application/json"
                    />
                  </div>
              </div>
              <div className="bg-brand-primary p-4 rounded-md">
                  <p className="text-brand-light mb-3 text-sm">
                    Step 1: Randomly assign teams into groups. This will reset any existing groups, matches, and knockout data. You can configure top seeds before generating.
                  </p>
                  <Button onClick={handleGenerateClick} disabled={!canGenerateGroups} title={!canGenerateGroups ? 'Requires at least 2 teams.' : 'Generate Groups'} className="w-full sm:w-auto">
                      <Users size={16} />
                      Generate Groups
                  </Button>
              </div>
              <div className="bg-brand-primary p-4 rounded-md">
                  <p className="text-brand-light mb-3 text-sm">
                      Step 2: Once groups are set, generate all home-away match fixtures for the group stage. This will overwrite any existing fixtures.
                  </p>
                  <Button 
                      onClick={handleGenerateMatchesClick}
                      disabled={groups.length === 0 || matches.length > 0}
                      title={
                          groups.length === 0 
                          ? 'Generate groups first.' 
                          : matches.length > 0 
                          ? 'Fixtures have already been generated.' 
                          : 'Generate Fixtures'
                      }
                      className="w-full sm:w-auto"
                  >
                      <Shuffle size={16} />
                      Generate Fixtures
                  </Button>
              </div>
              
              <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                  <p className="text-red-700 mb-3 text-sm">
                      Start a completely new tournament. This will permanently delete all teams, groups, and match data. This action cannot be undone.
                  </p>
                  <Button 
                      onClick={() => setShowResetConfirm(true)} 
                      className="bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto"
                  >
                      <RefreshCw size={16} />
                      Reset Tournament
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

      {showResetConfirm && (
        <ResetConfirmationModal
          onConfirm={handleResetConfirm}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {showGenerateConfirm && (
        <GenerateGroupsConfirmationModal
          onConfirm={handleGenerateConfirm}
          onCancel={() => setShowGenerateConfirm(false)}
        />
      )}
      
      <ConfirmationModal
        isOpen={showGenerateMatchesConfirm}
        onClose={() => setShowGenerateMatchesConfirm(false)}
        onConfirm={handleGenerateMatchesConfirm}
        title="Confirm Fixture Generation"
        message="This will create a new set of match fixtures for the current groups. Any existing fixtures will be overwritten. Continue?"
        confirmText="Yes, Generate Fixtures"
        confirmButtonClass="bg-brand-vibrant text-white hover:bg-opacity-80"
      />

      <ConfirmationModal
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Team Deletion"
        message={
            <p>
                Are you sure you want to permanently delete the team{' '}
                <strong>{teamToDelete?.name}</strong>? This action cannot be undone.
            </p>
        }
        confirmText="Yes, Delete Team"
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700"
      />
      
      <ConfirmationModal
        isOpen={showImportConfirm}
        onClose={() => {
            setShowImportConfirm(false);
            setImportedData(null);
        }}
        onConfirm={handleConfirmImport}
        title="Confirm Data Restore"
        message={
            <p>
                Are you sure you want to restore data from the selected backup file?
                <strong> This will overwrite all current tournament data.</strong> This action cannot be undone.
            </p>
        }
        confirmText="Yes, Restore Data"
        confirmButtonClass="bg-brand-vibrant text-white hover:bg-opacity-80"
      />
    </Card>
  );
};
