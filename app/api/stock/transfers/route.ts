import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeInsert } from "@/lib/database"

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
      whereClause = "WHERE st.status = ?"
      queryParams.push(status)
    }

    const query = `
      SELECT 
        st.transfer_id,
        st.transfer_no,
        st.transfer_date,
        st.status,
        st.total_items,
        g1.godown_name as from_godown,
        g2.godown_name as to_godown,
        u1.name_display as transferred_by_name,
        u2.name_display as received_by_name,
        st.transfer_notes,
        st.received_notes,
        st.created_at,
        st.updated_at
      FROM stock_transfers st
      JOIN godowns g1 ON st.from_godown_id = g1.godown_id
      JOIN godowns g2 ON st.to_godown_id = g2.godown_id
      LEFT JOIN master_user u1 ON st.transferred_by = u1.user_id
      LEFT JOIN master_user u2 ON st.received_by = u2.user_id
      ${whereClause}
      ORDER BY st.created_at DESC
      LIMIT ? OFFSET ?
    `

    const transfers = await executeQuery(query, [...queryParams, limit, offset])

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM stock_transfers st ${whereClause}`
    const countData = await executeQuery(countQuery, queryParams)
    const total = countData[0]?.total || 0
    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: transfers,
      pagination: { page, limit, total, pages }
    })
  } catch (error) {
    console.error("Stock transfers error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      transfer_date,
      from_godown_id,
      to_godown_id,
      items,
      transfer_notes,
      transferred_by = 1
    } = body

    // Validate godowns are different
    if (from_godown_id === to_godown_id) {
      return NextResponse.json({ success: false, error: "Source and destination godowns must be different" }, { status: 400 })
    }

    // Generate transfer number
    const transferNo = `TRF/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`

    // Insert transfer header
    const transferId = await executeInsert(`
      INSERT INTO stock_transfers (
        transfer_no, transfer_date, from_godown_id, to_godown_id, 
        total_items, transfer_notes, transferred_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
    `, [transferNo, transfer_date, from_godown_id, to_godown_id, items.length, transfer_notes, transferred_by])

    // Insert transfer details
    for (const item of items) {
      // Check if sufficient stock is available
      const stockCheck = await executeQuery(`
        SELECT quantity FROM godown_stock 
        WHERE product_id = ? AND godown_id = ?
      `, [item.product_id, from_godown_id])

      const availableStock = stockCheck[0]?.quantity || 0
      if (availableStock < item.quantity) {
        return NextResponse.json({ 
          success: false, 
          error: `Insufficient stock for product ID ${item.product_id}. Available: ${availableStock}, Required: ${item.quantity}` 
        }, { status: 400 })
      }

      await executeInsert(`
        INSERT INTO stock_transfer_details (
          transfer_id, product_id, quantity, unit_cost, remarks
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        transferId,
        item.product_id,
        item.quantity,
        item.unit_cost || null,
        item.remarks || null
      ])
    }

    return NextResponse.json({
      success: true,
      data: { transfer_id: transferId, transfer_no: transferNo },
      message: "Stock transfer created successfully"
    })
  } catch (error) {
    console.error("Create stock transfer error:", error)
    return NextResponse.json({ success: false, error: "Failed to create stock transfer" }, { status: 500 })
  }
}