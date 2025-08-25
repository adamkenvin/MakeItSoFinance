'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import TransactionForm from './TransactionForm'
import Modal from './Modal'

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
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    description: '',
    amount: 0,
    category: '',
    date: ''
  })
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
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
    setShowTransactionModal(false)
  }

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async (transactionData: { id: string; description: string; amount: number; category: string; date: string }) => {
      const response = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })
      if (!response.ok) {
        throw new Error('Failed to update transaction')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budget'] })
      setEditingTransactionId(null)
    }
  })

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete transaction')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budget'] })
      setDeleteConfirmId(null)
    }
  })

  const startEditing = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id)
    // Ensure date is properly formatted for input field (YYYY-MM-DD)
    const dateOnly = transaction.date.includes('T') 
      ? transaction.date.split('T')[0] 
      : transaction.date
    setEditFormData({
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: dateOnly
    })
  }

  const cancelEditing = () => {
    setEditingTransactionId(null)
    setEditFormData({ description: '', amount: 0, category: '', date: '' })
  }

  const saveEdit = () => {
    if (editingTransactionId) {
      updateTransactionMutation.mutate({
        id: editingTransactionId,
        ...editFormData
      })
    }
  }

  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteTransactionMutation.mutate(deleteConfirmId)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const formatDate = (dateString: string) => {
    // Handle different date string formats
    let date: Date
    
    if (dateString.includes('T')) {
      // ISO datetime string
      date = new Date(dateString)
    } else {
      // Date-only string, treat as local date
      date = new Date(dateString + 'T00:00:00')
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    
    return date.toLocaleDateString('en-US', {
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
          onClick={() => setShowTransactionModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Transaction
        </button>
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title="Add New Transaction"
        maxWidth="3xl"
      >
        {budgetData && (
          <TransactionForm 
            budgetLines={budgetData.budgetLines}
            onTransactionAdded={handleTransactionAdded}
          />
        )}
      </Modal>

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactionsData.map((transaction) => {
                  const isEditing = editingTransactionId === transaction.id
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editFormData.date}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          formatDate(transaction.date)
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Description"
                          />
                        ) : (
                          <div className="max-w-xs truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isEditing ? (
                          <select
                            value={editFormData.category}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select category</option>
                            {budgetData?.budgetLines.map((line) => (
                              <option key={line.id} value={line.category}>
                                {line.category}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {transaction.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {isEditing ? (
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-1">$</span>
                            <input
                              type="number"
                              value={editFormData.amount}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        ) : (
                          formatCurrency(transaction.amount)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={updateTransactionMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium"
                            >
                              {updateTransactionMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(transaction)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(transaction.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium flex items-center"
                              title="Delete transaction"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Transaction</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteTransactionMutation.isPending}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
              >
                {deleteTransactionMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
