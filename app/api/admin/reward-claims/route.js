import { sql } from '@vercel/postgres'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')

    if (authCookie?.value !== 'true') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const claims = await sql`
      SELECT
        rc.id,
        rc.milestone_type,
        rc.full_name,
        rc.address,
        rc.city,
        rc.state,
        rc.zip_code,
        rc.country,
        rc.phone,
        rc.claimed_at,
        rc.shipped,
        u.email,
        u.name as username
      FROM reward_claims rc
      JOIN users u ON rc.user_id = u.id
      ORDER BY rc.claimed_at DESC
    `

    // Return as plain text table for easy copying
    const format = new URL('https://x.com').searchParams // just to get a URLSearchParams trick

    const rows = claims.rows
    if (rows.length === 0) {
      return new Response('No reward claims yet.', {
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    // Build CSV
    const csvHeader = 'ID,Milestone,Email,Full Name,Address,City,State,Zip,Country,Phone,Claimed At,Shipped'
    const csvRows = rows.map(r => [
      r.id,
      r.milestone_type,
      r.email,
      `"${r.full_name}"`,
      `"${r.address}"`,
      r.city,
      r.state,
      r.zip_code,
      r.country,
      r.phone || '',
      new Date(r.claimed_at).toLocaleDateString(),
      r.shipped ? 'Yes' : 'No'
    ].join(','))

    const csv = [csvHeader, ...csvRows].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="reward-claims.csv"'
      }
    })

  } catch (error) {
    console.error('Error fetching reward claims:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// Mark a claim as shipped
export async function PATCH(request) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')

    if (authCookie?.value !== 'true') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { claimId } = await request.json()

    await sql`
      UPDATE reward_claims SET shipped = true WHERE id = ${claimId}
    `

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
