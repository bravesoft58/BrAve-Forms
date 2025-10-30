"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EditProjectPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const select_1 = require("@/components/ui/select");
const use_toast_1 = require("@/components/ui/use-toast");
const lucide_react_1 = require("lucide-react");
const auth_provider_1 = require("@/components/auth-provider");
function EditProjectPage({ params }) {
    const { user } = (0, auth_provider_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    const [project, setProject] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        // Check if user has permission to edit projects
        if (user?.role !== "admin" && user?.role !== "foreman") {
            router.push("/dashboard");
            return;
        }
        const fetchProject = async () => {
            setIsLoading(true);
            try {
                // Simulate API call
                await new Promise((resolve) => setTimeout(resolve, 1000));
                // Mock project data
                const projectId = params.id;
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            toast({
                title: "Project updated",
                description: "The project has been updated successfully.",
            });
            setIsSaving(false);
            router.push(`/dashboard/projects/${params.id}`);
        }
        catch (error) {
            console.error("Error updating project:", error);
            toast({
                title: "Error",
                description: "There was a problem updating the project. Please try again.",
                variant: "destructive",
            });
            setIsSaving(false);
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
      <div className="flex items-center gap-2">
        <button_1.Button variant="outline" size="icon" asChild>
          <link_1.default href={`/dashboard/projects/${params.id}`}>
            <lucide_react_1.ChevronLeft className="h-4 w-4"/>
            <span className="sr-only">Back</span>
          </link_1.default>
        </button_1.Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <card_1.Card className="mt-6">
          <card_1.CardHeader>
            <card_1.CardTitle>Project Details</card_1.CardTitle>
            <card_1.CardDescription>Update the details for this project</card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <div className="space-y-2">
              <label_1.Label htmlFor="name">Project Name</label_1.Label>
              <input_1.Input id="name" defaultValue={project.name} required/>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="address">Project Address</label_1.Label>
              <input_1.Input id="address" defaultValue={project.address} required/>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label_1.Label htmlFor="startDate">Start Date</label_1.Label>
                <input_1.Input id="startDate" type="date" defaultValue={project.startDate} required/>
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="endDate">Expected End Date</label_1.Label>
                <input_1.Input id="endDate" type="date" defaultValue={project.endDate || ""}/>
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="status">Project Status</label_1.Label>
              <select_1.Select defaultValue={project.status}>
                <select_1.SelectTrigger id="status">
                  <select_1.SelectValue placeholder="Select status"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="pending">Pending</select_1.SelectItem>
                  <select_1.SelectItem value="active">Active</select_1.SelectItem>
                  <select_1.SelectItem value="completed">Completed</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="description">Project Description</label_1.Label>
              <textarea_1.Textarea id="description" defaultValue={project.description} className="min-h-[100px]" required/>
            </div>
          </card_1.CardContent>
          <card_1.CardFooter className="flex justify-end gap-4">
            <button_1.Button variant="outline" onClick={() => router.push(`/dashboard/projects/${params.id}`)} type="button">
              Cancel
            </button_1.Button>
            <button_1.Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button_1.Button>
          </card_1.CardFooter>
        </card_1.Card>
      </form>
    </div>);
}
//# sourceMappingURL=page.js.map