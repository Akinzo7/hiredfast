"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Plus,
  ArrowLeft,
  ArrowRight,
  Search,
  Upload,
  X,
  Lightbulb,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getJobs, saveJob, getResumes } from "@/lib/firestore"
import { extractTextFromFile } from "@/lib/file-parser"
import { Timestamp } from "firebase/firestore"

// ---- Types ----

type Step = "job-select" | "resume-select" | "generating"

interface Job {
  id: string
  title: string
  company?: string
  employmentType?: string
  description?: string
  status?: string
  createdAt: Timestamp
}

interface Resume {
  id: string
  title?: string
  data?: object
  createdAt: Timestamp
  updatedAt: Timestamp
  source?: string
}

interface CoverLetterModalProps {
  children: React.ReactNode
}

// ---- Helpers ----

function relativeTime(ts: Timestamp | undefined): string {
  if (!ts) return ""
  const now = Date.now()
  const then = ts.toDate().getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  const diffWeek = Math.floor(diffDay / 7)
  if (diffWeek < 5) return `${diffWeek}w ago`
  const diffMonth = Math.floor(diffDay / 30)
  return `${diffMonth}mo ago`
}

// ---- Component ----

export function CoverLetterModal({ children }: CoverLetterModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Step state
  const [step, setStep] = useState<Step>("job-select")

  // Job selection
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  // New job inline form
  const [showNewJob, setShowNewJob] = useState(false)
  const [newJobTitle, setNewJobTitle] = useState("")
  const [newJobCompany, setNewJobCompany] = useState("")
  const [newJobType, setNewJobType] = useState("")
  const [newJobDescription, setNewJobDescription] = useState("")
  const [savingJob, setSavingJob] = useState(false)

  // Resume selection
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [resumeSearch, setResumeSearch] = useState("")

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Generation
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Cleanup on close
      if (abortRef.current) abortRef.current.abort()
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      return
    }
    // Reset on open
    setStep("job-select")
    setSelectedJobId(null)
    setSelectedResumeId(null)
    setShowNewJob(false)
    setNewJobTitle("")
    setNewJobCompany("")
    setNewJobType("")
    setNewJobDescription("")
    setResumeSearch("")
    setGenerationProgress(0)
    setGenerationError(null)
    setIsGenerating(false)
  }, [open])

  // Cleanup interval and abort controller on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, []) // empty deps = runs cleanup only on unmount

  // Fetch jobs
  useEffect(() => {
    if (!open || !user) return
    let mounted = true
    setLoadingJobs(true)
    getJobs(user.uid)
      .then((data) => { if (mounted) setJobs(data as Job[]) })
      .catch(() => { if (mounted) setJobs([]) })
      .finally(() => { if (mounted) setLoadingJobs(false) })
    return () => { mounted = false }
  }, [open, user])

  // Fetch resumes when entering resume-select step
  useEffect(() => {
    if (step !== "resume-select" || !user) return
    let mounted = true
    setLoadingResumes(true)
    getResumes(user.uid)
      .then((data) => { if (mounted) setResumes(data as Resume[]) })
      .catch(() => { if (mounted) setResumes([]) })
      .finally(() => { if (mounted) setLoadingResumes(false) })
    return () => { mounted = false }
  }, [step, user])

  // ---- Handlers ----

  const handleSaveNewJob = async () => {
    if (!user || !newJobTitle.trim()) return
    setSavingJob(true)
    try {
      const id = await saveJob(user.uid, {
        title: newJobTitle.trim(),
        company: newJobCompany.trim() || undefined,
        employmentType: newJobType.trim() || undefined,
        description: newJobDescription.trim() || undefined,
      })
      const newJob: Job = {
        id,
        title: newJobTitle.trim(),
        company: newJobCompany.trim() || undefined,
        employmentType: newJobType.trim() || undefined,
        description: newJobDescription.trim() || undefined,
        status: "Added",
        createdAt: Timestamp.now(),
      }
      setJobs((prev) => [newJob, ...prev])
      setSelectedJobId(id)
      setShowNewJob(false)
      setNewJobTitle("")
      setNewJobCompany("")
      setNewJobType("")
      setNewJobDescription("")
    } catch {
      // silently fail
    } finally {
      setSavingJob(false)
    }
  }

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validExts = [".pdf", ".docx"]
    const isValid = validExts.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!isValid || file.size > 10 * 1024 * 1024) return

    setIsUploading(true)
    try {
      const text = await extractTextFromFile(file)
      if (!text || text.trim().length < 50) return

      const uploadedResume: Resume = {
        id: `upload-${Date.now()}`,
        title: file.name,
        data: { rawText: text },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        source: "uploaded",
      }
      setResumes((prev) => [uploadedResume, ...prev])
      setSelectedResumeId(uploadedResume.id)
    } catch {
      // silently fail
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleGenerate = useCallback(async () => {
    const selectedJob = jobs.find((j) => j.id === selectedJobId)
    if (!selectedJob) return

    setStep("generating")
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationError(null)

    // Progress simulation
    const startTime = Date.now()
    const duration = 15000
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * 90, 90) // Cap at 90 until API responds
      setGenerationProgress(progress)
    }, 200)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const selectedResume = resumes.find((r) => r.id === selectedResumeId)
      const resumeData = selectedResume?.data
        ? (typeof selectedResume.data === "object" ? JSON.stringify(selectedResume.data) : selectedResume.data)
        : null

      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: selectedJob.description || selectedJob.title,
          jobTitle: selectedJob.title,
          company: selectedJob.company || "",
          resumeData,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate cover letter")
      }

      const data = await response.json()

      // Complete progress
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      setGenerationProgress(100)

      // Save to localStorage for the editor page
      const editorData = {
        letterContent: data.letter,
        jobTitle: selectedJob.title,
        company: selectedJob.company || "",
        jobId: selectedJob.id,
        resumeId: selectedResumeId,
        createdAt: Date.now(),
      }
      localStorage.setItem("hiredfast_cover_letter_draft", JSON.stringify(editorData))

      // Navigate to editor after short delay
      setTimeout(() => {
        setOpen(false)
        router.push("/cover-letter/editor")
      }, 500)
    } catch (err) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if ((err as Error).name === "AbortError") {
        // User cancelled
        setStep("resume-select")
        setIsGenerating(false)
        return
      }
      setGenerationError(err instanceof Error ? err.message : "An unexpected error occurred")
      setIsGenerating(false)
      setStep("resume-select")
    }
  }, [jobs, selectedJobId, resumes, selectedResumeId, router])

  const handleCancelGeneration = () => {
    if (abortRef.current) abortRef.current.abort()
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    setIsGenerating(false)
    setStep("resume-select")
  }

  // Filtered resumes
  const filteredResumes = resumes.filter((r) => {
    if (!resumeSearch.trim()) return true
    const name = (r.title || "").toLowerCase()
    return name.includes(resumeSearch.toLowerCase())
  })

  const selectedJob = jobs.find((j) => j.id === selectedJobId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="p-0 gap-0 bg-background border-border w-[95vw] sm:max-w-[520px] rounded-xl"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Cover Letter Generator</DialogTitle>
        </VisuallyHidden>

        {/* ====== SCREEN 1: Job Selection ====== */}
        {step === "job-select" && (
          <div className="flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-center text-foreground">
                Which job are you applying for?
              </h2>
            </div>

            {/* + New Job button */}
            <div className="px-5 flex justify-end">
              <Button
                size="sm"
                onClick={() => setShowNewJob(!showNewJob)}
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> New Job
              </Button>
            </div>

            {/* New Job Form (inline) */}
            {showNewJob && (
              <div className="mx-5 mt-3 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                <Input
                  placeholder="Job title *"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder="Company name"
                  value={newJobCompany}
                  onChange={(e) => setNewJobCompany(e.target.value)}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder="Employment type (e.g. full-time)"
                  value={newJobType}
                  onChange={(e) => setNewJobType(e.target.value)}
                  className="h-9 text-sm"
                />
                <textarea
                  placeholder="Job description (paste the full JD here)"
                  value={newJobDescription}
                  onChange={(e) => setNewJobDescription(e.target.value)}
                  className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewJob(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNewJob}
                    disabled={!newJobTitle.trim() || savingJob}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5"
                  >
                    {savingJob && <Loader2 className="h-3 w-3 animate-spin" />}
                    Save Job
                  </Button>
                </div>
              </div>
            )}

            {/* Job list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0 max-h-[400px]">
              {loadingJobs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No jobs yet. Click &quot;+ New Job&quot; to add one.
                </div>
              ) : (
                jobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border transition-colors",
                      selectedJobId === job.id
                        ? "border-green-500 bg-green-500/10"
                        : "border-border bg-card hover:bg-accent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {job.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.company || "Company not specified"}
                        </p>
                        {job.employmentType && (
                          <span className="inline-block mt-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {job.employmentType}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {job.status || "Added"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {relativeTime(job.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep("resume-select")}
                disabled={!selectedJobId}
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ====== SCREEN 2: Resume Selection ====== */}
        {(step === "resume-select" || step === "generating") && (
          <div className="flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-center text-foreground">
                Which resume would you like to use?
              </h2>
            </div>

            {/* Search + Upload */}
            <div className="px-5 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resumes..."
                  value={resumeSearch}
                  onChange={(e) => setResumeSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleUploadResume}
                className="hidden"
              />
              <Button
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700 text-white h-9 w-9 shrink-0"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Error toast */}
            {generationError && (
              <div className="mx-5 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                {generationError}
              </div>
            )}

            {/* Resume list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0 max-h-[400px]">
              {loadingResumes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredResumes.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {resumeSearch
                    ? "No resumes match your search."
                    : "No resumes found. You can proceed without one or upload a file."}
                </div>
              ) : (
                filteredResumes.map((resume) => {
                  const isUploaded = resume.source === "uploaded" || (resume.title?.match(/\.(pdf|docx)$/i))
                  const isGenerated = !isUploaded && resume.data
                  return (
                    <button
                      key={resume.id}
                      type="button"
                      onClick={() =>
                        setSelectedResumeId(
                          selectedResumeId === resume.id ? null : resume.id
                        )
                      }
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg border transition-colors",
                        selectedResumeId === resume.id
                          ? "border-green-500 bg-green-500/10"
                          : "border-border bg-card hover:bg-accent"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {resume.title || "Untitled Resume"}
                          </p>
                          {isGenerated && resume.data && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {(resume.data as { personalInfo?: { fullName?: string } })?.personalInfo?.fullName || ""}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <span
                            className={cn(
                              "inline-block text-[10px] font-semibold px-2 py-0.5 rounded",
                              isUploaded
                                ? "bg-green-500/20 text-green-500"
                                : "bg-blue-500/20 text-blue-500"
                            )}
                          >
                            {isUploaded ? "Uploaded" : "Generated"}
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            {relativeTime(resume.updatedAt || resume.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep("job-select")}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              >
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate Cover Letter
              </Button>
            </div>

            {/* ====== SCREEN 3: Generation Overlay ====== */}
            {step === "generating" && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="bg-popover rounded-xl shadow-2xl w-[90%] max-w-[400px] p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">
                      Generating Your Cover Letter
                    </h3>
                    <button
                      type="button"
                      onClick={handleCancelGeneration}
                      className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-300 ease-linear"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      ~ 15 seconds
                    </p>
                    <p className="text-[10px] text-center text-muted-foreground">
                      Based on the last 10 generations
                    </p>
                  </div>

                  {/* Pro Tip card */}
                  <div className="rounded-lg bg-green-500/15 p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-green-500 shrink-0" />
                      <p className="font-bold text-sm text-foreground">
                        Pro Tip
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      A personalized cover letter significantly increases your
                      chances of getting an interview
                    </p>
                  </div>

                  {/* No Resume warning */}
                  {!selectedResumeId && (
                    <div className="rounded-lg bg-amber-500/15 p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        <p className="font-bold text-sm text-foreground">
                          No Resume Attached
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">
                        We&apos;ll generate a template based on ideal
                        qualifications. You can personalize it with your
                        experiences afterward.
                      </p>
                    </div>
                  )}

                  {/* Status text */}
                  <p className="text-xs text-center text-green-500">
                    Please wait while we craft your perfect cover letter...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
