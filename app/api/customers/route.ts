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
          customer_phone AS customer_mob,
          customer_email,
          customer_address,
          customer_state_name,
          customer_state_code,
          customer_pin_code AS customer_pincode,
          customer_type,
          is_sez,
          is_export,
          created_at
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
      const cachedSearchResults = await RedisService.getCachedSearchResults(search)

      if (cachedSearchResults) {
        return NextResponse.json({ customers: cachedSearchResults, cached: true })
      }

      const filteredCustomers = customers.filter(
        (customer: any) =>
          customer.customer_company_name.toLowerCase().includes(search.toLowerCase()) ||
          customer.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          customer.customer_gst_in.toLowerCase().includes(search.toLowerCase()),
      )

      await RedisService.cacheSearchResults(search, filteredCustomers)

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
        is_sez,
        is_export,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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