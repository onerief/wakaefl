
import React, { useRef, useState, useEffect } from 'react';
import type { Group, Team, SeasonHistory, Match } from '../../types';
import { StandingsTable } from './StandingsTable';
import { Download, ChevronDown, Maximize2, Minimize2, Users, Star } from 'lucide-react';
import { useToast } from '../shared/Toast';

declare const html2canvas: any;

interface GroupStageProps {
  groups: Group[];
  matches?: Match[];
  onSelectTeam: (team: Team) => void;
  userOwnedTeamIds?: string[];
  history?: SeasonHistory[];
}

export const GroupStage: React.FC<GroupStageProps> = ({ groups, matches, onSelectTeam, userOwnedTeamIds = [], history = [] }) => {
  const { addToast } = useToast();
  const groupRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
      const initialStates: Record<string, boolean> = {};
      groups.forEach(group => {
          const hasMyTeam = group.teams.some(team => userOwnedTeamIds.includes(team.id));
          initialStates[group.id] = hasMyTeam;
      });
      if (userOwnedTeamIds.length === 0) {
          groups.forEach(g => { initialStates[g.id] = true; });
      }
      setExpandedGroups(initialStates);
  }, [groups, userOwnedTeamIds]);

  const toggleGroup = (groupId: string) => {
      setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleAll = (expand: boolean) => {
      const newStates: Record<string, boolean> = {};
      groups.forEach(g => { newStates[g.id] = expand; });
      setExpandedGroups(newStates);
  };

  const handleExport = async (e: React.MouseEvent, groupId: string, groupName: string) => {
      e.stopPropagation();
      const element = groupRefs.current[groupId];
      if (!element) return;

      try {
          addToast('Mempersiapkan gambar...', 'info');
          // Get current theme background color from CSS variable
          const computedStyle = getComputedStyle(document.documentElement);
          const bgColor = computedStyle.getPropertyValue('--brand-primary').trim();
          
          const canvas = await import('html2canvas').then(mod => mod.default(element, {
              backgroundColor: bgColor || '#020617', // Fallback to dark if var not found
              scale: 2,
              logging: false,
              useCORS: true
          }));
          const link = document.createElement('a');
          link.download = `Standings-${groupName}-${new Date().toLocaleDateString()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          addToast('Gambar berhasil diunduh!', 'success');
      } catch (error) {
          console.error(error);
          addToast('Gagal mengekspor gambar.', 'error');
      }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 px-1 mb-2">
          <button onClick={() => toggleAll(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secondary/40 hover:bg-brand-secondary/60 rounded-lg text-[9px] font-black uppercase text-brand-light transition-all"><Maximize2 size={12} /> Buka Semua</button>
          <button onClick={() => toggleAll(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secondary/40 hover:bg-brand-secondary/60 rounded-lg text-[9px] font-black uppercase text-brand-light transition-all"><Minimize2 size={12} /> Tutup Semua</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {groups.map((group) => {
          const isExpanded = expandedGroups[group.id];
          const hasMyTeam = group.teams.some(team => userOwnedTeamIds.includes(team.id));

          return (
            <div key={group.id} className={`relative group transition-all duration-500 rounded-[1.5rem] overflow-hidden border ${hasMyTeam ? 'border-brand-vibrant/50 shadow-[0_0_25px_var(--brand-vibrant)] bg-brand-vibrant/[0.05]' : 'border-brand-accent bg-brand-secondary/80'} ${isExpanded ? 'ring-1 ring-brand-accent/50' : ''}`}>
              <div onClick={() => toggleGroup(group.id)} className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors cursor-pointer ${isExpanded ? 'bg-brand-primary/20' : 'hover:bg-brand-primary/10'}`}>
                  <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${hasMyTeam ? 'bg-brand-vibrant text-white shadow-[0_0_15px_var(--brand-vibrant)]' : 'bg-brand-primary/30 text-brand-light'}`}><Users size={20} /></div>
                      <div>
                          <div className="flex items-center gap-2">
                              <h3 className="text-lg sm:text-2xl font-black italic text-brand-text uppercase tracking-tight leading-none">{group.name}</h3>
                              {hasMyTeam && <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-vibrant text-white text-[8px] font-black rounded-full uppercase shadow-sm animate-pulse"><Star size={8} className="fill-white" /> Grup Anda</span>}
                          </div>
                          <p className="text-[10px] text-brand-light font-bold uppercase tracking-widest mt-1 opacity-60">{group.teams.length} Peserta Terdaftar</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <button onClick={(e) => handleExport(e, group.id, group.name)} className="hidden sm:flex text-brand-light hover:text-brand-text p-2 rounded-xl bg-brand-primary/30 hover:bg-brand-vibrant/20 transition-all shadow-lg active:scale-90"><Download size={18} /></button>
                      <div className={`transition-transform duration-500 ${isExpanded ? 'rotate-180 text-brand-vibrant' : 'text-brand-light'}`}><ChevronDown size={24} /></div>
                  </div>
              </div>
              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div ref={el => { groupRefs.current[group.id] = el; }} className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="h-px bg-brand-accent/30 mb-6"></div>
                    <StandingsTable standings={group.standings} matches={matches} groupName={group.name} onSelectTeam={onSelectTeam} history={history} />
                    <div className="sm:hidden mt-4 flex justify-center"><button onClick={(e) => handleExport(e, group.id, group.name)} className="flex items-center gap-2 px-4 py-2 bg-brand-secondary/40 rounded-xl text-[10px] font-black uppercase text-brand-light"><Download size={14} /> Simpan Klasemen</button></div>
                </div>
              </div>
              {hasMyTeam && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-vibrant shadow-[0_0_15px_var(--brand-vibrant)]"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
