
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
    }, [value]); // Only re-run if value changes externally (e.g. loading edit data)

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
            className={`p-2 rounded-lg transition-all ${
                active 
                ? 'bg-brand-vibrant text-white shadow-lg' 
                : 'text-brand-light hover:bg-white/10 hover:text-white'
            }`}
            title={title}
        >
            <Icon size={16} />
        </button>
    );

    return (
        <div className={`flex flex-col bg-brand-primary border rounded-xl overflow-hidden transition-all ${isFocused ? 'border-brand-vibrant ring-1 ring-brand-vibrant' : 'border-brand-accent'}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-brand-secondary/50 border-b border-white/5">
                <div className="flex gap-0.5 border-r border-white/10 pr-2 mr-2">
                    <ToolbarButton icon={Heading1} command="formatBlock" arg="H1" title="Heading Besar" />
                    <ToolbarButton icon={Heading2} command="formatBlock" arg="H2" title="Heading Sedang" />
                    <ToolbarButton icon={Type} command="formatBlock" arg="P" title="Paragraf Normal" />
                </div>
                
                {/* Font Controls */}
                <div className="flex gap-1 border-r border-white/10 pr-2 mr-2 items-center">
                    <select
                        onChange={(e) => execCommand('fontName', e.target.value)}
                        className="h-7 bg-black/30 border border-white/10 rounded-md text-[10px] text-white outline-none px-1 focus:border-brand-vibrant cursor-pointer"
                        title="Ganti Font"
                        defaultValue="Inter"
                    >
                        <option value="Inter">Default</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Serif</option>
                        <option value="Courier New">Mono</option>
                        <option value="Impact">Impact</option>
                        <option value="Verdana">Verdana</option>
                    </select>

                    <select
                        onChange={(e) => execCommand('fontSize', e.target.value)}
                        className="h-7 w-16 bg-black/30 border border-white/10 rounded-md text-[10px] text-white outline-none px-1 focus:border-brand-vibrant cursor-pointer"
                        title="Ukuran Font"
                        defaultValue="3"
                    >
                        <option value="1">Kecil (10px)</option>
                        <option value="2">Sedang (13px)</option>
                        <option value="3">Normal (16px)</option>
                        <option value="4">Sub (18px)</option>
                        <option value="5">Besar (24px)</option>
                        <option value="6">Judul (32px)</option>
                        <option value="7">Jumbo (48px)</option>
                    </select>
                </div>
                
                <div className="flex gap-0.5 border-r border-white/10 pr-2 mr-2">
                    <ToolbarButton icon={Bold} command="bold" title="Tebal" />
                    <ToolbarButton icon={Italic} command="italic" title="Miring" />
                    <ToolbarButton icon={Underline} command="underline" title="Garis Bawah" />
                </div>

                <div className="flex gap-0.5 border-r border-white/10 pr-2 mr-2">
                    <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Rata Kiri" />
                    <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Rata Tengah" />
                    <ToolbarButton icon={AlignRight} command="justifyRight" title="Rata Kanan" />
                    <ToolbarButton icon={AlignJustify} command="justifyFull" title="Justify" />
                </div>

                <div className="flex gap-0.5">
                    <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
                    <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numbering" />
                </div>
            </div>

            {/* Editor Area */}
            <div
                ref={contentRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="min-h-[250px] p-4 text-white text-sm outline-none overflow-y-auto prose prose-invert max-w-none custom-list-style"
                style={{
                    lineHeight: '1.6',
                    fontFamily: 'Inter, sans-serif'
                }}
            />
            
            {/* CSS Injection for List Styles inside Editor */}
            <style>{`
                .custom-list-style ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
                .custom-list-style ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
                .custom-list-style h1 { font-size: 1.5em; font-weight: 800; margin: 0.5em 0; color: #fff; }
                .custom-list-style h2 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0; color: #e2e8f0; }
                .custom-list-style p { margin-bottom: 0.5em; }
                .custom-list-style b, .custom-list-style strong { color: #f8fafc; font-weight: 800; }
                .custom-list-style blockquote { border-left: 4px solid #2563eb; padding-left: 1em; font-style: italic; color: #94a3b8; }
                /* Font fixes for dark mode editor */
                .custom-list-style font[size="1"] { font-size: 10px; }
                .custom-list-style font[size="2"] { font-size: 13px; }
                .custom-list-style font[size="3"] { font-size: 16px; }
                .custom-list-style font[size="4"] { font-size: 18px; }
                .custom-list-style font[size="5"] { font-size: 24px; }
                .custom-list-style font[size="6"] { font-size: 32px; }
                .custom-list-style font[size="7"] { font-size: 48px; }
            `}</style>

            {!value && !isFocused && (
                <div className="absolute top-[110px] left-4 text-brand-light/30 text-sm pointer-events-none">
                    {placeholder || 'Mulai menulis berita...'}
                </div>
            )}
        </div>
    );
};
