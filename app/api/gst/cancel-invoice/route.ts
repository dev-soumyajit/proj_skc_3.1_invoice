import { type NextRequest, NextResponse } from "next/server"
import { eInvoiceService } from "@/lib/gst-service"

export async function POST(request: NextRequest) {
	try {
		const { invoiceId, reason, remarks } = await request.json()
		const parsed = parseInt(invoiceId)
		if (!invoiceId || isNaN(parsed) || !reason) {
			return NextResponse.json({ success: false, message: "invoiceId and reason are required" }, { status: 400 })
		}

		const response = await eInvoiceService.cancelInvoice(parsed, reason, remarks)
		return NextResponse.json(response, { status: response.Status === 1 ? 200 : 400 })
	} catch (error) {
		console.error("GST cancel error:", error)
		return NextResponse.json({ success: false, message: "Failed to cancel invoice", error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
	}
}
