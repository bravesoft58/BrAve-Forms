"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSimplePDF = generateSimplePDF;
exports.downloadFormPDF = downloadFormPDF;
exports.generatePDFFromHTML = generatePDFFromHTML;
exports.generateFormPDF = generateFormPDF;
exports.downloadBlob = downloadBlob;
const html2canvas_1 = __importDefault(require("html2canvas"));
const jspdf_1 = require("jspdf");
/**
 * Generate a simple PDF for a form
 */
async function generateSimplePDF(form) {
    try {
        console.log("Generating simple PDF for form:", form);
        // Create a new PDF document
        const doc = new jspdf_1.jsPDF();
        // Add title
        doc.setFontSize(22);
        doc.text(`${form.type}`, 105, 20, { align: "center" });
        // Add form details
        doc.setFontSize(12);
        doc.text(`Project: ${form.project.name}`, 20, 40);
        doc.text(`Submitted By: ${form.submittedBy}`, 20, 50);
        doc.text(`Date: ${form.submittedDate}`, 20, 60);
        doc.text(`Status: ${form.status}`, 20, 70);
        // Add form content
        doc.setFontSize(16);
        doc.text("Form Content:", 20, 90);
        let yPos = 100;
        // Add content based on form type
        if (form.content) {
            if (form.type === "Dust Control Log" || form.type === "Dust Control") {
                if (form.content.weatherConditions) {
                    doc.setFontSize(12);
                    doc.text(`Weather: ${form.content.weatherConditions}`, 30, yPos);
                    yPos += 10;
                }
                if (form.content.windSpeed) {
                    doc.text(`Wind Speed: ${form.content.windSpeed}`, 30, yPos);
                    yPos += 10;
                }
                if (form.content.dustControlMeasures && Array.isArray(form.content.dustControlMeasures)) {
                    doc.text("Dust Control Measures:", 30, yPos);
                    yPos += 10;
                    form.content.dustControlMeasures.forEach((measure) => {
                        doc.text(`• ${measure}`, 40, yPos);
                        yPos += 8;
                    });
                }
                if (form.content.notes) {
                    yPos += 5;
                    doc.text("Notes:", 30, yPos);
                    yPos += 8;
                    const splitNotes = doc.splitTextToSize(form.content.notes, 150);
                    doc.text(splitNotes, 40, yPos);
                    yPos += splitNotes.length * 8;
                }
            }
            else if (form.type === "SWPPP Inspection" || form.type === "SWPPP") {
                if (form.content.rainfall) {
                    doc.setFontSize(12);
                    doc.text(`Rainfall: ${form.content.rainfall}`, 30, yPos);
                    yPos += 10;
                }
                if (form.content.inspectionType) {
                    doc.text(`Inspection Type: ${form.content.inspectionType}`, 30, yPos);
                    yPos += 10;
                }
                if (form.content.bmpConditions && Array.isArray(form.content.bmpConditions)) {
                    doc.text("BMP Conditions:", 30, yPos);
                    yPos += 10;
                    form.content.bmpConditions.forEach((condition) => {
                        doc.text(`• ${condition}`, 40, yPos);
                        yPos += 8;
                    });
                }
                if (form.content.correctiveActions) {
                    yPos += 5;
                    doc.text("Corrective Actions:", 30, yPos);
                    yPos += 8;
                    const splitActions = doc.splitTextToSize(form.content.correctiveActions, 150);
                    doc.text(splitActions, 40, yPos);
                    yPos += splitActions.length * 8;
                }
            }
            else if (form.type === "Safety Inspection") {
                if (form.content.findings && Array.isArray(form.content.findings)) {
                    doc.text("Findings:", 30, yPos);
                    yPos += 10;
                    form.content.findings.forEach((finding) => {
                        doc.text(`• ${finding}`, 40, yPos);
                        yPos += 8;
                    });
                }
                if (form.content.correctiveActions) {
                    yPos += 5;
                    doc.text("Corrective Actions:", 30, yPos);
                    yPos += 8;
                    const splitActions = doc.splitTextToSize(form.content.correctiveActions, 150);
                    doc.text(splitActions, 40, yPos);
                    yPos += splitActions.length * 8;
                }
            }
            else {
                // Generic handling for other form types
                Object.entries(form.content).forEach(([key, value]) => {
                    if (value) {
                        if (Array.isArray(value)) {
                            doc.text(`${key}:`, 30, yPos);
                            yPos += 8;
                            value.forEach((item) => {
                                doc.text(`• ${item}`, 40, yPos);
                                yPos += 8;
                            });
                        }
                        else if (typeof value === "string") {
                            doc.text(`${key}: ${value}`, 30, yPos);
                            yPos += 8;
                        }
                    }
                });
            }
        }
        else {
            doc.text("No content available for this form", 30, yPos);
        }
        // Add footer
        doc.setFontSize(10);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 280, { align: "center" });
        console.log("PDF generation completed successfully");
        // Return the PDF as a blob
        return doc.output("blob");
    }
    catch (error) {
        console.error("Error generating PDF:", error);
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
/**
 * Download a form as a PDF
 */
async function downloadFormPDF(form) {
    try {
        console.log("Starting PDF download for form:", form);
        // Generate a simple PDF
        const pdfBlob = await generateSimplePDF(form);
        console.log("PDF blob generated:", pdfBlob);
        // Create a URL for the blob
        const url = URL.createObjectURL(pdfBlob);
        console.log("Blob URL created:", url);
        // Create a link element
        const link = document.createElement("a");
        link.href = url;
        link.download = `${form.type.replace(/\s+/g, "-")}_${form.id}.pdf`;
        console.log("Download link created with filename:", link.download);
        // Append the link to the body
        document.body.appendChild(link);
        console.log("Link appended to document body");
        // Click the link to trigger the download
        link.click();
        console.log("Link clicked to trigger download");
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("Cleanup completed");
    }
    catch (error) {
        console.error("Error downloading form as PDF:", error);
        throw error;
    }
}
/**
 * Alternative method to generate PDF from HTML content
 */
async function generatePDFFromHTML(elementId, filename) {
    try {
        console.log(`Generating PDF from HTML element with ID: ${elementId}`);
        // Get the HTML element
        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Element with ID ${elementId} not found`);
        }
        // Use html2canvas to capture the element as an image
        const canvas = await (0, html2canvas_1.default)(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true, // Enable CORS for images
            logging: true, // Enable logging for debugging
        });
        // Calculate dimensions
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        // Create PDF
        const pdf = new jspdf_1.jsPDF("p", "mm", "a4");
        // Add the image to the PDF
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
        // Save the PDF
        pdf.save(filename);
        console.log(`PDF generated and saved as ${filename}`);
    }
    catch (error) {
        console.error("Error generating PDF from HTML:", error);
        throw new Error(`PDF generation from HTML failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
// This is a mock implementation of PDF generation
// In a real app, you would use a library like jsPDF, html2pdf, or react-pdf
async function generateFormPDF(form, companySettings) {
    // In a real implementation, this would use a PDF library to create a PDF
    // For now, we'll create a simple HTML representation and convert it to a Blob
    const formDate = new Date(form.submittedDate).toLocaleDateString();
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${form.type} - ${form.project.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .company-info {
          margin-bottom: 20px;
        }
        .form-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .form-meta {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .form-section {
          margin-bottom: 20px;
        }
        .form-section h3 {
          font-size: 18px;
          margin-bottom: 10px;
        }
        .form-field {
          margin-bottom: 10px;
        }
        .form-field-label {
          font-weight: bold;
        }
        .form-field-value {
          margin-top: 5px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="form-title">${form.type}</div>
          <div>Project: ${form.project.name}</div>
        </div>
        <div>
          <div>${companySettings.name}</div>
          <div>${companySettings.phone}</div>
          <div>${companySettings.email}</div>
        </div>
      </div>
      
      <div class="form-meta">
        <div><strong>Date:</strong> ${formDate}</div>
        <div><strong>Submitted By:</strong> ${form.submittedBy}</div>
        <div><strong>Status:</strong> ${form.status}</div>
      </div>
      
      <div class="form-content">
        ${generateFormContentHTML(form)}
      </div>
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>${companySettings.name} | ${companySettings.address} | ${companySettings.website}</p>
      </div>
    </body>
    </html>
  `;
    // Convert HTML to Blob (in a real app, this would be a PDF)
    const blob = new Blob([html], { type: "text/html" });
    return blob;
}
function generateFormContentHTML(form) {
    let contentHTML = "";
    if (form.type === "Dust Control Log" || form.type === "Dust Control") {
        contentHTML = `
      <div class="form-section">
        <h3>Weather Information</h3>
        <div class="form-field">
          <div class="form-field-label">Weather Conditions</div>
          <div class="form-field-value">${form.content.weatherConditions || "N/A"}</div>
        </div>
        <div class="form-field">
          <div class="form-field-label">Wind Speed</div>
          <div class="form-field-value">${form.content.windSpeed || "N/A"}</div>
        </div>
      </div>
      
      <div class="form-section">
        <h3>Dust Control Measures</h3>
        <ul>
          ${form.content.dustControlMeasures?.map((measure) => `<li>${measure}</li>`).join("") || "None recorded"}
        </ul>
      </div>
      
      <div class="form-section">
        <h3>Notes</h3>
        <div class="form-field-value">${form.content.notes || "No notes provided"}</div>
      </div>
    `;
    }
    else if (form.type === "SWPPP Inspection" || form.type === "SWPPP") {
        contentHTML = `
      <div class="form-section">
        <h3>Inspection Details</h3>
        <div class="form-field">
          <div class="form-field-label">Rainfall</div>
          <div class="form-field-value">${form.content.rainfall || "N/A"}</div>
        </div>
        <div class="form-field">
          <div class="form-field-label">Inspection Type</div>
          <div class="form-field-value">${form.content.inspectionType || "N/A"}</div>
        </div>
      </div>
      
      <div class="form-section">
        <h3>BMP Conditions</h3>
        <ul>
          ${form.content.bmpConditions?.map((condition) => `<li>${condition}</li>`).join("") || "None recorded"}
        </ul>
      </div>
      
      <div class="form-section">
        <h3>Corrective Actions</h3>
        <div class="form-field-value">${form.content.correctiveActions || "No corrective actions provided"}</div>
      </div>
    `;
    }
    else if (form.type === "Safety Inspection") {
        contentHTML = `
      <div class="form-section">
        <h3>Findings</h3>
        <ul>
          ${form.content.findings?.map((finding) => `<li>${finding}</li>`).join("") || "None recorded"}
        </ul>
      </div>
      
      <div class="form-section">
        <h3>Corrective Actions</h3>
        <div class="form-field-value">${form.content.correctiveActions || "No corrective actions provided"}</div>
      </div>
    `;
    }
    return contentHTML;
}
// Helper function to download a blob as a file
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
//# sourceMappingURL=pdf-utils.js.map