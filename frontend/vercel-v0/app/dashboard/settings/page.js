"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsPage;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const switch_1 = require("@/components/ui/switch");
const tabs_1 = require("@/components/ui/tabs");
const use_toast_1 = require("@/components/ui/use-toast");
const lucide_react_1 = require("lucide-react");
const next_themes_1 = require("next-themes");
function SettingsPage() {
    const { toast } = (0, use_toast_1.useToast)();
    const { theme, setTheme } = (0, next_themes_1.useTheme)();
    const [emailNotifications, setEmailNotifications] = (0, react_1.useState)(true);
    const [pushNotifications, setPushNotifications] = (0, react_1.useState)(true);
    const handleSaveNotifications = () => {
        toast({
            title: "Notification settings saved",
            description: "Your notification preferences have been updated.",
        });
    };
    const handleSaveAppearance = () => {
        toast({
            title: "Appearance settings saved",
            description: "Your appearance preferences have been updated.",
        });
    };
    return (<div className="container py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <tabs_1.Tabs defaultValue="notifications" className="mt-6">
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="notifications">Notifications</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="appearance">Appearance</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="notifications" className="mt-4 space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Email Notifications</card_1.CardTitle>
              <card_1.CardDescription>Configure your email notification preferences</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <label_1.Label htmlFor="email-notifications" className="flex items-center gap-2">
                  <lucide_react_1.Mail className="h-4 w-4"/>
                  <span>Email Notifications</span>
                </label_1.Label>
                <switch_1.Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications}/>
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="email">Notification Email</label_1.Label>
                <input_1.Input id="email" type="email" placeholder="Enter your email" disabled={!emailNotifications}/>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Push Notifications</card_1.CardTitle>
              <card_1.CardDescription>Configure your push notification preferences</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <label_1.Label htmlFor="push-notifications" className="flex items-center gap-2">
                  <lucide_react_1.Bell className="h-4 w-4"/>
                  <span>Push Notifications</span>
                </label_1.Label>
                <switch_1.Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications}/>
              </div>
              {pushNotifications && (<div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">Push notifications will be sent to your browser when:</p>
                  <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                    <li>A form is submitted for review</li>
                    <li>A form is approved or rejected</li>
                    <li>Someone mentions you in a comment</li>
                    <li>Important project updates</li>
                  </ul>
                </div>)}
            </card_1.CardContent>
          </card_1.Card>

          <div className="flex justify-end">
            <button_1.Button onClick={handleSaveNotifications}>Save Notification Settings</button_1.Button>
          </div>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="appearance" className="mt-4 space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Theme</card_1.CardTitle>
              <card_1.CardDescription>Customize the appearance of the application</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <label_1.Label className="flex items-center gap-2">
                  {theme === "dark" ? <lucide_react_1.Moon className="h-4 w-4"/> : <lucide_react_1.Sun className="h-4 w-4"/>}
                  <span>Dark Mode</span>
                </label_1.Label>
                <switch_1.Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}/>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <div className="flex justify-end">
            <button_1.Button onClick={handleSaveAppearance}>Save Appearance Settings</button_1.Button>
          </div>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
//# sourceMappingURL=page.js.map