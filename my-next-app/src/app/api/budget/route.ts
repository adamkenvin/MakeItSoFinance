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
    let budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
      },
      include: {
        budgetLines: {
          include: {
            transactions: true
          }
        }
      },
      orderBy: [
        {
          year: 'desc',
        },
        {
          month: 'desc'
        }
      ]
    })

    if (budgets.length === 0) {
      // Create default budget with some categories
      const newBudget = await prisma.budget.create({
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
      budgets = [newBudget]
    }

    const budgetsWithActuals = budgets.map(budget => {
      const budgetLinesWithActuals = budget.budgetLines.map(line => {
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

      return {
        id: budget.id,
        name: budget.name,
        month: budget.month,
        year: budget.year,
        budgetLines: budgetLinesWithActuals
      }
    })

    return NextResponse.json(budgetsWithActuals)
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    let user = await prisma.user.findFirst()
    if (!user) {
      // For simplicity, this assumes a user exists. 
      // A real app would get the user from the session.
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const latestBudget = await prisma.budget.findFirst({
      where: { userId: user.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { budgetLines: true }
    })

    let nextMonth: number, nextYear: number;
    if (latestBudget) {
      if (latestBudget.month === 12) {
        nextMonth = 1
        nextYear = latestBudget.year + 1
      } else {
        nextMonth = latestBudget.month + 1
        nextYear = latestBudget.year
      }
    } else {
      const currentDate = new Date()
      nextMonth = currentDate.getMonth() + 2 // Next month
      nextYear = currentDate.getFullYear()
      if (nextMonth > 12) {
        nextMonth = 1
        nextYear += 1
      }
    }

    // Check if a budget for the next month already exists
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: user.id,
        month: nextMonth,
        year: nextYear
      }
    })

    if (existingBudget) {
      return NextResponse.json({ error: 'Budget for this month already exists' }, { status: 409 })
    }

    const newBudget = await prisma.budget.create({
      data: {
        name: `Budget ${nextMonth}/${nextYear}`,
        month: nextMonth,
        year: nextYear,
        userId: user.id,
        budgetLines: {
          // Copy categories from the latest budget, or create default ones
          create: latestBudget?.budgetLines.map(line => ({
            category: line.category,
            budgetedAmount: line.budgetedAmount
          })) || [
            { category: 'Groceries', budgetedAmount: 500 },
            { category: 'Gas', budgetedAmount: 200 },
            { category: 'Entertainment', budgetedAmount: 150 },
          ]
        }
      },
      include: {
        budgetLines: true
      }
    })

    return NextResponse.json(newBudget, { status: 201 })
  } catch (error) {
    console.error('Error creating new budget:', error)
    return NextResponse.json({ error: 'Failed to create new budget' }, { status: 500 })
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