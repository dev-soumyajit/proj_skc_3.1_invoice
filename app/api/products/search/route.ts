// app/api/products/search/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"
import { RedisService } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let search = searchParams.get("search") || ""
    let category = searchParams.get("category") || ""
    let subcategory = searchParams.get("subcategory") || ""
    let brand = searchParams.get("brand") || ""
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const sortBy = searchParams.get("sortBy") || "product_name"
    const sortOrder = searchParams.get("sortOrder") || "ASC"

    // Handle "all" filters from frontend
    if (category === "all") category = ""
    if (brand === "all") brand = ""

    // Create cache key
    const cacheKey = `products_search:${Buffer.from(JSON.stringify({
      search, category, subcategory, brand, limit, offset, sortBy, sortOrder
    })).toString('base64')}`

    // Try cache
    const cachedProducts = await RedisService.getCached(cacheKey)
    if (cachedProducts) {
      // Ensure cached products have numeric rate
      const normalizedProducts = cachedProducts.map((product: any) => ({
        ...product,
        rate: Number(product.rate) || 0,
        gst_rate: Number(product.gst_rate) || 0
      }))
      return NextResponse.json({ 
        products: normalizedProducts, 
        total: 0, // Recalculate if needed
        cached: true 
      })
    }

    let whereConditions = ["p.product_status = 1", "p.is_active = 1"]
    let params: any[] = []

    // Build dynamic search query
    if (search) {
      whereConditions.push(`(
        p.product_name LIKE ? OR 
        p.product_code LIKE ? OR 
        p.product_desc LIKE ? OR 
        p.keywords LIKE ? OR
        p.brand LIKE ? OR
        p.manufacturer LIKE ? OR
        p.model_number LIKE ?
      )`)
      const searchTerm = `%${search}%`
      for (let i = 0; i < 7; i++) {
        params.push(searchTerm)
      }
    }

    if (category) {
      whereConditions.push("p.product_category = ?")
      params.push(category)
    }

    if (subcategory) {
      whereConditions.push("p.product_subcategory = ?")
      params.push(subcategory)
    }

    if (brand) {
      whereConditions.push("p.brand = ?")
      params.push(brand)
    }

    let caseParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : ['%', '%', '%']
    const whereClause = whereConditions.join(" AND ")
    const fullParams = [...caseParams, ...params, limit, offset]

    const productsQuery = `
      SELECT 
        p.product_id,
        p.product_code,
        p.product_name,
        COALESCE(p.product_desc, '') as product_desc,
        p.product_category,
        p.product_subcategory,
        p.brand,
        p.manufacturer,
        p.model_number,
        CAST(COALESCE(p.rate, 0) AS DECIMAL(10,2)) as rate,
        COALESCE(h.hsn_sac_code, '') as hsn_sac_code,
        CAST(COALESCE(h.gst_rate, 0) AS DECIMAL(10,2)) as gst_rate,
        COALESCE(u.unit_name, '') as unit_name,
        COALESCE(p.keywords, '') as keywords,
        COALESCE(p.tags, '[]') as tags,
        CASE 
          WHEN p.product_name LIKE ? THEN 1
          WHEN p.product_code LIKE ? THEN 2
          WHEN p.brand LIKE ? THEN 3
          ELSE 4
        END as relevance_score
      FROM products p
      LEFT JOIN hsn_sac_codes h ON p.hsn_sac_id = h.hsn_sac_id
      LEFT JOIN product_units u ON p.unit_id = u.unit_id
      WHERE ${whereClause}
      ORDER BY relevance_score ASC, ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `

    const products = await executeQuery(productsQuery, fullParams)

    // Ensure products is array and normalize numeric fields
    const productsArray = (Array.isArray(products) ? products : []).map(product => ({
      ...product,
      rate: Number(product.rate) || 0,
      gst_rate: Number(product.gst_rate) || 0
    }))

    // Get total count
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${whereClause}
    `, params)

    const total = Number(countResult[0]?.total) || 0

    const result = {
      products: productsArray,
      total,
      limit,
      offset
    }

    // Cache normalized products
    await RedisService.cache(cacheKey, productsArray, 300)

    return NextResponse.json(result)

  } catch (error) {
    console.error("Product search error:", error)
    return NextResponse.json({ 
      products: [], 
      total: 0, 
      error: "Search failed" 
    }, { status: 500 })
  }
}