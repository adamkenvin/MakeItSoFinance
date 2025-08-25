/**
 * MakeItSo Finance - Validation Library Index
 * 
 * Centralized exports for the complete validation system
 * including schemas, types, and utilities.
 */

// ==============================================
// CORE SCHEMAS
// ==============================================

export {
  // Authentication schemas
  emailSchema,
  passwordSchema,
  phoneSchema,
  registrationSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  passwordChangeSchema,
  
  // Personal information schemas
  ssnSchema,
  taxIdSchema,
  addressSchema,
  fullNameSchema,
  
  // User management schemas
  userProfileSchema,
  userRoleSchema,
  mfaSetupSchema,
  mfaVerificationSchema,
  
  // API schemas
  paginationSchema,
  searchFiltersSchema,
  apiResponseSchema,
  errorResponseSchema,
  
  // Form schemas
  contactFormSchema,
  feedbackFormSchema,
  
  // Utility schemas
  uuidSchema,
  dateSchema,
  urlSchema,
  jsonSchema,
  fileUploadSchema,
} from "./schemas";

// ==============================================
// FINANCIAL SCHEMAS
// ==============================================

export {
  // Currency and amounts
  currencySchema,
  monetaryAmountSchema,
  moneySchema,
  transactionAmountSchema,
  
  // Account validation
  accountNumberSchema,
  routingNumberSchema,
  ibanSchema,
  creditCardSchema,
  cardExpirationSchema,
  cvvSchema,
  
  // Transaction schemas
  transactionTypeSchema,
  transactionCategorySchema,
  transactionStatusSchema,
  transactionSchema,
  transferSchema,
  bulkTransactionSchema,
  
  // Account management
  accountTypeSchema,
  accountStatusSchema,
  createAccountSchema,
  
  // Payment methods
  paymentMethodTypeSchema,
  creditCardPaymentSchema,
  bankAccountPaymentSchema,
  
  // Reporting
  dateRangeSchema,
  reportParametersSchema,
  
  // Fraud detection
  suspiciousActivitySchema,
  riskAssessmentSchema,
} from "./financial";

// ==============================================
// SECURITY SCHEMAS
// ==============================================

export {
  // XSS prevention
  sanitizedTextSchema,
  safeHtmlSchema,
  secureUrlSchema,
  
  // SQL injection prevention
  dbIdentifierSchema,
  searchQuerySchema,
  
  // Command injection prevention
  safeFilenameSchema,
  safePathSchema,
  
  // Rate limiting
  createRateLimitedSchema,
  
  // Suspicious pattern detection
  suspiciousInputSchema,
  fraudDetectionSchema,
  
  // File upload security
  secureFileUploadSchema,
  
  // CSRF protection
  csrfTokenSchema,
  csrfProtectedRequestSchema,
  
  // Session security
  sessionSecuritySchema,
  
  // API security
  apiKeySchema,
  rateLimitSchema,
} from "./security";

// ==============================================
// TYPES
// ==============================================

export type {
  // Core authentication types
  Email,
  Password,
  PhoneNumber,
  RegistrationData,
  LoginCredentials,
  PasswordResetRequest,
  PasswordReset,
  PasswordChange,
  
  // Personal information types
  SSN,
  TaxID,
  Address,
  FullName,
  
  // User management types
  UserProfile,
  UserRoleData,
  MFASetup,
  MFAVerification,
  
  // API types
  Pagination,
  SearchFilters,
  ErrorResponse,
  ApiResponse,
  
  // Form types
  ContactForm,
  FeedbackForm,
  
  // Utility types
  UUID,
  DateString,
  URL,
  JSONString,
  FileUpload,
  
  // Financial types
  Currency,
  MonetaryAmount,
  Money,
  TransactionAmount,
  AccountNumber,
  RoutingNumber,
  IBAN,
  CreditCard,
  CardExpiration,
  CVV,
  TransactionType,
  TransactionCategory,
  TransactionStatus,
  Transaction,
  Transfer,
  BulkTransaction,
  AccountType,
  AccountStatus,
  CreateAccount,
  PaymentMethodType,
  CreditCardPayment,
  BankAccountPayment,
  DateRange,
  ReportParameters,
  SuspiciousActivity,
  RiskAssessment,
  
  // Security types
  SanitizedText,
  SafeHTML,
  SecureURL,
  DBIdentifier,
  SearchQuery,
  SafeFilename,
  SafePath,
  SuspiciousInput,
  FraudDetection,
  SecureFileUpload,
  CSRFToken,
  SessionSecurity,
  APIKey,
  RateLimit,
  
  // Form validation types
  ValidationResult,
  ValidationError,
  FieldValidation,
  FormValidation,
  
  // Financial form types
  TransactionFormData,
  AccountFormData,
  PaymentMethodFormData,
  ProfileFormData,
  
  // API types
  PaginatedResponse,
  SearchRequest,
  BatchRequest,
  BatchResponse,
  
  // Security event types
  SecurityEvent,
  AuditLogEntry,
  
  // Webhook types
  WebhookPayload,
  WebhookSubscription,
  
  // Form configuration types
  FormFieldConfig,
  FormConfig,
  
  // Type utilities
  SchemaInput,
  SchemaOutput,
  PartialBy,
  RequiredBy,
  PickBy,
  OmitBy,
  
  // Alias exports
  ValidationResult as ValidateResult,
  ValidationError as ValidateError,
  FormValidation as FormState,
  FieldValidation as FieldState,
} from "./types";

