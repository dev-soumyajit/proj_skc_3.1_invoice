import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    const brands = await executeQuery(`
      SELECT DISTINCT brand
      FROM products
      WHERE brand IS NOT NULL 
        AND brand != ''
        AND product_status = 1 
        AND is_active = 1
      ORDER BY brand ASC
    `);

    const brandList = brands.map((row: any) => row.brand);

    return NextResponse.json({ brands: brandList });
  } catch (error) {
    console.error("Brands API error:", error);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}