import { type NextRequest, NextResponse } from "next/server"
import { GSTService } from "@/lib/gst-service"
import { executeQuery} from "@/lib/database"


export async function POST(request: NextRequest) {
  try {
    const invoiceData = await request.json()
    const errors: string[] = []

    // Basic validations
    if (!invoiceData.customer_id) {
      errors.push("Customer is required")
    }

    if (!invoiceData.invoice_date) {
      errors.push("Invoice date is required")
    }

    if (!invoiceData.supply_type) {
      errors.push("Supply type is required")
    }

    if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      errors.push("At least one item is required")
    }

    // Item validations
    invoiceData.items?.forEach((item: any, index: number) => {
      if (!item.product_id) {
        errors.push(`Item ${index + 1}: Product is required`)
      }
      if (!item.qty || item.qty <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`)
      }
      if (!item.rate || item.rate <= 0) {
        errors.push(`Item ${index + 1}: Valid rate is required`)
      }
      if (!item.hsn_sac_code) {
        errors.push(`Item ${index + 1}: HSN/SAC code is required`)
      }
    })

    // GST validations
    if (invoiceData.customer_id) {
      const customers = await executeQuery(`
        SELECT customer_gst_in FROM master_customer WHERE customer_id = ?
      `, [invoiceData.customer_id])

      if (customers.length === 0) {
        errors.push("Customer not found")
      } else if (!customers[0].customer_gst_in) {
        errors.push("Customer GSTIN is required for e-invoice")
      }
    }

    return NextResponse.json({
      valid: errors.length === 0,
      errors
    })

  } catch (error) {
    console.error("Invoice validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}