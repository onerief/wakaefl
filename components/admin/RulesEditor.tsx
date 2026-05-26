import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Save } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { RichTextEditor } from '../shared/RichTextEditor';

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
    <Card className="h-[70vh] flex flex-col">
      <h3 className="text-xl font-bold text-brand-text mb-2 shrink-0">Edit Tournament Rules</h3>
      <p className="text-sm text-brand-light mb-4 shrink-0">
        Modify the text below using the formatting tools. The changes will be immediately visible on the public rules page.
      </p>
      
      <div className="flex-grow overflow-hidden relative border border-transparent rounded-lg focus-within:border-brand-vibrant transition-colors duration-200">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Enter tournament rules here..."
        />
      </div>

      <div className="mt-4 shrink-0 flex justify-end">
        <Button onClick={handleSave} className="bg-brand-vibrant shadow-lg hover:shadow-brand-vibrant/50 flex items-center gap-2">
          <Save size={16} />
          Save Changes
        </Button>
      </div>
    </Card>
  );
};
