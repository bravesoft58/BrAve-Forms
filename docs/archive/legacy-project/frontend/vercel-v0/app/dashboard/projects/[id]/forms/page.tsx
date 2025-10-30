"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import {
  ChevronLeft,
  FileText,
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Filter,
  ArrowDown,
  ArrowUp,
  Calendar,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
// Import the downloadFormPDF function
import { downloadFormPDF } from "@/lib/pdf-generator"

interface Form {
  id: string
  type: string
  submittedBy: string
  submittedDate: string
  status: "completed" | "pending" | "draft"
  content?: any
}

interface Project {
  id: string
  name: string
  address: string
  forms: Form[]
}

export default function ProjectFormsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [filteredForms, setFilteredForms] = useState<Form[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  useEffect(() => {
    const fetchProject = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock project data
      const mockProject: Project = {
        id: params.id,
        name: "Downtown High-Rise",
        address: "123 Main St, Cityville",
        forms: [
          {
            id: "1",
            type: "Dust Control Log",
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
          },
          {
            id: "2",
            type: "SWPPP Inspection",
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
          },
          {
            id: "3",
            type: "Safety Inspection",
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
          },
          {
            id: "4",
            type: "Dust Control Log",
            submittedBy: "John Smith",
            submittedDate: "2024-02-28",
            status: "completed",
            content: {
              weatherConditions: "Partly cloudy, 70°F",
              windSpeed: "3-8 mph",
              dustControlMeasures: [
                "Water truck used on unpaved areas",
                "Covered stockpiles",
                "Reduced vehicle speed on site",
              ],
              notes: "No dust issues observed today.",
            },
          },
          {
            id: "5",
            type: "SWPPP Inspection",
            submittedBy: "Mike Johnson",
            submittedDate: "2024-02-25",
            status: "draft",
            content: {
              rainfall: "0.0 inches in last 24 hours",
              inspectionType: "Routine Weekly",
              bmpConditions: [
                "Silt fences intact and functional",
                "Inlet protection in place",
                "Stabilized construction entrance maintained",
              ],
              correctiveActions: "No corrective actions needed at this time.",
            },
          },
        ],
      }

      setProject(mockProject)
      setFilteredForms(mockProject.forms)
      setIsLoading(false)
    }

    fetchProject()
  }, [params.id])

  useEffect(() => {
    if (!project) return

    // Filter forms based on search query and type filter
    let filtered = [...project.forms]

    if (searchQuery) {
      filtered = filtered.filter(
        (form) =>
          form.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          form.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((form) => form.type === typeFilter)
    }

    // Sort forms if a sort field is selected
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField as keyof Form]
        const bValue = b[sortField as keyof Form]

        // Handle string comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        // Handle date comparison
        if (sortField === "submittedDate") {
          return sortDirection === "asc"
            ? new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime()
            : new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
        }

        if (sortField === "status") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        return 0
      })
    }

    setFilteredForms(filtered)
  }, [searchQuery, typeFilter, project, sortField, sortDirection])

  // Replace the handleDownloadForm function with this implementation
  const handleDownloadForm = async (formId: string) => {
    if (!project) return

    setDownloadingFormId(formId)

    try {
      // Find the form
      const form = project.forms.find((f) => f.id === formId)
      if (!form) {
        throw new Error("Form not found")
      }

      // Create form object with project info
      const formWithProject = {
        ...form,
        project: {
          id: project.id,
          name: project.name,
        },
      }

      toast({
        title: "Generating PDF",
        description: "Your PDF is being generated and will download shortly.",
      })

      // Download the PDF
      await downloadFormPDF(formWithProject)

      toast({
        title: "Download Complete",
        description: "Your PDF has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error downloading form:", error)
      toast({
        title: "Download Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingFormId(null)
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
          <FileText className="h-10 w-10 text-muted-foreground" />
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

  // Get unique form types for filter
  const formTypes = Array.from(new Set(project.forms.map((form) => form.type)))

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/projects/${project.id}`}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name} Forms</h1>
            <p className="text-muted-foreground">Manage and access all forms for this project</p>
          </div>
        </div>
        {(user?.role === "admin" || user?.role === "foreman") && (
          <Link href={`/dashboard/forms/new?projectId=${project.id}`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Form
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search forms..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="w-[180px]">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {formTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Project Forms</CardTitle>
          <CardDescription>All forms and logs for {project.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredForms.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 px-4 py-2 font-medium text-sm border-b">
                <div className="flex items-center cursor-pointer hover:text-primary" onClick={() => handleSort("type")}>
                  Type
                  {sortField === "type" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
                <div
                  className="flex items-center cursor-pointer hover:text-primary"
                  onClick={() => handleSort("submittedDate")}
                >
                  Date
                  {sortField === "submittedDate" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
                <div
                  className="flex items-center cursor-pointer hover:text-primary"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {sortField === "status" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </div>

              {filteredForms.map((form) => (
                <div key={form.id} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-medium">{form.type}</p>
                      <p className="text-sm text-muted-foreground">By {form.submittedBy}</p>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{form.submittedDate}</span>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          form.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : form.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {form.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/forms/${form.id}`}>View</Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/forms/${form.id}`}>View Form</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDownloadForm(form.id)}
                          disabled={downloadingFormId === form.id}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {downloadingFormId === form.id ? "Downloading..." : "Download PDF"}
                        </DropdownMenuItem>
                        {(user?.role === "admin" || user?.role === "foreman") && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/forms/${form.id}/edit`}>Edit Form</Link>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No forms found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || typeFilter !== "all"
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "This project doesn't have any forms yet."}
              </p>
              {(user?.role === "admin" || user?.role === "foreman") && (
                <Link href="/dashboard/forms/new" className="mt-4">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Form
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

