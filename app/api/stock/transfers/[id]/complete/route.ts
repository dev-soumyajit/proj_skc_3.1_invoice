import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeInsert , executeUpdate } from "@/lib/database"



export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const transferId = parseInt(params.id)
    const { received_by = 1, received_notes, items } = await request.json()

    // Get transfer details
    const transferDetails = await executeQuery(`
      SELECT 
        std.product_id, 
        std.quantity,
        std.unit_cost,
        st.from_godown_id,
        st.to_godown_id
      FROM stock_transfer_details std
      JOIN stock_transfers st ON std.transfer_id = st.transfer_id
      WHERE st.transfer_id = ? AND st.status IN ('draft', 'in_transit')
    `, [transferId])

    if (transferDetails.length === 0) {
      return NextResponse.json({ success: false, error: "Transfer not found or already completed" }, { status: 404 })
    }

    // Process each item
    for (let i = 0; i < transferDetails.length; i++) {
      const detail = transferDetails[i]
      const receivedQuantity = items?.[i]?.received_quantity || detail.quantity

      // Reduce stock from source godown
      await executeQuery(`
        CALL UpdateStockLevel(?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        detail.product_id,
        detail.from_godown_id,
        detail.quantity,
        'transfer_out',
        'transfer',
        transferId,
        detail.unit_cost,
        'Stock transfer out',
        received_by
      ])

      // Increase stock in destination godown
      await executeQuery(`
        CALL UpdateStockLevel(?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        detail.product_id,
        detail.to_godown_id,
        receivedQuantity,
        'transfer_in',
        'transfer',
        transferId,
        detail.unit_cost,
        'Stock transfer in',
        received_by
      ])

      // Update received quantity in transfer details
      await executeUpdate(`
        UPDATE stock_transfer_details 
        SET received_quantity = ?
        WHERE transfer_id = ? AND product_id = ?
      `, [receivedQuantity, transferId, detail.product_id])
    }

    // Update transfer status
    await executeUpdate(`
      UPDATE stock_transfers 
      SET status = 'completed', received_by = ?, received_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE transfer_id = ?
    `, [received_by, received_notes, transferId])

    return NextResponse.json({
      success: true,
      message: "Stock transfer completed successfully"
    })
  } catch (error) {
    console.error("Complete stock transfer error:", error)
    return NextResponse.json({ success: false, error: "Failed to complete stock transfer" }, { status: 500 })
  }
}