"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft } from "lucide-react"

export default function NewUserPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "inspector",
    company: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Please enter a valid email address"
    if (!formData.company.trim()) newErrors.company = "Company is required"
    if (!formData.password) newErrors.password = "Password is required"
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Update the handleSubmit function to properly create a new user
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Get form data
    const formData = new FormData(e.currentTarget)
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string
    const company = formData.get("company") as string
    // Note: In a real app, we would hash the password
    // For demo purposes, we'll ignore the password field and use "password" for all users

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Store the new user in localStorage to simulate persistence
    try {
      // Get existing users or initialize empty array
      const existingUsers = localStorage.getItem("users") ? JSON.parse(localStorage.getItem("users") || "[]") : []

      // Create new user object
      const newUser = {
        id: (existingUsers.length + 1).toString(),
        name: `${firstName} ${lastName}`,
        email: email,
        role: role,
        company: company,
        lastActive: new Date().toISOString().split("T")[0],
        status: "active",
        // Note: In a real app, we would store a hashed password
        // For demo purposes, all users use "password" for login
      }

      // Add to users array
      existingUsers.push(newUser)

      // Save back to localStorage
      localStorage.setItem("users", JSON.stringify(existingUsers))

      toast({
        title: "User created",
        description: "The new user has been created successfully. They can log in with password: 'password'",
      })
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Error creating user",
        description: "There was a problem creating the user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      router.push("/dashboard/users")
    }
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/users">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add User</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Add a new user to the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                required
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="foreman">Foreman</SelectItem>
                  <SelectItem value="inspector">Inspector</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Enter company name"
                value={formData.company}
                onChange={handleChange}
                required
                className={errors.company ? "border-destructive" : ""}
              />
              {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push("/dashboard/users")} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

