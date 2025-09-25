/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Enable PPR for better performance
    ppr: false, // Set to true when ready for production
    // Enable server components logging
    serverComponentsExternalPackages: [],
    // Optimize font loading
    optimizeServerReact: true,
  },

  // Core configurations
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  // Image optimization for construction site photos
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Enable compression for better mobile performance
  compress: true,

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Service Worker headers for offline functionality
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },

  // Webpack configuration for optimal bundling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle for construction site performance
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate Mantine components for better caching
          mantine: {
            test: /[\\/]node_modules[\\/]@mantine[\\/]/,
            name: 'mantine',
            chunks: 'all',
            priority: 30,
          },
          // Separate query client for state management
          query: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            name: 'query',
            chunks: 'all',
            priority: 20,
          },
        },
      },
    };

    // Add aliases for better imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, '.'),
      '@components': path.join(__dirname, 'components'),
      '@lib': path.join(__dirname, 'lib'),
    };

    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'BrAve Forms',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // Output configuration for deployment
  output: 'standalone',
  
  // Transpile packages for better compatibility
  transpilePackages: ['@brave-forms/types', '@brave-forms/compliance'],
};

const path = require('path');

module.exports = nextConfig;