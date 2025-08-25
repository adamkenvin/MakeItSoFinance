'use client'

import { useState } from 'react'
import BudgetTab from './BudgetTab'
import Dashboard from './Dashboard'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'

type TabType = 'dashboard' | 'budget'

export default function TabContainer() {
  const { effectiveTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  
  return (
    <div className={`min-h-screen ${effectiveTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto bg-transparent">
        {/* Header with navigation and theme toggle */}
        <div className="flex justify-between items-center p-6 pb-0">
          <div className="flex items-center gap-4">
            <h1 className={`text-2xl font-bold ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
              MakeItSo Finance
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-gray-300 hover:border-gray-300' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'budget'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-gray-300 hover:border-gray-300' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
              }`}
            >
              💰 Budget Details
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'budget' && (
            <div className="px-6">
              <BudgetTab />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
