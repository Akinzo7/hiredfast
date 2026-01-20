import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ResumeData } from "@/hooks/use-resume-builder"
import { Plus, Trash2 } from "lucide-react"

interface LanguagesCertificationsStepProps {
  languages: ResumeData["languages"]
  certifications: ResumeData["certifications"]
  updateLanguages: (data: ResumeData["languages"]) => void
  updateCertifications: (data: ResumeData["certifications"]) => void
}

export function LanguagesCertificationsStep({ 
  languages, 
  certifications, 
  updateLanguages, 
  updateCertifications 
}: LanguagesCertificationsStepProps) {
  
  const addLanguage = () => {
    updateLanguages([...languages, { id: crypto.randomUUID(), name: "", proficiency: "" }])
  }

  const removeLanguage = (id: string) => {
    updateLanguages(languages.filter(item => item.id !== id))
  }

  const updateLanguage = (id: string, field: string, value: any) => {
    updateLanguages(languages.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const addCertification = () => {
    updateCertifications([...certifications, { id: crypto.randomUUID(), name: "", issuer: "", year: "" }])
  }

  const removeCertification = (id: string) => {
    updateCertifications(certifications.filter(item => item.id !== id))
  }

  const updateCertification = (id: string, field: string, value: any) => {
    updateCertifications(certifications.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  return (
    <div className="space-y-8">
      
      {/* Languages Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Languages</h2>
            <Button onClick={addLanguage} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Language
            </Button>
        </div>
        
        {languages.map((item) => (
            <div key={item.id} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                    <Label>Language</Label>
                    <Input 
                        value={item.name}
                        onChange={(e) => updateLanguage(item.id, 'name', e.target.value)}
                        placeholder="e.g. English"
                    />
                </div>
                <div className="flex-1 space-y-2">
                    <Label>Proficiency</Label>
                    <Select value={item.proficiency} onValueChange={(value) => updateLanguage(item.id, 'proficiency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select proficiency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Native">Native</SelectItem>
                        <SelectItem value="Bilingual">Bilingual</SelectItem>
                        <SelectItem value="Fluent">Fluent</SelectItem>
                        <SelectItem value="Professional Working Proficiency">Professional Working Proficiency</SelectItem>
                        <SelectItem value="Elementary">Elementary</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 mb-0.5" onClick={() => removeLanguage(item.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ))}
        {languages.length === 0 && <p className="text-sm text-muted-foreground italic">No languages added.</p>}
      </div>

      <div className="h-px bg-border/50" />

      {/* Certifications Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Certifications</h2>
            <Button onClick={addCertification} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Certification
            </Button>
        </div>

        {certifications.map((item) => (
            <div key={item.id} className="p-4 border rounded-xl space-y-4 bg-muted/20 relative">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Certification {certifications.indexOf(item) + 1}</h3>
                    <Button variant="ghost" size="icon" className="text-red-500 -mt-2 -mr-2" onClick={() => removeCertification(item.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <div className="space-y-2">
                    <Label>Certification Name</Label>
                    <Input 
                        value={item.name}
                        onChange={(e) => updateCertification(item.id, 'name', e.target.value)}
                        placeholder="e.g. AWS Certified Solutions Architect"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Issuer</Label>
                        <Input 
                            value={item.issuer}
                            onChange={(e) => updateCertification(item.id, 'issuer', e.target.value)}
                            placeholder="e.g. Amazon"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Year</Label>
                        <Input 
                            value={item.year}
                            onChange={(e) => updateCertification(item.id, 'year', e.target.value)}
                            placeholder="e.g. 2023"
                        />
                    </div>
                </div>
            </div>
        ))}
        {certifications.length === 0 && <p className="text-sm text-muted-foreground italic">No certifications added.</p>}
      </div>

    </div>
  )
}
