import React, { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !hasInitialized.current) {
      editorRef.current.innerHTML = value || "";
      hasInitialized.current = true;
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const ToolButton = ({ onClick, icon: Icon, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 hover:bg-brand-accent/50 text-brand-text rounded transition-colors"
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="border border-brand-accent rounded-lg overflow-hidden bg-brand-primary flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-brand-secondary/80 border-b border-brand-accent">
        <ToolButton
          onClick={() => exec("formatBlock", "H1")}
          icon={Heading1}
          title="Heading 1"
        />
        <ToolButton
          onClick={() => exec("formatBlock", "H2")}
          icon={Heading2}
          title="Heading 2"
        />
        <ToolButton
          onClick={() => exec("formatBlock", "H3")}
          icon={Heading3}
          title="Heading 3"
        />
        <div className="w-px h-5 bg-brand-accent mx-1" />
        <ToolButton onClick={() => exec("bold")} icon={Bold} title="Bold" />
        <ToolButton
          onClick={() => exec("italic")}
          icon={Italic}
          title="Italic"
        />
        <ToolButton
          onClick={() => exec("underline")}
          icon={Underline}
          title="Underline"
        />
        <div className="w-px h-5 bg-brand-accent mx-1" />
        <ToolButton
          onClick={() => exec("insertUnorderedList")}
          icon={List}
          title="Bullet List"
        />
        <ToolButton
          onClick={() => exec("insertOrderedList")}
          icon={ListOrdered}
          title="Numbered List"
        />
        <div className="w-px h-5 bg-brand-accent mx-1" />
        <ToolButton
          onClick={() => exec("justifyLeft")}
          icon={AlignLeft}
          title="Align Left"
        />
        <ToolButton
          onClick={() => exec("justifyCenter")}
          icon={AlignCenter}
          title="Align Center"
        />
        <ToolButton
          onClick={() => exec("justifyRight")}
          icon={AlignRight}
          title="Align Right"
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onBlur={handleInput}
        className="p-4 outline-none flex-grow overflow-y-auto custom-scrollbar rtf-content text-brand-light text-sm focus:ring-2 focus:ring-brand-vibrant/20"
        style={{ minHeight: "300px" }}
      />
    </div>
  );
};
