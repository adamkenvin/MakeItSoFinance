'use client'

import BudgetTab from './BudgetTab'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'

export default function TabContainer() {
  const { effectiveTheme } = useTheme()
  
  return (
    <div className={`min-h-screen ${effectiveTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto p-6 bg-transparent">
      {/* Header with theme toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className={`text-2xl font-bold ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            MakeItSo Finance
          </h1>
        </div>
        <ThemeToggle />
      </div>
      
      <BudgetTab />
      </div>
    </div>
  )
}
