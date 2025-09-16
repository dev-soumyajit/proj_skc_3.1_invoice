import { type NextRequest, NextResponse } from "next/server"
import { executeQuery , executeUpdate , executeInsert } from "@/lib/database"
import { RedisService } from "@/lib/redis"




export async function GET(request: NextRequest) {
  try {
    const categories = await executeQuery(`
      SELECT 
        c1.category_id,
        c1.category_name,
        c1.parent_category_id,
        c2.category_name as parent_category_name,
        c1.category_description,
        c1.sort_order,
        COUNT(p.product_id) as product_count
      FROM product_categories c1
      LEFT JOIN product_categories c2 ON c1.parent_category_id = c2.category_id
      LEFT JOIN products p ON c1.category_name = p.product_category
      WHERE c1.is_active = 1
      GROUP BY c1.category_id
      ORDER BY c1.sort_order ASC, c1.category_name ASC
    `)

    return NextResponse.json({ categories })

  } catch (error) {
    console.error("Categories API error:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}