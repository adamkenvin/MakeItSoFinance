"use client";

import { useSession, signIn, signOut, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ExtendedSession, ExtendedUser, Permission, UserRole, SecurityLevel } from "./types";
import { authUtils, securityUtils } from "./utils";
import { env } from "@/lib/env";

/**
 * Captain's Ledger - Authentication Hooks
 * 
 * Client-side authentication hooks for React components with
 * financial-grade security features, permission checking,
 * and session monitoring capabilities.
 */

/**
 * Enhanced session hook with financial security features
 */
export function useAuth() {
  const { data: session, status, update } = useSession() as {
    data: ExtendedSession | null;
    status: "loading" | "authenticated" | "unauthenticated";
    update: (data?: any) => Promise<ExtendedSession | null>;
  };
  
  const router = useRouter();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isSessionExpiring, setIsSessionExpiring] = useState<boolean>(false);

  // Activity monitoring
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    const events = ["mousedown", "keypress", "scroll", "click", "touchstart"];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Session expiration monitoring
  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    const checkExpiration = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      const warningTime = (env.SESSION_TIMEOUT_MINUTES - 5) * 60 * 1000; // 5 minutes before timeout
      const maxAge = env.SESSION_TIMEOUT_MINUTES * 60 * 1000;

      if (inactiveTime > warningTime && inactiveTime < maxAge) {
        setIsSessionExpiring(true);
      } else if (inactiveTime < warningTime) {
        setIsSessionExpiring(false);
      } else if (inactiveTime >= maxAge) {
        // Session expired - force logout
        handleSignOut("Session expired due to inactivity");
      }
    };

    const interval = setInterval(checkExpiration, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [status, session, lastActivity]);

  // Enhanced sign in function
  const handleSignIn = useCallback(async (
    credentials?: { email: string; password: string },
    options?: { callbackUrl?: string; redirect?: boolean }
  ) => {
    try {
      // Log security event
      await securityUtils.logSecurityEvent({
        type: "login_attempt",
        success: false, // Will update after result
        details: { email: credentials?.email },
        riskLevel: "medium",
      });

      const result = await signIn("credentials", {
        ...credentials,
        redirect: options?.redirect ?? true,
        callbackUrl: options?.callbackUrl ?? "/dashboard",
      });

      if (result?.error) {
        await securityUtils.logSecurityEvent({
          type: "login_failure",
          success: false,
          details: { 
            email: credentials?.email,
            error: result.error 
          },
          riskLevel: "high",
        });
        throw new Error(result.error);
      }

      await securityUtils.logSecurityEvent({
        type: "login_success",
        success: true,
        details: { email: credentials?.email },
        riskLevel: "low",
      });

      return result;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }, []);

  // Enhanced sign out function
  const handleSignOut = useCallback(async (reason?: string) => {
    try {
      // Log security event
      await securityUtils.logSecurityEvent({
        type: "logout",
        userId: session?.user?.id,
        sessionId: session?.sessionId,
        success: true,
        details: { reason },
        riskLevel: "low",
      });

      await signOut({
        callbackUrl: reason ? `/auth/signin?message=${encodeURIComponent(reason)}` : "/auth/signin",
        redirect: true,
      });
    } catch (error) {
      console.error("Sign out error:", error);
      // Force redirect even if signOut fails
      router.push("/auth/signin");
    }
  }, [session, router]);

  // Extend session (refresh activity)
  const extendSession = useCallback(async () => {
    if (status === "authenticated" && session) {
      setLastActivity(Date.now());
      await update({
        ...session,
        lastActivity: Date.now(),
      });
    }
  }, [status, session, update]);

  // Permission checking functions
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!session?.user) return false;
    return authUtils.hasPermission(session.user, permission);
  }, [session]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!session?.user) return false;
    return authUtils.hasAnyPermission(session.user, permissions);
  }, [session]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!session?.user) return false;
    return authUtils.hasAllPermissions(session.user, permissions);
  }, [session]);

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!session?.user) return false;
    return authUtils.hasRole(session.user, role);
  }, [session]);

  const canAccessResource = useCallback((
    requiredPermissions: Permission[],
    requiredRole?: UserRole
  ): boolean => {
    if (!session?.user) return false;
    return authUtils.canAccessResource(session.user, requiredPermissions, requiredRole);
  }, [session]);

  // Get session security level
  const getSecurityLevel = useCallback((): SecurityLevel => {
    if (!session) return SecurityLevel.LOW;
    
    if (!session.user.mfaEnabled) return SecurityLevel.LOW;
    if (session.mfaVerified && session.user.role === UserRole.ADMIN) return SecurityLevel.CRITICAL;
    if (session.mfaVerified) return SecurityLevel.HIGH;
    
    return SecurityLevel.MEDIUM;
  }, [session]);

  // Calculate time until session timeout
  const getTimeUntilTimeout = useCallback((): number => {
    const now = Date.now();
    const inactiveTime = now - lastActivity;
    const maxAge = env.SESSION_TIMEOUT_MINUTES * 60 * 1000;
    
    return Math.max(0, maxAge - inactiveTime);
  }, [lastActivity]);

  return {
    // Session data
    session,
    user: session?.user || null,
    status,
    
    // Authentication actions
    signIn: handleSignIn,
    signOut: handleSignOut,
    extendSession,
    update,
    
    // Permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canAccessResource,
    
    // Security information
    getSecurityLevel,
    getTimeUntilTimeout,
    isSessionExpiring,
    lastActivity,
    
    // Computed properties
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    requiresMFA: session?.user?.mfaEnabled && !session?.mfaVerified,
    passwordExpired: session?.passwordExpired || false,
  };
}

