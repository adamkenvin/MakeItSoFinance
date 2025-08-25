/**
 * MakeItSo Finance - Financial Validation Schemas
 * 
 * Specialized validation schemas for financial data with precision,
 * fraud prevention, and compliance requirements.
 */

import { z } from "zod";

// ==============================================
// CURRENCY AND AMOUNT SCHEMAS
// ==============================================

/**
 * Currency code validation (ISO 4217)
 */
export const currencySchema = z.string()
  .length(3, "Currency code must be 3 characters")
  .regex(/^[A-Z]{3}$/, "Invalid currency code format")
  .refine(
    (code) => {
      const validCurrencies = [
        "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD",
        "MXN", "SGD", "HKD", "NOK", "KRW", "TRY", "RUB", "INR", "BRL", "ZAR"
      ];
      return validCurrencies.includes(code);
    },
    "Unsupported currency code"
  );

/**
 * Monetary amount validation with precision control
 */
export const monetaryAmountSchema = z.number()
  .finite("Amount must be a valid number")
  .min(0, "Amount cannot be negative")
  .max(999999999.99, "Amount exceeds maximum limit")
  .refine(
    (amount) => {
      // Check for proper decimal precision (max 2 decimal places)
      const decimalPlaces = (amount.toString().split('.')[1] || '').length;
      return decimalPlaces <= 2;
    },
    "Amount cannot have more than 2 decimal places"
  )
  .refine(
    (amount) => amount !== 0 || amount === 0,
    "Invalid amount value"
  );

/**
 * Money object with currency and amount
 */
export const moneySchema = z.object({
  amount: monetaryAmountSchema,
  currency: currencySchema,
});

/**
 * Transaction amount with fraud detection
 */
export const transactionAmountSchema = monetaryAmountSchema
  .refine(
    (amount) => {
      // Flag potentially fraudulent round numbers above $10k
      if (amount >= 10000) {
        const isRoundNumber = amount % 1000 === 0 || amount % 500 === 0;
        const isExactDollar = amount % 1 === 0;
        return !(isRoundNumber && isExactDollar && amount >= 50000);
      }
      return true;
    },
    "Large round amounts require additional verification"
  );

// ==============================================
// ACCOUNT VALIDATION SCHEMAS
// ==============================================

/**
 * Bank account number validation
 */
export const accountNumberSchema = z.string()
  .min(4, "Account number too short")
  .max(17, "Account number too long")
  .regex(/^[0-9]+$/, "Account number must contain only digits")
  .refine(
    (accountNumber) => {
      // Basic Luhn algorithm check for some account types
      if (accountNumber.length >= 13) {
        let sum = 0;
        let alternate = false;
        for (let i = accountNumber.length - 1; i >= 0; i--) {
          let n = parseInt(accountNumber.charAt(i), 10);
          if (alternate) {
            n *= 2;
            if (n > 9) n = (n % 10) + 1;
          }
          sum += n;
          alternate = !alternate;
        }
        return sum % 10 === 0;
      }
      return true;
    },
    "Invalid account number checksum"
  );

/**
 * Routing number validation (US banks)
 */
export const routingNumberSchema = z.string()
  .length(9, "Routing number must be 9 digits")
  .regex(/^[0-9]{9}$/, "Routing number must contain only digits")
  .refine(
    (routingNumber) => {
      // ABA routing number checksum validation
      const digits = routingNumber.split('').map(Number);
      const checksum = (
        3 * (digits[0] + digits[3] + digits[6]) +
        7 * (digits[1] + digits[4] + digits[7]) +
        1 * (digits[2] + digits[5] + digits[8])
      ) % 10;
      return checksum === 0;
    },
    "Invalid routing number checksum"
  );

/**
 * IBAN validation (international)
 */
export const ibanSchema = z.string()
  .min(15, "IBAN too short")
  .max(34, "IBAN too long")
  .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, "Invalid IBAN format")
  .refine(
    (iban) => {
      // Move first 4 characters to end and convert letters to numbers
      const rearranged = iban.slice(4) + iban.slice(0, 4);
      const numericString = rearranged.replace(/[A-Z]/g, (char) => 
        (char.charCodeAt(0) - 65 + 10).toString()
      );
      
      // Calculate mod 97
      let remainder = 0;
      for (const digit of numericString) {
        remainder = (remainder * 10 + parseInt(digit)) % 97;
      }
      
      return remainder === 1;
    },
    "Invalid IBAN checksum"
  );

/**
 * Credit card number validation
 */
