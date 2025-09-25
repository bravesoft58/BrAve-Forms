"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface Tenant {
  id: string
  name: string
  domain: string
  logo?: string
  primaryColor?: string
  secondaryColor?: string
}

interface TenantContextType {
  currentTenant: Tenant | null
  setCurrentTenant: (tenant: Tenant) => void
  isLoading: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would determine the tenant based on:
    // 1. URL/subdomain
    // 2. User's assigned tenant
    // 3. API call to get tenant details

    const detectTenant = async () => {
      try {
        // For demo purposes, we'll use a mock tenant
        // In production, this would be determined by the hostname or other factors
        const hostname = window.location.hostname

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Mock tenant data
        const mockTenant: Tenant = {
          id: "1",
          name: "BrAve Construction",
          domain: hostname,
          primaryColor: "#1e40af", // Blue
          secondaryColor: "#4f46e5", // Indigo
        }

        setCurrentTenant(mockTenant)
        setIsLoading(false)
      } catch (error) {
        console.error("Error detecting tenant:", error)
        setIsLoading(false)
      }
    }

    detectTenant()
  }, [])

  return (
    <TenantContext.Provider value={{ currentTenant, setCurrentTenant, isLoading }}>{children}</TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider")
  }
  return context
}

