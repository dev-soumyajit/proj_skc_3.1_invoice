import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeInsert, executeUpdate } from "@/lib/database"

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
          created_at,
          updated_at
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
          vendor.vendor_gst.toLowerCase().includes(search.toLowerCase()) ||
          vendor.vendor_state.toLowerCase().includes(search.toLowerCase()),
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

    // Validate required fields
    const requiredFields = [
      'vendor_name',
      'vendor_person_name', 
      'vendor_contact_no',
      'vendor_state',
      'vendor_state_code',
      'vendor_gst',
      'vendor_address'
    ]

    for (const field of requiredFields) {
      if (!vendorData[field]?.trim()) {
        return NextResponse.json(
          { error: `${field.replace('vendor_', '').replace('_', ' ')} is required` },
          { status: 400 }
        )
      }
    }

    // Validate GST format
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!gstRegex.test(vendorData.vendor_gst)) {
      return NextResponse.json(
        { error: "Invalid GST number format" },
        { status: 400 }
      )
    }

    // Check if GST already exists
    const existingVendor = await executeQuery(
      "SELECT vendor_id FROM master_vendor WHERE vendor_gst = ?",
      [vendorData.vendor_gst]
    )

    if (existingVendor.length > 0) {
      return NextResponse.json(
        { error: "Vendor with this GST number already exists" },
        { status: 409 }
      )
    }

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
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        vendorData.vendor_name.trim(),
        vendorData.vendor_person_name.trim(),
        vendorData.vendor_contact_no.trim(),
        vendorData.vendor_state.trim(),
        vendorData.vendor_state_code.trim(),
        vendorData.vendor_gst.trim().toUpperCase(),
        vendorData.vendor_address.trim(),
      ],
    )

    // Invalidate cache
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
    
    // Check for duplicate entry error
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        { error: "Vendor with this GST number already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 })
  }
}