/**
 * Hook for requiring authentication with automatic redirect
 */
export function useRequireAuth(options?: {
  redirectTo?: string;
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
}) {
  const auth = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    if (auth.status === "loading") return;

    if (!auth.isAuthenticated) {
      const redirectUrl = options?.redirectTo || "/auth/signin";
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`${redirectUrl}?callbackUrl=${returnUrl}`);
      return;
    }

    // Check permissions if specified
    if (options?.requiredPermissions && !auth.hasAllPermissions(options.requiredPermissions)) {
      router.push("/unauthorized?reason=insufficient_permissions");
      return;
    }

    // Check role if specified
    if (options?.requiredRole && !auth.hasRole(options.requiredRole)) {
      router.push("/unauthorized?reason=insufficient_role");
      return;
    }

    // Check if MFA is required
    if (auth.requiresMFA) {
      router.push("/auth/mfa");
      return;
    }

    // Check if password expired
    if (auth.passwordExpired) {
      router.push("/auth/change-password?reason=expired");
      return;
    }

    setIsAuthorized(true);
  }, [auth, router, options]);

  return {
    ...auth,
    isAuthorized,
  };
}

/**
 * Hook for optional authentication (doesn't redirect)
 */
export function useOptionalAuth() {
  const auth = useAuth();
  
  return auth;
}

/**
 * Hook for permission-based UI rendering
 */
export function usePermissions() {
  const auth = useAuth();

  const withPermission = useCallback((
    permission: Permission,
    component: React.ReactNode,
    fallback?: React.ReactNode
  ): React.ReactNode => {
    return auth.hasPermission(permission) ? component : (fallback || null);
  }, [auth]);

  const withAnyPermission = useCallback((
    permissions: Permission[],
    component: React.ReactNode,
    fallback?: React.ReactNode
  ): React.ReactNode => {
    return auth.hasAnyPermission(permissions) ? component : (fallback || null);
  }, [auth]);

  const withAllPermissions = useCallback((
    permissions: Permission[],
    component: React.ReactNode,
    fallback?: React.ReactNode
  ): React.ReactNode => {
    return auth.hasAllPermissions(permissions) ? component : (fallback || null);
  }, [auth]);

  const withRole = useCallback((
    role: UserRole,
    component: React.ReactNode,
    fallback?: React.ReactNode
  ): React.ReactNode => {
    return auth.hasRole(role) ? component : (fallback || null);
  }, [auth]);

  return {
    ...auth,
    withPermission,
    withAnyPermission,
    withAllPermissions,
    withRole,
  };
}

/**
 * Hook for session timeout management
 */
export function useSessionTimeout() {
  const auth = useAuth();
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const updateTimeout = () => {
      const remaining = auth.getTimeUntilTimeout();
      setTimeRemaining(remaining);
      
      const warningThreshold = 5 * 60 * 1000; // 5 minutes
      setShowWarning(remaining > 0 && remaining <= warningThreshold);
    };

    updateTimeout();
    const interval = setInterval(updateTimeout, 1000); // Update every second

    return () => clearInterval(interval);
  }, [auth]);

  const extendSession = useCallback(() => {
    auth.extendSession();
    setShowWarning(false);
  }, [auth]);

  const formatTimeRemaining = useCallback((): string => {
    const minutes = Math.floor(timeRemaining / (60 * 1000));
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  return {
    showWarning,
    timeRemaining,
    formatTimeRemaining,
    extendSession,
    isExpiring: auth.isSessionExpiring,
  };
}

/**
 * Hook for security monitoring
 */
export function useSecurityMonitoring() {
  const auth = useAuth();
  const [securityAlerts, setSecurityAlerts] = useState<Array<{
    id: string;
    type: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    timestamp: string;
  }>>([]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    // Monitor for security events
    const checkSecurity = () => {
      const alerts = [];

      // Check for password expiration
      if (auth.passwordExpired) {
        alerts.push({
          id: "password-expired",
          type: "password_expired",
          message: "Your password has expired and must be changed",
          severity: "high" as const,
          timestamp: new Date().toISOString(),
        });
      }

      // Check if MFA is required but not set up
      if (auth.user?.mfaEnabled === false && auth.user?.role === UserRole.ADMIN) {
        alerts.push({
          id: "mfa-required",
          type: "mfa_required",
          message: "Multi-factor authentication is required for admin accounts",
          severity: "medium" as const,
          timestamp: new Date().toISOString(),
        });
      }

      // Check session expiration warning
      if (auth.isSessionExpiring) {
        alerts.push({
          id: "session-expiring",
          type: "session_expiring",
          message: "Your session is about to expire due to inactivity",
          severity: "medium" as const,
          timestamp: new Date().toISOString(),
        });
      }

      setSecurityAlerts(alerts);
    };

    checkSecurity();
    const interval = setInterval(checkSecurity, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [auth]);

  const dismissAlert = useCallback((alertId: string) => {
    setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  return {
    securityAlerts,
    dismissAlert,
    hasAlerts: securityAlerts.length > 0,
    criticalAlerts: securityAlerts.filter(alert => alert.severity === "critical"),
  };
}

/**
 * Hook for refreshing session data
 */
export function useSessionRefresh() {
  const { update } = useSession();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshSession = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await update();
    } catch (error) {
      console.error("Failed to refresh session:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [update]);

  return {
    refreshSession,
    isRefreshing,
  };
}