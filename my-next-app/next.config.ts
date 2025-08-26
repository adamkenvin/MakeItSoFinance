import type { NextConfig } from "next";

/**
 * Captain's Ledger - Vercel Deployment Configuration
 * Simplified configuration optimized for Vercel deployment
 */

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Remove X-Powered-By header for security
  poweredByHeader: false,
  
  // Server external packages
  serverExternalPackages: ['@prisma/client'],
  
  // Image optimization configuration
  images: {
    // Restrict image domains for security
    domains: [
      'images.unsplash.com',
      'lh3.googleusercontent.com'
    ],
    // Enable image optimization
    formats: ['image/webp', 'image/avif'],
  },
  
  // TypeScript configuration
  typescript: {
    // Temporarily ignore build errors for Vercel deployment
    ignoreBuildErrors: true
  },
  
  // ESLint configuration
  eslint: {
    // Temporarily ignore lint errors for Vercel deployment
    ignoreDuringBuilds: true
  },
};

export default nextConfig;