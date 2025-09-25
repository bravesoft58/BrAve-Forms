"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FileText, FolderOpen, Users, Settings, LogOut, Menu, Shield, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { Logo } from "@/components/ui/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NotificationDropdown } from "@/components/notification-dropdown"

export default function DashboardNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ["admin", "foreman", "inspector"],
    },
    {
      title: "Projects",
      href: "/dashboard/projects",
      icon: <FolderOpen className="h-5 w-5" />,
      roles: ["admin", "foreman", "inspector"],
    },
    {
      title: "Forms",
      href: "/dashboard/forms",
      icon: <FileText className="h-5 w-5" />,
      roles: ["admin", "foreman", "inspector"],
    },
    {
      title: "Users",
      href: "/dashboard/users",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin"],
    },
    {
      title: "Company",
      href: "/dashboard/company",
      icon: <Building className="h-5 w-5" />,
      roles: ["admin"],
    },
    {
      title: "Admin",
      href: "/dashboard/admin",
      icon: <Shield className="h-5 w-5" />,
      roles: ["admin"],
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["admin", "foreman", "inspector"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role || ""))

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center border-b px-4">
                <Logo href="/dashboard" size="lg" onClick={() => setOpen(false)} />
              </div>
              <nav className="grid gap-1 p-4">
                {filteredNavItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium ${
                      pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => {
                      setOpen(false)
                      handleLogout()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <Logo href="/dashboard" size="lg" />
        </div>
        <nav className="hidden lg:flex gap-6 ml-6">
          {filteredNavItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-2 text-sm font-medium ${
                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <NotificationDropdown />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {user?.name?.split(" ")[0] || "User"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/dashboard/profile" className="flex w-full">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/settings" className="flex w-full">
                  Settings
                </Link>
              </DropdownMenuItem>
              {user?.role === "admin" && (
                <DropdownMenuItem>
                  <Link href="/dashboard/company" className="flex w-full">
                    Company Settings
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

