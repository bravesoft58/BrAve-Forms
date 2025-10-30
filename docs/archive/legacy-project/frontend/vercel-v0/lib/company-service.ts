// This is a mock service that would be replaced with actual API calls in a real application

// Define the company settings type
export interface CompanySettings {
  id: string
  name: string
  address: string
  phone: string
  email: string
  website: string
  description: string
  logo: string | null
}

// Default company settings
const defaultSettings: CompanySettings = {
  id: "1",
  name: "Construction Co",
  address: "123 Builder St, Construction City, CC 12345",
  phone: "(555) 123-4567",
  email: "info@constructionco.com",
  website: "www.constructionco.com",
  description: "A leading construction company specializing in commercial and residential projects.",
  logo: null,
}

// Get company settings
export async function getCompanySettings(): Promise<CompanySettings> {
  // In a real app, this would be an API call
  // For now, we'll use localStorage if available, or return default settings

  try {
    if (typeof window !== "undefined") {
      const storedSettings = localStorage.getItem("companySettings")
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings)
        console.log("Retrieved settings:", parsedSettings)
        return parsedSettings
      }
    }

    console.log("No stored settings found, returning defaults")
    return defaultSettings
  } catch (error) {
    console.error("Error retrieving company settings:", error)
    return defaultSettings
  }
}

// Update company settings
export async function updateCompanySettings(settings: CompanySettings): Promise<CompanySettings> {
  // In a real app, this would be an API call
  // For now, we'll use localStorage

  try {
    if (typeof window !== "undefined") {
      // Save the full settings object
      localStorage.setItem("companySettings", JSON.stringify(settings))

      // Also store the logo and name separately for easy access
      if (settings.logo) {
        localStorage.setItem("companyLogo", settings.logo)
      } else {
        localStorage.removeItem("companyLogo")
      }

      localStorage.setItem("companyName", settings.name)

      console.log("Settings saved successfully:", settings)
    }

    return settings
  } catch (error) {
    console.error("Error saving company settings:", error)
    throw new Error("Failed to save company settings")
  }
}

// Upload company logo
export async function uploadCompanyLogo(file: File): Promise<string> {
  // In a real app, this would upload to a storage service and return the URL
  // For now, we'll convert to a data URL

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to convert file to data URL"))
      }
    }
    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }
    reader.readAsDataURL(file)
  })
}

