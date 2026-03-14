"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ResumeBuilderProvider } from "@/hooks/use-resume-builder"
import { ResumeEditorLayout } from "@/components/resume-editor/resume-editor-layout"
import { EditorSidebar } from "@/components/resume-editor/editor-sidebar"
import { PreviewPanel } from "@/components/resume-editor/preview-panel"

function ResumeEditorInner() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const resumeId = searchParams.get("id")

  return (
    <ResumeBuilderProvider userId={user?.uid} initialResumeId={resumeId}>
      <ResumeEditorLayout
        sidebar={<EditorSidebar />}
        preview={<PreviewPanel />}
      />
    </ResumeBuilderProvider>
  )
}

export default function ResumeEditorPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-blue-600" /></div>}>
      <ResumeEditorInner />
    </Suspense>
  )
}
