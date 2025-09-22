import { type NextRequest, NextResponse } from "next/server"
import { executeUpdate } from "@/lib/database"


export async function POST(request: NextRequest) {
  try {
    const { alert_ids } = await request.json()

    if (!alert_ids || !Array.isArray(alert_ids)) {
      return NextResponse.json({ success: false, error: "Invalid alert IDs" }, { status: 400 })
    }

    const placeholders = alert_ids.map(() => "?").join(",")
    await executeUpdate(`
      UPDATE stock_alerts 
      SET is_read = 1 
      WHERE alert_id IN (${placeholders})
    `, alert_ids)

    return NextResponse.json({
      success: true,
      message: "Alerts marked as read"
    })
  } catch (error) {
    console.error("Mark alerts read error:", error)
    return NextResponse.json({ success: false, error: "Failed to mark alerts as read" }, { status: 500 })
  }
}