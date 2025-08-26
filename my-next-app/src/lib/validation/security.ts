/**
 * Captain's Ledger - Security Validation Schemas
 * 
 * Security-focused validation schemas for XSS prevention, injection prevention,
 * input sanitization, and suspicious pattern detection.
 */

import { z } from "zod";

// ==============================================
// XSS PREVENTION SCHEMAS
// ==============================================

/**
 * Sanitized text input that prevents XSS attacks
 */
export const sanitizedTextSchema = z.string()
  .transform((text) => {
    // Remove potential XSS vectors
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .trim();
  })
  .refine(
    (text) => !/<[^>]*>/.test(text),
    "HTML tags are not allowed"
  )
  .refine(
    (text) => !/javascript:/i.test(text),
    "JavaScript protocols are not allowed"
  )
  .refine(
    (text) => !/on\w+\s*=/i.test(text),
    "Event handlers are not allowed"
  );

/**
 * Safe HTML content validation (for rich text editors)
 */
export const safeHtmlSchema = z.string()
  .refine(
    (html) => {
      // Allow only safe HTML tags
      const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      const tagRegex = /<\/?(\w+)[^>]*>/g;
      let match;
      
      while ((match = tagRegex.exec(html)) !== null) {
        const tagName = match[1].toLowerCase();
        if (!allowedTags.includes(tagName)) {
          return false;
        }
      }
      return true;
    },
    "Contains unsafe HTML tags"
  )
  .refine(
    (html) => !/javascript:/i.test(html),
    "JavaScript protocols are not allowed"
  )
  .refine(
    (html) => !/on\w+\s*=/i.test(html),
    "Event handlers are not allowed"
  )
  .refine(
    (html) => !/<script/i.test(html),
    "Script tags are not allowed"
  )
  .refine(
    (html) => !/<iframe/i.test(html),
    "Iframe tags are not allowed"
  );

/**
 * URL validation with security checks
 */
export const secureUrlSchema = z.string()
  .url("Invalid URL format")
  .refine(
    (url) => {
      const parsed = new URL(url);
      return ['http:', 'https:', 'ftp:', 'ftps:'].includes(parsed.protocol);
    },
    "Only HTTP, HTTPS, FTP, and FTPS protocols are allowed"
  )
  .refine(
    (url) => !url.includes('javascript:'),
    "JavaScript protocols are not allowed"
  )
  .refine(
    (url) => !url.includes('data:'),
    "Data URLs are not allowed"
  )
  .refine(
    (url) => {
      // Prevent localhost and private IP ranges in production
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      
      if (process.env.NODE_ENV === 'production') {
        const privateRanges = [
          'localhost',
          '127.0.0.1',
          '0.0.0.0',
          '::1',
        ];
        
        if (privateRanges.some(range => hostname.includes(range))) {
          return false;
        }
        
        // Check for private IP ranges
        if (/^10\./.test(hostname) || 
            /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) ||
            /^192\.168\./.test(hostname)) {
          return false;
        }
      }
      
      return true;
    },
    "Private URLs are not allowed in production"
  );

// ==============================================
// SQL INJECTION PREVENTION
// ==============================================

/**
 * Safe database identifier (table names, column names, etc.)
 */
export const dbIdentifierSchema = z.string()
  .min(1, "Identifier cannot be empty")
  .max(63, "Identifier too long") // PostgreSQL limit
  .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid identifier format")
  .refine(
    (identifier) => {
      // Prevent SQL keywords
      const sqlKeywords = [
        'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter',
        'truncate', 'grant', 'revoke', 'union', 'join', 'where', 'from',
        'into', 'values', 'set', 'order', 'group', 'having', 'limit',
        'offset', 'as', 'and', 'or', 'not', 'in', 'exists', 'like',
        'between', 'is', 'null', 'true', 'false', 'case', 'when', 'then',
        'else', 'end', 'if', 'while', 'for', 'do', 'begin', 'commit',
        'rollback', 'exec', 'execute', 'sp_', 'xp_'
      ];
      
      return !sqlKeywords.includes(identifier.toLowerCase());
    },
    "Identifier cannot be a SQL keyword"
  );

/**
 * Safe search query validation
 */
export const searchQuerySchema = z.string()
  .max(500, "Search query too long")
  .refine(
    (query) => {
      // Prevent SQL injection patterns
      const sqlPatterns = [
        /'\s*(or|and)\s*'?\d+/i,
        /union\s+select/i,
        /drop\s+table/i,
        /insert\s+into/i,
        /delete\s+from/i,
        /update\s+\w+\s+set/i,
        /exec\s*\(/i,
        /execute\s*\(/i,
        /sp_\w+/i,
        /xp_\w+/i,
        /--/,
        /\/\*/,
        /\*\//,
        /;\s*(drop|delete|insert|update|create|alter|truncate)/i
      ];
      
      return !sqlPatterns.some(pattern => pattern.test(query));
    },
    "Search query contains potentially malicious patterns"
  )
  .transform((query) => {
    // Sanitize the query
    return query
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;<>]/g, '') // Remove dangerous characters
      .trim();
  });

