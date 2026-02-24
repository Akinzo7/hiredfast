"use client"

import { cn } from "@/lib/utils"

interface ResumeEditorLayoutProps {
  sidebar: React.ReactNode
  preview: React.ReactNode
}

export function ResumeEditorLayout({ sidebar, preview }: ResumeEditorLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Editor */}
        <aside className="w-[40%] min-w-[320px] max-w-[500px] border-r bg-background flex flex-col">
          {sidebar}
        </aside>

        {/* Right Panel - Preview */}
        <section className="flex-1 bg-muted/30 flex flex-col overflow-hidden relative">
          {preview}
        </section>
      </main>
    </div>
  )
}
