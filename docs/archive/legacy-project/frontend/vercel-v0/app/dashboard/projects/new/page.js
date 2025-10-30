"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NewProjectPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const select_1 = require("@/components/ui/select");
const textarea_1 = require("@/components/ui/textarea");
const use_toast_1 = require("@/components/ui/use-toast");
const lucide_react_1 = require("lucide-react");
function NewProjectPage() {
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    // Update the handleSubmit function to simulate adding a new project to the list
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Get form data
        const formData = new FormData(e.currentTarget);
        const projectName = formData.get("name");
        const projectAddress = formData.get("address");
        const projectStartDate = formData.get("startDate");
        const projectStatus = formData.get("status");
        const projectDescription = formData.get("description");
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Store the new project in localStorage to simulate persistence
        try {
            // Get existing projects or initialize empty array
            const existingProjects = localStorage.getItem("projects")
                ? JSON.parse(localStorage.getItem("projects") || "[]")
                : [];
            // Create new project object
            const newProject = {
                id: (existingProjects.length + 1).toString(),
                name: projectName,
                address: projectAddress,
                status: projectStatus || "active",
                startDate: projectStartDate,
                lastUpdated: new Date().toISOString().split("T")[0],
                isFavorite: false,
            };
            // Add to projects array
            existingProjects.push(newProject);
            // Save back to localStorage
            localStorage.setItem("projects", JSON.stringify(existingProjects));
            toast({
                title: "Project created",
                description: "Your new project has been created successfully.",
            });
        }
        catch (error) {
            console.error("Error saving project:", error);
            toast({
                title: "Error creating project",
                description: "There was a problem creating your project. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
            router.push("/dashboard/projects");
        }
    };
    return (<div className="container py-6">
      <div className="flex items-center gap-2">
        <button_1.Button variant="outline" size="icon" asChild>
          <link_1.default href="/dashboard/projects">
            <lucide_react_1.ChevronLeft className="h-4 w-4"/>
            <span className="sr-only">Back</span>
          </link_1.default>
        </button_1.Button>
        <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <card_1.Card className="mt-6">
          <card_1.CardHeader>
            <card_1.CardTitle>Project Details</card_1.CardTitle>
            <card_1.CardDescription>Enter the details for your new construction project</card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <div className="space-y-2">
              <label_1.Label htmlFor="name">Project Name</label_1.Label>
              <input_1.Input id="name" placeholder="Enter project name" required/>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="address">Project Address</label_1.Label>
              <input_1.Input id="address" placeholder="Enter project address" required/>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label_1.Label htmlFor="startDate">Start Date</label_1.Label>
                <input_1.Input id="startDate" type="date" required/>
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="endDate">Expected End Date</label_1.Label>
                <input_1.Input id="endDate" type="date"/>
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="status">Project Status</label_1.Label>
              <select_1.Select defaultValue="pending">
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
              <textarea_1.Textarea id="description" placeholder="Enter project description" className="min-h-[100px]" required/>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="team">Project Team</label_1.Label>
              <select_1.Select>
                <select_1.SelectTrigger id="team">
                  <select_1.SelectValue placeholder="Add team members"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="john">John Smith (Project Manager)</select_1.SelectItem>
                  <select_1.SelectItem value="jane">Jane Doe (Site Supervisor)</select_1.SelectItem>
                  <select_1.SelectItem value="mike">Mike Johnson (Environmental Inspector)</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
              <p className="text-sm text-muted-foreground">You can add more team members after creating the project</p>
            </div>
          </card_1.CardContent>
          <card_1.CardFooter className="flex justify-end gap-4">
            <button_1.Button variant="outline" onClick={() => router.push("/dashboard/projects")} type="button">
              Cancel
            </button_1.Button>
            <button_1.Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </button_1.Button>
          </card_1.CardFooter>
        </card_1.Card>
      </form>
    </div>);
}
//# sourceMappingURL=page.js.map