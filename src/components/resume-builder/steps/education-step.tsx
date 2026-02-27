import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ResumeData } from "@/hooks/use-resume-builder"
import { Plus, Trash2 } from "lucide-react"

interface EducationStepProps {
  data: ResumeData["education"]
  updateData: (data: ResumeData["education"]) => void
}

export function EducationStep({ data, updateData }: EducationStepProps) {
  
  const addEducation = () => {
    updateData([
      ...data, 
      { 
        id: crypto.randomUUID(), 
        school: "", 
        degree: "", 
        admissionYear: "",
        graduationYear: "",
        description: "",
      }
    ])
  }

  const removeEducation = (id: string) => {
    updateData(data.filter(item => item.id !== id))
  }

  const updateEducation = (
    id: string,
    field: "school" | "degree" | "admissionYear" | "graduationYear" | "description",
    value: string
  ) => {
    updateData(data.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-lg font-semibold">Education</h2>
         <Button onClick={addEducation} size="sm" className="gap-2">
           <Plus className="h-4 w-4" /> Add Education
         </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
          <p>No education details added yet.</p>
          <Button variant="link" onClick={addEducation}>Add School</Button>
        </div>
      )}

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-xl space-y-4 bg-muted/20 relative group">
             <div className="flex justify-between items-start">
               <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Education {index + 1}</h3>
               <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 -mt-2 -mr-2" onClick={() => removeEducation(item.id)}>
                 <Trash2 className="h-4 w-4" />
               </Button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School / University</Label>
                  <Input 
                    value={item.school}
                    onChange={(e) => updateEducation(item.id, 'school', e.target.value)}
                    placeholder="e.g. University of Design"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label>Admission Year</Label>
                    <Input 
                        value={item.admissionYear}
                        onChange={(e) => updateEducation(item.id, 'admissionYear', e.target.value)}
                        placeholder="e.g. 2020"
                    />
                    </div>
                    <div className="space-y-2">
                    <Label>Graduation Year</Label>
                    <Input 
                        value={item.graduationYear}
                        onChange={(e) => updateEducation(item.id, 'graduationYear', e.target.value)}
                        placeholder="e.g. 2024"
                    />
                    </div>
                </div>
             </div>

             <div className="space-y-2">
                  <Label>Degree / Certification</Label>
                  <Input 
                    value={item.degree}
                    onChange={(e) => updateEducation(item.id, 'degree', e.target.value)}
                    placeholder="e.g. Bachelor of Science in Computer Science"
                  />
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
