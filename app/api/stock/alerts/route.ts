import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeInsert } from "@/lib/database"


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const alertType = searchParams.get("type")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let whereConditions = []
    let queryParams: any[] = []

    if (unreadOnly) {
      whereConditions.push("sa.is_read = 0")
    }

    if (alertType) {
      whereConditions.push("sa.alert_type = ?")
      queryParams.push(alertType)
    }

    whereConditions.push("sa.is_resolved = 0")

    const query = `
      SELECT 
        sa.alert_id,
        sa.alert_type,
        sa.alert_message,
        sa.current_quantity,
        sa.threshold_quantity,
        sa.is_read,
        sa.created_at,
        p.product_name,
        p.product_code,
        g.godown_name,
        pu.unit_name
      FROM stock_alerts sa
      JOIN products p ON sa.product_id = p.product_id
      JOIN godowns g ON sa.godown_id = g.godown_id
      JOIN product_units pu ON p.unit_id = pu.unit_id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY sa.created_at DESC
      LIMIT ? OFFSET ?
    `

    const alerts = await executeQuery(query, [...queryParams, limit, offset])

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM stock_alerts sa 
      WHERE ${whereConditions.join(" AND ")}
    `
    const countData = await executeQuery(countQuery, queryParams)
    const total = countData[0]?.total || 0
    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: alerts,
      pagination: { page, limit, total, pages }
    })
  } catch (error) {
    console.error("Stock alerts error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}