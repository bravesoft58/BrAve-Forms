"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UsersPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const table_1 = require("@/components/ui/table");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const auth_provider_1 = require("@/components/auth-provider");
const use_toast_1 = require("@/components/ui/use-toast");
const lucide_react_1 = require("lucide-react");
const navigation_1 = require("next/navigation");
const select_1 = require("@/components/ui/select");
function UsersPage() {
    const { user } = (0, auth_provider_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [users, setUsers] = (0, react_1.useState)([]);
    const [filteredUsers, setFilteredUsers] = (0, react_1.useState)([]);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [roleFilter, setRoleFilter] = (0, react_1.useState)("all");
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        // Check if user is admin
        if (user?.role !== "admin") {
            router.push("/dashboard");
            return;
        }
        const fetchUsers = async () => {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Try to get users from localStorage first
            let usersData = [];
            try {
                const storedUsers = localStorage.getItem("users");
                if (storedUsers) {
                    usersData = JSON.parse(storedUsers);
                    console.log("Retrieved users from localStorage:", usersData);
                }
            }
            catch (error) {
                console.error("Error loading users from localStorage:", error);
            }
            // If no users in localStorage or error occurred, use mock data
            if (!usersData || usersData.length === 0) {
                // Mock user data
                usersData = [
                    {
                        id: "1",
                        name: "John Smith",
                        email: "admin@example.com",
                        role: "admin",
                        company: "Construction Co",
                        lastActive: "2024-03-02",
                        status: "active",
                    },
                    {
                        id: "2",
                        name: "Jane Doe",
                        email: "foreman@example.com",
                        role: "foreman",
                        company: "Construction Co",
                        lastActive: "2024-03-01",
                        status: "active",
                    },
                    {
                        id: "3",
                        name: "Mike Johnson",
                        email: "inspector@example.com",
                        role: "inspector",
                        company: "City Inspector Office",
                        lastActive: "2024-02-28",
                        status: "active",
                    },
                    {
                        id: "4",
                        name: "Sarah Williams",
                        email: "sarah.williams@example.com",
                        role: "foreman",
                        company: "Construction Co",
                        lastActive: "2024-02-27",
                        status: "inactive",
                    },
                    {
                        id: "5",
                        name: "Robert Brown",
                        email: "robert.brown@example.com",
                        role: "inspector",
                        company: "County Environmental Agency",
                        lastActive: "2024-02-25",
                        status: "active",
                    },
                    {
                        id: "6",
                        name: "Emily Davis",
                        email: "emily.davis@example.com",
                        role: "foreman",
                        company: "Construction Co",
                        lastActive: "2024-02-20",
                        status: "active",
                    },
                    {
                        id: "7",
                        name: "David Wilson",
                        email: "david.wilson@example.com",
                        role: "admin",
                        company: "Construction Co",
                        lastActive: "2024-02-15",
                        status: "active",
                    },
                ];
            }
            setUsers(usersData);
            setFilteredUsers(usersData);
            setIsLoading(false);
        };
        fetchUsers();
    }, [user, router]);
    (0, react_1.useEffect)(() => {
        // Filter users based on search query and role filter
        let filtered = [...users];
        if (searchQuery) {
            filtered = filtered.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.company.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (roleFilter !== "all") {
            filtered = filtered.filter((user) => user.role === roleFilter);
        }
        setFilteredUsers(filtered);
    }, [searchQuery, roleFilter, users]);
    const handleStatusToggle = (userId) => {
        const targetUser = users.find((user) => user.id === userId);
        if (!targetUser)
            return;
        const newStatus = targetUser.status === "active" ? "inactive" : "active";
        const updatedUsers = users.map((user) => (user.id === userId ? { ...user, status: newStatus } : user));
        setUsers(updatedUsers);
        toast({
            title: `User ${newStatus === "active" ? "activated" : "deactivated"}`,
            description: `${targetUser.name} has been ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
        });
    };
    const handleDeleteUser = (userId) => {
        const targetUser = users.find((user) => user.id === userId);
        if (!targetUser)
            return;
        // Filter out the deleted user
        const updatedUsers = users.filter((user) => user.id !== userId);
        setUsers(updatedUsers);
        toast({
            title: "User deleted",
            description: `${targetUser.name} has been deleted successfully.`,
            variant: "destructive",
        });
    };
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    return (<div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user access and permissions</p>
        </div>
        <button_1.Button asChild>
          <link_1.default href="/dashboard/users/new">
            <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
            Add User
          </link_1.default>
        </button_1.Button>
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <lucide_react_1.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
            <input_1.Input type="search" placeholder="Search users..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
          </div>
          <div className="w-[180px]">
            <select_1.Select value={roleFilter} onValueChange={setRoleFilter}>
              <select_1.SelectTrigger>
                <div className="flex items-center gap-2">
                  <lucide_react_1.Filter className="h-4 w-4"/>
                  <select_1.SelectValue placeholder="Filter by role"/>
                </div>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="all">All Roles</select_1.SelectItem>
                <select_1.SelectItem value="admin">Admin</select_1.SelectItem>
                <select_1.SelectItem value="foreman">Foreman</select_1.SelectItem>
                <select_1.SelectItem value="inspector">Inspector</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>
        </div>

        <div className="mt-6 rounded-md border">
          <table_1.Table>
            <table_1.TableHeader>
              <table_1.TableRow>
                <table_1.TableHead>Name</table_1.TableHead>
                <table_1.TableHead>Role</table_1.TableHead>
                <table_1.TableHead>Company</table_1.TableHead>
                <table_1.TableHead>Last Active</table_1.TableHead>
                <table_1.TableHead>Status</table_1.TableHead>
                <table_1.TableHead className="text-right">Actions</table_1.TableHead>
              </table_1.TableRow>
            </table_1.TableHeader>
            <table_1.TableBody>
              {filteredUsers.map((user) => (<table_1.TableRow key={user.id}>
                  <table_1.TableCell>
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium">
                          {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <lucide_react_1.Mail className="h-3 w-3"/>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </table_1.TableCell>
                  <table_1.TableCell>
                    <div className="flex items-center gap-2">
                      <lucide_react_1.UserCog className="h-4 w-4 text-muted-foreground"/>
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </table_1.TableCell>
                  <table_1.TableCell>
                    <div className="flex items-center gap-2">
                      <lucide_react_1.Building className="h-4 w-4 text-muted-foreground"/>
                      <span>{user.company}</span>
                    </div>
                  </table_1.TableCell>
                  <table_1.TableCell>
                    <div className="flex items-center gap-2">
                      <lucide_react_1.Calendar className="h-4 w-4 text-muted-foreground"/>
                      <span>{user.lastActive}</span>
                    </div>
                  </table_1.TableCell>
                  <table_1.TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                      {user.status}
                    </span>
                  </table_1.TableCell>
                  <table_1.TableCell className="text-right">
                    <dropdown_menu_1.DropdownMenu>
                      <dropdown_menu_1.DropdownMenuTrigger asChild>
                        <button_1.Button variant="ghost" size="icon" className="h-8 w-8">
                          <lucide_react_1.MoreHorizontal className="h-4 w-4"/>
                          <span className="sr-only">Open menu</span>
                        </button_1.Button>
                      </dropdown_menu_1.DropdownMenuTrigger>
                      <dropdown_menu_1.DropdownMenuContent align="end">
                        <dropdown_menu_1.DropdownMenuLabel>Actions</dropdown_menu_1.DropdownMenuLabel>
                        <dropdown_menu_1.DropdownMenuSeparator />
                        <dropdown_menu_1.DropdownMenuItem asChild>
                          <link_1.default href={`/dashboard/users/${user.id}`}>View Details</link_1.default>
                        </dropdown_menu_1.DropdownMenuItem>
                        <dropdown_menu_1.DropdownMenuItem asChild>
                          <link_1.default href={`/dashboard/users/${user.id}/edit`}>Edit User</link_1.default>
                        </dropdown_menu_1.DropdownMenuItem>
                        <dropdown_menu_1.DropdownMenuItem onClick={() => handleStatusToggle(user.id)}>
                          {user.status === "active" ? "Deactivate" : "Activate"} User
                        </dropdown_menu_1.DropdownMenuItem>
                        <dropdown_menu_1.DropdownMenuSeparator />
                        <dropdown_menu_1.DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive focus:text-destructive">
                          Delete User
                        </dropdown_menu_1.DropdownMenuItem>
                      </dropdown_menu_1.DropdownMenuContent>
                    </dropdown_menu_1.DropdownMenu>
                  </table_1.TableCell>
                </table_1.TableRow>))}
            </table_1.TableBody>
          </table_1.Table>
        </div>

        {filteredUsers.length === 0 && (<div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <lucide_react_1.UserCog className="h-10 w-10 text-muted-foreground"/>
            <h3 className="mt-4 text-lg font-semibold">No users found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery || roleFilter !== "all"
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Get started by adding your first user."}
            </p>
            <button_1.Button asChild className="mt-4">
              <link_1.default href="/dashboard/users/new">
                <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
                Add User
              </link_1.default>
            </button_1.Button>
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map