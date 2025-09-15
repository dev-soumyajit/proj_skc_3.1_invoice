import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeInsert, executeUpdate } from "@/lib/database"
import { RedisService } from "@/lib/redis"
import { GSTService } from "@/lib/gst-service"



export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoiceId = parseInt(id)

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
    }

    const gstService = GSTService.getInstance()
    const result = await gstService.submitInvoiceToGST(invoiceId)

    if (result.Status === 1) {
      return NextResponse.json({
        success: true,
        message: "Invoice submitted to GST successfully",
        data: {
          irn: result.Data?.Irn,
          ackNo: result.Data?.AckNo,
          ackDate: result.Data?.AckDt,
          qrCodeUrl: result.Data?.QRCodeUrl
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "GST submission failed",
        errors: result.ErrorDetails
      }, { status: 400 })
    }

  } catch (error) {
    console.error("GST submission error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error during GST submission",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}