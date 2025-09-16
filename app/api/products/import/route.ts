// app/api/products/import/route.ts
import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database" // Adjust path to your DB utility
import Papa from "papaparse"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Parse CSV file
    const text = await file.text()
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: {
        rate: true,
      },
    })

    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: "Invalid CSV format", errors: parsed.errors }, { status: 400 })
    }

  const products = (parsed.data as any[]).filter((row: any) => row.product_name && row.product_code)
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

  for (const product of products as any[]) {
      try {
        // Validate and fetch hsn_sac_id
        const hsnSacResult = await executeQuery(
          "SELECT hsn_sac_id FROM hsn_sac_codes WHERE hsn_sac_code = ?",
          [product.hsn_sac_code || ""]
        )
        const hsn_sac_id = hsnSacResult.length > 0 ? hsnSacResult[0].hsn_sac_id : null

        if (!hsn_sac_id) {
          throw new Error(`Invalid HSN/SAC code: ${product.hsn_sac_code}`)
        }

        // Validate and fetch unit_id
        const unitResult = await executeQuery(
          "SELECT unit_id FROM product_units WHERE unit_name = ?",
          [product.unit_name || "Piece"]
        )
        const unit_id = unitResult.length > 0 ? unitResult[0].unit_id : 1 // Default to Piece

        // Insert product
        await executeQuery(
          `INSERT INTO products (
            product_code, product_name, product_desc, product_type, product_category, 
            product_subcategory, brand, manufacturer, model_number, hsn_sac_id, unit_id, 
            rate, keywords, product_status, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
          [
            product.product_code || null,
            product.product_name,
            product.product_desc || "",
            product.product_type || "finished",
            product.product_category || null,
            product.product_subcategory || null,
            product.brand || null,
            product.manufacturer || null,
            product.model_number || null,
            hsn_sac_id,
            unit_id,
            Number(product.rate) || 0,
            product.keywords || null,
          ]
        )
        successCount++
      } catch (error: any) {
        errorCount++
        errors.push(`Product ${product.product_name}: ${error.message}`)
      }
    }

    return NextResponse.json({
      successCount,
      errorCount,
      errors,
      total: products.length,
    })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Import failed", successCount: 0, errorCount: 0, errors: [error.message] },
      { status: 500 }
    )
  }
}
