"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EditUserPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const select_1 = require("@/components/ui/select");
const switch_1 = require("@/components/ui/switch");
const use_toast_1 = require("@/components/ui/use-toast");
const auth_provider_1 = require("@/components/auth-provider");
const lucide_react_1 = require("lucide-react");
function EditUserPage({ params }) {
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    const { user } = (0, auth_provider_1.useAuth)();
    const [userData, setUserData] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        // Check if logged in user is admin
        if (user?.role !== "admin") {
            router.push("/dashboard");
            return;
        }
        const fetchUserData = async () => {
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
                status: "active",
            };
            setUserData(mockUser);
            setIsLoading(false);
        };
        fetchUserData();
    }, [params.id, router, user?.role]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        toast({
            title: "User updated",
            description: "The user has been updated successfully.",
        });
        setIsSaving(false);
        router.push(`/dashboard/users/${params.id}`);
    };
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    if (!userData) {
        return (<div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
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
          <link_1.default href={`/dashboard/users/${params.id}`}>
            <lucide_react_1.ChevronLeft className="h-4 w-4"/>
            <span className="sr-only">Back</span>
          </link_1.default>
        </button_1.Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <card_1.Card className="mt-6">
          <card_1.CardHeader>
            <card_1.CardTitle>User Details</card_1.CardTitle>
            <card_1.CardDescription>Edit user information and permissions</card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label_1.Label htmlFor="firstName">First Name</label_1.Label>
                <input_1.Input id="firstName" placeholder="Enter first name" defaultValue={userData.name.split(" ")[0]} required/>
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="lastName">Last Name</label_1.Label>
                <input_1.Input id="lastName" placeholder="Enter last name" defaultValue={userData.name.split(" ")[1] || ""} required/>
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="email">Email</label_1.Label>
              <input_1.Input id="email" type="email" placeholder="Enter email address" defaultValue={userData.email} required/>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="role">Role</label_1.Label>
              <select_1.Select defaultValue={userData.role}>
                <select_1.SelectTrigger id="role">
                  <select_1.SelectValue placeholder="Select role"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="admin">Administrator</select_1.SelectItem>
                  <select_1.SelectItem value="foreman">Foreman</select_1.SelectItem>
                  <select_1.SelectItem value="inspector">Inspector</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="company">Company</label_1.Label>
              <input_1.Input id="company" placeholder="Enter company name" defaultValue={userData.company} required/>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <label_1.Label htmlFor="active-status" className="flex items-center gap-2">
                <span>Active Status</span>
              </label_1.Label>
              <switch_1.Switch id="active-status" defaultChecked={userData.status === "active"}/>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="password">Reset Password</label_1.Label>
              <input_1.Input id="password" type="password" placeholder="Enter new password"/>
              <p className="text-sm text-muted-foreground">Leave blank to keep current password</p>
            </div>
          </card_1.CardContent>
          <card_1.CardFooter className="flex justify-end gap-4">
            <button_1.Button variant="outline" onClick={() => router.push(`/dashboard/users/${params.id}`)} type="button">
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