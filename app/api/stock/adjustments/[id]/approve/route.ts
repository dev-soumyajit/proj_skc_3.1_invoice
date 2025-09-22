    import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeUpdate } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adjustmentId = parseInt(params.id)
    const { approved_by = 1 } = await request.json()

    // Get adjustment details
    const adjustmentDetails = await executeQuery(`
      SELECT 
        sad.product_id, 
        sad.difference_quantity, 
        sad.unit_cost,
        sa.godown_id,
        sa.adjustment_type
      FROM stock_adjustment_details sad
      JOIN stock_adjustments sa ON sad.adjustment_id = sa.adjustment_id
      WHERE sa.adjustment_id = ? AND sa.status = 'draft'
    `, [adjustmentId])

    if (adjustmentDetails.length === 0) {
      return NextResponse.json({ success: false, error: "Adjustment not found or already processed" }, { status: 404 })
    }

    // Process each item
    for (const detail of adjustmentDetails) {
      const { product_id, difference_quantity, unit_cost, godown_id } = detail
      
      if (difference_quantity !== 0) {
        const transactionType = difference_quantity > 0 ? 'adjustment' : 'adjustment'
        
        // Call stored procedure to update stock
        await executeQuery(`
          CALL UpdateStockLevel(?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          product_id,
          godown_id,
          Math.abs(difference_quantity),
          transactionType,
          'adjustment',
          adjustmentId,
          unit_cost,
          'Stock adjustment approved',
          approved_by
        ])
      }
    }

    // Update adjustment status
    await executeUpdate(`
      UPDATE stock_adjustments 
      SET status = 'approved', approved_by = ?
      WHERE adjustment_id = ?
    `, [approved_by, adjustmentId])

    return NextResponse.json({
      success: true,
      message: "Stock adjustment approved and processed successfully"
    })
  } catch (error) {
    console.error("Approve stock adjustment error:", error)
    return NextResponse.json({ success: false, error: "Failed to approve stock adjustment" }, { status: 500 })
  }
}