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

// Redis service functions for common operations using Upstash
export class RedisService {
  private static client = getRedisClient()

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
    await this.client.setex(key, expiryHours * 3600, JSON.stringify(userData))
  }

  static async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`
    const data = await this.client.get<string>(key)
    return data ? JSON.parse(data) : null
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
      const pattern = `stock:${productId}:*`
      try {
        const keys = await this.client.keys(pattern)
        if (keys && keys.length > 0) {
          for (const key of keys) {
            await this.client.del(key)
          }
        }
      } catch (error) {
        console.warn("Pattern deletion not supported in Upstash REST API:", error)
      }
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

  // General Cache Operations
  static async cache(key: string, value: any, expirySeconds = 300): Promise<void> {
    await this.client.setex(key, expirySeconds, JSON.stringify(value))
  }

  static async getCached(key: string): Promise<any | null> {
    const data = await this.client.get<string>(key)
    return data ? JSON.parse(data) : null
  }

  static async getRawCache(key: string): Promise<string | null> {
    return await this.client.get<string>(key)
  }

  static async invalidateCache(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern)
      if (keys && keys.length > 0) {
        for (const key of keys) {
          await this.client.del(key)
        }
      }
    } catch (error) {
      console.warn("Pattern deletion not fully supported in Upstash REST API:", error)
    }
  }

  // Master Data Caching
  static async cacheCustomers(customers: any[]): Promise<void> {
    await this.client.setex("master:customers", 1800, JSON.stringify(customers)) // 30 minutes cache
  }

  static async getCachedCustomers(): Promise<any[] | null> {
    const data = await this.client.get<string>("master:customers")
    if (!data) {
      console.log("No cache data found for master:customers")
      return null
    }
    try {
      return JSON.parse(data) as any[]
    } catch (error) {
      console.error("Failed to parse cached customers data:", error, "Raw data:", data)
      return null
    }
  }

  static async cacheVendors(vendors: any[]): Promise<void> {
    await this.client.setex("master:vendors", 1800, JSON.stringify(vendors))
  }

  static async getCachedVendors(): Promise<any[] | null> {
    const data = await this.client.get<string>("master:vendors")
    if (!data) return null
    try {
      return JSON.parse(data) as any[]
    } catch (error) {
      console.error("Failed to parse cached vendors data:", error)
      return null
    }
  }

  static async cacheProducts(products: any[]): Promise<void> {
    await this.client.setex("master:products", 1800, JSON.stringify(products))
  }

  static async getCachedProducts(): Promise<any[] | null> {
    const data = await this.client.get<string>("master:products")
    if (!data) return null
    try {
      return JSON.parse(data) as any[]
    } catch (error) {
      console.error("Failed to parse cached products data:", error)
      return null
    }
  }

  static async cacheHSNRates(hsnRates: any[]): Promise<void> {
    await this.client.setex("master:hsn_rates", 3600, JSON.stringify(hsnRates)) // 1 hour cache
  }

  static async getCachedHSNRates(): Promise<any[] | null> {
    const data = await this.client.get<string>("master:hsn_rates")
    if (!data) return null
    try {
      return JSON.parse(data) as any[]
    } catch (error) {
      console.error("Failed to parse cached HSN rates data:", error)
      return null
    }
  }

  // Specific cache invalidation methods
  static async invalidateVendorCache(): Promise<void> {
    try {
      await this.client.del("master:vendors")
      const searchKeys = await this.client.keys("search:vendors:*")
      if (searchKeys && searchKeys.length > 0) {
        for (const key of searchKeys) {
          await this.client.del(key)
        }
      }
    } catch (error) {
      console.warn("Error invalidating vendor cache:", error)
    }
  }

  static async invalidateProductCache(): Promise<void> {
    try {
      await this.client.del("master:products")
      const searchKeys = await this.client.keys("search:products:*")
      if (searchKeys && searchKeys.length > 0) {
        for (const key of searchKeys) {
          await this.client.del(key)
        }
      }
    } catch (error) {
      console.warn("Error invalidating product cache:", error)
    }
  }

  static async invalidateCustomerCache(): Promise<void> {
    try {
      await this.client.del("master:customers")
      const searchKeys = await this.client.keys("search:customers:*")
      if (searchKeys && searchKeys.length > 0) {
        for (const key of searchKeys) {
          await this.client.del(key)
        }
      }
    } catch (error) {
      console.warn("Error invalidating customer cache:", error)
    }
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
    await this.client.setex("dashboard:metrics", 300, JSON.stringify(metrics)) // 5 minutes cache
  }

  static async getCachedDashboardMetrics(): Promise<any | null> {
    const data = await this.client.get<string>("dashboard:metrics")
    return data ? JSON.parse(data) : null
  }

  static async cacheSearchResults(query: string, results: any[], expirySeconds = 600): Promise<void> {
    const key = `search:${Buffer.from(query).toString("base64")}`
    await this.client.setex(key, expirySeconds, JSON.stringify(results))
  }

  static async getCachedSearchResults(query: string): Promise<any[] | null> {
    const key = `search:${Buffer.from(query).toString("base64")}`
    const data = await this.client.get<string>(key)
    if (!data) return null
    try {
      return JSON.parse(data) as any[]
    } catch (error) {
      console.error("Failed to parse cached search results:", error)
      return null
    }
  }

  static async ping(): Promise<string> {
    return await this.client.ping()
  }

  static async flushAll(): Promise<void> {
    await this.client.flushall()
  }

  // Batch operations for better performance
  static async mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return []
    return await this.client.mget<string[]>(...keys)
  }

  static async mset(keyValuePairs: Record<string, string>): Promise<void> {
    const entries = Object.entries(keyValuePairs)
    if (entries.length === 0) return
    
    const args: string[] = []
    for (const [key, value] of entries) {
      args.push(key, value)
    }
    
    await (this.client.mset as any).apply(this.client, args)
  }
}