// lib/redis.ts - FIXED VERSION
import { Redis } from "@upstash/redis"

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!upstashUrl || !upstashToken) {
      throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set")
    }

    redis = new Redis({
      url: upstashUrl,
      token: upstashToken,
    })
  }

  return redis
}

// Helper functions for consistent serialization
const serialize = (data: any): string => {
  try {
    return JSON.stringify(data)
  } catch (error) {
    console.error("Redis serialization error:", error)
    throw new Error("Failed to serialize data for Redis")
  }
}

const deserialize = <T>(data: string | null): T | null => {
  if (!data || data === null) return null
  
  try {
    // Handle case where data is already an object (shouldn't happen but safety check)
    if (typeof data === 'object') {
      console.warn("Redis data is already an object, returning as-is")
      return data as T
    }
    
    return JSON.parse(data) as T
  } catch (error) {
    console.error("Redis deserialization error:", error, "Raw data:", data)
    return null
  }
}

// Redis service functions for common operations using Upstash
export class RedisService {
  public static client = getRedisClient()

  // OTP Management
  static async storeOTP(email: string, otp: string, expiryMinutes = 10): Promise<void> {
    const key = `otp:${email}`
    await this.client.setex(key, expiryMinutes * 60, otp)
  }

  static async getOTP(email: string): Promise<string | null> {
    const key = `otp:${email}`
    return await this.client.get<string>(key)
  }

  static async deleteOTP(email: string): Promise<void> {
    const key = `otp:${email}`
    await this.client.del(key)
  }

  // Session Management
  static async storeSession(sessionId: string, userData: any, expiryHours = 24): Promise<void> {
    const key = `session:${sessionId}`
    const serializedData = serialize(userData)
    await this.client.setex(key, expiryHours * 3600, serializedData)
  }

