import { NextRequest, NextResponse } from 'next/server'
import { executeQuery, executeInsert, executeUpdate } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchase_id = parseInt(params.id)

    const purchaseQuery = `
      SELECT 
        p.*,
        mv.vendor_name,
        mv.vendor_person_name,
        mv.vendor_contact_no,
        mv.vendor_address,
        mv.vendor_gst,
        g.godown_name,
        g.godown_address
      FROM purchases p
      JOIN master_vendor mv ON p.vendor_id = mv.vendor_id
      JOIN godowns g ON p.godown_id = g.godown_id
      WHERE p.purchase_id = ?
    `
    
    const [purchase] = await executeQuery(purchaseQuery, [purchase_id])
    
    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Get purchase items
    const itemsQuery = `
      SELECT 
        pd.*,
        pr.product_name,
        pr.product_desc,
        pu.unit_name,
        hsc.hsn_sac_code
      FROM purchase_details pd
      JOIN products pr ON pd.product_id = pr.product_id
      JOIN product_units pu ON pr.unit_id = pu.unit_id
      LEFT JOIN hsn_sac_codes hsc ON pr.hsn_sac_id = hsc.hsn_sac_id
      WHERE pd.purchase_id = ?
    `
    
    const items = await executeQuery(itemsQuery, [purchase_id])
    purchase.items = items

    return NextResponse.json({
      success: true,
      data: purchase
    })

  } catch (error) {
    console.error('Purchase fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase' },
      { status: 500 }
    )
  }
}