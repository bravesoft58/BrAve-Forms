"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProjectDetailPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const auth_provider_1 = require("@/components/auth-provider");
const lucide_react_1 = require("lucide-react");
const navigation_1 = require("next/navigation");
const use_toast_1 = require("@/components/ui/use-toast");
// Add imports for Dialog components
const dialog_1 = require("@/components/ui/dialog");
function ProjectDetailPage({ params }) {
    const { user } = (0, auth_provider_1.useAuth)();
    const [project, setProject] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    // Add state for delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = (0, react_1.useState)(false);
    const [isDeleting, setIsDeleting] = (0, react_1.useState)(false);
    // Completely rewritten delete project function
    const handleDeleteProject = () => {
        if (!project)
            return;
        try {
            setIsDeleting(true);
            // Show loading toast
            toast({
                title: "Deleting project...",
                description: "Please wait while we delete the project.",
            });
            // Simple approach - create a mock deletion success
            setTimeout(() => {
                // Close the dialog
                setDeleteDialogOpen(false);
                // Show success toast
                toast({
                    title: "Project deleted",
                    description: `${project.name} has been deleted successfully.`,
                });
                // Navigate back to projects list
                router.push("/dashboard/projects");
                setIsDeleting(false);
            }, 1500);
        }
        catch (error) {
            console.error("Error deleting project:", error);
            toast({
                title: "Error",
                description: "There was a problem deleting the project. Please try again.",
                variant: "destructive",
            });
            setIsDeleting(false);
        }
    };
    // Update the fetchProject function to ensure it uses the correct project ID
    (0, react_1.useEffect)(() => {
        // Check if user is admin or has permission to edit company settings
        const fetchProject = async () => {
            setIsLoading(true);
            try {
                // Simulate API call
                await new Promise((resolve) => setTimeout(resolve, 1000));
                // Mock project data - ensure we're using the correct ID from params
                const projectId = params.id;
                // Mock project data
                const mockProject = {
                    id: projectId,
                    name: projectId === "1"
                        ? "Downtown High-Rise"
                        : projectId === "2"
                            ? "Riverside Apartments"
                            : projectId === "3"
                                ? "Central Park Renovation"
                                : projectId === "4"
                                    ? "Harbor Bridge Repair"
                                    : `Project ${projectId}`,
                    address: projectId === "1"
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
                    team: [
                        {
                            id: "1",
                            name: "John Smith",
                            role: "Project Manager",
                            email: "john.smith@example.com",
                        },
                        {
                            id: "2",
                            name: "Jane Doe",
                            role: "Site Supervisor",
                            email: "jane.doe@example.com",
                        },
                        {
                            id: "3",
                            name: "Mike Johnson",
                            role: "Environmental Inspector",
                            email: "mike.johnson@example.com",
                        },
                    ],
                    forms: [
                        {
                            id: "1",
                            type: "Dust Control Log",
                            submittedBy: "John Smith",
                            submittedDate: "2024-03-02",
                            status: "completed",
                        },
                        {
                            id: "2",
                            type: "SWPPP Inspection",
                            submittedBy: "Mike Johnson",
                            submittedDate: "2024-03-01",
                            status: "completed",
                        },
                        {
                            id: "3",
                            type: "Safety Inspection",
                            submittedBy: "Jane Doe",
                            submittedDate: "2024-02-29",
                            status: "pending",
                        },
                    ],
                    stats: {
                        totalForms: 45,
                        completedForms: 42,
                        pendingForms: 3,
                        complianceRate: 98,
                    },
                };
                setProject(mockProject);
                setIsLoading(false);
            }
            catch (error) {
                console.error("Error fetching project:", error);
                setIsLoading(false);
            }
        };
        fetchProject();
    }, [params.id, router, user?.role]);
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    if (!project) {
        return (<div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <lucide_react_1.Construction className="h-10 w-10 text-muted-foreground"/>
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
    return (<div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button_1.Button variant="outline" size="icon" asChild>
            <link_1.default href="/dashboard/projects">
              <lucide_react_1.ChevronLeft className="h-4 w-4"/>
              <span className="sr-only">Back</span>
            </link_1.default>
          </button_1.Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <lucide_react_1.MapPin className="h-4 w-4"/>
              <span>{project.address}</span>
            </div>
          </div>
        </div>
        {(user?.role === "admin" || user?.role === "foreman") && (<div className="flex gap-2">
            <button_1.Button variant="outline" size="icon" asChild>
              <link_1.default href={`/dashboard/projects/${project.id}/qr`}>
                <lucide_react_1.QrCode className="h-4 w-4"/>
                <span className="sr-only">QR Code</span>
              </link_1.default>
            </button_1.Button>
            <button_1.Button variant="outline" size="icon">
              <lucide_react_1.Download className="h-4 w-4"/>
              <span className="sr-only">Download</span>
            </button_1.Button>
            <button_1.Button variant="outline" size="icon" asChild>
              <link_1.default href={`/dashboard/projects/${project.id}/edit`}>
                <lucide_react_1.Edit className="h-4 w-4"/>
                <span className="sr-only">Edit</span>
              </link_1.default>
            </button_1.Button>
            {user?.role === "admin" && (<dialog_1.Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <dialog_1.DialogTrigger asChild>
                  <button_1.Button variant="outline" size="icon">
                    <lucide_react_1.Archive className="h-4 w-4"/>
                    <span className="sr-only">Delete</span>
                  </button_1.Button>
                </dialog_1.DialogTrigger>
                <dialog_1.DialogContent>
                  <dialog_1.DialogHeader>
                    <dialog_1.DialogTitle>Delete Project</dialog_1.DialogTitle>
                    <dialog_1.DialogDescription>
                      Are you sure you want to delete this project? This action cannot be undone.
                    </dialog_1.DialogDescription>
                  </dialog_1.DialogHeader>
                  <dialog_1.DialogFooter>
                    <button_1.Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                      Cancel
                    </button_1.Button>
                    <button_1.Button variant="destructive" onClick={handleDeleteProject} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete Project"}
                    </button_1.Button>
                  </dialog_1.DialogFooter>
                </dialog_1.DialogContent>
              </dialog_1.Dialog>)}
          </div>)}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-4">
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
            <card_1.CardTitle className="text-sm font-medium">Total Forms</card_1.CardTitle>
            <lucide_react_1.FileText className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{project.stats.totalForms}</div>
            <p className="text-xs text-muted-foreground">
              {project.stats.completedForms} completed, {project.stats.pendingForms} pending
            </p>
          </card_1.CardContent>
        </card_1.Card>
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
            <card_1.CardTitle className="text-sm font-medium">Team Members</card_1.CardTitle>
            <lucide_react_1.Users className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{project.team.length}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </card_1.CardContent>
        </card_1.Card>
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
            <card_1.CardTitle className="text-sm font-medium">Project Duration</card_1.CardTitle>
            <lucide_react_1.Calendar className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">47 days</div>
            <p className="text-xs text-muted-foreground">Since {project.startDate}</p>
          </card_1.CardContent>
        </card_1.Card>
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
            <card_1.CardTitle className="text-sm font-medium">Compliance Rate</card_1.CardTitle>
            <lucide_react_1.BarChart3 className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{project.stats.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      <tabs_1.Tabs defaultValue="overview" className="mt-6">
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="forms">Forms</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="team">Team</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="overview" className="mt-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Project Overview</card_1.CardTitle>
              <card_1.CardDescription>Details and current status of the project</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{project.description}</p>
              </div>

              <div>
                <h3 className="font-medium">Project Timeline</h3>
                <div className="mt-1.5 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <lucide_react_1.Calendar className="h-4 w-4 text-muted-foreground"/>
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">{project.startDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <lucide_react_1.Calendar className="h-4 w-4 text-muted-foreground"/>
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-sm text-muted-foreground">{project.endDate || "In Progress"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium">Recent Activity</h3>
                <div className="mt-1.5 space-y-4">
                  {project.forms.slice(0, 3).map((form) => (<div key={form.id} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <lucide_react_1.FileText className="h-4 w-4 text-primary"/>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{form.type}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted by {form.submittedBy} on {form.submittedDate}
                        </p>
                      </div>
                      <button_1.Button variant="link" size="sm" className="h-auto p-0" asChild>
                        <link_1.default href={`/dashboard/forms/${form.id}`}>View</link_1.default>
                      </button_1.Button>
                    </div>))}
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="forms" className="mt-4">
          <card_1.Card>
            <card_1.CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <card_1.CardTitle>Project Forms</card_1.CardTitle>
                  <card_1.CardDescription>All forms and logs for this project</card_1.CardDescription>
                </div>
                {(user?.role === "admin" || user?.role === "foreman") && (<button_1.Button asChild>
                    <link_1.default href={`/dashboard/forms/new?projectId=${project.id}`}>New Form</link_1.default>
                  </button_1.Button>)}
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {project.forms.map((form) => (<div key={form.id} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <lucide_react_1.FileText className="h-5 w-5 text-primary"/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{form.type}</p>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${form.status === "completed"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : form.status === "pending"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                          {form.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <lucide_react_1.Users className="h-3 w-3"/>
                          <span>{form.submittedBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <lucide_react_1.Clock className="h-3 w-3"/>
                          <span>{form.submittedDate}</span>
                        </div>
                      </div>
                    </div>
                    <button_1.Button variant="link" size="sm" className="h-auto p-0" asChild>
                      <link_1.default href={`/dashboard/forms/${form.id}`}>View Form</link_1.default>
                    </button_1.Button>
                  </div>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="team" className="mt-4">
          <card_1.Card>
            <card_1.CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <card_1.CardTitle>Project Team</card_1.CardTitle>
                  <card_1.CardDescription>Team members assigned to this project</card_1.CardDescription>
                </div>
                {user?.role === "admin" && <button_1.Button>Manage Team</button_1.Button>}
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {project.team.map((member) => (<div key={member.id} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium">
                        {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <lucide_react_1.Users className="h-3 w-3"/>
                          <span>{member.role}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <lucide_react_1.Mail className="h-3 w-3"/>
                          <span>{member.email}</span>
                        </div>
                      </div>
                    </div>
                    {user?.role === "admin" && (<button_1.Button variant="ghost" size="sm">
                        Remove
                      </button_1.Button>)}
                  </div>))}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
//# sourceMappingURL=page.js.map