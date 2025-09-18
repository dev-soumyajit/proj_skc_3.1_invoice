"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

interface PurchaseItem {
	product_id: number
	product_name: string
	unit_name: string
	hsn_sac_code: string
	quantity: number
}

interface PurchaseDetail {
	purchase_id: number
	invoice_no: string
	invoice_date: string
	invoice_amount: number
	taxable_amt: number
	cgst_amt: number
	sgst_amt: number
	igst_amt: number
	vendor_name: string
	vendor_person_name: string
	vendor_contact_no: string
	vendor_address?: string
	vendor_gst?: string
	godown_name: string
	godown_address?: string
	entry_date?: string | null
	items: PurchaseItem[]
}

const getStatusColor = (status: string) => {
	switch (status) {
		case "received":
			return "bg-green-100 text-green-800"
		case "pending":
			return "bg-yellow-100 text-yellow-800"
		default:
			return "bg-slate-100 text-slate-800"
	}
}

export default function PurchaseDetailPage() {
	const router = useRouter()
	const params = useParams<{ id: string }>()
	const [loading, setLoading] = useState(true)
	const [purchase, setPurchase] = useState<PurchaseDetail | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const id = params?.id
		if (!id) return

		const fetchPurchase = async () => {
			setLoading(true)
			try {
				const res = await fetch(`/api/purchases/${id}`)
				const data = await res.json()
				if (!res.ok || !data.success) {
					throw new Error(data.error || "Failed to load purchase")
				}
				setPurchase(data.data)
				setError(null)
			} catch (e: any) {
				setError(e.message || "Failed to load purchase")
			} finally {
				setLoading(false)
			}
		}

		fetchPurchase()
	}, [params?.id])

	const status = purchase?.entry_date ? "received" : "pending"

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<Button variant="ghost" onClick={() => router.back()}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</Button>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">Purchase Details</h1>
							<p className="text-slate-600">View purchase information and line items</p>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<Button variant="outline">
							<FileText className="mr-2 h-4 w-4" />
							View Invoice
						</Button>
					</div>
				</div>

				{loading && (
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-center h-32">
								<div className="text-slate-500">Loading purchase...</div>
							</div>
						</CardContent>
					</Card>
				)}

				{error && (
					<Card>
						<CardContent className="p-6">
							<div className="text-red-600">{error}</div>
						</CardContent>
					</Card>
				)}

				{!loading && purchase && (
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									<div>
										<div className="text-sm text-slate-500">Invoice No.</div>
										<div className="text-2xl font-semibold text-slate-900">{purchase.invoice_no}</div>
									</div>
									<Badge variant="secondary" className={getStatusColor(status)}>{status}</Badge>
								</CardTitle>
								<CardDescription>
									Date: {new Date(purchase.invoice_date).toLocaleDateString()}
								</CardDescription>
							</CardHeader>
							<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<div className="text-sm text-slate-500">Vendor</div>
									<div className="font-medium text-slate-900">{purchase.vendor_name}</div>
									<div className="text-sm text-slate-600">{purchase.vendor_person_name} • {purchase.vendor_contact_no}</div>
									{purchase.vendor_gst && (
										<div className="text-sm text-slate-600">GST: {purchase.vendor_gst}</div>
									)}
									{purchase.vendor_address && (
										<div className="text-sm text-slate-600">{purchase.vendor_address}</div>
									)}
								</div>
								<div className="space-y-2">
									<div className="text-sm text-slate-500">Warehouse</div>
									<div className="font-medium text-slate-900">{purchase.godown_name}</div>
									{purchase.godown_address && (
										<div className="text-sm text-slate-600">{purchase.godown_address}</div>
									)}
									<div className="text-sm text-slate-600">Total: ₹{purchase.invoice_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
									<div className="text-sm text-slate-600">Taxable: ₹{purchase.taxable_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
									<div className="text-sm text-slate-600">CGST: ₹{purchase.cgst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })} • SGST: ₹{purchase.sgst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })} • IGST: ₹{purchase.igst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Items</CardTitle>
								<CardDescription>Products included in this purchase</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Product</TableHead>
												<TableHead>HSN/SAC</TableHead>
												<TableHead>Quantity</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{purchase.items.map((item) => (
												<TableRow key={item.product_id}>
													<TableCell>
														<div>
															<div className="font-medium">{item.product_name}</div>
															<div className="text-sm text-slate-500">{item.unit_name}</div>
														</div>
													</TableCell>
													<TableCell>{item.hsn_sac_code}</TableCell>
													<TableCell className="font-mono">{item.quantity.toLocaleString()}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</DashboardLayout>
	)
}
