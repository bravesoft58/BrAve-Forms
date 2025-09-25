"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EditFormPage;
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
function EditFormPage({ params }) {
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    const [form, setForm] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    // Form state
    const [formContent, setFormContent] = (0, react_1.useState)({});
    const [formStatus, setFormStatus] = (0, react_1.useState)("draft");
    (0, react_1.useEffect)(() => {
        const fetchForm = async () => {
            setIsLoading(true);
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Mock form data based on ID
            let mockForm;
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
                        notes: "Additional water applied to north section of site due to increased wind in the afternoon. No visible dust leaving the site boundary.",
                    },
                };
            }
            else if (params.id === "2") {
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
                };
            }
            else if (params.id === "3") {
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
                };
            }
            else {
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
                };
            }
            setForm(mockForm);
            setFormContent(mockForm.content);
            setFormStatus(mockForm.status);
            setIsLoading(false);
        };
        fetchForm();
    }, [params.id]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        toast({
            title: "Form updated",
            description: "Your form has been updated successfully.",
        });
        setIsSaving(false);
        router.push(`/dashboard/forms/${params.id}`);
    };
    const handleInputChange = (field, value) => {
        setFormContent((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    const handleListChange = (field, value) => {
        // Convert comma-separated string to array
        const items = value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item !== "");
        setFormContent((prev) => ({
            ...prev,
            [field]: items,
        }));
    };
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    if (!form) {
        return (<div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h3 className="mt-4 text-lg font-semibold">Form not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The form you're looking for doesn't exist or has been deleted.
          </p>
          <link_1.default href="/dashboard/forms" className="mt-4">
            <button_1.Button variant="outline">Back to Forms</button_1.Button>
          </link_1.default>
        </div>
      </div>);
    }
    return (<div className="container py-6">
      <div className="flex items-center gap-2">
        <button_1.Button variant="outline" size="icon" asChild>
          <link_1.default href={`/dashboard/forms/${params.id}`}>
            <lucide_react_1.ChevronLeft className="h-4 w-4"/>
            <span className="sr-only">Back</span>
          </link_1.default>
        </button_1.Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit {form.type}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <card_1.Card className="mt-6">
          <card_1.CardHeader>
            <card_1.CardTitle>Form Details</card_1.CardTitle>
            <card_1.CardDescription>Edit the details for this {form.type}</card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label_1.Label>Project</label_1.Label>
                <input_1.Input value={form.project.name} disabled/>
              </div>
              <div className="space-y-2">
                <label_1.Label>Form Type</label_1.Label>
                <input_1.Input value={form.type} disabled/>
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="status">Status</label_1.Label>
              <select_1.Select value={formStatus} onValueChange={(value) => setFormStatus(value)}>
                <select_1.SelectTrigger id="status">
                  <select_1.SelectValue placeholder="Select status"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="draft">Draft</select_1.SelectItem>
                  <select_1.SelectItem value="pending">Pending</select_1.SelectItem>
                  <select_1.SelectItem value="completed">Completed</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            {form.type === "Dust Control Log" && (<>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="weatherConditions">Weather Conditions</label_1.Label>
                    <input_1.Input id="weatherConditions" value={formContent.weatherConditions || ""} onChange={(e) => handleInputChange("weatherConditions", e.target.value)}/>
                  </div>
                  <div className="space-y-2">
                    <label_1.Label htmlFor="windSpeed">Wind Speed</label_1.Label>
                    <input_1.Input id="windSpeed" value={formContent.windSpeed || ""} onChange={(e) => handleInputChange("windSpeed", e.target.value)}/>
                  </div>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="dustControlMeasures">Dust Control Measures</label_1.Label>
                  <textarea_1.Textarea id="dustControlMeasures" value={formContent.dustControlMeasures?.join(", ") || ""} onChange={(e) => handleListChange("dustControlMeasures", e.target.value)} placeholder="Enter measures separated by commas" className="min-h-[100px]"/>
                  <p className="text-xs text-muted-foreground">Enter measures separated by commas</p>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="notes">Notes</label_1.Label>
                  <textarea_1.Textarea id="notes" value={formContent.notes || ""} onChange={(e) => handleInputChange("notes", e.target.value)} className="min-h-[100px]"/>
                </div>
              </>)}

            {form.type === "SWPPP Inspection" && (<>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="rainfall">Rainfall</label_1.Label>
                    <input_1.Input id="rainfall" value={formContent.rainfall || ""} onChange={(e) => handleInputChange("rainfall", e.target.value)}/>
                  </div>
                  <div className="space-y-2">
                    <label_1.Label htmlFor="inspectionType">Inspection Type</label_1.Label>
                    <select_1.Select value={formContent.inspectionType || ""} onValueChange={(value) => handleInputChange("inspectionType", value)}>
                      <select_1.SelectTrigger id="inspectionType">
                        <select_1.SelectValue placeholder="Select type"/>
                      </select_1.SelectTrigger>
                      <select_1.SelectContent>
                        <select_1.SelectItem value="Routine Weekly">Routine Weekly</select_1.SelectItem>
                        <select_1.SelectItem value="Post-Rain Event">Post-Rain Event</select_1.SelectItem>
                        <select_1.SelectItem value="Complaint Response">Complaint Response</select_1.SelectItem>
                      </select_1.SelectContent>
                    </select_1.Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="bmpConditions">BMP Conditions</label_1.Label>
                  <textarea_1.Textarea id="bmpConditions" value={formContent.bmpConditions?.join(", ") || ""} onChange={(e) => handleListChange("bmpConditions", e.target.value)} placeholder="Enter conditions separated by commas" className="min-h-[100px]"/>
                  <p className="text-xs text-muted-foreground">Enter conditions separated by commas</p>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="correctiveActions">Corrective Actions</label_1.Label>
                  <textarea_1.Textarea id="correctiveActions" value={formContent.correctiveActions || ""} onChange={(e) => handleInputChange("correctiveActions", e.target.value)} className="min-h-[100px]"/>
                </div>
              </>)}

            {form.type === "Safety Inspection" && (<>
                <div className="space-y-2">
                  <label_1.Label htmlFor="findings">Findings</label_1.Label>
                  <textarea_1.Textarea id="findings" value={formContent.findings?.join(", ") || ""} onChange={(e) => handleListChange("findings", e.target.value)} placeholder="Enter findings separated by commas" className="min-h-[100px]"/>
                  <p className="text-xs text-muted-foreground">Enter findings separated by commas</p>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="correctiveActions">Corrective Actions</label_1.Label>
                  <textarea_1.Textarea id="correctiveActions" value={formContent.correctiveActions || ""} onChange={(e) => handleInputChange("correctiveActions", e.target.value)} className="min-h-[100px]"/>
                </div>
              </>)}
          </card_1.CardContent>
          <card_1.CardFooter className="flex justify-end gap-4">
            <button_1.Button variant="outline" onClick={() => router.push(`/dashboard/forms/${params.id}`)} type="button">
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