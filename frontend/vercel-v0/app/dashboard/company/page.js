"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CompanySettingsPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const image_1 = __importDefault(require("next/image"));
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const use_toast_1 = require("@/components/ui/use-toast");
const auth_provider_1 = require("@/components/auth-provider");
const lucide_react_1 = require("lucide-react");
const company_service_1 = require("@/lib/company-service");
function CompanySettingsPage() {
    const { user } = (0, auth_provider_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    const [companySettings, setCompanySettings] = (0, react_1.useState)(null);
    const [logoFile, setLogoFile] = (0, react_1.useState)(null);
    const [logoPreview, setLogoPreview] = (0, react_1.useState)(null);
    const [debugInfo, setDebugInfo] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        // Check if user is admin or has permission to edit company settings
        if (user?.role !== "admin") {
            router.push("/dashboard");
            return;
        }
        // Fetch company settings
        const fetchCompanySettings = async () => {
            setIsLoading(true);
            try {
                const settings = await (0, company_service_1.getCompanySettings)();
                setCompanySettings(settings);
                setLogoPreview(settings.logo);
            }
            catch (error) {
                console.error("Error fetching company settings:", error);
                toast({
                    title: "Error",
                    description: "Failed to load company settings",
                    variant: "destructive",
                });
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchCompanySettings();
    }, [user, router, toast]);
    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Check file size (limit to 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Logo image must be less than 2MB",
                variant: "destructive",
            });
            return;
        }
        // Check file type
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image file",
                variant: "destructive",
            });
            return;
        }
        setLogoFile(file);
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };
    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!companySettings)
            return;
        setIsSaving(true);
        try {
            // Get form elements directly
            const form = e.target;
            const nameInput = form.querySelector("#name");
            const addressInput = form.querySelector("#address");
            const phoneInput = form.querySelector("#phone");
            const emailInput = form.querySelector("#email");
            const websiteInput = form.querySelector("#website");
            const descriptionInput = form.querySelector("#description");
            // Process logo if changed
            let logoUrl = companySettings.logo;
            if (logoFile) {
                logoUrl = await (0, company_service_1.uploadCompanyLogo)(logoFile);
            }
            else if (logoPreview === null) {
                logoUrl = null;
            }
            // Update settings
            const updatedSettings = {
                ...companySettings,
                name: nameInput.value,
                address: addressInput.value,
                phone: phoneInput.value,
                email: emailInput.value,
                website: websiteInput.value,
                description: descriptionInput.value,
                logo: logoUrl,
            };
            console.log("Saving settings:", updatedSettings);
            // Save the settings
            const savedSettings = await (0, company_service_1.updateCompanySettings)(updatedSettings);
            setCompanySettings(savedSettings);
            // Trigger refresh for other components
            triggerSettingsRefresh();
            toast({
                title: "Settings saved",
                description: "Company settings have been updated successfully.",
            });
        }
        catch (error) {
            console.error("Error saving company settings:", error);
            toast({
                title: "Error",
                description: "Failed to save company settings. " + (error instanceof Error ? error.message : ""),
                variant: "destructive",
            });
        }
        finally {
            setIsSaving(false);
        }
    };
    // Function to manually trigger a refresh of components that use company settings
    const triggerSettingsRefresh = () => {
        // Dispatch a storage event to notify other components
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("storage"));
        }
    };
    // Debug function to check what's in localStorage
    const checkLocalStorage = () => {
        if (typeof window !== "undefined") {
            const settings = localStorage.getItem("companySettings");
            const logo = localStorage.getItem("companyLogo");
            const name = localStorage.getItem("companyName");
            setDebugInfo(JSON.stringify({
                settings: settings ? JSON.parse(settings) : null,
                logo: logo ? (logo.length > 100 ? logo.substring(0, 100) + "..." : logo) : null,
                name,
            }, null, 2));
            toast({
                title: "Debug Info",
                description: "Check the console for localStorage contents",
            });
            console.log("Company Settings:", settings ? JSON.parse(settings) : null);
            console.log("Company Logo:", logo ? "Available (too large to display)" : null);
            console.log("Company Name:", name);
        }
    };
    if (isLoading) {
        return (<div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>);
    }
    if (!companySettings) {
        return (<div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <lucide_react_1.Building className="h-10 w-10 text-muted-foreground"/>
          <h3 className="mt-4 text-lg font-semibold">Company settings not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">Unable to load company settings. Please try again later.</p>
        </div>
      </div>);
    }
    return (<div className="container py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground">Manage your company information and branding</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <card_1.Card className="md:col-span-1">
            <card_1.CardHeader>
              <card_1.CardTitle>Company Logo</card_1.CardTitle>
              <card_1.CardDescription>Upload your company logo to display on forms and reports</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                  {logoPreview ? (<image_1.default src={logoPreview || "/placeholder.svg"} alt="Company Logo" fill className="object-contain p-2"/>) : (<lucide_react_1.Building className="h-16 w-16 text-muted-foreground"/>)}
                </div>

                <div className="flex gap-2">
                  <label_1.Label htmlFor="logo-upload" className="flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                    <lucide_react_1.Upload className="h-4 w-4"/>
                    Upload Logo
                  </label_1.Label>
                  <input_1.Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange}/>

                  {logoPreview && (<button_1.Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo} className="flex items-center gap-2">
                      <lucide_react_1.Trash2 className="h-4 w-4"/>
                      Remove
                    </button_1.Button>)}
                </div>

                <p className="text-xs text-muted-foreground">
                  Recommended size: 400x400 pixels. Max file size: 2MB.
                  <br />
                  Supported formats: JPG, PNG, SVG
                </p>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card className="md:col-span-1">
            <card_1.CardHeader>
              <card_1.CardTitle>Company Information</card_1.CardTitle>
              <card_1.CardDescription>Update your company details</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="name">Company Name</label_1.Label>
                <input_1.Input id="name" name="name" defaultValue={companySettings.name} required/>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="address">Address</label_1.Label>
                <textarea_1.Textarea id="address" name="address" defaultValue={companySettings.address} rows={3}/>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label_1.Label htmlFor="phone">Phone</label_1.Label>
                  <input_1.Input id="phone" name="phone" defaultValue={companySettings.phone}/>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="email">Email</label_1.Label>
                  <input_1.Input id="email" name="email" type="email" defaultValue={companySettings.email}/>
                </div>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="website">Website</label_1.Label>
                <input_1.Input id="website" name="website" defaultValue={companySettings.website}/>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="description">Description</label_1.Label>
                <textarea_1.Textarea id="description" name="description" defaultValue={companySettings.description} rows={3}/>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        <div className="mt-6 flex justify-between">
          {process.env.NODE_ENV === "development" && (<button_1.Button type="button" variant="outline" onClick={checkLocalStorage}>
              Debug Storage
            </button_1.Button>)}
          <button_1.Button type="submit" disabled={isSaving} className="flex items-center gap-2">
            {isSaving ? (<>Saving...</>) : (<>
                <lucide_react_1.Check className="h-4 w-4"/>
                Save Changes
              </>)}
          </button_1.Button>
        </div>
      </form>
    </div>);
}
//# sourceMappingURL=page.js.map