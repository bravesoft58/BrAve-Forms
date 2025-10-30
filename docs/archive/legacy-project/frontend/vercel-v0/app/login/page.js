"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const use_toast_1 = require("@/components/ui/use-toast");
const auth_provider_1 = require("@/components/auth-provider");
const logo_1 = require("@/components/ui/logo");
function LoginPage() {
    const [email, setEmail] = (0, react_1.useState)("");
    const [password, setPassword] = (0, react_1.useState)("");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const router = (0, navigation_1.useRouter)();
    const { toast } = (0, use_toast_1.useToast)();
    const { login, user } = (0, auth_provider_1.useAuth)();
    // Add state for error message
    const [error, setError] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        // Check if user is already logged in
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        // Basic validation
        if (!email || !password) {
            setError("Email and password are required");
            setIsLoading(false);
            return;
        }
        try {
            const success = await login(email, password);
            if (success) {
                toast({
                    title: "Login successful",
                    description: "You have been logged in successfully.",
                });
                router.push("/dashboard");
            }
            else {
                setError("Invalid email or password. Please try again.");
                toast({
                    title: "Login failed",
                    description: "Invalid email or password. Please try again.",
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            console.error("Login error:", error);
            setError("An error occurred during login. Please try again.");
            toast({
                title: "Login failed",
                description: "An error occurred during login. Please try again.",
                variant: "destructive",
            });
        }
        finally {
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
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 text-sm text-white bg-destructive rounded-md">{error}</div>}
              <div className="space-y-2">
                <label_1.Label htmlFor="email">Email</label_1.Label>
                <input_1.Input id="email" placeholder="name@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true"/>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label_1.Label htmlFor="password">Password</label_1.Label>
                  <link_1.default href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
                    Forgot password?
                  </link_1.default>
                </div>
                <input_1.Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-required="true" minLength={8}/>
              </div>
              <button_1.Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button_1.Button>
            </form>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <link_1.default href="/register" className="text-primary underline-offset-4 hover:underline">
                Sign up
              </link_1.default>
            </div>
            {/* Replace plaintext credentials with a more secure approach */}
            <div className="text-center text-xs text-muted-foreground">
              <p>For demo purposes only:</p>
              <p>Default password for all accounts is "password"</p>
              <p>New users created in the admin panel can also log in with "password"</p>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map