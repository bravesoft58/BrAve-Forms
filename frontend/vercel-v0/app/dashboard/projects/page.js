"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProjectsPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const select_1 = require("@/components/ui/select");
const auth_provider_1 = require("@/components/auth-provider");
const use_toast_1 = require("@/components/ui/use-toast");
function ProjectsPage() {
    const { user } = (0, auth_provider_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [projects, setProjects] = (0, react_1.useState)([]);
    const [filteredProjects, setFilteredProjects] = (0, react_1.useState)([]);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [statusFilter, setStatusFilter] = (0, react_1.useState)("all");
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // Simulate API call to fetch data
        const fetchData = async () => {
            setIsLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Try to get projects from localStorage first
            let projectsData = [];
            try {
                const storedProjects = localStorage.getItem("projects");
                if (storedProjects) {
                    projectsData = JSON.parse(storedProjects);
                }
            }
            catch (error) {
                console.error("Error loading projects from localStorage:", error);
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
                ];
            }
            setProjects(projectsData);
            setFilteredProjects(projectsData);
            setIsLoading(false);
        };
        fetchData();
    }, []);
    (0, react_1.useEffect)(() => {
        // Filter projects based on search query and status filter
        let filtered = [...projects];
        if (searchQuery) {
            filtered = filtered.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.address.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (statusFilter !== "all") {
            filtered = filtered.filter((project) => project.status === statusFilter);
        }
        setFilteredProjects(filtered);
    }, [searchQuery, statusFilter, projects]);
    const toggleFavorite = (id) => {
        const updatedProjects = projects.map((project) => project.id === id ? { ...project, isFavorite: !project.isFavorite } : project);
        setProjects(updatedProjects);
        const project = projects.find((p) => p.id === id);
        if (project) {
            toast({
                title: project.isFavorite ? "Removed from favorites" : "Added to favorites",
                description: `${project.name} has been ${project.isFavorite ? "removed from" : "added to"} your favorites.`,
            });
        }
    };
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    return (<div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage and access all your construction projects</p>
        </div>
        {(user?.role === "admin" || user?.role === "foreman") && (<link_1.default href="/dashboard/projects/new">
            <button_1.Button className="gap-2">
              <lucide_react_1.Plus className="h-4 w-4"/>
              New Project
            </button_1.Button>
          </link_1.default>)}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <lucide_react_1.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
          <input_1.Input type="search" placeholder="Search projects..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
        </div>
        <div className="flex gap-2">
          <div className="w-[180px]">
            <select_1.Select value={statusFilter} onValueChange={setStatusFilter}>
              <select_1.SelectTrigger>
                <div className="flex items-center gap-2">
                  <lucide_react_1.Filter className="h-4 w-4"/>
                  <select_1.SelectValue placeholder="Filter by status"/>
                </div>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="all">All Projects</select_1.SelectItem>
                <select_1.SelectItem value="active">Active</select_1.SelectItem>
                <select_1.SelectItem value="pending">Pending</select_1.SelectItem>
                <select_1.SelectItem value="completed">Completed</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProjects.map((project) => (<div key={project.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <lucide_react_1.FolderOpen className="h-5 w-5 text-primary"/>
                </div>
                <div className="flex items-center gap-2">
                  <button_1.Button variant="ghost" size="icon" onClick={() => toggleFavorite(project.id)} className="h-8 w-8">
                    {project.isFavorite ? (<lucide_react_1.Star className="h-4 w-4 fill-yellow-400 text-yellow-400"/>) : (<lucide_react_1.StarOff className="h-4 w-4 text-muted-foreground"/>)}
                    <span className="sr-only">{project.isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
                  </button_1.Button>
                  <dropdown_menu_1.DropdownMenu>
                    <dropdown_menu_1.DropdownMenuTrigger asChild>
                      <button_1.Button variant="ghost" size="icon" className="h-8 w-8">
                        <lucide_react_1.MoreHorizontal className="h-4 w-4"/>
                        <span className="sr-only">More options</span>
                      </button_1.Button>
                    </dropdown_menu_1.DropdownMenuTrigger>
                    <dropdown_menu_1.DropdownMenuContent align="end">
                      <dropdown_menu_1.DropdownMenuLabel>Actions</dropdown_menu_1.DropdownMenuLabel>
                      <dropdown_menu_1.DropdownMenuSeparator />
                      <dropdown_menu_1.DropdownMenuItem>
                        <link_1.default href={`/dashboard/projects/${project.id}`} className="flex w-full">
                          View Details
                        </link_1.default>
                      </dropdown_menu_1.DropdownMenuItem>
                      <dropdown_menu_1.DropdownMenuItem>
                        <link_1.default href={`/dashboard/projects/${project.id}/forms`} className="flex w-full">
                          View Forms
                        </link_1.default>
                      </dropdown_menu_1.DropdownMenuItem>
                      {(user?.role === "admin" || user?.role === "foreman") && (<>
                          <dropdown_menu_1.DropdownMenuItem>
                            <link_1.default href={`/dashboard/projects/${project.id}/edit`} className="flex w-full">
                              Edit Project
                            </link_1.default>
                          </dropdown_menu_1.DropdownMenuItem>
                          <dropdown_menu_1.DropdownMenuItem>Generate QR Code</dropdown_menu_1.DropdownMenuItem>
                          {user?.role === "admin" && (<dropdown_menu_1.DropdownMenuItem className="text-destructive">Archive Project</dropdown_menu_1.DropdownMenuItem>)}
                        </>)}
                    </dropdown_menu_1.DropdownMenuContent>
                  </dropdown_menu_1.DropdownMenu>
                </div>
              </div>
              <div className="mt-4">
                <link_1.default href={`/dashboard/projects/${project.id}`}>
                  <h3 className="font-semibold hover:underline">{project.name}</h3>
                </link_1.default>
                <p className="mt-1 text-sm text-muted-foreground">{project.address}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-2 w-2 rounded-full ${project.status === "active"
                ? "bg-green-500"
                : project.status === "pending"
                    ? "bg-yellow-500"
                    : "bg-gray-500"}`}/>
                  <span className="text-xs capitalize">{project.status}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <lucide_react_1.Clock className="h-3 w-3"/>
                  <span>Updated {project.lastUpdated}</span>
                </div>
              </div>
            </div>
            <div className="flex border-t">
              <link_1.default href={`/dashboard/projects/${project.id}`} className="flex flex-1 items-center justify-center py-2 text-xs font-medium hover:bg-muted">
                View Details
              </link_1.default>
              <div className="border-l"/>
              <link_1.default href={`/dashboard/projects/${project.id}/forms`} className="flex flex-1 items-center justify-center py-2 text-xs font-medium hover:bg-muted">
                View Forms
              </link_1.default>
            </div>
          </div>))}
      </div>

      {filteredProjects.length === 0 && (<div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <lucide_react_1.FolderOpen className="h-10 w-10 text-muted-foreground"/>
          </div>
          <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Get started by creating your first project."}
          </p>
          {(user?.role === "admin" || user?.role === "foreman") && (<link_1.default href="/dashboard/projects/new" className="mt-4">
              <button_1.Button className="gap-2">
                <lucide_react_1.Plus className="h-4 w-4"/>
                New Project
              </button_1.Button>
            </link_1.default>)}
        </div>)}
    </div>);
}
//# sourceMappingURL=page.js.map