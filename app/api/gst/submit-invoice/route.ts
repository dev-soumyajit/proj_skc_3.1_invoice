import { type NextRequest, NextResponse } from "next/server"
import { eInvoiceService } from "@/lib/gst-service"

export async function POST(request: NextRequest) {
	try {
		const { invoiceId } = await request.json()
		const parsed = parseInt(invoiceId)
		if (!invoiceId || isNaN(parsed)) {
			return NextResponse.json({ success: false, message: "invoiceId is required" }, { status: 400 })
		}

		const response = await eInvoiceService.submitInvoiceToGST(parsed)
		return NextResponse.json(response, { status: response.Status === 1 ? 200 : 400 })
	} catch (error) {
		console.error("GST submit error:", error)
		return NextResponse.json({ success: false, message: "Failed to submit invoice", error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
	}
}
