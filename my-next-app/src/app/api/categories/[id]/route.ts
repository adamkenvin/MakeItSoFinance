import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // For now, we'll use a demo user ID since auth isn't fully implemented
    const demoUserId = 'demo-user-id'

    // Check if category exists and belongs to the user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: demoUserId
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Delete the category
    await prisma.category.delete({
      where: {
        id: categoryId
      }
    })

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      deletedCategory: existingCategory 
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
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id

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