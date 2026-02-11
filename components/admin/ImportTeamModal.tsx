
import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, Search, Database, UserCircle, Plus } from 'lucide-react';
import type { Team } from '../../types';
import { TeamLogo } from '../shared/TeamLogo';

interface ImportTeamModalProps {
  teams: Team[];
  onSelect: (team: Team) => void;
  onClose: () => void;
}

export const ImportTeamModal: React.FC<ImportTeamModalProps> = ({ teams, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  
  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.manager && t.manager.toLowerCase().includes(search.toLowerCase()))
  );

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
                    <p className="text-[10px] text-brand-light">Ambil data tim dari mode turnamen lain</p>
                </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-brand-light hover:text-white flex items-center justify-center transition-all">
                <X size={18} />
            </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5 bg-black/20">
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
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {filteredTeams.length > 0 ? (
                filteredTeams.map((team) => (
                    <button 
                        key={team.id}
                        onClick={() => onSelect(team)}
                        className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-brand-vibrant/10 border border-transparent hover:border-brand-vibrant/30 rounded-xl transition-all group text-left"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <TeamLogo logoUrl={team.logoUrl} teamName={team.name} className="w-10 h-10" />
                            <div className="min-w-0">
                                <h4 className="text-xs font-black text-white uppercase italic tracking-tight truncate">{team.name}</h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-brand-light mt-0.5">
                                    <UserCircle size={10} />
                                    <span className="truncate">{team.manager || 'No Manager'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-brand-vibrant/10 p-1.5 rounded-lg text-brand-vibrant opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={16} />
                        </div>
                    </button>
                ))
            ) : (
                <div className="text-center py-12 opacity-30">
                    <Database size={40} className="mx-auto mb-2 text-brand-light" />
                    <p className="text-xs font-bold text-brand-light uppercase tracking-widest">Tidak ada data ditemukan</p>
                </div>
            )}
        </div>

        <div className="p-3 bg-brand-secondary/30 border-t border-white/5 text-center">
            <p className="text-[9px] text-brand-light/40 italic">
                *Data tim (Logo, Nama, Manager, WA) akan disalin ke mode ini.
            </p>
        </div>
      </Card>
    </div>
  );
};
