"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Download,
  Copy,
  ArrowDown,
  ArrowUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
// Import the downloadFormPDF function
import { downloadFormPDF } from "@/lib/pdf-generator"

type Form = {
  id: string
  projectId: string
  projectName: string
  type: string
  date: string
  updatedBy: string
  status: "completed" | "pending" | "draft"
  content?: any
}

export default function FormsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [forms, setForms] = useState<Form[]>([])
  const [filteredForms, setFilteredForms] = useState<Form[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call to fetch data
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Try to get forms from localStorage first
      let formsData: Form[] = []

      try {
        const storedForms = localStorage.getItem("forms")
        if (storedForms) {
          formsData = JSON.parse(storedForms)
        }
      } catch (error) {
        console.error("Error loading forms from localStorage:", error)
      }

      // If no forms in localStorage or error occurred, use mock data
      if (!formsData || formsData.length === 0) {
        // Mock data
        formsData = [
          {
            id: "1",
            projectId: "1",
            projectName: "Downtown High-Rise",
            type: "Dust Control",
            date: "2023-05-15",
            updatedBy: "John Smith",
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
            projectId: "2",
            projectName: "Riverside Apartments",
            type: "SWPPP",
            date: "2023-05-14",
            updatedBy: "Jane Doe",
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
            projectId: "1",
            projectName: "Downtown High-Rise",
            type: "Safety Inspection",
            date: "2023-05-13",
            updatedBy: "John Smith",
            status: "completed",
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
            projectId: "3",
            projectName: "Central Park Renovation",
            type: "Dust Control",
            date: "2023-05-12",
            updatedBy: "Mike Johnson",
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
            projectId: "4",
            projectName: "Harbor Bridge Repair",
            type: "SWPPP",
            date: "2023-05-11",
            updatedBy: "Sarah Williams",
            status: "pending",
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
          {
            id: "6",
            projectId: "1",
            projectName: "Downtown High-Rise",
            type: "Dust Control",
            date: "2023-05-10",
            updatedBy: "John Smith",
            status: "completed",
            content: {
              weatherConditions: "Sunny, 78°F",
              windSpeed: "10-15 mph",
              dustControlMeasures: [
                "Water truck used on unpaved areas",
                "Covered stockpiles",
                "Reduced vehicle speed on site",
                "Stabilized construction entrance/exit",
              ],
              notes: "Increased watering frequency due to high winds.",
            },
          },
          {
            id: "7",
            projectId: "7",
            projectName: "City Center Office Tower",
            type: "Safety Inspection",
            date: "2023-05-09",
            updatedBy: "Robert Brown",
            status: "draft",
            content: {
              findings: [
                "All workers wearing proper PPE",
                "Scaffolding properly secured",
                "Fire extinguishers accessible",
              ],
              correctiveActions: "Draft report - to be completed.",
            },
          },
          {
            id: "8",
            projectId: "3",
            projectName: "Central Park Renovation",
            type: "SWPPP",
            date: "2023-05-08",
            updatedBy: "Mike Johnson",
            status: "completed",
            content: {
              rainfall: "0.25 inches in last 24 hours",
              inspectionType: "Post-Rain Event",
              bmpConditions: [
                "Silt fences intact and functional",
                "Inlet protection in place",
                "Stabilized construction entrance maintained",
              ],
              correctiveActions: "No issues found.",
            },
          },
        ]
      }

      setForms(formsData)
      setFilteredForms(formsData)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Filter forms based on search query and type filter
    let filtered = [...forms]

    if (searchQuery) {
      filtered = filtered.filter(
        (form) =>
          form.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          form.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          form.updatedBy.toLowerCase().includes(searchQuery.toLowerCase()),
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
        if (sortField === "date") {
          return sortDirection === "asc"
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime()
        }

        return 0
      })
    }

    setFilteredForms(filtered)
  }, [searchQuery, typeFilter, forms, sortField, sortDirection])

  const handleCopyForm = (id: string) => {
    const form = forms.find((f) => f.id === id)
    if (form) {
      toast({
        title: "Form copied",
        description: `A copy of ${form.type} for ${form.projectName} has been created.`,
      })
    }
  }

  // Replace the handleDownloadForm function with this implementation
  const handleDownloadForm = async (id: string) => {
    setDownloadingFormId(id)

    try {
      // Find the form
      const form = forms.find((f) => f.id === id)
      if (!form) {
        throw new Error("Form not found")
      }

      // Create form object with project info
      const formWithProject = {
        ...form,
        project: {
          id: form.projectId,
          name: form.projectName,
        },
        submittedBy: form.updatedBy,
        submittedDate: form.date,
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Get unique form types for filter
  const formTypes = Array.from(new Set(forms.map((form) => form.type)))

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <p className="text-muted-foreground">Manage and access all your environmental logs and forms</p>
        </div>
        {(user?.role === "admin" || user?.role === "foreman") && (
          <Link href="/dashboard/forms/new">
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

      <div className="mt-6 rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center">
                    Form Type
                    {sortField === "type" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("projectName")}
                >
                  <div className="flex items-center">
                    Project
                    {sortField === "projectName" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center">
                    Date
                    {sortField === "date" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("updatedBy")}
                >
                  <div className="flex items-center">
                    Updated By
                    {sortField === "updatedBy" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === "status" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.map((form) => (
                <tr key={form.id} className="border-b">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>{form.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/projects/${form.projectId}`} className="hover:underline">
                      {form.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{form.date}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{form.updatedBy}</td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 text-right">
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
                        <DropdownMenuItem>
                          <Link href={`/dashboard/forms/${form.id}`} className="flex w-full">
                            View Form
                          </Link>
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
                            <DropdownMenuItem onClick={() => handleCopyForm(form.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy as Template
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/dashboard/forms/${form.id}/edit`} className="flex w-full">
                                Edit Form
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredForms.length === 0 && (
        <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No forms found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || typeFilter !== "all"
              ? "Try adjusting your search or filter to find what you're looking for."
              : "Get started by creating your first form."}
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
    </div>
  )
}

