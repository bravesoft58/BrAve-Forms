"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormDetailPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const separator_1 = require("@/components/ui/separator");
const lucide_react_1 = require("lucide-react");
const auth_provider_1 = require("@/components/auth-provider");
const company_logo_1 = require("@/components/company-logo");
const use_toast_1 = require("@/components/ui/use-toast");
// Add import for the FormComment component
const form_comment_1 = require("@/components/form-comment");
function FormDetailPage({ params }) {
    const { user } = (0, auth_provider_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [form, setForm] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isDownloading, setIsDownloading] = (0, react_1.useState)(false);
    const [relatedFormsByType, setRelatedFormsByType] = (0, react_1.useState)([]);
    const fetchForm = async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Mock form data based on ID
        let mockForm;
        // First, determine which form we're looking at
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
                hasPhotos: true,
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
                hasPhotos: false,
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
                hasPhotos: true,
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
        else if (params.id === "4") {
            mockForm = {
                id: "4",
                type: "Dust Control Log",
                project: {
                    id: "1",
                    name: "Downtown High-Rise",
                },
                submittedBy: "John Smith",
                submittedDate: "2024-02-28",
                status: "completed",
                hasPhotos: true,
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
            };
        }
        else if (params.id === "5") {
            mockForm = {
                id: "5",
                type: "SWPPP Inspection",
                project: {
                    id: "2",
                    name: "Riverside Apartments",
                },
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
                hasPhotos: false,
            };
        }
        else if (params.id === "6") {
            mockForm = {
                id: "6",
                type: "Dust Control Log",
                project: {
                    id: "1",
                    name: "Downtown High-Rise",
                },
                submittedBy: "John Smith",
                submittedDate: "2024-03-10",
                status: "completed",
                hasPhotos: true,
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
            };
        }
        else if (params.id === "7") {
            mockForm = {
                id: "7",
                type: "Safety Inspection",
                project: {
                    id: "3",
                    name: "Central Park Renovation",
                },
                submittedBy: "Robert Brown",
                submittedDate: "2024-03-09",
                status: "draft",
                hasPhotos: false,
                content: {
                    findings: ["All workers wearing proper PPE", "Scaffolding properly secured", "Fire extinguishers accessible"],
                    correctiveActions: "Draft report - to be completed.",
                },
            };
        }
        else if (params.id === "8") {
            mockForm = {
                id: "8",
                type: "SWPPP Inspection",
                project: {
                    id: "2",
                    name: "Riverside Apartments",
                },
                submittedBy: "Mike Johnson",
                submittedDate: "2024-03-08",
                status: "completed",
                hasPhotos: false,
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
            };
        }
        else {
            // Default form if ID doesn't match any of the above
            mockForm = {
                id: params.id,
                type: "Safety Inspection",
                project: {
                    id: "3",
                    name: "Central Park Renovation",
                },
                submittedBy: "Jane Doe",
                submittedDate: "2024-02-29",
                status: "pending",
                hasPhotos: true,
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
        // Now that we have the current form, let's get all forms for the same project
        // This is our mock database of all forms
        const allForms = [
            {
                id: "1",
                type: "Dust Control Log",
                projectId: "1", // Downtown High-Rise
                date: "2024-03-02",
            },
            {
                id: "2",
                type: "SWPPP Inspection",
                projectId: "2", // Riverside Apartments
                date: "2024-03-01",
            },
            {
                id: "3",
                type: "Safety Inspection",
                projectId: "1", // Downtown High-Rise
                date: "2024-02-29",
            },
            {
                id: "4",
                type: "Dust Control Log",
                projectId: "1", // Downtown High-Rise
                date: "2024-02-28",
            },
            {
                id: "5",
                type: "SWPPP Inspection",
                projectId: "2", // Riverside Apartments
                date: "2024-02-25",
            },
            {
                id: "6",
                type: "Dust Control Log",
                projectId: "1", // Downtown High-Rise
                date: "2024-03-10",
            },
            {
                id: "7",
                type: "Safety Inspection",
                projectId: "3", // Central Park Renovation
                date: "2024-03-09",
            },
            {
                id: "8",
                type: "SWPPP Inspection",
                projectId: "2", // Riverside Apartments
                date: "2024-03-08",
            },
            {
                id: "9",
                type: "Safety Inspection",
                projectId: "1", // Downtown High-Rise
                date: "2024-03-15",
            },
        ];
        // Filter forms to only include those from the same project as the current form
        // AND exclude the current form itself
        const projectForms = allForms.filter((form) => form.projectId === mockForm.project.id && form.id !== mockForm.id);
        // Group the forms by type
        const formsByType = {};
        projectForms.forEach((form) => {
            if (!formsByType[form.type]) {
                formsByType[form.type] = [];
            }
            formsByType[form.type].push({
                id: form.id,
                date: form.date,
            });
        });
        // Convert to array format for easier rendering
        const relatedFormsByType = Object.keys(formsByType).map((type) => ({
            type,
            forms: formsByType[type],
        }));
        setForm(mockForm);
        setRelatedFormsByType(relatedFormsByType);
        setIsLoading(false);
    };
    (0, react_1.useEffect)(() => {
        fetchForm();
    }, [params.id]);
    const handleDownloadPDF = async () => {
        if (!form)
            return;
        setIsDownloading(true);
        try {
            // Show loading toast
            toast({
                title: "Generating PDF",
                description: "Your PDF is being generated and will download shortly.",
            });
            // Import the downloadFormPDF function from the correct file
            const { downloadFormPDF } = await Promise.resolve().then(() => __importStar(require("@/lib/pdf-generator")));
            // Add a small delay to ensure the UI updates
            await new Promise((resolve) => setTimeout(resolve, 500));
            await downloadFormPDF(form);
            // Show success toast
            toast({
                title: "Download Complete",
                description: "Your PDF has been downloaded successfully.",
            });
        }
        catch (error) {
            console.error("Error downloading PDF:", error);
            // Show detailed error message
            toast({
                title: "Download Failed",
                description: `There was an error generating your PDF: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
                variant: "destructive",
            });
        }
        finally {
            setIsDownloading(false);
        }
    };
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    if (!form) {
        return (<div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <lucide_react_1.FileText className="h-10 w-10 text-muted-foreground"/>
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
          <link_1.default href="/dashboard/forms">
            <lucide_react_1.ChevronLeft className="h-4 w-4"/>
            <span className="sr-only">Back</span>
          </link_1.default>
        </button_1.Button>
        <h1 className="text-2xl font-bold tracking-tight">{form.type}</h1>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <card_1.CardTitle>Form Details</card_1.CardTitle>
                  <card_1.CardDescription>Submitted on {form.submittedDate}</card_1.CardDescription>
                </div>
                <div className="flex gap-2">
                  {(user?.role === "admin" || user?.role === "foreman") && (<button_1.Button variant="outline" size="icon" asChild>
                      <link_1.default href={`/dashboard/forms/${form.id}/edit`}>
                        <lucide_react_1.Edit className="h-4 w-4"/>
                        <span className="sr-only">Edit</span>
                      </link_1.default>
                    </button_1.Button>)}
                  <button_1.Button variant="outline" size="icon" asChild>
                    <link_1.default href={`/dashboard/forms/${form.id}/qr`}>
                      <lucide_react_1.QrCode className="h-4 w-4"/>
                      <span className="sr-only">QR Code</span>
                    </link_1.default>
                  </button_1.Button>
                  <button_1.Button variant="outline" size="icon" onClick={handleDownloadPDF} disabled={isDownloading}>
                    <lucide_react_1.Download className="h-4 w-4"/>
                    <span className="sr-only">Download</span>
                  </button_1.Button>
                </div>
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-6">
                {/* Company Logo */}
                <div className="flex justify-between items-center">
                  <company_logo_1.CompanyLogo size="md"/>
                  <div className="text-sm text-muted-foreground">Form ID: {form.id}</div>
                </div>

                <separator_1.Separator />

                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <lucide_react_1.Construction className="h-4 w-4 text-muted-foreground"/>
                    <span className="font-medium">Project:</span>
                    <link_1.default href={`/dashboard/projects/${form.project.id}`} className="hover:underline">
                      {form.project.name}
                    </link_1.default>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <lucide_react_1.User className="h-4 w-4 text-muted-foreground"/>
                    <span className="font-medium">Submitted By:</span>
                    <span>{form.submittedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <lucide_react_1.CalendarDays className="h-4 w-4 text-muted-foreground"/>
                    <span className="font-medium">Date:</span>
                    <span>{form.submittedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <lucide_react_1.Clock className="h-4 w-4 text-muted-foreground"/>
                    <span className="font-medium">Status:</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${form.status === "completed"
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : form.status === "pending"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                      {form.status}
                    </span>
                  </div>
                </div>

                <separator_1.Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Form Content</h3>
                  {form.type === "Dust Control Log" && (<div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-medium">Weather Conditions</h4>
                          <p className="text-sm text-muted-foreground">{form.content.weatherConditions}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Wind Speed</h4>
                          <p className="text-sm text-muted-foreground">{form.content.windSpeed}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Dust Control Measures</h4>
                        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                          {form.content.dustControlMeasures?.map((measure, index) => (<li key={index}>{measure}</li>))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Notes</h4>
                        <p className="text-sm text-muted-foreground">{form.content.notes}</p>
                      </div>
                    </div>)}

                  {form.type === "SWPPP Inspection" && (<div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-medium">Rainfall</h4>
                          <p className="text-sm text-muted-foreground">{form.content.rainfall}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Inspection Type</h4>
                          <p className="text-sm text-muted-foreground">{form.content.inspectionType}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">BMP Conditions</h4>
                        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                          {form.content.bmpConditions?.map((condition, index) => (<li key={index}>{condition}</li>))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Corrective Actions</h4>
                        <p className="text-sm text-muted-foreground">{form.content.correctiveActions}</p>
                      </div>
                    </div>)}

                  {form.type === "Safety Inspection" && (<div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium">Findings</h4>
                        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                          {form.content.findings?.map((finding, index) => (<li key={index}>{finding}</li>))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Corrective Actions</h4>
                        <p className="text-sm text-muted-foreground">{form.content.correctiveActions}</p>
                      </div>
                    </div>)}
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {form.hasPhotos && (<card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Photos</card_1.CardTitle>
                <card_1.CardDescription>Photos attached to this form</card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (<div key={i} className="relative aspect-square overflow-hidden rounded-md border">
                      <image_1.default src={`/placeholder.svg?height=300&width=300&text=Photo+${i}`} alt={`Photo ${i}`} fill className="object-cover"/>
                    </div>))}
                </div>
              </card_1.CardContent>
            </card_1.Card>)}
        </div>

        {/* Add a new card for inspector comments at the end of the right column */}
        <div className="space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Form History</card_1.CardTitle>
              <card_1.CardDescription>Previous versions of this form</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <lucide_react_1.CalendarDays className="h-4 w-4 text-muted-foreground"/>
                    <span>2024-03-01</span>
                  </div>
                  <button_1.Button variant="link" size="sm" className="h-auto p-0">
                    View
                  </button_1.Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <lucide_react_1.CalendarDays className="h-4 w-4 text-muted-foreground"/>
                    <span>2024-02-29</span>
                  </div>
                  <button_1.Button variant="link" size="sm" className="h-auto p-0">
                    View
                  </button_1.Button>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Project Forms</card_1.CardTitle>
              <card_1.CardDescription>Forms for {form.project.name}</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              {relatedFormsByType.length > 0 ? (<div className="space-y-6">
                  {relatedFormsByType.map((formType) => (<div key={formType.type} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <lucide_react_1.FolderOpen className="h-4 w-4 text-primary"/>
                        <h3 className="text-sm font-medium">{formType.type}</h3>
                      </div>
                      <div className="ml-6 space-y-2 border-l pl-4">
                        {formType.forms.map((relatedForm) => (<div key={relatedForm.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <lucide_react_1.FileText className="h-4 w-4 text-muted-foreground"/>
                              <span>{relatedForm.date}</span>
                            </div>
                            <button_1.Button variant="link" size="sm" className="h-auto p-0" asChild>
                              <link_1.default href={`/dashboard/forms/${relatedForm.id}`}>View</link_1.default>
                            </button_1.Button>
                          </div>))}
                      </div>
                    </div>))}
                </div>) : (<div className="text-sm text-muted-foreground text-center py-4">No other forms for this project</div>)}
            </card_1.CardContent>
          </card_1.Card>

          {/* Add the inspector comments card */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Inspector Comments</card_1.CardTitle>
              <card_1.CardDescription>Add notes or comments about this form</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <form_comment_1.FormComment formId={form.id}/>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map