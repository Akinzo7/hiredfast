import { useResumeBuilder } from "@/hooks/use-resume-builder"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { saveResume } from "@/lib/firestore"

// Placeholder imports for steps - will implement these next
import { PersonalInfoStep } from "./steps/personal-info-step"
import { WorkExperienceStep } from "./steps/work-experience-step"
import { EducationStep } from "./steps/education-step"
import { SkillsStep } from "./steps/skills-step"
import { ProjectsStep } from "./steps/projects-step"
import { LanguagesCertificationsStep } from "./steps/languages-certifications-step"
import { AssociationsStep } from "./steps/associations-step"

interface ResumeBuilderModalProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ResumeBuilderModal({ children, open, onOpenChange }: ResumeBuilderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[700px] h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0 rounded-xl">
        <VisuallyHidden>
          <DialogTitle>Resume Builder Modal</DialogTitle>
        </VisuallyHidden>
        <ResumeBuilderContent />
      </DialogContent>
    </Dialog>
  )
}

function ResumeBuilderContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const {
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    resumeData,
    updatePersonalInfo,
    setWorkExperience,
    setEducation,
    setSkills,
    setProjects,
    setLanguages,
    setCertifications,
    setAssociations
  } = useResumeBuilder()

  const progress = (currentStep / totalSteps) * 100

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep data={resumeData.personalInfo} updateData={updatePersonalInfo} />
      case 2:
        return <WorkExperienceStep data={resumeData.workExperience} updateData={setWorkExperience} />
      case 3:
        return <EducationStep data={resumeData.education} updateData={setEducation} />
      case 4:
        return <SkillsStep data={resumeData.skills} updateData={setSkills} />
      case 5:
        return <ProjectsStep data={resumeData.projects} updateData={setProjects} />
      case 6:
        return <LanguagesCertificationsStep
                  languages={resumeData.languages}
                  certifications={resumeData.certifications}
                  updateLanguages={setLanguages}
                  updateCertifications={setCertifications}
               />
      case 7:
        return <AssociationsStep data={resumeData.associations} updateData={setAssociations} />
      default:
        return null
    }
  }

  const stepTitles = [
    "Personal Info",
    "Work Experience",
    "Education",
    "Skills",
    "Projects",
    "Languages & Certs",
    "Associations"
  ]

  const handleFinish = async () => {
    if (user) {
      setIsSaving(true)
      try {
        const title = resumeData.personalInfo.fullName?.trim() || "Untitled Resume"
        const newId = await saveResume(user.uid, title, resumeData)
        router.push(`/resume/editor?id=${newId}`)
      } catch (error) {
        console.error("Failed to save resume:", error)
        router.push("/resume/editor")
      } finally {
        setIsSaving(false)
      }
    } else {
      router.push("/resume/editor")
    }
  }

  return (
    <>
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
          <div className="flex items-center justify-between mb-2 pr-8">
             <DialogTitle className="text-xl">Resume Builder</DialogTitle>
             <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
          </div>
          <DialogDescription className="hidden">
            Build your resume in 7 easy steps.
          </DialogDescription>
          <div className="space-y-1">
             <Progress value={progress} className="h-1" />
             <p className="text-xs text-muted-foreground text-right">{stepTitles[currentStep - 1]}</p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 scroll-smooth">
           {renderStep()}
        </div>

        <div className="p-4 sm:p-6 border-t bg-background shrink-0 flex justify-between">
           <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
             Back
           </Button>
           <div className="flex gap-2">
             {currentStep > 1 && (
               <Button variant="ghost" onClick={nextStep}>
                 Skip
               </Button>
             )}
             <Button
               disabled={isSaving}
               onClick={() => {
                 if (currentStep === totalSteps) {
                   void handleFinish()
                 } else {
                   nextStep()
                 }
               }}
             >
               {isSaving ? "Saving..." : currentStep === totalSteps ? "Finish" : "Next"}
             </Button>
           </div>
        </div>
    </>
  )
}
