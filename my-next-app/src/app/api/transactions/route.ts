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