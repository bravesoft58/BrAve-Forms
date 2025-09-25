"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
require("./globals.css");
const theme_provider_1 = require("@/components/theme-provider");
const toaster_1 = require("@/components/ui/toaster");
const auth_provider_1 = require("@/components/auth-provider");
const tenant_provider_1 = require("@/components/tenant-provider");
const notification_provider_1 = require("@/components/notification-provider");
const inter = (0, google_1.Inter)({ subsets: ["latin"] });
exports.metadata = {
    title: "BrAve Forms | Streamline jobsite logs—anytime, anywhere",
    description: "A cloud-based app for managing jobsite environmental logs and construction-related forms",
    metadataBase: new URL("https://braveforms.example.com"),
    generator: 'v0.dev'
};
function RootLayout({ children, }) {
    return (<html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="theme-color" content="#1e40af"/>
        <link rel="icon" href="/favicon.ico"/>
      </head>
      <body className={inter.className}>
        <theme_provider_1.ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <tenant_provider_1.TenantProvider>
            <auth_provider_1.AuthProvider>
              <notification_provider_1.NotificationProvider>
                {children}
                <toaster_1.Toaster />
              </notification_provider_1.NotificationProvider>
            </auth_provider_1.AuthProvider>
          </tenant_provider_1.TenantProvider>
        </theme_provider_1.ThemeProvider>
      </body>
    </html>);
}
require("./globals.css");
//# sourceMappingURL=layout.js.map