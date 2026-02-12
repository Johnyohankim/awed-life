import { 
  createSubmissionsTable, 
  createUsersTable, 
  createUserCardsTable,
  createReactionsTable,
  createDailyCardStateTable,
  createDailyCardsTable,
  createShownCardsTable,
  createMomentReactionsTable
} from '@/lib/db'

export async function GET() {
  try {
    await createSubmissionsTable()
    await createUsersTable()
    await createUserCardsTable()
    await createReactionsTable()
    await createDailyCardStateTable()
    await createDailyCardsTable()
    await createShownCardsTable()
    await createMomentReactionsTable()
    
    return Response.json({ 
      success: true, 
      message: 'All database tables initialized!' 
    })
  } catch (error) {
    console.error('Database init error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}