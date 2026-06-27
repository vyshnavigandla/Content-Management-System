// components/RichTextEditor.jsx
// FIX: <style jsx> replaced with plain <style> (no babel plugin in Vite)
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

const ToolbarButton = ({ onClick, active, children, title, disabled }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded hover:bg-gray-200 transition-colors ${active ? 'bg-gray-200 text-blue-600' : 'text-gray-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    title={title}
    disabled={disabled}
    type="button"
  >
    {children}
  </button>
);

export default function RichTextEditor({ value, onChange, placeholder = 'Write something...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image,
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank' } }),
    ],
    content: value || '',
    editorProps: { attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4' } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return <div className="border border-gray-200 rounded-xl p-4 text-gray-400">Loading editor...</div>;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike">
          <s>S</s>
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">
          <span className="text-sm font-bold">H1</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">
          <span className="text-sm font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">
          <span className="text-sm font-bold">H3</span>
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <span className="text-sm">• List</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <span className="text-sm">1. List</span>
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => { const url = prompt('Enter URL:'); if (url) editor.chain().focus().setLink({ href: url }).run(); }} active={editor.isActive('link')} title="Link">
          <span className="text-sm">Link</span>
        </ToolbarButton>
        <div className="flex-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}>
          <span className="text-sm">↩</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}>
          <span className="text-sm">↪</span>
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className="prose prose-sm max-w-none" />

      {/* FIX: plain <style> instead of <style jsx> */}
      <style>{`
        .ProseMirror { padding: 1rem; min-height: 300px; outline: none; }
        .ProseMirror p { margin: 0.5em 0; }
        .ProseMirror h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
        .ProseMirror h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin: 0.5em 0; }
        .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .ProseMirror img { max-width: 100%; height: auto; margin: 1em 0; border-radius: 0.5rem; }
        .ProseMirror blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; margin: 1em 0; color: #6b7280; }
        .ProseMirror code { background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 0.25rem; font-size: 0.875em; }
      `}</style>
    </div>
  );
}