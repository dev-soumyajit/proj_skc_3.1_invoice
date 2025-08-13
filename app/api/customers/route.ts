// app/api/customers/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeInsert } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let customers = await RedisService.getCachedCustomers()

    // Debug the raw cache data using the public method
    const rawCacheData = await RedisService.getRawCache("master:customers")
    if (rawCacheData) {
      console.log("Raw cache data for master:customers:", rawCacheData)
    } else {
      console.log("No cache data found for master:customers")
    }

    // Handle invalid or empty cache
    if (!customers || !Array.isArray(customers)) {
      console.log("Cache is invalid or empty, fetching from database")
      customers = await executeQuery(`
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
        ORDER BY customer_company_name ASC
      `)

      if (customers && customers.length > 0) {
        await RedisService.cacheCustomers(customers)
      } else {
        console.log("No customers found in database")
        customers = []
      }
    }

    if (search) {
      const cachedSearchResults = await RedisService.getCachedSearchResults(`customers:${search}`)

      if (cachedSearchResults) {
        return NextResponse.json({ customers: cachedSearchResults, cached: true })
      }

      const filteredCustomers = customers.filter(
        (customer: any) =>
          customer.customer_company_name.toLowerCase().includes(search.toLowerCase()) ||
          customer.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          customer.customer_gst_in.toLowerCase().includes(search.toLowerCase()) ||
          (customer.customer_email && customer.customer_email.toLowerCase().includes(search.toLowerCase())) ||
          (customer.customer_phone && customer.customer_phone.includes(search))
      )

      await RedisService.cacheSearchResults(`customers:${search}`, filteredCustomers)

      return NextResponse.json({ customers: filteredCustomers, cached: false })
    }

    return NextResponse.json({ customers, cached: customers.length > 0 })
  } catch (error) {
    console.error("Customers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const customerData = await request.json()

    // Validate required fields
    if (!customerData.customer_name?.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 })
    }
    if (!customerData.customer_company_name?.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }
    if (!customerData.customer_gst_in?.trim()) {
      return NextResponse.json({ error: "GST number is required" }, { status: 400 })
    }
    if (!customerData.customer_address?.trim()) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }
    if (!customerData.customer_state_name?.trim()) {
      return NextResponse.json({ error: "State is required" }, { status: 400 })
    }

    // Check if GST number already exists
    const existingCustomer = await executeQuery(
      "SELECT customer_id FROM master_customer WHERE customer_gst_in = ?",
      [customerData.customer_gst_in.toUpperCase()]
    )

    if (existingCustomer.length > 0) {
      return NextResponse.json({ error: "Customer with this GST number already exists" }, { status: 400 })
    }

    const result = await executeInsert(
      `
      INSERT INTO master_customer (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        customerData.customer_name.trim(),
        customerData.customer_company_name.trim(),
        customerData.customer_gst_in.toUpperCase().trim(),
        customerData.customer_phone?.trim() || null,
        customerData.customer_email?.trim() || null,
        customerData.customer_address.trim(),
        customerData.customer_state_name.trim(),
        customerData.customer_state_code?.trim() || null,
        customerData.customer_pin_code?.trim() || null,
        customerData.customer_type || "B2B",
        customerData.customer_legal_name?.trim() || null,
        customerData.customer_trade_name?.trim() || null,
        customerData.customer_pan?.trim() || null,
        customerData.is_sez ? 1 : 0,
        customerData.is_export ? 1 : 0,
      ],
    )

    // Invalidate cache after creating new customer
    await RedisService.invalidateCustomerCache()
    console.log("Customer cache invalidated after new customer creation")

    return NextResponse.json(
      {
        message: "Customer created successfully",
        customerId: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create customer error:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}