import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeUpdate } from "@/lib/database"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: {params:Promise<{ id: string }> }) {
  try {

    const { id } = await params
    
    const vendorId = parseInt(id)
    
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    const vendor = await executeQuery(
      `
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
      WHERE vendor_id = ?
      `,
      [vendorId]
    )

    if (vendor.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    return NextResponse.json({ vendor: vendor[0] })
  } catch (error) {
    console.error("Get vendor error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const vendorId = parseInt(params.id)
    
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

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

    // Check if vendor exists
    const existingVendor = await executeQuery(
      "SELECT vendor_id FROM master_vendor WHERE vendor_id = ?",
      [vendorId]
    )

    if (existingVendor.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Check if GST already exists for different vendor
    const duplicateGST = await executeQuery(
      "SELECT vendor_id FROM master_vendor WHERE vendor_gst = ? AND vendor_id != ?",
      [vendorData.vendor_gst, vendorId]
    )

    if (duplicateGST.length > 0) {
      return NextResponse.json(
        { error: "Another vendor with this GST number already exists" },
        { status: 409 }
      )
    }

    const result = await executeUpdate(
      `
      UPDATE master_vendor SET
        vendor_name = ?,
        vendor_person_name = ?,
        vendor_contact_no = ?,
        vendor_state = ?,
        vendor_state_code = ?,
        vendor_gst = ?,
        vendor_address = ?,
        updated_at = NOW()
      WHERE vendor_id = ?
      `,
      [
        vendorData.vendor_name.trim(),
        vendorData.vendor_person_name.trim(),
        vendorData.vendor_contact_no.trim(),
        vendorData.vendor_state.trim(),
        vendorData.vendor_state_code.trim(),
        vendorData.vendor_gst.trim().toUpperCase(),
        vendorData.vendor_address.trim(),
        vendorId
      ]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "No changes made" }, { status: 400 })
    }

    // Invalidate cache
    await RedisService.invalidateVendorCache()

    return NextResponse.json({
      message: "Vendor updated successfully",
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error("Update vendor error:", error)
    
    // Check for duplicate entry error
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        { error: "Another vendor with this GST number already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const vendorId = parseInt(params.id)
    
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    // Check if vendor exists
    const existingVendor = await executeQuery(
      "SELECT vendor_id, vendor_name FROM master_vendor WHERE vendor_id = ?",
      [vendorId]
    )

    if (existingVendor.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Check if vendor is referenced in other tables (purchases, etc.)
    const referencedInPurchases = await executeQuery(
      "SELECT COUNT(*) as count FROM purchases WHERE vendor_id = ?",
      [vendorId]
    )

    const referencedInPayments = await executeQuery(
      "SELECT COUNT(*) as count FROM vendor_payments WHERE vendor_id = ?",
      [vendorId]
    )

    if (referencedInPurchases[0].count > 0 || referencedInPayments[0].count > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete vendor as it has associated purchases or payments. Please remove all references first." 
        },
        { status: 409 }
      )
    }
    const result = await executeUpdate(
      "DELETE FROM master_vendor WHERE vendor_id = ?",
      [vendorId]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Failed to delete vendor" }, { status: 400 })
    }

    // Invalidate cache
    await RedisService.invalidateVendorCache()

    return NextResponse.json({
      message: "Vendor deleted successfully",
      deletedVendor: existingVendor[0].vendor_name
    })
  } catch (error) {
    console.error("Delete vendor error:", error)
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 })
  }
}