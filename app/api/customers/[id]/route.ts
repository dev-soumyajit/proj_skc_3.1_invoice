// app/api/customers/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeUpdate } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customerId = parseInt(id)

    if (isNaN(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customerId = parseInt(id)

    if (isNaN(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    const customerData = await request.json()
    console.log("📝 Update data received:", customerData)

    // Check if customer exists
    const existingCustomer = await executeQuery(
      "SELECT customer_id FROM master_customer WHERE customer_id = ?",
      [customerId]
    )

    if (!existingCustomer.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Validate GST if provided
    if (customerData.customer_gst_in !== undefined) {
      const gst = String(customerData.customer_gst_in).trim().toUpperCase()
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) {
        return NextResponse.json({ error: "Invalid GST number format" }, { status: 400 })
      }
      const existingGst = await executeQuery(
        "SELECT customer_id FROM master_customer WHERE customer_gst_in = ? AND customer_id != ?",
        [gst, customerId]
      )
      if (existingGst.length > 0) {
        return NextResponse.json({ error: "GST number already exists for another customer" }, { status: 400 })
      }
    }

    // Validate required fields if provided
    if (customerData.customer_name !== undefined && !String(customerData.customer_name).trim()) {
      return NextResponse.json({ error: "Customer name cannot be empty if provided" }, { status: 400 })
    }
    if (customerData.customer_company_name !== undefined && !String(customerData.customer_company_name).trim()) {
      return NextResponse.json({ error: "Company name cannot be empty if provided" }, { status: 400 })
    }
    if (customerData.customer_address !== undefined && !String(customerData.customer_address).trim()) {
      return NextResponse.json({ error: "Address cannot be empty if provided" }, { status: 400 })
    }
    if (customerData.customer_state_name !== undefined && !String(customerData.customer_state_name).trim()) {
      return NextResponse.json({ error: "State cannot be empty if provided" }, { status: 400 })
    }

    // Helper function to safely handle string/number fields
    const safeStringValue = (value: any): string | null => {
      if (value === null || value === undefined || value === "") return null
      return String(value).trim() || null
    }

    const safeNumericValue = (value: any): string | null => {
      if (value === null || value === undefined || value === "") return null
      const num = typeof value === "string" ? value.trim() : String(value)
      return num || null
    }

    // Build dynamic update query
    const sets: string[] = []
    const params: any[] = []

    if (customerData.customer_name !== undefined) {
      sets.push("customer_name = ?")
      params.push(safeStringValue(customerData.customer_name))
    }
    if (customerData.customer_company_name !== undefined) {
      sets.push("customer_company_name = ?")
      params.push(safeStringValue(customerData.customer_company_name))
    }
    if (customerData.customer_gst_in !== undefined) {
      sets.push("customer_gst_in = ?")
      params.push(safeStringValue(customerData.customer_gst_in)?.toUpperCase())
    }
    if (customerData.customer_phone !== undefined) {
      sets.push("customer_phone = ?")
      params.push(safeStringValue(customerData.customer_phone))
    }
    if (customerData.customer_email !== undefined) {
      sets.push("customer_email = ?")
      params.push(safeStringValue(customerData.customer_email))
    }
    if (customerData.customer_address !== undefined) {
      sets.push("customer_address = ?")
      params.push(safeStringValue(customerData.customer_address))
    }
    if (customerData.customer_state_name !== undefined) {
      sets.push("customer_state_name = ?")
      params.push(safeStringValue(customerData.customer_state_name))
    }
    if (customerData.customer_state_code !== undefined) {
      sets.push("customer_state_code = ?")
      params.push(safeStringValue(customerData.customer_state_code))
    }
    if (customerData.customer_pin_code !== undefined) {
      sets.push("customer_pin_code = ?")
      params.push(safeNumericValue(customerData.customer_pin_code))
    }
    if (customerData.customer_type !== undefined) {
      sets.push("customer_type = ?")
      params.push(customerData.customer_type || "B2B")
    }
    if (customerData.is_sez !== undefined) {
      sets.push("is_sez = ?")
      params.push(customerData.is_sez ? 1 : 0)
    }
    if (customerData.is_export !== undefined) {
      sets.push("is_export = ?")
      params.push(customerData.is_export ? 1 : 0)
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 })
    }

    let query = "UPDATE master_customer SET " + sets.join(", ") + ", updated_at = NOW() WHERE customer_id = ?"
    params.push(customerId)

    const result = await executeUpdate(query, params)

    console.log("✅ Update result:", result)

    // Invalidate cache after updating customer
    try {
      await RedisService.invalidateCustomerCache()
      console.log("🧹 Customer cache invalidated after customer update")
    } catch (cacheError) {
      console.error("Failed to invalidate cache:", cacheError)
    }

    return NextResponse.json({
      message: "Customer updated successfully",
      affectedRows: result.affectedRows,
    })
  } catch (error) {
    console.error("💥 Update customer error:", error)
    return NextResponse.json(
      {
        error: "Failed to update customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customerId = parseInt(id)

    console.log("🗑️ DELETE request for customer ID:", customerId)

    if (isNaN(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    // Check if customer exists
    const existingCustomer = await executeQuery(
      "SELECT customer_id, customer_company_name FROM master_customer WHERE customer_id = ?",
      [customerId]
    )

    if (!existingCustomer.length) {
      console.log("❌ Customer not found in database")
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    console.log("✅ Customer found:", existingCustomer[0])

    // Check if customer has any invoices
    const invoiceCheck = await executeQuery(
      "SELECT COUNT(*) as count FROM tax_invoices WHERE customer_id = ?",
      [customerId]
    )

    if (invoiceCheck[0]?.count > 0) {
      console.log("❌ Customer has invoices, cannot delete")
      return NextResponse.json({ error: "Cannot delete customer with existing invoices" }, { status: 400 })
    }

    // Check if customer has any receipts
    const receiptCheck = await executeQuery(
      "SELECT COUNT(*) as count FROM customer_receipts WHERE customer_id = ?",
      [customerId]
    )

    if (receiptCheck[0]?.count > 0) {
      console.log("❌ Customer has receipts, cannot delete")
      return NextResponse.json({ error: "Cannot delete customer with existing receipts" }, { status: 400 })
    }

    console.log("✅ No dependent records found, proceeding with deletion")

    // Clear cache before deletion
    try {
      console.log("🧹 Pre-clearing cache before deletion...")
      await RedisService.nukeCustomerCache()
    } catch (cacheError) {
      console.error("Failed to clear cache before deletion:", cacheError)
    }

    // Delete from database
    const result = await executeUpdate("DELETE FROM master_customer WHERE customer_id = ?", [customerId])

    console.log("📊 Delete result:", result)

    if (result.affectedRows === 0) {
      console.log("❌ No rows affected - deletion failed")
      return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
    }

    console.log("✅ Customer successfully deleted from database")

    // Clear cache after deletion
    try {
      console.log("🧹 Post-deletion cache clearing...")
      await RedisService.nukeCustomerCache()
      setTimeout(async () => {
        console.log("🧹 Double-tap cache clearing...")
        await RedisService.invalidateCustomerCache()
      }, 500)
      await RedisService.forceRefreshCustomerCache()
    } catch (cacheError) {
      console.error("Failed to clear cache after deletion:", cacheError)
    }

    console.log("🎉 Customer deletion and cache clearing completed")

    return NextResponse.json({
      message: "Customer deleted successfully",
      affectedRows: result.affectedRows,
      deletedCustomer: existingCustomer[0].customer_company_name,
    })
  } catch (error) {
    console.error("💥 Delete customer error:", error)
    try {
      await RedisService.invalidateCustomerCache()
      console.log("🧹 Cache cleared despite error")
    } catch (cacheError) {
      console.error("💥 Cache clearing also failed:", cacheError)
    }
    return NextResponse.json(
      {
        error: "Failed to delete customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}