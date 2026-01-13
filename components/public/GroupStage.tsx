
import React, { useRef } from 'react';
import type { Group, Team } from '../../types';
import { StandingsTable } from './StandingsTable';
import { Download } from 'lucide-react';
import { useToast } from '../shared/Toast';

// Dynamically import html2canvas from window since it's added via script tag/importmap
// or declare it to satisfy TS if using the importmap approach from index.html
declare const html2canvas: any;

interface GroupStageProps {
  groups: Group[];
  onSelectTeam: (team: Team) => void;
}

export const GroupStage: React.FC<GroupStageProps> = ({ groups, onSelectTeam }) => {
  const { addToast } = useToast();
  
  // Create refs for each group container to capture
  const groupRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  const handleExport = async (groupId: string, groupName: string) => {
      const element = groupRefs.current[groupId];
      if (!element) return;

      try {
          addToast('Generating image...', 'info');
          // Assuming html2canvas is available globally via the script tag in index.html
          // Use window.html2canvas or dynamic import if using the shim
          const canvas = await import('html2canvas').then(mod => mod.default(element, {
              backgroundColor: '#0f172a', // brand-secondary
              scale: 2, // Retinas display quality
              logging: false,
              useCORS: true
          }));
          
          const link = document.createElement('a');
          link.download = `Standings-${groupName}-${new Date().toISOString().split('T')[0]}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          addToast('Image downloaded!', 'success');
      } catch (error) {
          console.error("Export failed", error);
          addToast('Failed to export image.', 'error');
      }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
      {groups.map((group) => (
        <div 
            key={group.id} 
            ref={el => groupRefs.current[group.id] = el}
            className="bg-brand-secondary p-3 sm:p-4 rounded-xl shadow-xl relative group-card border border-white/5"
        >
          <div className="flex justify-between items-center mb-3 sm:mb-4 px-1">
              <h3 className="text-lg sm:text-xl font-bold text-brand-vibrant">{group.name}</h3>
              <button 
                onClick={() => handleExport(group.id, group.name)}
                className="text-brand-light hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-white/5 transition-colors"
                title="Download as Image"
              >
                  <Download size={16} className="sm:w-5 sm:h-5" />
              </button>
          </div>
          <StandingsTable standings={group.standings} onSelectTeam={onSelectTeam} />
        </div>
      ))}
    </div>
  );
};
