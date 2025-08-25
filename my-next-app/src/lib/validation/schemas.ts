/**
 * MakeItSo Finance - Core Validation Schemas
 * 
 * Comprehensive Zod validation schemas for financial application
 * with security-focused input validation and fraud prevention.
 */

import { z } from "zod";
import { UserRole, Permission, AccountStatus, MFAMethod, SecurityLevel } from "@/lib/auth/types";

// ==============================================
// CORE AUTHENTICATION SCHEMAS
// ==============================================

/**
 * Email validation with financial industry standards
 */
export const emailSchema = z.string()
  .email("Invalid email format")
  .min(3, "Email must be at least 3 characters")
  .max(254, "Email must not exceed 254 characters")
  .toLowerCase()
  .refine(
    (email) => !email.includes(".."), 
    "Email cannot contain consecutive dots"
  )
  .refine(
    (email) => !email.startsWith(".") && !email.endsWith("."),
    "Email cannot start or end with a dot"
  )
  .refine(
    (email) => !/[+].*[+]/.test(email),
    "Email cannot contain multiple plus signs"
  );

/**
 * Password validation with financial security standards
 */
export const passwordSchema = z.string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    "Password cannot contain more than 2 consecutive identical characters"
  )
  .refine(
    (password) => !/^(.+)\1+$/.test(password),
    "Password cannot be a repeated pattern"
  )
  .refine(
    (password) => {
      const common = ["password", "123456", "qwerty", "admin", "finance", "makeitso"];
      return !common.some(word => password.toLowerCase().includes(word));
    },
    "Password cannot contain common words"
  );

/**
 * Phone number validation with international support
 */
export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .min(10, "Phone number must be at least 10 digits")
  .max(17, "Phone number must not exceed 17 characters");

/**
 * User registration schema
 */
export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),
  phoneNumber: phoneSchema.optional(),
  department: z.string().max(100).optional(),
  employeeId: z.string().max(50).optional(),
  acceptTerms: z.boolean().refine(val => val === true, "Terms must be accepted"),
  acceptPrivacy: z.boolean().refine(val => val === true, "Privacy policy must be accepted"),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

/**
 * Login credentials schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
  mfaCode: z.string().optional(),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

/**
 * Password change schema
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: "New password must be different from current password",
    path: ["newPassword"],
  }
);

// ==============================================
// PERSONAL INFORMATION SCHEMAS
// ==============================================

/**
 * Social Security Number validation (US format)
 */
export const ssnSchema = z.string()
  .regex(/^\d{3}-?\d{2}-?\d{4}$/, "Invalid SSN format")
  .transform((ssn) => ssn.replace(/-/g, ""))
  .refine(
    (ssn) => !["000000000", "111111111", "222222222", "333333333", 
               "444444444", "555555555", "666666666", "777777777", 
               "888888888", "999999999"].includes(ssn),
    "Invalid SSN pattern"
  )
  .refine(
    (ssn) => ssn.substring(0, 3) !== "000" && 
             ssn.substring(0, 3) !== "666" && 
             parseInt(ssn.substring(0, 3)) < 900,
    "Invalid SSN area number"
  )
  .refine(
    (ssn) => ssn.substring(3, 5) !== "00",
    "Invalid SSN group number"
  )
  .refine(
    (ssn) => ssn.substring(5, 9) !== "0000",
    "Invalid SSN serial number"
  );

/**
 * Tax ID validation (EIN format)
 */
export const taxIdSchema = z.string()
  .regex(/^\d{2}-?\d{7}$/, "Invalid Tax ID format")
  .transform((taxId) => taxId.replace(/-/g, ""));

/**
 * Address validation schema
 */
