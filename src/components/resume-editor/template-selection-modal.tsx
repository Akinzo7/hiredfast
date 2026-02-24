"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type TemplateCategory = "All" | "Eye-Catchers" | "No-Nonsense" | "Tried & True" | "Clean & Simple" | "Cool & Quirky" | "Story Tellers"

export interface TemplateOption {
  id: string
  name: string
  description: string
  category: TemplateCategory
  thumbnailBg: string // Tailwind class for placeholder
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "All", "Eye-Catchers", "No-Nonsense", "Tried & True", "Clean & Simple", "Cool & Quirky", "Story Tellers"
]

const TEMPLATES: TemplateOption[] = [
  // Eye-Catchers
  { id: "modern", name: "Bold", description: "Make a strong first impression with striking headers.", category: "Eye-Catchers", thumbnailBg: "bg-blue-50" },
  { id: "spotlight", name: "Spotlight", description: "Highlights key information with a modular layout.", category: "Eye-Catchers", thumbnailBg: "bg-indigo-50" },
  { id: "dynamic", name: "Dynamic", description: "Modern and energetic design to showcase your achievements.", category: "Eye-Catchers", thumbnailBg: "bg-sky-50" },
  { id: "horizon", name: "Horizon", description: "Streamlined design with prominent headers.", category: "Eye-Catchers", thumbnailBg: "bg-cyan-50" },
  { id: "vibrant", name: "Vibrant", description: "Uses color accents to guide the reader's eye.", category: "Eye-Catchers", thumbnailBg: "bg-rose-50" },
  
  // No-Nonsense
  { id: "classic", name: "Professional", description: "Traditional layout widely accepted by major corporations.", category: "No-Nonsense", thumbnailBg: "bg-slate-50" },
  { id: "executive", name: "Executive", description: "Clean, authoritative design for senior roles.", category: "No-Nonsense", thumbnailBg: "bg-gray-50" },
  { id: "simple", name: "Simple", description: "Focuses purely on content with zero distractions.", category: "No-Nonsense", thumbnailBg: "bg-neutral-50" },
  { id: "functional", name: "Functional", description: "Optimized for readability and ATS systems.", category: "No-Nonsense", thumbnailBg: "bg-stone-50" },

  // Tried & True
  { id: "standard", name: "Standard", description: "The industry standard for decades.", category: "Tried & True", thumbnailBg: "bg-zinc-50" },
  { id: "corporate", name: "Corporate", description: "Tailored for banking, law, and enterprise.", category: "Tried & True", thumbnailBg: "bg-slate-100" },
  { id: "academic", name: "Academic", description: "Detailed layout suitable for CVs and research.", category: "Tried & True", thumbnailBg: "bg-white border" },

  // Clean & Simple
  { id: "minimal", name: "Clean", description: "Maximizes whitespace for excellent readability.", category: "Clean & Simple", thumbnailBg: "bg-white border" },
  { id: "air", name: "Air", description: "Open layout that feels light and approachable.", category: "Clean & Simple", thumbnailBg: "bg-blue-50/30" },
  { id: "focus", name: "Focus", description: "Draws attention to experience with subtle formatting.", category: "Clean & Simple", thumbnailBg: "bg-gray-50/50" },
  { id: "compact", name: "Compact", description: "Fits more information onto a single page.", category: "Clean & Simple", thumbnailBg: "bg-white border-dashed" },

  // Cool & Quirky
  { id: "tech", name: "Tech", description: "Monospace accents for developer roles.", category: "Cool & Quirky", thumbnailBg: "bg-emerald-50" },
  { id: "startup", name: "Startup", description: "Fresh, youthful vibe for modern companies.", category: "Cool & Quirky", thumbnailBg: "bg-purple-50" },
  { id: "creative", name: "Creative", description: "Unique grid system for designers.", category: "Cool & Quirky", thumbnailBg: "bg-pink-50" },

  // Story Tellers
  { id: "narrative", name: "Narrative", description: "Emphasizes the summary and bio sections.", category: "Story Tellers", thumbnailBg: "bg-amber-50" },
  { id: "journey", name: "Journey", description: "Visual timeline of your career path.", category: "Story Tellers", thumbnailBg: "bg-orange-50" },
]

