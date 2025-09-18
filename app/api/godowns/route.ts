import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    const godownsQuery = `
      SELECT 
        godown_id,
        godown_name,
        godown_address,
        contact_no
      FROM godowns
      ORDER BY godown_name ASC
    `

    const godowns = await executeQuery(godownsQuery)

    return NextResponse.json({
      success: true,
      data: godowns
    })

  } catch (error) {
    console.error('Godown fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch godowns' },
      { status: 500 }
    )
  }
}
