import React from 'react';
import { Card } from '../shared/Card';
import { BookOpen } from 'lucide-react';

interface RulesViewProps {
    rules: string;
}

export const RulesView: React.FC<RulesViewProps> = ({ rules }) => {
    return (
        <Card>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 border-l-4 border-brand-vibrant pl-4 text-brand-text flex items-center gap-3">
                <BookOpen size={28} />
                Tournament Rules
            </h2>
            <div className="space-y-4 text-brand-light prose prose-p:my-2 prose-li:my-1 prose-strong:text-brand-text prose-headings:text-brand-vibrant">
                <div className="whitespace-pre-wrap font-sans">{rules}</div>
            </div>
        </Card>
    );
};