"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft } from "lucide-react"

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update the handleSubmit function to simulate adding a new project to the list
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Get form data
    const formData = new FormData(e.currentTarget)
    const projectName = formData.get("name") as string
    const projectAddress = formData.get("address") as string
    const projectStartDate = formData.get("startDate") as string
    const projectStatus = formData.get("status") as string
    const projectDescription = formData.get("description") as string

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Store the new project in localStorage to simulate persistence
    try {
      // Get existing projects or initialize empty array
      const existingProjects = localStorage.getItem("projects")
        ? JSON.parse(localStorage.getItem("projects") || "[]")
        : []

      // Create new project object
      const newProject = {
        id: (existingProjects.length + 1).toString(),
        name: projectName,
        address: projectAddress,
        status: projectStatus || "active",
        startDate: projectStartDate,
        lastUpdated: new Date().toISOString().split("T")[0],
        isFavorite: false,
      }

      // Add to projects array
      existingProjects.push(newProject)

      // Save back to localStorage
      localStorage.setItem("projects", JSON.stringify(existingProjects))

      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      })
    } catch (error) {
      console.error("Error saving project:", error)
      toast({
        title: "Error creating project",
        description: "There was a problem creating your project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      router.push("/dashboard/projects")
    }
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/projects">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Enter the details for your new construction project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" placeholder="Enter project name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Project Address</Label>
              <Input id="address" placeholder="Enter project address" required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Expected End Date</Label>
                <Input id="endDate" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Project Status</Label>
              <Select defaultValue="pending">
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
              <Textarea id="description" placeholder="Enter project description" className="min-h-[100px]" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Project Team</Label>
              <Select>
                <SelectTrigger id="team">
                  <SelectValue placeholder="Add team members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Smith (Project Manager)</SelectItem>
                  <SelectItem value="jane">Jane Doe (Site Supervisor)</SelectItem>
                  <SelectItem value="mike">Mike Johnson (Environmental Inspector)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">You can add more team members after creating the project</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push("/dashboard/projects")} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

