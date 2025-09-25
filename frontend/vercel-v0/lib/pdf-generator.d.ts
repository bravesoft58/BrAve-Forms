import "jspdf-autotable";
declare module "jspdf" {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}
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
 * Generate a PDF for a form
 */
export declare function generateFormPDF(form: FormData): Promise<Blob>;
/**
 * Download a form as a PDF
 */
export declare function downloadFormPDF(form: FormData): Promise<void>;
export {};
//# sourceMappingURL=pdf-generator.d.ts.map