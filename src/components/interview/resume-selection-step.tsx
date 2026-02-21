"use client"

import { useRef } from "react"
import { Search, Upload, CheckCircle2, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ResumeItem {
  id: string
  name: string
  text: string
  source: "saved" | "uploaded"
  createdAt: Date
}

interface ResumeSelectionStepProps {
  resumes: ResumeItem[]
  selectedResumeId: string | null
  onSelect: (id: string) => void
  onUpload: (file: File) => void
  isUploading: boolean
  uploadError: string | null
  searchQuery: string
  onSearchChange: (query: string) => void
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffSec < 60) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return `${diffWeeks}w ago`
}

export function ResumeSelectionStep({
  resumes,
  selectedResumeId,
  onSelect,
  onUpload,
  isUploading,
  uploadError,
  searchQuery,
  onSearchChange,
}: ResumeSelectionStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = resumes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search resumes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-800 border border-slate-700/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-10 w-10 p-0 rounded-lg bg-orange-600 hover:bg-orange-700 text-white shrink-0"
          aria-label="Upload resume"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>

      {uploadError && (
        <p className="text-sm text-red-400 px-1">{uploadError}</p>
      )}

      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <FileText className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No resumes found</p>
            <p className="text-xs mt-1">Upload a PDF or DOCX to get started</p>
          </div>
        ) : (
          filtered.map((resume) => (
            <button
              key={resume.id}
              onClick={() => onSelect(resume.id)}
              className={cn(
                "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left",
                selectedResumeId === resume.id
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  selectedResumeId === resume.id ? "bg-blue-500/20" : "bg-slate-700/50"
                )}>
                  <FileText className={cn(
                    "h-4 w-4",
                    selectedResumeId === resume.id ? "text-blue-400" : "text-slate-400"
                  )} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{resume.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                      resume.source === "saved"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-green-500/20 text-green-400"
                    )}>
                      {resume.source === "saved" ? "Saved" : "Uploaded"}
                    </span>
                    <span className="text-[10px] text-slate-500">{formatTimeAgo(resume.createdAt)}</span>
                  </div>
                </div>
              </div>
              {selectedResumeId === resume.id && (
                <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
