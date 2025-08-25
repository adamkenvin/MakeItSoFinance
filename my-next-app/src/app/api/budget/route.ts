import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // For MVP, create a default user and budget if they don't exist
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // Get or create default user
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User'
        }
      })
    }

    // Get or create current month's budget
    let budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId: user.id,
          month: currentMonth,
          year: currentYear
        }
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
      // Create default budget with some categories
      budget = await prisma.budget.create({
        data: {
          name: `Budget ${currentMonth}/${currentYear}`,
          month: currentMonth,
          year: currentYear,
          userId: user.id,
          budgetLines: {
            create: [
              { category: 'Groceries', budgetedAmount: 500 },
              { category: 'Gas', budgetedAmount: 200 },
              { category: 'Entertainment', budgetedAmount: 150 },
              { category: 'Utilities', budgetedAmount: 300 },
              { category: 'Dining Out', budgetedAmount: 250 }
            ]
          }
        },
        include: {
          budgetLines: {
            include: {
              transactions: true
            }
          }
        }
      })
    }

    // Calculate actual spending for each category
    const budgetWithActuals = budget.budgetLines.map(line => {
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

    return NextResponse.json({
      budget: {
        id: budget.id,
        name: budget.name,
        month: budget.month,
        year: budget.year
      },
      budgetLines: budgetWithActuals
    })
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json({ error: 'Failed to fetch budget' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { budgetLineId, budgetedAmount } = await request.json()
    
    // Validate input
    if (!budgetLineId || typeof budgetedAmount !== 'number' || budgetedAmount < 0) {
      return NextResponse.json({ error: 'Invalid budget line ID or amount' }, { status: 400 })
    }

    // Update the budget line amount
    const updatedBudgetLine = await prisma.budgetLine.update({
      where: { id: budgetLineId },
      data: { budgetedAmount },
      include: {
        transactions: true
      }
    })

    // Calculate updated metrics
    const actualSpent = updatedBudgetLine.transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
    const remaining = updatedBudgetLine.budgetedAmount - actualSpent
    
    return NextResponse.json({
      id: updatedBudgetLine.id,
      category: updatedBudgetLine.category,
      budgetedAmount: updatedBudgetLine.budgetedAmount,
      actualSpent,
      remaining
    })
  } catch (error) {
    console.error('Error updating budget line:', error)
    return NextResponse.json({ error: 'Failed to update budget line' }, { status: 500 })
  }
}