"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderOpen, Plus, Search, Star, Filter, MoreHorizontal, Clock, StarOff } from "lucide-react"
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

type Project = {
  id: string
  name: string
  address: string
  status: "active" | "completed" | "pending"
  lastUpdated: string
  isFavorite: boolean
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch data
    const fetchData = async () => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Try to get projects from localStorage first
      let projectsData: Project[] = []

      try {
        const storedProjects = localStorage.getItem("projects")
        if (storedProjects) {
          projectsData = JSON.parse(storedProjects)
        }
      } catch (error) {
        console.error("Error loading projects from localStorage:", error)
      }

      // If no projects in localStorage or error occurred, use mock data
      if (!projectsData || projectsData.length === 0) {
        // Mock data
        projectsData = [
          {
            id: "1",
            name: "Downtown High-Rise",
            address: "123 Main St, Cityville",
            status: "active",
            lastUpdated: "2023-05-15",
            isFavorite: true,
          },
          {
            id: "2",
            name: "Riverside Apartments",
            address: "456 River Rd, Townsville",
            status: "active",
            lastUpdated: "2023-05-14",
            isFavorite: false,
          },
          {
            id: "3",
            name: "Central Park Renovation",
            address: "789 Park Ave, Metropolis",
            status: "active",
            lastUpdated: "2023-05-12",
            isFavorite: true,
          },
          {
            id: "4",
            name: "Harbor Bridge Repair",
            address: "101 Harbor Way, Baytown",
            status: "pending",
            lastUpdated: "2023-05-10",
            isFavorite: false,
          },
          {
            id: "5",
            name: "Mountain View Condos",
            address: "202 Summit Blvd, Highland",
            status: "completed",
            lastUpdated: "2023-04-30",
            isFavorite: false,
          },
          {
            id: "6",
            name: "Sunset Boulevard Repaving",
            address: "303 Sunset Blvd, Westside",
            status: "completed",
            lastUpdated: "2023-04-25",
            isFavorite: false,
          },
          {
            id: "7",
            name: "City Center Office Tower",
            address: "404 Business Ave, Downtown",
            status: "active",
            lastUpdated: "2023-05-08",
            isFavorite: true,
          },
          {
            id: "8",
            name: "Lakeside Park Improvements",
            address: "505 Lake Dr, Shoreline",
            status: "pending",
            lastUpdated: "2023-05-05",
            isFavorite: false,
          },
        ]
      }

      setProjects(projectsData)
      setFilteredProjects(projectsData)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Filter projects based on search query and status filter
    let filtered = [...projects]

    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter)
    }

    setFilteredProjects(filtered)
  }, [searchQuery, statusFilter, projects])

  const toggleFavorite = (id: string) => {
    const updatedProjects = projects.map((project) =>
      project.id === id ? { ...project, isFavorite: !project.isFavorite } : project,
    )

    setProjects(updatedProjects)

    const project = projects.find((p) => p.id === id)
    if (project) {
      toast({
        title: project.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `${project.name} has been ${project.isFavorite ? "removed from" : "added to"} your favorites.`,
      })
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage and access all your construction projects</p>
        </div>
        {(user?.role === "admin" || user?.role === "foreman") && (
          <Link href="/dashboard/projects/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="w-[180px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProjects.map((project) => (
          <div key={project.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => toggleFavorite(project.id)} className="h-8 w-8">
                    {project.isFavorite ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">{project.isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
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
                      <DropdownMenuItem>
                        <Link href={`/dashboard/projects/${project.id}`} className="flex w-full">
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href={`/dashboard/projects/${project.id}/forms`} className="flex w-full">
                          View Forms
                        </Link>
                      </DropdownMenuItem>
                      {(user?.role === "admin" || user?.role === "foreman") && (
                        <>
                          <DropdownMenuItem>
                            <Link href={`/dashboard/projects/${project.id}/edit`} className="flex w-full">
                              Edit Project
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Generate QR Code</DropdownMenuItem>
                          {user?.role === "admin" && (
                            <DropdownMenuItem className="text-destructive">Archive Project</DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-4">
                <Link href={`/dashboard/projects/${project.id}`}>
                  <h3 className="font-semibold hover:underline">{project.name}</h3>
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{project.address}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-2 w-2 rounded-full ${
                      project.status === "active"
                        ? "bg-green-500"
                        : project.status === "pending"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                    }`}
                  />
                  <span className="text-xs capitalize">{project.status}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Updated {project.lastUpdated}</span>
                </div>
              </div>
            </div>
            <div className="flex border-t">
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="flex flex-1 items-center justify-center py-2 text-xs font-medium hover:bg-muted"
              >
                View Details
              </Link>
              <div className="border-l" />
              <Link
                href={`/dashboard/projects/${project.id}/forms`}
                className="flex flex-1 items-center justify-center py-2 text-xs font-medium hover:bg-muted"
              >
                View Forms
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filter to find what you're looking for."
              : "Get started by creating your first project."}
          </p>
          {(user?.role === "admin" || user?.role === "foreman") && (
            <Link href="/dashboard/projects/new" className="mt-4">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

