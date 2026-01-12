import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Save } from 'lucide-react';
import { useToast } from '../shared/Toast';

interface RulesEditorProps {
  rules: string;
  onSave: (newRules: string) => void;
}

export const RulesEditor: React.FC<RulesEditorProps> = ({ rules, onSave }) => {
  const [content, setContent] = useState(rules);
  const { addToast } = useToast();

  const handleSave = () => {
    onSave(content);
    addToast('Tournament rules have been updated.', 'success');
  };

  return (
    <Card>
      <h3 className="text-xl font-bold text-brand-text mb-4">Edit Tournament Rules</h3>
      <p className="text-sm text-brand-light mb-4">
        Modify the text below. The changes will be visible on the public rules page immediately after saving.
        You can use line breaks to separate paragraphs and sections.
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-96 p-3 bg-brand-primary border border-brand-accent rounded-md text-brand-text font-mono text-sm focus:ring-2 focus:ring-brand-cyan"
        placeholder="Enter tournament rules here..."
      />
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave}>
          <Save size={16} />
          Save Changes
        </Button>
      </div>
    </Card>
  );
};
