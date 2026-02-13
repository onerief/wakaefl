
import React, { useState, useMemo } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Search, Database, UserCircle, CheckCircle, Circle, CheckSquare, Square } from 'lucide-react';
import type { Team } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';

interface ImportTeamModalProps {
  teams: Team[];
  onImport: (teams: Team[]) => void;
  onClose: () => void;
}

export const ImportTeamModal: React.FC<ImportTeamModalProps> = ({ teams, onImport, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const filteredTeams = useMemo(() => {
      return teams.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) || 
        (t.manager && t.manager.toLowerCase().includes(search.toLowerCase()))
      );
  }, [teams, search]);

  const toggleSelection = (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
          newSelected.delete(id);
      } else {
          newSelected.add(id);
      }
      setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
      if (selectedIds.size === filteredTeams.length && filteredTeams.length > 0) {
          setSelectedIds(new Set()); // Deselect all
      } else {
          const allIds = new Set(filteredTeams.map(t => t.id));
          setSelectedIds(allIds);
      }
  };

  const handleImport = () => {
      const teamsToImport = teams.filter(t => selectedIds.has(t.id));
      onImport(teamsToImport);
  };

  const isAllSelected = filteredTeams.length > 0 && selectedIds.size === filteredTeams.length;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md sm:max-w-2xl relative !p-0 overflow-hidden shadow-2xl !bg-brand-primary border-brand-vibrant/20 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-brand-secondary/80 p-5 border-b border-white/5 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-vibrant/10 rounded-xl text-brand-vibrant">
                    <Database size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-white italic uppercase tracking-tighter">Import Database</h2>
                    <p className="text-[10px] text-brand-light">Pilih satu atau banyak tim sekaligus</p>
                </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-brand-light hover:text-white flex items-center justify-center transition-all">
                <X size={18} />
            </button>
        </div>

        {/* Search & Select All */}
        <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light/40" size={16} />
                <input 
                    type="text" 
                    placeholder="Cari nama tim atau manager..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-brand-primary border border-brand-accent rounded-xl text-white text-sm font-bold outline-none focus:border-brand-vibrant transition-all"
                />
            </div>
            <div className="flex justify-between items-center px-1">
                <button 
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-[10px] font-bold text-brand-light uppercase tracking-wider hover:text-white transition-colors"
                >
                    {isAllSelected ? <CheckSquare size={14} className="text-brand-vibrant" /> : <Square size={14} />}
                    Pilih Semua ({filteredTeams.length})
                </button>
                <span className="text-[10px] text-brand-light/50 font-mono">
                    {selectedIds.size} dipilih
                </span>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {filteredTeams.length > 0 ? (
                filteredTeams.map((team) => {
                    const isSelected = selectedIds.has(team.id);
                    return (
                        <button 
                            key={team.id}
                            onClick={() => toggleSelection(team.id)}
                            className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all group text-left ${
                                isSelected 
                                ? 'bg-brand-vibrant/10 border-brand-vibrant/50 shadow-[inset_0_0_10px_rgba(37,99,235,0.2)]' 
                                : 'bg-white/5 border-transparent hover:border-brand-vibrant/30 hover:bg-brand-vibrant/5'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`transition-colors ${isSelected ? 'text-brand-vibrant' : 'text-brand-light/20 group-hover:text-brand-light/50'}`}>
                                    {isSelected ? <CheckCircle size={20} className="fill-brand-vibrant/20" /> : <Circle size={20} />}
                                </div>
                                <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className={`w-10 h-10 ${isSelected ? 'ring-2 ring-brand-vibrant' : ''}`} />
                                <div className="min-w-0">
                                    <h4 className={`text-xs font-black uppercase italic tracking-tight truncate ${isSelected ? 'text-brand-vibrant' : 'text-white'}`}>{team.name}</h4>
                                    <div className="flex items-center gap-1.5 text-[10px] text-brand-light mt-0.5">
                                        <UserCircle size={10} />
                                        <span className="truncate">{team.manager || 'No Manager'}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })
            ) : (
                <div className="text-center py-12 opacity-30">
                    <Database size={40} className="mx-auto mb-2 text-brand-light" />
                    <p className="text-xs font-bold text-brand-light uppercase tracking-widest">Tidak ada data ditemukan</p>
                </div>
            )}
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-brand-secondary/30 border-t border-white/5 flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
            <Button 
                onClick={handleImport} 
                disabled={selectedIds.size === 0} 
                className="flex-[2] shadow-lg shadow-brand-vibrant/20 disabled:opacity-50 disabled:shadow-none"
            >
                Import {selectedIds.size} Tim
            </Button>
        </div>
      </Card>
    </div>
  );
};
