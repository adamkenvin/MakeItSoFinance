import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { env } from "@/lib/env";
import { JWT } from "next-auth/jwt";

/**
 * MakeItSo Finance - NextAuth.js Configuration
 * 
 * Enterprise-grade authentication configuration for financial applications
 * with enhanced security measures and compliance features.
 */

// Financial application password requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
} as const;

/**
 * Validates password against financial application security requirements
 */
function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Simulated user authentication function
 * In production, replace with actual database user lookup
 */
async function authenticateUser(credentials: { email: string; password: string }) {
  // TODO: Replace with actual database user lookup
  // This is a placeholder for demonstration
  
  const mockUsers = [
    {
      id: "1",
      email: "admin@makeitso.finance",
      password: "$2a$12$LQv3c1yqBWVHxkd0wKcjFe.tY9J0jM4Y9xJKjKjKjKjKjKjKjKjKK", // "SecurePass123!"
      name: "Admin User",
      role: "admin",
      mfaEnabled: false,
      lastPasswordChange: new Date().toISOString(),
      accountLocked: false,
      failedLoginAttempts: 0,
    }
  ];
  
  // Find user by email
  const user = mockUsers.find(u => u.email === credentials.email);
  if (!user) {
    // Simulate timing attack protection
    await compare("dummy", "$2a$12$dummy");
    return null;
  }
  
  // Check if account is locked
  if (user.accountLocked) {
    throw new Error("Account is locked due to too many failed login attempts");
  }
  
  // Verify password
  const isPasswordValid = await compare(credentials.password, user.password);
  if (!isPasswordValid) {
    // In production, increment failed login attempts
    return null;
  }
  
  // Check password age (financial compliance)
  const passwordAge = Date.now() - new Date(user.lastPasswordChange).getTime();
  const passwordExpired = passwordAge > PASSWORD_REQUIREMENTS.maxAge;
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mfaEnabled: user.mfaEnabled,
    passwordExpired,
  };
}

/**
 * NextAuth.js configuration with financial-grade security
 */
