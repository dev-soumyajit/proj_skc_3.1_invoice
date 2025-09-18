import { type NextRequest, NextResponse } from "next/server"
import { eInvoiceService } from "@/lib/gst-service"

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const limit = parseInt(searchParams.get("limit") || "50")
		const offset = parseInt(searchParams.get("offset") || "0")
		const status = searchParams.get("status") || undefined
		const transactionType = searchParams.get("transaction_type") || undefined
		const invoiceIdParam = searchParams.get("invoice_id")
		const invoiceId = invoiceIdParam ? parseInt(invoiceIdParam) : undefined

		let logs: any[] = []

		if (invoiceId && !isNaN(invoiceId)) {
			logs = await eInvoiceService.getInvoiceLogs(invoiceId)
		} else {
			// If no invoice id provided, fetch recent logs by joining all invoices
			// For now, return empty to avoid heavy queries; can be extended to support global logs table
			logs = []
		}

		let filteredLogs = logs
		if (status) {
			filteredLogs = filteredLogs.filter((log: any) => log.status === status)
		}
		if (transactionType) {
			filteredLogs = filteredLogs.filter((log: any) => log.transaction_type === transactionType)
		}

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