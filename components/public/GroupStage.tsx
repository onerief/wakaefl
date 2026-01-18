
import React, { useRef } from 'react';
import type { Group, Team } from '../../types';
import { StandingsTable } from './StandingsTable';
import { Download } from 'lucide-react';
import { useToast } from '../shared/Toast';

declare const html2canvas: any;

interface GroupStageProps {
  groups: Group[];
  onSelectTeam: (team: Team) => void;
}

export const GroupStage: React.FC<GroupStageProps> = ({ groups, onSelectTeam }) => {
  const { addToast } = useToast();
  const groupRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  const handleExport = async (groupId: string, groupName: string) => {
      const element = groupRefs.current[groupId];
      if (!element) return;

      try {
          addToast('Mempersiapkan gambar...', 'info');
          const canvas = await import('html2canvas').then(mod => mod.default(element, {
              backgroundColor: '#020617', // brand-primary
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
          console.error("Export failed", error);
          addToast('Gagal mengekspor gambar.', 'error');
      }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 px-0.5 sm:px-0">
      {groups.map((group) => (
        <div 
            key={group.id} 
            ref={el => groupRefs.current[group.id] = el}
            className="bg-brand-secondary/40 p-3.5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl relative border border-white/5 flex flex-col transition-all hover:bg-brand-secondary/50"
        >
          <div className="flex justify-between items-center mb-4 px-1">
              <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-brand-vibrant rounded-full hidden sm:block"></div>
                  <h3 className="text-lg sm:text-2xl font-black italic text-brand-vibrant uppercase tracking-tight leading-none">{group.name}</h3>
              </div>
              <button 
                onClick={() => handleExport(group.id, group.name)}
                className="text-brand-light hover:text-white p-2 rounded-xl bg-white/5 hover:bg-brand-vibrant/20 transition-all shadow-lg active:scale-90"
                title="Download Standings Image"
              >
                  <Download size={18} />
              </button>
          </div>
          <div className="flex-grow">
            <StandingsTable standings={group.standings} onSelectTeam={onSelectTeam} />
          </div>
        </div>
      ))}
    </div>
  );
};
