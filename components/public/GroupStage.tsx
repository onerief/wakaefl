
import React from 'react';
import type { Group, Team } from '../../types';
import { StandingsTable } from './StandingsTable';

interface GroupStageProps {
  groups: Group[];
  onSelectTeam: (team: Team) => void;
}

export const GroupStage: React.FC<GroupStageProps> = ({ groups, onSelectTeam }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {groups.map((group) => (
        <div key={group.id} className="bg-brand-secondary p-4 rounded-lg shadow-xl">
          <h3 className="text-xl font-bold text-brand-vibrant mb-4">{group.name}</h3>
          <StandingsTable standings={group.standings} onSelectTeam={onSelectTeam} />
        </div>
      ))}
    </div>
  );
};