// ==============================================
// COMMAND INJECTION PREVENTION
// ==============================================

/**
 * Safe filename validation
 */
export const safeFilenameSchema = z.string()
  .min(1, "Filename cannot be empty")
  .max(255, "Filename too long")
  .regex(/^[a-zA-Z0-9._-]+$/, "Filename contains invalid characters")
  .refine(
    (filename) => !filename.startsWith('.'),
    "Filename cannot start with a dot"
  )
  .refine(
    (filename) => !filename.includes('..'),
    "Filename cannot contain parent directory references"
  )
  .refine(
    (filename) => {
      // Prevent dangerous extensions
      const dangerousExtensions = [
        '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs', '.js',
        '.jar', '.sh', '.ps1', '.php', '.asp', '.jsp', '.py', '.rb'
      ];
      
      return !dangerousExtensions.some(ext => 
        filename.toLowerCase().endsWith(ext)
      );
    },
    "File type not allowed"
  );

/**
 * Safe directory path validation
 */
export const safePathSchema = z.string()
  .min(1, "Path cannot be empty")
  .max(1024, "Path too long")
  .refine(
    (path) => !path.includes('..'),
    "Path cannot contain parent directory references"
  )
  .refine(
    (path) => !path.startsWith('/'),
    "Absolute paths are not allowed"
  )
  .refine(
    (path) => !/[<>"|*?]/.test(path),
    "Path contains invalid characters"
  )
  .refine(
    (path) => {
      // Prevent null bytes and control characters
      return !/[\x00-\x1f\x7f]/.test(path);
    },
    "Path contains control characters"
  );

// ==============================================
// INPUT RATE LIMITING SCHEMAS
// ==============================================

/**
 * Rate-limited input validation
 */
export const createRateLimitedSchema = <T extends z.ZodTypeAny>(
  baseSchema: T,
  options: {
    maxLength?: number;
    maxComplexity?: number;
    requiresAuth?: boolean;
  } = {}
) => {
  return baseSchema
    .refine(
      (value) => {
        if (options.maxLength && typeof value === 'string') {
          return value.length <= options.maxLength;
        }
        return true;
      },
      `Input exceeds maximum length of ${options.maxLength}`
    )
    .refine(
      (value) => {
        if (options.maxComplexity && typeof value === 'string') {
          // Calculate complexity based on unique characters and patterns
          const uniqueChars = new Set(value).size;
          const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(value);
          const complexity = uniqueChars + (hasSpecialChars ? 10 : 0);
          return complexity <= options.maxComplexity;
        }
        return true;
      },
      `Input complexity exceeds maximum allowed`
    );
};

// ==============================================
// SUSPICIOUS PATTERN DETECTION
// ==============================================

/**
 * Detect suspicious user input patterns
 */
export const suspiciousInputSchema = z.string()
  .refine(
    (input) => {
      // Detect potential bot inputs
      const botPatterns = [
        /^(.)\1{10,}$/, // Repeated characters
        /test{5,}/i, // Multiple "test" strings
        /admin{2,}/i, // Multiple "admin" strings
        /password{2,}/i, // Multiple "password" strings
        /[a-z]{50,}/, // Very long lowercase strings
        /[A-Z]{20,}/, // Very long uppercase strings
        /\d{20,}/, // Very long number strings
      ];
      
      return !botPatterns.some(pattern => pattern.test(input));
    },
    "Input appears to be automated or suspicious"
  )
  .refine(
    (input) => {
      // Detect potential enumeration attempts
      const enumerationPatterns = [
        /^(admin|root|test|user|guest)\d*$/i,
        /^\d+$/, // Pure numbers might be ID enumeration
        /^[a-f0-9]{32}$/, // MD5 hash-like
        /^[a-f0-9]{40}$/, // SHA1 hash-like
      ];
      
      return !enumerationPatterns.some(pattern => pattern.test(input));
    },
    "Input appears to be an enumeration attempt"
  );

/**
 * Financial fraud detection patterns
 */
export const fraudDetectionSchema = z.string()
  .refine(
    (input) => {
      // Detect potential social engineering keywords
      const socialEngineeringPatterns = [
        /urgent.*action.*required/i,
        /verify.*account.*immediately/i,
        /suspended.*account/i,
        /click.*here.*now/i,
        /limited.*time.*offer/i,
        /congratulations.*winner/i,
        /tax.*refund.*pending/i,
        /security.*alert/i,
      ];
      
      return !socialEngineeringPatterns.some(pattern => pattern.test(input));
    },
    "Input contains potential social engineering patterns"
  )
  .refine(
    (input) => {
      // Detect potential phishing indicators
      const phishingPatterns = [
        /paypal|amazon|apple|microsoft/i, // Brand impersonation
        /bitcoin|crypto|investment.*opportunity/i,
        /prince|lottery|inheritance/i,
        /irs|tax.*authority/i,
      ];
      
      return !phishingPatterns.some(pattern => pattern.test(input));
    },
    "Input contains potential phishing indicators"
  );

// ==============================================
// FILE UPLOAD SECURITY
// ==============================================

/**
 * Secure file upload validation
 */
export const secureFileUploadSchema = z.object({
  filename: safeFilenameSchema,
  size: z.number()
    .int()
    .min(1, "File cannot be empty")
    .max(10 * 1024 * 1024, "File size exceeds 10MB limit"),
  mimeType: z.string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^.]*$/, "Invalid MIME type")
    .refine(
      (mimeType) => {
        // Allow only safe file types
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        
        return allowedTypes.includes(mimeType);
      },
      "File type not allowed"
    ),
  content: z.string()
    .base64("Invalid file encoding")
    .refine(
      (content) => {
        // Basic malware signature detection
        const decodedContent = Buffer.from(content, 'base64').toString('binary');
        
        // Check for executable signatures
        const malwareSignatures = [
          'MZ', // PE executable
          '\x7fELF', // ELF executable
          'PK\x03\x04', // ZIP (potentially dangerous)
          'Rar!', // RAR archive
        ];
        
        return !malwareSignatures.some(sig => decodedContent.startsWith(sig));
      },
      "File appears to contain executable content"
    ),
});

