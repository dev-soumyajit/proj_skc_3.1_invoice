// app/api/customers/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeInsert } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let customers = await RedisService.getCachedCustomers()

    // Debug the raw cache data
    const rawCacheData = await RedisService.getRawCache("master:customers")
    if (rawCacheData) {
      console.log("Raw cache data exists, length:", rawCacheData.length)
    } else {
      console.log("No cache data found for master:customers")
    }

    // Handle invalid or empty cache
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
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
          is_sez,
          is_export,
          created_at,
          updated_at
        FROM master_customer 
        ORDER BY customer_company_name ASC
      `)

      console.log("Fetched from database:", customers.length, "customers")

      if (customers && customers.length > 0) {
        try {
          await RedisService.cacheCustomers(customers)
          console.log("Successfully cached", customers.length, "customers")
        } catch (cacheError) {
          console.error("Failed to cache customers:", cacheError)
        }
      } else {
        console.log("No customers found in database")
        customers = []
      }
    } else {
      console.log("Using cached customers:", customers.length, "items")
    }

    // Handle search
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase()
      const cachedSearchResults = await RedisService.getCachedSearchResults(`customers:${searchTerm}`)

      if (cachedSearchResults && Array.isArray(cachedSearchResults)) {
        console.log("Returning cached search results:", cachedSearchResults.length)
        return NextResponse.json({ customers: cachedSearchResults, cached: true })
      }

      const filteredCustomers = customers.filter((customer: any) => {
        if (!customer) return false
        const searchableFields = [
          customer.customer_company_name,
          customer.customer_name,
          customer.customer_gst_in,
          customer.customer_email,
          customer.customer_phone,
        ].filter(Boolean).map((field) => String(field).toLowerCase())
        return searchableFields.some((field) => field.includes(searchTerm))
      })

      console.log("Filtered customers:", filteredCustomers.length)

      try {
        await RedisService.cacheSearchResults(`customers:${searchTerm}`, filteredCustomers)
      } catch (cacheError) {
        console.error("Failed to cache search results:", cacheError)
      }

      return NextResponse.json({ customers: filteredCustomers, cached: false })
    }

    return NextResponse.json({ 
      customers, 
      cached: customers.length > 0,
      total: customers.length 
    })
  } catch (error) {
    console.error("Customers API error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      customers: [],
      cached: false 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const customerData = await request.json()
    console.log("📝 Create customer data received:", customerData)

    // Validate required fields
    const requiredFields = [
      { field: "customer_name", name: "Customer name" },
      { field: "customer_company_name", name: "Company name" },
      { field: "customer_gst_in", name: "GST number" },
      { field: "customer_address", name: "Address" },
      { field: "customer_state_name", name: "State" },
    ]

    for (const { field, name } of requiredFields) {
      if (!customerData[field]?.trim()) {
        return NextResponse.json({ error: `${name} is required` }, { status: 400 })
      }
    }

    // Validate GST format
    const gstNumber = customerData.customer_gst_in.toUpperCase().trim()
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
      return NextResponse.json({ error: "Invalid GST number format" }, { status: 400 })
    }

    // Check if GST number already exists
    const existingCustomer = await executeQuery(
      "SELECT customer_id FROM master_customer WHERE customer_gst_in = ?",
      [gstNumber]
    )

    if (existingCustomer.length > 0) {
      return NextResponse.json({ error: "Customer with this GST number already exists" }, { status: 400 })
    }

    // Handle optional fields
    const safeStringValue = (value: any): string | null => {
      if (value === null || value === undefined || value === "") return null
      return String(value).trim() || null
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
        is_sez,
        is_export,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        safeStringValue(customerData.customer_name),
        safeStringValue(customerData.customer_company_name),
        gstNumber,
        safeStringValue(customerData.customer_phone),
        safeStringValue(customerData.customer_email),
        safeStringValue(customerData.customer_address),
        safeStringValue(customerData.customer_state_name),
        safeStringValue(customerData.customer_state_code) || null,
        safeStringValue(customerData.customer_pin_code),
        customerData.customer_type || "B2B",
        customerData.is_sez ? 1 : 0,
        customerData.is_export ? 1 : 0,
      ]
    )

    console.log("Customer created with ID:", result.insertId)

    // Invalidate cache after creating new customer
    try {
      await RedisService.invalidateCustomerCache()
      console.log("Customer cache invalidated after new customer creation")
    } catch (cacheError) {
      console.error("Failed to invalidate cache:", cacheError)
    }

    return NextResponse.json(
      {
        message: "Customer created successfully",
        customerId: result.insertId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create customer error:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}