"use client"

import { useState } from "react"
import { FileScan, FileText, PenTool, Mic, ArrowRight } from "lucide-react"
import { ActionCard } from "@/components/action-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ResumeBuilderModal } from "@/components/resume-builder/resume-builder-modal"
import { CoverLetterModal } from "@/components/cover-letter/cover-letter-modal"
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
  )
}

