"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft } from "lucide-react"

export default function NewFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectIdParam = searchParams.get("projectId")
  const { toast } = useToast()
  const [formType, setFormType] = useState("dust-control")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProject, setSelectedProject] = useState(projectIdParam || "")

  // Update the handleSubmit function to simulate adding a new form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Get form data
    const formData = new FormData(e.currentTarget)
    const projectId = formData.get("project") as string
    const formType = formData.get("type") as string

    // Get project name based on project ID
    let projectName = "Unknown Project"
    if (projectId === "1") projectName = "Downtown High-Rise"
    else if (projectId === "2") projectName = "Riverside Apartments"
    else if (projectId === "3") projectName = "Central Park Renovation"

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Store the new form in localStorage to simulate persistence
    try {
      // Get existing forms or initialize empty array
      const existingForms = localStorage.getItem("forms") ? JSON.parse(localStorage.getItem("forms") || "[]") : []

      // Create new form object
      const newForm = {
        id: (existingForms.length + 1).toString(),
        projectId: projectId,
        projectName: projectName,
        type: formType,
        date: new Date().toISOString().split("T")[0],
        updatedBy: "Current User",
        status: "draft",
      }

      // Add to forms array
      existingForms.push(newForm)

      // Save back to localStorage
      localStorage.setItem("forms", JSON.stringify(existingForms))

      toast({
        title: "Form created",
        description: "Your new form has been created successfully.",
      })
    } catch (error) {
      console.error("Error saving form:", error)
      toast({
        title: "Error creating form",
        description: "There was a problem creating your form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      router.push("/dashboard/forms")
    }
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/forms">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New Form</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
            <CardDescription>Create a new environmental log or inspection form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select required name="project" value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Downtown High-Rise</SelectItem>
                  <SelectItem value="2">Riverside Apartments</SelectItem>
                  <SelectItem value="3">Central Park Renovation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Form Type</Label>
              <Select value={formType} onValueChange={setFormType} required name="type">
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select form type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dust-control">Dust Control Log</SelectItem>
                  <SelectItem value="swppp">SWPPP Inspection</SelectItem>
                  <SelectItem value="safety">Safety Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formType === "dust-control" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weather">Weather Conditions</Label>
                    <Input id="weather" placeholder="Enter weather conditions" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wind">Wind Speed</Label>
                    <Input id="wind" placeholder="Enter wind speed" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measures">Dust Control Measures</Label>
                  <Textarea
                    id="measures"
                    placeholder="List all dust control measures implemented"
                    className="min-h-[100px]"
                    required
                  />
                </div>
              </>
            )}

            {formType === "swppp" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rainfall">Recent Rainfall</Label>
                    <Input id="rainfall" placeholder="Enter rainfall amount" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inspection-type">Inspection Type</Label>
                    <Select required>
                      <SelectTrigger id="inspection-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine Weekly</SelectItem>
                        <SelectItem value="rain">Rain Event</SelectItem>
                        <SelectItem value="complaint">Complaint Response</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bmp-conditions">BMP Conditions</Label>
                  <Textarea
                    id="bmp-conditions"
                    placeholder="Describe the conditions of BMPs"
                    className="min-h-[100px]"
                    required
                  />
                </div>
              </>
            )}

            {formType === "safety" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="inspection-areas">Areas Inspected</Label>
                  <Input id="inspection-areas" placeholder="Enter areas inspected" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="findings">Inspection Findings</Label>
                  <Textarea
                    id="findings"
                    placeholder="List all findings and observations"
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actions">Corrective Actions</Label>
                  <Textarea
                    id="actions"
                    placeholder="Describe any required corrective actions"
                    className="min-h-[100px]"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" placeholder="Enter any additional notes or comments" className="min-h-[100px]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photos">Photos</Label>
              <Input id="photos" type="file" multiple accept="image/*" />
              <p className="text-sm text-muted-foreground">Upload photos related to this form (optional)</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push("/dashboard/forms")} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Form"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

