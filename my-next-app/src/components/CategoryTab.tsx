'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import CategoryForm from './CategoryForm'

interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export default function CategoryTab() {
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const queryClient = useQueryClient()

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      return data.categories as Category[]
    }
  })

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete category')
      }
      return response.json()
    },
    onSuccess: () => {
      // Refresh both categories and budget data since they're connected
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
    onError: (error) => {
      console.error('Error deleting category:', error)
      // You could add a toast notification here
    }
  })

  const handleCategoryAdded = () => {
    // Refresh both categories and budget data since they're connected
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
    setShowCategoryForm(false)
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      deleteCategoryMutation.mutate(categoryId)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div>
      {/* Header with Add Category Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => setShowCategoryForm(!showCategoryForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showCategoryForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {/* Category Form */}
      {showCategoryForm && (
        <div className="mb-6">
          <CategoryForm onCategoryAdded={handleCategoryAdded} />
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Categories</h2>
        </div>

        {categoriesLoading && (
          <div className="p-8 text-center text-gray-500">Loading categories...</div>
        )}

        {categoriesError && (
          <div className="p-8 text-center text-red-500">
            Error loading categories: {String(categoriesError)}
          </div>
        )}

        {categoriesData && categoriesData.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No categories found. Add your first category above!
          </div>
        )}

        {categoriesData && categoriesData.length > 0 && (
          <div className="divide-y divide-gray-200">
            {categoriesData.map((category) => (
              <div key={category.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  {category.description && (
                    <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Created {formatDate(category.createdAt)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    disabled={deleteCategoryMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium py-1 px-3 rounded transition duration-200"
                  >
                    {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {categoriesData && categoriesData.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Total categories: {categoriesData.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}