'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useTheme } from '../contexts/ThemeContext'

interface BudgetLine {
  id: string
  category: string
  budgetedAmount: number
  actualSpent: number
  remaining: number
}

interface BudgetData {
  id: string
  name: string
  month: number
  year: number
  budgetLines: BudgetLine[]
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#82CA9D', '#FFC658', '#FF7300',
  '#00FF00', '#FF1493', '#32CD32', '#FFD700'
]

export default function Dashboard() {
  const { effectiveTheme } = useTheme()

  const { data: budgets, isLoading, error } = useQuery<BudgetData[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await fetch('/api/budget')
      if (!response.ok) {
        throw new Error('Failed to fetch budgets')
      }
      return response.json()
    }
  })

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
        <div className="text-xl">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${effectiveTheme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
        <div className="text-xl">Error loading dashboard: {String(error)}</div>
      </div>
    )
  }

  if (!budgets || budgets.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
        <div className="text-xl">No budget data found</div>
      </div>
    )
  }

  // Get the most recent budget (current month)
  const currentBudget = budgets[0]
  
  // Prepare data for bar chart (Budget vs Spending)
  const barChartData = currentBudget.budgetLines.map(line => ({
    category: line.category.length > 10 ? line.category.substring(0, 10) + '...' : line.category,
    budgeted: line.budgetedAmount,
    spent: line.actualSpent,
    remaining: line.remaining
  }))

  // Prepare data for pie chart (Spending distribution)
  const pieChartData = currentBudget.budgetLines
    .filter(line => line.actualSpent > 0)
    .map(line => ({
      name: line.category,
      value: line.actualSpent
    }))

  // Calculate totals
  const totalBudgeted = currentBudget.budgetLines.reduce((sum, line) => sum + line.budgetedAmount, 0)
  const totalSpent = currentBudget.budgetLines.reduce((sum, line) => sum + line.actualSpent, 0)
  const totalRemaining = totalBudgeted - totalSpent
  const spentPercentage = Math.round((totalSpent / totalBudgeted) * 100)

  return (
    <div className={`max-w-7xl mx-auto p-6 ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold mb-2 ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          Financial Dashboard
        </h1>
        <p className={`text-lg ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {currentBudget.name} - Overview
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
            Total Budgeted
          </h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            ${totalBudgeted.toLocaleString()}
          </p>
        </div>

        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
            Total Spent
          </h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            ${totalSpent.toLocaleString()}
          </p>
        </div>

        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
            Remaining
          </h3>
          <p className={`text-3xl font-bold mt-2 ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${totalRemaining.toLocaleString()}
          </p>
        </div>

        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
            Spent Percentage
          </h3>
          <p className={`text-3xl font-bold mt-2 ${spentPercentage > 90 ? 'text-red-600' : spentPercentage > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
            {spentPercentage}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart - Budget vs Spending */}
        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Budget vs Spending by Category
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={effectiveTheme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="category" 
                tick={{ fill: effectiveTheme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                stroke={effectiveTheme === 'dark' ? '#6b7280' : '#9ca3af'}
              />
              <YAxis 
                tick={{ fill: effectiveTheme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                stroke={effectiveTheme === 'dark' ? '#6b7280' : '#9ca3af'}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
                  border: effectiveTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                  color: effectiveTheme === 'dark' ? '#f3f4f6' : '#111827'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Legend />
              <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
              <Bar dataKey="spent" fill="#ef4444" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Spending Distribution */}
        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Spending Distribution
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: effectiveTheme === 'dark' ? '#1f2937' : '#ffffff',
                  border: effectiveTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                  color: effectiveTheme === 'dark' ? '#f3f4f6' : '#111827'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Overview Table */}
      <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} mt-8 rounded-lg shadow-lg overflow-hidden`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className={`text-xl font-bold ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Category Overview
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Category
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Budgeted
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Spent
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Remaining
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className={`${effectiveTheme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
              {currentBudget.budgetLines.map((line) => {
                const percentSpent = (line.actualSpent / line.budgetedAmount) * 100
                const isOverBudget = line.remaining < 0

                return (
                  <tr key={line.id} className={`${effectiveTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {line.category}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                      ${line.budgetedAmount.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                      ${line.actualSpent.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                      ${line.remaining.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-full ${effectiveTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2 max-w-24`}>
                          <div
                            className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : percentSpent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(percentSpent, 100)}%` }}
                          />
                        </div>
                        <span className={`ml-2 text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {percentSpent.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}