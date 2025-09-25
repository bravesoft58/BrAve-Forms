"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardNav;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const auth_provider_1 = require("@/components/auth-provider");
const logo_1 = require("@/components/ui/logo");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const sheet_1 = require("@/components/ui/sheet");
const notification_dropdown_1 = require("@/components/notification-dropdown");
function DashboardNav() {
    const { user, logout } = (0, auth_provider_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const pathname = (0, navigation_1.usePathname)();
    const [open, setOpen] = (0, react_1.useState)(false);
    const handleLogout = () => {
        logout();
        router.push("/login");
    };
    const navItems = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: <lucide_react_1.LayoutDashboard className="h-5 w-5"/>,
            roles: ["admin", "foreman", "inspector"],
        },
        {
            title: "Projects",
            href: "/dashboard/projects",
            icon: <lucide_react_1.FolderOpen className="h-5 w-5"/>,
            roles: ["admin", "foreman", "inspector"],
        },
        {
            title: "Forms",
            href: "/dashboard/forms",
            icon: <lucide_react_1.FileText className="h-5 w-5"/>,
            roles: ["admin", "foreman", "inspector"],
        },
        {
            title: "Users",
            href: "/dashboard/users",
            icon: <lucide_react_1.Users className="h-5 w-5"/>,
            roles: ["admin"],
        },
        {
            title: "Company",
            href: "/dashboard/company",
            icon: <lucide_react_1.Building className="h-5 w-5"/>,
            roles: ["admin"],
        },
        {
            title: "Admin",
            href: "/dashboard/admin",
            icon: <lucide_react_1.Shield className="h-5 w-5"/>,
            roles: ["admin"],
        },
        {
            title: "Settings",
            href: "/dashboard/settings",
            icon: <lucide_react_1.Settings className="h-5 w-5"/>,
            roles: ["admin", "foreman", "inspector"],
        },
    ];
    const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role || ""));
    return (<header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <sheet_1.Sheet open={open} onOpenChange={setOpen}>
            <sheet_1.SheetTrigger asChild className="lg:hidden">
              <button_1.Button variant="outline" size="icon" className="mr-2">
                <lucide_react_1.Menu className="h-5 w-5"/>
                <span className="sr-only">Toggle menu</span>
              </button_1.Button>
            </sheet_1.SheetTrigger>
            <sheet_1.SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center border-b px-4">
                <logo_1.Logo href="/dashboard" size="lg" onClick={() => setOpen(false)}/>
              </div>
              <nav className="grid gap-1 p-4">
                {filteredNavItems.map((item, index) => (<link_1.default key={index} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium ${pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {item.icon}
                    {item.title}
                  </link_1.default>))}
                <div className="mt-4 pt-4 border-t">
                  <button_1.Button variant="destructive" className="w-full justify-start" onClick={() => {
            setOpen(false);
            handleLogout();
        }}>
                    <lucide_react_1.LogOut className="mr-2 h-4 w-4"/>
                    Log out
                  </button_1.Button>
                </div>
              </nav>
            </sheet_1.SheetContent>
          </sheet_1.Sheet>
          <logo_1.Logo href="/dashboard" size="lg"/>
        </div>
        <nav className="hidden lg:flex gap-6 ml-6">
          {filteredNavItems.map((item, index) => (<link_1.default key={index} href={item.href} className={`flex items-center gap-2 text-sm font-medium ${pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {item.icon}
              {item.title}
            </link_1.default>))}
        </nav>
        <div className="flex items-center gap-4">
          <notification_dropdown_1.NotificationDropdown />
          <dropdown_menu_1.DropdownMenu>
            <dropdown_menu_1.DropdownMenuTrigger asChild>
              <button_1.Button variant="outline" className="gap-2">
                {user?.name?.split(" ")[0] || "User"}
              </button_1.Button>
            </dropdown_menu_1.DropdownMenuTrigger>
            <dropdown_menu_1.DropdownMenuContent align="end">
              <dropdown_menu_1.DropdownMenuLabel>My Account</dropdown_menu_1.DropdownMenuLabel>
              <dropdown_menu_1.DropdownMenuSeparator />
              <dropdown_menu_1.DropdownMenuItem>
                <link_1.default href="/dashboard/profile" className="flex w-full">
                  Profile
                </link_1.default>
              </dropdown_menu_1.DropdownMenuItem>
              <dropdown_menu_1.DropdownMenuItem>
                <link_1.default href="/dashboard/settings" className="flex w-full">
                  Settings
                </link_1.default>
              </dropdown_menu_1.DropdownMenuItem>
              {user?.role === "admin" && (<dropdown_menu_1.DropdownMenuItem>
                  <link_1.default href="/dashboard/company" className="flex w-full">
                    Company Settings
                  </link_1.default>
                </dropdown_menu_1.DropdownMenuItem>)}
              <dropdown_menu_1.DropdownMenuSeparator />
              <dropdown_menu_1.DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <lucide_react_1.LogOut className="mr-2 h-4 w-4"/>
                <span>Log out</span>
              </dropdown_menu_1.DropdownMenuItem>
            </dropdown_menu_1.DropdownMenuContent>
          </dropdown_menu_1.DropdownMenu>
        </div>
      </div>
    </header>);
}
//# sourceMappingURL=dashboard-nav.js.map