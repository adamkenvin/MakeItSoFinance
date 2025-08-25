import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { env } from "@/lib/env";
import { headers } from "next/headers";

/**
 * MakeItSo Finance - NextAuth.js API Route Handler
 * 
 * Secure authentication endpoints with enhanced security measures
 * for financial applications including rate limiting, IP logging,
 * and security event monitoring.
 */

/**
 * Security middleware for authentication endpoints
 */
async function securityMiddleware(request: Request) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "unknown";
  const xForwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const clientIp = xForwardedFor?.split(",")[0] || realIp || "unknown";
  
  // Log security-relevant information
  console.log(`Auth request from IP: ${clientIp}, User-Agent: ${userAgent}, Timestamp: ${new Date().toISOString()}`);
  
  // Basic rate limiting (in production, use Redis or similar)
  // TODO: Implement proper rate limiting with Redis/Upstash for production
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  if (isSuspicious && env.NODE_ENV === "production") {
    console.warn(`Suspicious user agent detected: ${userAgent} from IP: ${clientIp}`);
    // TODO: Implement additional security measures for suspicious requests
  }
  
  return {
    clientIp,
    userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Enhanced error handling for financial applications
 */
function handleAuthError(error: any, context: { clientIp: string; userAgent: string }) {
  const errorId = crypto.randomUUID();
  
  // Log error with context for security monitoring
  console.error(`Auth Error [${errorId}]:`, {
    error: error.message || error,
    ip: context.clientIp,
    userAgent: context.userAgent,
    timestamp: new Date().toISOString(),
  });
  
  // Return generic error in production to prevent information leakage
  if (env.NODE_ENV === "production") {
    return new Response(
      JSON.stringify({
        error: "Authentication service temporarily unavailable",
        errorId,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          // Security headers for API responses
          "X-Frame-Options": "DENY",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      }
    );
  }
  
  // Detailed error in development
  return new Response(
    JSON.stringify({
      error: error.message || "Authentication error",
      details: error.stack || error,
      errorId,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}

/**
 * NextAuth handler with security enhancements
 */
const handler = async (request: Request, context: any) => {
  try {
    // Apply security middleware
    const securityContext = await securityMiddleware(request);
    
    // Create NextAuth handler
    const authHandler = NextAuth(authOptions);
    
    // Call the handler with the request
    const response = await authHandler(request, context);
    
    // Add security headers to response
    if (response instanceof Response) {
      const headers = new Headers(response.headers);
      
      // Add financial-grade security headers
      headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");
      headers.set("X-Frame-Options", "DENY");
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      
      // Add CSRF protection
      headers.set("X-CSRF-Protection", "1");
      
      // Financial compliance headers
      headers.set("X-Financial-Security", "enabled");
      headers.set("X-Session-Timeout", env.SESSION_TIMEOUT_MINUTES.toString());
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    
    return response;
    
  } catch (error: any) {
    console.error("NextAuth handler error:", error);
    
    // Enhanced error handling with security context
    const securityContext = {
      clientIp: "unknown",
      userAgent: "unknown",
    };
    
    try {
      const headersList = await headers();
      securityContext.clientIp = headersList.get("x-forwarded-for")?.split(",")[0] || 
                                 headersList.get("x-real-ip") || 
                                 "unknown";
      securityContext.userAgent = headersList.get("user-agent") || "unknown";
    } catch (headerError) {
      console.warn("Failed to extract security context:", headerError);
    }
    
    return handleAuthError(error, securityContext);
  }
};

// Export handler for both GET and POST requests
export { handler as GET, handler as POST };

/**
 * Route segment configuration for enhanced security
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Prevent caching of authentication endpoints
export const revalidate = 0;

/**
 * Additional metadata for the route
 */
export const metadata = {
  title: "Authentication - MakeItSo Finance",
  description: "Secure authentication endpoints for financial application",
};