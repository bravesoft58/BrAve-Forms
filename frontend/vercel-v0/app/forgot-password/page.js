"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ForgotPasswordPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const use_toast_1 = require("@/components/ui/use-toast");
const logo_1 = require("@/components/ui/logo");
function ForgotPasswordPage() {
    const [email, setEmail] = (0, react_1.useState)("");
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [submitted, setSubmitted] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Basic validation
        if (!email) {
            toast({
                title: "Error",
                description: "Please enter your email address.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }
        try {
            // In a real implementation, this would call an API endpoint
            // For now, we'll simulate a successful password reset request
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setSubmitted(true);
            toast({
                title: "Password reset email sent",
                description: "If an account exists with this email, you will receive password reset instructions.",
            });
        }
        catch (error) {
            console.error("Password reset error:", error);
            toast({
                title: "Error",
                description: "An error occurred. Please try again later.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="flex min-h-screen flex-col">
      <div className="flex h-16 items-center border-b px-4 md:px-6">
        <logo_1.Logo href="/"/>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto w-full max-w-md space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you instructions to reset your password
            </p>
          </div>

          {submitted ? (<div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <p>Password reset email sent!</p>
                <p className="mt-2 text-sm">
                  If an account exists with the email you provided, you will receive instructions to reset your
                  password.
                </p>
              </div>
              <div className="text-center">
                <link_1.default href="/login">
                  <button_1.Button variant="link">Return to login</button_1.Button>
                </link_1.default>
              </div>
            </div>) : (<form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="email">Email</label_1.Label>
                <input_1.Input id="email" placeholder="name@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true"/>
              </div>
              <button_1.Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Reset Instructions"}
              </button_1.Button>
              <div className="text-center text-sm">
                <link_1.default href="/login" className="text-primary underline-offset-4 hover:underline">
                  Back to login
                </link_1.default>
              </div>
            </form>)}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map