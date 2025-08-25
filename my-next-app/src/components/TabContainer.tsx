'use client'

import BudgetTab from './BudgetTab'
import ThemeToggle from './ThemeToggle'

export default function TabContainer() {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-transparent">
      {/* Header with theme toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            MakeItSo Finance
          </h1>
          {/* Debug indicator */}
          <div className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            <span className="dark:hidden">Light Mode Active</span>
            <span className="hidden dark:inline">Dark Mode Active</span>
          </div>
          
          {/* Obvious dark mode test */}
          <div className="px-3 py-2 text-sm font-bold rounded-lg bg-white dark:bg-red-500 text-black dark:text-white border-2 border-gray-300 dark:border-red-600">
            <span className="dark:hidden">🔆 LIGHT</span>
            <span className="hidden dark:inline">🌙 DARK</span>
          </div>
        </div>
        <ThemeToggle />
      </div>
      
      <BudgetTab />
    </div>
  )
}
