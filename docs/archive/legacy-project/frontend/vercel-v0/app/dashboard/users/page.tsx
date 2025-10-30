"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search, MoreHorizontal, UserCog, Mail, Building, Calendar, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "foreman" | "inspector"
  company: string
  lastActive: string
  status: "active" | "inactive"
}

export default function UsersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    const fetchUsers = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Try to get users from localStorage first
      let usersData: User[] = []

      try {
        const storedUsers = localStorage.getItem("users")
        if (storedUsers) {
          usersData = JSON.parse(storedUsers)
          console.log("Retrieved users from localStorage:", usersData)
        }
      } catch (error) {
        console.error("Error loading users from localStorage:", error)
      }

      // If no users in localStorage or error occurred, use mock data
      if (!usersData || usersData.length === 0) {
        // Mock user data
        usersData = [
          {
            id: "1",
            name: "John Smith",
            email: "admin@example.com",
            role: "admin",
            company: "Construction Co",
            lastActive: "2024-03-02",
            status: "active",
          },
          {
            id: "2",
            name: "Jane Doe",
            email: "foreman@example.com",
            role: "foreman",
            company: "Construction Co",
            lastActive: "2024-03-01",
            status: "active",
          },
          {
            id: "3",
            name: "Mike Johnson",
            email: "inspector@example.com",
            role: "inspector",
            company: "City Inspector Office",
            lastActive: "2024-02-28",
            status: "active",
          },
          {
            id: "4",
            name: "Sarah Williams",
            email: "sarah.williams@example.com",
            role: "foreman",
            company: "Construction Co",
            lastActive: "2024-02-27",
            status: "inactive",
          },
          {
            id: "5",
            name: "Robert Brown",
            email: "robert.brown@example.com",
            role: "inspector",
            company: "County Environmental Agency",
            lastActive: "2024-02-25",
            status: "active",
          },
          {
            id: "6",
            name: "Emily Davis",
            email: "emily.davis@example.com",
            role: "foreman",
            company: "Construction Co",
            lastActive: "2024-02-20",
            status: "active",
          },
          {
            id: "7",
            name: "David Wilson",
            email: "david.wilson@example.com",
            role: "admin",
            company: "Construction Co",
            lastActive: "2024-02-15",
            status: "active",
          },
        ]
      }

      setUsers(usersData)
      setFilteredUsers(usersData)
      setIsLoading(false)
    }

    fetchUsers()
  }, [user, router])

  useEffect(() => {
    // Filter users based on search query and role filter
    let filtered = [...users]

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.company.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [searchQuery, roleFilter, users])

  const handleStatusToggle = (userId: string) => {
    const targetUser = users.find((user) => user.id === userId)
    if (!targetUser) return

    const newStatus = targetUser.status === "active" ? "inactive" : "active"

    const updatedUsers = users.map((user) => (user.id === userId ? { ...user, status: newStatus } : user))

    setUsers(updatedUsers)

    toast({
      title: `User ${newStatus === "active" ? "activated" : "deactivated"}`,
      description: `${targetUser.name} has been ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
    })
  }

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find((user) => user.id === userId)
    if (!targetUser) return

    // Filter out the deleted user
    const updatedUsers = users.filter((user) => user.id !== userId)
    setUsers(updatedUsers)

    toast({
      title: "User deleted",
      description: `${targetUser.name} has been deleted successfully.`,
      variant: "destructive",
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user access and permissions</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-[180px]">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by role" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="foreman">Foreman</SelectItem>
                <SelectItem value="inspector">Inspector</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{user.company}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{user.lastActive}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/users/${user.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/users/${user.id}/edit`}>Edit User</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusToggle(user.id)}>
                          {user.status === "active" ? "Deactivate" : "Activate"} User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <UserCog className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No users found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery || roleFilter !== "all"
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Get started by adding your first user."}
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/users/new">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

