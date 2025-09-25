"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Upload, Trash2, Building, Check } from "lucide-react"
import {
  getCompanySettings,
  updateCompanySettings,
  uploadCompanyLogo,
  type CompanySettings,
} from "@/lib/company-service"

export default function CompanySettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    // Check if user is admin or has permission to edit company settings
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    // Fetch company settings
    const fetchCompanySettings = async () => {
      setIsLoading(true)
      try {
        const settings = await getCompanySettings()
        setCompanySettings(settings)
        setLogoPreview(settings.logo)
      } catch (error) {
        console.error("Error fetching company settings:", error)
        toast({
          title: "Error",
          description: "Failed to load company settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanySettings()
  }, [user, router, toast])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo image must be less than 2MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    setLogoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companySettings) return

    setIsSaving(true)

    try {
      // Get form elements directly
      const form = e.target as HTMLFormElement
      const nameInput = form.querySelector("#name") as HTMLInputElement
      const addressInput = form.querySelector("#address") as HTMLTextAreaElement
      const phoneInput = form.querySelector("#phone") as HTMLInputElement
      const emailInput = form.querySelector("#email") as HTMLInputElement
      const websiteInput = form.querySelector("#website") as HTMLInputElement
      const descriptionInput = form.querySelector("#description") as HTMLTextAreaElement

      // Process logo if changed
      let logoUrl = companySettings.logo
      if (logoFile) {
        logoUrl = await uploadCompanyLogo(logoFile)
      } else if (logoPreview === null) {
        logoUrl = null
      }

      // Update settings
      const updatedSettings: CompanySettings = {
        ...companySettings,
        name: nameInput.value,
        address: addressInput.value,
        phone: phoneInput.value,
        email: emailInput.value,
        website: websiteInput.value,
        description: descriptionInput.value,
        logo: logoUrl,
      }

      console.log("Saving settings:", updatedSettings)

      // Save the settings
      const savedSettings = await updateCompanySettings(updatedSettings)
      setCompanySettings(savedSettings)

      // Trigger refresh for other components
      triggerSettingsRefresh()

      toast({
        title: "Settings saved",
        description: "Company settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving company settings:", error)
      toast({
        title: "Error",
        description: "Failed to save company settings. " + (error instanceof Error ? error.message : ""),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Function to manually trigger a refresh of components that use company settings
  const triggerSettingsRefresh = () => {
    // Dispatch a storage event to notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"))
    }
  }

  // Debug function to check what's in localStorage
  const checkLocalStorage = () => {
    if (typeof window !== "undefined") {
      const settings = localStorage.getItem("companySettings")
      const logo = localStorage.getItem("companyLogo")
      const name = localStorage.getItem("companyName")

      setDebugInfo(
        JSON.stringify(
          {
            settings: settings ? JSON.parse(settings) : null,
            logo: logo ? (logo.length > 100 ? logo.substring(0, 100) + "..." : logo) : null,
            name,
          },
          null,
          2,
        ),
      )

      toast({
        title: "Debug Info",
        description: "Check the console for localStorage contents",
      })

      console.log("Company Settings:", settings ? JSON.parse(settings) : null)
      console.log("Company Logo:", logo ? "Available (too large to display)" : null)
      console.log("Company Name:", name)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!companySettings) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Building className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Company settings not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">Unable to load company settings. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground">Manage your company information and branding</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
              <CardDescription>Upload your company logo to display on forms and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                  {logoPreview ? (
                    <Image
                      src={logoPreview || "/placeholder.svg"}
                      alt="Company Logo"
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <Building className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>

                <div className="flex gap-2">
                  <Label
                    htmlFor="logo-upload"
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </Label>
                  <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />

                  {logoPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Recommended size: 400x400 pixels. Max file size: 2MB.
                  <br />
                  Supported formats: JPG, PNG, SVG
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" name="name" defaultValue={companySettings.name} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" defaultValue={companySettings.address} rows={3} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={companySettings.phone} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={companySettings.email} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" defaultValue={companySettings.website} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={companySettings.description} rows={3} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-between">
          {process.env.NODE_ENV === "development" && (
            <Button type="button" variant="outline" onClick={checkLocalStorage}>
              Debug Storage
            </Button>
          )}
          <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

