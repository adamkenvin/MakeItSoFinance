const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const sampleTransactions = {
  'Groceries': [
    { description: 'Weekly grocery shopping', amount: 89.45 },
    { description: 'Fresh produce at farmer\'s market', amount: 32.18 },
    { description: 'Costco bulk shopping', amount: 156.78 },
    { description: 'Quick grocery run', amount: 24.67 },
    { description: 'Organic vegetables', amount: 41.23 }
  ],
  'Gas': [
    { description: 'Shell gas station', amount: 45.32 },
    { description: 'Chevron fill-up', amount: 52.18 },
    { description: 'BP gas station', amount: 38.95 },
    { description: 'Exxon fuel', amount: 49.67 }
  ],
  'Entertainment': [
    { description: 'Netflix subscription', amount: 15.99 },
    { description: 'Movie theater tickets', amount: 28.50 },
    { description: 'Concert tickets', amount: 85.00 },
    { description: 'Streaming services', amount: 12.99 },
    { description: 'Board game purchase', amount: 34.99 }
  ],
  'Utilities': [
    { description: 'Electric bill', amount: 125.67 },
    { description: 'Water & sewer', amount: 78.45 },
    { description: 'Internet service', amount: 79.99 },
    { description: 'Trash & recycling', amount: 32.50 }
  ],
  'Dining Out': [
    { description: 'Pizza night', amount: 42.18 },
    { description: 'Coffee shop', amount: 8.75 },
    { description: 'Date night restaurant', amount: 89.32 },
    { description: 'Fast food lunch', amount: 12.45 },
    { description: 'Brunch with friends', amount: 67.89 },
    { description: 'Takeout dinner', amount: 28.56 }
  ],
  'Transportation': [
    { description: 'Uber ride', amount: 18.45 },
    { description: 'Taxi to airport', amount: 34.67 },
    { description: 'Bus pass monthly', amount: 85.00 },
    { description: 'Parking meter', amount: 4.50 },
    { description: 'Train ticket', amount: 12.75 }
  ],
  'Law Service': [
    { description: 'Legal consultation', amount: 250.00 },
    { description: 'Document review', amount: 125.00 },
    { description: 'Contract preparation', amount: 350.00 }
  ],
  'Beer': [
    { description: 'Craft beer six-pack', amount: 14.99 },
    { description: 'Brewery visit', amount: 28.50 },
    { description: 'Beer at restaurant', amount: 6.75 },
    { description: 'Local brewery growler', amount: 18.99 }
  ],
  'Car': [
    { description: 'Oil change', amount: 45.99 },
    { description: 'Car wash', amount: 15.00 },
    { description: 'Tire rotation', amount: 89.99 },
    { description: 'New windshield wipers', amount: 24.99 }
  ],
  'Protein Shake': [
    { description: 'Protein powder container', amount: 42.99 },
    { description: 'Post-workout shake', amount: 8.50 },
    { description: 'Gym smoothie', amount: 12.75 },
    { description: 'Protein bars box', amount: 26.99 }
  ],
  'Lawn Services': [
    { description: 'Monthly lawn mowing', amount: 75.00 },
    { description: 'Hedge trimming', amount: 45.00 },
    { description: 'Leaf removal', amount: 65.00 },
    { description: 'Fertilizer application', amount: 85.00 }
  ],
  // Generic fallback for any other categories
  'BASE': [
    { description: 'Miscellaneous expense', amount: 25.00 },
    { description: 'General purchase', amount: 15.50 },
    { description: 'Various items', amount: 32.75 }
  ]
}

async function seedTransactions() {
  try {
    console.log('🌱 Starting to seed transaction data...')

    // Get the user
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('❌ No user found. Creating demo user...')
      const newUser = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User'
        }
      })
      console.log('✅ Demo user created')
    }

    // Get all budgets with their budget lines
    const budgets = await prisma.budget.findMany({
      include: {
        budgetLines: true
      }
    })

    if (budgets.length === 0) {
      console.log('❌ No budgets found. Please run the app first to create default budgets.')
      return
    }

    console.log(`📊 Found ${budgets.length} budget(s)`)

    // For each budget, add transactions to each budget line
    for (const budget of budgets) {
      console.log(`\n💰 Processing budget: ${budget.name}`)
      
      for (const budgetLine of budget.budgetLines) {
        let transactions = sampleTransactions[budgetLine.category]
        
        if (!transactions) {
          // Use generic transactions for unknown categories
          transactions = [
            { description: `${budgetLine.category} expense`, amount: Math.floor(Math.random() * 100) + 10 },
            { description: `${budgetLine.category} purchase`, amount: Math.floor(Math.random() * 75) + 15 },
            { description: `${budgetLine.category} payment`, amount: Math.floor(Math.random() * 50) + 20 }
          ]
          console.log(`🔄 Using generic transactions for category: ${budgetLine.category}`)
        }

        // Check if transactions already exist for this budget line
        const existingTransactions = await prisma.transaction.findMany({
          where: {
            budgetLineId: budgetLine.id
          }
        })

        if (existingTransactions.length > 0) {
          console.log(`⏭️  Category '${budgetLine.category}' already has ${existingTransactions.length} transactions, skipping...`)
          continue
        }

        console.log(`📝 Adding transactions for: ${budgetLine.category}`)

        // Add each sample transaction
        for (const transaction of transactions) {
          // Create transaction date within the budget month
          const transactionDate = new Date(budget.year, budget.month - 1, Math.floor(Math.random() * 28) + 1)
          
          await prisma.transaction.create({
            data: {
              description: transaction.description,
              amount: transaction.amount,
              category: budgetLine.category,
              date: transactionDate,
              budgetId: budget.id,
              budgetLineId: budgetLine.id
            }
          })
        }

        // Calculate total spent for this category
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0)
        console.log(`   ✅ Added ${transactions.length} transactions totaling $${totalSpent.toFixed(2)}`)
      }
    }

    console.log('\n🎉 Transaction seeding completed successfully!')
    console.log('💡 Refresh your app to see the spending data!')

  } catch (error) {
    console.error('❌ Error seeding transactions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTransactions()