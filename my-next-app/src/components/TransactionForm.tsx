'use client'

import { useState } from 'react'

interface BudgetLine {
  id: string
  category: string
  budgetedAmount: number
  actualSpent: number
  remaining: number
}

interface TransactionFormProps {
  budgetLines: BudgetLine[]
  onTransactionAdded: () => void
  budgetId: string
  preselectedCategory?: string
}

export default function TransactionForm({ budgetLines, onTransactionAdded, budgetId, preselectedCategory }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: preselectedCategory || '',
    date: new Date().toISOString().split('T')[0] // Today's date
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, budgetId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create transaction')
      }

      // Reset form
      setFormData({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      })

      onTransactionAdded() // This will refresh the budget data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-8">
        {/* Form Section */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <label htmlFor="description" className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="e.g., Grocery shopping at Safeway"
              />
            </div>

            <div className="flex items-center gap-4">
              <label htmlFor="amount" className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">
                Amount ($)
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center gap-4">
              <label htmlFor="category" className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Select a category</option>
                {budgetLines.map((line) => (
                  <option key={line.id} value={line.category}>
                    {line.category} (${line.remaining.toFixed(2)} remaining)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label htmlFor="date" className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition duration-200"
              >
                {isSubmitting ? 'Adding...' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>

        {/* Budget Summary Section */}
        {budgetLines.length > 0 && (
          <div className="w-64 flex-shrink-0">
            <div className="p-4 bg-gray-50 rounded-lg h-fit">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Budget Summary</h3>
              <div className="space-y-2 text-xs">
                {budgetLines.map((line) => (
                  <div key={line.id} className="flex justify-between">
                    <span className="text-gray-900">{line.category}:</span>
                    <span className={line.remaining < 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      ${line.remaining.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}