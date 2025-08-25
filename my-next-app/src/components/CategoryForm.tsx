'use client'

import { useState } from 'react'

interface CategoryFormProps {
  budgetId: string
  onCategoryAdded: () => void
}

export default function CategoryForm({ budgetId, onCategoryAdded }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    budgetedAmount: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    // Validate budget amount
    const budgetAmount = parseFloat(formData.budgetedAmount)
    if (!formData.budgetedAmount || isNaN(budgetAmount) || budgetAmount <= 0) {
      setError('Budget amount is required and must be greater than $0')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          budgetedAmount: budgetAmount,
          budgetId: budgetId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create category')
      }

      // Reset form
      setFormData({
        name: '',
        budgetedAmount: ''
      })

      onCategoryAdded() // This will refresh the categories data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Category</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Category Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="e.g., Groceries, Entertainment, Utilities"
          />
        </div>

        <div>
          <label htmlFor="budgetedAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Budget Amount ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="budgetedAmount"
            name="budgetedAmount"
            value={formData.budgetedAmount}
            onChange={handleChange}
            required
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Enter budget amount (e.g., 500.00)"
          />
          <p className="mt-1 text-xs text-gray-500">This will be the allocated budget for this category</p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            {isSubmitting ? 'Adding...' : 'Add Category'}
          </button>
        </div>
      </form>
    </div>
  )
}
