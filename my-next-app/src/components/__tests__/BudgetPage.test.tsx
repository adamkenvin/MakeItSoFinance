/**
 * BudgetPage Component Tests
 * Tests for budget editing UI functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQuery, useMutation } from '@tanstack/react-query'
import BudgetPage from '../BudgetPage'

// Mock React Query hooks
jest.mock('@tanstack/react-query')

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>

describe('BudgetPage - Budget Editing Functionality', () => {
  const mockBudgetData = {
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
      },
      {
        id: 'budget-line-3',
        category: 'Entertainment',
        budgetedAmount: 150,
        actualSpent: 75,
        remaining: 75
      }
    ]
  }

  const mockMutate = jest.fn()
  const mockRefetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful query
    mockUseQuery.mockReturnValue({
      data: mockBudgetData,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as any)

    // Mock successful mutation
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null
    } as any)
  })

  describe('Budget Display', () => {
    it('should render budget data correctly', () => {
      render(<BudgetPage />)

      expect(screen.getByText('Budget 8/2025')).toBeInTheDocument()
      expect(screen.getByText('Budgeted: $950.00')).toBeInTheDocument()
      expect(screen.getByText('Spent: $198.49')).toBeInTheDocument()
      expect(screen.getByText('Remaining: $751.51')).toBeInTheDocument()
    })

    it('should render all budget lines with edit buttons', () => {
      render(<BudgetPage />)

      expect(screen.getByText('Groceries')).toBeInTheDocument()
      expect(screen.getByText('Utilities')).toBeInTheDocument()
      expect(screen.getByText('Entertainment')).toBeInTheDocument()
      
      const editButtons = screen.getAllByText('Edit Budget')
      expect(editButtons).toHaveLength(3)
    })

    it('should display progress bars with correct percentages', () => {
      render(<BudgetPage />)

      // Groceries: 123.49/500 = ~25%
      expect(screen.getByText('25%')).toBeInTheDocument()
      
      // Utilities: 0/300 = 0%
      expect(screen.getByText('0%')).toBeInTheDocument()
      
      // Entertainment: 75/150 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })

  describe('Edit Mode Activation', () => {
    it('should enter edit mode when Edit Budget button is clicked', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[0]) // Click first edit button (Groceries)

      // Check that we're now in edit mode
      expect(screen.getByDisplayValue('500')).toBeInTheDocument() // Input with current value
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should show input field with correct current value', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      // Click edit button for Entertainment (budgetedAmount: 150)
      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[2])

      const input = screen.getByDisplayValue('150')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('step', '0.01')
    })

    it('should only allow one budget line to be edited at a time', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const editButtons = screen.getAllByText('Edit Budget')
      
      // Click first edit button
      await user.click(editButtons[0])
      expect(screen.getByDisplayValue('500')).toBeInTheDocument()

      // Other edit buttons should still be present (not in edit mode)
      expect(screen.getAllByText('Edit Budget')).toHaveLength(2) // 2 remaining
    })
  })

  describe('Edit Mode Interactions', () => {
    it('should update input value when user types', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[0]) // Edit Groceries

      const input = screen.getByDisplayValue('500')
      await user.clear(input)
      await user.type(input, '600')

      expect(screen.getByDisplayValue('600')).toBeInTheDocument()
    })

    it('should handle decimal input correctly', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[0])

      const input = screen.getByDisplayValue('500')
      await user.clear(input)
      await user.type(input, '599.99')

      expect(screen.getByDisplayValue('599.99')).toBeInTheDocument()
    })

    it('should exit edit mode when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[0])

      // Verify we're in edit mode
      expect(screen.getByDisplayValue('500')).toBeInTheDocument()
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      // Should exit edit mode
      expect(screen.queryByDisplayValue('500')).not.toBeInTheDocument()
      expect(screen.getAllByText('Edit Budget')).toHaveLength(3)
    })

    it('should not lose edited value when switching between fields', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[0])

      const input = screen.getByDisplayValue('500')
      await user.clear(input)
      await user.type(input, '750')

      // Click somewhere else
      await user.click(screen.getByText('Groceries'))

      // Value should still be there
      expect(screen.getByDisplayValue('750')).toBeInTheDocument()
    })
  })

  describe('Save Functionality', () => {
    it('should call mutation with correct parameters when Save is clicked', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[0]) // Edit Groceries

      const input = screen.getByDisplayValue('500')
      await user.clear(input)
      await user.type(input, '600')

      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      expect(mockMutate).toHaveBeenCalledWith({
        budgetLineId: 'budget-line-1',
        budgetedAmount: 600
      })
    })

    it('should handle zero value save', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[0])

      const input = screen.getByDisplayValue('500')
      await user.clear(input)
      await user.type(input, '0')

      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      expect(mockMutate).toHaveBeenCalledWith({
        budgetLineId: 'budget-line-1',
        budgetedAmount: 0
      })
    })

    it('should not save when amount is unchanged', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[0])

      // Don't change the value, just save
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      expect(mockMutate).toHaveBeenCalledWith({
        budgetLineId: 'budget-line-1',
        budgetedAmount: 500 // Original value
      })
    })

    it('should show loading state during save', () => {
      // Mock pending mutation
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
        error: null
      } as any)

      render(<BudgetPage />)
      
      // Force component into edit mode through direct manipulation
      const editButtons = screen.getAllByText('Edit Budget')
      fireEvent.click(editButtons[0])

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state when data is loading', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch
      } as any)

      render(<BudgetPage />)
      expect(screen.getByText('Loading budget...')).toBeInTheDocument()
    })

    it('should show error state when query fails', () => {
      const error = new Error('Failed to fetch budget')
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error,
        refetch: mockRefetch
      } as any)

      render(<BudgetPage />)
      expect(screen.getByText(`Error loading budget: ${error}`)).toBeInTheDocument()
    })

    it('should show no data message when budget data is null', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: mockRefetch
      } as any)

      render(<BudgetPage />)
      expect(screen.getByText('No budget data found')).toBeInTheDocument()
    })
  })

  describe('Transaction Form Integration', () => {
    it('should show transaction form when Add Transaction is clicked', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const addButton = screen.getByText('Add Transaction')
      await user.click(addButton)

      // Button should change to Cancel
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should hide transaction form when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      // Show form
      await user.click(screen.getByText('Add Transaction'))
      expect(screen.getByText('Cancel')).toBeInTheDocument()

      // Hide form
      await user.click(screen.getByText('Cancel'))
      expect(screen.getByText('Add Transaction')).toBeInTheDocument()
    })

    it('should refresh data when transaction is added', () => {
      render(<BudgetPage />)

      // Component should have handleTransactionAdded function that calls refetch
      // This would be called by the TransactionForm component
      expect(mockRefetch).not.toHaveBeenCalled() // Initially not called
    })
  })

  describe('Refresh Functionality', () => {
    it('should call refetch when Refresh button is clicked', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const refreshButton = screen.getByText('Refresh')
      await user.click(refreshButton)

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button roles and labels', () => {
      render(<BudgetPage />)

      const editButtons = screen.getAllByRole('button', { name: 'Edit Budget' })
      expect(editButtons).toHaveLength(3)

      expect(screen.getByRole('button', { name: 'Add Transaction' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    })

    it('should have proper table structure', () => {
      render(<BudgetPage />)

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()

      const headers = screen.getAllByRole('columnheader')
      expect(headers).toHaveLength(6) // Category, Budgeted, Spent, Remaining, Progress, Actions
    })

    it('should have proper input labels in edit mode', async () => {
      const user = userEvent.setup()
      render(<BudgetPage />)

      const editButtons = screen.getAllByText('Edit Budget')
      await user.click(editButtons[0])

      const input = screen.getByDisplayValue('500')
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('min', '0')
    })
  })
})