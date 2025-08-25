import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    // For now, we'll use a demo user ID since auth isn't fully implemented
    const demoUserId = 'demo-user-id'
    
    const categories = await prisma.category.findMany({
      where: {
        userId: demoUserId
      },
      orderBy: {
        createdAt: 'desc'
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

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // For now, we'll use a demo user ID since auth isn't fully implemented
    const demoUserId = 'demo-user-id'

    // Check if category already exists for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: demoUserId,
        name: name.trim()
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      )
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: demoUserId
      }
    })

    return NextResponse.json({ 
      category,
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