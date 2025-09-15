import { type NextRequest, NextResponse } from "next/server"
import { GSTService } from "@/lib/gst-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const status = searchParams.get("status")
    const transactionType = searchParams.get("transaction_type")

    let whereConditions = ["el.log_id IS NOT NULL"]
    let params: any[] = []

    if (status) {
      whereConditions.push("el.status = ?")
      params.push(status)
    }

    if (transactionType) {
      whereConditions.push("el.transaction_type = ?")
      params.push(transactionType)
    }

    const gstService = GSTService.getInstance()
    const logs = await gstService.getInvoiceLogs()

    // Filter based on query params
    let filteredLogs = logs
    if (status) {
      filteredLogs = filteredLogs.filter((log: any) => log.status === status)
    }
    if (transactionType) {
      filteredLogs = filteredLogs.filter((log: any) => log.transaction_type === transactionType)
    }

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit)

    return NextResponse.json({
      logs: paginatedLogs,
      total: filteredLogs.length,
      limit,
      offset
    })

  } catch (error) {
    console.error("Get GST logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}