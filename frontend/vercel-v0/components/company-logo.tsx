"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Building } from "lucide-react"
import { getCompanySettings } from "@/lib/company-service"

interface CompanyLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function CompanyLogo({ className = "", size = "md" }: CompanyLogoProps) {
  const [logo, setLogo] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>("Company Name")
  const [isLoading, setIsLoading] = useState(true)

  // Add a refresh counter to force re-fetch when localStorage changes
  const [refreshCounter, setRefreshCounter] = useState(0)

  useEffect(() => {
    // Listen for storage events to detect changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "companySettings" || e.key === "companyLogo" || e.key === "companyName") {
        setRefreshCounter((prev) => prev + 1)
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      setIsLoading(true)

      try {
        const settings = await getCompanySettings()
        setLogo(settings.logo)
        setCompanyName(settings.name)
      } catch (error) {
        console.error("Error fetching company info:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanyInfo()
  }, [refreshCounter]) // Re-fetch when refreshCounter changes

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-20 w-20",
  }

  const containerClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-20",
  }

  if (isLoading) {
    return (
      <div className={`flex items-center ${containerClasses[size]} animate-pulse`}>
        <div className={`${sizeClasses[size]} rounded-md bg-muted`}></div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {logo ? (
        <div className={`relative ${sizeClasses[size]} overflow-hidden rounded-md`}>
          <Image src={logo || "/placeholder.svg"} alt={`${companyName} logo`} fill className="object-contain" />
        </div>
      ) : (
        <div className={`flex ${sizeClasses[size]} items-center justify-center rounded-md bg-primary/10`}>
          <Building className="h-1/2 w-1/2 text-primary" />
        </div>
      )}
      <span className="text-lg font-semibold">{companyName}</span>
    </div>
  )
}

