import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from "lucide-react";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  placeholder = "Write your symptoms, context, or question here...",
  minHeight = "140px",
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      onChange(html, text);
    },
  });

  // Sync external content reset if empty
  useEffect(() => {
    if (editor && content === "" && editor.getHTML() !== "<p></p>") {
      editor.commands.setContent("");
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor">
      <div className="tiptap-editor__toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`tiptap-editor__btn ${
            editor.isActive("bold") ? "tiptap-editor__btn--active" : ""
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`tiptap-editor__btn ${
            editor.isActive("italic") ? "tiptap-editor__btn--active" : ""
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`tiptap-editor__btn ${
            editor.isActive("strike") ? "tiptap-editor__btn--active" : ""
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </button>

        <span className="tiptap-editor__divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`tiptap-editor__btn ${
            editor.isActive("heading", { level: 2 })
              ? "tiptap-editor__btn--active"
              : ""
          }`}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`tiptap-editor__btn ${
            editor.isActive("heading", { level: 3 })
              ? "tiptap-editor__btn--active"
              : ""
          }`}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </button>

        <span className="tiptap-editor__divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`tiptap-editor__btn ${
            editor.isActive("bulletList") ? "tiptap-editor__btn--active" : ""
          }`}
          title="Bullet List"
        >
          <List size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`tiptap-editor__btn ${
            editor.isActive("orderedList") ? "tiptap-editor__btn--active" : ""
          }`}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`tiptap-editor__btn ${
            editor.isActive("blockquote") ? "tiptap-editor__btn--active" : ""
          }`}
          title="Quote"
        >
          <Quote size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`tiptap-editor__btn ${
            editor.isActive("code") ? "tiptap-editor__btn--active" : ""
          }`}
          title="Inline Code"
        >
          <Code size={14} />
        </button>

        <span className="tiptap-editor__divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="tiptap-editor__btn"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="tiptap-editor__btn"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={14} />
        </button>
      </div>

      <div
        className="tiptap-editor__content"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
