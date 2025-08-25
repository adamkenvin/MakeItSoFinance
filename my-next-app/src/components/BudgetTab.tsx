'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import TransactionForm from './TransactionForm'
import Modal from './Modal'

interface BudgetLine {
  id: string
  category: string
  budgetedAmount: number
  actualSpent: number
  remaining: number
}

interface BudgetData {
  id: string
  name: string
  month: number
  year: number
  budgetLines: BudgetLine[]
}

export default function BudgetTab() {
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingBudgetLineId, setEditingBudgetLineId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<number>(0)
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: budgets, isLoading, error, refetch } = useQuery<BudgetData[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await fetch('/api/budget')
      if (!response.ok) {
        throw new Error('Failed to fetch budgets')
      }
      return response.json()
    }
  })

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ budgetLineId, budgetedAmount }: { budgetLineId: string; budgetedAmount: number }) => {
      const response = await fetch('/api/budget', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budgetLineId, budgetedAmount }),
      })
      if (!response.ok) {
        throw new Error('Failed to update budget')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setEditingBudgetLineId(null) // Exit edit mode
    }
  })

  const createBudgetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Failed to create new budget')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    }
  })

  const handleTransactionAdded = () => {
    refetch() // Refresh budget data when new transaction is added
    setShowTransactionModal(false)
  }

  const startEditing = (budgetLine: BudgetLine) => {
    setEditingBudgetLineId(budgetLine.id)
    setEditAmount(budgetLine.budgetedAmount)
  }

  const cancelEditing = () => {
    setEditingBudgetLineId(null)
    setEditAmount(0)
  }

  const saveEdit = () => {
    if (editingBudgetLineId && editAmount >= 0) {
      updateBudgetMutation.mutate({
        budgetLineId: editingBudgetLineId,
        budgetedAmount: editAmount
      })
    }
  }

  const openTransactionModal = (budgetId: string, category?: string) => {
    setSelectedBudgetId(budgetId)
    setSelectedCategory(category || null)
    setShowTransactionModal(true)
  }

  if (isLoading) return <div className="p-8 text-gray-900">Loading budgets...</div>
  if (error) return <div className="p-8 text-red-500">Error loading budgets: {String(error)}</div>
  if (!budgets || budgets.length === 0) return <div className="p-8">No budget data found</div>

  const selectedBudget = budgets.find(b => b.id === selectedBudgetId)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Budgets</h1>
        <button
          onClick={() => createBudgetMutation.mutate()}
          disabled={createBudgetMutation.isPending}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded"
        >
          {createBudgetMutation.isPending ? 'Creating...' : 'Create New Budget'}
        </button>
      </div>

      <div className="space-y-4">
        {budgets.map((budget, index) => {
          const totalBudgeted = budget.budgetLines.reduce((sum, line) => sum + line.budgetedAmount, 0)
          const totalSpent = budget.budgetLines.reduce((sum, line) => sum + line.actualSpent, 0)
          const totalRemaining = totalBudgeted - totalSpent

          return (
            <details key={budget.id} className="bg-white shadow-lg rounded-lg overflow-hidden" open={index === 0}>
              <summary className="p-6 cursor-pointer hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {budget.name}
                  </h2>
                  <div className="flex gap-6 text-lg">
                    <span className="text-blue-600 font-semibold">
                      Budgeted: ${totalBudgeted.toFixed(2)}
                    </span>
                    <span className="text-red-600 font-semibold">
                      Spent: ${totalSpent.toFixed(2)}
                    </span>
                    <span className={`font-semibold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Remaining: ${totalRemaining.toFixed(2)}
                    </span>
                  </div>
                </div>
              </summary>
              <div className="p-6 border-t border-gray-200">
                <table className="w-full mb-6">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budgeted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {budget.budgetLines.map((line) => {
                      const percentSpent = (line.actualSpent / line.budgetedAmount) * 100
                      const isOverBudget = line.remaining < 0

                      return (
                        <tr key={line.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{line.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingBudgetLineId === line.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">$</span>
                                <input
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            ) : (
                              `$${line.budgetedAmount.toFixed(2)}`
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${line.actualSpent.toFixed(2)}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            ${line.remaining.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : percentSpent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(percentSpent, 100)}%` }}
                                />
                              </div>
                              <span className="ml-2 text-sm text-gray-500">{percentSpent.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {editingBudgetLineId === line.id ? (
                              <div className="flex gap-2">
                                <button onClick={saveEdit} disabled={updateBudgetMutation.isPending} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium">
                                  {updateBudgetMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                                <button onClick={cancelEditing} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium">
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => startEditing(line)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium">
                                  Edit Budget
                                </button>
                                <button onClick={() => openTransactionModal(budget.id, line.category)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          )
        })}
      </div>

      {/* Transaction Modal */}
      {selectedBudget && (
        <Modal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          title={`Add New Transaction to ${selectedBudget.name}`}
          maxWidth="3xl"
        >
          <TransactionForm 
            budgetLines={selectedBudget.budgetLines}
            onTransactionAdded={handleTransactionAdded}
            budgetId={selectedBudget.id}
            preselectedCategory={selectedCategory || undefined}
          />
        </Modal>
      )}
    </div>
  )
}