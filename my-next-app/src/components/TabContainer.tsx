'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Dashboard from './Dashboard'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import Image from 'next/image'
import logoImage from '../../public/brand/logo.png'

export default function TabContainer() {
  const { effectiveTheme } = useTheme()
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // If not authenticated, redirect to signin
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/signin')
    return null
  }

  const handleSignOut = async () => {
    await logout()
    router.push('/auth/signin')
  }
  
  return (
    <div className={`min-h-screen ${effectiveTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto bg-transparent">
        {/* Header with navigation and user menu */}
        <div className="flex justify-between items-center p-6 pb-0">
          <div className="flex items-center gap-4">
            <h1 className={`text-2xl font-bold  ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
              <div>
                <Image src={logoImage} alt="Captain's log logo" width={64} height={64} className='inline-block'/>
                Captain&apos;s Ledger
              </div>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  effectiveTheme === 'dark'
                    ? 'border-gray-600 hover:bg-gray-800 text-gray-300'
                    : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                } transition-colors`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm">
                  {user?.email}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${
                  effectiveTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                } z-50`}>
                  <div className="py-1">
                    <div className={`px-4 py-2 text-sm border-b ${
                      effectiveTheme === 'dark' 
                        ? 'text-gray-300 border-gray-700' 
                        : 'text-gray-700 border-gray-200'
                    }`}>
                      <div className="font-medium">Signed in as</div>
                      <div className="text-xs opacity-75">{user?.email}</div>
                    </div>
                    
                    <div className={`border-t ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <button
                        onClick={handleSignOut}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          effectiveTheme === 'dark' 
                            ? 'text-red-400 hover:bg-gray-700' 
                            : 'text-red-600 hover:bg-gray-100'
                        } transition-colors`}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <Dashboard />
        
        {/* Click outside to close user menu */}
        {showUserMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </div>
    </div>
  )
}
