import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const budgetLineId = searchParams.get('budgetLineId')
    
    if (!budgetLineId) {
      return NextResponse.json({ error: 'Budget line ID is required' }, { status: 400 })
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        budgetLineId: budgetLineId
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
