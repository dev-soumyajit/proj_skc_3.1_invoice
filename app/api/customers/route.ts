import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeInsert } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let customers = await RedisService.getCachedCustomers()

    if (!customers) {
      customers = await executeQuery(`
        SELECT 
          customer_id,
          customer_name,
          customer_company_name,
          customer_gst_in,
          customer_mobile,
          customer_email,
          customer_address,
          customer_city,
          customer_state,
          customer_pincode,
          customer_type,
          customer_status,
          created_at
        FROM master_customer 
        WHERE customer_status = 1 
        ORDER BY customer_company_name ASC
      `)

      await RedisService.cacheCustomers(customers)
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
          customer.customer_gst_in.toLowerCase().includes(search.toLowerCase()),
      )

      await RedisService.cacheSearchResults(`customers:${search}`, filteredCustomers)

      return NextResponse.json({ customers: filteredCustomers, cached: false })
    }

    return NextResponse.json({ customers, cached: customers !== null })
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
        customer_mobile,
        customer_email,
        customer_address,
        customer_city,
        customer_state,
        customer_pincode,
        customer_type,
        customer_status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `,
      [
        customerData.customer_name,
        customerData.customer_company_name,
        customerData.customer_gst_in,
        customerData.customer_mobile,
        customerData.customer_email,
        customerData.customer_address,
        customerData.customer_city,
        customerData.customer_state,
        customerData.customer_pincode,
        customerData.customer_type,
      ],
    )

    // Invalidate cache after creating new customer
    await RedisService.invalidateCustomerCache()

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
