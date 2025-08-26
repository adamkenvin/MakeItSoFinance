import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    // Authentication & Security
    NEXTAUTH_SECRET: z
      .string()
      .min(32, "NEXTAUTH_SECRET must be at least 32 characters long")
      .describe("NextAuth.js secret for JWT signing and encryption"),
    
    NEXTAUTH_JWT_SECRET: z
      .string()
      .min(32, "NEXTAUTH_JWT_SECRET must be at least 32 characters long")
      .optional()
      .describe("Additional JWT secret for NextAuth.js"),
    
    NEXTAUTH_URL: z
      .string()
      .url("NEXTAUTH_URL must be a valid URL")
      .optional()
      .describe("Canonical URL of the site for NextAuth.js"),

    // Database Configuration
    DATABASE_URL: z
      .string()
      .url("DATABASE_URL must be a valid database connection URL")
      .describe("Database connection string"),
    
    DATABASE_DIRECT_URL: z
      .string()
      .url("DATABASE_DIRECT_URL must be a valid database connection URL")
      .optional()
      .describe("Direct database connection string (for migrations)"),

    // Financial Security & Encryption
    ENCRYPTION_KEY: z
      .string()
      .length(44, "ENCRYPTION_KEY must be exactly 44 characters (base64 encoded 32-byte key)")
      .regex(/^[A-Za-z0-9+/]*={0,2}$/, "ENCRYPTION_KEY must be valid base64")
      .describe("AES-256 encryption key for sensitive financial data"),
    
    BANK_API_SECRET_KEY: z
      .string()
      .min(32, "BANK_API_SECRET_KEY must be at least 32 characters")
      .optional()
      .describe("Secret key for bank API integration"),
    
    PLAID_SECRET_KEY: z
      .string()
      .min(32, "PLAID_SECRET_KEY must be at least 32 characters")
      .optional()
      .describe("Plaid API secret key for financial data"),

    // Payment Processing
    STRIPE_SECRET_KEY: z
      .string()
      .regex(/^sk_(test_|live_)/, "STRIPE_SECRET_KEY must start with sk_test_ or sk_live_")
      .optional()
      .describe("Stripe secret key for payment processing"),
    
    STRIPE_WEBHOOK_SECRET: z
      .string()
      .regex(/^whsec_/, "STRIPE_WEBHOOK_SECRET must start with whsec_")
      .optional()
      .describe("Stripe webhook secret for event verification"),

    // Rate Limiting & Security
    RATE_LIMIT_REQUESTS: z
      .string()
      .regex(/^\d+$/, "RATE_LIMIT_REQUESTS must be a positive integer")
      .transform(Number)
      .refine((val) => val > 0 && val <= 10000, "RATE_LIMIT_REQUESTS must be between 1 and 10000")
      .default("100")
      .describe("Maximum number of requests per time window"),
    
    RATE_LIMIT_WINDOW_MS: z
      .string()
      .regex(/^\d+$/, "RATE_LIMIT_WINDOW_MS must be a positive integer")
      .transform(Number)
      .refine((val) => val >= 1000, "RATE_LIMIT_WINDOW_MS must be at least 1000ms")
      .default("60000")
      .describe("Rate limiting time window in milliseconds"),

    // Email Configuration
    EMAIL_SERVER_HOST: z
      .string()
      .min(1, "EMAIL_SERVER_HOST is required")
      .optional()
      .describe("SMTP server hostname"),
    
    EMAIL_SERVER_PORT: z
      .string()
      .regex(/^\d+$/, "EMAIL_SERVER_PORT must be a valid port number")
      .transform(Number)
      .refine((val) => val > 0 && val <= 65535, "EMAIL_SERVER_PORT must be between 1 and 65535")
      .optional()
      .describe("SMTP server port"),
    
    EMAIL_SERVER_USER: z
      .string()
      .email("EMAIL_SERVER_USER must be a valid email address")
      .optional()
      .describe("SMTP server username"),
    
    EMAIL_SERVER_PASSWORD: z
      .string()
      .min(1, "EMAIL_SERVER_PASSWORD is required when EMAIL_SERVER_USER is set")
      .optional()
      .describe("SMTP server password"),
    
    EMAIL_FROM: z
      .string()
      .email("EMAIL_FROM must be a valid email address")
      .optional()
      .describe("Default 'from' email address"),

    // Logging & Monitoring
    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error"], {
        errorMap: () => ({ message: "LOG_LEVEL must be one of: debug, info, warn, error" })
      })
      .default("info")
      .describe("Application logging level"),
    
    SENTRY_DSN: z
      .string()
      .url("SENTRY_DSN must be a valid Sentry DSN URL")
      .optional()
      .describe("Sentry DSN for error monitoring"),

    // External APIs
    OPENAI_API_KEY: z
      .string()
      .regex(/^sk-/, "OPENAI_API_KEY must start with sk-")
      .optional()
      .describe("OpenAI API key for AI features"),

    // Session Security
    SESSION_TIMEOUT_MINUTES: z
      .string()
      .regex(/^\d+$/, "SESSION_TIMEOUT_MINUTES must be a positive integer")
      .transform(Number)
      .refine((val) => val >= 5 && val <= 1440, "SESSION_TIMEOUT_MINUTES must be between 5 and 1440 (24 hours)")
      .default("30")
      .describe("Session timeout in minutes"),

    // Financial Compliance
    PCI_COMPLIANCE_MODE: z
      .enum(["strict", "standard", "development"], {
        errorMap: () => ({ message: "PCI_COMPLIANCE_MODE must be one of: strict, standard, development" })
      })
      .default("standard")
      .describe("PCI DSS compliance mode"),
    
    // Environment
    NODE_ENV: z
      .enum(["development", "test", "production"], {
        errorMap: () => ({ message: "NODE_ENV must be one of: development, test, production" })
      })
      .default("development")
      .describe("Node.js environment"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_NAME: z
      .string()
      .min(1, "NEXT_PUBLIC_APP_NAME cannot be empty")
      .max(100, "NEXT_PUBLIC_APP_NAME must be less than 100 characters")
      .default("Captain's Ledger")
      .describe("Application display name"),
    
    NEXT_PUBLIC_APP_VERSION: z
      .string()
      .regex(/^\d+\.\d+\.\d+/, "NEXT_PUBLIC_APP_VERSION must follow semantic versioning (x.y.z)")
      .default("1.0.0")
      .describe("Application version"),
    
    NEXT_PUBLIC_APP_DESCRIPTION: z
      .string()
      .max(500, "NEXT_PUBLIC_APP_DESCRIPTION must be less than 500 characters")
      .default("Personal finance management application")
      .describe("Application description"),

    NEXT_PUBLIC_API_URL: z
      .string()
      .url("NEXT_PUBLIC_API_URL must be a valid URL")
      .optional()
      .describe("Public API base URL"),
    
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
      .string()
      .regex(/^pk_(test_|live_)/, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_")
      .optional()
      .describe("Stripe publishable key"),
    
    NEXT_PUBLIC_PLAID_PUBLIC_KEY: z
      .string()
      .min(10, "NEXT_PUBLIC_PLAID_PUBLIC_KEY must be at least 10 characters")
      .optional()
      .describe("Plaid public key"),
    
    NEXT_PUBLIC_SENTRY_DSN: z
      .string()
      .url("NEXT_PUBLIC_SENTRY_DSN must be a valid Sentry DSN URL")
      .optional()
      .describe("Public Sentry DSN for client-side error monitoring"),

    // Feature Flags
    NEXT_PUBLIC_ENABLE_ANALYTICS: z
      .enum(["true", "false"], {
        errorMap: () => ({ message: "NEXT_PUBLIC_ENABLE_ANALYTICS must be 'true' or 'false'" })
      })
      .transform((val) => val === "true")
      .default("false")
      .describe("Enable analytics tracking"),
    
    NEXT_PUBLIC_ENABLE_DEBUG: z
      .enum(["true", "false"], {
        errorMap: () => ({ message: "NEXT_PUBLIC_ENABLE_DEBUG must be 'true' or 'false'" })
      })
      .transform((val) => val === "true")
      .default("false")
      .describe("Enable debug mode"),

    // UI Configuration
    NEXT_PUBLIC_THEME_DEFAULT: z
      .enum(["light", "dark", "system"], {
        errorMap: () => ({ message: "NEXT_PUBLIC_THEME_DEFAULT must be one of: light, dark, system" })
      })
      .default("system")
      .describe("Default theme setting"),
    
    NEXT_PUBLIC_CURRENCY_DEFAULT: z
      .string()
      .regex(/^[A-Z]{3}$/, "NEXT_PUBLIC_CURRENCY_DEFAULT must be a 3-letter currency code (e.g., USD)")
      .default("USD")
      .describe("Default currency code"),
    
    NEXT_PUBLIC_LOCALE_DEFAULT: z
      .string()
      .regex(/^[a-z]{2}(-[A-Z]{2})?$/, "NEXT_PUBLIC_LOCALE_DEFAULT must be a valid locale (e.g., en-US)")
      .default("en-US")
      .describe("Default locale setting"),

    // Security Headers
    NEXT_PUBLIC_CSP_REPORT_URI: z
      .string()
      .url("NEXT_PUBLIC_CSP_REPORT_URI must be a valid URL")
      .optional()
      .describe("Content Security Policy report URI"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    // Server-side variables
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_JWT_SECRET: process.env.NEXTAUTH_JWT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_DIRECT_URL: process.env.DATABASE_DIRECT_URL,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    BANK_API_SECRET_KEY: process.env.BANK_API_SECRET_KEY,
    PLAID_SECRET_KEY: process.env.PLAID_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RATE_LIMIT_REQUESTS: process.env.RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
    LOG_LEVEL: process.env.LOG_LEVEL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SESSION_TIMEOUT_MINUTES: process.env.SESSION_TIMEOUT_MINUTES,
    PCI_COMPLIANCE_MODE: process.env.PCI_COMPLIANCE_MODE,
    NODE_ENV: process.env.NODE_ENV,

    // Client-side variables
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_PLAID_PUBLIC_KEY: process.env.NEXT_PUBLIC_PLAID_PUBLIC_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG,
    NEXT_PUBLIC_THEME_DEFAULT: process.env.NEXT_PUBLIC_THEME_DEFAULT,
    NEXT_PUBLIC_CURRENCY_DEFAULT: process.env.NEXT_PUBLIC_CURRENCY_DEFAULT,
    NEXT_PUBLIC_LOCALE_DEFAULT: process.env.NEXT_PUBLIC_LOCALE_DEFAULT,
    NEXT_PUBLIC_CSP_REPORT_URI: process.env.NEXT_PUBLIC_CSP_REPORT_URI,
  },

  /**
   * Run `build` or `dev` with SKIP_ENV_VALIDATION to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=""` will throw an error.
   */
  emptyStringAsUndefined: true,
});

// Type exports for use throughout the application
export type Env = typeof env;
export type ServerEnv = Env['server'];
export type ClientEnv = Env['client'];

// Utility functions for environment-specific logic
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Security helpers
export const isPCIStrictMode = env.PCI_COMPLIANCE_MODE === 'strict';
export const isAnalyticsEnabled = env.NEXT_PUBLIC_ENABLE_ANALYTICS;
export const isDebugEnabled = env.NEXT_PUBLIC_ENABLE_DEBUG;

// Financial security validation helpers
export const validateFinancialEnvironment = () => {
  const requiredForProduction = [
    'ENCRYPTION_KEY',
    'NEXTAUTH_SECRET',
    'DATABASE_URL',
  ] as const;

  if (isProduction) {
    for (const key of requiredForProduction) {
      if (!env[key]) {
        throw new Error(
          `Missing required environment variable for production: ${key}`
        );
      }
    }
  }

  return true;
};

// Runtime environment validation (call this in your app startup)
export const validateEnvironment = () => {
  try {
    validateFinancialEnvironment();
    console.log('✅ Environment validation passed');
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    throw error;
  }
};