/**
 * MakeItSo Finance - Authentication Module Export Index
 * 
 * Centralized exports for the authentication system with organized
 * imports for NextAuth.js configuration, types, utilities, and hooks.
 */

// NextAuth configuration
export { authOptions } from "./config";
export { validatePassword, PASSWORD_REQUIREMENTS } from "./config";

// Authentication types
export type {
  ExtendedUser as User,
  ExtendedSession as Session,
  ExtendedJWT as JWT,
  UserRole,
  Permission,
  AccountStatus,
  MFAMethod,
  SecurityLevel,
  UserPreferences,
  AuthResult,
  MFAVerificationResult,
  PasswordValidationResult,
  SecurityEvent,
  SecurityEventType,
} from "./types";

export {
  UserRole,
  Permission,
  AccountStatus,
  MFAMethod,
  SecurityLevel,
  SecurityEventType,
  ROLE_PERMISSIONS,
  SECURITY_LEVEL_CONFIG,
  isExtendedUser,
  isExtendedSession,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessResource,
} from "./types";

// Session provider
export { SessionProvider } from "./session-provider";
export { useSessionSecurity } from "./session-provider";

// Authentication utilities
export {
  sessionUtils,
  passwordUtils,
  authUtils,
  securityUtils,
  validationUtils,
  PASSWORD_CONFIG,
} from "./utils";

// Authentication hooks
export {
  useAuth,
  useRequireAuth,
  useOptionalAuth,
  usePermissions,
  useSessionTimeout,
  useSecurityMonitoring,
  useSessionRefresh,
} from "./hooks";

// Server-side utilities for getServerSideProps and API routes
export { sessionUtils as serverAuth } from "./utils";

/**
 * Commonly used permission groups for convenience
 */
export const PermissionGroups = {
  // Account management permissions
  ACCOUNT_READ: [Permission.VIEW_ACCOUNTS],
  ACCOUNT_WRITE: [Permission.VIEW_ACCOUNTS, Permission.CREATE_ACCOUNTS, Permission.EDIT_ACCOUNTS],
  ACCOUNT_ADMIN: [Permission.VIEW_ACCOUNTS, Permission.CREATE_ACCOUNTS, Permission.EDIT_ACCOUNTS, Permission.DELETE_ACCOUNTS],

  // Transaction management permissions
  TRANSACTION_READ: [Permission.VIEW_TRANSACTIONS],
  TRANSACTION_WRITE: [Permission.VIEW_TRANSACTIONS, Permission.CREATE_TRANSACTIONS, Permission.EDIT_TRANSACTIONS],
  TRANSACTION_ADMIN: [Permission.VIEW_TRANSACTIONS, Permission.CREATE_TRANSACTIONS, Permission.EDIT_TRANSACTIONS, Permission.DELETE_TRANSACTIONS, Permission.APPROVE_TRANSACTIONS],

  // Report management permissions
  REPORT_READ: [Permission.VIEW_REPORTS],
  REPORT_WRITE: [Permission.VIEW_REPORTS, Permission.CREATE_REPORTS],
  REPORT_ADMIN: [Permission.VIEW_REPORTS, Permission.CREATE_REPORTS, Permission.EXPORT_REPORTS],

  // User management permissions
  USER_READ: [Permission.VIEW_USERS],
  USER_WRITE: [Permission.VIEW_USERS, Permission.CREATE_USERS, Permission.EDIT_USERS],
  USER_ADMIN: [Permission.VIEW_USERS, Permission.CREATE_USERS, Permission.EDIT_USERS, Permission.DELETE_USERS, Permission.MANAGE_ROLES],

  // System administration permissions
  SYSTEM_READ: [Permission.VIEW_AUDIT_LOGS],
  SYSTEM_ADMIN: [Permission.VIEW_AUDIT_LOGS, Permission.MANAGE_SETTINGS, Permission.BACKUP_DATA],

  // Compliance permissions
  COMPLIANCE_READ: [Permission.VIEW_COMPLIANCE],
  COMPLIANCE_ADMIN: [Permission.VIEW_COMPLIANCE, Permission.MANAGE_COMPLIANCE, Permission.EXPORT_COMPLIANCE],
} as const;

/**
 * Role-based component guards for easy use in JSX
 */
