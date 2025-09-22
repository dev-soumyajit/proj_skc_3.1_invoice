import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeInsert, executeUpdate } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit
    const status = searchParams.get("status")

    let whereClause = ""
    let queryParams: any[] = []

    if (status && status !== "all") {
      whereClause = "WHERE sa.status = ?"
      queryParams.push(status)
    }

    const query = `
      SELECT 
        sa.adjustment_id,
        sa.adjustment_no,
        sa.adjustment_date,
        sa.adjustment_type,
        sa.reason,
        sa.status,
        sa.total_items,
        g.godown_name,
        u1.name_display as created_by_name,
        u2.name_display as approved_by_name,
        sa.created_at,
        sa.updated_at
      FROM stock_adjustments sa
      JOIN godowns g ON sa.godown_id = g.godown_id
      LEFT JOIN master_user u1 ON sa.created_by = u1.user_id
      LEFT JOIN master_user u2 ON sa.approved_by = u2.user_id
      ${whereClause}
      ORDER BY sa.created_at DESC
      LIMIT ? OFFSET ?
    `

    const adjustments = await executeQuery(query, [...queryParams, limit, offset])

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM stock_adjustments sa ${whereClause}`
    const countData = await executeQuery(countQuery, queryParams)
    const total = countData[0]?.total || 0
    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: adjustments,
      pagination: { page, limit, total, pages }
    })
  } catch (error) {
    console.error("Stock adjustments error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      adjustment_date, 
      godown_id, 
      adjustment_type, 
      reason, 
      items, 
      remarks,
      created_by = 1 // Default to admin user
    } = body

    // Generate adjustment number
    const adjustmentNo = `ADJ/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`

    // Insert adjustment header
    const adjustmentId = await executeInsert(`
      INSERT INTO stock_adjustments (
        adjustment_no, adjustment_date, godown_id, adjustment_type, 
        reason, total_items, remarks, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `, [adjustmentNo, adjustment_date, godown_id, adjustment_type, reason, items.length, remarks, created_by])

    // Insert adjustment details
    for (const item of items) {
      await executeInsert(`
        INSERT INTO stock_adjustment_details (
          adjustment_id, product_id, system_quantity, physical_quantity, unit_cost, remarks
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        adjustmentId,
        item.product_id,
        item.system_quantity,
        item.physical_quantity,
        item.unit_cost || null,
        item.remarks || null
      ])
    }

    return NextResponse.json({
      success: true,
      data: { adjustment_id: adjustmentId, adjustment_no: adjustmentNo },
      message: "Stock adjustment created successfully"
    })
  } catch (error) {
    console.error("Create stock adjustment error:", error)
    return NextResponse.json({ success: false, error: "Failed to create stock adjustment" }, { status: 500 })
  }
}