interface TemplateSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTemplateId: string
  onSelectTemplate: (id: string) => void
}

export function TemplateSelectionModal({ open, onOpenChange, selectedTemplateId, onSelectTemplate }: TemplateSelectionModalProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All")

  const filteredTemplates = activeCategory === "All" 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === activeCategory)

  // Group templates by category for "All" view or just show list
  // The design shows a specific category header "Eye-Catchers" enabled. 
  // Let's implement a simple filtered list first, but if All is selected, maybe we show all?
  // The image implies we filter by clicking pills.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl bg-background border-border">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background z-10">
          <DialogTitle className="text-xl font-semibold">Select a Template</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 bg-muted/20">
          {/* Category Pills */}
          <div className="px-6 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-background border-b">
            {TEMPLATE_CATEGORIES.map(category => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-full px-4 h-8 text-sm font-medium transition-all",
                  activeCategory === category 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Templates Grid - Native Scroll */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
             <div className="space-y-8">
                {activeCategory !== "All" ? (
                   <div>
                      <h2 className="text-2xl font-bold mb-6 text-foreground">{activeCategory}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredTemplates.map(template => (
                           <TemplateCard 
                              key={template.id} 
                              template={template} 
                              isSelected={selectedTemplateId === template.id} 
                              onSelect={() => {
                                onSelectTemplate(template.id)
                                onOpenChange(false)
                              }}
                           />
                        ))}
                      </div>
                   </div>
                ) : (
                    // For "All", we could list all categories or just a big grid. 
                    // Let's show a big grid for now for simplicity, or we can iterate categories.
                    // Let's iterate categories to match the likely expected behavior of "browsing all" if not specified.
                    // Actually, typically "All" just dumps everything in a grid.
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {TEMPLATES.map(template => (
                           <TemplateCard 
                              key={template.id} 
                              template={template} 
                              isSelected={selectedTemplateId === template.id} 
                              onSelect={() => {
                                onSelectTemplate(template.id)
                                onOpenChange(false)
                              }}
                           />
                        ))}
                    </div>
                )}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TemplateCard({ template, isSelected, onSelect }: { template: TemplateOption, isSelected: boolean, onSelect: () => void }) {
  return (
    <div 
      onClick={onSelect}
      className={cn(
        "group relative cursor-pointer rounded-xl bg-card transition-all duration-200 overflow-hidden border-2 flex flex-col h-full",
        isSelected 
          ? "border-primary ring-4 ring-primary/10 shadow-lg scale-[1.02]" 
          : "border-border shadow-sm hover:shadow-xl hover:border-primary/50 hover:-translate-y-1"
      )}
    >
       {/* Preview Image Placeholder */}
       <div className={cn(
          "aspect-[1/1.414] w-full relative overflow-hidden",
          template.thumbnailBg
       )}>
          {/* Mock Document visuals */}
          <div className="absolute top-4 left-4 right-4 h-full bg-background shadow-sm rounded-t-sm p-3 opacity-90 transform origin-top hover:scale-[1.02] transition-transform duration-500">
              <div className="h-4 w-2/3 bg-slate-800 rounded mb-2 opacity-20" />
              <div className="h-2 w-1/3 bg-blue-500 rounded mb-4 opacity-20" />
              <div className="space-y-1">
                 <div className="h-1 w-full bg-slate-200 rounded" />
                 <div className="h-1 w-full bg-slate-200 rounded" />
                 <div className="h-1 w-3/4 bg-slate-200 rounded" />
              </div>
          </div>
          
          {/* Selected Overlay */}
          {isSelected && (
            <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center backdrop-blur-[1px]">
               <div className="bg-white rounded-full p-2 shadow-xl animate-in zoom-in spin-in-90 duration-300">
                 <CheckCircle2 className="h-8 w-8 text-primary fill-primary-foreground/20" />
               </div>
            </div>
          )}
       </div>

       {/* Content */}
       <div className="p-4 flex flex-col flex-1 border-t">
          <div className="flex justify-between items-start mb-2">
            <h3 className={cn("font-bold text-lg", isSelected ? "text-primary" : "text-foreground")}>{template.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
       </div>
    </div>
  )
}
