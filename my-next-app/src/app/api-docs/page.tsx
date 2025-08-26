'use client'

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

interface APIEndpoint {
  method: string
  path: string
  title: string
  description: string
  tags: string[]
  requestBody?: any
  responses: Record<string, any>
}

const endpoints: APIEndpoint[] = [
  // Authentication Endpoints
  {
    method: 'POST',
    path: '/api/auth/login',
    title: 'User Login',
    description: 'Authenticate user with email and password',
    tags: ['Authentication'],
    requestBody: {
      email: 'string',
      password: 'string'
    },
    responses: {
      200: { success: true, user: { id: 'string', email: 'string', name: 'string' } },
      401: { success: false, message: 'Invalid credentials' }
    }
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    title: 'User Logout',
    description: 'Log out current user and clear session',
    tags: ['Authentication'],
    responses: {
      200: { success: true, message: 'Logged out successfully' }
    }
  },
  {
    method: 'GET',
    path: '/api/auth/session',
    title: 'Get Session',
    description: 'Get current user session information',
    tags: ['Authentication'],
    responses: {
      200: { user: { id: 'string', email: 'string', name: 'string' } },
      401: { error: 'Unauthorized' }
    }
  },
  // Budget Endpoints
  {
    method: 'GET',
    path: '/api/budget',
    title: 'Get All Budgets',
    description: 'Retrieve all budgets for the authenticated user',
    tags: ['Budgets'],
    responses: {
      200: [{ id: 'string', name: 'string', month: 'number', year: 'number', budgetLines: 'array' }],
      404: { error: 'User not found' }
    }
  },
  {
    method: 'POST',
    path: '/api/budget',
    title: 'Create New Budget',
    description: 'Create a new monthly budget',
    tags: ['Budgets'],
    responses: {
      201: { id: 'string', name: 'string', budgetLines: 'array' },
      409: { error: 'Budget for this month already exists' }
    }
  },
  {
    method: 'PATCH',
    path: '/api/budget',
    title: 'Update Budget Line',
    description: 'Update the budgeted amount for a specific category',
    tags: ['Budgets'],
    requestBody: {
      budgetLineId: 'string',
      budgetedAmount: 'number'
    },
    responses: {
      200: { id: 'string', category: 'string', budgetedAmount: 'number', actualSpent: 'number', remaining: 'number' },
      400: { error: 'Invalid budget line ID or amount' }
    }
  },
  // Category Endpoints
  {
    method: 'GET',
    path: '/api/categories',
    title: 'Get Categories',
    description: 'Get all categories from current budget',
    tags: ['Categories'],
    responses: {
      200: { categories: 'array', count: 'number' }
    }
  },
  {
    method: 'POST',
    path: '/api/categories',
    title: 'Create Category',
    description: 'Create a new budget category',
    tags: ['Categories'],
    requestBody: {
      name: 'string',
      budgetedAmount: 'number',
      budgetId: 'string'
    },
    responses: {
      201: { category: 'object', message: 'Category created successfully' },
      409: { error: 'A category with this name already exists' }
    }
  },
  // Transaction Endpoints
  {
    method: 'GET',
    path: '/api/transactions',
    title: 'Get Recent Transactions',
    description: 'Get the last 10 transactions',
    tags: ['Transactions'],
    responses: {
      200: { transactions: 'array' }
    }
  },
  {
    method: 'POST',
    path: '/api/transactions',
    title: 'Create Transaction',
    description: 'Create a new financial transaction',
    tags: ['Transactions'],
    requestBody: {
      description: 'string',
      amount: 'number',
      category: 'string',
      date: 'string',
      budgetId: 'string'
    },
    responses: {
      200: { transaction: 'object' },
      400: { error: 'No budget found' }
    }
  },
  {
    method: 'PATCH',
    path: '/api/transactions',
    title: 'Update Transaction',
    description: 'Update an existing transaction',
    tags: ['Transactions'],
    requestBody: {
      id: 'string',
      description: 'string',
      amount: 'number',
      category: 'string',
      date: 'string'
    },
    responses: {
      200: { transaction: 'object' },
      400: { error: 'Transaction ID is required' }
    }
  },
  {
    method: 'DELETE',
    path: '/api/transactions',
    title: 'Delete Transaction',
    description: 'Delete a transaction by ID',
    tags: ['Transactions'],
    responses: {
      200: { success: true },
      400: { error: 'Transaction ID is required' }
    }
  }
]

const methodColors = {
  GET: 'bg-blue-100 text-blue-800 border-blue-200',
  POST: 'bg-green-100 text-green-800 border-green-200',
  PATCH: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200'
}

