"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Upload,
  FileText,
  ArrowRight,
  ChevronDown,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { extractTextFromFile } from "@/lib/file-parser"
import { cn } from "@/lib/utils"

type AnalysisView = "selection" | "loading" | "results"

interface ResumeItem {
  id: string
  name: string
  subtitle?: string
  text: string
  source: "saved" | "uploaded"
  badge: "Saved" | "Uploaded"
  createdAt: Date
}

interface CategoryScore {
  name: string
  score: number
  maxScore: number
  feedback: string[]
}

interface AnalysisResult {
  totalScore: number
  categories: CategoryScore[]
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)

  if (diffSec < 60) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return `${diffWeek}w ago`
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444"

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width="120" height="120" className="-rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="#f1f5f9"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex items-center justify-center">
        <span className="text-3xl font-bold text-slate-800">{score}</span>
      </div>
    </div>
  )
}

export function ResumeAnalysisModal({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<AnalysisView>("selection")
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  )
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load resumes when modal opens
  useEffect(() => {
    if (!open) return

    setView("selection")
    setSelectedResumeId(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setSearchQuery("")
    setUploadError(null)
    setExpandedCategories(new Set())

    const items: ResumeItem[] = []

    try {
      const saved = localStorage.getItem("hiredfast_resume_data")
      if (saved) {
        const parsed = JSON.parse(saved)
        const hasContent =
          parsed?.personalInfo?.fullName ||
          (parsed?.workExperience && parsed.workExperience.length > 0)

        if (hasContent) {
          items.push({
            id: "saved-resume",
            name: parsed.personalInfo?.fullName || "My Resume",
            subtitle: parsed.workExperience?.[0]?.role || undefined,
            text: JSON.stringify(parsed),
            source: "saved",
            badge: "Saved",
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          })
        }
      }
    } catch {
      // ignore parse errors
    }

    setResumes(items)
  }, [open])

  // Upload handler
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ""

    const validExtensions = [".pdf", ".docx"]
    const isValid = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )
    if (!isValid) {
      setUploadError("Invalid file type. Please upload a PDF or DOCX file.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10MB.")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const text = await extractTextFromFile(file)

      if (!text || text.trim().length < 50) {
        throw new Error(
          "Could not extract enough text from this file. " +
            "The document may be image-based. Please try a different file."
        )
      }

      const newResume: ResumeItem = {
        id: `upload-${Date.now()}`,
        name: file.name.replace(/\.(pdf|docx)$/i, ""),
        text,
        source: "uploaded",
        badge: "Uploaded",
        createdAt: new Date(),
      }

      setResumes((prev) => [newResume, ...prev])
      setSelectedResumeId(newResume.id)
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to process file."
      )
    } finally {
      setIsUploading(false)
    }
  }

  // Analyze handler
  const handleAnalyze = async () => {
    const selected = resumes.find((r) => r.id === selectedResumeId)
    if (!selected) return

    setView("loading")
    setAnalysisError(null)

    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: selected.text }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to analyze resume.")
      }

      const data: AnalysisResult = await response.json()
      setAnalysisResult(data)
      setView("results")
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      )
      setView("selection")
    }
  }

  // Category toggle
  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // Filtered resumes
  const filteredResumes = resumes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ---------- Inline view functions ----------

  const SelectionView = () => (
    <div className="flex flex-col">
      {/* Title */}
      <div className="px-6 pt-6 pb-4 text-center">
        <h2 className="text-xl font-semibold text-slate-900">
          Which resume would you like to use?
        </h2>
      </div>

      {/* Search + Upload */}
      <div className="px-6 pb-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search resumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
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
          className="h-11 w-11 p-0 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shrink-0 disabled:opacity-60"
          aria-label="Upload resume"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Upload error */}
      {uploadError && (
        <p className="px-6 pb-2 text-sm text-red-500">{uploadError}</p>
      )}

      {/* Analysis error (if previous attempt failed) */}
      {analysisError && (
        <p className="px-6 pb-2 text-sm text-red-500">{analysisError}</p>
      )}

      {/* Resume List */}
      <div className="px-6 pb-2 max-h-[380px] overflow-y-auto space-y-2">
        {filteredResumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14">
            <FileText className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">
              No resumes found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Upload a PDF or DOCX to get started
            </p>
          </div>
        ) : (
          filteredResumes.map((resume) => (
            <div
              key={resume.id}
              onClick={() => setSelectedResumeId(resume.id)}
              className={cn(
                "flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all",
                selectedResumeId === resume.id
                  ? "border-blue-400 bg-blue-50/40"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {resume.name}
                </p>
                {resume.subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {resume.subtitle}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                    "bg-green-100 text-green-700"
                  )}
                >
                  {resume.badge}
                </span>
                <span className="text-xs text-slate-400">
                  {formatTimeAgo(resume.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between mt-2">
        <Button
          variant="ghost"
          onClick={() => setOpen(false)}
          className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 gap-1.5"
        >
          ← Back
        </Button>
        <button
          onClick={handleAnalyze}
          disabled={!selectedResumeId || isUploading}
          className={cn(
            "inline-flex items-center gap-2 px-6 h-11 rounded-lg",
            "text-sm font-semibold text-white",
            "bg-gradient-to-r from-purple-600 to-violet-600",
            "hover:from-purple-700 hover:to-violet-700",
            "transition-all",
            (!selectedResumeId || isUploading) &&
              "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          Analyze Resume
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const LoadingView = () => (
    <div className="flex flex-col items-center justify-center min-h-[320px] py-16 px-6">
      <div className="h-20 w-20 rounded-full border-[5px] border-slate-100 border-t-purple-600 animate-spin" />
      <p className="text-2xl font-semibold text-slate-800 mt-8">
        Analyzing Your Resume...
      </p>
      <p className="text-sm text-slate-500 mt-2">This may take a moment.</p>
    </div>
  )

  const ResultsView = ({ result }: { result: AnalysisResult }) => {
    const score = result.totalScore
    const statusText =
      score >= 80
        ? "Ready to Apply"
        : score >= 60
          ? "Almost There"
          : "Needs Work"
    const statusColor =
      score >= 80
        ? "text-green-600"
        : score >= 60
          ? "text-amber-600"
          : "text-red-600"

    return (
      <div className="flex flex-col">
        {/* Back + Title */}
        <div className="px-6 pt-5 pb-4">
          <button
            onClick={() => {
              setView("selection")
              setAnalysisResult(null)
              setExpandedCategories(new Set())
            }}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold text-slate-900 text-center">
            Resume Analysis Complete
          </h2>
          <p className="text-sm text-slate-500 text-center mt-1.5">
            Here&apos;s how your resume performs and areas for improvement
          </p>
        </div>

        {/* Score Row */}
        <div className="px-6 mb-6 flex items-center gap-6">
          <ScoreCircle score={score} />
          <div className="flex flex-col gap-3">
            <p className={cn("text-2xl font-bold", statusColor)}>
              {statusText}
            </p>
            <button
              onClick={() => {
                setOpen(false)
                router.push("/resume/editor")
              }}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-lg text-sm font-semibold text-white w-fit bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 transition-all"
            >
              Improve Resume
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="px-6 pb-6">
          <p className="text-sm font-semibold text-slate-700 text-center mb-3">
            Score Breakdown
          </p>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {result.categories.map((category, index) => {
              const ratio = category.score / category.maxScore
              const barColor =
                ratio >= 0.8
                  ? "bg-green-500"
                  : ratio >= 0.6
                    ? "bg-amber-500"
                    : "bg-red-500"
              const isExpanded = expandedCategories.has(category.name)
              const isLast = index === result.categories.length - 1

              return (
                <div key={category.name}>
                  {/* Row header */}
                  <div
                    onClick={() => toggleCategory(category.name)}
                    className="flex items-center justify-between px-4 py-3.5 bg-white hover:bg-slate-50 cursor-pointer transition-colors select-none"
                  >
                    {/* Category name */}
                    <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 mr-4">
                      {category.name}
                    </span>

                    {/* Progress bar + score */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            barColor
                          )}
                          style={{
                            width: `${ratio * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-500 font-medium whitespace-nowrap w-12 text-right">
                        {category.score}/{category.maxScore}
                      </span>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-slate-400 ml-2 shrink-0 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>

                  {/* Expanded feedback */}
                  {isExpanded && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
                      {category.feedback.map((point, i) => {
                        const isPositive = point.startsWith("✓")
                        return (
                          <div key={i} className="flex items-start gap-2">
                            <span
                              className={cn(
                                "text-sm font-bold mt-0.5 shrink-0",
                                isPositive
                                  ? "text-green-500"
                                  : "text-amber-500"
                              )}
                            >
                              {isPositive ? "✓" : "⚠"}
                            </span>
                            <span className="text-sm text-slate-600 leading-relaxed">
                              {point.replace(/^[✓⚠]\s*/, "")}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Divider between rows (not after last) */}
                  {!isLast && <div className="h-px bg-slate-100" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ---------- Main render ----------

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={cn(
          "p-0 gap-0 bg-white border-slate-200 overflow-hidden",
          view === "results"
            ? "sm:max-w-[620px] max-h-[90vh] overflow-y-auto"
            : "sm:max-w-[620px]"
        )}
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Resume Analysis</DialogTitle>
        </VisuallyHidden>

        {view === "selection" && <SelectionView />}
        {view === "loading" && <LoadingView />}
        {view === "results" && analysisResult && (
          <ResultsView result={analysisResult} />
        )}

        {/* Show error if analysis failed */}
        {analysisError && view === "selection" && (
          <div className="px-6 pb-2">
            <p className="text-sm text-red-500">{analysisError}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