// ==============================================
// CSRF PROTECTION SCHEMAS
// ==============================================

/**
 * CSRF token validation
 */
export const csrfTokenSchema = z.string()
  .length(32, "Invalid CSRF token length")
  .regex(/^[a-zA-Z0-9]+$/, "Invalid CSRF token format");

/**
 * Request with CSRF protection
 */
export const csrfProtectedRequestSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    csrfToken: csrfTokenSchema,
    timestamp: z.number()
      .int()
      .refine(
        (timestamp) => {
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;
          return timestamp > now - fiveMinutes && timestamp < now + fiveMinutes;
        },
        "Request timestamp is invalid or expired"
      ),
  });

// ==============================================
// SESSION SECURITY
// ==============================================

/**
 * Secure session validation
 */
export const sessionSecuritySchema = z.object({
  sessionId: z.string()
    .uuid("Invalid session ID format"),
  userAgent: z.string()
    .max(500, "User agent too long")
    .refine(
      (userAgent) => {
        // Detect suspicious user agents
        const suspiciousPatterns = [
          /bot|crawler|spider/i,
          /curl|wget|python|java/i,
          /script|automation/i,
        ];
        
        return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
      },
      "Suspicious user agent detected"
    ),
  ipAddress: z.string()
    .ip("Invalid IP address")
    .refine(
      (ip) => {
        // Block known malicious IP ranges (simplified example)
        const blockedRanges = [
          '0.0.0.0',
          '127.0.0.1', // Only in production
        ];
        
        if (process.env.NODE_ENV === 'production') {
          return !blockedRanges.includes(ip);
        }
        return true;
      },
      "IP address is blocked"
    ),
  lastActivity: z.number()
    .int()
    .refine(
      (timestamp) => {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        return timestamp > now - oneHour;
      },
      "Session has expired due to inactivity"
    ),
});

// ==============================================
// API SECURITY SCHEMAS
// ==============================================

/**
 * API key validation
 */
export const apiKeySchema = z.string()
  .min(32, "API key too short")
  .max(128, "API key too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid API key format")
  .refine(
    (key) => !key.startsWith('test_'),
    "Test API keys not allowed in production"
  );

/**
 * Rate limit headers validation
 */
export const rateLimitSchema = z.object({
  requestsPerMinute: z.number().int().min(1).max(1000),
  burstSize: z.number().int().min(1).max(100),
  windowSize: z.number().int().min(60).max(3600), // 1 minute to 1 hour
});

// Export all security validation schemas
export {
  // XSS Prevention
  sanitizedTextSchema,
  safeHtmlSchema,
  secureUrlSchema,
  
  // SQL Injection Prevention
  dbIdentifierSchema,
  searchQuerySchema,
  
  // Command Injection Prevention
  safeFilenameSchema,
  safePathSchema,
  
  // Rate Limiting
  createRateLimitedSchema,
  
  // Suspicious Pattern Detection
  suspiciousInputSchema,
  fraudDetectionSchema,
  
  // File Upload Security
  secureFileUploadSchema,
  
  // CSRF Protection
  csrfTokenSchema,
  csrfProtectedRequestSchema,
  
  // Session Security
  sessionSecuritySchema,
  
  // API Security
  apiKeySchema,
  rateLimitSchema,
};