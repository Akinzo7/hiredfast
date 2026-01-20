"use client"

import Link from "next/link"
import { Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
      <Link href="#" className="flex items-center gap-2">
        <Box className="h-6 w-6" />
        <span className="text-xl font-bold">HiredFast</span>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button className="bg-blue-600 font-medium hover:bg-blue-700 text-white">Login</Button>
      </div>
    </header>
  )
}
