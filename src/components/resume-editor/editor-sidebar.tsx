"use client"

import { useEffect, useRef, useState } from "react"
import { useResumeBuilder } from "@/hooks/use-resume-builder"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Plus, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Same imports as before + new ones
import { PersonalInfoStep } from "@/components/resume-builder/steps/personal-info-step"
import { WorkExperienceStep } from "@/components/resume-builder/steps/work-experience-step"
import { EducationStep } from "@/components/resume-builder/steps/education-step"
import { SkillsStep } from "@/components/resume-builder/steps/skills-step"
import { ProjectsStep } from "@/components/resume-builder/steps/projects-step"
import { LanguagesCertificationsStep } from "@/components/resume-builder/steps/languages-certifications-step"
import { AssociationsStep } from "@/components/resume-builder/steps/associations-step"
import { SummaryStep } from "@/components/resume-builder/steps/summary-step"
import { AddSectionModal } from "@/components/resume-builder/add-section-modal"

export function EditorSidebar() {
  const { user } = useAuth()
  const { 
    resumeData,
    updatePersonalInfo,
    setSummary,
    setWorkExperience,
    setEducation,
    setSkills,
    setProjects,
    setLanguages,
    setCertifications,
    setAssociations,
    setCustomSections
  } = useResumeBuilder()

  const [expandedSections, setExpandedSections] = useState<string[]>(["personal"])
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(0)
  const [timeTick, setTimeTick] = useState(0)
  const autosaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLastSavedAt(Date.now())
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [resumeData])

  useEffect(() => {
    const startTimeoutId = setTimeout(() => {
      setTimeTick(Date.now())
    }, 0)

    autosaveIntervalRef.current = setInterval(() => {
      setTimeTick(Date.now())
    }, 30000)

    return () => {
      clearTimeout(startTimeoutId)
      if (autosaveIntervalRef.current) {
        clearInterval(autosaveIntervalRef.current)
      }
    }
  }, [])

  const handleExpandAll = () => {
    // dynamically include custom sections
    const customIds = resumeData.customSections.map(s => s.id)
    setExpandedSections(["personal", "summary", "experience", "education", "skills", "projects", "languages", "associations", ...customIds])
  }

  const handleCollapseAll = () => {
    setExpandedSections([])
  }

  const updateCustomSection = (id: string, content: string) => {
    setCustomSections(resumeData.customSections.map(s => s.id === id ? { ...s, content } : s))
  }

  const removeCustomSection = (id: string) => {
    setCustomSections(resumeData.customSections.filter(s => s.id !== id))
  }

  const getRelativeLastSaved = (savedAtMs: number, nowMs: number) => {
    if (!savedAtMs || !nowMs) return "just now"

    const diffMs = Math.max(0, nowMs - savedAtMs)
    const minutes = Math.floor(diffMs / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "just now"
    if (minutes === 1) return "1 minute ago"
    if (minutes < 60) return `${minutes} minutes ago`
    if (hours === 1) return "1 hour ago"
    if (hours < 24) return `${hours} hours ago`
    if (days === 1) return "1 day ago"
    return `${days} days ago`
  }

  return (
    <div className="flex flex-col h-full">
      <AddSectionModal open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen} />
      
      {/* Sidebar Header */}
      <div className="p-4 border-b flex items-center justify-between bg-background shrink-0">
         <Button 
            className="gap-2"
            onClick={() => setIsAddSectionOpen(true)}
         >
           <Plus className="h-4 w-4" /> Add Section
         </Button>
         <div className="flex bg-muted rounded-lg p-1">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExpandAll}
                className="h-7 text-xs px-2 hover:bg-background hover:shadow-sm"
            >
                Expand All
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCollapseAll}
                className="h-7 text-xs px-2 hover:bg-background hover:shadow-sm"
            >
                Collapse All
            </Button>
         </div>
      </div>

      <div className="text-xs text-muted-foreground text-center px-4 py-2 border-b bg-background">
        <p>
          {user
            ? "Changes are saved locally. Use the Save button in the preview panel to back up to the cloud."
            : "Changes are saved locally. Log in to back up your resume to the cloud."}
        </p>
        <p className="mt-1">Last saved locally: {getRelativeLastSaved(lastSavedAt, timeTick)}</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-4 space-y-2">
          <Accordion 
            type="multiple" 
            value={expandedSections} 
            onValueChange={setExpandedSections}
            className="space-y-2"
          >
            {/* Personal Details */}
            <AccordionItem value="personal" className="border border-border rounded-xl bg-muted/50 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted">
                <span className="font-semibold">Personal Details</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-background border-t">
                 <PersonalInfoStep data={resumeData.personalInfo} updateData={updatePersonalInfo} />
              </AccordionContent>
            </AccordionItem>

            {/* Professional Summary */}
            <AccordionItem value="summary" className="border border-border rounded-xl bg-muted/50 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted">
                <span className="font-semibold">Professional Summary</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-background border-t">
                 <SummaryStep value={resumeData.summary} onChange={setSummary} />
              </AccordionContent>
            </AccordionItem>

            {/* Experience */}
            <AccordionItem value="experience" className="border border-border rounded-xl bg-muted/50 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted">
                <span className="font-semibold">Professional Experience</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-background border-t">
                 <WorkExperienceStep data={resumeData.workExperience} updateData={setWorkExperience} />
              </AccordionContent>
            </AccordionItem>

            {/* Education */}
            <AccordionItem value="education" className="border border-border rounded-xl bg-muted/50 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted">
                <span className="font-semibold">Education</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-background border-t">
                 <EducationStep data={resumeData.education} updateData={setEducation} />
              </AccordionContent>
            </AccordionItem>

             {/* Skills */}
             <AccordionItem value="skills" className="border border-border rounded-xl bg-muted/50 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted">
                <span className="font-semibold">Technical Skills</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-background border-t">
                 <SkillsStep data={resumeData.skills} updateData={setSkills} />
              </AccordionContent>
            </AccordionItem>

             {/* Projects */}
             <AccordionItem value="projects" className="border border-border rounded-xl bg-muted/50 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted">
                <span className="font-semibold">Projects</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-background border-t">
                 <ProjectsStep data={resumeData.projects} updateData={setProjects} />
              </AccordionContent>
            </AccordionItem>

             {/* Languages & Certs */}
             <AccordionItem value="languages" className="border border-border rounded-xl bg-muted/50 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted">
                <span className="font-semibold">Languages & Certifications</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-background border-t">
                 <LanguagesCertificationsStep 
                    languages={resumeData.languages}
                    certifications={resumeData.certifications}
                    updateLanguages={setLanguages}
                    updateCertifications={setCertifications}
                 />
              </AccordionContent>
            </AccordionItem>
            
            {/* Associations */}
            <AccordionItem value="associations" className="border border-border rounded-xl bg-muted/50 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted">
                <span className="font-semibold">Associations</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-background border-t">
                 <AssociationsStep data={resumeData.associations} updateData={setAssociations} />
              </AccordionContent>
            </AccordionItem>

            {/* Custom Sections */}
            {resumeData.customSections.map((section) => (
                <AccordionItem key={section.id} value={section.id} className="border border-border rounded-xl bg-muted/50 overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted group">
                        <span className="font-semibold">{section.title}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-4 bg-background border-t space-y-4">
                        <div className="flex justify-end">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeCustomSection(section.id);
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Section
                            </Button>
                        </div>
                        <div className="space-y-2">
                             <Label>Content</Label>
                             <Textarea 
                                value={section.content}
                                onChange={(e) => updateCustomSection(section.id, e.target.value)}
                                className="min-h-[150px]"
                             />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}

          </Accordion>
        </div>
      </div>
    </div>
  )
}
