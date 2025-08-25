'use client'

import BudgetTab from './BudgetTab'
import ThemeToggle from './ThemeToggle'

export default function TabContainer() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with theme toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          MakeItSo Finance
        </h1>
        <ThemeToggle />
      </div>
      
      <BudgetTab />
    </div>
  )
}