export const authOptions: NextAuthOptions = {
  // Secure session strategy using JWT
  session: {
    strategy: "jwt",
    maxAge: env.SESSION_TIMEOUT_MINUTES * 60, // Convert minutes to seconds
    updateAge: 5 * 60, // Update session every 5 minutes
  },
  
  // JWT configuration with enhanced security
  jwt: {
    secret: env.NEXTAUTH_JWT_SECRET || env.NEXTAUTH_SECRET,
    maxAge: env.SESSION_TIMEOUT_MINUTES * 60,
    // Use stronger algorithm for financial applications
    encode: async ({ secret, token }) => {
      const { default: jwt } = await import("jsonwebtoken");
      return jwt.sign(token!, secret, { 
        algorithm: "HS512",
        expiresIn: `${env.SESSION_TIMEOUT_MINUTES}m`,
        issuer: "MakeItSo Finance",
        audience: "financial-app",
      });
    },
    decode: async ({ secret, token }) => {
      const { default: jwt } = await import("jsonwebtoken");
      try {
        return jwt.verify(token!, secret, {
          algorithms: ["HS512"],
          issuer: "MakeItSo Finance",
          audience: "financial-app",
        }) as JWT;
      } catch (error) {
        console.error("JWT verification failed:", error);
        return null;
      }
    },
  },
  
  // Authentication providers
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "your.email@example.com"
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your secure password"
        }
      },
      async authorize(credentials) {
        // Validate input
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
          throw new Error("Invalid email format");
        }
        
        // Validate password strength
        const passwordValidation = validatePassword(credentials.password);
        if (!passwordValidation.isValid) {
          throw new Error(`Password requirements not met: ${passwordValidation.errors.join(", ")}`);
        }
        
        try {
          // Authenticate user
          const user = await authenticateUser({
            email: credentials.email.toLowerCase().trim(),
            password: credentials.password,
          });
          
          if (!user) {
            // Generic error message to prevent user enumeration
            throw new Error("Invalid credentials");
          }
          
          // Check for password expiration (financial compliance)
          if (user.passwordExpired) {
            throw new Error("Password has expired. Please reset your password.");
          }
          
          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            mfaEnabled: user.mfaEnabled,
          };
          
        } catch (error) {
          console.error("Authentication error:", error);
          throw error;
        }
      }
    }),
  ],
  
  // Custom pages for financial application branding
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    // newUser: "/auth/welcome", // Uncomment if you want custom new user flow
  },
  
  // Enhanced security callbacks
  callbacks: {
    // JWT callback - runs when JWT is created
    async jwt({ token, user, account, trigger, session }) {
      // Include additional user information in JWT
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.mfaEnabled = (user as any).mfaEnabled;
        token.loginTime = Date.now();
      }
      
      // Handle session updates
      if (trigger === "update" && session) {
        // Update token with new session data
        return { ...token, ...session };
      }
      
      // Check for session timeout
      const now = Date.now();
      const loginTime = token.loginTime as number || now;
      const sessionAge = now - loginTime;
      const maxAge = env.SESSION_TIMEOUT_MINUTES * 60 * 1000; // Convert to milliseconds
      
      if (sessionAge > maxAge) {
        // Session expired
        return null;
      }
      
      // Add security metadata
      token.sessionId = token.sessionId || crypto.randomUUID();
      token.lastActivity = now;
      
      return token;
    },
    
    // Session callback - runs whenever session is accessed
    async session({ session, token }) {
      if (token && session.user) {
        // Include additional user information in session
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.mfaEnabled = token.mfaEnabled as boolean;
        session.sessionId = token.sessionId as string;
        session.lastActivity = token.lastActivity as number;
      }
      
      return session;
    },
    
    // Redirect callback - controls where users go after authentication
    async redirect({ url, baseUrl }) {
      // Always redirect to secure HTTPS in production
      if (env.NODE_ENV === "production" && !url.startsWith("https://")) {
        url = url.replace("http://", "https://");
      }
      
      // Ensure redirect stays within the application
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Only allow redirects to the same domain
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    },
    
    // Sign-in callback - additional validation on sign-in
    async signIn({ user, account, profile, email, credentials }) {
      // Additional security checks can be added here
      // For example: IP-based restrictions, device fingerprinting, etc.
      
      // Check if user account is active (placeholder)
      if (user && (user as any).accountLocked) {
        return false;
      }
      
      return true;
    },
  },
  
  // Security events logging
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email} at ${new Date().toISOString()}`);
      // TODO: Log to security audit system
    },
    
    async signOut({ session, token }) {
      console.log(`User signed out: ${session?.user?.email || token?.email} at ${new Date().toISOString()}`);
      // TODO: Log to security audit system
    },
    
    async createUser({ user }) {
      console.log(`New user created: ${user.email} at ${new Date().toISOString()}`);
      // TODO: Log to security audit system
    },
    
    async session({ session, token }) {
      // Log session access for audit purposes (in development only)
      if (env.NODE_ENV === "development") {
        console.log(`Session accessed: ${session?.user?.email} at ${new Date().toISOString()}`);
      }
    },
  },
  
  // Enhanced security configuration
  useSecureCookies: env.NODE_ENV === "production",
  
  // Custom cookie configuration for financial applications
  cookies: {
    sessionToken: {
      name: `${env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: env.NODE_ENV === "production",
        domain: env.NODE_ENV === "production" ? ".makeitso-finance.com" : undefined,
        maxAge: env.SESSION_TIMEOUT_MINUTES * 60, // Convert minutes to seconds
      },
    },
    callbackUrl: {
      name: `${env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: env.NODE_ENV === "production",
        maxAge: env.SESSION_TIMEOUT_MINUTES * 60,
      },
    },
    csrfToken: {
      name: `${env.NODE_ENV === "production" ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: env.NODE_ENV === "production",
        maxAge: env.SESSION_TIMEOUT_MINUTES * 60,
      },
    },
  },
  
  // Debug mode (development only)
  debug: env.NODE_ENV === "development",
  
  // Logger configuration for financial compliance
  logger: {
    error(code, metadata) {
      console.error(`NextAuth Error [${code}]:`, metadata);
      // TODO: Send to security monitoring system
    },
    warn(code) {
      console.warn(`NextAuth Warning [${code}]`);
    },
    debug(code, metadata) {
      if (env.NODE_ENV === "development") {
        console.debug(`NextAuth Debug [${code}]:`, metadata);
      }
    },
  },
};

/**
 * Password validation utility for client-side usage
 */
export { validatePassword, PASSWORD_REQUIREMENTS };

/**
 * Security utilities for authentication
 */
export const authSecurityUtils = {
  /**
   * Check if session is expired based on last activity
   */
  isSessionExpired: (lastActivity: number, timeoutMinutes: number = env.SESSION_TIMEOUT_MINUTES): boolean => {
    const now = Date.now();
    const maxAge = timeoutMinutes * 60 * 1000; // Convert to milliseconds
    return (now - lastActivity) > maxAge;
  },
  
  /**
   * Generate secure session ID
   */
  generateSessionId: (): string => {
    return crypto.randomUUID();
  },
  
  /**
   * Sanitize user input to prevent injection attacks
   */
  sanitizeInput: (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  },
};