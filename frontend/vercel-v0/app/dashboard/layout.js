"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardLayout;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const auth_provider_1 = require("@/components/auth-provider");
const dashboard_nav_1 = __importDefault(require("@/components/dashboard-nav"));
function DashboardLayout({ children, }) {
    const { user, isLoading } = (0, auth_provider_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        if (!isLoading && !user) {
            console.log("No user found, redirecting to login");
            router.push("/login");
        }
    }, [user, isLoading, router]);
    if (isLoading) {
        return (<div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    if (!user) {
        return null;
    }
    return (<div className="flex min-h-screen flex-col">
      <dashboard_nav_1.default />
      <div className="flex-1">{children}</div>
    </div>);
}
//# sourceMappingURL=layout.js.map