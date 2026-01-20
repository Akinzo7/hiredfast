import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ResumeData } from "@/hooks/use-resume-builder"
import { Plus, Trash2 } from "lucide-react"

interface ProjectsStepProps {
  data: ResumeData["projects"]
  updateData: (data: ResumeData["projects"]) => void
}

export function ProjectsStep({ data, updateData }: ProjectsStepProps) {
  
  const addProject = () => {
    updateData([
      ...data, 
      { id: crypto.randomUUID(), title: "", description: "", link: "" }
    ])
  }

  const removeProject = (id: string) => {
    updateData(data.filter(item => item.id !== id))
  }

  const updateProject = (id: string, field: string, value: any) => {
    updateData(data.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-lg font-semibold">Projects</h2>
         <Button onClick={addProject} size="sm" className="gap-2">
           <Plus className="h-4 w-4" /> Add Project
         </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
          <p>No projects added yet.</p>
          <Button variant="link" onClick={addProject}>Add your first project</Button>
        </div>
      )}

      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-xl space-y-4 bg-muted/20 relative group">
             <div className="flex justify-between items-start">
               <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Project {index + 1}</h3>
               <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 -mt-2 -mr-2" onClick={() => removeProject(item.id)}>
                 <Trash2 className="h-4 w-4" />
               </Button>
             </div>
             
             <div className="space-y-2">
                <Label>Project Title</Label>
                <Input 
                  value={item.title}
                  onChange={(e) => updateProject(item.id, 'title', e.target.value)}
                  placeholder="e.g. E-commerce Platform"
                />
             </div>

             <div className="space-y-2">
                <Label>Project Link</Label>
                <Input 
                  value={item.link}
                  onChange={(e) => updateProject(item.id, 'link', e.target.value)}
                  placeholder="e.g. github.com/username/project"
                />
             </div>

             <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={item.description}
                  onChange={(e) => updateProject(item.id, 'description', e.target.value)}
                  placeholder="Describe what you built and the technologies used..."
                  className="min-h-[100px]"
                />
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
