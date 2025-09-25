"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyLogo = CompanyLogo;
const react_1 = require("react");
const image_1 = __importDefault(require("next/image"));
const lucide_react_1 = require("lucide-react");
const company_service_1 = require("@/lib/company-service");
function CompanyLogo({ className = "", size = "md" }) {
    const [logo, setLogo] = (0, react_1.useState)(null);
    const [companyName, setCompanyName] = (0, react_1.useState)("Company Name");
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    // Add a refresh counter to force re-fetch when localStorage changes
    const [refreshCounter, setRefreshCounter] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        // Listen for storage events to detect changes from other tabs/components
        const handleStorageChange = (e) => {
            if (e.key === "companySettings" || e.key === "companyLogo" || e.key === "companyName") {
                setRefreshCounter((prev) => prev + 1);
            }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);
    (0, react_1.useEffect)(() => {
        const fetchCompanyInfo = async () => {
            setIsLoading(true);
            try {
                const settings = await (0, company_service_1.getCompanySettings)();
                setLogo(settings.logo);
                setCompanyName(settings.name);
            }
            catch (error) {
                console.error("Error fetching company info:", error);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchCompanyInfo();
    }, [refreshCounter]); // Re-fetch when refreshCounter changes
    // Size classes
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-20 w-20",
    };
    const containerClasses = {
        sm: "h-8",
        md: "h-12",
        lg: "h-20",
    };
    if (isLoading) {
        return (<div className={`flex items-center ${containerClasses[size]} animate-pulse`}>
        <div className={`${sizeClasses[size]} rounded-md bg-muted`}></div>
      </div>);
    }
    return (<div className={`flex items-center gap-3 ${className}`}>
      {logo ? (<div className={`relative ${sizeClasses[size]} overflow-hidden rounded-md`}>
          <image_1.default src={logo || "/placeholder.svg"} alt={`${companyName} logo`} fill className="object-contain"/>
        </div>) : (<div className={`flex ${sizeClasses[size]} items-center justify-center rounded-md bg-primary/10`}>
          <lucide_react_1.Building className="h-1/2 w-1/2 text-primary"/>
        </div>)}
      <span className="text-lg font-semibold">{companyName}</span>
    </div>);
}
//# sourceMappingURL=company-logo.js.map