import { ResumeBuilderProvider } from "@/hooks/use-resume-builder"
import { ResumeEditorLayout } from "@/components/resume-editor/resume-editor-layout"
import { EditorSidebar } from "@/components/resume-editor/editor-sidebar"
import { PreviewPanel } from "@/components/resume-editor/preview-panel"

export default function ResumeEditorPage() {
  return (
    <ResumeBuilderProvider>
      <ResumeEditorLayout
        sidebar={<EditorSidebar />}
        preview={<PreviewPanel />}
      />
    </ResumeBuilderProvider>
  )
}
