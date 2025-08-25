/**
 * Integration Tests - Budget Editing Workflow
 * Tests the complete end-to-end budget editing functionality
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BudgetPage from '@/components/BudgetPage'
import { server } from '../mocks/server'
import { rest } from 'msw'

// Mock fetch globally
global.fetch = jest.fn()

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('Budget Editing Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  describe('Successful Edit Workflow', () => {
    it('should complete full edit workflow successfully', async () => {
      const user = userEvent.setup()

      // Mock initial budget data
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            budget: {
              id: 'budget-1',
              name: 'Budget 8/2025',
              month: 8,
              year: 2025
            },
            budgetLines: [
              {
                id: 'budget-line-1',
                category: 'Groceries',
                budgetedAmount: 500,
                actualSpent: 123.49,
                remaining: 376.51
              }
            ]
          })
        })
        // Mock successful PATCH response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'budget-line-1',
            category: 'Groceries',
            budgetedAmount: 600,
            actualSpent: 123.49,
            remaining: 476.51
          })
        })
        // Mock refetch after save
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            budget: {
              id: 'budget-1',
              name: 'Budget 8/2025',
              month: 8,
              year: 2025
            },
            budgetLines: [
              {
                id: 'budget-line-1',
                category: 'Groceries',
                budgetedAmount: 600,
                actualSpent: 123.49,
                remaining: 476.51
              }
            ]
          })
        })

      renderWithQueryClient(<BudgetPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Budget 8/2025')).toBeInTheDocument()
      })

      // Verify initial state
      expect(screen.getByText('Budgeted: $500.00')).toBeInTheDocument()
      expect(screen.getByText('$500.00')).toBeInTheDocument() // In table

      // Start editing
      const editButton = screen.getByText('Edit Budget')
      await user.click(editButton)

      // Verify edit mode
      const input = screen.getByDisplayValue('500')
      expect(input).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()

      // Change value
      await user.clear(input)
      await user.type(input, '600')

      // Save changes
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      // Wait for save to complete and data to refresh
      await waitFor(() => {
        expect(screen.getByText('Budgeted: $600.00')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verify updated values
      expect(screen.getByText('$600.00')).toBeInTheDocument() // In table
      expect(screen.getByText('$476.51')).toBeInTheDocument() // Updated remaining

      // Verify we're out of edit mode
      expect(screen.queryByDisplayValue('600')).not.toBeInTheDocument()
      expect(screen.getByText('Edit Budget')).toBeInTheDocument()

      // Verify API calls
      expect(fetch).toHaveBeenCalledTimes(3)
      
      // First call - initial data load
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/budget')
      
      // Second call - PATCH request
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/budget', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budgetLineId: 'budget-line-1',
          budgetedAmount: 600
        })
      })

      // Third call - refetch after save
      expect(fetch).toHaveBeenNthCalledWith(3, '/api/budget')
    })

    it('should handle multiple budget lines edit workflow', async () => {
      const user = userEvent.setup()

      // Mock budget data with multiple lines
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            budget: {
              id: 'budget-1',
              name: 'Budget 8/2025',
              month: 8,
              year: 2025
            },
            budgetLines: [
              {
                id: 'budget-line-1',
                category: 'Groceries',
                budgetedAmount: 500,
                actualSpent: 123.49,
                remaining: 376.51
              },
              {
                id: 'budget-line-2',
                category: 'Utilities',
                budgetedAmount: 300,
                actualSpent: 0,
                remaining: 300
              }
            ]
          })
        })
        // Mock successful PATCH for Utilities
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'budget-line-2',
            category: 'Utilities',
            budgetedAmount: 350,
            actualSpent: 0,
            remaining: 350
          })
        })
        // Mock refetch after save
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            budget: {
              id: 'budget-1',
              name: 'Budget 8/2025',
              month: 8,
              year: 2025
            },
            budgetLines: [
              {
                id: 'budget-line-1',
                category: 'Groceries',
                budgetedAmount: 500,
                actualSpent: 123.49,
                remaining: 376.51
              },
              {
                id: 'budget-line-2',
                category: 'Utilities',
                budgetedAmount: 350,
                actualSpent: 0,
                remaining: 350
              }
            ]
          })
        })

      renderWithQueryClient(<BudgetPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Groceries')).toBeInTheDocument()
        expect(screen.getByText('Utilities')).toBeInTheDocument()
      })

      // Verify initial totals
      expect(screen.getByText('Budgeted: $800.00')).toBeInTheDocument() // 500 + 300

      // Edit the second budget line (Utilities)
      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[1]) // Second button for Utilities

      // Change Utilities budget from 300 to 350
      const input = screen.getByDisplayValue('300')
      await user.clear(input)
      await user.type(input, '350')

      // Save
      await user.click(screen.getByText('Save'))

      // Wait for update
      await waitFor(() => {
        expect(screen.getByText('Budgeted: $850.00')).toBeInTheDocument() // 500 + 350
      })

      // Verify the correct budget line was updated
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/budget', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budgetLineId: 'budget-line-2',
          budgetedAmount: 350
        })
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle API error gracefully during save', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Mock initial load success, then PATCH failure
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            budget: {
              id: 'budget-1',
              name: 'Budget 8/2025',
              month: 8,
              year: 2025
            },
            budgetLines: [
              {
                id: 'budget-line-1',
                category: 'Groceries',
                budgetedAmount: 500,
                actualSpent: 123.49,
                remaining: 376.51
              }
            ]
          })
        })
        // Mock PATCH failure
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Failed to update budget line' })
        })

      renderWithQueryClient(<BudgetPage />)

      // Wait for load
      await waitFor(() => {
        expect(screen.getByText('Budget 8/2025')).toBeInTheDocument()
      })

      // Start edit
      await user.click(screen.getByText('Edit Budget'))
      
      const input = screen.getByDisplayValue('500')
      await user.clear(input)
      await user.type(input, '600')

      // Try to save (should fail)
      await user.click(screen.getByText('Save'))

      // Should stay in edit mode due to error
      await waitFor(() => {
        expect(screen.getByDisplayValue('600')).toBeInTheDocument()
      })

      // Original values should remain
      expect(screen.getByText('Budgeted: $500.00')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should handle network error during initial load', async () => {
      // Mock network failure
      fetch.mockRejectedValueOnce(new Error('Network error'))

      renderWithQueryClient(<BudgetPage />)

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/Error loading budget/)).toBeInTheDocument()
      })
    })
  })

  describe('User Experience Integration', () => {
    it('should show loading states during save operation', async () => {
      const user = userEvent.setup()

      // Mock initial load
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          budget: {
            id: 'budget-1',
            name: 'Budget 8/2025',
            month: 8,
            year: 2025
          },
          budgetLines: [
            {
              id: 'budget-line-1',
              category: 'Groceries',
              budgetedAmount: 500,
              actualSpent: 123.49,
              remaining: 376.51
            }
          ]
        })
      })

      // Mock slow PATCH response
      const slowResponse = new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({
              id: 'budget-line-1',
              category: 'Groceries',
              budgetedAmount: 600,
              actualSpent: 123.49,
              remaining: 476.51
            })
          })
        }, 100)
      })

      fetch.mockImplementationOnce(() => slowResponse)

      renderWithQueryClient(<BudgetPage />)

      await waitFor(() => {
        expect(screen.getByText('Budget 8/2025')).toBeInTheDocument()
      })

      // Start edit and save
      await user.click(screen.getByText('Edit Budget'))
      const input = screen.getByDisplayValue('500')
      await user.clear(input)
      await user.type(input, '600')
      await user.click(screen.getByText('Save'))

      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument()

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should prevent multiple edits simultaneously', async () => {
      const user = userEvent.setup()

      // Mock data with multiple budget lines
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          budget: {
            id: 'budget-1',
            name: 'Budget 8/2025',
            month: 8,
            year: 2025
          },
          budgetLines: [
            {
              id: 'budget-line-1',
              category: 'Groceries',
              budgetedAmount: 500,
              actualSpent: 100,
              remaining: 400
            },
            {
              id: 'budget-line-2',
              category: 'Utilities',
              budgetedAmount: 300,
              actualSpent: 0,
              remaining: 300
            }
          ]
        })
      })

      renderWithQueryClient(<BudgetPage />)

      await waitFor(() => {
        expect(screen.getByText('Groceries')).toBeInTheDocument()
      })

      // Start editing first budget line
      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[0])

      // Should show edit mode for first line
      expect(screen.getByDisplayValue('500')).toBeInTheDocument()

      // Should only have 2 edit buttons remaining (not 3)
      expect(screen.getAllByText('Edit Budget')).toHaveLength(1)
    })
  })

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across edit operations', async () => {
      const user = userEvent.setup()

      // Initial data
      const initialData = {
        budget: {
          id: 'budget-1',
          name: 'Budget 8/2025',
          month: 8,
          year: 2025
        },
        budgetLines: [
          {
            id: 'budget-line-1',
            category: 'Groceries',
            budgetedAmount: 500,
            actualSpent: 123.49,
            remaining: 376.51
          }
        ]
      }

      // Updated data after edit
      const updatedData = {
        ...initialData,
        budgetLines: [
          {
            id: 'budget-line-1',
            category: 'Groceries',
            budgetedAmount: 600,
            actualSpent: 123.49,
            remaining: 476.51
          }
        ]
      }

      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => initialData })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'budget-line-1',
            category: 'Groceries',
            budgetedAmount: 600,
            actualSpent: 123.49,
            remaining: 476.51
          })
        })
        .mockResolvedValueOnce({ ok: true, json: async () => updatedData })

      renderWithQueryClient(<BudgetPage />)

      // Verify initial state
      await waitFor(() => {
        expect(screen.getByText('Budgeted: $500.00')).toBeInTheDocument()
        expect(screen.getByText('Remaining: $376.51')).toBeInTheDocument()
      })

      // Edit and save
      await user.click(screen.getByText('Edit Budget'))
      const input = screen.getByDisplayValue('500')
      await user.clear(input)
      await user.type(input, '600')
      await user.click(screen.getByText('Save'))

      // Verify all calculations updated consistently
      await waitFor(() => {
        expect(screen.getByText('Budgeted: $600.00')).toBeInTheDocument()
        expect(screen.getByText('Remaining: $476.51')).toBeInTheDocument()
        expect(screen.getByText('Spent: $123.49')).toBeInTheDocument()
      })

      // Verify percentage calculation (123.49/600 ≈ 20.58%)
      expect(screen.getByText('21%')).toBeInTheDocument() // Rounded
    })
  })
})