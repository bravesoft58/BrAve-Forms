import { type ReactNode } from "react";
interface Tenant {
    id: string;
    name: string;
    domain: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
}
interface TenantContextType {
    currentTenant: Tenant | null;
    setCurrentTenant: (tenant: Tenant) => void;
    isLoading: boolean;
}
export declare function TenantProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useTenant(): TenantContextType;
export {};
//# sourceMappingURL=tenant-provider.d.ts.map