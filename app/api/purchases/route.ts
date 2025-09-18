// app/api/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery, executeInsert, executeUpdate } from '@/lib/database'

interface PurchaseItem {
  product_id: number
  quantity: number
  rate: number
  hsn_sac_code?: string
}

interface CreatePurchaseRequest {
  vendor_id: number
  godown_id: number
  invoice_no: string
  invoice_date: string
  items: PurchaseItem[]
  remarks?: string
}

// GET /api/purchases - Fetch all purchases with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const vendor_id = searchParams.get('vendor_id') || ''
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (search) {
      whereClause += ' AND (p.invoice_no LIKE ? OR mv.vendor_name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (status) {
      whereClause += ' AND p.status = ?'
      params.push(status)
    }

    if (vendor_id) {
      whereClause += ' AND p.vendor_id = ?'
      params.push(vendor_id)
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM purchases p
      JOIN master_vendor mv ON p.vendor_id = mv.vendor_id
      ${whereClause}
    `
    const [countResult] = await executeQuery(countQuery, params)
    const total = countResult.total

    // Get purchases with details
    const purchasesQuery = `
      SELECT 
        p.*,
        mv.vendor_name,
        mv.vendor_person_name,
        mv.vendor_contact_no,
        g.godown_name,
        CASE 
          WHEN p.entry_date IS NOT NULL THEN 'received'
          ELSE 'pending'
        END as status
      FROM purchases p
      JOIN master_vendor mv ON p.vendor_id = mv.vendor_id
      JOIN godowns g ON p.godown_id = g.godown_id
      ${whereClause}
      ORDER BY p.invoice_date DESC, p.purchase_id DESC
      LIMIT ? OFFSET ?
    `
    
    params.push(limit, offset)
    const purchases = await executeQuery(purchasesQuery, params)

    // Get purchase details for each purchase
    for (let purchase of purchases) {
      const detailsQuery = `
        SELECT 
          pd.*,
          pr.product_name,
          pu.unit_name,
          hsc.hsn_sac_code
        FROM purchase_details pd
        JOIN products pr ON pd.product_id = pr.product_id
        JOIN product_units pu ON pr.unit_id = pu.unit_id
        LEFT JOIN hsn_sac_codes hsc ON pr.hsn_sac_id = hsc.hsn_sac_id
        WHERE pd.purchase_id = ?
      `
      const details = await executeQuery(detailsQuery, [purchase.purchase_id])
      purchase.items = details
    }

    return NextResponse.json({
      success: true,
      data: purchases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Purchase fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}

// POST /api/purchases - Create new purchase
export async function POST(request: NextRequest) {
  try {
    const data: CreatePurchaseRequest = await request.json()

    // Validate required fields
    if (!data.vendor_id || !data.godown_id || !data.invoice_no || !data.items?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate totals
    let taxable_amt = 0
    let cgst_amt = 0
    let sgst_amt = 0
    let igst_amt = 0

    // Get vendor details to determine if inter-state
    const vendorQuery = `
      SELECT vendor_state_code, vendor_gst 
      FROM master_vendor 
      WHERE vendor_id = ?
    `
    const [vendor] = await executeQuery(vendorQuery, [data.vendor_id])
    
    // Get company state from settings
    const companyStateQuery = `
      SELECT setting_value as company_state_code 
      FROM gst_settings 
      WHERE setting_key = 'company_state_code'
    `
    const [companySetting] = await executeQuery(companyStateQuery)
    const companyStateCode = companySetting?.company_state_code || '27'

    const isInterState = vendor.vendor_state_code !== companyStateCode

    // Calculate item-wise taxes and totals
    for (const item of data.items) {
      const itemTotal = item.quantity * item.rate
      taxable_amt += itemTotal

      // Get GST rates for product
      const productQuery = `
        SELECT hsc.hsn_sac_code
        FROM products p
        JOIN hsn_sac_codes hsc ON p.hsn_sac_id = hsc.hsn_sac_id
        WHERE p.product_id = ?
      `
      const [product] = await executeQuery(productQuery, [item.product_id])
      
      if (product) {
        const gstRateQuery = `
          SELECT cgst_rate, sgst_rate, igst_rate
          FROM gst_rates
          WHERE hsn_sac_code = ? AND is_active = 1
          ORDER BY effective_from DESC
          LIMIT 1
        `
        const [gstRate] = await executeQuery(gstRateQuery, [product.hsn_sac_code])
        
        if (gstRate) {
          if (isInterState) {
            const igst = (itemTotal * gstRate.igst_rate) / 100
            igst_amt += igst
          } else {
            const cgst = (itemTotal * gstRate.cgst_rate) / 100
            const sgst = (itemTotal * gstRate.sgst_rate) / 100
            cgst_amt += cgst
            sgst_amt += sgst
          }
        }
      }
    }

    const invoice_amount = taxable_amt + cgst_amt + sgst_amt + igst_amt

    // Create purchase record
    const purchaseQuery = `
      INSERT INTO purchases (
        vendor_id, godown_id, invoice_no, invoice_date, invoice_amount,
        taxable_amt, cgst_amt, sgst_amt, igst_amt, entry_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
    `
    
    const purchaseResult = await executeInsert(purchaseQuery, [
      data.vendor_id,
      data.godown_id,
      data.invoice_no,
      data.invoice_date,
      invoice_amount,
      taxable_amt,
      cgst_amt,
      sgst_amt,
      igst_amt
    ])

    const purchase_id = purchaseResult.insertId

    // Insert purchase details and update stock
    for (const item of data.items) {
      // Insert purchase detail
      const detailQuery = `
        INSERT INTO purchase_details (purchase_id, product_id, quantity)
        VALUES (?, ?, ?)
      `
      await executeInsert(detailQuery, [purchase_id, item.product_id, item.quantity])

      // Update or insert godown stock
      const stockQuery = `
        INSERT INTO godown_stock (godown_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `
      await executeInsert(stockQuery, [data.godown_id, item.product_id, item.quantity])
    }

    return NextResponse.json({
      success: true,
      data: { purchase_id, invoice_amount },
      message: 'Purchase created successfully'
    })

  } catch (error) {
    console.error('Purchase creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create purchase' },
      { status: 500 }
    )
  }
}
