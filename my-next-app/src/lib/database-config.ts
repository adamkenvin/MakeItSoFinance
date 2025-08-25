/**
 * Database Configuration Helper
 * Handles SQLite (local) and PostgreSQL (production) compatibility
 */

export interface DatabaseConfig {
  provider: 'sqlite' | 'postgresql'
  url: string
  isDevelopment: boolean
  isProduction: boolean
}

export function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
  const nodeEnv = process.env.NODE_ENV || 'development'
  
  const isDevelopment = nodeEnv === 'development'
  const isProduction = nodeEnv === 'production'
  
  // Determine provider from URL
  let provider: 'sqlite' | 'postgresql'
  if (databaseUrl.startsWith('file:')) {
    provider = 'sqlite'
  } else if (databaseUrl.startsWith('postgres')) {
    provider = 'postgresql'
  } else {
    // Default to SQLite for development, PostgreSQL for production
    provider = isDevelopment ? 'sqlite' : 'postgresql'
  }
  
  return {
    provider,
    url: databaseUrl,
    isDevelopment,
    isProduction
  }
}

export function validateDatabaseConfig(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const config = getDatabaseConfig()
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validate URL format
  if (!config.url) {
    errors.push('DATABASE_URL is not defined')
  }
  
  // Check for development/production mismatches
  if (config.isProduction && config.provider === 'sqlite') {
    warnings.push('Using SQLite in production - consider PostgreSQL for better performance')
  }
  
  if (config.isDevelopment && config.provider === 'postgresql' && !config.url.includes('localhost')) {
    warnings.push('Using remote PostgreSQL in development - consider SQLite for faster local development')
  }
  
  // Validate URL format based on provider
  if (config.provider === 'sqlite' && !config.url.startsWith('file:')) {
    errors.push('SQLite database URL must start with "file:"')
  }
  
  if (config.provider === 'postgresql' && !config.url.startsWith('postgres')) {
    errors.push('PostgreSQL database URL must start with "postgresql://" or "postgres://"')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function getOptimalPrismaConfig() {
  const config = getDatabaseConfig()
  
  return {
    // Connection configuration optimized per database type
    datasources: {
      db: {
        provider: config.provider,
        url: config.url
      }
    },
    
    // Generator configuration
    generator: {
      client: {
        provider: 'prisma-client-js'
      }
    },
    
    // Database-specific optimizations
    connectionPooling: config.provider === 'postgresql' ? {
      maxConnections: 10,
      connectionTimeout: 30000
    } : {
      maxConnections: 1,
      connectionTimeout: 5000
    },
    
    // Migration strategy
    migrationStrategy: config.isDevelopment ? 'db-push' : 'migrate-deploy'
  }
}

export function formatDatabaseError(error: Error): {
  message: string
  isConstraintError: boolean
  isConnectionError: boolean 
  originalError: Error
} {
  const errorMessage = error.message.toLowerCase()
  
  // Detect constraint violations across database types
  const isConstraintError = 
    errorMessage.includes('unique constraint') ||
    errorMessage.includes('foreign key constraint') ||
    errorMessage.includes('duplicate key value') ||
    errorMessage.includes('violates')
  
  // Detect connection issues
  const isConnectionError =
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connect') ||
    errorMessage.includes('network')
  
  // Provide user-friendly error messages
  let friendlyMessage = 'Database operation failed'
  
  if (isConstraintError) {
    friendlyMessage = 'This operation conflicts with existing data'
  } else if (isConnectionError) {
    friendlyMessage = 'Database connection issue - please try again'
  } else if (errorMessage.includes('not found') || errorMessage.includes('no such')) {
    friendlyMessage = 'The requested item was not found'
  }
  
  return {
    message: friendlyMessage,
    isConstraintError,
    isConnectionError,
    originalError: error
  }
}

// Utility functions for database-specific operations
export const DatabaseUtils = {
  // Handle different decimal precision between SQLite and PostgreSQL
  formatCurrency: (amount: number): number => {
    return Math.round(amount * 100) / 100
  },
  
  // Handle date formatting consistently
  formatDate: (date: Date): string => {
    return date.toISOString()
  },
  
  // Handle boolean values consistently
  formatBoolean: (value: boolean): boolean => {
    return Boolean(value)
  },
  
  // Generate unique IDs consistently
  generateId: (): string => {
    // This would typically use a library like cuid or uuid
    // For now, return a mock format that both databases support
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

// Environment validation helper
export function validateEnvironment(): {
  isValid: boolean
  missing: string[]
  recommendations: string[]
} {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  const recommendations: string[] = []
  
  if (missing.includes('DATABASE_URL')) {
    recommendations.push('Set DATABASE_URL to "file:./dev.db" for local development or PostgreSQL URL for production')
  }
  
  if (missing.includes('NEXTAUTH_SECRET')) {
    recommendations.push('Generate NEXTAUTH_SECRET with: openssl rand -base64 32')
  }
  
  if (missing.includes('NEXTAUTH_URL')) {
    recommendations.push('Set NEXTAUTH_URL to your application URL (e.g., http://localhost:3000)')
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    recommendations
  }
}