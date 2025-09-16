// app/api/products/export/route.ts
import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database" // Adjust path to your DB utility

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    const products = await executeQuery(`
      SELECT 
        p.product_code, p.product_name, p.product_desc, p.product_type,
        p.product_category, p.product_subcategory, p.brand, p.manufacturer,
        p.model_number, h.hsn_sac_code, u.unit_name, p.rate, p.keywords
      FROM products p
      LEFT JOIN hsn_sac_codes h ON p.hsn_sac_id = h.hsn_sac_id
      LEFT JOIN product_units u ON p.unit_id = u.unit_id
      WHERE p.product_status = 1 AND p.is_active = 1
      ORDER BY p.product_name
    `)

    if (format === "csv") {
      const headers = [
        "product_code",
        "product_name",
        "product_desc",
        "product_type",
        "product_category",
        "product_subcategory",
        "brand",
        "manufacturer",
        "model_number",
        "hsn_sac_code",
        "unit_name",
        "rate",
        "keywords",
      ]

      const csvRows = products.map((product: any) =>
        headers
          .map((header) => {
            const value = product[header] ?? ""
            return `"${String(value).replace(/"/g, '""')}"`
          })
          .join(",")
      )

      const csvContent = [headers.join(","), ...csvRows].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="products_export.csv"',
        },
      })
    }

    // Handle other formats (xlsx, json) if needed
    return NextResponse.json(products)
  } catch (error: any) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}