import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const godownId = searchParams.get("godownId")
    const lowStock = searchParams.get("lowStock") === "true"
    const outOfStock = searchParams.get("outOfStock") === "true"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    let whereConditions = []
    let queryParams: any[] = []

    // Base query
    let query = `
      SELECT 
        gs.product_id,
        gs.godown_id,
        p.product_name,
        p.product_code,
        g.godown_name,
        gs.quantity,
        gs.reserved_quantity,
        gs.available_quantity,
        gs.minimum_level,
        gs.maximum_level,
        gs.reorder_point,
        gs.last_updated,
        pu.unit_name,
        CASE 
          WHEN gs.quantity <= 0 THEN 'out_of_stock'
          WHEN gs.minimum_level > 0 AND gs.quantity <= gs.minimum_level THEN 'low_stock'
          WHEN gs.maximum_level > 0 AND gs.quantity >= gs.maximum_level THEN 'overstock'
          ELSE 'in_stock'
        END as stock_status,
        COALESCE(recent_cost.unit_cost, 0) as last_cost
      FROM godown_stock gs
      JOIN products p ON gs.product_id = p.product_id
      JOIN godowns g ON gs.godown_id = g.godown_id
      JOIN product_units pu ON p.unit_id = pu.unit_id
      LEFT JOIN (
        SELECT 
          product_id, 
          godown_id, 
          unit_cost,
          ROW_NUMBER() OVER (PARTITION BY product_id, godown_id ORDER BY created_at DESC) as rn
        FROM stock_transactions 
        WHERE unit_cost IS NOT NULL
      ) recent_cost ON gs.product_id = recent_cost.product_id 
        AND gs.godown_id = recent_cost.godown_id 
        AND recent_cost.rn = 1
    `

    // Add filters
    if (productId) {
      whereConditions.push("gs.product_id = ?")
      queryParams.push(productId)
    }

    if (godownId) {
      whereConditions.push("gs.godown_id = ?")
      queryParams.push(godownId)
    }

    if (lowStock) {
      whereConditions.push("(gs.minimum_level > 0 AND gs.quantity <= gs.minimum_level)")
    }

    if (outOfStock) {
      whereConditions.push("gs.quantity <= 0")
    }

    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ")
    }

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM godown_stock gs
      JOIN products p ON gs.product_id = p.product_id
      JOIN godowns g ON gs.godown_id = g.godown_id
    `
    if (whereConditions.length > 0) {
      countQuery += " WHERE " + whereConditions.join(" AND ")
    }

    const [stockData, countData] = await Promise.all([
      executeQuery(query + " ORDER BY p.product_name, g.godown_name LIMIT ? OFFSET ?", [...queryParams, limit, offset]),
      executeQuery(countQuery, queryParams)
    ])

    const total = countData[0]?.total || 0
    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: stockData,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })
  } catch (error) {
    console.error("Stock levels error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}