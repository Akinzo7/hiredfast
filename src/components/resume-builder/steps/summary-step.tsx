"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface SummaryStepProps {
  value: string
  onChange: (value: string) => void
}

export function SummaryStep({ value, onChange }: SummaryStepProps) {
  return (
    <div className="space-y-4">
       <div className="space-y-2">
          <Label>Professional Summary</Label>
          <Textarea 
             value={value}
             onChange={(e) => onChange(e.target.value)}
             placeholder="Experienced professional with a proven track record in..."
             className="min-h-[150px]"
          />
       </div>
    </div>
  )
}
