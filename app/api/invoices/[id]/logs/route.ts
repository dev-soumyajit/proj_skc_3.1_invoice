import { type NextRequest, NextResponse } from "next/server"
import { GSTService } from "@/lib/gst-service"

export async function GET(
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
    const logs = await gstService.getInvoiceLogs(invoiceId)

    return NextResponse.json({ logs })

  } catch (error) {
    console.error("Get invoice logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}