"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminDashboardPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const auth_provider_1 = require("@/components/auth-provider");
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/components/ui/use-toast");
const system_settings_1 = require("@/components/admin/system-settings");
const security_settings_1 = require("@/components/admin/security-settings");
function AdminDashboardPage() {
    const { user } = (0, auth_provider_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [stats, setStats] = (0, react_1.useState)({
        totalUsers: 0,
        activeProjects: 0,
        pendingApprovals: 0,
        systemHealth: "Good",
    });
    (0, react_1.useEffect)(() => {
        // Check if user is admin
        if (user?.role !== "admin") {
            router.push("/dashboard");
            return;
        }
        // Simulate API call to fetch admin dashboard data
        const fetchData = async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Mock data
            setStats({
                totalUsers: 24,
                activeProjects: 12,
                pendingApprovals: 5,
                systemHealth: "Good",
            });
            setIsLoading(false);
        };
        fetchData();
    }, [user?.role, router]);
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    return (<div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and administrative controls</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
            <card_1.CardTitle className="text-sm font-medium">Total Users</card_1.CardTitle>
            <lucide_react_1.Users className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </card_1.CardContent>
        </card_1.Card>
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
            <card_1.CardTitle className="text-sm font-medium">Active Projects</card_1.CardTitle>
            <lucide_react_1.FolderOpen className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </card_1.CardContent>
        </card_1.Card>
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
            <card_1.CardTitle className="text-sm font-medium">Pending Approvals</card_1.CardTitle>
            <lucide_react_1.FileText className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </card_1.CardContent>
        </card_1.Card>
        <card_1.Card>
          <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
            <card_1.CardTitle className="text-sm font-medium">System Health</card_1.CardTitle>
            <lucide_react_1.BarChart3 className="h-4 w-4 text-muted-foreground"/>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{stats.systemHealth}</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      <tabs_1.Tabs defaultValue="users" className="mt-8">
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="users">User Management</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="system">System Settings</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="security">Security</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="users" className="mt-4 space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <card_1.CardTitle>User Management</card_1.CardTitle>
                  <card_1.CardDescription>Manage system users and permissions</card_1.CardDescription>
                </div>
                <button_1.Button asChild>
                  <link_1.default href="/dashboard/users">View All Users</link_1.default>
                </button_1.Button>
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Recent User Activity</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>New user registration</span>
                      <span className="text-muted-foreground">Today</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Role change: Jane Doe (Foreman → Admin)</span>
                      <span className="text-muted-foreground">Yesterday</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>User deactivated: Mike Johnson</span>
                      <span className="text-muted-foreground">3 days ago</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Quick Actions</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button_1.Button variant="outline" size="sm" asChild>
                      <link_1.default href="/dashboard/users/new">Add User</link_1.default>
                    </button_1.Button>
                    <button_1.Button variant="outline" size="sm" asChild>
                      <link_1.default href="/dashboard/users">Manage Roles</link_1.default>
                    </button_1.Button>
                    <button_1.Button variant="outline" size="sm" asChild>
                      <link_1.default href="/dashboard/users">View Inactive Users</link_1.default>
                    </button_1.Button>
                  </div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="system" className="mt-4 space-y-4">
          <system_settings_1.AdminSystemSettings />
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="security" className="mt-4 space-y-4">
          <security_settings_1.AdminSecuritySettings />
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
//# sourceMappingURL=page.js.map