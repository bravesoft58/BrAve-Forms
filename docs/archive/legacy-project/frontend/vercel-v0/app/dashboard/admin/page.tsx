"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, FileText, FolderOpen } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AdminSystemSettings } from "@/components/admin/system-settings"
import { AdminSecuritySettings } from "@/components/admin/security-settings"

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    pendingApprovals: 0,
    systemHealth: "Good",
  })

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    // Simulate API call to fetch admin dashboard data
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock data
      setStats({
        totalUsers: 24,
        activeProjects: 12,
        pendingApprovals: 5,
        systemHealth: "Good",
      })

      setIsLoading(false)
    }

    fetchData()
  }, [user?.role, router])

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and administrative controls</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemHealth}</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="mt-8">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage system users and permissions</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/dashboard/users">View All Users</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Recent User Activity</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>New user registration</span>
                      <span className="text-muted-foreground">Today</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Role change: Jane Doe (Foreman → Admin)</span>
                      <span className="text-muted-foreground">Yesterday</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>User deactivated: Mike Johnson</span>
                      <span className="text-muted-foreground">3 days ago</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Quick Actions</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/users/new">Add User</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/users">Manage Roles</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/users">View Inactive Users</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4 space-y-4">
          <AdminSystemSettings />
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <AdminSecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

