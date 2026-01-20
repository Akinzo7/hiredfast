import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ResumeData } from "@/hooks/use-resume-builder"

interface PersonalInfoStepProps {
  data: ResumeData["personalInfo"]
  updateData: (data: Partial<ResumeData["personalInfo"]>) => void
}

export function PersonalInfoStep({ data, updateData }: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName" className="text-base font-semibold">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="fullName" 
            placeholder="e.g. John Doe" 
            value={data.fullName}
            onChange={(e) => updateData({ fullName: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email" className="text-base font-semibold">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="e.g. john@example.com" 
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone" className="text-base font-semibold">
            Phone Number
          </Label>
          <Input 
            id="phone" 
            type="tel" 
            placeholder="e.g. +1 (555) 000-0000" 
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="linkedin" className="text-base font-semibold">
            LinkedIn Profile
          </Label>
          <Input 
            id="linkedin" 
            type="url" 
            placeholder="e.g. linkedin.com/in/johndoe" 
            value={data.linkedin}
            onChange={(e) => updateData({ linkedin: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
            <Label htmlFor="portfolio" className="text-base font-semibold">
                Portfolio / Website
            </Label>
            <Input 
                id="portfolio" 
                type="url" 
                placeholder="e.g. johndoe.com" 
                value={data.portfolio}
                onChange={(e) => updateData({ portfolio: e.target.value })}
            />
        </div>

        <div className="grid gap-2">
            <Label htmlFor="address" className="text-base font-semibold">
                Home Address
            </Label>
            <Textarea 
                id="address" 
                placeholder="e.g. 123 Main St, Springfield, IL" 
                value={data.address}
                onChange={(e) => updateData({ address: e.target.value })}
            />
        </div>
      </div>
    </div>
  )
}
