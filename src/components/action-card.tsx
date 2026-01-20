import { Card } from "@/components/ui/card"
import { LucideIcon, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionCardProps {
  icon: LucideIcon
  title: string
  description: string
  color: "purple" | "blue" | "green" | "orange"
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function ActionCard({ icon: Icon, title, description, color, selected, onClick, className }: ActionCardProps) {
  const colorMap = {
    purple: "bg-purple-600",
    blue: "bg-blue-600",
    green: "bg-green-600",
    orange: "bg-orange-600",
  }

  const borderColorMap = {
    purple: "border-purple-600 ring-purple-600",
    blue: "border-blue-600 ring-blue-600",
    green: "border-green-600 ring-green-600",
    orange: "border-orange-600 ring-orange-600",
    default: "border-border/50 hover:border-muted-foreground/50",
  }

  const iconColorMap = {
      purple: "text-purple-600",
      blue: "text-blue-600",
      green: "text-green-600",
      orange: "text-orange-600",
  }
  
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group relative flex flex-row md:flex-col items-center text-left md:text-center p-6 gap-6 transition-all cursor-pointer bg-card/50 backdrop-blur-sm border-2",
        selected ? borderColorMap[color] : borderColorMap.default,
        selected && "bg-accent/5",
        className
      )}
    >
        {selected && (
            <div className={cn("absolute top-4 right-4 rounded-full p-1", colorMap[color])}>
                <Check className="w-4 h-4 text-white" />
            </div>
        )}

       <div className={cn("p-4 rounded-xl text-white shadow-lg shrink-0", colorMap[color])}>
         <Icon className="h-6 w-6 md:h-8 md:w-8" />
       </div>
       <div className="space-y-1">
         <h3 className="font-semibold text-lg">{title}</h3>
         <p className="text-sm text-muted-foreground">{description}</p>
       </div>
    </Card>
  )
}
