"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";
import { Session } from "next-auth";
import { env } from "@/lib/env";

/**
 * MakeItSo Finance - Enhanced Session Provider
 * 
 * Wraps NextAuth SessionProvider with additional security features
 * including session timeout handling, activity monitoring, and
 * financial-grade security enhancements.
 */

interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

/**
 * Session configuration for financial applications
 */
const SESSION_CONFIG = {
  // Refetch session on window focus for security
  refetchOnWindowFocus: true,
  
  // Refetch interval in seconds (every 5 minutes for financial apps)
  refetchInterval: 5 * 60,
  
  // Refetch when user comes back online
  refetchWhenOffline: false,
  
  // Base URL for API calls
  basePath: "/api/auth",
  
  // Custom storage for session (localStorage in this case)
  storage: {
    getItem: (key: string) => {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(key);
      }
      return null;
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    },
    removeItem: (key: string) => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    },
  },
} as const;

/**
 * Enhanced Session Provider with financial security features
 */
export function SessionProvider({ children, session }: SessionProviderProps) {
  const [isClient, setIsClient] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Activity monitoring for session security
  useEffect(() => {
    if (!isClient) return;

    const updateLastActivity = () => {
      setLastActivity(Date.now());
    };

    // Track user activity events
    const events = [
      "mousedown",
      "mousemove", 
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Add event listeners for activity tracking
    events.forEach(event => {
      document.addEventListener(event, updateLastActivity, { passive: true });
    });

    // Session timeout monitoring
    const timeoutCheck = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      const maxInactiveTime = env.SESSION_TIMEOUT_MINUTES * 60 * 1000; // Convert to milliseconds

      if (inactiveTime > maxInactiveTime) {
        // Session timeout - redirect to login
        console.warn("Session timeout due to inactivity");
        
        // Clear any sensitive data from localStorage
        if (typeof window !== "undefined") {
          const sensitiveKeys = [
            "financial-data",
            "user-preferences", 
            "cached-transactions",
          ];
          
          sensitiveKeys.forEach(key => {
            window.localStorage.removeItem(key);
          });
        }
        
        // Force sign out and redirect
        window.location.href = "/api/auth/signout?callbackUrl=/auth/signin?expired=true";
      }
    }, 60000); // Check every minute

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateLastActivity);
      });
      clearInterval(timeoutCheck);
    };
  }, [isClient, lastActivity]);

  // Page visibility change handler for security
  useEffect(() => {
    if (!isClient) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden - log for security monitoring
        console.log("Page hidden at:", new Date().toISOString());
      } else {
        // Page became visible - update activity and validate session
        setLastActivity(Date.now());
        console.log("Page visible at:", new Date().toISOString());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isClient]);

  // Security event handlers
  useEffect(() => {
    if (!isClient) return;

    // Handle session storage events (detect concurrent sessions)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes("next-auth")) {
        console.log("NextAuth storage change detected:", event.key, event.newValue);
        
        // If session was cleared in another tab, refresh this page
        if (event.newValue === null && event.oldValue !== null) {
          console.warn("Session cleared in another tab - refreshing page");
          window.location.reload();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isClient]);

  // Network status monitoring for offline handling
  useEffect(() => {
    if (!isClient) return;

    const handleOnline = () => {
      console.log("Network connection restored");
      // Validate session when coming back online
      setLastActivity(Date.now());
    };

    const handleOffline = () => {
      console.warn("Network connection lost");
      // Could implement offline mode features here
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isClient]);

  // Security warning for development
  useEffect(() => {
    if (env.NODE_ENV === "development" && isClient) {
      console.log("🔒 MakeItSo Finance - Security Enhanced Session Provider Loaded");
      console.log("📊 Session timeout:", env.SESSION_TIMEOUT_MINUTES, "minutes");
      console.log("🛡️ Security features: Activity monitoring, timeout handling, storage monitoring");
    }
  }, [isClient]);

  // Don't render until we're on the client side to avoid hydration issues
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={SESSION_CONFIG.refetchInterval}
      refetchOnWindowFocus={SESSION_CONFIG.refetchOnWindowFocus}
      refetchWhenOffline={SESSION_CONFIG.refetchWhenOffline}
      basePath={SESSION_CONFIG.basePath}
    >
      <SessionSecurityWrapper lastActivity={lastActivity}>
        {children}
      </SessionSecurityWrapper>
    </NextAuthSessionProvider>
  );
}

/**
 * Security wrapper component for additional session monitoring
 */
interface SessionSecurityWrapperProps {
  children: ReactNode;
  lastActivity: number;
}

function SessionSecurityWrapper({ children, lastActivity }: SessionSecurityWrapperProps) {
  const [warningShown, setWarningShown] = useState(false);

  useEffect(() => {
    const checkSessionWarning = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      const warningTime = (env.SESSION_TIMEOUT_MINUTES - 5) * 60 * 1000; // 5 minutes before timeout
      const maxInactiveTime = env.SESSION_TIMEOUT_MINUTES * 60 * 1000;

      if (inactiveTime > warningTime && inactiveTime < maxInactiveTime && !warningShown) {
        // Show timeout warning
        const remainingMinutes = Math.ceil((maxInactiveTime - inactiveTime) / (60 * 1000));
        
        if (window.confirm(
          `Your session will expire in ${remainingMinutes} minute(s) due to inactivity. ` +
          "Click OK to extend your session or Cancel to sign out."
        )) {
          // User wants to extend session - simulate activity
          const event = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          document.dispatchEvent(event);
          setWarningShown(false);
        } else {
          // User chose to sign out
          window.location.href = "/api/auth/signout";
        }
        
        setWarningShown(true);
      }

      if (inactiveTime < warningTime) {
        setWarningShown(false);
      }
    };

    const warningInterval = setInterval(checkSessionWarning, 30000); // Check every 30 seconds

    return () => {
      clearInterval(warningInterval);
    };
  }, [lastActivity, warningShown]);

  return <>{children}</>;
}

/**
 * Hook for accessing session security information
 */
export function useSessionSecurity() {
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Activity tracking
    const events = ["mousedown", "keypress", "click"];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Network status
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getTimeUntilTimeout = () => {
    const now = Date.now();
    const inactiveTime = now - lastActivity;
    const maxInactiveTime = env.SESSION_TIMEOUT_MINUTES * 60 * 1000;
    const remainingTime = maxInactiveTime - inactiveTime;
    
    return Math.max(0, remainingTime);
  };

  const isSessionExpiring = () => {
    const timeUntilTimeout = getTimeUntilTimeout();
    const warningThreshold = 5 * 60 * 1000; // 5 minutes
    
    return timeUntilTimeout > 0 && timeUntilTimeout <= warningThreshold;
  };

  return {
    lastActivity,
    isOnline,
    getTimeUntilTimeout,
    isSessionExpiring,
    extendSession: () => setLastActivity(Date.now()),
  };
}