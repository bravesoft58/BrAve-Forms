import type React from "react";
type User = {
    id: string;
    name: string;
    email: string;
    role: "admin" | "foreman" | "inspector";
};
type AuthContextType = {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
};
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
//# sourceMappingURL=auth-provider.d.ts.map