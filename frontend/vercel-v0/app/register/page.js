"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RegisterPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const use_toast_1 = require("@/components/ui/use-toast");
const logo_1 = require("@/components/ui/logo");
function RegisterPage() {
    const [name, setName] = (0, react_1.useState)("");
    const [email, setEmail] = (0, react_1.useState)("");
    const [password, setPassword] = (0, react_1.useState)("");
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)("");
    const [companyName, setCompanyName] = (0, react_1.useState)("");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [errors, setErrors] = (0, react_1.useState)({});
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    const validateForm = () => {
        const newErrors = {};
        if (!name.trim())
            newErrors.name = "Name is required";
        if (!email.trim())
            newErrors.email = "Email is required";
        if (!/^\S+@\S+\.\S+$/.test(email))
            newErrors.email = "Please enter a valid email address";
        if (!password)
            newErrors.password = "Password is required";
        if (password.length < 8)
            newErrors.password = "Password must be at least 8 characters";
        if (password !== confirmPassword)
            newErrors.confirmPassword = "Passwords do not match";
        if (!companyName.trim())
            newErrors.companyName = "Company name is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            toast({
                title: "Registration successful",
                description: "Your account has been created. You can now log in.",
            });
            setIsLoading(false);
            router.push("/login");
        }
        catch (error) {
            console.error("Registration error:", error);
            toast({
                title: "Registration failed",
                description: "An error occurred during registration. Please try again.",
                variant: "destructive",
            });
            setIsLoading(false);
        }
    };
    return (<div className="flex min-h-screen flex-col">
      <div className="flex h-16 items-center border-b px-4 md:px-6">
        <logo_1.Logo href="/"/>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto w-full max-w-md space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Create an Account</h1>
            <p className="text-muted-foreground">Enter your information to create an account</p>
          </div>
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="name">Full Name</label_1.Label>
                <input_1.Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required aria-required="true" className={errors.name ? "border-destructive" : ""}/>
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="email">Email</label_1.Label>
                <input_1.Input id="email" placeholder="name@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" className={errors.email ? "border-destructive" : ""}/>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="company">Company Name</label_1.Label>
                <input_1.Input id="company" placeholder="Your Company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required aria-required="true" className={errors.companyName ? "border-destructive" : ""}/>
                {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="password">Password</label_1.Label>
                <input_1.Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-required="true" minLength={8} className={errors.password ? "border-destructive" : ""}/>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="confirm-password">Confirm Password</label_1.Label>
                <input_1.Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required aria-required="true" className={errors.confirmPassword ? "border-destructive" : ""}/>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
              <button_1.Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </button_1.Button>
            </form>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <link_1.default href="/login" className="text-primary underline-offset-4 hover:underline">
                Log in
              </link_1.default>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map