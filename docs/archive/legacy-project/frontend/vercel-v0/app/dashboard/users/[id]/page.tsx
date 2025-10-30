"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import {
  ChevronLeft,
  User,
  Mail,
  Building,
  UserCog,
  Calendar,
  FileText,
  Clock,
  Shield,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react"

interface UserDetails {
  id: string
  name: string
  email: string
  role: "admin" | "foreman" | "inspector"
  company: string
  lastActive: string
  status: "active" | "inactive"
  joinDate: string
  projects: {
    id: string
    name: string
    role: string
  }[]
  recentActivity: {
    id: string
    type: string
    description: string
    date: string
  }[]
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if logged in user is admin
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    const fetchUserDetails = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock user data
      const mockUser: UserDetails = {
        id: params.id,
        name:
          params.id === "1"
            ? "John Smith"
            : params.id === "2"
              ? "Jane Doe"
              : params.id === "3"
                ? "Mike Johnson"
                : "User " + params.id,
        email:
          params.id === "1"
            ? "admin@example.com"
            : params.id === "2"
              ? "foreman@example.com"
              : params.id === "3"
                ? "inspector@example.com"
                : `user${params.id}@example.com`,
        role:
          params.id === "1"
            ? "admin"
            : params.id === "2"
              ? "foreman"
              : params.id === "3"
                ? "inspector"
                : (["admin", "foreman", "inspector"][Math.floor(Math.random() * 3)] as
                    | "admin"
                    | "foreman"
                    | "inspector"),
        company: "Construction Co",
        lastActive: "2024-03-02",
        status: "active",
        joinDate: "2023-01-15",
        projects: [
          {
            id: "1",
            name: "Downtown High-Rise",
            role: "Project Manager",
          },
          {
            id: "2",
            name: "Riverside Apartments",
            role: "Site Supervisor",
          },
          {
            id: "3",
            name: "Central Park Renovation",
            role: "Environmental Specialist",
          },
        ],
        recentActivity: [
          {
            id: "1",
            type: "Form Submission",
            description: "Submitted Dust Control Log for Downtown High-Rise",
            date: "2024-03-02",
          },
          {
            id: "2",
            type: "Project Access",
            description: "Accessed Riverside Apartments project details",
            date: "2024-03-01",
          },
          {
            id: "3",
            type: "Form Edit",
            description: "Updated SWPPP Inspection for Central Park Renovation",
            date: "2024-02-28",
          },
        ],
      }

      setUserDetails(mockUser)
      setIsLoading(false)
    }

    fetchUserDetails()
  }, [params.id, router, user?.role])

  const handleDeactivateUser = () => {
    if (!userDetails) return

    setUserDetails({
      ...userDetails,
      status: userDetails.status === "active" ? "inactive" : "active",
    })

    toast({
      title: `User ${userDetails.status === "active" ? "deactivated" : "activated"}`,
      description: `${userDetails.name} has been ${
        userDetails.status === "active" ? "deactivated" : "activated"
      } successfully.`,
    })
  }

  const handleDeleteUser = () => {
    if (!userDetails) return

    toast({
      title: "User deleted",
      description: `${userDetails.name} has been deleted successfully.`,
      variant: "destructive",
    })

    router.push("/dashboard/users")
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!userDetails) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <User className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">User not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The user you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/dashboard/users" className="mt-4">
            <Button variant="outline">Back to Users</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/users">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Basic information about the user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold">
                  {userDetails.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <h2 className="mt-4 text-xl font-bold">{userDetails.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCog className="h-4 w-4" />
                  <span className="capitalize">{userDetails.role}</span>
                </div>
                <span
                  className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    userDetails.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {userDetails.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{userDetails.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{userDetails.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined: {userDetails.joinDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Last active: {userDetails.lastActive}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/users/${userDetails.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit User
                  </Link>
                </Button>
                <Button
                  variant={userDetails.status === "active" ? "outline" : "default"}
                  className={`w-full ${userDetails.status === "active" ? "text-amber-600 border-amber-600" : ""}`}
                  onClick={handleDeactivateUser}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {userDetails.status === "active" ? "Deactivate User" : "Activate User"}
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleDeleteUser}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="projects">
            <TabsList>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Projects</CardTitle>
                  <CardDescription>Projects this user is assigned to</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userDetails.projects.map((project) => (
                      <div key={project.id} className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:underline">
                            {project.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">Role: {project.role}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/projects/${project.id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>User's recent actions and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userDetails.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          {activity.type === "Form Submission" ? (
                            <FileText className="h-5 w-5 text-primary" />
                          ) : activity.type === "Project Access" ? (
                            <Building className="h-5 w-5 text-primary" />
                          ) : (
                            <Edit className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.type}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Permissions</CardTitle>
                  <CardDescription>Manage what this user can access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          <span className="font-medium">Role: {userDetails.role}</span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/users/${userDetails.id}/edit`}>Change</Link>
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {userDetails.role === "admin"
                          ? "Full access to all features, including user management and system settings."
                          : userDetails.role === "foreman"
                            ? "Can manage projects, create and edit forms, and view all project data."
                            : "Read-only access to assigned projects and forms."}
                      </p>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <span className="font-medium text-amber-800 dark:text-amber-300">Changing permissions</span>
                      </div>
                      <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                        Changing a user's role will immediately affect their access to the system. Make sure the user is
                        aware of these changes before proceeding.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

