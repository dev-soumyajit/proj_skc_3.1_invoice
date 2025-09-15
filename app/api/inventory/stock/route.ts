//inventory/stock/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeInsert } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const godownId = searchParams.get("godownId")

    if (!productId || !godownId) {
      return NextResponse.json({ error: "Product ID and Godown ID are required" }, { status: 400 })
    }

    // Try to get from Redis cache first
    let stockLevel = await RedisService.getStockLevel(productId, godownId)

    if (stockLevel === null) {
      const stockData = await executeQuery(
        `
        SELECT 
          COALESCE(SUM(stock_qty), 0) as current_stock
        FROM stock 
        WHERE product_id = ? AND godown_id = ?
      `,
        [productId, godownId],
      )

      stockLevel = stockData.length > 0 ? stockData[0].current_stock : 0

      // Cache the result
      await RedisService.cacheStockLevel(productId, godownId, stockLevel)
    }

    return NextResponse.json({
      productId,
      godownId,
      stockLevel,
      cached: stockLevel !== null,
    })
  } catch (error) {
    console.error("Stock level error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId, godownId, quantity, operation } = await request.json()

    if (!productId || !godownId || quantity === undefined || !operation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const adjustmentQty = operation === "add" ? quantity : -quantity

    await executeInsert(
      `
      INSERT INTO stock (
        product_id,
        godown_id,
        stock_qty,
        operation_type,
        reference_type,
        created_at
      ) VALUES (?, ?, ?, ?, 'manual_adjustment', NOW())
    `,
      [productId, godownId, adjustmentQty, operation],
    )

    // Invalidate cache after stock update
    await RedisService.invalidateStockCache(productId, godownId)

    return NextResponse.json({
      message: "Stock updated successfully",
      productId,
      godownId,
      operation,
      quantity,
    })
  } catch (error) {
    console.error("Stock update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


