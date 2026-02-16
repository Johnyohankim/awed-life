import { sql } from '@vercel/postgres'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    // First check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'analytics_events'
      )
    `

    if (!tableCheck.rows[0]?.exists) {
      return Response.json({
        error: 'Analytics table not initialized. Please run /api/analytics/init first.'
      }, { status: 404 })
    }

    // Total events
    const totalEvents = await sql`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= NOW() - make_interval(days := ${days})
    `

    // Events by name
    const eventsByName = await sql`
      SELECT event_name, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= NOW() - make_interval(days := ${days})
      GROUP BY event_name
      ORDER BY count DESC
    `

    // Daily active users
    const dailyActiveUsers = await sql`
      SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as users
      FROM analytics_events
      WHERE created_at >= NOW() - make_interval(days := ${days})
        AND user_id IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `

    // Most popular categories (from card_kept events)
    const popularCategories = await sql`
      SELECT
        properties->>'category' as category,
        COUNT(*) as count
      FROM analytics_events
      WHERE event_name = 'card_kept'
        AND created_at >= NOW() - make_interval(days := ${days})
        AND properties->>'category' IS NOT NULL
      GROUP BY properties->>'category'
      ORDER BY count DESC
    `

    // Reaction stats
    const reactionStats = await sql`
      SELECT
        event_name,
        COUNT(*) as count
      FROM analytics_events
      WHERE event_name IN ('reaction_awed', 'reaction_nawed')
        AND created_at >= NOW() - make_interval(days := ${days})
      GROUP BY event_name
    `

    // Milestone achievements
    const milestones = await sql`
      SELECT
        properties->>'milestone' as milestone,
        COUNT(*) as count
      FROM analytics_events
      WHERE event_name = 'milestone_achieved'
        AND created_at >= NOW() - make_interval(days := ${days})
        AND properties->>'milestone' IS NOT NULL
      GROUP BY properties->>'milestone'
      ORDER BY (properties->>'milestone')::integer
    `

    return Response.json({
      period: `Last ${days} days`,
      totalEvents: parseInt(totalEvents.rows[0].count),
      eventsByName: eventsByName.rows,
      dailyActiveUsers: dailyActiveUsers.rows,
      popularCategories: popularCategories.rows,
      reactionStats: reactionStats.rows,
      milestones: milestones.rows
    })

  } catch (error) {
    console.error('Analytics dashboard error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
