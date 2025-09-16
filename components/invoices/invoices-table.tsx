"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, MoreHorizontal, Edit, Trash2, Eye, FileText, Download, Send } from "lucide-react"

interface Invoice {
  invoice_id: number
  invoice_no: string
  invoice_date: string
  customer_company_name: string
  buyer_gstin: string
  supply_type: string
  grand_total_qty: number
  grand_total_taxable_amt: number
  grand_total_cgst_amt: number
  grand_total_sgst_amt: number
  grand_total_amt: number
  status: string
  irn: string | null
  ack_no: string | null
  created_at: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-800"
    case "generated":
      return "bg-blue-100 text-blue-800"
    case "submitted":
      return "bg-green-100 text-green-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

const getSupplyTypeColor = (type: string) => {
  switch (type) {
    case "B2B":
      return "bg-blue-100 text-blue-800"
    case "Export":
      return "bg-purple-100 text-purple-800"
    case "SEZWP":
      return "bg-green-100 text-green-800"
    case "SEZWOP":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function InvoicesTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [cancelReason, setCancelReason] = useState("")

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/invoices')
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }
      const data = await response.json()
      setInvoices(data.invoices || [])
      setFilteredInvoices(data.invoices || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = invoices.filter(
      (invoice) =>
        invoice.invoice_no.toLowerCase().includes(value.toLowerCase()) ||
        invoice.customer_company_name.toLowerCase().includes(value.toLowerCase()) ||
        invoice.buyer_gstin.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredInvoices(filtered)
  }

  const handleViewInvoice = (invoice: Invoice) => {
    // Implement view logic, e.g., open a modal or navigate to detail page
    console.log("View invoice:", invoice.invoice_id)
    alert("View invoice functionality to be implemented")
  }

  const handleDownloadPDF = (invoice: Invoice) => {
    // Implement PDF download logic
    console.log("Download PDF for invoice:", invoice.invoice_id)
    alert("PDF download functionality to be implemented")
  }

  const handleEditInvoice = (invoice: Invoice) => {
    // Implement edit logic
    console.log("Edit invoice:", invoice.invoice_id)
    alert("Edit invoice functionality to be implemented")
  }

  const handleSubmitToGST = async (invoice: Invoice) => {
    // Implement submit to GST logic
    console.log("Submit to GST:", invoice.invoice_id)
    alert("Submit to GST functionality to be implemented")
  }

  const handleViewGSTLogs = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setLogsDialogOpen(true)
    // Fetch logs
    try {
      const response = await fetch(`/api/invoices/${invoice.invoice_id}/logs`)
      if (!response.ok) {
        throw new Error('Failed to fetch logs')
      }
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (err) {
      console.error("Failed to fetch logs:", err)
      setLogs([])
    }
  }

  const handleCancelInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setCancelDialogOpen(true)
  }

  const confirmCancel = async () => {
    if (!selectedInvoice || !cancelReason) return

    try {
      const response = await fetch(`/api/invoices/${selectedInvoice.invoice_id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      })
      if (!response.ok) {
        throw new Error('Failed to cancel invoice')
      }
      fetchInvoices()
      setCancelDialogOpen(false)
      setCancelReason("")
    } catch (err) {
      console.error("Failed to cancel invoice:", err)
      alert("Failed to cancel invoice")
    }
  }

  if (loading) {
    return <div>Loading invoices...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Invoices</CardTitle>
        <CardDescription>Manage GST compliant invoices and e-invoice submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Details</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Supply Type</TableHead>
                <TableHead>Taxable Amount</TableHead>
                <TableHead>GST Amount</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.invoice_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-slate-900">{invoice.invoice_no}</div>
                      <div className="text-sm text-slate-500">{invoice.invoice_date}</div>
                      {invoice.irn && (
                        <div className="text-xs text-green-600 mt-1">IRN: {invoice.irn.substring(0, 20)}...</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">{invoice.customer_company_name}</div>
                      <div className="text-sm text-slate-500 font-mono">{invoice.buyer_gstin}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getSupplyTypeColor(invoice.supply_type)}>
                      {invoice.supply_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    ₹{invoice.grand_total_taxable_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-mono">
                    <div className="text-sm">
                      {invoice.grand_total_cgst_amt > 0 && (
                        <>
                          <div>
                            CGST: ₹{invoice.grand_total_cgst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div>
                            SGST: ₹{invoice.grand_total_sgst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                        </>
                      )}
                      {invoice.grand_total_cgst_amt === 0 && <div className="text-slate-500">Export/Zero-rated</div>}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    ₹{invoice.grand_total_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        {invoice.status === "draft" && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSubmitToGST(invoice)}>
                              <Send className="mr-2 h-4 w-4" />
                              Submit to GST
                            </DropdownMenuItem>
                          </>
                        )}
                        {invoice.status === "generated" && (
                          <DropdownMenuItem onClick={() => handleSubmitToGST(invoice)}>
                            <Send className="mr-2 h-4 w-4" />
                            Submit to GST
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleViewGSTLogs(invoice)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View GST Logs
                        </DropdownMenuItem>
                        {invoice.status !== "cancelled" && (
                          <DropdownMenuItem className="text-red-600" onClick={() => handleCancelInvoice(invoice)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel Invoice
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500">No invoices found matching your search.</p>
          </div>
        )}

        {/* Logs Dialog */}
        <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>GST Logs for Invoice {selectedInvoice?.invoice_no}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index} className="border p-4 rounded">
                  <p>Type: {log.transaction_type}</p>
                  <p>Status: {log.status}</p>
                  <p>Date: {log.created_at}</p>
                  {log.error_message && <p>Error: {log.error_message}</p>}
                </div>
              ))}
              {logs.length === 0 && <p>No logs found</p>}
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Invoice {selectedInvoice?.invoice_no}</AlertDialogTitle>
              <AlertDialogDescription>
                Enter the reason for cancellation. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              placeholder="Cancellation reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancel}>Confirm Cancellation</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}