export const RoleGuards = {
  /**
   * Only show content to administrators
   */
  AdminOnly: ({ children }: { children: React.ReactNode }) => {
    const { hasRole } = usePermissions();
    return hasRole(UserRole.ADMIN) ? <>{children}</> : null;
  },

  /**
   * Only show content to managers and above
   */
  ManagerAndAbove: ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { hasMinimumRole } = authUtils;
    return user && hasMinimumRole(user, UserRole.MANAGER) ? <>{children}</> : null;
  },

  /**
   * Only show content to authenticated users
   */
  AuthenticatedOnly: ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <>{children}</> : null;
  },

  /**
   * Only show content to users with specific permissions
   */
  WithPermissions: ({ 
    permissions, 
    children, 
    fallback 
  }: { 
    permissions: Permission[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) => {
    const { hasAllPermissions } = usePermissions();
    return hasAllPermissions(permissions) ? <>{children}</> : <>{fallback}</>;
  },
} as const;

/**
 * Security constants for financial applications
 */
export const SecurityConstants = {
  // Session timeout configurations
  SESSION_WARNING_THRESHOLD: 5 * 60 * 1000, // 5 minutes in milliseconds
  SESSION_REFRESH_INTERVAL: 5 * 60, // 5 minutes in seconds
  
  // Password security
  MIN_PASSWORD_LENGTH: 12,
  MAX_PASSWORD_LENGTH: 128,
  PASSWORD_SALT_ROUNDS: 12,
  
  // MFA configurations
  MFA_TOKEN_LENGTH: 6,
  MFA_TOKEN_VALIDITY: 5 * 60 * 1000, // 5 minutes
  
  // Account lockout
  MAX_FAILED_ATTEMPTS: 3,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS_PER_HOUR: 5,
  MAX_PASSWORD_RESET_ATTEMPTS_PER_HOUR: 3,
  
  // Security levels
  SECURITY_LEVELS: {
    LOW: 1,
    MEDIUM: 2, 
    HIGH: 3,
    CRITICAL: 4,
  } as const,
} as const;

/**
 * Authentication error messages for consistency
 */
export const AuthErrors = {
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_LOCKED: "Account has been locked due to too many failed attempts",
  ACCOUNT_DISABLED: "Account has been disabled",
  PASSWORD_EXPIRED: "Password has expired and must be changed",
  MFA_REQUIRED: "Multi-factor authentication is required",
  MFA_INVALID: "Invalid multi-factor authentication code",
  SESSION_EXPIRED: "Your session has expired. Please sign in again",
  INSUFFICIENT_PERMISSIONS: "You do not have permission to access this resource",
  SUSPICIOUS_ACTIVITY: "Suspicious activity detected. Please contact support",
  RATE_LIMITED: "Too many attempts. Please try again later",
  NETWORK_ERROR: "Network error. Please check your connection and try again",
  SERVER_ERROR: "Server error. Please try again later",
} as const;

/**
 * Success messages for user feedback
 */
export const AuthMessages = {
  LOGIN_SUCCESS: "Successfully signed in",
  LOGOUT_SUCCESS: "Successfully signed out", 
  PASSWORD_CHANGED: "Password successfully changed",
  MFA_ENABLED: "Multi-factor authentication enabled",
  MFA_DISABLED: "Multi-factor authentication disabled",
  PROFILE_UPDATED: "Profile successfully updated",
  ACCOUNT_CREATED: "Account successfully created",
  EMAIL_VERIFIED: "Email address verified",
  PASSWORD_RESET_SENT: "Password reset link sent to your email",
  SESSION_EXTENDED: "Session successfully extended",
} as const;

/**
 * Default export for convenient importing
 */
const auth = {
  // Configuration
  authOptions,
  PASSWORD_REQUIREMENTS,
  PASSWORD_CONFIG,
  
  // Types
  UserRole,
  Permission,
  AccountStatus,
  MFAMethod,
  SecurityLevel,
  SecurityEventType,
  
  // Utilities
  sessionUtils,
  passwordUtils,
  authUtils,
  securityUtils,
  validationUtils,
  
  // Hooks (must be used in client components)
  useAuth,
  useRequireAuth,
  useOptionalAuth,
  usePermissions,
  useSessionTimeout,
  useSecurityMonitoring,
  useSessionRefresh,
  
  // Components
  SessionProvider,
  RoleGuards,
  
  // Constants
  PermissionGroups,
  SecurityConstants,
  AuthErrors,
  AuthMessages,
};

export default auth;