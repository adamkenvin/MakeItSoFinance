/**
 * Swagger Configuration for MakeItSo Finance API
 * Generates OpenAPI documentation from JSDoc comments and manual specification
 */

import swaggerJSDoc from 'swagger-jsdoc'

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MakeItSo Finance API',
    version: '1.0.0',
    description: `
# MakeItSo Finance API Documentation

A comprehensive budget tracking and financial management API built with Next.js, Prisma, and PostgreSQL.

## Features
- 📊 **Budget Management**: Create and manage monthly budgets with categories
- 💰 **Transaction Tracking**: Track expenses against budget categories  
- 📈 **Real-time Calculations**: Automatic calculation of spent amounts and remaining budgets
- ✏️ **Inline Editing**: Update budget amounts with real-time validation
- 🔒 **Secure**: Input validation and error handling throughout

## Authentication
Currently uses demo mode for MVP. Full authentication system available but not required for basic functionality.

## Database
- **Development**: SQLite for local development
- **Production**: PostgreSQL on Vercel with automatic migrations
    `,
    contact: {
      name: 'MakeItSo Finance Team',
      email: 'demo@makeitsofinance.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://your-app.vercel.app' 
        : 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' 
        ? 'Production server' 
        : 'Development server'
    }
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique user identifier',
            example: 'clxy123abc456def789'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'demo@example.com'
          },
          name: {
            type: 'string',
            nullable: true,
            description: 'User display name',
            example: 'Demo User'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time', 
            description: 'Last account update timestamp'
          }
        },
        required: ['id', 'email', 'createdAt', 'updatedAt']
      },
      Budget: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique budget identifier',
            example: 'clxy123abc456def789'
          },
          name: {
            type: 'string',
            description: 'Budget display name',
            example: 'Budget 8/2025'
          },
          month: {
            type: 'integer',
            minimum: 1,
            maximum: 12,
            description: 'Budget month (1-12)',
            example: 8
          },
          year: {
            type: 'integer',
            minimum: 2020,
            description: 'Budget year',
            example: 2025
          },
          userId: {
            type: 'string',
            description: 'User ID who owns this budget'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['id', 'name', 'month', 'year', 'userId']
      },
      BudgetLine: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique budget line identifier',
            example: 'clxy123abc456def789'
          },
          category: {
            type: 'string',
            description: 'Budget category name',
            example: 'Groceries'
          },
          budgetedAmount: {
            type: 'number',
            format: 'float',
            minimum: 0,
            description: 'Allocated budget amount for this category',
            example: 500.00
          },
          actualSpent: {
            type: 'number',
            format: 'float',
            description: 'Total amount spent in this category (calculated)',
            example: 123.49,
            readOnly: true
          },
          remaining: {
            type: 'number',
            format: 'float',
            description: 'Remaining budget amount (calculated)',
            example: 376.51,
            readOnly: true
          },
          budgetId: {
            type: 'string',
            description: 'Budget ID this line belongs to'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['id', 'category', 'budgetedAmount', 'budgetId']
      },
      Transaction: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique transaction identifier',
            example: 'clxy123abc456def789'
          },
          description: {
            type: 'string',
            description: 'Transaction description',
            example: 'Whole Foods grocery shopping'
          },
          amount: {
            type: 'number',
            format: 'float',
            description: 'Transaction amount',
            example: 87.32
          },
          category: {
            type: 'string',
            description: 'Transaction category',
            example: 'Groceries'
          },
          date: {
            type: 'string',
            format: 'date-time',
            description: 'Transaction date',
            example: '2025-08-25T10:30:00Z'
          },
          budgetId: {
            type: 'string',
            description: 'Budget ID this transaction belongs to'
          },
          budgetLineId: {
            type: 'string',
            nullable: true,
            description: 'Budget line ID this transaction is categorized under'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['id', 'description', 'amount', 'category', 'date', 'budgetId']
      },
      BudgetData: {
        type: 'object',
        description: 'Complete budget information with calculated totals',
        properties: {
          budget: {
            $ref: '#/components/schemas/Budget'
          },
          budgetLines: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/BudgetLine'
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Invalid budget line ID or amount'
          }
        },
        required: ['error']
      }
    },
    responses: {
      BadRequest: {
        description: 'Invalid request parameters',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'  
            }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Budget',
      description: 'Budget management operations - create, read, and update budgets with categories'
    },
    {
      name: 'Transactions',
      description: 'Transaction tracking operations - add and manage expenses against budget categories'
    },
    {
      name: 'Authentication',
      description: 'User authentication and session management (NextAuth.js integration)'
    }
  ]
}

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/app/api/**/*.ts', // API routes
    './src/app/api/**/*.js', // API routes (if any JS files)
    './src/lib/swagger-definitions.ts', // Additional definitions
  ],
}

export const swaggerSpec = swaggerJSDoc(options)

export default swaggerSpec