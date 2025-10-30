"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleDashboard = RoleDashboard;
const auth_provider_1 = require("@/components/auth-provider");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
function RoleDashboard() {
    const { user } = (0, auth_provider_1.useAuth)();
    if (!user)
        return null;
    // Admin Dashboard
    if (user.role === "admin") {
        return (<div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">Active Projects</card_1.CardTitle>
              <lucide_react_1.FolderOpen className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </card_1.CardContent>
          </card_1.Card>
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">Total Users</card_1.CardTitle>
              <lucide_react_1.Users className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+3 from last month</p>
            </card_1.CardContent>
          </card_1.Card>
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">Forms Submitted</card_1.CardTitle>
              <lucide_react_1.FileText className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">132</div>
              <p className="text-xs text-muted-foreground">+24 from last month</p>
            </card_1.CardContent>
          </card_1.Card>
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">Compliance Rate</card_1.CardTitle>
              <lucide_react_1.BarChart3 className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">98%</div>
              <p className="text-xs text-muted-foreground">+2% from last month</p>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Pending Approvals</card_1.CardTitle>
              <card_1.CardDescription>Forms waiting for your approval</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <lucide_react_1.FileText className="h-5 w-5 text-primary"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">SWPPP Inspection</p>
                    <p className="text-sm text-muted-foreground">Riverside Apartments</p>
                  </div>
                  <button_1.Button variant="outline" size="sm">
                    Review
                  </button_1.Button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <lucide_react_1.FileText className="h-5 w-5 text-primary"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Safety Inspection</p>
                    <p className="text-sm text-muted-foreground">Downtown High-Rise</p>
                  </div>
                  <button_1.Button variant="outline" size="sm">
                    Review
                  </button_1.Button>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>System Health</card_1.CardTitle>
              <card_1.CardDescription>Current system status and metrics</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Storage</span>
                  <span className="text-sm font-medium">42% used</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[42%] rounded-full bg-primary"></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">File Storage</span>
                  <span className="text-sm font-medium">28% used</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[28%] rounded-full bg-primary"></div>
                </div>

                <div className="rounded-lg bg-green-50 p-3 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  <p className="text-sm">All systems operational</p>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>);
    }
    // Foreman Dashboard
    if (user.role === "foreman") {
        return (<div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">My Projects</card_1.CardTitle>
              <lucide_react_1.FolderOpen className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </card_1.CardContent>
          </card_1.Card>
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">Forms Submitted</card_1.CardTitle>
              <lucide_react_1.FileText className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </card_1.CardContent>
          </card_1.Card>
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">Upcoming Inspections</card_1.CardTitle>
              <lucide_react_1.Calendar className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </card_1.CardContent>
          </card_1.Card>
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">Compliance Rate</card_1.CardTitle>
              <lucide_react_1.BarChart3 className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">95%</div>
              <p className="text-xs text-muted-foreground">Across all projects</p>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Due Today</card_1.CardTitle>
              <card_1.CardDescription>Forms that need to be submitted today</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <lucide_react_1.FileText className="h-5 w-5 text-primary"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Dust Control Log</p>
                    <p className="text-sm text-muted-foreground">Downtown High-Rise</p>
                  </div>
                  <button_1.Button variant="outline" size="sm" asChild>
                    <link_1.default href="/dashboard/forms/new">Create</link_1.default>
                  </button_1.Button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <lucide_react_1.FileText className="h-5 w-5 text-primary"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">SWPPP Inspection</p>
                    <p className="text-sm text-muted-foreground">Riverside Apartments</p>
                  </div>
                  <button_1.Button variant="outline" size="sm" asChild>
                    <link_1.default href="/dashboard/forms/new">Create</link_1.default>
                  </button_1.Button>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Recent Activity</card_1.CardTitle>
              <card_1.CardDescription>Your recent form submissions</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <lucide_react_1.Clock className="h-5 w-5 text-primary"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Dust Control Log submitted</p>
                    <p className="text-sm text-muted-foreground">Downtown High-Rise - 2 days ago</p>
                  </div>
                  <button_1.Button variant="ghost" size="sm" asChild>
                    <link_1.default href="/dashboard/forms/1">
                      <lucide_react_1.ArrowUpRight className="h-4 w-4"/>
                    </link_1.default>
                  </button_1.Button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <lucide_react_1.Clock className="h-5 w-5 text-primary"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Safety Inspection submitted</p>
                    <p className="text-sm text-muted-foreground">Central Park Renovation - 3 days ago</p>
                  </div>
                  <button_1.Button variant="ghost" size="sm" asChild>
                    <link_1.default href="/dashboard/forms/3">
                      <lucide_react_1.ArrowUpRight className="h-4 w-4"/>
                    </link_1.default>
                  </button_1.Button>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>);
    }
    // Inspector Dashboard
    if (user.role === "inspector") {
        return (<div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">Assigned Projects</card_1.CardTitle>
              <lucide_react_1.FolderOpen className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </card_1.CardContent>
          </card_1.Card>
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">Forms Reviewed</card_1.CardTitle>
              <lucide_react_1.FileText className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </card_1.CardContent>
          </card_1.Card>
          <card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
              <card_1.CardTitle className="text-sm font-medium">Scheduled Inspections</card_1.CardTitle>
              <lucide_react_1.Calendar className="h-4 w-4 text-muted-foreground"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Forms Pending Review</card_1.CardTitle>
            <card_1.CardDescription>Forms that need your review and approval</card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <lucide_react_1.FileText className="h-5 w-5 text-primary"/>
                </div>
                <div className="flex-1">
                  <p className="font-medium">SWPPP Inspection</p>
                  <p className="text-sm text-muted-foreground">Riverside Apartments - Submitted 1 day ago</p>
                </div>
                <button_1.Button variant="outline" size="sm" asChild>
                  <link_1.default href="/dashboard/forms/2">Review</link_1.default>
                </button_1.Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <lucide_react_1.FileText className="h-5 w-5 text-primary"/>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Safety Inspection</p>
                  <p className="text-sm text-muted-foreground">Downtown High-Rise - Submitted 2 days ago</p>
                </div>
                <button_1.Button variant="outline" size="sm" asChild>
                  <link_1.default href="/dashboard/forms/3">Review</link_1.default>
                </button_1.Button>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }
    // Default dashboard for other roles
    return (<div className="space-y-6">
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Welcome to BrAve Forms</card_1.CardTitle>
          <card_1.CardDescription>Your construction forms management platform</card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <p>Please contact your administrator to set up your dashboard.</p>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
//# sourceMappingURL=role-dashboard.js.map