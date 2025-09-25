"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContactPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const use_toast_1 = require("@/components/ui/use-toast");
const logo_1 = require("@/components/ui/logo");
const select_1 = require("@/components/ui/select");
function ContactPage() {
    const [name, setName] = (0, react_1.useState)("");
    const [email, setEmail] = (0, react_1.useState)("");
    const [company, setCompany] = (0, react_1.useState)("");
    const [subject, setSubject] = (0, react_1.useState)("sales");
    const [message, setMessage] = (0, react_1.useState)("");
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [submitted, setSubmitted] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // In a real implementation, this would call an API endpoint
            // For now, we'll simulate a successful submission
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setSubmitted(true);
            toast({
                title: "Message sent",
                description: "Thank you for contacting us. We'll get back to you soon.",
            });
        }
        catch (error) {
            console.error("Contact form error:", error);
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
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="mx-auto w-full max-w-md space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Contact Us</h1>
            <p className="text-muted-foreground">Have questions about BrAve Forms? We're here to help.</p>
          </div>

          {submitted ? (<div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-6 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <h3 className="text-lg font-medium">Thank you for contacting us!</h3>
                <p className="mt-2">We've received your message and will get back to you as soon as possible.</p>
              </div>
              <div className="text-center">
                <link_1.default href="/">
                  <button_1.Button>Return to Home</button_1.Button>
                </link_1.default>
              </div>
            </div>) : (<form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="name">Full Name</label_1.Label>
                <input_1.Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required/>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="email">Email</label_1.Label>
                <input_1.Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required/>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="company">Company</label_1.Label>
                <input_1.Input id="company" placeholder="Your Company" value={company} onChange={(e) => setCompany(e.target.value)} required/>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="subject">I'm interested in</label_1.Label>
                <select_1.Select value={subject} onValueChange={setSubject}>
                  <select_1.SelectTrigger id="subject">
                    <select_1.SelectValue placeholder="Select a subject"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="sales">Sales Information</select_1.SelectItem>
                    <select_1.SelectItem value="demo">Request a Demo</select_1.SelectItem>
                    <select_1.SelectItem value="support">Technical Support</select_1.SelectItem>
                    <select_1.SelectItem value="other">Other</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="message">Message</label_1.Label>
                <textarea_1.Textarea id="message" placeholder="How can we help you?" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required/>
              </div>

              <button_1.Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </button_1.Button>
            </form>)}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map