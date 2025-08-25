/**
 * MakeItSo Finance - Validation Types
 * 
 * TypeScript types generated from Zod validation schemas
 * for type-safe form handling and API validation.
 */

import { z } from "zod";

// Import all schemas
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  registrationSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  passwordChangeSchema,
  ssnSchema,
  taxIdSchema,
  addressSchema,
  fullNameSchema,
  userProfileSchema,
  userRoleSchema,
  mfaSetupSchema,
  mfaVerificationSchema,
  paginationSchema,
  searchFiltersSchema,
  apiResponseSchema,
  errorResponseSchema,
  contactFormSchema,
  feedbackFormSchema,
  uuidSchema,
  dateSchema,
  urlSchema,
  jsonSchema,
  fileUploadSchema,
} from "./schemas";

import {
  currencySchema,
  monetaryAmountSchema,
  moneySchema,
  transactionAmountSchema,
  accountNumberSchema,
  routingNumberSchema,
  ibanSchema,
  creditCardSchema,
  cardExpirationSchema,
  cvvSchema,
  transactionTypeSchema,
  transactionCategorySchema,
  transactionStatusSchema,
  transactionSchema,
  transferSchema,
  bulkTransactionSchema,
  accountTypeSchema,
  accountStatusSchema,
  createAccountSchema,
  paymentMethodTypeSchema,
  creditCardPaymentSchema,
  bankAccountPaymentSchema,
  dateRangeSchema,
  reportParametersSchema,
  suspiciousActivitySchema,
  riskAssessmentSchema,
} from "./financial";

import {
  sanitizedTextSchema,
  safeHtmlSchema,
  secureUrlSchema,
  dbIdentifierSchema,
  searchQuerySchema,
  safeFilenameSchema,
  safePathSchema,
  suspiciousInputSchema,
  fraudDetectionSchema,
  secureFileUploadSchema,
  csrfTokenSchema,
  sessionSecuritySchema,
  apiKeySchema,
  rateLimitSchema,
} from "./security";

// ==============================================
// CORE AUTHENTICATION TYPES
// ==============================================

export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type PhoneNumber = z.infer<typeof phoneSchema>;
export type RegistrationData = z.infer<typeof registrationSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;

// ==============================================
// PERSONAL INFORMATION TYPES
// ==============================================

export type SSN = z.infer<typeof ssnSchema>;
export type TaxID = z.infer<typeof taxIdSchema>;
export type Address = z.infer<typeof addressSchema>;
export type FullName = z.infer<typeof fullNameSchema>;

// ==============================================
// USER MANAGEMENT TYPES
// ==============================================

export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserRoleData = z.infer<typeof userRoleSchema>;
export type MFASetup = z.infer<typeof mfaSetupSchema>;
export type MFAVerification = z.infer<typeof mfaVerificationSchema>;

// ==============================================
// API TYPES
// ==============================================

export type Pagination = z.infer<typeof paginationSchema>;
export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Generic API response type
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
};

// ==============================================
// FORM TYPES
// ==============================================

export type ContactForm = z.infer<typeof contactFormSchema>;
export type FeedbackForm = z.infer<typeof feedbackFormSchema>;

// ==============================================
// UTILITY TYPES
// ==============================================

export type UUID = z.infer<typeof uuidSchema>;
export type DateString = z.infer<typeof dateSchema>;
export type URL = z.infer<typeof urlSchema>;
export type JSONString = z.infer<typeof jsonSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;

// ==============================================
// FINANCIAL TYPES
// ==============================================

export type Currency = z.infer<typeof currencySchema>;
export type MonetaryAmount = z.infer<typeof monetaryAmountSchema>;
export type Money = z.infer<typeof moneySchema>;
export type TransactionAmount = z.infer<typeof transactionAmountSchema>;

// Account types
export type AccountNumber = z.infer<typeof accountNumberSchema>;
export type RoutingNumber = z.infer<typeof routingNumberSchema>;
export type IBAN = z.infer<typeof ibanSchema>;
export type CreditCard = z.infer<typeof creditCardSchema>;
export type CardExpiration = z.infer<typeof cardExpirationSchema>;
export type CVV = z.infer<typeof cvvSchema>;

// Transaction types
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionCategory = z.infer<typeof transactionCategorySchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Transfer = z.infer<typeof transferSchema>;
export type BulkTransaction = z.infer<typeof bulkTransactionSchema>;

// Account management types
export type AccountType = z.infer<typeof accountTypeSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type CreateAccount = z.infer<typeof createAccountSchema>;

// Payment method types
export type PaymentMethodType = z.infer<typeof paymentMethodTypeSchema>;
export type CreditCardPayment = z.infer<typeof creditCardPaymentSchema>;
export type BankAccountPayment = z.infer<typeof bankAccountPaymentSchema>;

// Reporting types
export type DateRange = z.infer<typeof dateRangeSchema>;
export type ReportParameters = z.infer<typeof reportParametersSchema>;

