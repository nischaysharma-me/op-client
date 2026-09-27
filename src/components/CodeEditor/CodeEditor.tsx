import React, { useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Code2, Copy, Check, Trash2 } from "lucide-react";

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  height?: string;
  readOnly?: boolean;
  placeholder?: string;
}

const SUPPORTED_LANGUAGES = [
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "HTML", value: "html" },
  { label: "CSS / SCSS", value: "css" },
  { label: "JSON", value: "json" },
  { label: "Rust", value: "rust" },
  { label: "Go", value: "go" },
  { label: "SQL", value: "sql" },
  { label: "Shell / Bash", value: "shell" },
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "Plain Text", value: "plaintext" },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = "typescript",
  onLanguageChange,
  height = "240px",
  readOnly = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    onChange("");
  };

  const handleEditorMount: OnMount = (editor, _monaco) => {
    // Focus or format setup if needed
  };

  return (
    <div className="monaco-code-editor">
      <div className="monaco-code-editor__toolbar">
        <div className="monaco-code-editor__left">
          <Code2 size={15} className="monaco-code-editor__icon" />
          <span className="monaco-code-editor__title">Code Snippet</span>
          <select
            className="monaco-code-editor__lang-select"
            value={language}
            onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
            disabled={readOnly}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="monaco-code-editor__right">
          {value && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={handleCopy}
              title="Copy snippet"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}

          {!readOnly && value && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={handleClear}
              title="Clear code"
              style={{ color: "var(--color-text-muted)" }}
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="monaco-code-editor__wrapper">
        <Editor
          height={height}
          language={language}
          value={value}
          onChange={(val) => onChange(val || "")}
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            readOnly,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 8, bottom: 8 },
            suggestOnTriggerCharacters: true,
            bracketPairColorization: { enabled: true },
          }}
          loading={
            <div className="monaco-code-editor__loading">
              <span>Loading Code Editor...</span>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default CodeEditor;
