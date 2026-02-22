"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Box, ChevronDown, LayoutDashboard, 
  FileText, Mic, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"

export function Navbar() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">

      <Link href="/" className="flex items-center gap-2">
        <Box className="h-6 w-6" />
        <span className="text-xl font-bold">HiredFast</span>
      </Link>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        {/* Loading skeleton */}
        {loading && (
          <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
        )}

        {/* Unauthenticated */}
        {!loading && !user && (
          <Link href="/auth/login">
            <Button className="bg-blue-600 font-medium hover:bg-blue-700 text-white">
              Login
            </Button>
          </Link>
        )}

        {/* Authenticated */}
        {!loading && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-accent transition-colors outline-none">
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? "User"}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-bold text-white">
                      {user.displayName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) ?? "U"}
                    </span>
                  )}
                </div>

                <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">
                  {user.displayName?.split(" ")[0]}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              {/* User info */}
              <div className="px-3 py-2 border-b mb-1">
                <p className="text-sm font-medium truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>

              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/dashboard/resumes" className="cursor-pointer gap-2">
                  <FileText className="h-4 w-4" />
                  My Resumes
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/dashboard/interviews" className="cursor-pointer gap-2">
                  <Mic className="h-4 w-4" />
                  Interview History
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
