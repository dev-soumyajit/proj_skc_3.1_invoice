// app/api/invoices/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeInsert, executeUpdate } from "@/lib/database"
import { RedisService } from "@/lib/redis"
import { GSTService } from "@/lib/gst-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let whereConditions = ["ti.invoice_id IS NOT NULL"]
    let params: any[] = []

    if (search) {
      whereConditions.push("(ti.invoice_no LIKE ? OR mc.customer_company_name LIKE ?)")
      params.push(`%${search}%`, `%${search}%`)
    }

    if (status) {
      whereConditions.push("ti.status = ?")
      params.push(status)
    }

    const invoices = await executeQuery(`
      SELECT 
        ti.invoice_id, ti.invoice_no, ti.invoice_date, ti.supply_type,
        ti.grand_total_qty, ti.grand_total_taxable_amt, ti.grand_total_cgst_amt,
        ti.grand_total_sgst_amt, ti.grand_total_amt, ti.status, ti.irn,
        ti.ack_no, ti.created_at, ti.error_code, ti.error_message,
        mc.customer_company_name, mc.customer_gst_in as buyer_gstin
      FROM tax_invoices ti
      JOIN master_customer mc ON ti.customer_id = mc.customer_id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY ti.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset])

    // Get total count
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total
      FROM tax_invoices ti
      JOIN master_customer mc ON ti.customer_id = mc.customer_id
      WHERE ${whereConditions.join(" AND ")}
    `, params)

    return NextResponse.json({
      invoices,
      total: countResult[0]?.total || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error("Get invoices error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const invoiceData = await request.json()

    // Validate required fields
    const requiredFields = ['customer_id', 'invoice_date', 'supply_type', 'items']
    for (const field of requiredFields) {
      if (!invoiceData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }

    // Generate invoice number
    const currentDate = new Date()
    const financialYear = currentDate.getMonth() >= 3 ? 
      `${currentDate.getFullYear()}-${(currentDate.getFullYear() + 1).toString().slice(-2)}` :
      `${currentDate.getFullYear() - 1}-${currentDate.getFullYear().toString().slice(-2)}`

    const invoiceSequence = await RedisService.getNextInvoiceNumber(
      currentDate.getFullYear(), 
      currentDate.getMonth() + 1
    )

    const invoiceNo = `INV/${financialYear}/${invoiceSequence.toString().padStart(3, '0')}`

    // Get customer details
    const customers = await executeQuery(`
      SELECT * FROM master_customer WHERE customer_id = ?
    `, [invoiceData.customer_id])

    if (customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 400 })
    }

    const customer = customers[0]

    // Calculate totals
    let grandTotalQty = 0
    let grandTotalTaxableAmt = 0
    let grandTotalCgstAmt = 0
    let grandTotalSgstAmt = 0
    let grandTotalIgstAmt = 0
    let grandTotalAmt = 0

    // Determine if inter-state transaction
    const isInterState = customer.customer_state_code !== "27" // Assuming company is in Maharashtra

    for (const item of invoiceData.items) {
      grandTotalQty += item.qty
      grandTotalTaxableAmt += item.taxable_amt
      
      if (isInterState) {
        grandTotalIgstAmt += item.igst_amt || 0
      } else {
        grandTotalCgstAmt += item.cgst_amt
        grandTotalSgstAmt += item.sgst_amt
      }
      
      grandTotalAmt += item.total_amount
    }

    // Create invoice
    const invoiceResult = await executeInsert(`
      INSERT INTO tax_invoices (
        customer_id, invoice_no, invoice_date, supply_type,
        consignee_name, consignee_address, consignee_gstin,
        buyer_name, buyer_address, buyer_gstin, place_supply,
        grand_total_qty, grand_total_taxable_amt, grand_total_cgst_amt,
        grand_total_sgst_amt, grand_total_amt, amount_chargeable_word,
        remarks, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `, [
      invoiceData.customer_id,
      invoiceNo,
      invoiceData.invoice_date,
      invoiceData.supply_type,
      customer.customer_company_name,
      customer.customer_address,
      customer.customer_gst_in,
      customer.customer_company_name,
      customer.customer_address,
      customer.customer_gst_in,
      invoiceData.place_supply || customer.customer_state_name,
      grandTotalQty,
      grandTotalTaxableAmt,
      grandTotalCgstAmt,
      grandTotalSgstAmt,
      grandTotalAmt,
      invoiceData.amount_chargeable_word || `Rupees ${Math.floor(grandTotalAmt).toLocaleString('en-IN')} Only`,
      invoiceData.remarks
    ])

    const invoiceId = invoiceResult.insertId

    // Insert invoice items
    for (const item of invoiceData.items) {
      await executeInsert(`
        INSERT INTO invoice_details (
          invoice_id, product_id, hsn_sac_code, qty, rate, unit_id,
          taxable_amt, cgst_rate, cgst_amt, sgst_rate, sgst_amt,
          igst_rate, igst_amount, total_amount, product_description, discount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceId,
        item.product_id,
        item.hsn_sac_code,
        item.qty,
        item.rate,
        item.unit_id,
        item.taxable_amt,
        isInterState ? 0 : (item.cgst_rate || 0),
        isInterState ? 0 : (item.cgst_amt || 0),
        isInterState ? 0 : (item.sgst_rate || 0),
        isInterState ? 0 : (item.sgst_amt || 0),
        isInterState ? (item.igst_rate || 0) : 0,
        isInterState ? (item.igst_amt || 0) : 0,
        item.total_amount,
        item.product_description || item.product_name,
        item.discount || 0
      ])
    }

    return NextResponse.json({
      message: "Invoice created successfully",
      invoiceId,
      invoiceNo,
      status: "draft"
    }, { status: 201 })

  } catch (error) {
    console.error("Create invoice error:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
