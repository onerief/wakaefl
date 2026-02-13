
import React, { useState, useMemo } from 'react';
import type { Team, Group, Match } from '../../types';
import { Button } from '../shared/Button';
import { Plus, Trash2, Shuffle, Users, X, Wand2, Calculator } from 'lucide-react';
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
    autoGenerateGroups?: (numberOfGroups: number) => void;
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

export const ManualGroupManager: React.FC<ManualGroupManagerProps> = ({ teams, groups, matches, addGroup, deleteGroup, addTeamToGroup, removeTeamFromGroup, generateMatches, onGenerationSuccess, autoGenerateGroups }) => {
    const { addToast } = useToast();
    const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
    const [showAutoConfirm, setShowAutoConfirm] = useState(false);
    const [numGroups, setNumGroups] = useState(4);

    const assignedTeamIds = useMemo(() => new Set(groups.flatMap(g => g.teams.map(t => t.id))), [groups]);
    const unassignedTeams = useMemo(() => teams.filter(t => !assignedTeamIds.has(t.id)), [teams, assignedTeamIds]);

    // Calculate teams per group preview
    const perGroup = useMemo(() => {
        if(numGroups <= 0) return 0;
        const min = Math.floor(teams.length / numGroups);
        const remainder = teams.length % numGroups;
        return remainder === 0 ? `${min}` : `${min} - ${min + 1}`;
    }, [numGroups, teams.length]);

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

    const handleAutoGenerateClick = () => {
        if (numGroups < 1) {
            addToast('Minimum 1 group.', 'error');
            return;
        }
        setShowAutoConfirm(true);
    }

    const confirmAutoGenerate = () => {
        if(autoGenerateGroups) {
            autoGenerateGroups(numGroups);
            addToast('Groups generated automatically!', 'success');
            setShowAutoConfirm(false);
        }
    }
    
    return (
        <div className="space-y-8">
            {/* Auto Generator Section */}
            {autoGenerateGroups && (
                <div className="bg-brand-vibrant/5 p-5 rounded-2xl border border-brand-vibrant/20 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                        <div>
                            <h4 className="font-black text-brand-text flex items-center gap-2 uppercase tracking-wide text-sm">
                                <Wand2 size={18} className="text-brand-vibrant" /> Automatic Generator
                            </h4>
                            <p className="text-xs text-brand-light mt-1">Acak {teams.length} tim ke dalam grup secara otomatis.</p>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto bg-brand-primary p-2 rounded-xl border border-white/5">
                            <div className="flex flex-col px-2">
                                <label className="text-[8px] font-bold text-brand-light uppercase tracking-wider">Groups</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="26" 
                                    value={numGroups} 
                                    onChange={(e) => setNumGroups(parseInt(e.target.value) || 1)}
                                    className="bg-transparent text-white font-black text-lg w-12 outline-none"
                                />
                            </div>
                            <div className="h-8 w-px bg-white/10"></div>
                            <div className="flex flex-col px-2">
                                <label className="text-[8px] font-bold text-brand-light uppercase tracking-wider">Per Group</label>
                                <span className="text-brand-vibrant font-black text-lg">{perGroup}</span>
                            </div>
                            <Button onClick={handleAutoGenerateClick} className="!py-2 !px-4 !text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-vibrant/20">
                                <Shuffle size={14} /> Generate
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Management Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                     <div>
                        <h4 className="font-bold text-brand-text flex items-center gap-2">
                            <Users size={18} className="text-brand-light" /> Manual Management
                        </h4>
                        <p className="text-xs text-brand-light mt-1">
                            {unassignedTeams.length > 0 ? <span className="text-yellow-400 font-bold">{unassignedTeams.length} Unassigned Teams</span> : <span className="text-green-400 font-bold">All Teams Assigned</span>}
                        </p>
                     </div>
                    <div className="flex gap-2">
                        <Button onClick={handleAddGroup} variant="secondary" className="!text-xs">
                            <Plus size={14} /> Add Group
                        </Button>
                        <Button 
                          onClick={handleGenerateClick}
                          disabled={groups.length === 0}
                          title={groups.length === 0 ? "Add at least one group first" : ""}
                          className="!text-xs font-bold"
                        >
                            <Calculator size={14} /> Update Fixtures
                        </Button>
                    </div>
                </div>

                {unassignedTeams.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-brand-text p-3 bg-black/20 rounded-xl border border-white/5">
                       {unassignedTeams.map(t => <span key={t.id} className="bg-white/5 px-2 py-1 rounded border border-white/5">{t.name}</span>)}
                    </div>
                )}

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
                    <div className="text-center bg-brand-primary/50 p-10 rounded-2xl border border-dashed border-white/10">
                        <Users size={32} className="mx-auto text-brand-light/20 mb-3" />
                        <h3 className="text-sm font-bold text-brand-text mb-1">No Groups Created</h3>
                        <p className="text-xs text-brand-light">Use Auto Generate or add groups manually.</p>
                    </div>
                )}
            </div>
            
            <ConfirmationModal
                isOpen={showGenerateConfirm}
                onClose={() => setShowGenerateConfirm(false)}
                onConfirm={handleConfirmGenerate}
                title="Update Fixtures"
                message="This will regenerate the match schedule based on current groups. Scores for existing matches might be reset if team positions change."
                confirmText="Update Fixtures"
                confirmButtonClass="bg-brand-vibrant text-white hover:bg-opacity-80"
                variant="info"
            />

            <ConfirmationModal
                isOpen={showAutoConfirm}
                onClose={() => setShowAutoConfirm(false)}
                onConfirm={confirmAutoGenerate}
                title="Auto Generate Groups"
                message={<p>This will <strong>delete all existing groups and matches</strong> and redistribute teams randomly. Are you sure?</p>}
                confirmText="Yes, Generate"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
                variant="warning"
            />
        </div>
    );
};
