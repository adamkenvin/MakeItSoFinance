/**
 * MakeItSo Finance - Authentication Type Definitions
 * 
 * Enhanced TypeScript definitions for NextAuth.js with financial
 * application specific user roles, permissions, and security metadata.
 */

import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

/**
 * User roles for financial application
 */
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  ANALYST = "analyst",
  USER = "user",
  READONLY = "readonly",
}

/**
 * User permissions for granular access control
 */
export enum Permission {
  // Account Management
  VIEW_ACCOUNTS = "view_accounts",
  CREATE_ACCOUNTS = "create_accounts",
  EDIT_ACCOUNTS = "edit_accounts",
  DELETE_ACCOUNTS = "delete_accounts",
  
  // Transaction Management
  VIEW_TRANSACTIONS = "view_transactions",
  CREATE_TRANSACTIONS = "create_transactions",
  EDIT_TRANSACTIONS = "edit_transactions",
  DELETE_TRANSACTIONS = "delete_transactions",
  APPROVE_TRANSACTIONS = "approve_transactions",
  
  // Financial Reports
  VIEW_REPORTS = "view_reports",
  CREATE_REPORTS = "create_reports",
  EXPORT_REPORTS = "export_reports",
  
  // User Management
  VIEW_USERS = "view_users",
  CREATE_USERS = "create_users",
  EDIT_USERS = "edit_users",
  DELETE_USERS = "delete_users",
  MANAGE_ROLES = "manage_roles",
  
  // System Administration
  VIEW_AUDIT_LOGS = "view_audit_logs",
  MANAGE_SETTINGS = "manage_settings",
  BACKUP_DATA = "backup_data",
  
  // Compliance
  VIEW_COMPLIANCE = "view_compliance",
  MANAGE_COMPLIANCE = "manage_compliance",
  EXPORT_COMPLIANCE = "export_compliance",
}

/**
 * Account status for user account management
 */
export enum AccountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
  LOCKED = "locked",
  EXPIRED = "expired",
}

/**
 * Multi-factor authentication methods
 */
export enum MFAMethod {
  NONE = "none",
  SMS = "sms",
  EMAIL = "email",
  AUTHENTICATOR = "authenticator",
  HARDWARE_TOKEN = "hardware_token",
}

/**
 * Session security levels
 */
export enum SecurityLevel {
  LOW = "low",           // Basic authentication
  MEDIUM = "medium",     // Password + email verification
  HIGH = "high",         // Password + MFA
  CRITICAL = "critical", // Password + MFA + additional verification
}

/**
 * Extended User interface for financial applications
 */
export interface ExtendedUser extends DefaultUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  permissions: Permission[];
  accountStatus: AccountStatus;
  mfaEnabled: boolean;
  mfaMethod?: MFAMethod;
  securityLevel: SecurityLevel;
  lastLogin?: string;
  lastPasswordChange?: string;
  passwordExpired: boolean;
  failedLoginAttempts: number;
  accountLocked: boolean;
  lockoutExpiry?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  department?: string;
  employeeId?: string;
  avatar?: string;
  timezone?: string;
  locale?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

/**
 * User preferences for personalization
 */
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  currency: string;
  dateFormat: string;
  numberFormat: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    transactionAlerts: boolean;
    securityAlerts: boolean;
  };
  dashboard: {
    defaultView: string;
    widgets: string[];
  };
}

/**
 * Extended Session interface with financial security metadata
 */
export interface ExtendedSession extends DefaultSession {
  user: ExtendedUser;
  sessionId: string;
  securityLevel: SecurityLevel;
  lastActivity: number;
  loginTime: number;
  ipAddress?: string;
  userAgent?: string;
  mfaVerified: boolean;
  permissions: Permission[];
  accountStatus: AccountStatus;
  passwordExpired: boolean;
  requiresMFASetup: boolean;
  sessionTimeout: number; // in seconds
  refreshToken?: string;
  accessToken?: string;
  tokenExpiry?: number;
}

/**
 * Extended JWT interface with security enhancements
 */
export interface ExtendedJWT extends DefaultJWT {
  id: string;
  role: UserRole;
  permissions: Permission[];
  securityLevel: SecurityLevel;
  sessionId: string;
  loginTime: number;
  lastActivity: number;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  accountStatus: AccountStatus;
  passwordExpired: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  refreshTokenVersion?: number;
}

/**
 * Authentication result for credential validation
 */
export interface AuthResult {
  success: boolean;
  user?: ExtendedUser;
  error?: string;
  requiresMFA?: boolean;
  mfaToken?: string;
  accountLocked?: boolean;
  passwordExpired?: boolean;
  mustChangePassword?: boolean;
}

/**
 * MFA verification result
 */
export interface MFAVerificationResult {
  success: boolean;
  error?: string;
  backupCodes?: string[];
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
  score: number; // 0-100
}

