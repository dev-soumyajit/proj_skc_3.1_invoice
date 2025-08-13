// app/api/customers/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeUpdate } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = parseInt(params.id)

    const customer = await executeQuery(
      `
      SELECT 
        customer_id,
        customer_name,
        customer_company_name,
        customer_gst_in,
        customer_phone,
        customer_email,
        customer_address,
        customer_state_name,
        customer_state_code,
        customer_pin_code,
        customer_type,
        is_sez,
        is_export,
        created_at,
        updated_at
      FROM master_customer 
      WHERE customer_id = ?
      `,
      [customerId]
    )

    if (!customer.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ customer: customer[0] })
  } catch (error) {
    console.error("Get customer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = parseInt(params.id)
    const customerData = await request.json()

    // Check if customer exists
    const existingCustomer = await executeQuery(
      "SELECT customer_id FROM master_customer WHERE customer_id = ?",
      [customerId]
    )

    if (!existingCustomer.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const result = await executeUpdate(
      `
      UPDATE master_customer SET
        customer_name = ?,
        customer_company_name = ?,
        customer_gst_in = ?,
        customer_phone = ?,
        customer_email = ?,
        customer_address = ?,
        customer_state_name = ?,
        customer_state_code = ?,
        customer_pin_code = ?,
        customer_type = ?,
        is_sez = ?,
        is_export = ?,
        updated_at = NOW()
      WHERE customer_id = ?
      `,
      [
        customerData.customer_name,
        customerData.customer_company_name,
        customerData.customer_gst_in,
        customerData.customer_phone || null,
        customerData.customer_email || null,
        customerData.customer_address,
        customerData.customer_state_name,
        customerData.customer_state_code,
        customerData.customer_pin_code || null,
        customerData.customer_type || "B2B",
        customerData.is_sez || 0,
        customerData.is_export || 0,
        customerId,
      ]
    )

    // Invalidate cache after updating customer
    await RedisService.invalidateCustomerCache()
    console.log("Customer cache invalidated after customer update")

    return NextResponse.json({
      message: "Customer updated successfully",
      affectedRows: result.affectedRows,
    })
  } catch (error) {
    console.error("Update customer error:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = parseInt(params.id)

    // Check if customer exists
    const existingCustomer = await executeQuery(
      "SELECT customer_id, customer_company_name FROM master_customer WHERE customer_id = ?",
      [customerId]
    )

    if (!existingCustomer.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Check if customer has any invoices (prevent deletion if has transactions)
    const invoiceCheck = await executeQuery(
      "SELECT COUNT(*) as count FROM tax_invoices WHERE customer_id = ?",
      [customerId]
    )

    if (invoiceCheck[0]?.count > 0) {
      return NextResponse.json(
        { error: "Cannot delete customer with existing invoices" },
        { status: 400 }
      )
    }

    // Check if customer has any receipts
    const receiptCheck = await executeQuery(
      "SELECT COUNT(*) as count FROM customer_receipts WHERE customer_id = ?",
      [customerId]
    )

    if (receiptCheck[0]?.count > 0) {
      return NextResponse.json(
        { error: "Cannot delete customer with existing receipts" },
        { status: 400 }
      )
    }

    const result = await executeUpdate(
      "DELETE FROM master_customer WHERE customer_id = ?",
      [customerId]
    )

    // Invalidate cache after deleting customer
    await RedisService.invalidateCustomerCache()
    console.log("Customer cache invalidated after customer deletion")

    return NextResponse.json({
      message: "Customer deleted successfully",
      affectedRows: result.affectedRows,
    })
  } catch (error) {
    console.error("Delete customer error:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}