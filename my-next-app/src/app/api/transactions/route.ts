import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, amount, category, date } = body

    // Get the current user (for MVP, just use the first user)
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 400 })
    }

    // Get the current budget
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
        budgetLines: true
      }
    })

    if (!budget) {
      return NextResponse.json({ error: 'No budget found' }, { status: 400 })
    }

    // Find the budget line for this category
    const budgetLine = budget.budgetLines.find(line => line.category === category)
    
    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        budgetId: budget.id,
        budgetLineId: budgetLine?.id || null
      }
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        date: 'desc'
      },
      take: 10 // Get last 10 transactions
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, description, amount, category, date } = body

    // Validate input
    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    // Get the current user (for MVP, just use the first user)
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 400 })
    }

    // Get the current budget
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
        budgetLines: true
      }
    })

    if (!budget) {
      return NextResponse.json({ error: 'No budget found' }, { status: 400 })
    }

    // Find the budget line for this category
    const budgetLine = budget.budgetLines.find(line => line.category === category)

    // Update the transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        budgetLineId: budgetLine?.id || null
      }
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}