/**
 * Security event types for audit logging
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  LOGOUT = "logout",
  PASSWORD_CHANGE = "password_change",
  PASSWORD_RESET = "password_reset",
  MFA_ENABLED = "mfa_enabled",
  MFA_DISABLED = "mfa_disabled",
  MFA_VERIFIED = "mfa_verified",
  MFA_FAILED = "mfa_failed",
  ACCOUNT_LOCKED = "account_locked",
  ACCOUNT_UNLOCKED = "account_unlocked",
  PERMISSION_GRANTED = "permission_granted",
  PERMISSION_REVOKED = "permission_revoked",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  SESSION_TIMEOUT = "session_timeout",
  CONCURRENT_SESSION = "concurrent_session",
}

/**
 * Security event for audit logging
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  userId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  details?: Record<string, any>;
  riskLevel: "low" | "medium" | "high" | "critical";
}

/**
 * Role-based permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.MANAGER]: [
    Permission.VIEW_ACCOUNTS,
    Permission.CREATE_ACCOUNTS,
    Permission.EDIT_ACCOUNTS,
    Permission.VIEW_TRANSACTIONS,
    Permission.CREATE_TRANSACTIONS,
    Permission.EDIT_TRANSACTIONS,
    Permission.APPROVE_TRANSACTIONS,
    Permission.VIEW_REPORTS,
    Permission.CREATE_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    Permission.VIEW_COMPLIANCE,
  ],
  [UserRole.ANALYST]: [
    Permission.VIEW_ACCOUNTS,
    Permission.VIEW_TRANSACTIONS,
    Permission.VIEW_REPORTS,
    Permission.CREATE_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_COMPLIANCE,
  ],
  [UserRole.USER]: [
    Permission.VIEW_ACCOUNTS,
    Permission.VIEW_TRANSACTIONS,
    Permission.CREATE_TRANSACTIONS,
    Permission.VIEW_REPORTS,
  ],
  [UserRole.READONLY]: [
    Permission.VIEW_ACCOUNTS,
    Permission.VIEW_TRANSACTIONS,
    Permission.VIEW_REPORTS,
  ],
};

/**
 * Session configuration for different security levels
 */
export const SECURITY_LEVEL_CONFIG: Record<SecurityLevel, {
  sessionTimeout: number; // minutes
  requiresMFA: boolean;
  allowConcurrentSessions: boolean;
  maxFailedAttempts: number;
  lockoutDuration: number; // minutes
}> = {
  [SecurityLevel.LOW]: {
    sessionTimeout: 60,
    requiresMFA: false,
    allowConcurrentSessions: true,
    maxFailedAttempts: 5,
    lockoutDuration: 15,
  },
  [SecurityLevel.MEDIUM]: {
    sessionTimeout: 30,
    requiresMFA: false,
    allowConcurrentSessions: true,
    maxFailedAttempts: 3,
    lockoutDuration: 30,
  },
  [SecurityLevel.HIGH]: {
    sessionTimeout: 15,
    requiresMFA: true,
    allowConcurrentSessions: false,
    maxFailedAttempts: 3,
    lockoutDuration: 60,
  },
  [SecurityLevel.CRITICAL]: {
    sessionTimeout: 10,
    requiresMFA: true,
    allowConcurrentSessions: false,
    maxFailedAttempts: 2,
    lockoutDuration: 120,
  },
};

/**
 * Type guards for runtime type checking
 */
export const isExtendedUser = (user: any): user is ExtendedUser => {
  return (
    typeof user === "object" &&
    user !== null &&
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    Object.values(UserRole).includes(user.role) &&
    Array.isArray(user.permissions) &&
    Object.values(AccountStatus).includes(user.accountStatus)
  );
};

export const isExtendedSession = (session: any): session is ExtendedSession => {
  return (
    typeof session === "object" &&
    session !== null &&
    isExtendedUser(session.user) &&
    typeof session.sessionId === "string" &&
    Object.values(SecurityLevel).includes(session.securityLevel)
  );
};

/**
 * Utility functions for permission checking
 */
export const hasPermission = (user: ExtendedUser, permission: Permission): boolean => {
  return user.permissions.includes(permission);
};

export const hasAnyPermission = (user: ExtendedUser, permissions: Permission[]): boolean => {
  return permissions.some(permission => user.permissions.includes(permission));
};

export const hasAllPermissions = (user: ExtendedUser, permissions: Permission[]): boolean => {
  return permissions.every(permission => user.permissions.includes(permission));
};

export const canAccessResource = (
  user: ExtendedUser,
  requiredPermissions: Permission[],
  requiredRole?: UserRole
): boolean => {
  // Check role if required
  if (requiredRole && user.role !== requiredRole && user.role !== UserRole.ADMIN) {
    return false;
  }
  
  // Check permissions
  return hasAllPermissions(user, requiredPermissions);
};

/**
 * Default export of all types for convenient importing
 */
export type {
  ExtendedUser as User,
  ExtendedSession as Session,
  ExtendedJWT as JWT,
};

// Module augmentation for NextAuth types
declare module "next-auth" {
  interface Session extends ExtendedSession {}
  interface User extends ExtendedUser {}
}

declare module "next-auth/jwt" {
  interface JWT extends ExtendedJWT {}
}