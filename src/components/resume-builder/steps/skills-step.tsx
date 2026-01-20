import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ResumeData } from "@/hooks/use-resume-builder"

interface SkillsStepProps {
  data: ResumeData["skills"]
  updateData: (data: Partial<ResumeData["skills"]>) => void
}

export function SkillsStep({ data, updateData }: SkillsStepProps) {
  return (
    <div className="space-y-6">
       <h2 className="text-lg font-semibold">Skills</h2>

       <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base">Technical Skills</Label>
            <p className="text-sm text-muted-foreground">List your hard skills, programming languages, and tools.</p>
            <Textarea 
              value={data.technical}
              onChange={(e) => updateData({ technical: e.target.value })}
              placeholder="e.g. React, TypeScript, Next.js, Node.js, Python, Figma..."
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base">Soft Skills</Label>
            <p className="text-sm text-muted-foreground">List your interpersonal skills and leadership abilities.</p>
            <Textarea 
              value={data.soft}
              onChange={(e) => updateData({ soft: e.target.value })}
              placeholder="e.g. Leadership, Communication, Problem Solving, Team Management..."
              className="min-h-[120px]"
            />
          </div>
       </div>
    </div>
  )
}
