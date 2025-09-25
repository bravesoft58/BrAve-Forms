"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  date: string
  read: boolean
  type: "info" | "warning" | "success" | "error"
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<Notification, "id" | "date" | "read">) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { toast } = useToast()

  // Load notifications from localStorage on mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem("notifications")
    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications))
      } catch (error) {
        console.error("Error parsing notifications:", error)
      }
    } else {
      // Set some demo notifications
      const demoNotifications: Notification[] = [
        {
          id: "1",
          title: "New Form Submitted",
          message: "A new Dust Control Log has been submitted for Downtown High-Rise",
          date: new Date().toISOString(),
          read: false,
          type: "info",
        },
        {
          id: "2",
          title: "Inspection Required",
          message: "SWPPP inspection is due for Riverside Apartments",
          date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          read: false,
          type: "warning",
        },
        {
          id: "3",
          title: "Project Updated",
          message: "Central Park Renovation project details have been updated",
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          read: true,
          type: "success",
        },
      ]
      setNotifications(demoNotifications)
      localStorage.setItem("notifications", JSON.stringify(demoNotifications))
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const addNotification = (notification: Omit<Notification, "id" | "date" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Also show a toast notification
    toast({
      title: notification.title,
      description: notification.message,
    })
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

