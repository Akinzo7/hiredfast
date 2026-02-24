"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mic } from "lucide-react"
import { ResumeSelectionStep } from "./resume-selection-step"
import { JobDescriptionStep } from "./job-description-step"
import { extractTextFromFile } from "@/lib/file-parser"
import { cn } from "@/lib/utils"

interface ResumeItem {
  id: string
  name: string
  text: string
  source: "saved" | "uploaded"
  createdAt: Date
}

interface InterviewSetupModalProps {
  children: React.ReactNode
}

export function InterviewSetupModal({ children }: InterviewSetupModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeStep, setActiveStep] = useState<1 | 2>(1)

  // Step 1 state
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Step 2 state
  const [jobDescription, setJobDescription] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [jobTitle, setJobTitle] = useState("")

  // Load saved resume from localStorage on mount
  useEffect(() => {
    if (!open) return
    if (typeof window === "undefined") return

    const items: ResumeItem[] = []

    try {
      const savedData = localStorage.getItem("hiredfast_resume_data")
      if (savedData) {
        const parsed = JSON.parse(savedData)
        const name = parsed.personalInfo?.fullName || "My Resume"
        items.push({
          id: "saved-resume",
          name,
          text: JSON.stringify(parsed),
          source: "saved",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // approximate
        })
      }
    } catch {
      // ignore corrupt data
    }

    setResumes(items)
    setSelectedResumeId(null)
    setActiveStep(1)
    setJobDescription("")
    setCompanyName("")
    setJobTitle("")
    setSearchQuery("")
    setUploadError(null)
  }, [open])

  const handleUpload = async (file: File) => {
    // Validate type
    const validExtensions = [".pdf", ".docx"]
    const isValid = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!isValid) {
      setUploadError("Invalid file type. Please upload PDF or DOCX.")
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
        throw new Error("Could not extract enough text from file.")
      }

      const newResume: ResumeItem = {
        id: `upload-${Date.now()}`,
        name: file.name.replace(/\.(pdf|docx)$/i, ""),
        text,
        source: "uploaded",
        createdAt: new Date(),
      }

      setResumes((prev) => [...prev, newResume])
      setSelectedResumeId(newResume.id)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to process file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleStartInterview = () => {
    if (activeStep === 1) {
      setActiveStep(2)
      return
    }

    // Step 2 — complete setup
    const selectedResume = resumes.find((r) => r.id === selectedResumeId)
    if (!selectedResume) return

    try {
      localStorage.setItem("hiredfast_interview_job_description", jobDescription)
      localStorage.setItem("hiredfast_interview_company", companyName)
      localStorage.setItem("hiredfast_interview_job_title", jobTitle)
      localStorage.setItem("hiredfast_interview_resume_text", selectedResume.text)
    } catch (e) {
      console.error("Failed to save interview setup data:", e)
    }

    setOpen(false)
    router.push("/interview/setup")
  }

  const isStep1Valid = selectedResumeId !== null
  const isStep2Valid = jobDescription.length >= 50

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="p-0 gap-0 bg-background border-border sm:max-w-[520px]"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Interview Setup</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Mic className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {activeStep === 1
                  ? "Which resume would you like to use?"
                  : "What role are you interviewing for?"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Step {activeStep} of 2
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex gap-2 mt-4">
            <div className="h-1 flex-1 rounded-full bg-orange-500" />
            <div className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              activeStep === 2 ? "bg-orange-500" : "bg-muted"
            )} />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 max-h-[400px] overflow-y-auto">
          {activeStep === 1 ? (
            <ResumeSelectionStep
              resumes={resumes}
              selectedResumeId={selectedResumeId}
              onSelect={setSelectedResumeId}
              onUpload={handleUpload}
              isUploading={isUploading}
              uploadError={uploadError}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          ) : (
            <JobDescriptionStep
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              companyName={companyName}
              onCompanyNameChange={setCompanyName}
              jobTitle={jobTitle}
              onJobTitleChange={setJobTitle}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (activeStep === 2) setActiveStep(1)
              else setOpen(false)
            }}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleStartInterview}
            disabled={activeStep === 1 ? !isStep1Valid : !isStep2Valid}
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2 px-6"
          >
            {activeStep === 1 ? "Start Interview Simulation" : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
