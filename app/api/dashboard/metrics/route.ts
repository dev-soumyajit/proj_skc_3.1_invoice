import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    let metrics = await RedisService.getCachedDashboardMetrics()

    if (!metrics) {
      metrics = {
        totalRevenue: 2450000,
        totalInvoices: 156,
        pendingPayments: 340000,
        totalCustomers: 45,
        monthlyGrowth: 12.5,
        gstCollected: 441000,
        topProducts: [
          { name: "Steel Rods - 12mm", revenue: 450000 },
          { name: "Chemical Compound X", revenue: 320000 },
          { name: "Electronic Components", revenue: 280000 },
        ],
        recentTransactions: [
          { id: 1, customer: "ABC Technologies", amount: 125000, date: "2024-03-15" },
          { id: 2, customer: "XYZ Exports", amount: 89000, date: "2024-03-14" },
        ],
        stockAlerts: [
          { product: "Steel Rods - 12mm", currentStock: 45, minStock: 50 },
          { product: "Chemical Compound X", currentStock: 12, minStock: 20 },
        ],
        lastUpdated: new Date().toISOString(),
      }

      await RedisService.cacheDashboardMetrics(metrics)
    }

    return NextResponse.json({ metrics, cached: metrics !== null })
  } catch (error) {
    console.error("Dashboard metrics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
