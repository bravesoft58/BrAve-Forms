"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface Project {
  id: string
  name: string
  address: string
  status: "active" | "completed" | "pending"
  startDate: string
  endDate: string | null
  description: string
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Check if user has permission to edit projects
    if (user?.role !== "admin" && user?.role !== "foreman") {
      router.push("/dashboard")
      return
    }

    const fetchProject = async () => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock project data
        const projectId = params.id
        const mockProject: Project = {
          id: projectId,
          name:
            projectId === "1"
              ? "Downtown High-Rise"
              : projectId === "2"
                ? "Riverside Apartments"
                : projectId === "3"
                  ? "Central Park Renovation"
                  : projectId === "4"
                    ? "Harbor Bridge Repair"
                    : `Project ${projectId}`,
          address:
            projectId === "1"
              ? "123 Main St, Cityville"
              : projectId === "2"
                ? "456 River Rd, Townsville"
                : projectId === "3"
                  ? "789 Park Ave, Metropolis"
                  : projectId === "4"
                    ? "101 Harbor Way, Baytown"
                    : `Address for Project ${projectId}`,
          status: "active",
          startDate: "2024-01-15",
          endDate: null,
          description: "A 30-story commercial building with retail space on the ground floor.",
        }

        setProject(mockProject)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching project:", error)
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [params.id, router, user?.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Project updated",
        description: "The project has been updated successfully.",
      })

      setIsSaving(false)
      router.push(`/dashboard/projects/${params.id}`)
    } catch (error) {
      console.error("Error updating project:", error)
      toast({
        title: "Error",
        description: "There was a problem updating the project. Please try again.",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h3 className="mt-4 text-lg font-semibold">Project not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The project you're looking for doesn't exist or has been archived.
          </p>
          <Link href="/dashboard/projects" className="mt-4">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/projects/${params.id}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Update the details for this project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" defaultValue={project.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Project Address</Label>
              <Input id="address" defaultValue={project.address} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" defaultValue={project.startDate} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Expected End Date</Label>
                <Input id="endDate" type="date" defaultValue={project.endDate || ""} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Project Status</Label>
              <Select defaultValue={project.status}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea id="description" defaultValue={project.description} className="min-h-[100px]" required />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push(`/dashboard/projects/${params.id}`)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

