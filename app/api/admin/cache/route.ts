// app/api/admin/cache/route.ts - Cache Management API
import { NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const key = searchParams.get("key")

  try {
    switch (action) {
      case "health":
        const healthCheck = await RedisService.healthCheck()
        return NextResponse.json(healthCheck)

      case "inspect":
        if (!key) {
          return NextResponse.json({ error: "Key parameter required" }, { status: 400 })
        }
        const rawData = await RedisService.getRawCache(key)
        const parsedData = await RedisService.getCached(key)
        return NextResponse.json({
          key,
          rawData: rawData ? rawData.substring(0, 500) : null,
          parsedData: parsedData ? (Array.isArray(parsedData) ? `Array(${parsedData.length})` : typeof parsedData) : null,
          isValidJson: rawData ? isValidJson(rawData) : false
        })

      case "customers":
        const customers = await RedisService.getCachedCustomers()
        return NextResponse.json({
          cached: customers !== null,
          count: customers ? customers.length : 0,
          preview: customers ? customers.slice(0, 2) : null
        })

      case "keys":
        // This might not work with Upstash, but let's try
        try {
          const keys = await RedisService.client.keys("*")
          return NextResponse.json({ keys: keys || [] })
        } catch (error) {
          return NextResponse.json({ error: "Keys command not supported", keys: [] })
        }

      default:
        return NextResponse.json({ 
          error: "Invalid action. Available actions: health, inspect, customers, keys" 
        }, { status: 400 })
    }
  } catch (error) {
    console.error("Cache management error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  try {
    switch (action) {
      case "clear-all":
        await RedisService.flushAll()
        return NextResponse.json({ message: "All cache cleared successfully" })

      case "clear-customers":
        await RedisService.invalidateCustomerCache()
        return NextResponse.json({ message: "Customer cache cleared successfully" })

      case "clear-vendors":
        await RedisService.invalidateVendorCache()
        return NextResponse.json({ message: "Vendor cache cleared successfully" })

      case "clear-products":
        await RedisService.invalidateProductCache()
        return NextResponse.json({ message: "Product cache cleared successfully" })

      case "clear-corrupted":
        const corruptedKeys = ["master:customers", "master:vendors", "master:products"]
        await RedisService.clearCorruptedCache(corruptedKeys)
        return NextResponse.json({ message: "Corrupted cache cleared successfully" })

      case "rebuild-customers":
        // This will force rebuild customer cache
        await RedisService.invalidateCustomerCache()
        // Trigger a rebuild by calling the customers API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/customers`)
        const result = await response.json()
        return NextResponse.json({ 
          message: "Customer cache rebuilt", 
          count: result.customers?.length || 0 
        })

      default:
        return NextResponse.json({ 
          error: "Invalid action. Available actions: clear-all, clear-customers, clear-vendors, clear-products, clear-corrupted, rebuild-customers" 
        }, { status: 400 })
    }
  } catch (error) {
    console.error("Cache management error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}