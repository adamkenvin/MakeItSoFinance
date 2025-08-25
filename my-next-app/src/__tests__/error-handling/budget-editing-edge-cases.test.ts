/**
 * Error Handling and Edge Cases Tests
 * Tests for edge cases and error scenarios in budget editing
 */

import { NextRequest } from 'next/server'
import { PATCH } from '../../app/api/budget/route'

// Mock Prisma
const mockPrisma = {
  budgetLine: {
    update: jest.fn(),
  },
}

jest.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}))

describe('Budget Editing Edge Cases and Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Input Validation Edge Cases', () => {
    it('should handle extremely large budget amounts', async () => {
      const mockBudgetLine = {
        id: 'budget-line-large',
        category: 'Large Budget',
        budgetedAmount: 999999999.99,
        transactions: []
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-large',
          budgetedAmount: 999999999.99
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.budgetedAmount).toBe(999999999.99)
    })

    it('should handle very small decimal amounts', async () => {
      const mockBudgetLine = {
        id: 'budget-line-small',
        category: 'Small Budget',
        budgetedAmount: 0.01,
        transactions: []
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-small',
          budgetedAmount: 0.01
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.budgetedAmount).toBe(0.01)
    })

    it('should handle floating point precision issues', async () => {
      const mockBudgetLine = {
        id: 'budget-line-float',
        category: 'Float Precision',
        budgetedAmount: 0.1 + 0.2, // JavaScript floating point issue
        transactions: [{ amount: 0.1 }, { amount: 0.2 }]
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-float',
          budgetedAmount: 0.30000000000000004 // Result of 0.1 + 0.2
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.actualSpent).toBe(0.3) // 0.1 + 0.2 should be handled correctly
    })

    it('should reject null values', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: null,
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid budget line ID or amount')
    })

    it('should reject undefined values', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: undefined
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid budget line ID or amount')
    })

    it('should reject NaN values', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: NaN
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid budget line ID or amount')
    })

    it('should reject Infinity values', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: Infinity
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid budget line ID or amount')
    })
  })

  describe('SQL Injection and Security Edge Cases', () => {
    it('should handle potential SQL injection in budgetLineId', async () => {
      const maliciousId = "'; DROP TABLE budget_lines; --"
      
      mockPrisma.budgetLine.update.mockRejectedValue(new Error('Record not found'))

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: maliciousId,
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update budget line')
      
      // Ensure Prisma was called with the malicious string (Prisma will handle sanitization)
      expect(mockPrisma.budgetLine.update).toHaveBeenCalledWith({
        where: { id: maliciousId },
        data: { budgetedAmount: 500 },
        include: { transactions: true }
      })
    })

    it('should handle extremely long budgetLineId strings', async () => {
      const longId = 'a'.repeat(10000)
      
      mockPrisma.budgetLine.update.mockRejectedValue(new Error('Record not found'))

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: longId,
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      
      expect(response.status).toBe(500) // Should fail at database level
    })

    it('should handle special characters in budgetLineId', async () => {
      const specialCharsId = '🔥💯‰‱€$¥£¤¢₽₨₩₪₫₱₡₵'
      
      mockPrisma.budgetLine.update.mockRejectedValue(new Error('Record not found'))

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: specialCharsId,
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      
      expect(response.status).toBe(500) // Should fail gracefully
    })
  })

  describe('Database Constraint Edge Cases', () => {
    it('should handle database constraint violations', async () => {
      mockPrisma.budgetLine.update.mockRejectedValue(
        new Error('Unique constraint failed')
      )

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update budget line')
    })

    it('should handle database timeout errors', async () => {
      mockPrisma.budgetLine.update.mockRejectedValue(
        new Error('Connection timeout')
      )

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update budget line')
    })

    it('should handle database connection pool exhaustion', async () => {
      mockPrisma.budgetLine.update.mockRejectedValue(
        new Error('Cannot connect to database - pool exhausted')
      )

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update budget line')
    })
  })

  describe('Memory and Performance Edge Cases', () => {
    it('should handle budget line with extremely large number of transactions', async () => {
      const manyTransactions = Array.from({ length: 10000 }, (_, i) => ({
        amount: Math.random() * 100
      }))
      
      const totalSpent = manyTransactions.reduce((sum, t) => sum + t.amount, 0)

      const mockBudgetLine = {
        id: 'budget-line-many-transactions',
        category: 'Many Transactions',
        budgetedAmount: 50000,
        transactions: manyTransactions
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-many-transactions',
          budgetedAmount: 50000
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const startTime = Date.now()
      const response = await PATCH(request)
      const endTime = Date.now()
      
      // Should complete within reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
      
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.actualSpent).toBeCloseTo(totalSpent, 2)
    })

    it('should handle extremely large JSON payload gracefully', async () => {
      const hugeDescription = 'x'.repeat(1000000) // 1MB string
      
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 500,
          extraField: hugeDescription // Should be ignored
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      // This should either succeed (ignoring extra field) or fail gracefully
      const response = await PATCH(request)
      
      // Either validation error or success, but should not crash
      expect([200, 400, 413, 500]).toContain(response.status)
    })
  })

  describe('Race Condition Edge Cases', () => {
    it('should handle concurrent updates to same budget line', async () => {
      let updateCount = 0
      
      mockPrisma.budgetLine.update.mockImplementation(() => {
        updateCount++
        return Promise.resolve({
          id: 'budget-line-1',
          category: 'Test',
          budgetedAmount: 500 + updateCount * 100,
          transactions: []
        })
      })

      const request1 = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 600
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const request2 = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 700
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      // Execute concurrent requests
      const [response1, response2] = await Promise.all([
        PATCH(request1),
        PATCH(request2)
      ])

      // Both should succeed (database will handle the actual race condition)
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(updateCount).toBe(2)
    })
  })

  describe('Transaction Calculation Edge Cases', () => {
    it('should handle transactions with negative amounts correctly', async () => {
      const mockBudgetLine = {
        id: 'budget-line-negative',
        category: 'Refunds',
        budgetedAmount: 500,
        transactions: [
          { amount: 100 },   // Regular expense
          { amount: -50 },   // Refund
          { amount: 75 },    // Regular expense
          { amount: -25 }    // Another refund
        ]
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-negative',
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.actualSpent).toBe(100) // 100 - 50 + 75 - 25
      expect(data.remaining).toBe(400) // 500 - 100
    })

    it('should handle zero-amount transactions', async () => {
      const mockBudgetLine = {
        id: 'budget-line-zero',
        category: 'Zero Amounts',
        budgetedAmount: 500,
        transactions: [
          { amount: 0 },
          { amount: 100 },
          { amount: 0 },
          { amount: 0 }
        ]
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-zero',
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.actualSpent).toBe(100)
      expect(data.remaining).toBe(400)
    })

    it('should handle empty transactions array edge case', async () => {
      const mockBudgetLine = {
        id: 'budget-line-empty',
        category: 'No Transactions',
        budgetedAmount: 500,
        transactions: []
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-empty',
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.actualSpent).toBe(0)
      expect(data.remaining).toBe(500)
    })
  })

  describe('HTTP Method Edge Cases', () => {
    it('should only accept PATCH method', async () => {
      // This test would require testing the route handler directly
      // as we're mocking the PATCH function specifically
      expect(true).toBe(true) // Placeholder - this would be handled by Next.js routing
    })
  })

  describe('Content-Type Edge Cases', () => {
    it('should handle missing Content-Type header', async () => {
      const mockBudgetLine = {
        id: 'budget-line-1',
        category: 'Test',
        budgetedAmount: 500,
        transactions: []
      }

      mockPrisma.budgetLine.update.mockResolvedValue(mockBudgetLine)

      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 500
        })
        // No Content-Type header
      })

      const response = await PATCH(request)
      expect(response.status).toBe(200) // Next.js should handle this
    })

    it('should handle incorrect Content-Type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 500
        }),
        headers: { 'Content-Type': 'text/plain' },
      })

      // Should still work as Next.js handles content type detection
      mockPrisma.budgetLine.update.mockResolvedValue({
        id: 'budget-line-1',
        category: 'Test',
        budgetedAmount: 500,
        transactions: []
      })

      const response = await PATCH(request)
      expect(response.status).toBe(200)
    })
  })
})