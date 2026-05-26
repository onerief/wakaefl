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
            <div className="space-y-4 text-brand-light">
                <div 
                    className="font-sans leading-relaxed rtf-content"
                    dangerouslySetInnerHTML={{ __html: rules }}
                />
            </div>
        </Card>
    );
};