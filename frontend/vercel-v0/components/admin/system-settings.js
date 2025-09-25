"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSystemSettings = AdminSystemSettings;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const switch_1 = require("@/components/ui/switch");
const use_toast_1 = require("@/components/ui/use-toast");
const checkbox_1 = require("@/components/ui/checkbox");
const table_1 = require("@/components/ui/table");
const lucide_react_1 = require("lucide-react");
const dialog_1 = require("@/components/ui/dialog");
function AdminSystemSettings() {
    const { toast } = (0, use_toast_1.useToast)();
    // Dialog open states
    const [templatesDialogOpen, setTemplatesDialogOpen] = (0, react_1.useState)(false);
    const [retentionDialogOpen, setRetentionDialogOpen] = (0, react_1.useState)(false);
    const [notificationsDialogOpen, setNotificationsDialogOpen] = (0, react_1.useState)(false);
    // Form Templates State
    const [templates, setTemplates] = (0, react_1.useState)([
        { id: "1", name: "Dust Control Log", isDefault: true },
        { id: "2", name: "SWPPP Inspection", isDefault: false },
        { id: "3", name: "Safety Inspection", isDefault: false },
    ]);
    const [newTemplateName, setNewTemplateName] = (0, react_1.useState)("");
    // Data Retention State
    const [retentionSettings, setRetentionSettings] = (0, react_1.useState)({
        completedForms: "365", // days
        archivedProjects: "730", // days
        userLogs: "90", // days
    });
    // Email Notification Settings
    const [emailSettings, setEmailSettings] = (0, react_1.useState)({
        newFormSubmission: true,
        formApproval: true,
        userRegistration: true,
        systemAlerts: true,
        dailyDigest: false,
        emailFrom: "notifications@braveforms.com",
    });
    const handleUpdateTemplate = (id, isDefault) => {
        setTemplates(templates.map((template) => template.id === id
            ? { ...template, isDefault }
            : template.id !== id && isDefault
                ? { ...template, isDefault: false }
                : template));
        toast({
            title: "Template Updated",
            description: `Template settings have been updated successfully.`,
        });
    };
    const handleDeleteTemplate = (id) => {
        setTemplates(templates.filter((template) => template.id !== id));
        toast({
            title: "Template Deleted",
            description: "The template has been deleted successfully.",
            variant: "destructive",
        });
    };
    const handleAddTemplate = () => {
        if (newTemplateName.trim() === "")
            return;
        const newTemplate = {
            id: `${templates.length + 1}`,
            name: newTemplateName,
            isDefault: false,
        };
        setTemplates([...templates, newTemplate]);
        setNewTemplateName("");
        toast({
            title: "Template Added",
            description: "The new template has been added successfully.",
        });
    };
    const handleSaveRetentionSettings = () => {
        setRetentionDialogOpen(false);
        toast({
            title: "Data Retention Settings Updated",
            description: "Your data retention settings have been saved successfully.",
        });
    };
    const handleSaveEmailSettings = () => {
        setNotificationsDialogOpen(false);
        toast({
            title: "Email Notification Settings Updated",
            description: "Your email notification settings have been saved successfully.",
        });
    };
    // Templates Dialog
    const TemplatesDialog = () => (<dialog_1.Dialog open={templatesDialogOpen} onOpenChange={setTemplatesDialogOpen}>
      <dialog_1.DialogContent className="sm:max-w-[525px]">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Form Templates</dialog_1.DialogTitle>
          <dialog_1.DialogDescription>Manage form templates and set defaults for new forms.</dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="rounded-lg border">
              <table_1.Table>
                <table_1.TableHeader>
                  <table_1.TableRow>
                    <table_1.TableHead>Template Name</table_1.TableHead>
                    <table_1.TableHead className="w-[100px]">Default</table_1.TableHead>
                    <table_1.TableHead className="w-[80px]">Actions</table_1.TableHead>
                  </table_1.TableRow>
                </table_1.TableHeader>
                <table_1.TableBody>
                  {templates.map((template) => (<table_1.TableRow key={template.id}>
                      <table_1.TableCell>{template.name}</table_1.TableCell>
                      <table_1.TableCell>
                        <checkbox_1.Checkbox checked={template.isDefault} onCheckedChange={(checked) => {
                if (checked) {
                    handleUpdateTemplate(template.id, true);
                }
            }}/>
                      </table_1.TableCell>
                      <table_1.TableCell>
                        <button_1.Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)} disabled={template.isDefault}>
                          <lucide_react_1.Trash2 className="h-4 w-4"/>
                        </button_1.Button>
                      </table_1.TableCell>
                    </table_1.TableRow>))}
                </table_1.TableBody>
              </table_1.Table>
            </div>
            <div className="flex items-center gap-2">
              <input_1.Input placeholder="New template name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)}/>
              <button_1.Button onClick={handleAddTemplate}>Add Template</button_1.Button>
            </div>
          </div>
        </div>
        <dialog_1.DialogFooter>
          <button_1.Button onClick={() => setTemplatesDialogOpen(false)}>Close</button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
    // Retention Dialog
    const RetentionDialog = () => (<dialog_1.Dialog open={retentionDialogOpen} onOpenChange={setRetentionDialogOpen}>
      <dialog_1.DialogContent className="sm:max-w-[425px]">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Data Retention Settings</dialog_1.DialogTitle>
          <dialog_1.DialogDescription>Configure how long different types of data are retained in the system.</dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label_1.Label htmlFor="completedForms">Completed Forms (days)</label_1.Label>
              <input_1.Input id="completedForms" type="number" value={retentionSettings.completedForms} onChange={(e) => setRetentionSettings({
            ...retentionSettings,
            completedForms: e.target.value,
        })}/>
              <p className="text-xs text-muted-foreground">Forms will be archived after this period</p>
            </div>
            <div className="space-y-2">
              <label_1.Label htmlFor="archivedProjects">Archived Projects (days)</label_1.Label>
              <input_1.Input id="archivedProjects" type="number" value={retentionSettings.archivedProjects} onChange={(e) => setRetentionSettings({
            ...retentionSettings,
            archivedProjects: e.target.value,
        })}/>
              <p className="text-xs text-muted-foreground">Projects will be permanently deleted after this period</p>
            </div>
            <div className="space-y-2">
              <label_1.Label htmlFor="userLogs">User Activity Logs (days)</label_1.Label>
              <input_1.Input id="userLogs" type="number" value={retentionSettings.userLogs} onChange={(e) => setRetentionSettings({
            ...retentionSettings,
            userLogs: e.target.value,
        })}/>
              <p className="text-xs text-muted-foreground">User activity logs will be deleted after this period</p>
            </div>
          </div>
        </div>
        <dialog_1.DialogFooter>
          <button_1.Button onClick={handleSaveRetentionSettings}>Save Changes</button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
    // Notifications Dialog
    const NotificationsDialog = () => (<dialog_1.Dialog open={notificationsDialogOpen} onOpenChange={setNotificationsDialogOpen}>
      <dialog_1.DialogContent className="sm:max-w-[425px]">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Email Notification Settings</dialog_1.DialogTitle>
          <dialog_1.DialogDescription>Configure when and how email notifications are sent.</dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label_1.Label htmlFor="emailFrom">From Email Address</label_1.Label>
              <input_1.Input id="emailFrom" type="email" value={emailSettings.emailFrom} onChange={(e) => setEmailSettings({
            ...emailSettings,
            emailFrom: e.target.value,
        })}/>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notification Types</h4>
              <div className="flex items-center justify-between space-x-2">
                <label_1.Label htmlFor="newFormSubmission" className="flex-1">
                  New Form Submission
                </label_1.Label>
                <switch_1.Switch id="newFormSubmission" checked={emailSettings.newFormSubmission} onCheckedChange={(checked) => setEmailSettings({
            ...emailSettings,
            newFormSubmission: checked,
        })}/>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <label_1.Label htmlFor="formApproval" className="flex-1">
                  Form Approval/Rejection
                </label_1.Label>
                <switch_1.Switch id="formApproval" checked={emailSettings.formApproval} onCheckedChange={(checked) => setEmailSettings({
            ...emailSettings,
            formApproval: checked,
        })}/>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <label_1.Label htmlFor="userRegistration" className="flex-1">
                  User Registration
                </label_1.Label>
                <switch_1.Switch id="userRegistration" checked={emailSettings.userRegistration} onCheckedChange={(checked) => setEmailSettings({
            ...emailSettings,
            userRegistration: checked,
        })}/>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <label_1.Label htmlFor="systemAlerts" className="flex-1">
                  System Alerts
                </label_1.Label>
                <switch_1.Switch id="systemAlerts" checked={emailSettings.systemAlerts} onCheckedChange={(checked) => setEmailSettings({
            ...emailSettings,
            systemAlerts: checked,
        })}/>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <label_1.Label htmlFor="dailyDigest" className="flex-1">
                  Daily Digest Summary
                </label_1.Label>
                <switch_1.Switch id="dailyDigest" checked={emailSettings.dailyDigest} onCheckedChange={(checked) => setEmailSettings({
            ...emailSettings,
            dailyDigest: checked,
        })}/>
              </div>
            </div>
          </div>
        </div>
        <dialog_1.DialogFooter>
          <button_1.Button onClick={handleSaveEmailSettings}>Save Changes</button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
    return (<card_1.Card>
      <card_1.CardHeader>
        <card_1.CardTitle>System Settings</card_1.CardTitle>
        <card_1.CardDescription>Configure global system settings</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="space-y-4">
          {/* Form Templates */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Form Templates</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the default templates used for creating new forms
            </p>
            <button_1.Button variant="outline" size="sm" className="mt-2" onClick={() => setTemplatesDialogOpen(true)}>
              Manage Templates
            </button_1.Button>
            <TemplatesDialog />
          </div>

          {/* Data Retention */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Data Retention</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure how long completed forms and archived projects are stored
            </p>
            <button_1.Button variant="outline" size="sm" className="mt-2" onClick={() => setRetentionDialogOpen(true)}>
              Configure Retention
            </button_1.Button>
            <RetentionDialog />
          </div>

          {/* Email Notifications */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Email Notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">Configure system-wide email notification settings</p>
            <button_1.Button variant="outline" size="sm" className="mt-2" onClick={() => setNotificationsDialogOpen(true)}>
              Configure Notifications
            </button_1.Button>
            <NotificationsDialog />
          </div>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
//# sourceMappingURL=system-settings.js.map