// ==============================================
// UTILITIES
// ==============================================

export {
  // Validation utilities
  validateData,
  safeValidate,
  validateAndTransform,
  formatZodErrors,
  createValidationError,
  
  // Form validation utilities
  createFormValidation,
  updateFieldValidation,
  validateField,
  validateForm,
  
  // Sanitization utilities
  sanitizeText,
  sanitizeHtml,
  sanitizeFilename,
  sanitizeSqlInput,
  encodeDangerousChars,
  
  // Financial validation utilities
  validateMonetaryAmount,
  validateCreditCard,
  validateRoutingNumber,
  
  // Security utilities
  detectMaliciousInput,
  generateSecureToken,
  hashSensitiveData,
  maskSensitiveData,
  
  // Rate limiting
  RateLimiter,
  defaultRateLimiter,
  
  // Common patterns
  commonPatterns,
} from "./utils";

// ==============================================
// CONVENIENCE EXPORTS
// ==============================================

/**
 * Pre-configured validation schemas for common use cases
 */
export const commonValidation = {
  // User authentication
  signUp: registrationSchema,
  signIn: loginSchema,
  resetPassword: passwordResetRequestSchema,
  newPassword: passwordResetSchema,
  changePassword: passwordChangeSchema,
  
  // Financial operations
  createTransaction: transactionSchema,
  transferMoney: transferSchema,
  createAccount: createAccountSchema,
  addPaymentMethod: creditCardPaymentSchema,
  
  // Security operations
  safeInput: sanitizedTextSchema,
  secureFile: secureFileUploadSchema,
  apiAccess: apiKeySchema,
} as const;

/**
 * Pre-configured form validation helpers
 */
export const formValidation = {
  // Create validation state for common forms
  createSignUpForm: () => createFormValidation(['email', 'password', 'confirmPassword', 'firstName', 'lastName']),
  createSignInForm: () => createFormValidation(['email', 'password']),
  createTransactionForm: () => createFormValidation(['type', 'category', 'amount', 'description']),
  createAccountForm: () => createFormValidation(['name', 'type', 'currency', 'initialBalance']),
  createProfileForm: () => createFormValidation(['name', 'email', 'phoneNumber']),
} as const;

/**
 * Security validation helpers
 */
export const securityValidation = {
  // Input sanitization
  sanitizeUserInput: sanitizeText,
  sanitizeRichText: sanitizeHtml,
  sanitizeFileName: sanitizeFilename,
  
  // Malicious input detection
  checkSuspiciousInput: detectMaliciousInput,
  maskSensitive: maskSensitiveData,
  
  // Token generation
  generateToken: generateSecureToken,
} as const;

/**
 * Financial validation helpers
 */
export const financialValidation = {
  // Amount validation
  validateAmount: validateMonetaryAmount,
  validateCard: validateCreditCard,
  validateRouting: validateRoutingNumber,
  
  // Common financial schemas
  money: moneySchema,
  transaction: transactionSchema,
  account: createAccountSchema,
  payment: creditCardPaymentSchema,
} as const;

// ==============================================
// DEFAULT EXPORT
// ==============================================

/**
 * Default export with the most commonly used validation functions
 */
export default {
  // Core validation functions
  validate: validateData,
  safeValidate,
  
  // Common schemas
  schemas: commonValidation,
  
  // Form helpers
  forms: formValidation,
  
  // Security helpers
  security: securityValidation,
  
  // Financial helpers
  financial: financialValidation,
  
  // Utilities
  utils: {
    sanitize: sanitizeText,
    mask: maskSensitiveData,
    detect: detectMaliciousInput,
    generate: generateSecureToken,
  },
} as const;