  static async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`
    const data = await this.client.get<string>(key)
    return deserialize(data)
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`
    await this.client.del(key)
  }

  // Stock Level Caching
  static async cacheStockLevel(productId: string, godownId: string, quantity: number): Promise<void> {
    const key = `stock:${productId}:${godownId}`
    await this.client.setex(key, 300, quantity.toString()) // 5 minutes cache
  }

  static async getStockLevel(productId: string, godownId: string): Promise<number | null> {
    const key = `stock:${productId}:${godownId}`
    const quantity = await this.client.get<string>(key)
    return quantity ? Number.parseInt(quantity) : null
  }

  static async invalidateStockCache(productId: string, godownId?: string): Promise<void> {
    if (godownId) {
      const key = `stock:${productId}:${godownId}`
      await this.client.del(key)
    } else {
      // Use scan for pattern deletion
      await this.scanAndDelete(`stock:${productId}:*`)
    }
  }

  // Invoice Sequence Caching with atomic operations
  static async getNextInvoiceNumber(year: number, month: number): Promise<number> {
    const key = `invoice_seq:${year}:${month}`
    const next = await this.client.incr(key)
    if (next === 1) {
      await this.client.expire(key, 365 * 24 * 3600) // 1 year expiry
    }
    return next
  }

  // General Cache Operations with proper serialization
  static async cache(key: string, value: any, expirySeconds = 300): Promise<void> {
    const serializedValue = serialize(value)
    await this.client.setex(key, expirySeconds, serializedValue)
  }

  static async getCached<T = any>(key: string): Promise<T | null> {
    const data = await this.client.get<string>(key)
    return deserialize<T>(data)
  }

  static async getRawCache(key: string): Promise<string | null> {
    return await this.client.get<string>(key)
  }

  static async invalidateCache(pattern: string): Promise<void> {
    await this.scanAndDelete(pattern)
  }

  // Helper method for pattern-based deletion using SCAN
  private static async scanAndDelete(pattern: string): Promise<void> {
    try {
      // For Upstash, we'll use keys command but with error handling
      const keys = await this.client.keys(pattern)
      if (keys && keys.length > 0) {
        // Delete in batches to avoid timeout
        const batchSize = 100
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize)
          await Promise.all(batch.map(key => this.client.del(key)))
        }
        console.log(`Deleted ${keys.length} keys matching pattern: ${pattern}`)
      }
    } catch (error) {
      console.warn("Pattern deletion failed, attempting individual deletion:", error)
      // Fallback: delete commonly used keys manually
      if (pattern.includes('customers')) {
        await this.client.del('master:customers')
      }
    }
  }


  

  // Master Data Caching with FIXED serialization
  static async cacheCustomers(customers: any[]): Promise<void> {
    console.log("Caching customers:", customers.length, "items")
    const serializedData = serialize(customers)
    console.log("Serialized data preview:", serializedData.substring(0, 200))
    await this.client.setex("master:customers", 1800, serializedData) // 30 minutes cache
  }

  static async getCachedCustomers(): Promise<any[] | null> {
    console.log("Fetching cached customers...")
    const data = await this.client.get<string>("master:customers")
    
    if (!data) {
      console.log("No cache data found for master:customers")
      return null
    }
    
    console.log("Raw cache data type:", typeof data, "Preview:", 
      typeof data === 'string' ? data.substring(0, 100) : JSON.stringify(data).substring(0, 100))
    
    const result = deserialize<any[]>(data)
    console.log("Deserialized result:", result ? `Array with ${result.length} items` : "null")
    
    return result
  }

  static async cacheVendors(vendors: any[]): Promise<void> {
    const serializedData = serialize(vendors)
    await this.client.setex("master:vendors", 1800, serializedData)
  }

  static async getCachedVendors(): Promise<any[] | null> {
    const data = await this.client.get<string>("master:vendors")
    return deserialize<any[]>(data)
  }

  static async cacheProducts(products: any[]): Promise<void> {
    const serializedData = serialize(products)
    await this.client.setex("master:products", 1800, serializedData)
  }

  static async getCachedProducts(): Promise<any[] | null> {
    const data = await this.client.get<string>("master:products")
    return deserialize<any[]>(data)
  }

  static async cacheHSNRates(hsnRates: any[]): Promise<void> {
    const serializedData = serialize(hsnRates)
    await this.client.setex("master:hsn_rates", 3600, serializedData) // 1 hour cache
  }

  static async getCachedHSNRates(): Promise<any[] | null> {
    const data = await this.client.get<string>("master:hsn_rates")
    return deserialize<any[]>(data)
  }

  // FIXED cache invalidation methods
  static async invalidateVendorCache(): Promise<void> {
    console.log("Invalidating vendor cache...")
    try {
      await this.client.del("master:vendors")
      await this.scanAndDelete("search:vendors:*")
      console.log("Vendor cache invalidated successfully")
    } catch (error) {
      console.error("Error invalidating vendor cache:", error)
    }
  }

  static async invalidateProductCache(): Promise<void> {
    console.log("Invalidating product cache...")
    try {
      await this.client.del("master:products")
      await this.scanAndDelete("search:products:*")
      console.log("Product cache invalidated successfully")
    } catch (error) {
      console.error("Error invalidating product cache:", error)
    }
  }

 static async invalidateCustomerCache(): Promise<void> {
    console.log("🔄 Starting customer cache invalidation...")
    
    try {
      // 1. Delete the main cache key
      const mainResult = await this.client.del("master:customers")
      console.log(`✅ Deleted master:customers - result: ${mainResult}`)

      // 2. Clear all customer search results
      try {
        const searchKeys = await this.client.keys("search:customers:*")
        console.log(`🔍 Found ${searchKeys?.length || 0} search keys to delete`)
        
        if (searchKeys && searchKeys.length > 0) {
          for (const key of searchKeys) {
            await this.client.del(key)
            console.log(`✅ Deleted search key: ${key}`)
          }
        }
      } catch (searchError) {
        console.warn("⚠️ Search key deletion failed:", searchError)
      }

      // 3. Clear any base64 encoded search keys
      try {
        const allKeys = await this.client.keys("search:*")
        if (allKeys && allKeys.length > 0) {
          for (const key of allKeys) {
            if (key.includes("customers") || key.startsWith("search:")) {
              await this.client.del(key)
              console.log(`✅ Deleted generic search key: ${key}`)
            }
          }
        }
      } catch (genericError) {
        console.warn("⚠️ Generic search key deletion failed:", genericError)
      }

      // 4. Force verify cache is cleared
      const verification = await this.client.get<string>("master:customers")
      if (verification) {
        console.error("❌ Cache still exists after deletion, forcing manual clear")
        await this.client.del("master:customers")
      } else {
        console.log("✅ Cache successfully cleared and verified")
      }

      console.log("🎉 Customer cache invalidation completed")
      
    } catch (error) {
      console.error("❌ Error invalidating customer cache:", error)
      // Try manual deletion as fallback
      try {
        await this.client.del("master:customers")
        console.log("✅ Fallback deletion successful")
      } catch (fallbackError) {
        console.error("❌ Fallback deletion also failed:", fallbackError)
      }
    }
  }
   static async nukeCustomerCache(): Promise<void> {
    console.log("💥 NUKING all customer-related cache...")
    
    const keysToNuke = [
      "master:customers",
      "customers:search:*",
      "search:customers:*",
      "search:*"
    ]
    
    for (const pattern of keysToNuke) {
      try {
        if (pattern.includes("*")) {
          const keys = await this.client.keys(pattern)
          if (keys && keys.length > 0) {
            for (const key of keys) {
              await this.client.del(key)
              console.log(`💥 Nuked: ${key}`)
            }
          }
        } else {
          await this.client.del(pattern)
          console.log(`💥 Nuked: ${pattern}`)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to nuke pattern ${pattern}:`, error)
      }
    }
    
    console.log("🎉 Customer cache completely nuked!")
  }

  static async forceRefreshCustomerCache(): Promise<any[]> {
    console.log("🔄 Force refreshing customer cache...")
    
    // 1. Clear cache first
    await this.invalidateCustomerCache()
    
    // 2. Wait a moment to ensure deletion is processed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 3. Verify cache is actually empty
    const cacheCheck = await this.client.get<string>("master:customers")
    if (cacheCheck) {
      console.error("❌ Cache still exists, attempting force delete")
      await this.client.del("master:customers")
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log("✅ Cache confirmed empty, ready for fresh data")
    return []
  }



  static async checkRateLimit(apiKey: string, maxRequests = 100, windowSeconds = 3600): Promise<boolean> {
    const key = `rate_limit:${apiKey}`

    try {
      const current = await this.client.incr(key)

      if (current === 1) {
        await this.client.expire(key, windowSeconds)
      }

      return current <= maxRequests
    } catch (error) {
      console.error("Rate limit check failed:", error)
      return true // Allow on error
    }
  }

  static async cacheDashboardMetrics(metrics: any): Promise<void> {
    const serializedData = serialize(metrics)
    await this.client.setex("dashboard:metrics", 300, serializedData) // 5 minutes cache
  }

  static async getCachedDashboardMetrics(): Promise<any | null> {
    const data = await this.client.get<string>("dashboard:metrics")
    return deserialize(data)
  }

  static async cacheSearchResults(query: string, results: any[], expirySeconds = 600): Promise<void> {
    const key = `search:${Buffer.from(query).toString("base64")}`
    const serializedData = serialize(results)
    await this.client.setex(key, expirySeconds, serializedData)
  }

  static async getCachedSearchResults(query: string): Promise<any[] | null> {
    const key = `search:${Buffer.from(query).toString("base64")}`
    const data = await this.client.get<string>(key)
    return deserialize<any[]>(data)
  }

  static async ping(): Promise<string> {
    return await this.client.ping()
  }

  static async flushAll(): Promise<void> {
    console.log("Flushing all Redis cache...")
    await this.client.flushall()
    console.log("All cache flushed successfully")
  }

  // Batch operations for better performance
  static async mget(keys: string[]): Promise<(any | null)[]> {
    if (keys.length === 0) return []
    const results = await this.client.mget<string[]>(...keys)
    return results.map(data => deserialize(data))
  }

  static async mset(keyValuePairs: Record<string, any>): Promise<void> {
    const entries = Object.entries(keyValuePairs)
    if (entries.length === 0) return
    
    const serializedPairs: Record<string, string> = {}
    for (const [key, value] of entries) {
      serializedPairs[key] = serialize(value)
    }
    
    const args: string[] = []
    for (const [key, value] of Object.entries(serializedPairs)) {
      args.push(key, value)
    }
    
    await (this.client.mset as any).apply(this.client, args)
  }

  // Utility method to clear corrupted cache
  static async clearCorruptedCache(keys: string[]): Promise<void> {
    console.log("Clearing corrupted cache keys:", keys)
    for (const key of keys) {
      try {
        await this.client.del(key)
        console.log(`Cleared corrupted key: ${key}`)
      } catch (error) {
        console.error(`Failed to clear key ${key}:`, error)
      }
    }
  }

  // Health check method
  static async healthCheck(): Promise<{ status: string; error?: string }> {
    try {
      const result = await this.ping()
      return { status: 'healthy', error: undefined }
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}