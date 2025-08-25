/**
 * API Route Tests - PATCH /api/budget
 * Tests for budget line editing functionality
 */

import { NextRequest } from 'next/server'
import { GET, PATCH } from '../route'

// Mock Prisma client - must be defined before jest.mock
const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  budget: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  budgetLine: {
    update: jest.fn(),
  },
}

// Mock the prisma module
jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    budget: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    budgetLine: {
      update: jest.fn(),
    },
  },
}))

describe('/api/budget PATCH endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Success Cases', () => {
    it('should successfully update budget line amount', async () => {
      const mockBudgetLine = {
        id: 'budget-line-1',
        category: 'Groceries',
        budgetedAmount: 600,
        transactions: [
          { amount: 100 },
          { amount: 23.49 }
        ]
      }

      const { prisma } = require('../../../../lib/prisma')
      prisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 600
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: 'budget-line-1',
        category: 'Groceries',
        budgetedAmount: 600,
        actualSpent: 123.49,
        remaining: 476.51
      })

      expect(mockPrisma.budgetLine.update).toHaveBeenCalledWith({
        where: { id: 'budget-line-1' },
        data: { budgetedAmount: 600 },
        include: { transactions: true }
      })
    })

    it('should handle budget line with no transactions', async () => {
      const mockBudgetLine = {
        id: 'budget-line-2',
        category: 'Utilities',
        budgetedAmount: 300,
        transactions: []
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-2',
          budgetedAmount: 300
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.actualSpent).toBe(0)
      expect(data.remaining).toBe(300)
    })

    it('should handle zero budget amount', async () => {
      const mockBudgetLine = {
        id: 'budget-line-3',
        category: 'Test Category',
        budgetedAmount: 0,
        transactions: [{ amount: 50 }]
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-3',
          budgetedAmount: 0
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.budgetedAmount).toBe(0)
      expect(data.remaining).toBe(-50) // Over budget scenario
    })
  })

  describe('Validation Error Cases', () => {
    it('should return 400 for missing budgetLineId', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetedAmount: 500
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid budget line ID or amount')
    })

    it('should return 400 for missing budgetedAmount', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid budget line ID or amount')
    })

    it('should return 400 for negative budgetedAmount', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: -100
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid budget line ID or amount')
    })

    it('should return 400 for non-numeric budgetedAmount', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 'invalid'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid budget line ID or amount')
    })

    it('should return 400 for empty budgetLineId string', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: '',
          budgetedAmount: 500
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid budget line ID or amount')
    })
  })

  describe('Database Error Cases', () => {
    it('should return 500 for database connection error', async () => {
      mockPrisma.budgetLine.update.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 600
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update budget line')
    })

    it('should return 500 for non-existent budget line', async () => {
      mockPrisma.budgetLine.update.mockRejectedValue(new Error('Record not found'))

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'non-existent-id',
          budgetedAmount: 600
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update budget line')
    })
  })

  describe('Request Format Error Cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: '{invalid json}',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update budget line')
    })

    it('should handle missing Content-Type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 600
        }),
      })

      // Should still work as Next.js handles this automatically
      mockPrisma.budgetLine.update.mockResolvedValue({
        id: 'budget-line-1',
        category: 'Test',
        budgetedAmount: 600,
        transactions: []
      })

      const response = await PATCH(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Calculation Accuracy', () => {
    it('should calculate remaining amount correctly for multiple transactions', async () => {
      const mockBudgetLine = {
        id: 'budget-line-calc',
        category: 'Entertainment',
        budgetedAmount: 150,
        transactions: [
          { amount: 25.99 },
          { amount: 15.50 },
          { amount: 8.75 },
          { amount: 12.25 }
        ]
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-calc',
          budgetedAmount: 150
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(data.actualSpent).toBe(62.49) // 25.99 + 15.50 + 8.75 + 12.25
      expect(data.remaining).toBe(87.51) // 150 - 62.49
    })

    it('should handle decimal amounts correctly', async () => {
      const mockBudgetLine = {
        id: 'budget-line-decimal',
        category: 'Gas',
        budgetedAmount: 199.99,
        transactions: [
          { amount: 45.678 }, // Should be handled as-is
          { amount: 32.1 }
        ]
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-decimal',
          budgetedAmount: 199.99
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(data.actualSpent).toBe(77.778)
      expect(data.remaining).toBe(122.212)
    })
  })
})

describe('/api/budget GET endpoint integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should work with existing GET endpoint', async () => {
    // Mock the chain of calls for GET endpoint
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'demo@example.com',
      name: 'Demo User'
    })

    mockPrisma.budget.findUnique.mockResolvedValue({
      id: 'budget-1',
      name: 'Budget 8/2025',
      month: 8,
      year: 2025,
      budgetLines: [
        {
          id: 'budget-line-1',
          category: 'Groceries',
          budgetedAmount: 600, // Updated amount from PATCH test
          transactions: [{ amount: 123.49 }]
        }
      ]
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.budgetLines).toHaveLength(1)
    expect(data.budgetLines[0]).toEqual({
      id: 'budget-line-1',
      category: 'Groceries',
      budgetedAmount: 600,
      actualSpent: 123.49,
      remaining: 476.51
    })
  })
})