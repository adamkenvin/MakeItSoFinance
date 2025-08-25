'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'

interface BudgetLine {
  id: string
  category: string
  budgetedAmount: number
  actualSpent: number
  remaining: number
}

interface Budget {
  id: string
  name: string
  month: number
  year: number
}

interface BudgetData {
  budget: Budget
  budgetLines: BudgetLine[]
}

export default function BudgetTab() {
  const [editingBudgetLineId, setEditingBudgetLineId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<number>(0)

  const { data, isLoading, error, refetch } = useQuery<BudgetData>({
    queryKey: ['budget'],
    queryFn: async () => {
      const response = await fetch('/api/budget')
      if (!response.ok) {
        throw new Error('Failed to fetch budget')
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
      refetch() // Refresh the budget data after successful update
      setEditingBudgetLineId(null) // Exit edit mode
    }
  })

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

  if (isLoading) return <div className="p-8 text-gray-900">Loading budget...</div>
  if (error) return <div className="p-8 text-red-500">Error loading budget: {String(error)}</div>
  if (!data) return <div className="p-8">No budget data found</div>

  const totalBudgeted = data.budgetLines.reduce((sum, line) => sum + line.budgetedAmount, 0)
  const totalSpent = data.budgetLines.reduce((sum, line) => sum + line.actualSpent, 0)
  const totalRemaining = totalBudgeted - totalSpent

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {data.budget.name}
        </h1>
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

      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budgeted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Spent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remaining
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.budgetLines.map((line) => {
              const percentSpent = (line.actualSpent / line.budgetedAmount) * 100
              const isOverBudget = line.remaining < 0
              
              return (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {line.category}
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${line.actualSpent.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    isOverBudget ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ${line.remaining.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            isOverBudget ? 'bg-red-500' : percentSpent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentSpent, 100)}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {percentSpent.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingBudgetLineId === line.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={updateBudgetMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium"
                        >
                          {updateBudgetMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(line)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                      >
                        Edit Budget
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => refetch()}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
