import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // BF-74: the settings page shows the customer setup sheet from docs/.
  outputFileTracingIncludes: {
    "/dashboard/settings/email-setup": ["./docs/customer-setup/microsoft-365-email-alerts.md"],
  },
};

export default nextConfig;
