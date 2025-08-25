import { hash, compare } from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./config";
import { ExtendedSession, ExtendedUser, Permission, UserRole, SecurityLevel, AccountStatus } from "./types";
import { env } from "@/lib/env";

/**
 * MakeItSo Finance - Authentication Utilities
 * 
 * Comprehensive authentication utilities for financial applications
 * including password hashing, permission checking, session validation,
 * and security monitoring functions.
 */

/**
 * Password Security Configuration
 */
const PASSWORD_CONFIG = {
  saltRounds: 12, // bcrypt salt rounds for financial-grade security
  minLength: 12,
  maxLength: 128,
  requireComplexity: true,
  blacklistedPasswords: [
    "password",
    "123456",
    "qwerty",
    "admin",
    "letmein",
    "welcome",
    "password123",
    "admin123",
  ],
} as const;

/**
 * Session Security Utilities
 */
export const sessionUtils = {
  /**
   * Get server-side session with type safety
   */
  async getServerSession(): Promise<ExtendedSession | null> {
    try {
      const session = await getServerSession(authOptions) as ExtendedSession | null;
      
      if (!session) return null;
      
      // Validate session integrity
      if (!this.isValidSession(session)) {
        console.warn("Invalid session detected - clearing session");
        return null;
      }
      
      return session;
    } catch (error) {
      console.error("Failed to get server session:", error);
      return null;
    }
  },

  /**
   * Validate session integrity and expiration
   */
  isValidSession(session: ExtendedSession): boolean {
    if (!session?.user?.id || !session.sessionId) {
      return false;
    }

    // Check session expiration
    const now = Date.now();
    const sessionAge = now - (session.loginTime || now);
    const maxAge = env.SESSION_TIMEOUT_MINUTES * 60 * 1000; // Convert to milliseconds

    if (sessionAge > maxAge) {
      console.warn("Session expired due to age");
      return false;
    }

    // Check last activity
    const inactiveTime = now - (session.lastActivity || now);
    if (inactiveTime > maxAge) {
      console.warn("Session expired due to inactivity");
      return false;
    }

    // Check account status
    if (session.user.accountStatus !== AccountStatus.ACTIVE) {
      console.warn("Session invalid due to account status:", session.user.accountStatus);
      return false;
    }

    return true;
  },

  /**
   * Check if session requires MFA verification
   */
  requiresMFA(session: ExtendedSession): boolean {
    return session.user.mfaEnabled && !session.mfaVerified;
  },

  /**
   * Get session security level
   */
  getSecurityLevel(session: ExtendedSession): SecurityLevel {
    if (!session.user.mfaEnabled) {
      return SecurityLevel.LOW;
    }
    
    if (session.mfaVerified) {
      return session.user.role === UserRole.ADMIN ? SecurityLevel.CRITICAL : SecurityLevel.HIGH;
    }
    
    return SecurityLevel.MEDIUM;
  },

  /**
   * Calculate session timeout remaining
   */
  getTimeoutRemaining(session: ExtendedSession): number {
    const now = Date.now();
    const inactiveTime = now - (session.lastActivity || now);
    const maxAge = env.SESSION_TIMEOUT_MINUTES * 60 * 1000;
    
    return Math.max(0, maxAge - inactiveTime);
  },
};

/**
 * Password Security Utilities
 */
