'use client'

import BudgetTab from './BudgetTab'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'

export default function TabContainer() {
  const { effectiveTheme } = useTheme()
  
  return (
    <div className="max-w-6xl mx-auto p-6 bg-transparent">
      {/* Header with theme toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            MakeItSo Finance
          </h1>
          {/* Debug indicator */}
          <div className={`px-2 py-1 text-xs rounded ${effectiveTheme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
            {effectiveTheme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
          </div>
          
          {/* Obvious dark mode test */}
          <div className={`px-3 py-2 text-sm font-bold rounded-lg border-2 ${effectiveTheme === 'dark' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-black border-gray-300'}`}>
            {effectiveTheme === 'dark' ? '🌙 DARK' : '🔆 LIGHT'}
          </div>
        </div>
        <ThemeToggle />
      </div>
      
      <BudgetTab />
    </div>
  )
}
