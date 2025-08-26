'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

export default function SignInPage() {
  const { effectiveTheme } = useTheme()
  const router = useRouter()
  const { user, login } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const success = await login(formData.email.toLowerCase().trim(), formData.password)

      if (success) {
        router.push('/')
      } else {
        setError('Invalid credentials. Please check your email and password.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error on input change
    if (error) {
      setError('')
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className={`mt-6 text-3xl font-bold ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Sign in to Captain&apos;s Ledger
          </h2>
          <p className={`mt-2 text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Access your budget management system
          </p>
        </div>

        {/* Sign In Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    effectiveTheme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-gray-100' 
                      : 'border-gray-300 bg-white text-gray-900'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    effectiveTheme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-100'
                      : 'border-gray-300 bg-white text-gray-900'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className={`rounded-md p-4 ${effectiveTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
            <h4 className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Demo Credentials
            </h4>
            <div className={`text-xs ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
              <div><strong>Email:</strong> admin@makeitso.finance</div>
              <div><strong>Password:</strong> SecurePass123!</div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition-colors duration-200`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </div>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}