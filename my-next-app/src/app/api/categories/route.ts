import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - List all categories from budget lines
export async function GET(request: NextRequest) {
  try {
    // Get the current user (using same logic as budget API)
    let user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ 
        categories: [],
        count: 0 
      })
    }

    // Get current budget and extract categories from budget lines
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const budget = await prisma.budget.findUnique({
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
      return NextResponse.json({ 
        categories: [],
        count: 0 
      })
    }

    // Transform budget lines into category format
    const categories = budget.budgetLines.map(line => {
      const actualSpent = line.transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
      return {
        id: line.id,
        name: line.category,
        description: `Budget: $${line.budgetedAmount.toFixed(2)}, Spent: $${actualSpent.toFixed(2)}`,
        createdAt: line.createdAt,
        updatedAt: line.updatedAt
      }
    })

    return NextResponse.json({ 
      categories,
      count: categories.length 
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category (budget line)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, budgetedAmount = 0, budgetId } = body

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (typeof budgetedAmount !== 'number' || budgetedAmount < 0) {
      return NextResponse.json(
        { error: 'Budgeted amount must be a non-negative number' },
        { status: 400 }
      )
    }

    if (!budgetId) {
        return NextResponse.json(
            { error: 'budgetId is required' },
            { status: 400 }
        )
    }

    // Get the current user
    let user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json(
        { error: 'No user found' },
        { status: 404 }
      )
    }

    // Get budget by budgetId
    const budget = await prisma.budget.findUnique({
        where: {
            id: budgetId,
        },
        include: {
            budgetLines: true
        }
    })

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Check if category already exists in this budget
    const existingLine = budget.budgetLines.find(line => 
      line.category.toLowerCase() === name.trim().toLowerCase()
    )

    if (existingLine) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      )
    }

    // Create the budget line
    const budgetLine = await prisma.budgetLine.create({
      data: {
        category: name.trim(),
        budgetedAmount,
        budgetId: budget.id
      }
    })

    return NextResponse.json({ 
      category: {
        id: budgetLine.id,
        name: budgetLine.category,
        description: `Budget: $${budgetLine.budgetedAmount.toFixed(2)}, Spent: $0.00`,
        createdAt: budgetLine.createdAt,
        updatedAt: budgetLine.updatedAt
      },
      message: 'Category created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
