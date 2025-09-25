"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { ChevronLeft } from "lucide-react"

interface UserData {
  id: string
  name: string
  email: string
  role: "admin" | "foreman" | "inspector"
  company: string
  status: "active" | "inactive"
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Check if logged in user is admin
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    const fetchUserData = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock user data
      const mockUser: UserData = {
        id: params.id,
        name:
          params.id === "1"
            ? "John Smith"
            : params.id === "2"
              ? "Jane Doe"
              : params.id === "3"
                ? "Mike Johnson"
                : "User " + params.id,
        email:
          params.id === "1"
            ? "admin@example.com"
            : params.id === "2"
              ? "foreman@example.com"
              : params.id === "3"
                ? "inspector@example.com"
                : `user${params.id}@example.com`,
        role:
          params.id === "1"
            ? "admin"
            : params.id === "2"
              ? "foreman"
              : params.id === "3"
                ? "inspector"
                : (["admin", "foreman", "inspector"][Math.floor(Math.random() * 3)] as
                    | "admin"
                    | "foreman"
                    | "inspector"),
        company: "Construction Co",
        status: "active",
      }

      setUserData(mockUser)
      setIsLoading(false)
    }

    fetchUserData()
  }, [params.id, router, user?.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast({
      title: "User updated",
      description: "The user has been updated successfully.",
    })

    setIsSaving(false)
    router.push(`/dashboard/users/${params.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h3 className="mt-4 text-lg font-semibold">User not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The user you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/dashboard/users" className="mt-4">
            <Button variant="outline">Back to Users</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/users/${params.id}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Edit user information and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  defaultValue={userData.name.split(" ")[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  defaultValue={userData.name.split(" ")[1] || ""}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email address" defaultValue={userData.email} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select defaultValue={userData.role}>
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
              <Input id="company" placeholder="Enter company name" defaultValue={userData.company} required />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="active-status" className="flex items-center gap-2">
                <span>Active Status</span>
              </Label>
              <Switch id="active-status" defaultChecked={userData.status === "active"} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Reset Password</Label>
              <Input id="password" type="password" placeholder="Enter new password" />
              <p className="text-sm text-muted-foreground">Leave blank to keep current password</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push(`/dashboard/users/${params.id}`)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

