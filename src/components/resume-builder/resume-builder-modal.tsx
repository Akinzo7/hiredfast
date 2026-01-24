import { ResumeBuilderProvider, useResumeBuilder } from "@/hooks/use-resume-builder"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
      <DialogContent className="sm:max-w-[700px] h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0">
         <ResumeBuilderProvider>
            <ResumeBuilderContent />
         </ResumeBuilderProvider>
      </DialogContent>
    </Dialog>
  )
}

function ResumeBuilderContent() {
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

  return (
    <>
        <DialogHeader className="px-6 py-4 border-b shrink-0">
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

        <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
           {renderStep()}
        </div>

        <div className="p-6 border-t bg-background shrink-0 flex justify-between">
           <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
             Back
           </Button>
           <div className="flex gap-2">
             {currentStep > 1 && (
               <Button variant="ghost" onClick={nextStep}>
                 Skip
               </Button>
             )}
             <Button onClick={() => {
               if (currentStep === totalSteps) {
                 window.location.href = "/resume/editor"
               } else {
                 nextStep()
               }
             }}>
               {currentStep === totalSteps ? "Finish" : "Next"}
             </Button>
           </div>
        </div>
    </>
  )
}
