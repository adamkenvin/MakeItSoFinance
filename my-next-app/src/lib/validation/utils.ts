/**
 * MakeItSo Finance - Validation Utilities
 * 
 * Utility functions for validation, sanitization, error handling,
 * and security-focused input processing.
 */

import { z } from "zod";
import { ValidationResult, ValidationError, FormValidation, FieldValidation } from "./types";

// ==============================================
// VALIDATION UTILITIES
// ==============================================

/**
 * Validate data against a Zod schema and return a standardized result
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: formatZodErrors(error),
      };
    }
    
    return {
      success: false,
      errors: [{ field: "unknown", message: "Validation failed" }],
    };
  }
}

/**
 * Safely validate data without throwing errors
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result;
}

/**
 * Validate and transform data in one step
 */
export function validateAndTransform<T, U>(
  schema: z.ZodSchema<T>,
  data: unknown,
  transformer: (data: T) => U
): ValidationResult<U> {
  const validation = validateData(schema, data);
  
  if (!validation.success || !validation.data) {
    return validation as ValidationResult<U>;
  }
  
  try {
    const transformed = transformer(validation.data);
    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ field: "transform", message: "Data transformation failed" }],
    };
  }
}

/**
 * Format Zod errors into a standardized format
 */
export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map(err => ({
    field: err.path.join('.') || 'root',
    message: err.message,
    code: err.code,
  }));
}

/**
 * Create a validation result from an error
 */
export function createValidationError(
  field: string,
  message: string,
  code?: string
): ValidationResult {
  return {
    success: false,
    errors: [{ field, message, code }],
  };
}

// ==============================================
// FORM VALIDATION UTILITIES
// ==============================================

/**
 * Create initial form validation state
 */
export function createFormValidation<T extends Record<string, any>>(
  fields: Array<keyof T>
): FormValidation<T> {
  const fieldValidations = {} as Record<keyof T, FieldValidation>;
  
  fields.forEach(field => {
    fieldValidations[field] = {
      isValid: true,
      touched: false,
      dirty: false,
    };
  });
  
  return {
    isValid: true,
    isSubmitting: false,
    hasErrors: false,
    fields: fieldValidations,
    errors: [],
  };
}

/**
 * Update field validation state
 */
export function updateFieldValidation<T extends Record<string, any>>(
  formValidation: FormValidation<T>,
  field: keyof T,
  updates: Partial<FieldValidation>
): FormValidation<T> {
  const newFieldValidation = {
    ...formValidation.fields[field],
    ...updates,
  };
  
  const newFields = {
    ...formValidation.fields,
    [field]: newFieldValidation,
  };
  
  const isValid = Object.values(newFields).every(f => f.isValid);
  const hasErrors = Object.values(newFields).some(f => !f.isValid && f.touched);
  
  return {
    ...formValidation,
    fields: newFields,
    isValid,
    hasErrors,
  };
}

/**
 * Validate a single field
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
  fieldName: string
): FieldValidation {
  const result = safeValidate(schema, value);
  
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message,
    touched: true,
    dirty: true,
  };
}

/**
 * Validate entire form
 */
export function validateForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  data: T,
  formValidation: FormValidation<T>
): FormValidation<T> {
  const result = safeValidate(schema, data);
  
  if (result.success) {
    return {
      ...formValidation,
      isValid: true,
      hasErrors: false,
      errors: [],
    };
  }
  
  const errors = formatZodErrors(result.error);
  const newFields = { ...formValidation.fields };
  
  // Reset all fields to valid first
  Object.keys(newFields).forEach(field => {
    newFields[field as keyof T] = {
      ...newFields[field as keyof T],
      isValid: true,
      error: undefined,
    };
  });
  
  // Apply errors to specific fields
  errors.forEach(error => {
    const field = error.field as keyof T;
    if (newFields[field]) {
      newFields[field] = {
        ...newFields[field],
        isValid: false,
        error: error.message,
        touched: true,
      };
    }
  });
  
  return {
    ...formValidation,
    fields: newFields,
    isValid: false,
    hasErrors: true,
    errors,
  };
}

// ==============================================
// SANITIZATION UTILITIES
// ==============================================

/**
 * Sanitize text input to prevent XSS
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Sanitize HTML content (allow safe tags only)
 */
export function sanitizeHtml(input: string): string {
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const tagRegex = /<\/?(\w+)[^>]*>/g;
  
  return input.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Remove any event handlers from allowed tags
      return match.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    }
    return '';
  });
}

