import React, { useState, useMemo } from 'react';
import type { Team, Group, Match } from '../../types';
import { Button } from '../shared/Button';
// FIX: Added 'X' to the import from lucide-react.
import { Plus, Trash2, Shuffle, Users, X } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { ConfirmationModal } from './ConfirmationModal';

interface ManualGroupManagerProps {
    teams: Team[];
    groups: Group[];
    matches: Match[];
    addGroup: (name: string) => void;
    deleteGroup: (groupId: string) => void;
    addTeamToGroup: (teamId: string, groupId: string) => void;
    removeTeamFromGroup: (teamId: string, groupId: string) => void;
    generateMatches: () => void;
    onGenerationSuccess: () => void;
}

const GroupCard: React.FC<{
    group: Group;
    unassignedTeams: Team[];
    matches: Match[];
    onDelete: (groupId: string) => void;
    onAddTeam: (teamId: string, groupId: string) => void;
    onRemoveTeam: (teamId: string, groupId: string) => void;
}> = ({ group, unassignedTeams, matches, onDelete, onAddTeam, onRemoveTeam }) => {
    const [selectedTeam, setSelectedTeam] = useState('');
    const { addToast } = useToast();

    const groupLetter = group.name.split(' ')[1];
    const hasMatches = useMemo(() => matches.some(m => m.group === groupLetter), [matches, groupLetter]);

    const handleAddTeam = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTeam) {
            onAddTeam(selectedTeam, group.id);
            setSelectedTeam('');
        } else {
            addToast('Please select a team to add.', 'error');
        }
    };

    return (
        <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-brand-vibrant">{group.name} ({group.teams.length})</h4>
                <Button
                    onClick={() => onDelete(group.id)}
                    variant="secondary"
                    className="!p-2 bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-transparent disabled:text-gray-500"
                    disabled={hasMatches}
                    title={hasMatches ? "Cannot delete group with existing matches" : "Delete Group"}
                >
                    <Trash2 size={14} />
                </Button>
            </div>
            <div className="space-y-2 flex-grow mb-4">
                {group.teams.length > 0 ? group.teams.map(team => (
                    <div key={team.id} className="flex justify-between items-center bg-brand-secondary p-2 rounded">
                        <span className="text-sm font-medium text-brand-text">{team.name}</span>
                        <button
                            onClick={() => onRemoveTeam(team.id, group.id)}
                            className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                            disabled={hasMatches}
                            title={hasMatches ? "Cannot remove team after matches are generated" : "Remove team"}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )) : <p className="text-sm text-brand-light italic text-center py-4">No teams assigned.</p>}
            </div>
            {!hasMatches && (
                <form onSubmit={handleAddTeam} className="flex gap-2 items-end">
                    <div className="flex-grow">
                        <label htmlFor={`select-${group.id}`} className="sr-only">Add team</label>
                        <select
                            id={`select-${group.id}`}
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-md text-brand-text text-sm"
                        >
                            <option value="">Select a team...</option>
                            {unassignedTeams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    <Button type="submit" variant="secondary" className="!px-3 !py-2">
                        <Plus size={16} />
                    </Button>
                </form>
            )}
        </div>
    );
};

export const ManualGroupManager: React.FC<ManualGroupManagerProps> = ({ teams, groups, matches, addGroup, deleteGroup, addTeamToGroup, removeTeamFromGroup, generateMatches, onGenerationSuccess }) => {
    const { addToast } = useToast();
    const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

    const assignedTeamIds = useMemo(() => new Set(groups.flatMap(g => g.teams.map(t => t.id))), [groups]);
    const unassignedTeams = useMemo(() => teams.filter(t => !assignedTeamIds.has(t.id)), [teams, assignedTeamIds]);

    const handleAddGroup = () => {
        const existingGroupLetters = groups.map(g => g.name.split(' ')[1]);
        let nextGroupChar = 'A';
        while (existingGroupLetters.includes(nextGroupChar)) {
            nextGroupChar = String.fromCharCode(nextGroupChar.charCodeAt(0) + 1);
        }
        addGroup(`Group ${nextGroupChar}`);
    };
    
    const handleGenerateClick = () => {
        if (groups.some(g => g.teams.length < 2)) {
            addToast('All groups must have at least 2 teams to generate fixtures.', 'error');
            return;
        }
        setShowGenerateConfirm(true);
    };

    const handleConfirmGenerate = () => {
        generateMatches();
        addToast('Fixtures generated successfully from manual setup!', 'success');
        onGenerationSuccess();
        setShowGenerateConfirm(false);
    }
    
    return (
        <div className="space-y-6">
            <div className="bg-brand-primary p-4 rounded-lg space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div>
                        <h4 className="font-bold text-brand-text">Unassigned Teams ({unassignedTeams.length})</h4>
                        <p className="text-sm text-brand-light">These teams are not yet in a group.</p>
                     </div>
                    <div className="flex gap-2">
                        <Button onClick={handleAddGroup} variant="secondary">
                            <Plus size={16} /> Add Group
                        </Button>
                        <Button 
                          onClick={handleGenerateClick}
                          disabled={groups.length === 0}
                          title={groups.length === 0 ? "Add at least one group first" : ""}
                        >
                            <Shuffle size={16} /> Generate Fixtures From Manual Setup
                        </Button>
                    </div>
                </div>
                {unassignedTeams.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-sm text-brand-text p-2 bg-brand-secondary rounded">
                       {unassignedTeams.map(t => <span key={t.id} className="bg-brand-accent/50 px-2 py-1 rounded">{t.name}</span>)}
                    </div>
                )}
            </div>

            {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map(group => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            unassignedTeams={unassignedTeams}
                            matches={matches}
                            onDelete={deleteGroup}
                            onAddTeam={addTeamToGroup}
                            onRemoveTeam={removeTeamFromGroup}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center bg-brand-primary p-8 rounded-lg">
                    <Users size={40} className="mx-auto text-brand-light mb-4" />
                    <h3 className="text-xl font-bold text-brand-text mb-2">No Groups Created</h3>
                    <p className="text-brand-light">Click "Add Group" to start building your group stage manually.</p>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={showGenerateConfirm}
                onClose={() => setShowGenerateConfirm(false)}
                onConfirm={handleConfirmGenerate}
                title="Confirm Fixture Generation"
                message="This will delete all current group stage matches and create new ones based on your manual setup. This action cannot be undone."
                confirmText="Yes, Generate"
                confirmButtonClass="bg-brand-vibrant text-white hover:bg-opacity-80"
            />
        </div>
    );
};