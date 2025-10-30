"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Bell, Mail, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  const handleSaveNotifications = () => {
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated.",
    })
  }

  const handleSaveAppearance = () => {
    toast({
      title: "Appearance settings saved",
      description: "Your appearance preferences have been updated.",
    })
  }

  return (
    <div className="container py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="notifications" className="mt-6">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure your email notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-notifications" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Notifications</span>
                </Label>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Notification Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" disabled={!emailNotifications} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Configure your push notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="push-notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span>Push Notifications</span>
                </Label>
                <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
              {pushNotifications && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">Push notifications will be sent to your browser when:</p>
                  <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                    <li>A form is submitted for review</li>
                    <li>A form is approved or rejected</li>
                    <li>Someone mentions you in a comment</li>
                    <li>Important project updates</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize the appearance of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label className="flex items-center gap-2">
                  {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Dark Mode</span>
                </Label>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveAppearance}>Save Appearance Settings</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

