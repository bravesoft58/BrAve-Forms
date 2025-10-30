"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantProvider = TenantProvider;
exports.useTenant = useTenant;
const react_1 = require("react");
const TenantContext = (0, react_1.createContext)(undefined);
function TenantProvider({ children }) {
    const [currentTenant, setCurrentTenant] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // In a real implementation, this would determine the tenant based on:
        // 1. URL/subdomain
        // 2. User's assigned tenant
        // 3. API call to get tenant details
        const detectTenant = async () => {
            try {
                // For demo purposes, we'll use a mock tenant
                // In production, this would be determined by the hostname or other factors
                const hostname = window.location.hostname;
                // Simulate API call
                await new Promise((resolve) => setTimeout(resolve, 500));
                // Mock tenant data
                const mockTenant = {
                    id: "1",
                    name: "BrAve Construction",
                    domain: hostname,
                    primaryColor: "#1e40af", // Blue
                    secondaryColor: "#4f46e5", // Indigo
                };
                setCurrentTenant(mockTenant);
                setIsLoading(false);
            }
            catch (error) {
                console.error("Error detecting tenant:", error);
                setIsLoading(false);
            }
        };
        detectTenant();
    }, []);
    return (<TenantContext.Provider value={{ currentTenant, setCurrentTenant, isLoading }}>{children}</TenantContext.Provider>);
}
function useTenant() {
    const context = (0, react_1.useContext)(TenantContext);
    if (context === undefined) {
        throw new Error("useTenant must be used within a TenantProvider");
    }
    return context;
}
//# sourceMappingURL=tenant-provider.js.map