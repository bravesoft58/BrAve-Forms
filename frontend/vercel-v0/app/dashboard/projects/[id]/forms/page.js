"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProjectFormsPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const auth_provider_1 = require("@/components/auth-provider");
const lucide_react_1 = require("lucide-react");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const select_1 = require("@/components/ui/select");
const use_toast_1 = require("@/components/ui/use-toast");
// Import the downloadFormPDF function
const pdf_generator_1 = require("@/lib/pdf-generator");
function ProjectFormsPage({ params }) {
    const { user } = (0, auth_provider_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [project, setProject] = (0, react_1.useState)(null);
    const [filteredForms, setFilteredForms] = (0, react_1.useState)([]);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [typeFilter, setTypeFilter] = (0, react_1.useState)("all");
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [sortField, setSortField] = (0, react_1.useState)(null);
    const [sortDirection, setSortDirection] = (0, react_1.useState)("asc");
    const [downloadingFormId, setDownloadingFormId] = (0, react_1.useState)(null);
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        }
        else {
            setSortField(field);
            setSortDirection("asc");
        }
    };
    (0, react_1.useEffect)(() => {
        const fetchProject = async () => {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Mock project data
            const mockProject = {
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
                            notes: "Additional water applied to north section of site due to increased wind in the afternoon. No visible dust leaving the site boundary.",
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
            };
            setProject(mockProject);
            setFilteredForms(mockProject.forms);
            setIsLoading(false);
        };
        fetchProject();
    }, [params.id]);
    (0, react_1.useEffect)(() => {
        if (!project)
            return;
        // Filter forms based on search query and type filter
        let filtered = [...project.forms];
        if (searchQuery) {
            filtered = filtered.filter((form) => form.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                form.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (typeFilter !== "all") {
            filtered = filtered.filter((form) => form.type === typeFilter);
        }
        // Sort forms if a sort field is selected
        if (sortField) {
            filtered.sort((a, b) => {
                const aValue = a[sortField];
                const bValue = b[sortField];
                // Handle string comparison
                if (typeof aValue === "string" && typeof bValue === "string") {
                    return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                // Handle date comparison
                if (sortField === "submittedDate") {
                    return sortDirection === "asc"
                        ? new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime()
                        : new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
                }
                if (sortField === "status") {
                    return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                return 0;
            });
        }
        setFilteredForms(filtered);
    }, [searchQuery, typeFilter, project, sortField, sortDirection]);
    // Replace the handleDownloadForm function with this implementation
    const handleDownloadForm = async (formId) => {
        if (!project)
            return;
        setDownloadingFormId(formId);
        try {
            // Find the form
            const form = project.forms.find((f) => f.id === formId);
            if (!form) {
                throw new Error("Form not found");
            }
            // Create form object with project info
            const formWithProject = {
                ...form,
                project: {
                    id: project.id,
                    name: project.name,
                },
            };
            toast({
                title: "Generating PDF",
                description: "Your PDF is being generated and will download shortly.",
            });
            // Download the PDF
            await (0, pdf_generator_1.downloadFormPDF)(formWithProject);
            toast({
                title: "Download Complete",
                description: "Your PDF has been downloaded successfully.",
            });
        }
        catch (error) {
            console.error("Error downloading form:", error);
            toast({
                title: "Download Failed",
                description: "There was an error generating your PDF. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setDownloadingFormId(null);
        }
    };
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    if (!project) {
        return (<div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <lucide_react_1.FileText className="h-10 w-10 text-muted-foreground"/>
          <h3 className="mt-4 text-lg font-semibold">Project not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The project you're looking for doesn't exist or has been archived.
          </p>
          <link_1.default href="/dashboard/projects" className="mt-4">
            <button_1.Button variant="outline">Back to Projects</button_1.Button>
          </link_1.default>
        </div>
      </div>);
    }
    // Get unique form types for filter
    const formTypes = Array.from(new Set(project.forms.map((form) => form.type)));
    return (<div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button_1.Button variant="outline" size="icon" asChild>
            <link_1.default href={`/dashboard/projects/${project.id}`}>
              <lucide_react_1.ChevronLeft className="h-4 w-4"/>
              <span className="sr-only">Back</span>
            </link_1.default>
          </button_1.Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name} Forms</h1>
            <p className="text-muted-foreground">Manage and access all forms for this project</p>
          </div>
        </div>
        {(user?.role === "admin" || user?.role === "foreman") && (<link_1.default href={`/dashboard/forms/new?projectId=${project.id}`}>
            <button_1.Button className="gap-2">
              <lucide_react_1.Plus className="h-4 w-4"/>
              New Form
            </button_1.Button>
          </link_1.default>)}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <lucide_react_1.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
          <input_1.Input type="search" placeholder="Search forms..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
        </div>
        <div className="flex gap-2">
          <div className="w-[180px]">
            <select_1.Select value={typeFilter} onValueChange={setTypeFilter}>
              <select_1.SelectTrigger>
                <div className="flex items-center gap-2">
                  <lucide_react_1.Filter className="h-4 w-4"/>
                  <select_1.SelectValue placeholder="Filter by type"/>
                </div>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="all">All Types</select_1.SelectItem>
                {formTypes.map((type) => (<select_1.SelectItem key={type} value={type}>
                    {type}
                  </select_1.SelectItem>))}
              </select_1.SelectContent>
            </select_1.Select>
          </div>
        </div>
      </div>

      <card_1.Card className="mt-6">
        <card_1.CardHeader>
          <card_1.CardTitle>Project Forms</card_1.CardTitle>
          <card_1.CardDescription>All forms and logs for {project.name}</card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          {filteredForms.length > 0 ? (<div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 px-4 py-2 font-medium text-sm border-b">
                <div className="flex items-center cursor-pointer hover:text-primary" onClick={() => handleSort("type")}>
                  Type
                  {sortField === "type" &&
                (sortDirection === "asc" ? (<lucide_react_1.ArrowUp className="ml-1 h-4 w-4"/>) : (<lucide_react_1.ArrowDown className="ml-1 h-4 w-4"/>))}
                </div>
                <div className="flex items-center cursor-pointer hover:text-primary" onClick={() => handleSort("submittedDate")}>
                  Date
                  {sortField === "submittedDate" &&
                (sortDirection === "asc" ? (<lucide_react_1.ArrowUp className="ml-1 h-4 w-4"/>) : (<lucide_react_1.ArrowDown className="ml-1 h-4 w-4"/>))}
                </div>
                <div className="flex items-center cursor-pointer hover:text-primary" onClick={() => handleSort("status")}>
                  Status
                  {sortField === "status" &&
                (sortDirection === "asc" ? (<lucide_react_1.ArrowUp className="ml-1 h-4 w-4"/>) : (<lucide_react_1.ArrowDown className="ml-1 h-4 w-4"/>))}
                </div>
              </div>

              {filteredForms.map((form) => (<div key={form.id} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <lucide_react_1.FileText className="h-5 w-5 text-primary"/>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-medium">{form.type}</p>
                      <p className="text-sm text-muted-foreground">By {form.submittedBy}</p>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <lucide_react_1.Calendar className="h-3 w-3"/>
                        <span>{form.submittedDate}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${form.status === "completed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : form.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                        {form.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button_1.Button variant="outline" size="sm" asChild>
                      <link_1.default href={`/dashboard/forms/${form.id}`}>View</link_1.default>
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
                        <dropdown_menu_1.DropdownMenuItem asChild>
                          <link_1.default href={`/dashboard/forms/${form.id}`}>View Form</link_1.default>
                        </dropdown_menu_1.DropdownMenuItem>
                        <dropdown_menu_1.DropdownMenuItem onClick={() => handleDownloadForm(form.id)} disabled={downloadingFormId === form.id}>
                          <lucide_react_1.Download className="mr-2 h-4 w-4"/>
                          {downloadingFormId === form.id ? "Downloading..." : "Download PDF"}
                        </dropdown_menu_1.DropdownMenuItem>
                        {(user?.role === "admin" || user?.role === "foreman") && (<>
                            <dropdown_menu_1.DropdownMenuItem asChild>
                              <link_1.default href={`/dashboard/forms/${form.id}/edit`}>Edit Form</link_1.default>
                            </dropdown_menu_1.DropdownMenuItem>
                          </>)}
                      </dropdown_menu_1.DropdownMenuContent>
                    </dropdown_menu_1.DropdownMenu>
                  </div>
                </div>))}
            </div>) : (<div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <lucide_react_1.FileText className="h-10 w-10 text-muted-foreground"/>
              <h3 className="mt-4 text-lg font-semibold">No forms found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || typeFilter !== "all"
                ? "Try adjusting your search or filter to find what you're looking for."
                : "This project doesn't have any forms yet."}
              </p>
              {(user?.role === "admin" || user?.role === "foreman") && (<link_1.default href="/dashboard/forms/new" className="mt-4">
                  <button_1.Button className="gap-2">
                    <lucide_react_1.Plus className="h-4 w-4"/>
                    New Form
                  </button_1.Button>
                </link_1.default>)}
            </div>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
//# sourceMappingURL=page.js.map