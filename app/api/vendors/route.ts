import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeInsert } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let vendors = await RedisService.getCachedVendors()

    if (!vendors) {
      vendors = await executeQuery(`
        SELECT 
          vendor_id,
          vendor_name,
          vendor_person_name,
          vendor_contact_no,
          vendor_state,
          vendor_state_code,
          vendor_gst,
          vendor_address,
          created_at
        FROM master_vendor 
        ORDER BY vendor_name ASC
      `)

      await RedisService.cacheVendors(vendors)
    }

    if (search) {
      const cachedSearchResults = await RedisService.getCachedSearchResults(`vendors:${search}`)

      if (cachedSearchResults) {
        return NextResponse.json({ vendors: cachedSearchResults, cached: true })
      }

      const filteredVendors = vendors.filter(
        (vendor: any) =>
          vendor.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
          vendor.vendor_person_name.toLowerCase().includes(search.toLowerCase()) ||
          vendor.vendor_gst.toLowerCase().includes(search.toLowerCase()),
      )

      await RedisService.cacheSearchResults(`vendors:${search}`, filteredVendors)

      return NextResponse.json({ vendors: filteredVendors, cached: false })
    }

    return NextResponse.json({ vendors, cached: vendors !== null })
  } catch (error) {
    console.error("Vendors API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendorData = await request.json()

    const result = await executeInsert(
      `
      INSERT INTO master_vendor (
        vendor_name,
        vendor_person_name,
        vendor_contact_no,
        vendor_state,
        vendor_state_code,
        vendor_gst,
        vendor_address,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `,
      [
        vendorData.vendor_name,
        vendorData.vendor_person_name,
        vendorData.vendor_contact_no,
        vendorData.vendor_state,
        vendorData.vendor_state_code,
        vendorData.vendor_gst,
        vendorData.vendor_address,
      ],
    )

    await RedisService.invalidateVendorCache()

    return NextResponse.json(
      {
        message: "Vendor created successfully",
        vendorId: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create vendor error:", error)
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 })
  }
}