export const creditCardSchema = z.string()
  .min(13, "Credit card number too short")
  .max(19, "Credit card number too long")
  .regex(/^[0-9\s-]+$/, "Credit card number contains invalid characters")
  .transform((cardNumber) => cardNumber.replace(/[\s-]/g, ""))
  .refine(
    (cardNumber) => {
      // Luhn algorithm validation
      let sum = 0;
      let alternate = false;
      for (let i = cardNumber.length - 1; i >= 0; i--) {
        let n = parseInt(cardNumber.charAt(i), 10);
        if (alternate) {
          n *= 2;
          if (n > 9) n = (n % 10) + 1;
        }
        sum += n;
        alternate = !alternate;
      }
      return sum % 10 === 0;
    },
    "Invalid credit card number"
  )
  .refine(
    (cardNumber) => {
      // Basic card type validation
      const firstDigit = cardNumber.charAt(0);
      const firstTwoDigits = cardNumber.slice(0, 2);
      
      // Visa: starts with 4, 13-19 digits
      if (firstDigit === "4") return cardNumber.length >= 13 && cardNumber.length <= 19;
      
      // Mastercard: starts with 51-55 or 2221-2720, 16 digits
      if (firstTwoDigits >= "51" && firstTwoDigits <= "55") return cardNumber.length === 16;
      if (firstTwoDigits >= "22" && firstTwoDigits <= "27") return cardNumber.length === 16;
      
      // American Express: starts with 34 or 37, 15 digits
      if (firstTwoDigits === "34" || firstTwoDigits === "37") return cardNumber.length === 15;
      
      // Discover: starts with 6, 16 digits
      if (firstDigit === "6") return cardNumber.length === 16;
      
      return false;
    },
    "Unsupported card type or invalid length"
  );

/**
 * Credit card expiration date
 */
export const cardExpirationSchema = z.string()
  .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Invalid expiration format (MM/YY)")
  .refine(
    (expiration) => {
      const [month, year] = expiration.split('/');
      const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const now = new Date();
      return expDate > now;
    },
    "Card has expired"
  );

/**
 * CVV validation
 */
export const cvvSchema = z.string()
  .regex(/^[0-9]{3,4}$/, "CVV must be 3 or 4 digits");

// ==============================================
// TRANSACTION SCHEMAS
// ==============================================

/**
 * Transaction types
 */
export const transactionTypeSchema = z.enum([
  "deposit",
  "withdrawal",
  "transfer",
  "payment",
  "refund",
  "fee",
  "interest",
  "dividend",
  "adjustment",
  "reversal"
]);

/**
 * Transaction categories
 */
export const transactionCategorySchema = z.enum([
  "salary",
  "business_income",
  "investment",
  "rent",
  "utilities",
  "groceries",
  "transportation",
  "healthcare",
  "insurance",
  "entertainment",
  "education",
  "taxes",
  "fees",
  "other"
]);

/**
 * Transaction status
 */
export const transactionStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "reversed",
  "disputed"
]);

/**
 * Basic transaction schema
 */
export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  type: transactionTypeSchema,
  category: transactionCategorySchema,
  amount: transactionAmountSchema,
  currency: currencySchema,
  description: z.string()
    .min(1, "Transaction description is required")
    .max(500, "Description too long")
    .regex(/^[a-zA-Z0-9\s\-.,!?()]+$/, "Description contains invalid characters"),
  reference: z.string()
    .max(50, "Reference too long")
    .regex(/^[a-zA-Z0-9\-_]*$/, "Invalid reference format")
    .optional(),
  fromAccountId: z.string().uuid().optional(),
  toAccountId: z.string().uuid().optional(),
  status: transactionStatusSchema.default("pending"),
  scheduledDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Transfer transaction schema
 */
export const transferSchema = transactionSchema.extend({
  type: z.literal("transfer"),
  fromAccountId: z.string().uuid("Invalid from account ID"),
  toAccountId: z.string().uuid("Invalid to account ID"),
}).refine(
  (data) => data.fromAccountId !== data.toAccountId,
  {
    message: "Cannot transfer to the same account",
    path: ["toAccountId"],
  }
);

/**
 * Bulk transaction schema
 */
export const bulkTransactionSchema = z.object({
  transactions: z.array(transactionSchema)
    .min(1, "At least one transaction required")
    .max(1000, "Too many transactions in bulk")
    .refine(
      (transactions) => {
        const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
        return totalAmount <= 1000000; // $1M limit for bulk operations
      },
      "Bulk transaction amount exceeds limit"
    ),
  batchId: z.string().uuid().optional(),
  scheduledDate: z.string().datetime().optional(),
});

// ==============================================
// ACCOUNT MANAGEMENT SCHEMAS
// ==============================================

/**
 * Account types
 */
