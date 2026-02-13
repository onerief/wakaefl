
import React, { useState, useMemo } from 'react';
import type { Team, Group, Match, TournamentMode } from '../../types';
import { Button } from '../shared/Button';
import { Plus, Trash2, Shuffle, Users, X, Wand2, Calculator, LayoutList, AlertTriangle, ArrowRight } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { ConfirmationModal } from './ConfirmationModal';
import { FixtureGeneratorModal } from './FixtureGeneratorModal';

interface ManualGroupManagerProps {
    teams: Team[];
    groups: Group[];
    matches: Match[];
    addGroup: (name: string) => void;
    deleteGroup: (groupId: string) => void;
    addTeamToGroup: (teamId: string, groupId: string) => void;
    removeTeamFromGroup: (teamId: string, groupId: string) => void;
    generateMatches: (type: 'single' | 'double') => void;
    onGenerationSuccess: () => void;
    autoGenerateGroups?: (numberOfGroups: number) => void;
    initializeLeague?: () => void;
    mode?: TournamentMode;
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
    const hasMatches = useMemo(() => matches.some(m => m.group === groupLetter || m.group === group.id || m.group === group.name), [matches, groupLetter, group]);

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
        <div className="bg-brand-primary p-4 rounded-xl border border-brand-accent flex flex-col shadow-lg h-full">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/5">
                <h4 className="font-black text-brand-vibrant uppercase tracking-tight text-sm">{group.name} <span className="text-white ml-1">({group.teams.length})</span></h4>
                <Button
                    onClick={() => onDelete(group.id)}
                    variant="secondary"
                    className="!p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-red-500"
                    disabled={hasMatches}
                    title={hasMatches ? "Cannot delete group with existing matches" : "Delete Group"}
                >
                    <Trash2 size={12} />
                </Button>
            </div>
            
            <div className="flex-grow mb-4 overflow-y-auto custom-scrollbar max-h-60 pr-1 space-y-1.5">
                {group.teams.length > 0 ? group.teams.map((team, idx) => (
                    <div key={team.id} className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5 group hover:border-white/20 transition-all">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[9px] font-mono text-brand-light/30 w-4">{idx + 1}</span>
                            <span className="text-xs font-bold text-brand-text truncate">{team.name}</span>
                        </div>
                        <button
                            onClick={() => onRemoveTeam(team.id, group.id)}
                            className="text-brand-light hover:text-red-500 disabled:opacity-20 transition-colors p-1"
                            disabled={hasMatches}
                            title={hasMatches ? "Cannot remove team after matches are generated" : "Remove team"}
                        >
                            <X size={12} />
                        </button>
                    </div>
                )) : <p className="text-xs text-brand-light italic text-center py-8 opacity-50">Belum ada tim.</p>}
            </div>

            <form onSubmit={handleAddTeam} className="flex gap-2 items-center mt-auto pt-3 border-t border-white/5">
                <div className="flex-grow relative">
                    <select
                        id={`select-${group.id}`}
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full p-2 bg-brand-secondary border border-brand-accent rounded-lg text-white text-[10px] font-bold outline-none focus:border-brand-vibrant appearance-none"
                    >
                        <option value="">+ Tambah Tim ({unassignedTeams.length} tersedia)</option>
                        {unassignedTeams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>
                <Button type="submit" variant="secondary" className="!px-3 !py-2 bg-brand-vibrant/20 text-brand-vibrant hover:bg-brand-vibrant hover:text-white border-brand-vibrant/30">
                    <Plus size={14} />
                </Button>
            </form>
        </div>
    );
};

