import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const budgetId = searchParams.get('budgetId')
    const format = searchParams.get('format') || 'json' // default to JSON
    
    if (!budgetId) {
      return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 })
    }

    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use "csv" or "json"' }, { status: 400 })
    }

    // Get user (simplified for demo)
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the specific budget with its budget lines and transactions
    const budget = await prisma.budget.findFirst({
      where: { 
        id: budgetId,
        userId: user.id 
      },
      include: {
        budgetLines: {
          include: {
            transactions: true
          }
        }
      }
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Transform data to match frontend expectations
    const transformedBudget = {
      id: budget.id,
      name: budget.name.startsWith('Budget ') 
        ? new Date(budget.year, budget.month - 1).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })
        : budget.name,
      month: budget.month,
      year: budget.year,
      budgetLines: budget.budgetLines.map(line => {
        const actualSpent = line.transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
        const remaining = line.budgetedAmount - actualSpent
        
        return {
          id: line.id,
          category: line.category,
          budgetedAmount: line.budgetedAmount,
          actualSpent,
          remaining
        }
      })
    }

    if (format === 'csv') {
      // Generate CSV content
      const headers = ['Category', 'Budgeted Amount', 'Actual Spent', 'Remaining', 'Percentage Spent']
      const csvRows = [headers.join(',')]
      
      transformedBudget.budgetLines.forEach(line => {
        const percentSpent = ((line.actualSpent / line.budgetedAmount) * 100).toFixed(1)
        const row = [
          `"${line.category}"`,
          line.budgetedAmount.toFixed(2),
          line.actualSpent.toFixed(2),
          line.remaining.toFixed(2),
          `${percentSpent}%`
        ]
        csvRows.push(row.join(','))
      })

      // Add totals row
      const totalBudgeted = transformedBudget.budgetLines.reduce((sum, line) => sum + line.budgetedAmount, 0)
      const totalSpent = transformedBudget.budgetLines.reduce((sum, line) => sum + line.actualSpent, 0)
      const totalRemaining = totalBudgeted - totalSpent
      const totalPercent = ((totalSpent / totalBudgeted) * 100).toFixed(1)
      
      csvRows.push(['']) // Empty row
      csvRows.push(['"TOTALS"', totalBudgeted.toFixed(2), totalSpent.toFixed(2), totalRemaining.toFixed(2), `${totalPercent}%`])

      const csvContent = csvRows.join('\n')
      const filename = `${transformedBudget.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_budget.csv`
      
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } else {
      // Generate JSON content
      const exportData = {
        budgetInfo: {
          id: transformedBudget.id,
          name: transformedBudget.name,
          month: transformedBudget.month,
          year: transformedBudget.year,
          exportDate: new Date().toISOString()
        },
        summary: {
          totalBudgeted: transformedBudget.budgetLines.reduce((sum, line) => sum + line.budgetedAmount, 0),
          totalSpent: transformedBudget.budgetLines.reduce((sum, line) => sum + line.actualSpent, 0),
          totalRemaining: transformedBudget.budgetLines.reduce((sum, line) => sum + (line.budgetedAmount - line.actualSpent), 0),
          categoryCount: transformedBudget.budgetLines.length
        },
        categories: transformedBudget.budgetLines.map(line => ({
          id: line.id,
          category: line.category,
          budgetedAmount: line.budgetedAmount,
          actualSpent: line.actualSpent,
          remaining: line.remaining,
          percentageSpent: ((line.actualSpent / line.budgetedAmount) * 100).toFixed(1),
          status: line.remaining < 0 ? 'over-budget' : line.actualSpent / line.budgetedAmount > 0.8 ? 'warning' : 'on-track'
        }))
      }

      const jsonContent = JSON.stringify(exportData, null, 2)
      const filename = `${transformedBudget.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_budget.json`
      
      return new Response(jsonContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }
  } catch (error) {
    console.error('Error exporting budget:', error)
    return NextResponse.json({ error: 'Failed to export budget' }, { status: 500 })
  }
}