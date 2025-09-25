"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NewFormPage;
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
function NewFormPage() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const projectIdParam = searchParams.get("projectId");
    const { toast } = (0, use_toast_1.useToast)();
    const [formType, setFormType] = (0, react_1.useState)("dust-control");
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [selectedProject, setSelectedProject] = (0, react_1.useState)(projectIdParam || "");
    // Update the handleSubmit function to simulate adding a new form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Get form data
        const formData = new FormData(e.currentTarget);
        const projectId = formData.get("project");
        const formType = formData.get("type");
        // Get project name based on project ID
        let projectName = "Unknown Project";
        if (projectId === "1")
            projectName = "Downtown High-Rise";
        else if (projectId === "2")
            projectName = "Riverside Apartments";
        else if (projectId === "3")
            projectName = "Central Park Renovation";
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Store the new form in localStorage to simulate persistence
        try {
            // Get existing forms or initialize empty array
            const existingForms = localStorage.getItem("forms") ? JSON.parse(localStorage.getItem("forms") || "[]") : [];
            // Create new form object
            const newForm = {
                id: (existingForms.length + 1).toString(),
                projectId: projectId,
                projectName: projectName,
                type: formType,
                date: new Date().toISOString().split("T")[0],
                updatedBy: "Current User",
                status: "draft",
            };
            // Add to forms array
            existingForms.push(newForm);
            // Save back to localStorage
            localStorage.setItem("forms", JSON.stringify(existingForms));
            toast({
                title: "Form created",
                description: "Your new form has been created successfully.",
            });
        }
        catch (error) {
            console.error("Error saving form:", error);
            toast({
                title: "Error creating form",
                description: "There was a problem creating your form. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
            router.push("/dashboard/forms");
        }
    };
    return (<div className="container py-6">
      <div className="flex items-center gap-2">
        <button_1.Button variant="outline" size="icon" asChild>
          <link_1.default href="/dashboard/forms">
            <lucide_react_1.ChevronLeft className="h-4 w-4"/>
            <span className="sr-only">Back</span>
          </link_1.default>
        </button_1.Button>
        <h1 className="text-2xl font-bold tracking-tight">New Form</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <card_1.Card className="mt-6">
          <card_1.CardHeader>
            <card_1.CardTitle>Form Details</card_1.CardTitle>
            <card_1.CardDescription>Create a new environmental log or inspection form</card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <div className="space-y-2">
              <label_1.Label htmlFor="project">Project</label_1.Label>
              <select_1.Select required name="project" value={selectedProject} onValueChange={setSelectedProject}>
                <select_1.SelectTrigger id="project">
                  <select_1.SelectValue placeholder="Select project"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="1">Downtown High-Rise</select_1.SelectItem>
                  <select_1.SelectItem value="2">Riverside Apartments</select_1.SelectItem>
                  <select_1.SelectItem value="3">Central Park Renovation</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="type">Form Type</label_1.Label>
              <select_1.Select value={formType} onValueChange={setFormType} required name="type">
                <select_1.SelectTrigger id="type">
                  <select_1.SelectValue placeholder="Select form type"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="dust-control">Dust Control Log</select_1.SelectItem>
                  <select_1.SelectItem value="swppp">SWPPP Inspection</select_1.SelectItem>
                  <select_1.SelectItem value="safety">Safety Inspection</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            {formType === "dust-control" && (<>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="weather">Weather Conditions</label_1.Label>
                    <input_1.Input id="weather" placeholder="Enter weather conditions" required/>
                  </div>
                  <div className="space-y-2">
                    <label_1.Label htmlFor="wind">Wind Speed</label_1.Label>
                    <input_1.Input id="wind" placeholder="Enter wind speed" required/>
                  </div>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="measures">Dust Control Measures</label_1.Label>
                  <textarea_1.Textarea id="measures" placeholder="List all dust control measures implemented" className="min-h-[100px]" required/>
                </div>
              </>)}

            {formType === "swppp" && (<>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="rainfall">Recent Rainfall</label_1.Label>
                    <input_1.Input id="rainfall" placeholder="Enter rainfall amount" required/>
                  </div>
                  <div className="space-y-2">
                    <label_1.Label htmlFor="inspection-type">Inspection Type</label_1.Label>
                    <select_1.Select required>
                      <select_1.SelectTrigger id="inspection-type">
                        <select_1.SelectValue placeholder="Select type"/>
                      </select_1.SelectTrigger>
                      <select_1.SelectContent>
                        <select_1.SelectItem value="routine">Routine Weekly</select_1.SelectItem>
                        <select_1.SelectItem value="rain">Rain Event</select_1.SelectItem>
                        <select_1.SelectItem value="complaint">Complaint Response</select_1.SelectItem>
                      </select_1.SelectContent>
                    </select_1.Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="bmp-conditions">BMP Conditions</label_1.Label>
                  <textarea_1.Textarea id="bmp-conditions" placeholder="Describe the conditions of BMPs" className="min-h-[100px]" required/>
                </div>
              </>)}

            {formType === "safety" && (<>
                <div className="space-y-2">
                  <label_1.Label htmlFor="inspection-areas">Areas Inspected</label_1.Label>
                  <input_1.Input id="inspection-areas" placeholder="Enter areas inspected" required/>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="findings">Inspection Findings</label_1.Label>
                  <textarea_1.Textarea id="findings" placeholder="List all findings and observations" className="min-h-[100px]" required/>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="actions">Corrective Actions</label_1.Label>
                  <textarea_1.Textarea id="actions" placeholder="Describe any required corrective actions" className="min-h-[100px]" required/>
                </div>
              </>)}

            <div className="space-y-2">
              <label_1.Label htmlFor="notes">Additional Notes</label_1.Label>
              <textarea_1.Textarea id="notes" placeholder="Enter any additional notes or comments" className="min-h-[100px]"/>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="photos">Photos</label_1.Label>
              <input_1.Input id="photos" type="file" multiple accept="image/*"/>
              <p className="text-sm text-muted-foreground">Upload photos related to this form (optional)</p>
            </div>
          </card_1.CardContent>
          <card_1.CardFooter className="flex justify-end gap-4">
            <button_1.Button variant="outline" onClick={() => router.push("/dashboard/forms")} type="button">
              Cancel
            </button_1.Button>
            <button_1.Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Form"}
            </button_1.Button>
          </card_1.CardFooter>
        </card_1.Card>
      </form>
    </div>);
}
//# sourceMappingURL=page.js.map