"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSecuritySettings = AdminSecuritySettings;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const use_toast_1 = require("@/components/ui/use-toast");
const checkbox_1 = require("@/components/ui/checkbox");
const table_1 = require("@/components/ui/table");
const select_1 = require("@/components/ui/select");
const lucide_react_1 = require("lucide-react");
const dialog_1 = require("@/components/ui/dialog");
function AdminSecuritySettings() {
    const { toast } = (0, use_toast_1.useToast)();
    // Dialog open states
    const [auditDialogOpen, setAuditDialogOpen] = (0, react_1.useState)(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = (0, react_1.useState)(false);
    const [logsDialogOpen, setLogsDialogOpen] = (0, react_1.useState)(false);
    // Password Policy Settings
    const [passwordPolicy, setPasswordPolicy] = (0, react_1.useState)({
        minLength: "8",
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: "90",
    });
    // Security Logs
    const [securityLogs, setSecurityLogs] = (0, react_1.useState)([
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
    ]);
    const [logSearchQuery, setLogSearchQuery] = (0, react_1.useState)("");
    const [logEventFilter, setLogEventFilter] = (0, react_1.useState)("all");
    // Security Audit State
    const [auditInProgress, setAuditInProgress] = (0, react_1.useState)(false);
    const [auditResults, setAuditResults] = (0, react_1.useState)(null);
    const handleRunSecurityAudit = async () => {
        setAuditInProgress(true);
        setAuditResults(null);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setAuditInProgress(false);
        setAuditResults({
            status: "warning",
            issues: [
                { severity: "high", description: "3 user accounts have not changed passwords in over 90 days" },
                { severity: "medium", description: "System backup frequency is set to weekly instead of daily" },
                { severity: "low", description: "2 inactive user accounts have not been deactivated" },
            ],
        });
        toast({
            title: "Security Audit Complete",
            description: "The security audit has completed with some issues detected.",
        });
    };
    const handleSavePasswordPolicy = () => {
        setPasswordDialogOpen(false);
        toast({
            title: "Password Policy Updated",
            description: "Your password policy settings have been saved successfully.",
        });
    };
    const handleExportLogs = () => {
        toast({
            title: "Logs Exported",
            description: "Security logs have been exported successfully.",
        });
    };
    // Security Audit Dialog
    const SecurityAuditDialog = () => (<dialog_1.Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
      <dialog_1.DialogContent className="sm:max-w-[525px]">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Security Audit</dialog_1.DialogTitle>
          <dialog_1.DialogDescription>Run a comprehensive security audit of your system.</dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        <div className="py-4">
          {auditInProgress ? (<div className="flex flex-col items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-center">Running security audit...</p>
              <p className="text-center text-sm text-muted-foreground mt-2">This may take a few minutes</p>
            </div>) : auditResults ? (<div className="space-y-4">
              <div className={`rounded-lg p-4 ${auditResults.status === "success"
                ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900"
                : auditResults.status === "warning"
                    ? "bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-900"
                    : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900"}`}>
                <div className="flex items-center gap-2">
                  {auditResults.status === "success" ? (<lucide_react_1.Check className="h-5 w-5 text-green-600 dark:text-green-400"/>) : auditResults.status === "warning" ? (<lucide_react_1.AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400"/>) : (<lucide_react_1.X className="h-5 w-5 text-red-600 dark:text-red-400"/>)}
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
                  {auditResults.issues.map((issue, index) => (<li key={index} className="flex items-start gap-2 text-sm">
                      <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${issue.severity === "high"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    : issue.severity === "medium"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"}`}>
                        {issue.severity}
                      </span>
                      <span>{issue.description}</span>
                    </li>))}
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
            </div>) : (<div className="space-y-4">
              <p>Running a security audit will check for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>User password compliance</li>
                <li>System configuration vulnerabilities</li>
                <li>Access control issues</li>
                <li>Data protection measures</li>
                <li>Backup and recovery procedures</li>
              </ul>
              <p className="text-sm text-muted-foreground">This process may take a few minutes to complete.</p>
            </div>)}
        </div>
        <dialog_1.DialogFooter>
          {!auditInProgress && !auditResults && <button_1.Button onClick={handleRunSecurityAudit}>Start Audit</button_1.Button>}
          {auditResults && <button_1.Button onClick={() => setAuditResults(null)}>Run Again</button_1.Button>}
          <button_1.Button variant="outline" onClick={() => setAuditDialogOpen(false)}>
            Close
          </button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
    // Password Policy Dialog
    const PasswordPolicyDialog = () => (<dialog_1.Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
      <dialog_1.DialogContent className="sm:max-w-[425px]">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Password Policy Settings</dialog_1.DialogTitle>
          <dialog_1.DialogDescription>Configure password requirements and expiration policies.</dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label_1.Label htmlFor="minLength">Minimum Password Length</label_1.Label>
              <input_1.Input id="minLength" type="number" value={passwordPolicy.minLength} onChange={(e) => setPasswordPolicy({
            ...passwordPolicy,
            minLength: e.target.value,
        })}/>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Password Requirements</h4>
              <div className="flex items-center space-x-2">
                <checkbox_1.Checkbox id="requireUppercase" checked={passwordPolicy.requireUppercase} onCheckedChange={(checked) => setPasswordPolicy({
            ...passwordPolicy,
            requireUppercase: checked,
        })}/>
                <label_1.Label htmlFor="requireUppercase">Require uppercase letters</label_1.Label>
              </div>
              <div className="flex items-center space-x-2">
                <checkbox_1.Checkbox id="requireLowercase" checked={passwordPolicy.requireLowercase} onCheckedChange={(checked) => setPasswordPolicy({
            ...passwordPolicy,
            requireLowercase: checked,
        })}/>
                <label_1.Label htmlFor="requireLowercase">Require lowercase letters</label_1.Label>
              </div>
              <div className="flex items-center space-x-2">
                <checkbox_1.Checkbox id="requireNumbers" checked={passwordPolicy.requireNumbers} onCheckedChange={(checked) => setPasswordPolicy({
            ...passwordPolicy,
            requireNumbers: checked,
        })}/>
                <label_1.Label htmlFor="requireNumbers">Require numbers</label_1.Label>
              </div>
              <div className="flex items-center space-x-2">
                <checkbox_1.Checkbox id="requireSpecialChars" checked={passwordPolicy.requireSpecialChars} onCheckedChange={(checked) => setPasswordPolicy({
            ...passwordPolicy,
            requireSpecialChars: checked,
        })}/>
                <label_1.Label htmlFor="requireSpecialChars">Require special characters</label_1.Label>
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="expiryDays">Password Expiry (days)</label_1.Label>
              <input_1.Input id="expiryDays" type="number" value={passwordPolicy.expiryDays} onChange={(e) => setPasswordPolicy({
            ...passwordPolicy,
            expiryDays: e.target.value,
        })}/>
              <p className="text-xs text-muted-foreground">Set to 0 for no expiration</p>
            </div>
          </div>
        </div>
        <dialog_1.DialogFooter>
          <button_1.Button onClick={handleSavePasswordPolicy}>Save Changes</button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
    // Access Logs Dialog
    const AccessLogsDialog = () => (<dialog_1.Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
      <dialog_1.DialogContent className="sm:max-w-[700px]">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>System Access Logs</dialog_1.DialogTitle>
          <dialog_1.DialogDescription>Review system access and security events.</dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input_1.Input placeholder="Search logs..." className="flex-1" value={logSearchQuery} onChange={(e) => setLogSearchQuery(e.target.value)}/>
              <select_1.Select value={logEventFilter} onValueChange={setLogEventFilter}>
                <select_1.SelectTrigger className="w-[180px]">
                  <select_1.SelectValue placeholder="Event Type"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="all">All Events</select_1.SelectItem>
                  <select_1.SelectItem value="login">Login Events</select_1.SelectItem>
                  <select_1.SelectItem value="password">Password Events</select_1.SelectItem>
                  <select_1.SelectItem value="user">User Management</select_1.SelectItem>
                  <select_1.SelectItem value="permission">Permission Changes</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            <div className="rounded-lg border">
              <table_1.Table>
                <table_1.TableHeader>
                  <table_1.TableRow>
                    <table_1.TableHead>Event</table_1.TableHead>
                    <table_1.TableHead>User</table_1.TableHead>
                    <table_1.TableHead>Timestamp</table_1.TableHead>
                    <table_1.TableHead>IP Address</table_1.TableHead>
                  </table_1.TableRow>
                </table_1.TableHeader>
                <table_1.TableBody>
                  {securityLogs.map((log) => (<table_1.TableRow key={log.id}>
                      <table_1.TableCell>{log.event}</table_1.TableCell>
                      <table_1.TableCell>{log.user}</table_1.TableCell>
                      <table_1.TableCell>{log.timestamp}</table_1.TableCell>
                      <table_1.TableCell>{log.ip}</table_1.TableCell>
                    </table_1.TableRow>))}
                </table_1.TableBody>
              </table_1.Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Showing 5 of 243 logs</p>
              <div className="flex items-center gap-2">
                <button_1.Button variant="outline" size="sm">
                  Previous
                </button_1.Button>
                <button_1.Button variant="outline" size="sm">
                  Next
                </button_1.Button>
              </div>
            </div>
          </div>
        </div>
        <dialog_1.DialogFooter>
          <button_1.Button variant="outline" onClick={handleExportLogs}>
            Export Logs
          </button_1.Button>
          <button_1.Button onClick={() => setLogsDialogOpen(false)}>Close</button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
    return (<card_1.Card>
      <card_1.CardHeader>
        <card_1.CardTitle>Security Settings</card_1.CardTitle>
        <card_1.CardDescription>Manage system security and access controls</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="space-y-4">
          {/* Security Audit */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <lucide_react_1.AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400"/>
              <span className="font-medium text-amber-800 dark:text-amber-300">Security Audit Recommended</span>
            </div>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
              Your last security audit was 90 days ago. We recommend running a new audit.
            </p>
            <button_1.Button variant="outline" size="sm" className="mt-2" onClick={() => setAuditDialogOpen(true)}>
              Run Security Audit
            </button_1.Button>
            <SecurityAuditDialog />
          </div>

          {/* Password Policy */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Password Policy</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure password requirements and expiration policies
            </p>
            <button_1.Button variant="outline" size="sm" className="mt-2" onClick={() => setPasswordDialogOpen(true)}>
              Configure Password Policy
            </button_1.Button>
            <PasswordPolicyDialog />
          </div>

          {/* Access Logs */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Access Logs</h3>
            <p className="mt-1 text-sm text-muted-foreground">View system access logs and security events</p>
            <button_1.Button variant="outline" size="sm" className="mt-2" onClick={() => setLogsDialogOpen(true)}>
              View Logs
            </button_1.Button>
            <AccessLogsDialog />
          </div>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
//# sourceMappingURL=security-settings.js.map