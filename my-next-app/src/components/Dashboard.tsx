'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useTheme } from '../contexts/ThemeContext'
import TransactionForm from './TransactionForm'
import Modal from './Modal'
import CategoryForm from './CategoryForm'

interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  budgetLineId: string | null
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

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#82CA9D', '#FFC658', '#FF7300',
  '#00FF00', '#FF1493', '#32CD32', '#FFD700'
]

export default function Dashboard() {
  const { effectiveTheme } = useTheme()
  const queryClient = useQueryClient()
  
  // Budget selection state
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('')
  
  // Budget management state
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingBudgetLineId, setEditingBudgetLineId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<number>(0)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState<string>('')
  const [addingCategoryId, setAddingCategoryId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

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

  // Set the first budget as selected by default if none is selected
  useEffect(() => {
    if (budgets && budgets.length > 0 && !selectedBudgetId) {
      setSelectedBudgetId(budgets[0].id)
    }
  }, [budgets, selectedBudgetId])

  // Budget mutations
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ budgetLineId, budgetedAmount }: { budgetLineId: string; budgetedAmount: number }) => {
      const response = await fetch('/api/budget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetLineId, budgetedAmount }),
      })
      if (!response.ok) throw new Error('Failed to update budget')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingBudgetLineId(null)
    }
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ budgetLineId, category }: { budgetLineId: string; category: string }) => {
      const response = await fetch('/api/budget/category', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetLineId, category }),
      })
      if (!response.ok) throw new Error('Failed to update category name')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingCategoryId(null)
    }
  })

  const createBudgetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to create new budget')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })

  // Budget management handlers
  const handleTransactionAdded = () => {
    refetch()
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

  const handleBudgetKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    }
  }

  const openTransactionModal = (category?: string) => {
    setSelectedCategory(category || null)
    setShowTransactionModal(true)
  }

  // Fetch transactions for all expanded categories
  const expandedCategoriesArray = Array.from(expandedCategories)
  const transactionQueries = useQuery<Record<string, Transaction[]>>({
    queryKey: ['transactions', expandedCategoriesArray],
    queryFn: async () => {
      const results: Record<string, Transaction[]> = {}
      
      await Promise.all(
        expandedCategoriesArray.map(async (budgetLineId) => {
          try {
            const response = await fetch(`/api/budget/transactions?budgetLineId=${budgetLineId}`)
            if (response.ok) {
              results[budgetLineId] = await response.json()
            } else {
              results[budgetLineId] = []
            }
          } catch (error) {
            console.error(`Failed to fetch transactions for ${budgetLineId}:`, error)
            results[budgetLineId] = []
          }
        })
      )
      
      return results
    },
    enabled: expandedCategoriesArray.length > 0
  })

  // Toggle category expansion
  const toggleCategoryExpansion = (budgetLineId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(budgetLineId)) {
      newExpanded.delete(budgetLineId)
    } else {
      newExpanded.add(budgetLineId)
    }
    setExpandedCategories(newExpanded)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
        <div className="text-xl">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${effectiveTheme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
        <div className="text-xl">Error loading dashboard: {String(error)}</div>
      </div>
    )
  }

  if (!budgets || budgets.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
        <div className="text-xl">No budget data found</div>
      </div>
    )
  }

  // Get the selected budget or default to first
  const currentBudget = budgets.find(b => b.id === selectedBudgetId) || budgets[0]
  
  // Prepare data for bar chart (Budget vs Spending)
  const barChartData = currentBudget.budgetLines.map(line => ({
    category: line.category.length > 10 ? line.category.substring(0, 10) + '...' : line.category,
    budgeted: line.budgetedAmount,
    spent: line.actualSpent,
    remaining: line.remaining
  }))

  // Prepare data for pie chart (Spending distribution)
  const pieChartData = currentBudget.budgetLines
    .filter(line => line.actualSpent > 0)
    .map(line => ({
      name: line.category,
      value: line.actualSpent
    }))

  // Calculate totals
  const totalBudgeted = currentBudget.budgetLines.reduce((sum, line) => sum + line.budgetedAmount, 0)
  const totalSpent = currentBudget.budgetLines.reduce((sum, line) => sum + line.actualSpent, 0)
  const totalRemaining = totalBudgeted - totalSpent
  const spentPercentage = Math.round((totalSpent / totalBudgeted) * 100)

  return (
    <div className={`max-w-7xl mx-auto p-6 ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
              Financial Dashboard
            </h1>
            <p className={`text-lg ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentBudget.name} - Overview
            </p>
          </div>
          
          {/* Budget Selector and Create New Budget Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <label className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Select Budget
              </label>
              <select
                value={selectedBudgetId}
                onChange={(e) => setSelectedBudgetId(e.target.value)}
                className={`${effectiveTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48`}
              >
                {budgets.map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-transparent mb-1">‎</label> {/* Spacer for alignment */}
              <button
                onClick={() => createBudgetMutation.mutate()}
                disabled={createBudgetMutation.isPending}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded whitespace-nowrap"
              >
                {createBudgetMutation.isPending ? 'Creating...' : 'Create New Budget'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
            Total Budgeted
          </h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            ${totalBudgeted.toLocaleString()}
          </p>
        </div>

        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
            Total Spent
          </h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            ${totalSpent.toLocaleString()}
          </p>
        </div>

        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
            Remaining
          </h3>
          <p className={`text-3xl font-bold mt-2 ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${totalRemaining.toLocaleString()}
          </p>
        </div>

        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
            Spent Percentage
          </h3>
          <p className={`text-3xl font-bold mt-2 ${spentPercentage > 90 ? 'text-red-600' : spentPercentage > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
            {spentPercentage}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart - Budget vs Spending */}
        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Budget vs Spending by Category
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={effectiveTheme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="category" 
                tick={{ fill: effectiveTheme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                stroke={effectiveTheme === 'dark' ? '#6b7280' : '#9ca3af'}
              />
              <YAxis 
                tick={{ fill: effectiveTheme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                stroke={effectiveTheme === 'dark' ? '#6b7280' : '#9ca3af'}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
                  border: effectiveTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                  color: effectiveTheme === 'dark' ? '#f3f4f6' : '#111827'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Legend />
              <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
              <Bar dataKey="spent" fill="#ef4444" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Spending Distribution */}
        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Spending Distribution
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
                  border: effectiveTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                  color: effectiveTheme === 'dark' ? '#f3f4f6' : '#111827'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Overview Table */}
      <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} mt-8 rounded-lg shadow-lg overflow-hidden`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className={`text-xl font-bold ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Category Overview
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Category
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Budgeted
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Spent
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Remaining
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className={`${effectiveTheme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
              {currentBudget.budgetLines.map((line) => {
                const percentSpent = (line.actualSpent / line.budgetedAmount) * 100
                const isOverBudget = line.remaining < 0

                return (
                  <tr key={line.id} className={`${effectiveTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {line.category}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      ${line.budgetedAmount.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      ${line.actualSpent.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                      ${line.remaining.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-full ${effectiveTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2 max-w-24`}>
                          <div
                            className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : percentSpent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(percentSpent, 100)}%` }}
                          />
                        </div>
                        <span className={`ml-2 text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
      </div>

      {/* Budget Management Section */}
      <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} mt-8 rounded-lg shadow-lg overflow-hidden`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className={`text-xl font-bold ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Budget Management - {currentBudget.name}
          </h3>
          <button
            onClick={() => setAddingCategoryId(addingCategoryId === currentBudget.id ? null : currentBudget.id)}
            className="text-green-600 hover:text-green-800 flex items-center gap-2"
            aria-label="Add category"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Category
          </button>
        </div>
        
        {addingCategoryId === currentBudget.id && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <CategoryForm budgetId={currentBudget.id} onCategoryAdded={handleCategoryAdded} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Category
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Budgeted
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Spent
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Remaining
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Progress
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${effectiveTheme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
              {currentBudget.budgetLines.map((line) => {
                const percentSpent = (line.actualSpent / line.budgetedAmount) * 100
                const isOverBudget = line.remaining < 0
                const isExpanded = expandedCategories.has(line.id)
                const transactions = transactionQueries.data?.[line.id] || []
                const isLoadingTransactions = transactionQueries.isLoading && isExpanded
                const hasTransactionError = transactionQueries.error && isExpanded

                return (
                  <React.Fragment key={line.id}>
                    <tr className={`${effectiveTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer`} onClick={() => toggleCategoryExpansion(line.id)}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        <div className="flex items-center gap-2">
                          <button
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleCategoryExpansion(line.id)
                            }}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                            </svg>
                          </button>
                          {editingCategoryId === line.id ? (
                            <input
                              type="text"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              onKeyDown={handleCategoryKeyDown}
                              className={`w-full px-2 py-1 border ${effectiveTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              placeholder="Category name (Enter to save, Esc to cancel)"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingCategory(line)
                              }}
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
                              onKeyDown={handleBudgetKeyDown}
                              className={`w-20 px-2 py-1 border ${effectiveTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              min="0"
                              step="0.01"
                              placeholder="Enter to save, Esc to cancel"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditing(line)
                            }}
                            className="text-left hover:text-blue-600 hover:underline focus:outline-none focus:text-blue-600 focus:underline"
                          >
                            ${line.budgetedAmount.toFixed(2)}
                          </button>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        ${line.actualSpent.toFixed(2)}
                      </td>
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
                          <span className={`ml-2 text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {percentSpent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openTransactionModal(line.category)
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium flex items-center justify-center"
                          title="Add Transaction"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className={`px-6 py-4 ${effectiveTheme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <div className="pl-6">
                            <h4 className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} mb-3`}>
                              Transactions for {line.category}
                            </h4>
                            {isLoadingTransactions ? (
                              <div className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Loading transactions...
                              </div>
                            ) : hasTransactionError ? (
                              <div className={`text-sm text-red-500`}>
                                Error loading transactions
                              </div>
                            ) : transactions && transactions.length > 0 ? (
                              <div className="space-y-2">
                                {transactions.map((transaction: Transaction) => (
                                  <div key={transaction.id} className={`flex justify-between items-center p-3 rounded ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'} border ${effectiveTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                                    <div>
                                      <div className={`font-medium ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                        {transaction.description}
                                      </div>
                                      <div className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {new Date(transaction.date).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className={`font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      ${Math.abs(transaction.amount).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                No transactions found for this category.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      {currentBudget && (
        <Modal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          title={`Add New Transaction to ${currentBudget.name}`}
          maxWidth="3xl"
        >
          <TransactionForm 
            budgetId={currentBudget.id}
            budgetLines={currentBudget.budgetLines}
            onTransactionAdded={handleTransactionAdded}
            preselectedCategory={selectedCategory || undefined}
          />
        </Modal>
      )}
    </div>
  )
}