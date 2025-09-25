"use client"

import type React from "react"

import { useEffect, useState } from "react"
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

interface FormContent {
  weatherConditions?: string
  windSpeed?: string
  dustControlMeasures?: string[]
  notes?: string
  inspectionType?: string
  rainfall?: string
  bmpConditions?: string[]
  correctiveActions?: string
  findings?: string[]
}

interface Form {
  id: string
  type: string
  project: {
    id: string
    name: string
  }
  submittedBy: string
  submittedDate: string
  status: "completed" | "pending" | "draft"
  content: FormContent
}

export default function EditFormPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formContent, setFormContent] = useState<FormContent>({})
  const [formStatus, setFormStatus] = useState<"completed" | "pending" | "draft">("draft")

  useEffect(() => {
    const fetchForm = async () => {
      setIsLoading(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock form data based on ID
      let mockForm: Form

      if (params.id === "1") {
        mockForm = {
          id: "1",
          type: "Dust Control Log",
          project: {
            id: "1",
            name: "Downtown High-Rise",
          },
          submittedBy: "John Smith",
          submittedDate: "2024-03-02",
          status: "completed",
          content: {
            weatherConditions: "Sunny, 75°F",
            windSpeed: "5-10 mph",
            dustControlMeasures: [
              "Water truck used on unpaved areas",
              "Covered stockpiles",
              "Reduced vehicle speed on site",
              "Stabilized construction entrance/exit",
            ],
            notes:
              "Additional water applied to north section of site due to increased wind in the afternoon. No visible dust leaving the site boundary.",
          },
        }
      } else if (params.id === "2") {
        mockForm = {
          id: "2",
          type: "SWPPP Inspection",
          project: {
            id: "2",
            name: "Riverside Apartments",
          },
          submittedBy: "Mike Johnson",
          submittedDate: "2024-03-01",
          status: "completed",
          content: {
            rainfall: "0.5 inches in last 24 hours",
            inspectionType: "Post-Rain Event",
            bmpConditions: [
              "Silt fences intact and functional",
              "Inlet protection in place",
              "Stabilized construction entrance maintained",
              "Sediment basins at 40% capacity",
            ],
            correctiveActions: "Minor repair needed on north silt fence. Scheduled for tomorrow.",
          },
        }
      } else if (params.id === "3") {
        mockForm = {
          id: "3",
          type: "Safety Inspection",
          project: {
            id: "1",
            name: "Downtown High-Rise",
          },
          submittedBy: "Jane Doe",
          submittedDate: "2024-02-29",
          status: "pending",
          content: {
            findings: [
              "All workers wearing proper PPE",
              "Scaffolding properly secured",
              "Fire extinguishers accessible",
              "Trip hazards identified near material storage",
            ],
            correctiveActions: "Trip hazards to be removed by end of day. Follow-up inspection scheduled.",
          },
        }
      } else {
        // Default form if ID doesn't match any of the above
        mockForm = {
          id: params.id,
          type: "Dust Control Log",
          project: {
            id: "1",
            name: "Downtown High-Rise",
          },
          submittedBy: "John Smith",
          submittedDate: new Date().toISOString().split("T")[0],
          status: "draft",
          content: {
            weatherConditions: "",
            windSpeed: "",
            dustControlMeasures: [],
            notes: "",
          },
        }
      }

      setForm(mockForm)
      setFormContent(mockForm.content)
      setFormStatus(mockForm.status)
      setIsLoading(false)
    }

    fetchForm()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Show loading toast
      toast({
        title: "Saving form...",
        description: "Please wait while we save your changes.",
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Success toast
      toast({
        title: "Form updated",
        description: "Your form has been updated successfully.",
      })

      setIsSaving(false)
      router.push(`/dashboard/forms/${params.id}`)
    } catch (error) {
      console.error("Error saving form:", error)
      toast({
        title: "Error",
        description: "There was a problem saving your form. Please try again.",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormContent((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleListChange = (field: string, value: string) => {
    // Convert comma-separated string to array
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "")

    setFormContent((prev) => ({
      ...prev,
      [field]: items,
    }))
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h3 className="mt-4 text-lg font-semibold">Form not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The form you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/dashboard/forms" className="mt-4">
            <Button variant="outline">Back to Forms</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/forms/${params.id}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit {form.type}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
            <CardDescription>Edit the details for this {form.type}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Project</Label>
                <Input value={form.project.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Form Type</Label>
                <Input value={form.type} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formStatus}
                onValueChange={(value: "completed" | "pending" | "draft") => setFormStatus(value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === "Dust Control Log" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weatherConditions">Weather Conditions</Label>
                    <Input
                      id="weatherConditions"
                      value={formContent.weatherConditions || ""}
                      onChange={(e) => handleInputChange("weatherConditions", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="windSpeed">Wind Speed</Label>
                    <Input
                      id="windSpeed"
                      value={formContent.windSpeed || ""}
                      onChange={(e) => handleInputChange("windSpeed", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dustControlMeasures">Dust Control Measures</Label>
                  <Textarea
                    id="dustControlMeasures"
                    value={formContent.dustControlMeasures?.join(", ") || ""}
                    onChange={(e) => handleListChange("dustControlMeasures", e.target.value)}
                    placeholder="Enter measures separated by commas"
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">Enter measures separated by commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formContent.notes || ""}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </>
            )}

            {form.type === "SWPPP Inspection" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rainfall">Rainfall</Label>
                    <Input
                      id="rainfall"
                      value={formContent.rainfall || ""}
                      onChange={(e) => handleInputChange("rainfall", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inspectionType">Inspection Type</Label>
                    <Select
                      value={formContent.inspectionType || ""}
                      onValueChange={(value) => handleInputChange("inspectionType", value)}
                    >
                      <SelectTrigger id="inspectionType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Routine Weekly">Routine Weekly</SelectItem>
                        <SelectItem value="Post-Rain Event">Post-Rain Event</SelectItem>
                        <SelectItem value="Complaint Response">Complaint Response</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bmpConditions">BMP Conditions</Label>
                  <Textarea
                    id="bmpConditions"
                    value={formContent.bmpConditions?.join(", ") || ""}
                    onChange={(e) => handleListChange("bmpConditions", e.target.value)}
                    placeholder="Enter conditions separated by commas"
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">Enter conditions separated by commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correctiveActions">Corrective Actions</Label>
                  <Textarea
                    id="correctiveActions"
                    value={formContent.correctiveActions || ""}
                    onChange={(e) => handleInputChange("correctiveActions", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </>
            )}

            {form.type === "Safety Inspection" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="findings">Findings</Label>
                  <Textarea
                    id="findings"
                    value={formContent.findings?.join(", ") || ""}
                    onChange={(e) => handleListChange("findings", e.target.value)}
                    placeholder="Enter findings separated by commas"
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">Enter findings separated by commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correctiveActions">Corrective Actions</Label>
                  <Textarea
                    id="correctiveActions"
                    value={formContent.correctiveActions || ""}
                    onChange={(e) => handleInputChange("correctiveActions", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push(`/dashboard/forms/${params.id}`)} type="button">
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

