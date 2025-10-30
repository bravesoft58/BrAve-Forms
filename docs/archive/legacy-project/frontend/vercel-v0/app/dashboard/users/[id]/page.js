"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UserDetailPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const auth_provider_1 = require("@/components/auth-provider");
const use_toast_1 = require("@/components/ui/use-toast");
const lucide_react_1 = require("lucide-react");
function UserDetailPage({ params }) {
    const { user } = (0, auth_provider_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    const [userDetails, setUserDetails] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // Check if logged in user is admin
        if (user?.role !== "admin") {
            router.push("/dashboard");
            return;
        }
        const fetchUserDetails = async () => {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Mock user data
            const mockUser = {
                id: params.id,
                name: params.id === "1"
                    ? "John Smith"
                    : params.id === "2"
                        ? "Jane Doe"
                        : params.id === "3"
                            ? "Mike Johnson"
                            : "User " + params.id,
                email: params.id === "1"
                    ? "admin@example.com"
                    : params.id === "2"
                        ? "foreman@example.com"
                        : params.id === "3"
                            ? "inspector@example.com"
                            : `user${params.id}@example.com`,
                role: params.id === "1"
                    ? "admin"
                    : params.id === "2"
                        ? "foreman"
                        : params.id === "3"
                            ? "inspector"
                            : ["admin", "foreman", "inspector"][Math.floor(Math.random() * 3)],
                company: "Construction Co",
                lastActive: "2024-03-02",
                status: "active",
                joinDate: "2023-01-15",
                projects: [
                    {
                        id: "1",
                        name: "Downtown High-Rise",
                        role: "Project Manager",
                    },
                    {
                        id: "2",
                        name: "Riverside Apartments",
                        role: "Site Supervisor",
                    },
                    {
                        id: "3",
                        name: "Central Park Renovation",
                        role: "Environmental Specialist",
                    },
                ],
                recentActivity: [
                    {
                        id: "1",
                        type: "Form Submission",
                        description: "Submitted Dust Control Log for Downtown High-Rise",
                        date: "2024-03-02",
                    },
                    {
                        id: "2",
                        type: "Project Access",
                        description: "Accessed Riverside Apartments project details",
                        date: "2024-03-01",
                    },
                    {
                        id: "3",
                        type: "Form Edit",
                        description: "Updated SWPPP Inspection for Central Park Renovation",
                        date: "2024-02-28",
                    },
                ],
            };
            setUserDetails(mockUser);
            setIsLoading(false);
        };
        fetchUserDetails();
    }, [params.id, router, user?.role]);
    const handleDeactivateUser = () => {
        if (!userDetails)
            return;
        setUserDetails({
            ...userDetails,
            status: userDetails.status === "active" ? "inactive" : "active",
        });
        toast({
            title: `User ${userDetails.status === "active" ? "deactivated" : "activated"}`,
            description: `${userDetails.name} has been ${userDetails.status === "active" ? "deactivated" : "activated"} successfully.`,
        });
    };
    const handleDeleteUser = () => {
        if (!userDetails)
            return;
        toast({
            title: "User deleted",
            description: `${userDetails.name} has been deleted successfully.`,
            variant: "destructive",
        });
        router.push("/dashboard/users");
    };
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    if (!userDetails) {
        return (<div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <lucide_react_1.User className="h-10 w-10 text-muted-foreground"/>
          <h3 className="mt-4 text-lg font-semibold">User not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The user you're looking for doesn't exist or has been deleted.
          </p>
          <link_1.default href="/dashboard/users" className="mt-4">
            <button_1.Button variant="outline">Back to Users</button_1.Button>
          </link_1.default>
        </div>
      </div>);
    }
    return (<div className="container py-6">
      <div className="flex items-center gap-2">
        <button_1.Button variant="outline" size="icon" asChild>
          <link_1.default href="/dashboard/users">
            <lucide_react_1.ChevronLeft className="h-4 w-4"/>
            <span className="sr-only">Back</span>
          </link_1.default>
        </button_1.Button>
        <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>User Profile</card_1.CardTitle>
              <card_1.CardDescription>Basic information about the user</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold">
                  {userDetails.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
                </div>
                <h2 className="mt-4 text-xl font-bold">{userDetails.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <lucide_react_1.UserCog className="h-4 w-4"/>
                  <span className="capitalize">{userDetails.role}</span>
                </div>
                <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${userDetails.status === "active"
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                  {userDetails.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <lucide_react_1.Mail className="h-4 w-4 text-muted-foreground"/>
                  <span>{userDetails.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <lucide_react_1.Building className="h-4 w-4 text-muted-foreground"/>
                  <span>{userDetails.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <lucide_react_1.Calendar className="h-4 w-4 text-muted-foreground"/>
                  <span>Joined: {userDetails.joinDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <lucide_react_1.Clock className="h-4 w-4 text-muted-foreground"/>
                  <span>Last active: {userDetails.lastActive}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button_1.Button asChild variant="outline" className="w-full">
                  <link_1.default href={`/dashboard/users/${userDetails.id}/edit`}>
                    <lucide_react_1.Edit className="mr-2 h-4 w-4"/>
                    Edit User
                  </link_1.default>
                </button_1.Button>
                <button_1.Button variant={userDetails.status === "active" ? "outline" : "default"} className={`w-full ${userDetails.status === "active" ? "text-amber-600 border-amber-600" : ""}`} onClick={handleDeactivateUser}>
                  <lucide_react_1.Shield className="mr-2 h-4 w-4"/>
                  {userDetails.status === "active" ? "Deactivate User" : "Activate User"}
                </button_1.Button>
                <button_1.Button variant="destructive" className="w-full" onClick={handleDeleteUser}>
                  <lucide_react_1.Trash2 className="mr-2 h-4 w-4"/>
                  Delete User
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <tabs_1.Tabs defaultValue="projects">
            <tabs_1.TabsList>
              <tabs_1.TabsTrigger value="projects">Projects</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="activity">Recent Activity</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="permissions">Permissions</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="projects" className="mt-4">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Assigned Projects</card_1.CardTitle>
                  <card_1.CardDescription>Projects this user is assigned to</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-4">
                    {userDetails.projects.map((project) => (<div key={project.id} className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <lucide_react_1.Building className="h-5 w-5 text-primary"/>
                        </div>
                        <div className="flex-1">
                          <link_1.default href={`/dashboard/projects/${project.id}`} className="font-medium hover:underline">
                            {project.name}
                          </link_1.default>
                          <p className="text-sm text-muted-foreground">Role: {project.role}</p>
                        </div>
                        <button_1.Button variant="outline" size="sm" asChild>
                          <link_1.default href={`/dashboard/projects/${project.id}`}>View</link_1.default>
                        </button_1.Button>
                      </div>))}
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="activity" className="mt-4">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Recent Activity</card_1.CardTitle>
                  <card_1.CardDescription>User's recent actions and activity</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-4">
                    {userDetails.recentActivity.map((activity) => (<div key={activity.id} className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          {activity.type === "Form Submission" ? (<lucide_react_1.FileText className="h-5 w-5 text-primary"/>) : activity.type === "Project Access" ? (<lucide_react_1.Building className="h-5 w-5 text-primary"/>) : (<lucide_react_1.Edit className="h-5 w-5 text-primary"/>)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.type}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.date}</p>
                        </div>
                      </div>))}
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="permissions" className="mt-4">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>User Permissions</card_1.CardTitle>
                  <card_1.CardDescription>Manage what this user can access</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <lucide_react_1.Shield className="h-5 w-5 text-primary"/>
                          <span className="font-medium">Role: {userDetails.role}</span>
                        </div>
                        <button_1.Button variant="outline" size="sm" asChild>
                          <link_1.default href={`/dashboard/users/${userDetails.id}/edit`}>Change</link_1.default>
                        </button_1.Button>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {userDetails.role === "admin"
            ? "Full access to all features, including user management and system settings."
            : userDetails.role === "foreman"
                ? "Can manage projects, create and edit forms, and view all project data."
                : "Read-only access to assigned projects and forms."}
                      </p>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
                      <div className="flex items-center gap-2">
                        <lucide_react_1.AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400"/>
                        <span className="font-medium text-amber-800 dark:text-amber-300">Changing permissions</span>
                      </div>
                      <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                        Changing a user's role will immediately affect their access to the system. Make sure the user is
                        aware of these changes before proceeding.
                      </p>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map