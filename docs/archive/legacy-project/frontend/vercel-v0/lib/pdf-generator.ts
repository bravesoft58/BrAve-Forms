import { jsPDF } from "jspdf"
import "jspdf-autotable"
import type { CompanySettings } from "./company-service"
import { getCompanySettings } from "./company-service"

// Extend the jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Interface for form data
interface FormData {
  id: string
  type: string
  project: {
    id: string
    name: string
  }
  submittedBy: string
  submittedDate: string
  status: "completed" | "pending" | "draft"
  content: Record<string, any>
}

/**
 * Generate a PDF for a form
 */
export async function generateFormPDF(form: FormData): Promise<Blob> {
  try {
    // Create a new PDF document
    const doc = new jsPDF()

    // Get company settings
    let companySettings: CompanySettings
    try {
      companySettings = await getCompanySettings()
    } catch (error) {
      console.error("Error getting company settings:", error)
      companySettings = {
        id: "1",
        name: "Construction Co",
        address: "123 Builder St, Construction City, CC 12345",
        phone: "(555) 123-4567",
        email: "info@constructionco.com",
        website: "www.constructionco.com",
        description: "A leading construction company specializing in commercial and residential projects.",
        logo: null,
      }
    }

    // Add company information
    doc.setFontSize(20)
    doc.text(companySettings.name, 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.text(form.type, 105, 30, { align: "center" })

    // Add form information
    doc.setFontSize(10)
    doc.text(`Form ID: ${form.id}`, 14, 40)
    doc.text(`Project: ${form.project.name}`, 14, 45)
    doc.text(`Submitted By: ${form.submittedBy}`, 14, 50)
    doc.text(`Date: ${form.submittedDate}`, 14, 55)
    doc.text(`Status: ${form.status}`, 14, 60)

    // Add a line
    doc.line(14, 65, 196, 65)

    // Add form content based on form type
    doc.setFontSize(12)
    doc.text("Form Content", 14, 75)

    let yPosition = 85

    // Check if form.content exists before trying to access its properties
    if (!form.content) {
      doc.text("No content available for this form", 14, yPosition)
      yPosition += 10
    } else if (form.type === "Dust Control Log" || form.type === "Dust Control") {
      // Weather and wind information
      doc.setFontSize(11)
      doc.text("Weather Conditions:", 14, yPosition)
      doc.setFontSize(10)
      doc.text(form.content.weatherConditions || "N/A", 60, yPosition)

      yPosition += 10
      doc.setFontSize(11)
      doc.text("Wind Speed:", 14, yPosition)
      doc.setFontSize(10)
      doc.text(form.content.windSpeed || "N/A", 60, yPosition)

      // Dust control measures
      yPosition += 15
      doc.setFontSize(11)
      doc.text("Dust Control Measures:", 14, yPosition)

      if (form.content.dustControlMeasures && Array.isArray(form.content.dustControlMeasures)) {
        yPosition += 8
        doc.setFontSize(10)
        form.content.dustControlMeasures.forEach((measure: string) => {
          doc.text(`• ${measure}`, 20, yPosition)
          yPosition += 6
        })
      } else {
        yPosition += 8
        doc.text("No dust control measures specified", 20, yPosition)
        yPosition += 6
      }

      // Notes
      yPosition += 10
      doc.setFontSize(11)
      doc.text("Notes:", 14, yPosition)

      if (form.content.notes) {
        yPosition += 8
        doc.setFontSize(10)

        // Split long text into multiple lines
        const splitNotes = doc.splitTextToSize(form.content.notes, 170)
        doc.text(splitNotes, 20, yPosition)
        yPosition += splitNotes.length * 6
      } else {
        yPosition += 8
        doc.text("No notes provided", 20, yPosition)
        yPosition += 6
      }
    } else if (form.type === "SWPPP Inspection" || form.type === "SWPPP") {
      // Rainfall and inspection type
      doc.setFontSize(11)
      doc.text("Rainfall:", 14, yPosition)
      doc.setFontSize(10)
      doc.text(form.content.rainfall || "N/A", 60, yPosition)

      yPosition += 10
      doc.setFontSize(11)
      doc.text("Inspection Type:", 14, yPosition)
      doc.setFontSize(10)
      doc.text(form.content.inspectionType || "N/A", 60, yPosition)

      // BMP conditions
      yPosition += 15
      doc.setFontSize(11)
      doc.text("BMP Conditions:", 14, yPosition)

      if (form.content.bmpConditions && Array.isArray(form.content.bmpConditions)) {
        yPosition += 8
        doc.setFontSize(10)
        form.content.bmpConditions.forEach((condition: string) => {
          doc.text(`• ${condition}`, 20, yPosition)
          yPosition += 6
        })
      } else {
        yPosition += 8
        doc.text("No BMP conditions specified", 20, yPosition)
        yPosition += 6
      }

      // Corrective actions
      yPosition += 10
      doc.setFontSize(11)
      doc.text("Corrective Actions:", 14, yPosition)

      if (form.content.correctiveActions) {
        yPosition += 8
        doc.setFontSize(10)

        // Split long text into multiple lines
        const splitActions = doc.splitTextToSize(form.content.correctiveActions, 170)
        doc.text(splitActions, 20, yPosition)
        yPosition += splitActions.length * 6
      } else {
        yPosition += 8
        doc.text("No corrective actions specified", 20, yPosition)
        yPosition += 6
      }
    } else if (form.type === "Safety Inspection") {
      // Findings
      doc.setFontSize(11)
      doc.text("Findings:", 14, yPosition)

      if (form.content.findings && Array.isArray(form.content.findings)) {
        yPosition += 8
        doc.setFontSize(10)
        form.content.findings.forEach((finding: string) => {
          doc.text(`• ${finding}`, 20, yPosition)
          yPosition += 6
        })
      } else {
        yPosition += 8
        doc.text("No findings specified", 20, yPosition)
        yPosition += 6
      }

      // Corrective actions
      yPosition += 10
      doc.setFontSize(11)
      doc.text("Corrective Actions:", 14, yPosition)

      if (form.content.correctiveActions) {
        yPosition += 8
        doc.setFontSize(10)

        // Split long text into multiple lines
        const splitActions = doc.splitTextToSize(form.content.correctiveActions, 170)
        doc.text(splitActions, 20, yPosition)
        yPosition += splitActions.length * 6
      } else {
        yPosition += 8
        doc.text("No corrective actions specified", 20, yPosition)
        yPosition += 6
      }
    } else {
      // Generic form content for unknown form types
      doc.text("Form type not recognized. No specific content formatting available.", 14, yPosition)

      // Try to display any content that might be available
      if (form.content) {
        yPosition += 10
        doc.text("Available Content:", 14, yPosition)
        yPosition += 8

        Object.entries(form.content).forEach(([key, value]) => {
          if (value) {
            if (Array.isArray(value)) {
              doc.text(`${key}:`, 14, yPosition)
              yPosition += 6
              value.forEach((item: string) => {
                doc.text(`• ${item}`, 20, yPosition)
                yPosition += 6
              })
            } else if (typeof value === "string") {
              doc.text(`${key}: ${value}`, 14, yPosition)
              yPosition += 6
            }
          }
        })
      }
    }

    // Add signature section
    yPosition = Math.max(yPosition + 20, 220)

    doc.line(14, yPosition, 100, yPosition)
    doc.text("Signature", 14, yPosition + 5)

    doc.line(120, yPosition, 196, yPosition)
    doc.text("Date", 120, yPosition + 5)

    // Add footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Generated by BrAve Forms - ${companySettings.website} - Page ${i} of ${pageCount}`, 105, 285, {
        align: "center",
      })
    }

    // Return the PDF as a blob
    return doc.output("blob")
  } catch (error) {
    console.error("Error in PDF generation:", error)
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Download a form as a PDF
 */
export async function downloadFormPDF(form: FormData): Promise<void> {
  try {
    const pdfBlob = await generateFormPDF(form)

    // Create a URL for the blob
    const url = URL.createObjectURL(pdfBlob)

    // Create a link element
    const link = document.createElement("a")
    link.href = url
    link.download = `${form.type.replace(/\s+/g, "-")}_${form.id}.pdf`

    // Append the link to the body
    document.body.appendChild(link)

    // Click the link to trigger the download
    link.click()

    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error downloading form as PDF:", error)
    throw error
  }
}

