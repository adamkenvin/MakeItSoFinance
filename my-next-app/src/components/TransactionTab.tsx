'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import TransactionForm from './TransactionForm'

interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
}

interface BudgetLine {
  id: string
  category: string
  budgetedAmount: number
  actualSpent: number
  remaining: number
}

interface BudgetData {
  budget: {
    id: string
    name: string
    month: number
    year: number
  }
  budgetLines: BudgetLine[]
}

export default function TransactionTab() {
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const queryClient = useQueryClient()

  // Fetch transactions
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions')
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      const data = await response.json()
      return data.transactions as Transaction[]
    }
  })

  // Fetch budget data for the transaction form
  const { data: budgetData } = useQuery<BudgetData>({
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
    // Refresh both transactions and budget data
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['budget'] })
    setShowTransactionForm(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  return (
    <div>
      {/* Header with Add Transaction Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => setShowTransactionForm(!showTransactionForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showTransactionForm ? 'Cancel' : 'Add Transaction'}
        </button>
      </div>

      {/* Transaction Form */}
      {showTransactionForm && budgetData && (
        <div className="mb-6">
          <TransactionForm 
            budgetLines={budgetData.budgetLines}
            onTransactionAdded={handleTransactionAdded}
          />
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>

        {transactionsLoading && (
          <div className="p-8 text-center text-gray-500">Loading transactions...</div>
        )}

        {transactionsError && (
          <div className="p-8 text-center text-red-500">
            Error loading transactions: {String(transactionsError)}
          </div>
        )}

        {transactionsData && transactionsData.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No transactions found. Add your first transaction above!
          </div>
        )}

        {transactionsData && transactionsData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactionsData.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {transactionsData && transactionsData.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Showing {transactionsData.length} recent transactions</span>
              <span>
                Total: {formatCurrency(transactionsData.reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