export const ManualGroupManager: React.FC<ManualGroupManagerProps> = ({ 
    teams, groups, matches, addGroup, deleteGroup, addTeamToGroup, removeTeamFromGroup, 
    generateMatches, onGenerationSuccess, autoGenerateGroups, initializeLeague, mode 
}) => {
    const { addToast } = useToast();
    const [showFixtureModal, setShowFixtureModal] = useState(false);
    const [showAutoConfirm, setShowAutoConfirm] = useState(false);
    const [showLeagueConfirm, setShowLeagueConfirm] = useState(false);
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
            addToast('Setiap grup minimal harus memiliki 2 tim untuk membuat jadwal.', 'error');
            return;
        }
        setShowFixtureModal(true);
    };

    const handleConfirmGenerate = (type: 'single' | 'double') => {
        generateMatches(type);
        addToast(`Jadwal pertandingan berhasil dibuat (${type === 'single' ? '1 Leg' : '2 Leg'})!`, 'success');
        onGenerationSuccess();
    }

    const handleAutoGenerateClick = () => {
        if (numGroups < 1) {
            addToast('Minimal 1 grup.', 'error');
            return;
        }
        setShowAutoConfirm(true);
    }

    const confirmAutoGenerate = () => {
        if(autoGenerateGroups) {
            autoGenerateGroups(numGroups);
            addToast('Grup berhasil diacak ulang!', 'success');
            setShowAutoConfirm(false);
        }
    }

    const confirmLeagueInit = () => {
        if (initializeLeague) {
            initializeLeague();
            addToast('Liga Reguler berhasil diinisialisasi untuk semua tim!', 'success');
            setShowLeagueConfirm(false);
        }
    }
    
    return (
        <div className="space-y-8">
            {/* Conditional Generator Section */}
            {mode === 'league' ? (
                <div className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/30 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                        <div>
                            <h4 className="font-black text-white flex items-center gap-2 uppercase tracking-wide text-sm">
                                <LayoutList size={18} className="text-blue-400" /> Liga Structure Generator
                            </h4>
                            <p className="text-xs text-blue-200/60 mt-1">
                                Reset dan masukkan <strong>semua {teams.length} tim</strong> ke dalam satu klasemen besar (Liga).
                            </p>
                        </div>
                        <Button 
                            onClick={() => setShowLeagueConfirm(true)} 
                            className="!py-2 !px-4 !text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 !bg-blue-600 hover:!bg-blue-700 border-none"
                        >
                            <Wand2 size={14} /> Reset & Generate All
                        </Button>
                    </div>
                </div>
            ) : (
                autoGenerateGroups && (
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
                )
            )}

            {/* Warning for Unassigned Teams */}
            {unassignedTeams.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex items-start gap-4 animate-in slide-in-from-top-2">
                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500 shrink-0">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="flex-grow">
                        <h4 className="text-sm font-black text-yellow-500 uppercase tracking-wide mb-1">
                            {unassignedTeams.length} Tim Belum Masuk Grup!
                        </h4>
                        <p className="text-[10px] text-brand-light mb-3 leading-relaxed">
                            Tim yang ada di "Daftar Tim" tetapi belum dimasukkan ke Grup <strong>tidak akan muncul di Klasemen</strong>. 
                            Silakan masukkan mereka secara manual ke grup di bawah ini.
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {unassignedTeams.slice(0, 10).map(t => (
                                <span key={t.id} className="text-[9px] px-2 py-0.5 bg-black/40 rounded border border-white/10 text-white/70">{t.name}</span>
                            ))}
                            {unassignedTeams.length > 10 && <span className="text-[9px] px-2 py-0.5 text-white/40">...dan {unassignedTeams.length - 10} lainnya</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Management Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                     <div>
                        <h4 className="font-bold text-brand-text flex items-center gap-2">
                            <Users size={18} className="text-brand-light" /> Manajemen Grup Manual
                        </h4>
                        <p className="text-xs text-brand-light mt-1">
                            {unassignedTeams.length > 0 ? <span className="text-yellow-400 font-bold">{unassignedTeams.length} Tim Belum Ditugaskan</span> : <span className="text-green-400 font-bold">Semua Tim Telah Masuk Grup</span>}
                        </p>
                     </div>
                    <div className="flex gap-2">
                        {mode !== 'league' && (
                            <Button onClick={handleAddGroup} variant="secondary" className="!text-xs">
                                <Plus size={14} /> Add Group
                            </Button>
                        )}
                        <Button 
                          onClick={handleGenerateClick}
                          disabled={groups.length === 0}
                          title={groups.length === 0 ? "Add at least one group first" : ""}
                          className="!text-xs font-bold shadow-lg shadow-brand-vibrant/10 flex items-center gap-2"
                        >
                            <Calculator size={14} /> Fixture Generator
                        </Button>
                    </div>
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
                    <div className="text-center bg-brand-primary/50 p-10 rounded-2xl border border-dashed border-white/10">
                        <Users size={32} className="mx-auto text-brand-light/20 mb-3" />
                        <h3 className="text-sm font-bold text-brand-text mb-1">Tidak Ada Grup</h3>
                        <p className="text-xs text-brand-light">Gunakan Generator di atas atau Tambah Grup Manual.</p>
                    </div>
                )}
            </div>
            
            <FixtureGeneratorModal 
                isOpen={showFixtureModal}
                onClose={() => setShowFixtureModal(false)}
                onGenerate={handleConfirmGenerate}
                groupCount={groups.length}
            />

            <ConfirmationModal
                isOpen={showAutoConfirm}
                onClose={() => setShowAutoConfirm(false)}
                onConfirm={confirmAutoGenerate}
                title="Auto Generate Groups"
                message={<p>Ini akan <strong>menghapus semua grup dan jadwal</strong> yang ada, lalu membagikan semua tim secara acak ke grup baru. Lanjutkan?</p>}
                confirmText="Ya, Acak Ulang"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
                variant="warning"
            />

            <ConfirmationModal
                isOpen={showLeagueConfirm}
                onClose={() => setShowLeagueConfirm(false)}
                onConfirm={confirmLeagueInit}
                title="Initialize League Season"
                message={<p>Ini akan membuat <strong>1 Grup Klasemen Besar</strong> berisi <strong>SEMUA {teams.length} TIM</strong> yang terdaftar dan membuat jadwal <strong>Double Round Robin</strong>. Data grup/jadwal lama di mode ini akan dihapus.</p>}
                confirmText="Buat Jadwal Liga"
                confirmButtonClass="bg-blue-600 hover:bg-blue-700"
                variant="info"
            />
        </div>
    );
};
