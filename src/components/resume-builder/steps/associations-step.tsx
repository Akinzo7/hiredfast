import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ResumeData } from "@/hooks/use-resume-builder"
import { Plus, Trash2 } from "lucide-react"

interface AssociationsStepProps {
  data: ResumeData["associations"]
  updateData: (data: ResumeData["associations"]) => void
}

export function AssociationsStep({ data, updateData }: AssociationsStepProps) {
  
  const addAssociation = () => {
    updateData([
      ...data, 
      { id: crypto.randomUUID(), name: "", role: "" }
    ])
  }

  const removeAssociation = (id: string) => {
    updateData(data.filter(item => item.id !== id))
  }

  const updateAssociation = (id: string, field: string, value: any) => {
    updateData(data.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-lg font-semibold">Associations</h2>
         <Button onClick={addAssociation} size="sm" className="gap-2">
           <Plus className="h-4 w-4" /> Add Association
         </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
          <p>No professional associations added yet.</p>
          <Button variant="link" onClick={addAssociation}>Add Membership</Button>
        </div>
      )}

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.id} className="flex gap-4 items-end p-4 border rounded-xl bg-muted/20 relative">
             <div className="flex-1 space-y-2">
                <Label>Organization Name</Label>
                <Input 
                  value={item.name}
                  onChange={(e) => updateAssociation(item.id, 'name', e.target.value)}
                  placeholder="e.g. IEEE"
                />
             </div>
             <div className="flex-1 space-y-2">
                <Label>Role / Title</Label>
                <Input 
                  value={item.role}
                  onChange={(e) => updateAssociation(item.id, 'role', e.target.value)}
                  placeholder="e.g. Member"
                />
             </div>
             
             <Button variant="ghost" size="icon" className="text-red-500 mb-0.5" onClick={() => removeAssociation(item.id)}>
                 <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
