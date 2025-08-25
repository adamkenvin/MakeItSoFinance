'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import TransactionForm from './TransactionForm'

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

export default function BudgetPage() {
  const [showTransactionForm, setShowTransactionForm] = useState(false)

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

  const handleTransactionAdded = () => {
    refetch() // Refresh budget data when new transaction is added
    setShowTransactionForm(false)
  }

  if (isLoading) return <div className="p-8">Loading budget...</div>
  if (error) return <div className="p-8 text-red-500">Error loading budget: {String(error)}</div>
  if (!data) return <div className="p-8">No budget data found</div>

  const totalBudgeted = data.budgetLines.reduce((sum, line) => sum + line.budgetedAmount, 0)
  const totalSpent = data.budgetLines.reduce((sum, line) => sum + line.actualSpent, 0)
  const totalRemaining = totalBudgeted - totalSpent

  return (
    <div className="max-w-4xl mx-auto p-6">
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
                    ${line.budgetedAmount.toFixed(2)}
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
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowTransactionForm(!showTransactionForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showTransactionForm ? 'Cancel' : 'Add Transaction'}
        </button>
        <button
          onClick={() => refetch()}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>

      {showTransactionForm && (
        <TransactionForm 
          budgetLines={data.budgetLines}
          onTransactionAdded={handleTransactionAdded}
        />
      )}
    </div>
  )
}