/**
 * Sanitize filename for safe file operations
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .substring(0, 255);
}

/**
 * Sanitize SQL-like input to prevent injection
 */
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/['"]/g, '')
    .replace(/[;<>]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

/**
 * Remove or encode dangerous characters
 */
export function encodeDangerousChars(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ==============================================
// FINANCIAL VALIDATION UTILITIES
// ==============================================

/**
 * Validate and format monetary amount
 */
export function validateMonetaryAmount(amount: number): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  if (!Number.isFinite(amount)) {
    return { isValid: false, formatted: '0.00', error: 'Invalid amount' };
  }
  
  if (amount < 0) {
    return { isValid: false, formatted: '0.00', error: 'Amount cannot be negative' };
  }
  
  if (amount > 999999999.99) {
    return { isValid: false, formatted: '0.00', error: 'Amount exceeds maximum limit' };
  }
  
  const formatted = amount.toFixed(2);
  return { isValid: true, formatted };
}

/**
 * Validate credit card number using Luhn algorithm
 */
export function validateCreditCard(cardNumber: string): {
  isValid: boolean;
  cardType?: string;
  error?: string;
} {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Card number must contain only digits' };
  }
  
  // Luhn algorithm
  let sum = 0;
  let alternate = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let n = parseInt(cleaned.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n = (n % 10) + 1;
    }
    sum += n;
    alternate = !alternate;
  }
  
  if (sum % 10 !== 0) {
    return { isValid: false, error: 'Invalid card number' };
  }
  
  // Determine card type
  let cardType = 'Unknown';
  const firstDigit = cleaned.charAt(0);
  const firstTwoDigits = cleaned.slice(0, 2);
  
  if (firstDigit === '4') cardType = 'Visa';
  else if (firstTwoDigits >= '51' && firstTwoDigits <= '55') cardType = 'Mastercard';
  else if (firstTwoDigits === '34' || firstTwoDigits === '37') cardType = 'American Express';
  else if (firstDigit === '6') cardType = 'Discover';
  
  return { isValid: true, cardType };
}

/**
 * Validate bank routing number
 */
export function validateRoutingNumber(routingNumber: string): {
  isValid: boolean;
  error?: string;
} {
  if (!/^\d{9}$/.test(routingNumber)) {
    return { isValid: false, error: 'Routing number must be 9 digits' };
  }
  
  // ABA checksum validation
  const digits = routingNumber.split('').map(Number);
  const checksum = (
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    1 * (digits[2] + digits[5] + digits[8])
  ) % 10;
  
  if (checksum !== 0) {
    return { isValid: false, error: 'Invalid routing number checksum' };
  }
  
  return { isValid: true };
}

// ==============================================
// SECURITY UTILITIES
// ==============================================

/**
 * Detect potentially malicious input patterns
 */
export function detectMaliciousInput(input: string): {
  isSuspicious: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // SQL injection patterns
  if (/('|(\\')|(;)|(\\;)|(\\x27)|(\\x3B)|(\||\\|\||`|\\`)/i.test(input)) {
    reasons.push('SQL injection patterns detected');
    severity = 'high';
  }
  
  // XSS patterns
  if (/<script|javascript:|on\w+\s*=/i.test(input)) {
    reasons.push('XSS patterns detected');
    severity = 'critical';
  }
  
  // Command injection patterns
  if (/(\||&|;|\$\(|\$\{|`|\\x00)/i.test(input)) {
    reasons.push('Command injection patterns detected');
    severity = 'high';
  }
  
  // Excessive length
  if (input.length > 10000) {
    reasons.push('Input exceeds maximum length');
    severity = severity === 'low' ? 'medium' : severity;
  }
  
  // Repeated characters (potential DoS)
  if (/(.)\1{100,}/.test(input)) {
    reasons.push('Excessive repeated characters');
    severity = severity === 'low' ? 'medium' : severity;
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons,
    severity,
  };
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Hash sensitive data (for logging/debugging)
 */
export function hashSensitiveData(data: string): string {
  // Simple hash for non-cryptographic purposes
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(
  data: string,
  type: 'email' | 'phone' | 'card' | 'ssn' | 'account'
): string {
  switch (type) {
    case 'email':
      const [user, domain] = data.split('@');
      return `${user.substring(0, 2)}***@${domain}`;
    
    case 'phone':
      return data.replace(/(\d{3})\d{3}(\d{4})/, '$1-***-$2');
    
    case 'card':
      return data.replace(/\d(?=\d{4})/g, '*');
    
    case 'ssn':
      return data.replace(/(\d{3})\d{2}(\d{4})/, '$1-**-$2');
    
    case 'account':
      return data.length > 4 
        ? '*'.repeat(data.length - 4) + data.slice(-4)
        : '****';
    
    default:
      return data.replace(/./g, '*');
  }
}

// ==============================================
// RATE LIMITING UTILITIES
// ==============================================

/**
 * Simple in-memory rate limiter
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxRequests: number = 100
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }
    
    const keyRequests = this.requests.get(key)!;
    
    // Remove old requests outside the window
    const validRequests = keyRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
  
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      return this.maxRequests;
    }
    
    const keyRequests = this.requests.get(key)!;
    const validRequests = keyRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
  
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Create default rate limiter instance
export const defaultRateLimiter = new RateLimiter();

// ==============================================
// UTILITY EXPORTS
// ==============================================

export {
  RateLimiter,
};

// Export commonly used validation patterns
export const commonPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  creditCard: /^[0-9]{13,19}$/,
  routingNumber: /^[0-9]{9}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  ssn: /^\d{3}-?\d{2}-?\d{4}$/,
};