// Fraud detection types
export type SuspiciousActivity = z.infer<typeof suspiciousActivitySchema>;
export type RiskAssessment = z.infer<typeof riskAssessmentSchema>;

// ==============================================
// SECURITY TYPES
// ==============================================

export type SanitizedText = z.infer<typeof sanitizedTextSchema>;
export type SafeHTML = z.infer<typeof safeHtmlSchema>;
export type SecureURL = z.infer<typeof secureUrlSchema>;
export type DBIdentifier = z.infer<typeof dbIdentifierSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SafeFilename = z.infer<typeof safeFilenameSchema>;
export type SafePath = z.infer<typeof safePathSchema>;
export type SuspiciousInput = z.infer<typeof suspiciousInputSchema>;
export type FraudDetection = z.infer<typeof fraudDetectionSchema>;
export type SecureFileUpload = z.infer<typeof secureFileUploadSchema>;
export type CSRFToken = z.infer<typeof csrfTokenSchema>;
export type SessionSecurity = z.infer<typeof sessionSecuritySchema>;
export type APIKey = z.infer<typeof apiKeySchema>;
export type RateLimit = z.infer<typeof rateLimitSchema>;

// ==============================================
// FORM VALIDATION RESULT TYPES
// ==============================================

/**
 * Generic validation result type
 */
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Field validation state
 */
export interface FieldValidation {
  isValid: boolean;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

/**
 * Form validation state
 */
export interface FormValidation<T = Record<string, any>> {
  isValid: boolean;
  isSubmitting: boolean;
  hasErrors: boolean;
  fields: Record<keyof T, FieldValidation>;
  errors: ValidationError[];
}

// ==============================================
// FINANCIAL FORM TYPES
// ==============================================

/**
 * Transaction form data
 */
export interface TransactionFormData {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: Currency;
  description: string;
  reference?: string;
  fromAccountId?: string;
  toAccountId?: string;
  scheduledDate?: string;
}

/**
 * Account creation form data
 */
export interface AccountFormData {
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: number;
  description?: string;
}

/**
 * Payment method form data
 */
export interface PaymentMethodFormData {
  type: PaymentMethodType;
  creditCard?: CreditCardPayment;
  bankAccount?: BankAccountPayment;
}

/**
 * Profile update form data
 */
export interface ProfileFormData {
  name: FullName;
  email: Email;
  phoneNumber?: PhoneNumber;
  address?: Address;
  timezone?: string;
  locale?: string;
}

// ==============================================
// API REQUEST/RESPONSE TYPES
// ==============================================

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Search request type
 */
export interface SearchRequest {
  query?: string;
  filters?: SearchFilters;
  pagination?: Pagination;
}

/**
 * Batch operation request
 */
export interface BatchRequest<T> {
  items: T[];
  batchId?: string;
  options?: {
    continueOnError?: boolean;
    validateAll?: boolean;
  };
}

/**
 * Batch operation response
 */
export interface BatchResponse<T> {
  success: boolean;
  processed: number;
  failed: number;
  results: Array<{
    index: number;
    success: boolean;
    data?: T;
    error?: string;
  }>;
  batchId?: string;
}

// ==============================================
// SECURITY EVENT TYPES
// ==============================================

/**
 * Security event type
 */
export interface SecurityEvent {
  id: string;
  type: string;
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
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

// ==============================================
// WEBHOOK TYPES
// ==============================================

/**
 * Webhook payload type
 */
export interface WebhookPayload<T = any> {
  id: string;
  event: string;
  timestamp: string;
  data: T;
  signature: string;
  version: string;
}

/**
 * Webhook subscription
 */
export interface WebhookSubscription {
  id: string;
  url: SecureURL;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==============================================
// EXPORT TYPE UTILITIES
// ==============================================

/**
 * Extract the input type from a Zod schema
 */
export type SchemaInput<T extends z.ZodTypeAny> = z.input<T>;

/**
 * Extract the output type from a Zod schema
 */
export type SchemaOutput<T extends z.ZodTypeAny> = z.output<T>;

/**
 * Make all properties of a type optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Create a type with only specific properties
 */
export type PickBy<T, K extends keyof T> = Pick<T, K>;

/**
 * Create a type without specific properties
 */
export type OmitBy<T, K extends keyof T> = Omit<T, K>;

// ==============================================
// FORM FIELD TYPES
// ==============================================

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "select" | "checkbox" | "radio" | "textarea" | "file";
  required?: boolean;
  placeholder?: string;
  description?: string;
  validation?: z.ZodTypeAny;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  readonly?: boolean;
}

/**
 * Dynamic form configuration
 */
export interface FormConfig<T = any> {
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  validation: z.ZodSchema<T>;
  submitLabel?: string;
  cancelLabel?: string;
}

// Export all types for convenient importing
export type {
  // Re-export common types with shorter names
  ValidationResult as ValidateResult,
  ValidationError as ValidateError,
  FormValidation as FormState,
  FieldValidation as FieldState,
};