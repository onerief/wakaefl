
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Team, Group, Match, KnockoutStageRounds, TournamentState, TournamentMode } from '../../types';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { TeamForm } from './TeamForm';
import { Plus, Edit, Trash2, RefreshCw, Download, Star, Upload, Users, ShieldAlert, Check, Search, Bell, Settings as SettingsIcon, LayoutGrid, ShieldCheck, UserMinus, FileJson, CloudUpload, X, Instagram, MessageCircle, Trophy, ExternalLink, AlertTriangle, UserCheck } from 'lucide-react';
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
  const [isRefreshingRegs, setIsRefreshingRegs] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyFileInputRef = useRef<HTMLInputElement>(null);
  
  const pendingClaims = useMemo(() => {
      return teams.filter(t => t.requestedOwnerEmail && !t.ownerEmail);
  }, [teams]);

  useEffect(() => {
      setRegError(null);
      const unsubscribe = subscribeToRegistrations((regs) => {
          setNewRegistrations(regs);
          setIsRefreshingRegs(false);
      }, (err) => {
          setRegError("Gagal memuat data pendaftaran.");
          setIsRefreshingRegs(false);
      });
      return () => unsubscribe();
  }, []);

  const sortedRegistrations = useMemo(() => {
      return [...newRegistrations].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [newRegistrations]);

  const totalRequestCount = sortedRegistrations.length + pendingClaims.length;

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex bg-brand-primary/50 p-1 rounded-xl border border-white/5 mb-2 sm:mb-4 overflow-hidden">
          <button 
              onClick={() => setActiveSubTab('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 text-[9px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeSubTab === 'list' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
          >
              <Users size={14} className="sm:w-4 sm:h-4" /> Daftar
          </button>
          <button 
              onClick={() => setActiveSubTab('requests')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 text-[9px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all relative ${activeSubTab === 'requests' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
          >
              <Bell size={14} className="sm:w-4 sm:h-4" /> Request
              {totalRequestCount > 0 && (
                  <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[8px] sm:text-[9px] flex items-center justify-center rounded-full animate-bounce font-black border-2 border-brand-primary">
                      {totalRequestCount}
                  </span>
              )}
          </button>
          <button 
              onClick={() => setActiveSubTab('setup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 text-[9px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeSubTab === 'setup' ? 'bg-brand-vibrant text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
          >
              <LayoutGrid size={14} className="sm:w-4 sm:h-4" /> Setup
          </button>
      </div>

      {activeSubTab === 'list' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="!p-3 sm:!p-6">
                <div className="flex flex-col gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-xl font-black italic uppercase text-brand-text">Teams <span className="text-brand-vibrant">({teams.length})</span></h3>
                        <Button onClick={handleAddClick} className="!py-1.5 !px-3 !text-[9px] sm:!text-[10px] font-black uppercase tracking-widest"><Plus size={12} className="sm:w-3.5 sm:h-3.5" /> Tambah</Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" size={14} />
                        <input
                            type="text"
                            placeholder="Cari tim atau manager..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-brand-primary border border-brand-accent rounded-xl text-[11px] sm:text-sm font-bold outline-none focus:border-brand-vibrant transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar pr-0.5">
                    {filteredTeams.length > 0 ? filteredTeams.map(team => {
                    const currentGroup = groups.find(g => g.teams.some(t => t.id === team.id));
                    return (
                        <div key={team.id} className="flex flex-row items-center justify-between gap-2 sm:gap-3 bg-brand-primary/40 p-2 sm:p-3 rounded-xl border border-white/5 hover:border-brand-vibrant/30 transition-all group">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-8 h-8 sm:w-11 sm:h-11" />
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-1">
                                        <span className="font-black text-white truncate text-[10px] sm:text-sm uppercase tracking-tight">{team.name}</span>
                                        {team.isTopSeed && <Star size={8} className="fill-yellow-400 text-yellow-400 shrink-0" />}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <p className="text-[8px] sm:text-[9px] text-brand-light truncate uppercase tracking-widest font-bold opacity-60">Mgr: {team.manager || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleEditClick(team)} className="p-1.5 sm:p-2 text-brand-light hover:text-white bg-white/5 rounded-lg transition-colors"><Edit size={14} /></button>
                                <button onClick={() => handleDeleteClick(team)} className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg disabled:opacity-5 transition-colors" disabled={!!currentGroup}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    )
                    }) : <div className="text-center py-10 text-brand-light/30 text-[10px] italic">Tidak ada tim.</div>}
                </div>
              </Card>
          </div>
      )}

      {activeSubTab === 'requests' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              <Card className="!p-4 border-brand-vibrant/20">
                <div className="mb-4">
                    <h3 className="text-sm sm:text-xl font-black italic uppercase text-brand-text flex items-center gap-2">
                        <Plus size={18} className="text-brand-vibrant" /> Pendaftaran ({newRegistrations.length})
                    </h3>
                </div>

                <div className="space-y-3">
                    {sortedRegistrations.length > 0 ? sortedRegistrations.map((reg) => (
                        <div key={reg.id} className="bg-brand-primary/40 border border-white/5 rounded-xl p-3 flex flex-col gap-3 group hover:border-brand-vibrant/30 transition-all shadow-lg">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <TeamLogo logoUrl={reg.logoUrl} teamName={reg.name} className="w-10 h-10 sm:w-16 sm:h-16" />
                                    <div className="min-w-0">
                                        <h4 className="text-xs sm:text-lg font-black text-white uppercase italic truncate">{reg.name}</h4>
                                        <div className="flex gap-1 mt-0.5">
                                            <span className="px-1.5 py-0.5 bg-brand-vibrant/10 text-brand-vibrant text-[7px] font-black uppercase rounded">
                                                {reg.preferredMode}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <button onClick={() => handleApproveRegistration(reg)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[8px] font-black uppercase">Approve</button>
                                    <button onClick={() => deleteRegistration(reg.id)} className="px-3 py-1.5 bg-red-600/10 text-red-500 rounded-lg text-[8px] font-black uppercase">Tolak</button>
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-center py-6 text-[9px] text-brand-light/30 uppercase font-black italic">Tidak ada pendaftaran</p>}
                </div>
              </Card>
          </div>
      )}

      {activeSubTab === 'setup' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="!p-4 border-brand-accent/30">
                  <h3 className="text-[10px] sm:text-sm font-black italic text-brand-text uppercase tracking-widest mb-3 flex items-center gap-2">
                      <LayoutGrid size={14} className="text-brand-vibrant" /> Manual Group Setup
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
          </div>
      )}

      {showForm && <TeamForm team={editingTeam} onSave={handleFormSave} onClose={() => setShowForm(false)} isSaving={isSavingTeam} />}
      {showResetConfirm && <ResetConfirmationModal onConfirm={() => { resetTournament(); setShowResetConfirm(false); }} onCancel={() => setShowResetConfirm(false)} />}
      <ConfirmationModal isOpen={!!teamToDelete} onClose={() => setTeamToDelete(null)} onConfirm={() => { if(teamToDelete) deleteTeam(teamToDelete.id); setTeamToDelete(null); }} title="Hapus Tim" message={<p>Hapus tim <strong>{teamToDelete?.name}</strong>?</p>} />
    </div>
  );
};
