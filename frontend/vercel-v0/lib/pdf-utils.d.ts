import type { CompanySettings } from "./company-service";
interface FormData {
    id: string;
    type: string;
    project: {
        id: string;
        name: string;
    };
    submittedBy: string;
    submittedDate: string;
    status: "completed" | "pending" | "draft";
    content: Record<string, any>;
}
/**
 * Generate a simple PDF for a form
 */
export declare function generateSimplePDF(form: FormData): Promise<Blob>;
/**
 * Download a form as a PDF
 */
export declare function downloadFormPDF(form: FormData): Promise<void>;
/**
 * Alternative method to generate PDF from HTML content
 */
export declare function generatePDFFromHTML(elementId: string, filename: string): Promise<void>;
export declare function generateFormPDF(form: any, companySettings: CompanySettings): Promise<Blob>;
export declare function downloadBlob(blob: Blob, filename: string): void;
export {};
//# sourceMappingURL=pdf-utils.d.ts.map