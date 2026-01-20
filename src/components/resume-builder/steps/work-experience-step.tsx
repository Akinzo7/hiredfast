import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ResumeData } from "@/hooks/use-resume-builder"
import { Plus, Trash2 } from "lucide-react"

interface WorkExperienceStepProps {
  data: ResumeData["workExperience"]
  updateData: (data: ResumeData["workExperience"]) => void
}

export function WorkExperienceStep({ data, updateData }: WorkExperienceStepProps) {
  
  const addExperience = () => {
    updateData([
      ...data, 
      { 
        id: crypto.randomUUID(), 
        company: "", 
        role: "", 
        startDate: "", 
        endDate: "", 
        current: false, 
        achievements: "" 
      }
    ])
  }

  const removeExperience = (id: string) => {
    updateData(data.filter(item => item.id !== id))
  }

  const updateExperience = (id: string, field: string, value: any) => {
    updateData(data.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-lg font-semibold">Work Experience</h2>
         <Button onClick={addExperience} size="sm" className="gap-2">
           <Plus className="h-4 w-4" /> Add Job
         </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
          <p>No work experience added yet.</p>
          <Button variant="link" onClick={addExperience}>Add your first role</Button>
        </div>
      )}

      <div className="space-y-8">
        {data.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-xl space-y-4 bg-muted/20 relative group">
             <div className="flex justify-between items-start">
               <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Role {index + 1}</h3>
               <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 -mt-2 -mr-2" onClick={() => removeExperience(item.id)}>
                 <Trash2 className="h-4 w-4" />
               </Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input 
                    value={item.company}
                    onChange={(e) => updateExperience(item.id, 'company', e.target.value)}
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role / Title</Label>
                  <Input 
                    value={item.role}
                    onChange={(e) => updateExperience(item.id, 'role', e.target.value)}
                    placeholder="e.g. Senior Developer"
                  />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    value={item.startDate}
                    onChange={(e) => updateExperience(item.id, 'startDate', e.target.value)}
                    placeholder="MM/YYYY"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div className="space-y-3">
                    <Input 
                        value={item.endDate}
                        onChange={(e) => updateExperience(item.id, 'endDate', e.target.value)}
                        placeholder="MM/YYYY"
                        disabled={item.current}
                    />
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id={`current-${item.id}`} 
                            checked={item.current}
                            onCheckedChange={(checked) => {
                                const isChecked = checked === true
                                updateData(data.map(i => {
                                    if (i.id === item.id) {
                                        return {
                                            ...i,
                                            current: isChecked,
                                            endDate: isChecked ? "Present" : ""
                                        }
                                    }
                                    return i
                                }))
                            }}
                        />
                        <Label htmlFor={`current-${item.id}`} className="text-sm font-normal">Currently work here</Label>
                    </div>
                  </div>
                </div>
             </div>

             <div className="space-y-2">
                <Label>Key Achievements</Label>
                <Textarea 
                  value={item.achievements}
                  onChange={(e) => updateExperience(item.id, 'achievements', e.target.value)}
                  placeholder="• Led a team of 5 developers...&#10;• Increased performance by 20%..."
                  className="min-h-[100px]"
                />
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