export default function APIDocsPage() {
  const { effectiveTheme } = useTheme()
  const [selectedTag, setSelectedTag] = useState<string>('All')
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null)
  const [tryItOutMode, setTryItOutMode] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const allTags = ['All', ...Array.from(new Set(endpoints.flatMap(ep => ep.tags)))]
  const filteredEndpoints = selectedTag === 'All' 
    ? endpoints 
    : endpoints.filter(ep => ep.tags.includes(selectedTag))

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoint(expandedEndpoint === key ? null : key)
  }

  const toggleTryItOut = (key: string) => {
    if (tryItOutMode === key) {
      setTryItOutMode(null)
      setFormData({})
      setApiResponse(null)
    } else {
      setTryItOutMode(key)
      setFormData({})
      setApiResponse(null)
    }
  }

  const updateFormData = (key: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }

  const executeRequest = async (endpoint: APIEndpoint) => {
    const endpointKey = `${endpoint.method}-${endpoint.path}`
    setIsLoading(true)
    setApiResponse(null)

    try {
      const requestOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      }

      if (endpoint.requestBody && formData[endpointKey]) {
        requestOptions.body = JSON.stringify(formData[endpointKey])
      }

      const response = await fetch(`http://localhost:3002${endpoint.path}`, requestOptions)
      const responseData = await response.json()
      
      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        data: responseData
      })
    } catch (error) {
      setApiResponse({
        status: 'ERROR',
        statusText: 'Network Error',
        data: { error: 'Failed to fetch. Make sure the server is running.' }
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${effectiveTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${effectiveTheme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Captain's Ledger API</h1>
              <p className={`text-lg ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Financial tracking and budget management API
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Version 1.0.0
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              REST API
            </div>
            <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              JSON
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className={`sticky top-8 ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
              <h3 className="text-lg font-semibold mb-4">API Categories</h3>
              <div className="space-y-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedTag === tag
                        ? 'bg-blue-600 text-white'
                        : effectiveTheme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-3">Base URL</h4>
                <div className={`p-3 rounded-md font-mono text-sm ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  http://localhost:3002
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredEndpoints.map(endpoint => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}
                >
                  {/* Endpoint Header */}
                  <div
                    className={`p-4 cursor-pointer border-l-4 ${
                      endpoint.method === 'GET' ? 'border-blue-500' :
                      endpoint.method === 'POST' ? 'border-green-500' :
                      endpoint.method === 'PATCH' ? 'border-yellow-500' :
                      'border-red-500'
                    }`}
                    onClick={() => toggleEndpoint(`${endpoint.method}-${endpoint.path}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded border ${methodColors[endpoint.method as keyof typeof methodColors]}`}>
                          {endpoint.method}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold">{endpoint.title}</h3>
                          <code className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {endpoint.path}
                          </code>
                        </div>
                      </div>
                      <svg 
                        className={`w-5 h-5 transition-transform ${expandedEndpoint === `${endpoint.method}-${endpoint.path}` ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <p className={`mt-2 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {endpoint.description}
                    </p>
                  </div>

                  {/* Expanded Content */}
                  {expandedEndpoint === `${endpoint.method}-${endpoint.path}` && (
                    <div className={`border-t ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="p-4 space-y-6">
                        
                        {/* Request Body */}
                        {endpoint.requestBody && (
                          <div>
                            <h4 className="text-md font-semibold mb-3">Request Body</h4>
                            <div className={`p-4 rounded-md ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <pre className="text-sm overflow-x-auto">
                                {JSON.stringify(endpoint.requestBody, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Responses */}
                        <div>
                          <h4 className="text-md font-semibold mb-3">Responses</h4>
                          <div className="space-y-3">
                            {Object.entries(endpoint.responses).map(([status, response]) => (
                              <div key={status}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    status.startsWith('2') ? 'bg-green-100 text-green-800' :
                                    status.startsWith('4') ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {status}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {status.startsWith('2') ? 'Success' :
                                     status.startsWith('4') ? 'Client Error' :
                                     'Server Error'}
                                  </span>
                                </div>
                                <div className={`p-3 rounded-md ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <pre className="text-sm overflow-x-auto">
                                    {JSON.stringify(response, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Try It Out Section */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          {tryItOutMode !== `${endpoint.method}-${endpoint.path}` ? (
                            <button 
                              onClick={() => toggleTryItOut(`${endpoint.method}-${endpoint.path}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                            >
                              Try it out
                            </button>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => toggleTryItOut(`${endpoint.method}-${endpoint.path}`)}
                                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => executeRequest(endpoint)}
                                  disabled={isLoading}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
                                >
                                  {isLoading ? 'Executing...' : 'Execute'}
                                </button>
                              </div>

                              {/* Request Body Form */}
                              {endpoint.requestBody && (
                                <div>
                                  <h5 className="text-sm font-semibold mb-2">Request Body</h5>
                                  <div className={`p-3 rounded-md border ${effectiveTheme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                    {Object.entries(endpoint.requestBody).map(([field, type]) => (
                                      <div key={field} className="mb-3">
                                        <label className="block text-sm font-medium mb-1">
                                          {field} <span className="text-gray-500">({type as string})</span>
                                        </label>
                                        <input
                                          type={type === 'number' ? 'number' : 'text'}
                                          value={formData[`${endpoint.method}-${endpoint.path}`]?.[field] || ''}
                                          onChange={(e) => updateFormData(`${endpoint.method}-${endpoint.path}`, field, e.target.value)}
                                          className={`w-full px-3 py-2 border rounded-md ${effectiveTheme === 'dark' 
                                            ? 'bg-gray-800 border-gray-600 text-gray-100' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                          }`}
                                          placeholder={`Enter ${field}`}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Response Display */}
                              {apiResponse && (
                                <div>
                                  <h5 className="text-sm font-semibold mb-2">Response</h5>
                                  <div className={`p-3 rounded-md ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                                        typeof apiResponse.status === 'number' && apiResponse.status < 400
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {apiResponse.status}
                                      </span>
                                      <span className="text-sm text-gray-600">{apiResponse.statusText}</span>
                                    </div>
                                    <pre className="text-sm overflow-x-auto">
                                      {JSON.stringify(apiResponse.data, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}