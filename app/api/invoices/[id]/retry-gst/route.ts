import { type NextRequest, NextResponse } from "next/server"
import { CompleteEInvoiceService } from "@/lib/gst-service"

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

    const gstService = CompleteEInvoiceService.getInstance()
    const result = await gstService.retryFailedInvoice(invoiceId)

    if (result.Status === 1) {
      return NextResponse.json({
        success: true,
        message: "Invoice retry successful",
        data: {
          irn: result.Data?.Irn,
          ackNo: result.Data?.AckNo,
          ackDate: result.Data?.AckDt
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Invoice retry failed",
        errors: result.ErrorDetails
      }, { status: 400 })
    }

  } catch (error) {
    console.error("GST retry error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error during retry",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}