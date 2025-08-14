// app/api/customers/[id]/route.ts - FIXED for NextJS 15
import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeUpdate } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // FIXED: Await params for NextJS 15
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
        customer_legal_name,
        customer_trade_name,
        customer_pan,
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
    // Await params for NextJS 15
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

    // Validate required fields
    if (!customerData.customer_name?.trim || typeof customerData.customer_name !== 'string' || !customerData.customer_name.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 })
    }
    if (!customerData.customer_company_name?.trim || typeof customerData.customer_company_name !== 'string' || !customerData.customer_company_name.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    // Helper function to safely handle string/number fields
    const safeStringValue = (value: any): string | null => {
      if (value === null || value === undefined || value === '') return null
      return String(value).trim() || null
    }

    const safeNumericValue = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null
      const num = typeof value === 'string' ? parseInt(value.trim()) : Number(value)
      return isNaN(num) ? null : num
    }

    console.log("🔧 Processing customer data...")

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
        customer_legal_name = ?,
        customer_trade_name = ?,
        customer_pan = ?,
        is_sez = ?,
        is_export = ?,
        updated_at = NOW()
      WHERE customer_id = ?
      `,
      [
        safeStringValue(customerData.customer_name),
        safeStringValue(customerData.customer_company_name),
        safeStringValue(customerData.customer_gst_in)?.toUpperCase(),
        safeStringValue(customerData.customer_phone),
        safeStringValue(customerData.customer_email),
        safeStringValue(customerData.customer_address),
        safeStringValue(customerData.customer_state_name),
        safeStringValue(customerData.customer_state_code),
        safeNumericValue(customerData.customer_pin_code), // Handle as number
        customerData.customer_type || "B2B",
        safeStringValue(customerData.customer_legal_name),
        safeStringValue(customerData.customer_trade_name),
        safeStringValue(customerData.customer_pan),
        customerData.is_sez ? 1 : 0,
        customerData.is_export ? 1 : 0,
        customerId,
      ]
    )

    console.log("✅ Update result:", result)

    // Invalidate cache after updating customer
    await RedisService.invalidateCustomerCache()
    console.log("🧹 Customer cache invalidated after customer update")

    return NextResponse.json({
      message: "Customer updated successfully",
      affectedRows: result.affectedRows,
    })
  } catch (error) {
    console.error("💥 Update customer error:", error)
    console.error("💥 Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: "Failed to update customer",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params for NextJS 15
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

    // Check if customer has any invoices (prevent deletion if has transactions)
    const invoiceCheck = await executeQuery(
      "SELECT COUNT(*) as count FROM tax_invoices WHERE customer_id = ?",
      [customerId]
    )

    if (invoiceCheck[0]?.count > 0) {
      console.log("❌ Customer has invoices, cannot delete")
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
      console.log("❌ Customer has receipts, cannot delete")
      return NextResponse.json(
        { error: "Cannot delete customer with existing receipts" },
        { status: 400 }
      )
    }

    console.log("✅ No dependent records found, proceeding with deletion")

    // STEP 1: Clear cache BEFORE deletion to prevent race conditions
    console.log("🧹 Pre-clearing cache before deletion...")
    await RedisService.nukeCustomerCache()

    // STEP 2: Delete from database
    const result = await executeUpdate(
      "DELETE FROM master_customer WHERE customer_id = ?",
      [customerId]
    )

    console.log("📊 Delete result:", result)

    if (result.affectedRows === 0) {
      console.log("❌ No rows affected - deletion failed")
      return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
    }

    console.log("✅ Customer successfully deleted from database")

    // STEP 3: Aggressive cache clearing AFTER deletion
    console.log("🧹 Post-deletion cache clearing...")
    await RedisService.nukeCustomerCache()
    
    // STEP 4: Wait a moment and clear again (double-tap)
    setTimeout(async () => {
      console.log("🧹 Double-tap cache clearing...")
      await RedisService.invalidateCustomerCache()
    }, 500)

    // STEP 5: Force refresh to ensure clean state
    await RedisService.forceRefreshCustomerCache()

    console.log("🎉 Customer deletion and cache clearing completed")

    return NextResponse.json({
      message: "Customer deleted successfully",
      affectedRows: result.affectedRows,
      deletedCustomer: existingCustomer[0].customer_company_name
    })
  } catch (error) {
    console.error("💥 Delete customer error:", error)
    
    // Try to clear cache even on error to prevent stale data
    try {
      await RedisService.invalidateCustomerCache()
      console.log("🧹 Cache cleared despite error")
    } catch (cacheError) {
      console.error("💥 Cache clearing also failed:", cacheError)
    }
    
    return NextResponse.json({ 
      error: "Failed to delete customer",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}