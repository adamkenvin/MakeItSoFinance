'use client'

import { useState } from 'react'
import BudgetTab from './BudgetTab'
import TransactionTab from './TransactionTab'

type TabType = 'budget' | 'transactions'

export default function TabContainer() {
  const [activeTab, setActiveTab] = useState<TabType>('budget')

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('budget')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'budget'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Budget
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'budget' && <BudgetTab />}
        {activeTab === 'transactions' && <TransactionTab />}
      </div>
    </div>
  )
}
