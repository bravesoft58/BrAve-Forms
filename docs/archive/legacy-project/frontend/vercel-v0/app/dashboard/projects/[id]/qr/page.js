"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProjectQRCodePage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/components/ui/use-toast");
function ProjectQRCodePage({ params }) {
    const { toast } = (0, use_toast_1.useToast)();
    const [project, setProject] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchProject = async () => {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Mock project data
            const mockProject = {
                id: params.id,
                name: params.id === "1"
                    ? "Downtown High-Rise"
                    : params.id === "2"
                        ? "Riverside Apartments"
                        : params.id === "3"
                            ? "Central Park Renovation"
                            : params.id === "4"
                                ? "Harbor Bridge Repair"
                                : `Project ${params.id}`,
                address: params.id === "1"
                    ? "123 Main St, Cityville"
                    : params.id === "2"
                        ? "456 River Rd, Townsville"
                        : params.id === "3"
                            ? "789 Park Ave, Metropolis"
                            : params.id === "4"
                                ? "101 Harbor Way, Baytown"
                                : `Address for Project ${params.id}`,
                status: "active",
                startDate: "2024-01-15",
                description: "A 30-story commercial building with retail space on the ground floor.",
            };
            setProject(mockProject);
            setIsLoading(false);
        };
        fetchProject();
    }, [params.id]);
    const handleDownload = () => {
        toast({
            title: "QR Code downloaded",
            description: "The QR code has been downloaded successfully.",
        });
    };
    const handleShare = () => {
        // In a real app, this would open a share dialog or copy the URL
        toast({
            title: "Link copied",
            description: "The project access link has been copied to your clipboard.",
        });
    };
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    if (!project) {
        return (<div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <lucide_react_1.FolderOpen className="h-10 w-10 text-muted-foreground"/>
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
        <h1 className="text-2xl font-bold tracking-tight">Project QR Code</h1>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Project QR Code</card_1.CardTitle>
            <card_1.CardDescription>Scan this QR code to access the project</card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="flex flex-col items-center gap-6">
              <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-lg border bg-white p-4">
                <image_1.default src={`/placeholder.svg?height=300&width=300&text=QR+Code+for+${encodeURIComponent(project.name)}`} alt="QR Code" fill className="object-contain"/>
              </div>
              <div className="flex gap-4">
                <button_1.Button variant="outline" onClick={handleDownload} className="gap-2">
                  <lucide_react_1.Download className="h-4 w-4"/>
                  Download
                </button_1.Button>
                <button_1.Button variant="outline" onClick={handleShare} className="gap-2">
                  <lucide_react_1.Share2 className="h-4 w-4"/>
                  Share Link
                </button_1.Button>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Project Information</card_1.CardTitle>
            <card_1.CardDescription>Details about the project this QR code links to</card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <lucide_react_1.FolderOpen className="h-5 w-5 text-primary"/>
                </div>
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.address}</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">QR Code Access Information</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Access Type:</span>
                    <span>Read-only</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expiration:</span>
                    <span>Never</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Authentication Required:</span>
                    <span>No</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-200">Important Note</h3>
                <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">
                  This QR code provides read-only access to the project. Anyone with this QR code can view the project's
                  basic information without needing to log in.
                </p>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map