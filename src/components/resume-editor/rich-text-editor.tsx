"use client"

import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
  Underline as UnderlineIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

type ToolbarButtonProps = {
  active?: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  ariaLabel: string
}

function ToolbarButton({ active = false, onClick, disabled = false, children, ariaLabel }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "h-7 w-7 rounded-md border border-transparent text-muted-foreground transition-colors",
        "inline-flex items-center justify-center text-xs",
        "hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed",
        active && "bg-accent text-foreground border-border"
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ value, onChange, placeholder = "Write here..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "resume-tiptap-editor min-h-[150px] p-3 focus:outline-none bg-muted/40 rounded-b-lg text-sm leading-relaxed",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    if (value !== currentHtml) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Loading editor...
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-border border-b-0 bg-muted/30 p-2">
        <ToolbarButton
          ariaLabel="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Heading 4"
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          H4
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Heading 5"
          active={editor.isActive("heading", { level: 5 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        >
          H5
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          ariaLabel="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          ariaLabel="Bullet List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Ordered List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          ariaLabel="Align Left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Align Center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Align Right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          ariaLabel="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div className="rounded-b-lg border border-border bg-muted/40">
        <EditorContent editor={editor} />
        <div className="border-t border-border px-3 py-1 text-right text-xs text-muted-foreground">
          Word count: {editor.storage.characterCount.words()}
        </div>
      </div>
    </div>
  )
}