export const accountTypeSchema = z.enum([
  "checking",
  "savings",
  "credit",
  "investment",
  "loan",
  "business",
  "joint",
  "trust"
]);

/**
 * Account status
 */
export const accountStatusSchema = z.enum([
  "active",
  "inactive",
  "frozen",
  "closed",
  "pending"
]);

/**
 * Bank account creation schema
 */
export const createAccountSchema = z.object({
  name: z.string()
    .min(1, "Account name is required")
    .max(100, "Account name too long")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Account name contains invalid characters"),
  type: accountTypeSchema,
  currency: currencySchema,
  initialBalance: monetaryAmountSchema.default(0),
  accountNumber: accountNumberSchema.optional(),
  routingNumber: routingNumberSchema.optional(),
  iban: ibanSchema.optional(),
  description: z.string()
    .max(500, "Description too long")
    .optional(),
  metadata: z.record(z.any()).optional(),
});

// ==============================================
// PAYMENT METHOD SCHEMAS
// ==============================================

/**
 * Payment method types
 */
export const paymentMethodTypeSchema = z.enum([
  "bank_account",
  "credit_card",
  "debit_card",
  "digital_wallet",
  "cryptocurrency",
  "check",
  "wire_transfer",
  "ach"
]);

/**
 * Credit card payment method
 */
export const creditCardPaymentSchema = z.object({
  type: z.literal("credit_card"),
  cardNumber: creditCardSchema,
  expirationDate: cardExpirationSchema,
  cvv: cvvSchema,
  cardholderName: z.string()
    .min(1, "Cardholder name is required")
    .max(100, "Cardholder name too long")
    .regex(/^[a-zA-Z\s\-']+$/, "Invalid cardholder name format"),
  billingAddress: z.object({
    street: z.string().min(1).max(100),
    city: z.string().min(1).max(50),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().length(2).default("US"),
  }),
});

/**
 * Bank account payment method
 */
export const bankAccountPaymentSchema = z.object({
  type: z.literal("bank_account"),
  accountNumber: accountNumberSchema,
  routingNumber: routingNumberSchema,
  accountType: z.enum(["checking", "savings"]),
  accountHolderName: z.string()
    .min(1, "Account holder name is required")
    .max(100, "Account holder name too long")
    .regex(/^[a-zA-Z\s\-']+$/, "Invalid account holder name format"),
});

// ==============================================
// FINANCIAL REPORTING SCHEMAS
// ==============================================

/**
 * Date range for reports
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: "Start date must be before end date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 731; // Max 2 years
  },
  {
    message: "Date range cannot exceed 2 years",
    path: ["endDate"],
  }
);

/**
 * Financial report parameters
 */
export const reportParametersSchema = z.object({
  reportType: z.enum([
    "balance_sheet",
    "income_statement",
    "cash_flow",
    "transaction_summary",
    "account_summary",
    "tax_report",
    "compliance_report"
  ]),
  dateRange: dateRangeSchema,
  accountIds: z.array(z.string().uuid()).optional(),
  categories: z.array(transactionCategorySchema).optional(),
  currency: currencySchema.optional(),
  includeSubAccounts: z.boolean().default(true),
  format: z.enum(["pdf", "excel", "csv", "json"]).default("pdf"),
});

// ==============================================
// FRAUD DETECTION SCHEMAS
// ==============================================

/**
 * Suspicious activity indicators
 */
export const suspiciousActivitySchema = z.object({
  transactionId: z.string().uuid(),
  riskScore: z.number().min(0).max(100),
  indicators: z.array(z.enum([
    "unusual_amount",
    "unusual_frequency",
    "unusual_location",
    "unusual_time",
    "blacklisted_account",
    "velocity_breach",
    "pattern_anomaly",
    "device_mismatch",
    "ip_mismatch"
  ])),
  severity: z.enum(["low", "medium", "high", "critical"]),
  autoBlocked: z.boolean().default(false),
  requiresReview: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});

/**
 * Risk assessment schema
 */
export const riskAssessmentSchema = z.object({
  userId: z.string().uuid(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  factors: z.array(z.string()),
  score: z.number().min(0).max(100),
  lastAssessed: z.string().datetime(),
  validUntil: z.string().datetime(),
  requiresReview: z.boolean().default(false),
});

// Export all financial validation schemas
export {
  // Currency and amounts
  currencySchema,
  monetaryAmountSchema,
  moneySchema,
  transactionAmountSchema,
  
  // Accounts
  accountNumberSchema,
  routingNumberSchema,
  ibanSchema,
  creditCardSchema,
  cardExpirationSchema,
  cvvSchema,
  
  // Transactions
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
};