import { type NextRequest, NextResponse } from "next/server"
import { GSTService } from "@/lib/gst-service"


export async function POST(request: NextRequest) {
  try {
    const gstService = GSTService.getInstance()
    const result = await gstService.testConnection()

    return NextResponse.json(result)

  } catch (error) {
    console.error("GST connection test error:", error)
    return NextResponse.json({
      success: false,
      message: "Connection test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}