export const passwordUtils = {
  /**
   * Hash password with bcrypt for secure storage
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || password.length < PASSWORD_CONFIG.minLength) {
      throw new Error(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
    }

    if (password.length > PASSWORD_CONFIG.maxLength) {
      throw new Error(`Password must be no more than ${PASSWORD_CONFIG.maxLength} characters long`);
    }

    // Check against blacklisted passwords
    if (PASSWORD_CONFIG.blacklistedPasswords.includes(password.toLowerCase())) {
      throw new Error("Password is too common and not allowed");
    }

    try {
      return await hash(password, PASSWORD_CONFIG.saltRounds);
    } catch (error) {
      console.error("Password hashing failed:", error);
      throw new Error("Failed to secure password");
    }
  },

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await compare(password, hashedPassword);
    } catch (error) {
      console.error("Password verification failed:", error);
      return false;
    }
  },

  /**
   * Validate password strength for financial applications
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
    strength: "weak" | "fair" | "good" | "strong";
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < PASSWORD_CONFIG.minLength) {
      errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
    } else {
      score += Math.min(25, password.length * 2);
    }

    // Character variety checks
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLowercase) errors.push("Password must contain lowercase letters");
    if (!hasUppercase) errors.push("Password must contain uppercase letters");
    if (!hasNumbers) errors.push("Password must contain numbers");
    if (!hasSpecialChars) errors.push("Password must contain special characters");

    // Score for character variety
    const varietyScore = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars]
      .filter(Boolean).length * 15;
    score += varietyScore;

    // Complexity bonus
    if (password.length >= 16) score += 10;
    if (/(.)\1{2,}/.test(password)) score -= 10; // Penalty for repeated characters
    if (PASSWORD_CONFIG.blacklistedPasswords.some(p => password.toLowerCase().includes(p))) {
      score -= 20;
      errors.push("Password contains common patterns");
    }

    // Determine strength
    let strength: "weak" | "fair" | "good" | "strong";
    if (score >= 80) strength = "strong";
    else if (score >= 60) strength = "good";
    else if (score >= 40) strength = "fair";
    else strength = "weak";

    return {
      isValid: errors.length === 0 && score >= 60,
      score: Math.min(100, Math.max(0, score)),
      errors,
      strength,
    };
  },

  /**
   * Generate secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    const allChars = lowercase + uppercase + numbers + specialChars;
    
    let password = "";
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split("").sort(() => Math.random() - 0.5).join("");
  },
};

/**
 * Permission and Authorization Utilities
 */
export const authUtils = {
  /**
   * Check if user has specific permission
   */
  hasPermission(user: ExtendedUser, permission: Permission): boolean {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  },

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(user: ExtendedUser, permissions: Permission[]): boolean {
    if (!user || !user.permissions) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  },

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(user: ExtendedUser, permissions: Permission[]): boolean {
    if (!user || !user.permissions) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  },

  /**
   * Check if user has specific role
   */
  hasRole(user: ExtendedUser, role: UserRole): boolean {
    if (!user) return false;
    return user.role === role || user.role === UserRole.ADMIN;
  },

  /**
   * Check if user has minimum role level
   */
  hasMinimumRole(user: ExtendedUser, minimumRole: UserRole): boolean {
    if (!user) return false;
    
    const roleHierarchy = {
      [UserRole.READONLY]: 0,
      [UserRole.USER]: 1,
      [UserRole.ANALYST]: 2,
      [UserRole.MANAGER]: 3,
      [UserRole.ADMIN]: 4,
    };

    const userLevel = roleHierarchy[user.role] ?? -1;
    const requiredLevel = roleHierarchy[minimumRole] ?? 999;

    return userLevel >= requiredLevel;
  },

  /**
   * Check if user can access a resource
   */
  canAccessResource(
    user: ExtendedUser,
    requiredPermissions: Permission[],
    requiredRole?: UserRole
  ): boolean {
    // Check account status
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      return false;
    }

    // Check role if specified
    if (requiredRole && !this.hasMinimumRole(user, requiredRole)) {
      return false;
    }

    // Check permissions
    return this.hasAllPermissions(user, requiredPermissions);
  },

  /**
   * Filter data based on user permissions
   */
  filterByPermissions<T>(
    data: T[],
    user: ExtendedUser,
    getRequiredPermissions: (item: T) => Permission[]
  ): T[] {
    return data.filter(item => {
      const requiredPermissions = getRequiredPermissions(item);
      return this.hasAllPermissions(user, requiredPermissions);
    });
  },
};

/**
 * Security Event Logging Utilities
 */
export const securityUtils = {
  /**
   * Log security event for audit trail
   */
  async logSecurityEvent(event: {
    type: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    details?: Record<string, any>;
    riskLevel?: "low" | "medium" | "high" | "critical";
  }): Promise<void> {
    const securityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      riskLevel: "medium" as const,
      ...event,
    };

    // Log to console (in production, send to security monitoring system)
    console.log("Security Event:", securityEvent);

    // TODO: In production, send to:
    // - Security Information and Event Management (SIEM) system
    // - Audit log database
    // - Real-time monitoring dashboard
    // - Compliance reporting system

    // For critical events, could trigger immediate alerts
    if (securityEvent.riskLevel === "critical") {
      console.error("CRITICAL SECURITY EVENT:", securityEvent);
      // TODO: Trigger immediate security alert
    }
  },

  /**
   * Validate IP address against whitelist/blacklist
   */
  isIPAllowed(ipAddress: string): boolean {
    // TODO: Implement IP whitelist/blacklist logic
    // For now, allow all IPs except obvious malicious ones
    const blacklistedIPs = [
      "0.0.0.0",
      "127.0.0.1", // Only in production
    ];

    if (env.NODE_ENV === "production" && blacklistedIPs.includes(ipAddress)) {
      return false;
    }

    return true;
  },

  /**
   * Detect suspicious user agent patterns
   */
  isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /automated/i,
      /test/i,
      /^$/,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  },

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  },

  /**
   * Sanitize user input to prevent injection attacks
   */
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/['"]/g, "") // Remove quotes that could break SQL
      .substring(0, 1000); // Limit length
  },
};

/**
 * Validation Utilities
 */
export const validationUtils = {
  /**
   * Validate email address format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate user input for financial applications
   */
  validateUserInput(input: {
    email?: string;
    password?: string;
    name?: string;
    phoneNumber?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (input.email && !this.isValidEmail(input.email)) {
      errors.push("Invalid email address format");
    }

    if (input.password) {
      const passwordValidation = passwordUtils.validatePasswordStrength(input.password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    if (input.name && (input.name.length < 2 || input.name.length > 100)) {
      errors.push("Name must be between 2 and 100 characters");
    }

    if (input.phoneNumber && !this.isValidPhoneNumber(input.phoneNumber)) {
      errors.push("Invalid phone number format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Export all utilities for convenient access
 */
export {
  PASSWORD_CONFIG,
};