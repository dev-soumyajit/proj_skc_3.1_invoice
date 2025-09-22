import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeInsert } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const godownId = searchParams.get("godownId")
    const transactionType = searchParams.get("type")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let whereConditions = []
    let queryParams: any[] = []

    let query = `
      SELECT 
        st.transaction_id,
        st.product_id,
        st.godown_id,
        p.product_name,
        g.godown_name,
        st.transaction_type,
        st.reference_type,
        st.reference_id,
        st.quantity,
        st.running_balance,
        st.unit_cost,
        st.remarks,
        st.created_at,
        pu.unit_name,
        u.name_display as created_by_name
      FROM stock_transactions st
      JOIN products p ON st.product_id = p.product_id
      JOIN godowns g ON st.godown_id = g.godown_id
      JOIN product_units pu ON p.unit_id = pu.unit_id
      LEFT JOIN master_user u ON st.created_by = u.user_id
    `

    if (productId) {
      whereConditions.push("st.product_id = ?")
      queryParams.push(productId)
    }

    if (godownId) {
      whereConditions.push("st.godown_id = ?")
      queryParams.push(godownId)
    }

    if (transactionType) {
      whereConditions.push("st.transaction_type = ?")
      queryParams.push(transactionType)
    }

    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ")
    }

    query += " ORDER BY st.created_at DESC LIMIT ? OFFSET ?"
    queryParams.push(limit, offset)

    const transactions = await executeQuery(query, queryParams)

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM stock_transactions st"
    let countParams = queryParams.slice(0, -2) // Remove limit and offset

    if (whereConditions.length > 0) {
      countQuery += " WHERE " + whereConditions.join(" AND ")
    }

    const countData = await executeQuery(countQuery, countParams)
    const total = countData[0]?.total || 0
    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })
  } catch (error) {
    console.error("Stock transactions error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}