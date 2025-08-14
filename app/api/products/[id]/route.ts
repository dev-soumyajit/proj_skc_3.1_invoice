// app/api/products/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeUpdate } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const products = await executeQuery(`
      SELECT 
        p.product_id,
        p.product_name,
        p.product_desc,
        p.product_type,
        p.rate,
        p.hsn_sac_id,
        p.unit_id,
        h.hsn_sac_code,
        u.unit_name,
        h.gst_rate,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN product_units u ON p.unit_id = u.unit_id
      LEFT JOIN hsn_sac_codes h ON p.hsn_sac_id = h.hsn_sac_id
      WHERE p.product_id = ? AND p.product_status = 1
    `, [productId])

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product: products[0] })
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const productData = await request.json()

    // Validate required fields
    const requiredFields = ['product_name', 'product_desc', 'product_type', 'hsn_sac_id', 'unit_id']
    for (const field of requiredFields) {
      if (!productData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Check if product exists
    const existingProducts = await executeQuery(
      "SELECT product_id FROM products WHERE product_id = ? AND product_status = 1",
      [productId]
    )

    if (existingProducts.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const result = await executeUpdate(
      `
      UPDATE products 
      SET 
        product_name = ?,
        product_desc = ?,
        product_type = ?,
        hsn_sac_id = ?,
        unit_id = ?,
        rate = ?,
        updated_at = NOW()
      WHERE product_id = ?
      `,
      [
        productData.product_name,
        productData.product_desc,
        productData.product_type,
        productData.hsn_sac_id,
        productData.unit_id,
        productData.rate || 0,
        productId,
      ]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Failed to update product" }, { status: 400 })
    }

    await RedisService.invalidateProductCache()

    return NextResponse.json({
      message: "Product updated successfully",
      productId,
    })
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    // Check if product exists
    const existingProducts = await executeQuery(
      "SELECT product_id FROM products WHERE product_id = ? AND product_status = 1",
      [productId]
    )

    if (existingProducts.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if product is used in any invoices
    const usageCheck = await executeQuery(
      "SELECT COUNT(*) as count FROM invoice_details WHERE product_id = ?",
      [productId]
    )

    if (usageCheck[0]?.count > 0) {
      // Soft delete - just mark as inactive
      await executeUpdate(
        "UPDATE products SET product_status = 0, updated_at = NOW() WHERE product_id = ?",
        [productId]
      )
    } else {
      // Hard delete - completely remove
      await executeUpdate(
        "DELETE FROM products WHERE product_id = ?",
        [productId]
      )
    }

    await RedisService.invalidateProductCache()

    return NextResponse.json({
      message: "Product deleted successfully",
      productId,
    })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}