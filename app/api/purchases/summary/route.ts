import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'


export async function GET() {
  try {
    // Get purchase summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_purchases,
        SUM(CASE WHEN entry_date >= CURDATE() - INTERVAL 30 DAY THEN 1 ELSE 0 END) as this_month,
        SUM(invoice_amount) as total_value,
        SUM(CASE WHEN entry_date >= CURDATE() - INTERVAL 30 DAY THEN invoice_amount ELSE 0 END) as this_month_value,
        COUNT(DISTINCT vendor_id) as total_vendors
      FROM purchases
    `

    const [summary] = await executeQuery(summaryQuery)

    // Get recent purchases
    const recentQuery = `
      SELECT 
        p.purchase_id,
        p.invoice_no,
        p.invoice_date,
        p.invoice_amount,
        mv.vendor_name,
        g.godown_name
      FROM purchases p
      JOIN master_vendor mv ON p.vendor_id = mv.vendor_id
      JOIN godowns g ON p.godown_id = g.godown_id
      ORDER BY p.invoice_date DESC, p.purchase_id DESC
      LIMIT 5
    `

    const recentPurchases = await executeQuery(recentQuery)

    // Get top vendors by purchase value
    const topVendorsQuery = `
      SELECT 
        mv.vendor_name,
        COUNT(p.purchase_id) as purchase_count,
        SUM(p.invoice_amount) as total_amount
      FROM purchases p
      JOIN master_vendor mv ON p.vendor_id = mv.vendor_id
      WHERE p.invoice_date >= CURDATE() - INTERVAL 90 DAY
      GROUP BY mv.vendor_id, mv.vendor_name
      ORDER BY total_amount DESC
      LIMIT 5
    `

    const topVendors = await executeQuery(topVendorsQuery)

    return NextResponse.json({
      success: true,
      data: {
        summary,
        recentPurchases,
        topVendors
      }
    })

  } catch (error) {
    console.error('Purchase summary error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase summary' },
      { status: 500 }
    )
  }
}