"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AdminSystemSettings() {
  const { toast } = useToast()

  // Dialog open states
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false)
  const [retentionDialogOpen, setRetentionDialogOpen] = useState(false)
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false)

  // Form Templates State
  const [templates, setTemplates] = useState([
    { id: "1", name: "Dust Control Log", isDefault: true },
    { id: "2", name: "SWPPP Inspection", isDefault: false },
    { id: "3", name: "Safety Inspection", isDefault: false },
  ])
  const [newTemplateName, setNewTemplateName] = useState("")

  // Data Retention State
  const [retentionSettings, setRetentionSettings] = useState({
    completedForms: "365", // days
    archivedProjects: "730", // days
    userLogs: "90", // days
  })

  // Email Notification Settings
  const [emailSettings, setEmailSettings] = useState({
    newFormSubmission: true,
    formApproval: true,
    userRegistration: true,
    systemAlerts: true,
    dailyDigest: false,
    emailFrom: "notifications@braveforms.com",
  })

  const handleUpdateTemplate = (id: string, isDefault: boolean) => {
    setTemplates(
      templates.map((template) =>
        template.id === id
          ? { ...template, isDefault }
          : template.id !== id && isDefault
            ? { ...template, isDefault: false }
            : template,
      ),
    )

    toast({
      title: "Template Updated",
      description: `Template settings have been updated successfully.`,
    })
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((template) => template.id !== id))

    toast({
      title: "Template Deleted",
      description: "The template has been deleted successfully.",
      variant: "destructive",
    })
  }

  const handleAddTemplate = () => {
    if (newTemplateName.trim() === "") return

    const newTemplate = {
      id: `${templates.length + 1}`,
      name: newTemplateName,
      isDefault: false,
    }

    setTemplates([...templates, newTemplate])
    setNewTemplateName("")

    toast({
      title: "Template Added",
      description: "The new template has been added successfully.",
    })
  }

  const handleSaveRetentionSettings = () => {
    setRetentionDialogOpen(false)

    toast({
      title: "Data Retention Settings Updated",
      description: "Your data retention settings have been saved successfully.",
    })
  }

  const handleSaveEmailSettings = () => {
    setNotificationsDialogOpen(false)

    toast({
      title: "Email Notification Settings Updated",
      description: "Your email notification settings have been saved successfully.",
    })
  }

  // Templates Dialog
  const TemplatesDialog = () => (
    <Dialog open={templatesDialogOpen} onOpenChange={setTemplatesDialogOpen}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Form Templates</DialogTitle>
          <DialogDescription>Manage form templates and set defaults for new forms.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead className="w-[100px]">Default</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={template.isDefault}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleUpdateTemplate(template.id, true)
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={template.isDefault}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="New template name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <Button onClick={handleAddTemplate}>Add Template</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setTemplatesDialogOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Retention Dialog
  const RetentionDialog = () => (
    <Dialog open={retentionDialogOpen} onOpenChange={setRetentionDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Data Retention Settings</DialogTitle>
          <DialogDescription>Configure how long different types of data are retained in the system.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="completedForms">Completed Forms (days)</Label>
              <Input
                id="completedForms"
                type="number"
                value={retentionSettings.completedForms}
                onChange={(e) =>
                  setRetentionSettings({
                    ...retentionSettings,
                    completedForms: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Forms will be archived after this period</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="archivedProjects">Archived Projects (days)</Label>
              <Input
                id="archivedProjects"
                type="number"
                value={retentionSettings.archivedProjects}
                onChange={(e) =>
                  setRetentionSettings({
                    ...retentionSettings,
                    archivedProjects: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Projects will be permanently deleted after this period</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userLogs">User Activity Logs (days)</Label>
              <Input
                id="userLogs"
                type="number"
                value={retentionSettings.userLogs}
                onChange={(e) =>
                  setRetentionSettings({
                    ...retentionSettings,
                    userLogs: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">User activity logs will be deleted after this period</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSaveRetentionSettings}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Notifications Dialog
  const NotificationsDialog = () => (
    <Dialog open={notificationsDialogOpen} onOpenChange={setNotificationsDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Notification Settings</DialogTitle>
          <DialogDescription>Configure when and how email notifications are sent.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailFrom">From Email Address</Label>
              <Input
                id="emailFrom"
                type="email"
                value={emailSettings.emailFrom}
                onChange={(e) =>
                  setEmailSettings({
                    ...emailSettings,
                    emailFrom: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notification Types</h4>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="newFormSubmission" className="flex-1">
                  New Form Submission
                </Label>
                <Switch
                  id="newFormSubmission"
                  checked={emailSettings.newFormSubmission}
                  onCheckedChange={(checked) =>
                    setEmailSettings({
                      ...emailSettings,
                      newFormSubmission: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="formApproval" className="flex-1">
                  Form Approval/Rejection
                </Label>
                <Switch
                  id="formApproval"
                  checked={emailSettings.formApproval}
                  onCheckedChange={(checked) =>
                    setEmailSettings({
                      ...emailSettings,
                      formApproval: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="userRegistration" className="flex-1">
                  User Registration
                </Label>
                <Switch
                  id="userRegistration"
                  checked={emailSettings.userRegistration}
                  onCheckedChange={(checked) =>
                    setEmailSettings({
                      ...emailSettings,
                      userRegistration: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="systemAlerts" className="flex-1">
                  System Alerts
                </Label>
                <Switch
                  id="systemAlerts"
                  checked={emailSettings.systemAlerts}
                  onCheckedChange={(checked) =>
                    setEmailSettings({
                      ...emailSettings,
                      systemAlerts: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="dailyDigest" className="flex-1">
                  Daily Digest Summary
                </Label>
                <Switch
                  id="dailyDigest"
                  checked={emailSettings.dailyDigest}
                  onCheckedChange={(checked) =>
                    setEmailSettings({
                      ...emailSettings,
                      dailyDigest: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSaveEmailSettings}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>Configure global system settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Form Templates */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Form Templates</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the default templates used for creating new forms
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setTemplatesDialogOpen(true)}>
              Manage Templates
            </Button>
            <TemplatesDialog />
          </div>

          {/* Data Retention */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Data Retention</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure how long completed forms and archived projects are stored
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setRetentionDialogOpen(true)}>
              Configure Retention
            </Button>
            <RetentionDialog />
          </div>

          {/* Email Notifications */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Email Notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">Configure system-wide email notification settings</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setNotificationsDialogOpen(true)}>
              Configure Notifications
            </Button>
            <NotificationsDialog />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

