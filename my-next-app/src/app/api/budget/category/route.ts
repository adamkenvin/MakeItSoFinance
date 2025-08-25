import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const { budgetLineId, category } = await request.json()
    
    // Validate input
    if (!budgetLineId || !category || typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid budget line ID or category name' }, { status: 400 })
    }

    // Get the current user
    let user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 })
    }

    // Check if budget line exists and belongs to the user
    const existingBudgetLine = await prisma.budgetLine.findFirst({
      where: {
        id: budgetLineId,
        budget: {
          userId: user.id
        }
      },
      include: {
        budget: true,
        transactions: true
      }
    })

    if (!existingBudgetLine) {
      return NextResponse.json(
        { error: 'Budget line not found or you do not have permission to update it' },
        { status: 404 }
      )
    }

    // Check if category name already exists in the same budget
    const categoryExists = await prisma.budgetLine.findFirst({
      where: {
        budgetId: existingBudgetLine.budgetId,
        category: category.trim(),
        id: { not: budgetLineId } // Exclude the current budget line
      }
    })

    if (categoryExists) {
      return NextResponse.json(
        { error: 'Category name already exists in this budget' },
        { status: 409 }
      )
    }

    // Update the budget line category name
    const updatedBudgetLine = await prisma.budgetLine.update({
      where: { id: budgetLineId },
      data: { category: category.trim() },
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
    console.error('Error updating category name:', error)
    return NextResponse.json({ error: 'Failed to update category name' }, { status: 500 })
  }
}