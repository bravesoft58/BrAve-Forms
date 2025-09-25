"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const auth_provider_1 = require("@/components/auth-provider");
const role_dashboard_1 = require("@/components/role-dashboard");
function DashboardPage() {
    const { user } = (0, auth_provider_1.useAuth)();
    const [recentProjects, setRecentProjects] = (0, react_1.useState)([]);
    const [recentLogs, setRecentLogs] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // Simulate API call to fetch data
        const fetchData = async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Mock data
            const mockProjects = [
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
            ];
            const mockLogs = [
                {
                    id: "1",
                    projectId: "1",
                    projectName: "Downtown High-Rise",
                    type: "Dust Control",
                    date: "2023-05-15",
                    updatedBy: "John Smith",
                },
                {
                    id: "2",
                    projectId: "2",
                    projectName: "Riverside Apartments",
                    type: "SWPPP",
                    date: "2023-05-14",
                    updatedBy: "Jane Doe",
                },
                {
                    id: "3",
                    projectId: "1",
                    projectName: "Downtown High-Rise",
                    type: "Safety Inspection",
                    date: "2023-05-13",
                    updatedBy: "John Smith",
                },
                {
                    id: "4",
                    projectId: "3",
                    projectName: "Central Park Renovation",
                    type: "Dust Control",
                    date: "2023-05-12",
                    updatedBy: "Mike Johnson",
                },
            ];
            setRecentProjects(mockProjects);
            setRecentLogs(mockLogs);
            setIsLoading(false);
        };
        fetchData();
    }, []);
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    return (<div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's what's happening with your projects.
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "foreman") && (<div className="flex gap-2">
            <link_1.default href="/dashboard/projects/new">
              <button_1.Button className="gap-2">
                <lucide_react_1.Plus className="h-4 w-4"/>
                New Project
              </button_1.Button>
            </link_1.default>
            <link_1.default href="/dashboard/forms/new">
              <button_1.Button variant="outline" className="gap-2">
                <lucide_react_1.FileText className="h-4 w-4"/>
                New Form
              </button_1.Button>
            </link_1.default>
          </div>)}
      </div>

      <div className="mt-8">
        <role_dashboard_1.RoleDashboard />
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map