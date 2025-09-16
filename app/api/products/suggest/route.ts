import { type NextRequest, NextResponse } from "next/server"
import { executeQuery , executeUpdate , executeInsert } from "@/lib/database"
import { RedisService } from "@/lib/redis"




export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "10")

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const cacheKey = `product_suggestions:${query}:${limit}`
    const cachedSuggestions = await RedisService.getCached(cacheKey)

    if (cachedSuggestions) {
      return NextResponse.json({ suggestions: cachedSuggestions })
    }

    const suggestions = await executeQuery(`
      SELECT DISTINCT
        product_id,
        product_code,
        product_name,
        product_category,
        brand,
        CASE 
          WHEN product_name LIKE ? THEN 1
          WHEN product_code LIKE ? THEN 2
          WHEN brand LIKE ? THEN 3
          ELSE 4
        END as relevance
      FROM products
      WHERE product_status = 1 AND is_active = 1
        AND (
          product_name LIKE ? OR 
          product_code LIKE ? OR 
          brand LIKE ? OR
          keywords LIKE ?
        )
      ORDER BY relevance ASC, product_name ASC
      LIMIT ?
    `, [
      `${query}%`, `${query}%`, `${query}%`,
      `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`,
      limit
    ])

    await RedisService.cache(cacheKey, suggestions, 600) // 10 minutes cache

    return NextResponse.json({ suggestions })

  } catch (error) {
    console.error("Suggestions API error:", error)
    return NextResponse.json({ error: "Failed to get suggestions" }, { status: 500 })
  }
}