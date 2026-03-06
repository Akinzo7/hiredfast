"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface JobDescriptionStepProps {
  jobDescription: string
  onJobDescriptionChange: (value: string) => void
  companyName: string
  onCompanyNameChange: (value: string) => void
  jobTitle: string
  onJobTitleChange: (value: string) => void
}

export function JobDescriptionStep({
  jobDescription,
  onJobDescriptionChange,
  companyName,
  onCompanyNameChange,
  jobTitle,
  onJobTitleChange,
}: JobDescriptionStepProps) {
  const charCount = jobDescription.length
  const meetsMinimum = charCount >= 50

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-white">
            Job Description <span className="text-red-400">*</span>
          </Label>
          <span className="text-xs text-slate-500">
            {charCount.toLocaleString()} chars
            {charCount < 50 && (
              <span className="text-red-500 ml-1">(50 minimum)</span>
            )}
            {charCount >= 50 && charCount <= 8000 && (
              <span className="text-green-700 ml-1">✓</span>
            )}
            {charCount > 8000 && (
              <span className="text-amber-500 ml-1">
                · Long descriptions may reduce AI accuracy (recommended max: 8,000)
              </span>
            )}
          </span>
        </div>
        <Textarea
          placeholder="Paste the job description here..."
          rows={8}
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          className={cn(
            "resize-none bg-slate-800 text-white placeholder:text-slate-500",
            charCount > 8000
              ? "border-amber-400 focus-visible:ring-amber-400"
              : "border-slate-700/50 focus-visible:ring-blue-500/50"
          )}
        />
        <p className="text-xs text-slate-400 mt-1">
          Minimum 50 characters · 500–5,000 recommended · 8,000 max for best results
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-300">
          Company Name <span className="text-slate-600">(optional)</span>
        </Label>
        <Input
          placeholder="e.g. Google, Microsoft..."
          value={companyName}
          onChange={(e) => onCompanyNameChange(e.target.value)}
          className="bg-slate-800 border-slate-700/50 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-300">
          Job Title <span className="text-slate-600">(optional)</span>
        </Label>
        <Input
          placeholder="e.g. Senior Software Engineer..."
          value={jobTitle}
          onChange={(e) => onJobTitleChange(e.target.value)}
          className="bg-slate-800 border-slate-700/50 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
        />
      </div>
    </div>
  )
}
