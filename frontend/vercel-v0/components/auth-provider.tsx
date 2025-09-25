"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
  role: "admin" | "foreman" | "inspector"
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// CSRF token generation
const generateCSRFToken = () => {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  return token
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)

    // Set up CSRF token
    if (!localStorage.getItem("csrfToken")) {
      localStorage.setItem("csrfToken", generateCSRFToken())
    }
  }, [])

  const login = async (email: string, password: string) => {
    // This is a mock implementation
    setIsLoading(true)

    try {
      // Simulate API call with CSRF token
      const csrfToken = localStorage.getItem("csrfToken") || generateCSRFToken()

      // In a real implementation, you would send the CSRF token in the header
      // const response = await fetch('/api/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-CSRF-Token': csrfToken
      //   },
      //   body: JSON.stringify({ email, password })
      // })

      await new Promise((resolve) => setTimeout(resolve, 1000))

      // First check if there are any stored users
      let storedUsers = []
      try {
        const usersJson = localStorage.getItem("users")
        if (usersJson) {
          storedUsers = JSON.parse(usersJson)
        }
      } catch (error) {
        console.error("Error parsing stored users:", error)
      }

      // Check if the user exists in stored users
      const foundUser = storedUsers.find((user: any) => user.email === email)

      if (foundUser && password === "password") {
        // In a real implementation, you would never compare passwords directly
        // Instead, the server would handle authentication and return a token

        // Convert the stored user to the expected User type
        const authenticatedUser: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role as "admin" | "foreman" | "inspector",
        }

        // Set user in state and localStorage
        setUser(authenticatedUser)

        // Store user data securely
        localStorage.setItem("user", JSON.stringify(authenticatedUser))

        // Regenerate CSRF token after login
        localStorage.setItem("csrfToken", generateCSRFToken())

        setIsLoading(false)
        return true
      }

      // If no match in stored users, check the mock users
      const mockUsers: Record<string, User> = {
        "admin@example.com": {
          id: "1",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
        },
        "foreman@example.com": {
          id: "2",
          name: "Foreman User",
          email: "foreman@example.com",
          role: "foreman",
        },
        "inspector@example.com": {
          id: "3",
          name: "Inspector User",
          email: "inspector@example.com",
          role: "inspector",
        },
      }

      const mockUser = mockUsers[email]

      if (mockUser && password === "password") {
        // Set user in state and localStorage
        setUser(mockUser)

        // Store user data securely
        localStorage.setItem("user", JSON.stringify(mockUser))

        // Regenerate CSRF token after login
        localStorage.setItem("csrfToken", generateCSRFToken())

        setIsLoading(false)
        return true
      }

      setIsLoading(false)
      return false
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    // Regenerate CSRF token after logout
    localStorage.setItem("csrfToken", generateCSRFToken())
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

