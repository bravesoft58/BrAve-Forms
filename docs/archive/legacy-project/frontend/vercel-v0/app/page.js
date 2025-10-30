"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const logo_1 = require("@/components/ui/logo");
const lucide_react_1 = require("lucide-react");
function Home() {
    return (<div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <logo_1.Logo size="md"/>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-sm font-medium hover:underline underline-offset-4">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:underline underline-offset-4">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium hover:underline underline-offset-4">
              Pricing
            </a>
          </nav>
          <div className="flex gap-4">
            <link_1.default href="/login">
              <button_1.Button variant="outline">Log In</button_1.Button>
            </link_1.default>
            <link_1.default href="/register">
              <button_1.Button>Sign Up</button_1.Button>
            </link_1.default>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Streamline jobsite logs—anytime, anywhere
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    A cloud-based app for managing jobsite environmental logs and construction-related forms.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <link_1.default href="/register">
                    <button_1.Button size="lg" className="w-full">
                      Get Started
                    </button_1.Button>
                  </link_1.default>
                  <link_1.default href="#how-it-works">
                    <button_1.Button size="lg" variant="outline" className="w-full">
                      Learn More
                    </button_1.Button>
                  </link_1.default>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-950 dark:to-indigo-900 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 p-8">
                      <div className="rounded-lg bg-white/90 dark:bg-gray-800/90 p-4 shadow-lg">
                        <logo_1.Logo showText={false} size="sm" className="mb-2"/>
                        <h3 className="font-medium">Daily Logs</h3>
                        <p className="text-sm text-muted-foreground">Update logs from your mobile device</p>
                      </div>
                      <div className="rounded-lg bg-white/90 dark:bg-gray-800/90 p-4 shadow-lg">
                        <lucide_react_1.QrCode className="h-8 w-8 text-primary mb-2"/>
                        <h3 className="font-medium">QR Access</h3>
                        <p className="text-sm text-muted-foreground">Quick access for inspectors</p>
                      </div>
                      <div className="rounded-lg bg-white/90 dark:bg-gray-800/90 p-4 shadow-lg">
                        <lucide_react_1.Cloud className="h-8 w-8 text-primary mb-2"/>
                        <h3 className="font-medium">Cloud Storage</h3>
                        <p className="text-sm text-muted-foreground">Access logs from anywhere</p>
                      </div>
                      <div className="rounded-lg bg-white/90 dark:bg-gray-800/90 p-4 shadow-lg">
                        <lucide_react_1.Lock className="h-8 w-8 text-primary mb-2"/>
                        <h3 className="font-medium">Secure Access</h3>
                        <p className="text-sm text-muted-foreground">Role-based permissions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Everything you need to manage jobsite logs
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides a comprehensive solution for construction companies to manage environmental logs
                  and forms.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <lucide_react_1.Shield className="h-6 w-6"/>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">For Foremen</h3>
                  <p className="text-muted-foreground">
                    Update logs from mobile devices, copy previous logs as templates, and add photos directly from the
                    field.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <lucide_react_1.Shield className="h-6 w-6"/>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">For Inspectors</h3>
                  <p className="text-muted-foreground">
                    Access logs via QR codes with read-only permissions, ensuring compliance and transparency.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <lucide_react_1.UserCog className="h-6 w-6"/>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">For Administrators</h3>
                  <p className="text-muted-foreground">
                    Manage user access, create customizable forms, and archive projects for future reference.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  How It Works
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Simple, efficient, and accessible
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to be intuitive and easy to use for all stakeholders.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Set Up Projects</h3>
                  <p className="text-muted-foreground">
                    Administrators create projects and assign foremen with appropriate access permissions.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Update Logs</h3>
                  <p className="text-muted-foreground">
                    Foremen update logs from mobile devices, adding photos and using previous logs as templates.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Access & Review</h3>
                  <p className="text-muted-foreground">
                    Inspectors scan QR codes to access logs, while administrators monitor compliance and archive
                    completed projects.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Pricing
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Simple, transparent pricing</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Choose the plan that works best for your company's needs.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6 pt-8">
                  <h3 className="text-2xl font-bold">Starter</h3>
                  <p className="mt-2 text-muted-foreground">Perfect for small construction companies.</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold">$99</span>
                    <span className="ml-1 text-muted-foreground">/month</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Up to 5 active projects
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      3 user licenses
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Basic form templates
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      1 GB storage
                    </li>
                  </ul>
                </div>
                <div className="p-6 pt-0">
                  <button_1.Button className="w-full" asChild>
                    <link_1.default href="/register">Get Started</link_1.default>
                  </button_1.Button>
                </div>
              </div>
              <div className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm relative">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
                  Popular
                </div>
                <div className="p-6 pt-8">
                  <h3 className="text-2xl font-bold">Professional</h3>
                  <p className="mt-2 text-muted-foreground">For growing construction businesses.</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold">$199</span>
                    <span className="ml-1 text-muted-foreground">/month</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Up to 15 active projects
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      10 user licenses
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Custom form templates
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      5 GB storage
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Priority support
                    </li>
                  </ul>
                </div>
                <div className="p-6 pt-0">
                  <button_1.Button className="w-full" asChild>
                    <link_1.default href="/register">Get Started</link_1.default>
                  </button_1.Button>
                </div>
              </div>
              <div className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6 pt-8">
                  <h3 className="text-2xl font-bold">Enterprise</h3>
                  <p className="mt-2 text-muted-foreground">For large construction companies.</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold">$399</span>
                    <span className="ml-1 text-muted-foreground">/month</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Unlimited active projects
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      25 user licenses
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Advanced form customization
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      20 GB storage
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      24/7 dedicated support
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Custom integrations
                    </li>
                  </ul>
                </div>
                <div className="p-6 pt-0">
                  <button_1.Button className="w-full" asChild>
                    <link_1.default href="/contact">Contact Sales</link_1.default>
                  </button_1.Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Ready to streamline your jobsite logs?
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join hundreds of construction companies already using BrAve Forms.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <link_1.default href="/register">
                  <button_1.Button size="lg">Get Started Today</button_1.Button>
                </link_1.default>
                <link_1.default href="/contact">
                  <button_1.Button size="lg" variant="outline">
                    Contact Sales
                  </button_1.Button>
                </link_1.default>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:py-12">
          <logo_1.Logo size="sm"/>
          <nav className="flex gap-4 sm:gap-6">
            <link_1.default href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Terms of Service
            </link_1.default>
            <link_1.default href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Privacy Policy
            </link_1.default>
            <link_1.default href="/contact" className="text-sm font-medium hover:underline underline-offset-4">
              Contact
            </link_1.default>
          </nav>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} BrAve Forms. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>);
}
//# sourceMappingURL=page.js.map