"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NewUserPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const select_1 = require("@/components/ui/select");
const use_toast_1 = require("@/components/ui/use-toast");
const lucide_react_1 = require("lucide-react");
function NewUserPage() {
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [formData, setFormData] = (0, react_1.useState)({
        firstName: "",
        lastName: "",
        email: "",
        role: "inspector",
        company: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = (0, react_1.useState)({});
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };
    const handleRoleChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            role: value,
        }));
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.firstName.trim())
            newErrors.firstName = "First name is required";
        if (!formData.lastName.trim())
            newErrors.lastName = "Last name is required";
        if (!formData.email.trim())
            newErrors.email = "Email is required";
        if (!/^\S+@\S+\.\S+$/.test(formData.email))
            newErrors.email = "Please enter a valid email address";
        if (!formData.company.trim())
            newErrors.company = "Company is required";
        if (!formData.password)
            newErrors.password = "Password is required";
        if (formData.password.length < 8)
            newErrors.password = "Password must be at least 8 characters";
        if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords do not match";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // Update the handleSubmit function to properly create a new user
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Get form data
        const formData = new FormData(e.currentTarget);
        const firstName = formData.get("firstName");
        const lastName = formData.get("lastName");
        const email = formData.get("email");
        const role = formData.get("role");
        const company = formData.get("company");
        // Note: In a real app, we would hash the password
        // For demo purposes, we'll ignore the password field and use "password" for all users
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Store the new user in localStorage to simulate persistence
        try {
            // Get existing users or initialize empty array
            const existingUsers = localStorage.getItem("users") ? JSON.parse(localStorage.getItem("users") || "[]") : [];
            // Create new user object
            const newUser = {
                id: (existingUsers.length + 1).toString(),
                name: `${firstName} ${lastName}`,
                email: email,
                role: role,
                company: company,
                lastActive: new Date().toISOString().split("T")[0],
                status: "active",
                // Note: In a real app, we would store a hashed password
                // For demo purposes, all users use "password" for login
            };
            // Add to users array
            existingUsers.push(newUser);
            // Save back to localStorage
            localStorage.setItem("users", JSON.stringify(existingUsers));
            toast({
                title: "User created",
                description: "The new user has been created successfully. They can log in with password: 'password'",
            });
        }
        catch (error) {
            console.error("Error saving user:", error);
            toast({
                title: "Error creating user",
                description: "There was a problem creating the user. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
            router.push("/dashboard/users");
        }
    };
    return (<div className="container py-6">
      <div className="flex items-center gap-2">
        <button_1.Button variant="outline" size="icon" asChild>
          <link_1.default href="/dashboard/users">
            <lucide_react_1.ChevronLeft className="h-4 w-4"/>
            <span className="sr-only">Back</span>
          </link_1.default>
        </button_1.Button>
        <h1 className="text-2xl font-bold tracking-tight">Add User</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <card_1.Card className="mt-6">
          <card_1.CardHeader>
            <card_1.CardTitle>User Details</card_1.CardTitle>
            <card_1.CardDescription>Add a new user to the system</card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label_1.Label htmlFor="firstName">First Name</label_1.Label>
                <input_1.Input id="firstName" placeholder="Enter first name" value={formData.firstName} onChange={handleChange} required className={errors.firstName ? "border-destructive" : ""}/>
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="lastName">Last Name</label_1.Label>
                <input_1.Input id="lastName" placeholder="Enter last name" value={formData.lastName} onChange={handleChange} required className={errors.lastName ? "border-destructive" : ""}/>
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="email">Email</label_1.Label>
              <input_1.Input id="email" type="email" placeholder="Enter email address" value={formData.email} onChange={handleChange} required className={errors.email ? "border-destructive" : ""}/>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="role">Role</label_1.Label>
              <select_1.Select value={formData.role} onValueChange={handleRoleChange} required>
                <select_1.SelectTrigger id="role">
                  <select_1.SelectValue placeholder="Select role"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="admin">Administrator</select_1.SelectItem>
                  <select_1.SelectItem value="foreman">Foreman</select_1.SelectItem>
                  <select_1.SelectItem value="inspector">Inspector</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="company">Company</label_1.Label>
              <input_1.Input id="company" placeholder="Enter company name" value={formData.company} onChange={handleChange} required className={errors.company ? "border-destructive" : ""}/>
              {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label_1.Label htmlFor="password">Password</label_1.Label>
                <input_1.Input id="password" type="password" placeholder="Enter password" value={formData.password} onChange={handleChange} required className={errors.password ? "border-destructive" : ""}/>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="confirmPassword">Confirm Password</label_1.Label>
                <input_1.Input id="confirmPassword" type="password" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} required className={errors.confirmPassword ? "border-destructive" : ""}/>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>
          </card_1.CardContent>
          <card_1.CardFooter className="flex justify-end gap-4">
            <button_1.Button variant="outline" onClick={() => router.push("/dashboard/users")} type="button">
              Cancel
            </button_1.Button>
            <button_1.Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </button_1.Button>
          </card_1.CardFooter>
        </card_1.Card>
      </form>
    </div>);
}
//# sourceMappingURL=page.js.map