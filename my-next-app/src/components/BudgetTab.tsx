'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import TransactionForm from './TransactionForm'
import Modal from './Modal'
import CategoryForm from './CategoryForm'
import { useTheme } from '../contexts/ThemeContext'

interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  budgetLineId: string
}

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
  const { effectiveTheme } = useTheme()
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingBudgetLineId, setEditingBudgetLineId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<number>(0)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState<string>('')
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null)
  const [addingCategoryId, setAddingCategoryId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [categoryTransactions, setCategoryTransactions] = useState<Record<string, Transaction[]>>({})
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null)
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
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingBudgetLineId(null) // Exit edit mode
    }
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ budgetLineId, category }: { budgetLineId: string; category: string }) => {
      const response = await fetch('/api/budget/category', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budgetLineId, category }),
      })
      if (!response.ok) {
        throw new Error('Failed to update category name')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingCategoryId(null) // Exit edit mode
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
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })

  const handleTransactionAdded = () => {
    refetch() // Refresh budget data when new transaction is added
    setShowTransactionModal(false)
  }

  const handleCategoryAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
    setAddingCategoryId(null)
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

  const startEditingCategory = (budgetLine: BudgetLine) => {
    setEditingCategoryId(budgetLine.id)
    setEditCategoryName(budgetLine.category)
  }

  const cancelCategoryEditing = () => {
    setEditingCategoryId(null)
    setEditCategoryName('')
  }

  const saveCategoryEdit = () => {
    if (editingCategoryId && editCategoryName.trim()) {
      updateCategoryMutation.mutate({
        budgetLineId: editingCategoryId,
        category: editCategoryName.trim()
      })
    }
  }

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveCategoryEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelCategoryEditing()
    }
  }

  const handleBudgetAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    }
  }

  const openTransactionModal = (budgetId: string, category?: string) => {
    setSelectedBudgetId(budgetId)
    setSelectedCategory(category || null)
    setShowTransactionModal(true)
  }

  const toggleCategoryExpansion = async (budgetLineId: string) => {
    const newExpanded = new Set(expandedCategories)
    
    if (expandedCategories.has(budgetLineId)) {
      newExpanded.delete(budgetLineId)
    } else {
      newExpanded.add(budgetLineId)
      
      // Fetch transactions if not already loaded
      if (!categoryTransactions[budgetLineId]) {
        try {
          const response = await fetch(`/api/budget/transactions?budgetLineId=${budgetLineId}`)
          if (response.ok) {
            const transactions = await response.json()
            setCategoryTransactions(prev => ({
              ...prev,
              [budgetLineId]: transactions
            }))
          }
        } catch (error) {
          console.error('Error fetching transactions:', error)
        }
      }
    }
    
    setExpandedCategories(newExpanded)
  }

  const exportToCSV = (budget: BudgetData) => {
    const headers = ['Category', 'Budgeted Amount', 'Actual Spent', 'Remaining', 'Percentage Spent']
    const csvRows = [headers.join(',')]
    
    budget.budgetLines.forEach(line => {
      const percentSpent = ((line.actualSpent / line.budgetedAmount) * 100).toFixed(1)
      const row = [
        `"${line.category}"`,
        line.budgetedAmount.toFixed(2),
        line.actualSpent.toFixed(2),
        line.remaining.toFixed(2),
        `${percentSpent}%`
      ]
      csvRows.push(row.join(','))
    })

    // Add totals row
    const totalBudgeted = budget.budgetLines.reduce((sum, line) => sum + line.budgetedAmount, 0)
    const totalSpent = budget.budgetLines.reduce((sum, line) => sum + line.actualSpent, 0)
    const totalRemaining = totalBudgeted - totalSpent
    const totalPercent = ((totalSpent / totalBudgeted) * 100).toFixed(1)
    
    csvRows.push(['']) // Empty row
    csvRows.push(['"TOTALS"', totalBudgeted.toFixed(2), totalSpent.toFixed(2), totalRemaining.toFixed(2), `${totalPercent}%`])

    const csvString = csvRows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${budget.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_budget.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setShowExportMenu(null)
  }

  const exportToJSON = (budget: BudgetData) => {
    const exportData = {
      budgetInfo: {
        id: budget.id,
        name: budget.name,
        month: budget.month,
        year: budget.year,
        exportDate: new Date().toISOString()
      },
      summary: {
        totalBudgeted: budget.budgetLines.reduce((sum, line) => sum + line.budgetedAmount, 0),
        totalSpent: budget.budgetLines.reduce((sum, line) => sum + line.actualSpent, 0),
        totalRemaining: budget.budgetLines.reduce((sum, line) => sum + (line.budgetedAmount - line.actualSpent), 0),
        categoryCount: budget.budgetLines.length
      },
      categories: budget.budgetLines.map(line => ({
        id: line.id,
        category: line.category,
        budgetedAmount: line.budgetedAmount,
        actualSpent: line.actualSpent,
        remaining: line.remaining,
        percentageSpent: ((line.actualSpent / line.budgetedAmount) * 100).toFixed(1),
        status: line.remaining < 0 ? 'over-budget' : line.actualSpent / line.budgetedAmount > 0.8 ? 'warning' : 'on-track'
      }))
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${budget.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_budget.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setShowExportMenu(null)
  }

  if (isLoading) return <div className={`p-8 ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Loading budgets...</div>
  if (error) return <div className={`p-8 ${effectiveTheme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>Error loading budgets: {String(error)}</div>
  if (!budgets || budgets.length === 0) return <div className={`p-8 ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>No budget data found</div>

  const selectedBudget = budgets.find(b => b.id === selectedBudgetId)

  return (
    <div className="max-w-4xl mx-auto p-6 bg-transparent">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Your Budgets</h1>
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
            <details key={budget.id} className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-lg overflow-hidden`} open={index === 0}>
              <summary className={`p-6 cursor-pointer ${effectiveTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h2 className={`text-2xl font-bold ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {budget.name}
                    </h2>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setAddingCategoryId(addingCategoryId === budget.id ? null : budget.id)
                      }}
                      className="text-green-600 hover:text-green-800"
                      aria-label="Add category"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setShowExportMenu(showExportMenu === budget.id ? null : budget.id)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label="Export budget"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      {showExportMenu === budget.id && (
                        <div className={`absolute top-8 right-0 mt-1 w-32 rounded-md shadow-lg ${effectiveTheme === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'} ring-1 ring-black ring-opacity-5 z-10`}>
                          <div className="py-1" role="menu">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                exportToCSV(budget)
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${effectiveTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                              role="menuitem"
                            >
                              Export as CSV
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                exportToJSON(budget)
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${effectiveTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                              role="menuitem"
                            >
                              Export as JSON
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
              <div className={`p-6 border-t ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                {addingCategoryId === budget.id && (
                  <div className="mb-6">
                    <CategoryForm budgetId={budget.id} onCategoryAdded={handleCategoryAdded} />
                  </div>
                )}
                <table className="w-full mb-6">
                  <thead className={`${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Category</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Budgeted</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Spent</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Remaining</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Progress</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`${effectiveTheme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                    {budget.budgetLines.map((line) => {
                      const percentSpent = (line.actualSpent / line.budgetedAmount) * 100
                      const isOverBudget = line.remaining < 0

                      return (
                        <>
                          <tr key={line.id} className={`${effectiveTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                              <div className="flex items-center">
                                <button
                                  onClick={() => toggleCategoryExpansion(line.id)}
                                  className={`mr-2 p-1 rounded hover:bg-gray-200 ${effectiveTheme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                                  title={expandedCategories.has(line.id) ? 'Hide transactions' : 'Show transactions'}
                                >
                                  <svg
                                    className={`w-4 h-4 transition-transform ${expandedCategories.has(line.id) ? 'rotate-90' : ''} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                {editingCategoryId === line.id ? (
                                  <input
                                    type="text"
                                    value={editCategoryName}
                                    onChange={(e) => setEditCategoryName(e.target.value)}
                                    onKeyDown={handleCategoryKeyDown}
                                    className={`flex-1 px-2 py-1 border ${effectiveTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="Category name (Enter to save, Esc to cancel)"
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    onClick={() => startEditingCategory(line)}
                                    className="text-left hover:text-blue-600 hover:underline focus:outline-none focus:text-blue-600 focus:underline"
                                  >
                                    {line.category}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {editingBudgetLineId === line.id ? (
                                <div className="flex items-center gap-2">
                                  <span className={`${effectiveTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>$</span>
                                  <input
                                    type="number"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                                    onKeyDown={handleBudgetAmountKeyDown}
                                    className={`w-20 px-2 py-1 border ${effectiveTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditing(line)}
                                  className="text-left hover:text-blue-600 hover:underline focus:outline-none focus:text-blue-600 focus:underline"
                                >
                                  ${line.budgetedAmount.toFixed(2)}
                                </button>
                              )}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>${line.actualSpent.toFixed(2)}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                              ${line.remaining.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-16 ${effectiveTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                                  <div 
                                    className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : percentSpent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(percentSpent, 100)}%` }}
                                  />
                                </div>
                                <span className={`ml-2 text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{percentSpent.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button onClick={() => openTransactionModal(budget.id, line.category)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedCategories.has(line.id) && (
                            <tr>
                              <td colSpan={6} className={`px-6 py-0 ${effectiveTheme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                                <div className="py-4">
                                  <h4 className={`text-sm font-medium mb-3 ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Transactions for {line.category}
                                  </h4>
                                  {categoryTransactions[line.id] && categoryTransactions[line.id].length > 0 ? (
                                    <div className="space-y-2">
                                      {categoryTransactions[line.id].map((transaction) => (
                                        <div
                                          key={transaction.id}
                                          className={`flex justify-between items-center p-3 rounded-lg ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'} border ${effectiveTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                                        >
                                          <div className="flex-1">
                                            <div className={`font-medium ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                              {transaction.description}
                                            </div>
                                            <div className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                              {new Date(transaction.date).toLocaleDateString()}
                                            </div>
                                          </div>
                                          <div className={`font-semibold ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                            ${transaction.amount.toFixed(2)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} italic`}>
                                      No transactions found for this category.
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
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
            budgetId={selectedBudget.id}
            budgetLines={selectedBudget.budgetLines}
            onTransactionAdded={handleTransactionAdded}
            preselectedCategory={selectedCategory || undefined}
          />
        </Modal>
      )}
    </div>
  )
}
