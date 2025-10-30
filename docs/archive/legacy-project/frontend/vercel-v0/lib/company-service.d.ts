export interface CompanySettings {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    description: string;
    logo: string | null;
}
export declare function getCompanySettings(): Promise<CompanySettings>;
export declare function updateCompanySettings(settings: CompanySettings): Promise<CompanySettings>;
export declare function uploadCompanyLogo(file: File): Promise<string>;
//# sourceMappingURL=company-service.d.ts.map