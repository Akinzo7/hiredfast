"use client"

import { useState } from "react"
import { FileScan, FileText, PenTool, Mic, ArrowRight } from "lucide-react"
import { ActionCard } from "@/components/action-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ResumeBuilderModal } from "@/components/resume-builder/resume-builder-modal"
import { CoverLetterModal } from "@/components/cover-letter/cover-letter-modal"
import { InterviewSetupModal } from "@/components/interview/interview-setup-modal"
import { ResumeAnalysisModal } from "@/components/resume-analysis/resume-analysis-modal"
import { ResumeBuilderProvider } from "@/hooks/use-resume-builder"

export default function Home() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const buttonColorMap: Record<string, string> = {
      "analyze": "bg-purple-600 hover:bg-purple-700 text-white",
      "create": "bg-blue-600 hover:bg-blue-700 text-white",
      "cover-letter": "bg-green-600 hover:bg-green-700 text-white",
      "simulate": "bg-orange-600 hover:bg-orange-700 text-white",
      default: "variant-outline border-border/50 bg-secondary/50 hover:bg-secondary text-foreground"
  }

  const selectedColorClass = selectedOption ? buttonColorMap[selectedOption] : buttonColorMap.default

  return (
    <ResumeBuilderProvider>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 md:p-8">
         {/* Main Container */}
         <div className="w-full max-w-5xl border border-border/50 rounded-3xl p-6 md:p-12 relative overflow-hidden bg-card/30 backdrop-blur-sm shadow-2xl">
             
             <h1 className="text-2xl md:text-3xl font-semibold text-center mb-8 md:mb-10">What would you like to do?</h1>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <ActionCard 
                  icon={FileScan} 
                  title="Analyze & Improve Resume" 
                  description="Get feedback and suggestions" 
                  color="purple" 
                  selected={selectedOption === "analyze"}
                  onClick={() => setSelectedOption("analyze")}
                />
                <ActionCard 
                  icon={FileText} 
                  title="Create Job-Tailored Resume" 
                  description="Tailored to your job application" 
                  color="blue" 
                  selected={selectedOption === "create"}
                  onClick={() => setSelectedOption("create")}
                />
                <ActionCard 
                  icon={PenTool} 
                  title="Generate a Cover Letter" 
                  description="Highlight your qualifications" 
                  color="green" 
                  selected={selectedOption === "cover-letter"}
                  onClick={() => setSelectedOption("cover-letter")}
                />
                <ActionCard 
                  icon={Mic} 
                  title="Simulate an Interview" 
                  description="Prepare like a pro" 
                  color="orange" 
                  selected={selectedOption === "simulate"}
                  onClick={() => setSelectedOption("simulate")}
                />
             </div>

             <div className="flex justify-end mt-8">
               {selectedOption === "cover-letter" ? (
                 <CoverLetterModal>
                   <Button 
                      className={cn("gap-2 h-12 px-6 rounded-xl transition-colors", selectedColorClass)}
                      variant={selectedOption ? "default" : "outline"}
                   >
                     Continue <ArrowRight className="h-4 w-4" />
                   </Button>
                 </CoverLetterModal>
               ) : selectedOption === "simulate" ? (
                 <InterviewSetupModal>
                   <Button 
                      className={cn("gap-2 h-12 px-6 rounded-xl transition-colors", selectedColorClass)}
                      variant={selectedOption ? "default" : "outline"}
                   >
                     Continue <ArrowRight className="h-4 w-4" />
                   </Button>
                 </InterviewSetupModal>
               ) : selectedOption === "analyze" ? (
                 <ResumeAnalysisModal>
                   <Button 
                      className={cn("gap-2 h-12 px-6 rounded-xl transition-colors", selectedColorClass)}
                      variant={selectedOption ? "default" : "outline"}
                   >
                     Continue <ArrowRight className="h-4 w-4" />
                   </Button>
                 </ResumeAnalysisModal>
               ) : (
                 <ResumeBuilderModal>
                   <Button 
                      className={cn("gap-2 h-12 px-6 rounded-xl transition-colors", selectedColorClass)}
                      variant={selectedOption ? "default" : "outline"}
                      disabled={!selectedOption}
                   >
                     Continue <ArrowRight className="h-4 w-4" />
                   </Button>
                 </ResumeBuilderModal>
               )}
             </div>
         </div>
      </div>
    </ResumeBuilderProvider>
  )
}

