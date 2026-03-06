"use client"

import { cn } from "@/lib/utils"

interface ResumeEditorLayoutProps {
  sidebar: React.ReactNode
  preview: React.ReactNode
}

export function ResumeEditorLayout({ sidebar, preview }: ResumeEditorLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar - Editor */}
        <aside className="w-full md:w-[45%] md:min-w-[340px] md:max-w-[520px] border-r bg-background flex flex-col">
          {sidebar}
        </aside>

        {/* Right Panel - Preview */}
        <section className="flex-1 bg-muted/30 flex flex-col overflow-hidden overflow-x-hidden relative min-h-[400px] md:min-h-0">
          {preview}
        </section>
      </main>
    </div>
  )
}