export const addressSchema = z.object({
  street1: z.string()
    .min(1, "Street address is required")
    .max(100, "Street address too long")
    .regex(/^[a-zA-Z0-9\s\-#.,]+$/, "Invalid street address format"),
  street2: z.string()
    .max(100, "Address line 2 too long")
    .regex(/^[a-zA-Z0-9\s\-#.,]*$/, "Invalid address format")
    .optional(),
  city: z.string()
    .min(1, "City is required")
    .max(50, "City name too long")
    .regex(/^[a-zA-Z\s\-']+$/, "Invalid city name format"),
  state: z.string()
    .length(2, "State must be 2 characters")
    .regex(/^[A-Z]{2}$/, "Invalid state format"),
  zipCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),
  country: z.string()
    .length(2, "Country must be 2-letter ISO code")
    .regex(/^[A-Z]{2}$/, "Invalid country format")
    .default("US"),
});

/**
 * Full name validation schema
 */
export const fullNameSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Invalid first name format"),
  middleName: z.string()
    .max(50, "Middle name too long")
    .regex(/^[a-zA-Z\s'-]*$/, "Invalid middle name format")
    .optional(),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Invalid last name format"),
  suffix: z.string()
    .max(10, "Suffix too long")
    .regex(/^[a-zA-Z.]*$/, "Invalid suffix format")
    .optional(),
});

// ==============================================
// USER MANAGEMENT SCHEMAS
// ==============================================

/**
 * User profile update schema
 */
export const userProfileSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  phoneNumber: phoneSchema.optional(),
  address: addressSchema.optional(),
  department: z.string().max(100).optional(),
  employeeId: z.string().max(50).optional(),
  timezone: z.string().max(50).optional(),
  locale: z.string().max(10).optional(),
  avatar: z.string().url().optional(),
});

/**
 * User role and permissions schema
 */
export const userRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.nativeEnum(Permission)),
  accountStatus: z.nativeEnum(AccountStatus),
  securityLevel: z.nativeEnum(SecurityLevel),
});

/**
 * MFA setup schema
 */
export const mfaSetupSchema = z.object({
  method: z.nativeEnum(MFAMethod),
  phoneNumber: z.string().optional(),
  backupCodes: z.array(z.string()).optional(),
});

/**
 * MFA verification schema
 */
export const mfaVerificationSchema = z.object({
  code: z.string()
    .length(6, "MFA code must be 6 digits")
    .regex(/^\d{6}$/, "MFA code must contain only numbers"),
  backupCode: z.string().optional(),
});

// ==============================================
// API REQUEST/RESPONSE SCHEMAS
// ==============================================

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Search filters schema
 */
export const searchFiltersSchema = z.object({
  query: z.string().max(500).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  userId: z.string().uuid().optional(),
});

/**
 * API response schema
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }).optional(),
    timestamp: z.string().datetime().default(() => new Date().toISOString()),
  });

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});

// ==============================================
// FORM VALIDATION SCHEMAS
// ==============================================

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Invalid name format"),
  email: emailSchema,
  subject: z.string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message too long"),
  category: z.enum(["general", "support", "billing", "technical", "compliance"]),
});

/**
 * Feedback form schema
 */
export const feedbackFormSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title too long"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description too long"),
  category: z.enum(["feature", "bug", "improvement", "performance", "security"]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

// ==============================================
// UTILITY SCHEMAS
// ==============================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Date validation schema
 */
export const dateSchema = z.string().datetime("Invalid date format");

/**
 * URL validation schema
 */
export const urlSchema = z.string().url("Invalid URL format");

/**
 * JSON schema validation
 */
export const jsonSchema = z.string().refine(
  (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },
  "Invalid JSON format"
);

/**
 * File upload schema
 */
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, "Filename is required")
    .max(255, "Filename too long")
    .regex(/^[a-zA-Z0-9._-]+$/, "Invalid filename format"),
  size: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
  type: z.string()
    .regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9.-]+$/, "Invalid MIME type"),
  content: z.string().base64("Invalid file content encoding"),
});

// Export all schemas for use throughout the application
export {
  // Authentication
  emailSchema,
  passwordSchema,
  phoneSchema,
  registrationSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  passwordChangeSchema,
  
  // Personal Information
  ssnSchema,
  taxIdSchema,
  addressSchema,
  fullNameSchema,
  
  // User Management
  userProfileSchema,
  userRoleSchema,
  mfaSetupSchema,
  mfaVerificationSchema,
  
  // API
  paginationSchema,
  searchFiltersSchema,
  apiResponseSchema,
  errorResponseSchema,
  
  // Forms
  contactFormSchema,
  feedbackFormSchema,
  
  // Utilities
  uuidSchema,
  dateSchema,
  urlSchema,
  jsonSchema,
  fileUploadSchema,
};