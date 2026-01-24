"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useResumeBuilder } from "@/hooks/use-resume-builder"

interface AddSectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSectionModal({ open, onOpenChange }: AddSectionModalProps) {
  const { resumeData, setCustomSections } = useResumeBuilder()
  const [title, setTitle] = useState("")
  const [prompt, setPrompt] = useState("")

  const handleAddSection = () => {
    if (!title.trim()) return

    const newSection = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: "" // Initially empty, or could generate content from prompt
    }

    setCustomSections([...resumeData.customSections, newSection])
    
    // Reset and close
    setTitle("")
    setPrompt("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate New Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="section-title">Title of the section (required)</Label>
            <Input 
              id="section-title"
              placeholder="e.g., Professional Experience" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-prompt">Enter your generation prompt here</Label>
            <Textarea 
              id="section-prompt"
              placeholder="Describe the content you want to generate..." 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <Button onClick={handleAddSection} className="w-full bg-slate-500 hover:bg-slate-600 text-white">
            Add Section
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
