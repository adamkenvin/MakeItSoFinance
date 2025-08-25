'use client'

/**
 * Swagger UI Page - Interactive API Documentation
 * Displays OpenAPI documentation with interactive testing interface
 */

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(
  () => import('swagger-ui-react'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    )
  }
)

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSwaggerSpec() {
      try {
        const response = await fetch('/api/swagger')
        if (!response.ok) {
          throw new Error(`Failed to load API spec: ${response.status}`)
        }
        const spec = await response.json()
        setSwaggerSpec(spec)
      } catch (err) {
        console.error('Error loading Swagger spec:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSwaggerSpec()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load API Documentation</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">MakeItSo Finance API</h1>
              <p className="text-blue-100 mt-2">Interactive API Documentation & Testing Interface</p>
            </div>
            <div className="text-right">
              <a 
                href="/" 
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Back to App
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-6 text-sm">
            <span className="font-medium text-gray-700">Quick Navigation:</span>
            <a href="#/Budget" className="text-blue-600 hover:text-blue-800">Budget API</a>
            <a href="#/Transactions" className="text-blue-600 hover:text-blue-800">Transactions API</a>
            <a href="#/Authentication" className="text-blue-600 hover:text-blue-800">Authentication</a>
          </div>
        </div>
      </div>

      {/* API Documentation Features */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Interactive Testing</p>
                <p className="text-gray-500">Try API calls directly in the browser</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Complete Documentation</p>
                <p className="text-gray-500">Request/response schemas and examples</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Code Generation</p>
                <p className="text-gray-500">Copy curl commands and code samples</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="swagger-container">
        <SwaggerUI 
          spec={swaggerSpec}
          deepLinking={true}
          displayOperationId={false}
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          defaultModelRendering="model"
          displayRequestDuration={true}
          docExpansion="list"
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          supportedSubmitMethods={['get', 'post', 'put', 'patch', 'delete']}
          tryItOutEnabled={true}
          requestInterceptor={(req: any) => {
            // Add any auth headers or modify requests here if needed
            if (process.env.NODE_ENV === 'development') {
              console.log('API Request:', req)
            }
            return req
          }}
          responseInterceptor={(res: any) => {
            // Log responses in development
            if (process.env.NODE_ENV === 'development') {
              console.log('API Response:', res)
            }
            return res
          }}
        />
      </div>

      {/* Custom Swagger UI Styles */}
      <style jsx global>{`
        .swagger-container {
          background: white;
          min-height: calc(100vh - 200px);
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 20px 0;
        }
        
        .swagger-ui .scheme-container {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .swagger-ui .opblock.opblock-get {
          border-color: #10b981;
        }
        
        .swagger-ui .opblock.opblock-post {
          border-color: #3b82f6;
        }
        
        .swagger-ui .opblock.opblock-put {
          border-color: #f59e0b;
        }
        
        .swagger-ui .opblock.opblock-patch {
          border-color: #8b5cf6;
        }
        
        .swagger-ui .opblock.opblock-delete {
          border-color: #ef4444;
        }
        
        .swagger-ui .btn.authorize {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
        
        .swagger-ui .btn.execute {
          background-color: #10b981;
          border-color: #10b981;
        }
      `}</style>
    </div>
  )
}