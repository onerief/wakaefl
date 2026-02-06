
import React, { useEffect, useRef, useState } from 'react';
import { 
    Bold, Italic, Underline, 
    AlignLeft, AlignCenter, AlignRight, AlignJustify, 
    List, ListOrdered, 
    Heading1, Heading2, Type
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Initial render value
    useEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML !== value) {
            contentRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (contentRef.current) {
            onChange(contentRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        handleInput(); // Sync changes
        contentRef.current?.focus();
    };

    const ToolbarButton = ({ icon: Icon, command, arg, active = false, title }: any) => (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                execCommand(command, arg);
            }}
            className={`p-2 sm:p-2.5 rounded-lg transition-all shrink-0 ${
                active 
                ? 'bg-brand-vibrant text-white shadow-lg' 
                : 'text-brand-light hover:bg-white/10 hover:text-white'
            }`}
            title={title}
        >
            <Icon size={16} className="sm:w-5 sm:h-5" />
        </button>
    );

    return (
        <div className={`flex flex-col bg-brand-primary border rounded-xl overflow-hidden transition-all ${isFocused ? 'border-brand-vibrant ring-1 ring-brand-vibrant' : 'border-brand-accent'}`}>
            {/* Toolbar - Scrollable on mobile */}
            <div className="flex items-center gap-1 p-1.5 sm:p-2 bg-brand-secondary/50 border-b border-white/5 overflow-x-auto no-scrollbar snap-x">
                <div className="flex gap-0.5 border-r border-white/10 pr-1.5 mr-1.5 snap-start">
                    <ToolbarButton icon={Heading1} command="formatBlock" arg="H1" title="H1" />
                    <ToolbarButton icon={Heading2} command="formatBlock" arg="H2" title="H2" />
                    <ToolbarButton icon={Type} command="formatBlock" arg="P" title="Text" />
                </div>
                
                <div className="flex gap-0.5 border-r border-white/10 pr-1.5 mr-1.5 snap-start">
                    <ToolbarButton icon={Bold} command="bold" title="Bold" />
                    <ToolbarButton icon={Italic} command="italic" title="Italic" />
                    <ToolbarButton icon={Underline} command="underline" title="Underline" />
                </div>

                <div className="flex gap-0.5 border-r border-white/10 pr-1.5 mr-1.5 snap-start">
                    <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Left" />
                    <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Center" />
                    <ToolbarButton icon={AlignRight} command="justifyRight" title="Right" />
                    <ToolbarButton icon={AlignJustify} command="justifyFull" title="Full" />
                </div>

                <div className="flex gap-0.5 snap-start">
                    <ToolbarButton icon={List} command="insertUnorderedList" title="Bullets" />
                    <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numbers" />
                </div>
            </div>

            {/* Editor Area */}
            <div
                ref={contentRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="min-h-[250px] sm:min-h-[350px] p-4 text-white text-xs sm:text-sm outline-none overflow-y-auto prose prose-invert max-w-none custom-list-style"
                style={{ lineHeight: '1.6' }}
            />
            
            <style>{`
                .custom-list-style ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
                .custom-list-style ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
                .custom-list-style h1 { font-size: 1.5em; font-weight: 800; margin: 0.5em 0; color: #fff; }
                .custom-list-style h2 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0; color: #e2e8f0; }
                .custom-list-style p { margin-bottom: 0.5em; }
            `}</style>

            {!value && !isFocused && (
                <div className="absolute top-[105px] sm:top-[115px] left-4 text-brand-light/30 text-[11px] sm:text-sm pointer-events-none italic">
                    {placeholder || 'Mulai menulis berita...'}
                </div>
            )}
        </div>
    );
};
