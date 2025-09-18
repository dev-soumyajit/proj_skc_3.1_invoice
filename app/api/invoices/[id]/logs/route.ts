import { type NextRequest, NextResponse } from "next/server"
import { eInvoiceService } from "@/lib/complete-einvoice-service"

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const invoiceId = parseInt(params.id)
		if (isNaN(invoiceId)) {
			return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
		}

		const logs = await eInvoiceService.getInvoiceLogs(invoiceId)
		return NextResponse.json({ logs })
	} catch (error) {
		console.error("Get invoice logs error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}