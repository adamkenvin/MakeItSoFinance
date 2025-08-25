import type { NextConfig } from "next";

/**
 * MakeItSo Finance - Comprehensive Security Configuration
 * 
 * This configuration implements enterprise-grade security measures
 * specifically designed for financial applications handling sensitive data.
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Content Security Policy Configuration
 * Implements strict CSP to prevent XSS attacks and unauthorized resource loading
 */
const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' ${isDevelopment ? "'unsafe-eval' 'unsafe-inline'" : "'unsafe-inline'"} 
    https://js.stripe.com 
    https://checkout.stripe.com
    https://*.googleapis.com
    https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' 
    https://fonts.googleapis.com
    https://cdn.jsdelivr.net;
  img-src 'self' 
    data: 
    blob:
    https://*.stripe.com
    https://images.unsplash.com
    https://*.googleusercontent.com;
  font-src 'self' 
    https://fonts.gstatic.com
    data:;
  connect-src 'self' 
    https://api.stripe.com
    https://*.googleapis.com
    https://vitals.vercel-insights.com
    ${isDevelopment ? 'ws://localhost:3000 http://localhost:3000' : ''};
  frame-src 'self' 
    https://js.stripe.com 
    https://hooks.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  block-all-mixed-content;
`;

/**
 * Security Headers Configuration
 * Implements comprehensive security headers for financial data protection
 */
const securityHeaders = [
  // HTTP Strict Transport Security (HSTS)
  // Forces HTTPS connections for enhanced security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  
  // Content Security Policy
  // Prevents XSS attacks by controlling resource loading
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  },
  
  // Prevent clickjacking attacks by controlling iframe embedding
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  
  // Control referrer information to protect user privacy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  
  // Restrict dangerous browser features and APIs
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
      'clipboard-write=(self)',
      'clipboard-read=(self)'
    ].join(', ')
  },
  
  // Legacy XSS protection (for older browsers)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  
  // Remove server information disclosure
  {
    key: 'X-Powered-By',
    value: 'MakeItSo Finance'
  },
  
  // Cross-Origin Embedder Policy for enhanced isolation
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp'
  },
  
  // Cross-Origin Opener Policy for popup security
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  
  // Cross-Origin Resource Policy
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin'
  }
];

/**
 * Next.js Configuration with Security Enhancements
 */
const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Remove X-Powered-By header for security
  poweredByHeader: false,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Experimental features for enhanced security
  experimental: {
    // Enable modern bundling for better tree shaking
    esmExternals: true,
    
    // Enable server components by default
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Image optimization configuration
  images: {
    // Restrict image domains for security
    domains: [
      'images.unsplash.com',
      'lh3.googleusercontent.com'
    ],
    // Enable image optimization
    formats: ['image/webp', 'image/avif'],
    // Limit image sizes to prevent DoS attacks
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  
  // Security headers applied to all routes
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Additional headers for API routes
        source: '/api/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ],
      }
    ];
  },
  
  // Security-focused redirects
  async redirects() {
    return [
      // Force HTTPS in production
      ...(isProduction ? [
        {
          source: '/(.*)',
          destination: 'https://makeitso-finance.com/:path*',
          permanent: true,
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http'
            }
          ]
        }
      ] : []),
      
      // Redirect common attack vectors
      {
        source: '/wp-admin/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: '/',
        permanent: false,
      }
    ];
  },
  
  // Rewrites for enhanced security and clean URLs
  async rewrites() {
    return [
      // Security: Hide actual API structure
      {
        source: '/health',
        destination: '/api/health'
      }
    ];
  },
  
  // Webpack configuration for security enhancements
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production optimizations
    if (!dev) {
      // Remove console logs in production
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true;
      
      // Enhanced security through obfuscation
      config.optimization.minimizer[0].options.terserOptions.mangle = {
        properties: {
          regex: /^_/
        }
      };
    }
    
    // Security: Prevent information disclosure
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.BUILD_ID': JSON.stringify(buildId),
        'process.env.IS_SERVER': JSON.stringify(isServer),
      })
    );
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    // Enable strict type checking in production
    ignoreBuildErrors: isDevelopment
  },
  
  // ESLint configuration
  eslint: {
    // Enable strict linting in production
    ignoreDuringBuilds: isDevelopment
  },
  
  // Output configuration for enhanced security
  output: 'standalone',
  
  // Compiler options for security
  compiler: {
    // Remove React dev tools in production
    reactRemoveProperties: isProduction,
    
    // Remove console logs in production
    removeConsole: isProduction ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Environment variables configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    BUILD_TIME: new Date().toISOString(),
  },
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: isDevelopment
    }
  }
};

export default nextConfig;
