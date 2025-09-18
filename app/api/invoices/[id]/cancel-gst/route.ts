// app/api/invoices/[id]/cancel-gst/route.ts
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

    const { reason, remarks } = await request.json()

    if (!reason) {
      return NextResponse.json({ error: "Cancellation reason is required" }, { status: 400 })
    }

    const gstService = CompleteEInvoiceService.getInstance()
    const result = await gstService.cancelInvoice(invoiceId, reason, remarks)

    if (result.Status === 1) {
      return NextResponse.json({
        success: true,
        message: "Invoice cancelled successfully",
        data: {
          cancelDate: result.Data?.CancelDate
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Invoice cancellation failed",
        errors: result.ErrorDetails
      }, { status: 400 })
    }

  } catch (error) {
    console.error("GST cancellation error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error during invoice cancellation",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}