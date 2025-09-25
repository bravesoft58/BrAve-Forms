"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AdminSecuritySettings() {
  const { toast } = useToast()

  // Dialog open states
  const [auditDialogOpen, setAuditDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)

  // Password Policy Settings
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: "8",
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: "90",
  })

  // Security Logs
  const [securityLogs, setSecurityLogs] = useState([
    { id: "1", event: "User Login", user: "admin@example.com", timestamp: "2024-03-22 14:32:45", ip: "192.168.1.1" },
    {
      id: "2",
      event: "Password Changed",
      user: "foreman@example.com",
      timestamp: "2024-03-21 09:15:22",
      ip: "192.168.1.2",
    },
    { id: "3", event: "Failed Login Attempt", user: "unknown", timestamp: "2024-03-20 18:45:11", ip: "203.0.113.5" },
    {
      id: "4",
      event: "User Created",
      user: "inspector@example.com",
      timestamp: "2024-03-19 11:22:33",
      ip: "192.168.1.1",
    },
    {
      id: "5",
      event: "Permission Changed",
      user: "foreman@example.com",
      timestamp: "2024-03-18 16:08:59",
      ip: "192.168.1.2",
    },
  ])
  const [logSearchQuery, setLogSearchQuery] = useState("")
  const [logEventFilter, setLogEventFilter] = useState("all")

  // Security Audit State
  const [auditInProgress, setAuditInProgress] = useState(false)
  const [auditResults, setAuditResults] = useState<null | {
    status: "success" | "warning" | "error"
    issues: { severity: "low" | "medium" | "high"; description: string }[]
  }>(null)

  const handleRunSecurityAudit = async () => {
    setAuditInProgress(true)
    setAuditResults(null)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setAuditInProgress(false)
    setAuditResults({
      status: "warning",
      issues: [
        { severity: "high", description: "3 user accounts have not changed passwords in over 90 days" },
        { severity: "medium", description: "System backup frequency is set to weekly instead of daily" },
        { severity: "low", description: "2 inactive user accounts have not been deactivated" },
      ],
    })

    toast({
      title: "Security Audit Complete",
      description: "The security audit has completed with some issues detected.",
    })
  }

  const handleSavePasswordPolicy = () => {
    setPasswordDialogOpen(false)

    toast({
      title: "Password Policy Updated",
      description: "Your password policy settings have been saved successfully.",
    })
  }

  const handleExportLogs = () => {
    toast({
      title: "Logs Exported",
      description: "Security logs have been exported successfully.",
    })
  }

  // Security Audit Dialog
  const SecurityAuditDialog = () => (
    <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Security Audit</DialogTitle>
          <DialogDescription>Run a comprehensive security audit of your system.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {auditInProgress ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-center">Running security audit...</p>
              <p className="text-center text-sm text-muted-foreground mt-2">This may take a few minutes</p>
            </div>
          ) : auditResults ? (
            <div className="space-y-4">
              <div
                className={`rounded-lg p-4 ${
                  auditResults.status === "success"
                    ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900"
                    : auditResults.status === "warning"
                      ? "bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-900"
                      : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  {auditResults.status === "success" ? (
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : auditResults.status === "warning" ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className="font-medium">
                    {auditResults.status === "success"
                      ? "No issues found"
                      : auditResults.status === "warning"
                        ? "Some issues found"
                        : "Critical issues found"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Issues Found:</h4>
                <ul className="space-y-2">
                  {auditResults.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          issue.severity === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : issue.severity === "medium"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span>{issue.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-medium">Recommendations:</h4>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  <li>Address high severity issues immediately</li>
                  <li>Schedule fixes for medium severity issues</li>
                  <li>Review low severity issues during next maintenance</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p>Running a security audit will check for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>User password compliance</li>
                <li>System configuration vulnerabilities</li>
                <li>Access control issues</li>
                <li>Data protection measures</li>
                <li>Backup and recovery procedures</li>
              </ul>
              <p className="text-sm text-muted-foreground">This process may take a few minutes to complete.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          {!auditInProgress && !auditResults && <Button onClick={handleRunSecurityAudit}>Start Audit</Button>}
          {auditResults && <Button onClick={() => setAuditResults(null)}>Run Again</Button>}
          <Button variant="outline" onClick={() => setAuditDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Password Policy Dialog
  const PasswordPolicyDialog = () => (
    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Password Policy Settings</DialogTitle>
          <DialogDescription>Configure password requirements and expiration policies.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minLength">Minimum Password Length</Label>
              <Input
                id="minLength"
                type="number"
                value={passwordPolicy.minLength}
                onChange={(e) =>
                  setPasswordPolicy({
                    ...passwordPolicy,
                    minLength: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Password Requirements</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireUppercase"
                  checked={passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) =>
                    setPasswordPolicy({
                      ...passwordPolicy,
                      requireUppercase: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="requireUppercase">Require uppercase letters</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireLowercase"
                  checked={passwordPolicy.requireLowercase}
                  onCheckedChange={(checked) =>
                    setPasswordPolicy({
                      ...passwordPolicy,
                      requireLowercase: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="requireLowercase">Require lowercase letters</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireNumbers"
                  checked={passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) =>
                    setPasswordPolicy({
                      ...passwordPolicy,
                      requireNumbers: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="requireNumbers">Require numbers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireSpecialChars"
                  checked={passwordPolicy.requireSpecialChars}
                  onCheckedChange={(checked) =>
                    setPasswordPolicy({
                      ...passwordPolicy,
                      requireSpecialChars: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="requireSpecialChars">Require special characters</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDays">Password Expiry (days)</Label>
              <Input
                id="expiryDays"
                type="number"
                value={passwordPolicy.expiryDays}
                onChange={(e) =>
                  setPasswordPolicy({
                    ...passwordPolicy,
                    expiryDays: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Set to 0 for no expiration</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSavePasswordPolicy}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Access Logs Dialog
  const AccessLogsDialog = () => (
    <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>System Access Logs</DialogTitle>
          <DialogDescription>Review system access and security events.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search logs..."
                className="flex-1"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
              />
              <Select value={logEventFilter} onValueChange={setLogEventFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="login">Login Events</SelectItem>
                  <SelectItem value="password">Password Events</SelectItem>
                  <SelectItem value="user">User Management</SelectItem>
                  <SelectItem value="permission">Permission Changes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.event}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.timestamp}</TableCell>
                      <TableCell>{log.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Showing 5 of 243 logs</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleExportLogs}>
            Export Logs
          </Button>
          <Button onClick={() => setLogsDialogOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Manage system security and access controls</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Security Audit */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-800 dark:text-amber-300">Security Audit Recommended</span>
            </div>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
              Your last security audit was 90 days ago. We recommend running a new audit.
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setAuditDialogOpen(true)}>
              Run Security Audit
            </Button>
            <SecurityAuditDialog />
          </div>

          {/* Password Policy */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Password Policy</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure password requirements and expiration policies
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setPasswordDialogOpen(true)}>
              Configure Password Policy
            </Button>
            <PasswordPolicyDialog />
          </div>

          {/* Access Logs */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Access Logs</h3>
            <p className="mt-1 text-sm text-muted-foreground">View system access logs and security events</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setLogsDialogOpen(true)}>
              View Logs
            </Button>
            <AccessLogsDialog />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

