import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Create a new transaction
 *     description: |
 *       Creates a new transaction and associates it with the current month's budget.
 *       Automatically links to budget line if category matches existing budget category.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - amount
 *               - category
 *               - date
 *             properties:
 *               description:
 *                 type: string
 *                 description: Description of the transaction
 *                 example: "Whole Foods grocery shopping"
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Transaction amount
 *                 example: 87.32
 *               category:
 *                 type: string
 *                 description: Transaction category
 *                 example: "Groceries"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Transaction date
 *                 example: "2025-08-25T10:30:00Z"
 *           example:
 *             description: "Whole Foods grocery shopping"
 *             amount: 87.32
 *             category: "Groceries"
 *             date: "2025-08-25T10:30:00Z"
 *     responses:
 *       200:
 *         description: Transaction successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *             example:
 *               transaction:
 *                 id: "clxy123abc456def789"
 *                 description: "Whole Foods grocery shopping"
 *                 amount: 87.32
 *                 category: "Groceries"
 *                 date: "2025-08-25T10:30:00Z"
 *                 budgetId: "clxy456def789abc123"
 *                 budgetLineId: "clxy789abc123def456"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Get recent transactions
 *     description: |
 *       Retrieves the 10 most recent transactions ordered by date (newest first).
 *       Useful for displaying recent activity and transaction history.
 *     responses:
 *       200:
 *         description: Transactions successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *             example:
 *               transactions:
 *                 - id: "clxy123abc456def789"
 *                   description: "Whole Foods grocery shopping"
 *                   amount: 87.32
 *                   category: "Groceries"
 *                   date: "2025-08-25T10:30:00Z"
 *                   budgetId: "clxy456def789abc123"
 *                   budgetLineId: "clxy789abc123def456"
 *                 - id: "clxy456def789abc123"
 *                   description: "Shell Gas Station"
 *                   amount: 45.20
 *                   category: "Gas"
 *                   date: "2025-08-24T15:45:00Z"
 *                   budgetId: "clxy456def789abc123"
 *                   budgetLineId: "clxy987def123abc456"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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