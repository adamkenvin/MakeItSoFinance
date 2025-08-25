import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/categories/[id] - Delete a category (budget line)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: budgetLineId } = await params

    if (!budgetLineId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
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
        { error: 'Category not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Check if there are transactions associated with this category
    if (existingBudgetLine.transactions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing transactions. Please delete transactions first.' },
        { status: 400 }
      )
    }

    // Delete the budget line
    await prisma.budgetLine.delete({
      where: {
        id: budgetLineId
      }
    })

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      deletedCategory: {
        id: existingBudgetLine.id,
        name: existingBudgetLine.category
      }
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}

// GET /api/categories/[id] - Get a specific category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // For now, we'll use a demo user ID since auth isn't fully implemented
    const demoUserId = 'demo-user-id'

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: demoUserId
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}